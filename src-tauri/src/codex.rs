//! Bridge to the Codex CLI. Each turn is one `codex exec --json` process (or
//! `codex exec resume <thread>` for follow-ups) that authenticates with the user's
//! existing Codex login. Its JSONL events are forwarded to the UI untouched, plus an
//! `eclipse.skill` event whenever the agent reads a skill file.

use std::{
    collections::HashMap,
    path::{Path, PathBuf},
    process::Stdio,
    sync::Arc,
};

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, State};
use tokio::{
    io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader},
    process::{Child, Command},
    sync::{Mutex, Notify},
};

use crate::skills::{self, Skill};

const MODEL: &str = "gpt-6-luna";
const EFFORTS: [&str; 5] = ["low", "medium", "high", "xhigh", "max"];
const EVENT: &str = "agent-event";

/// Cancel handles for in-flight turns, keyed by conversation id.
#[derive(Default)]
pub struct Running(Mutex<HashMap<String, Arc<Notify>>>);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexStatus {
    found: bool,
    path: Option<String>,
    version: Option<String>,
    logged_in: bool,
    detail: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TurnArgs {
    conversation_id: String,
    thread_id: Option<String>,
    text: String,
    effort: String,
    workspace: String,
    access: String,
}

fn find_codex() -> Option<PathBuf> {
    if let Some(path) = std::env::var_os("ECLIPSE_CODEX_PATH").map(PathBuf::from) {
        if path.is_file() {
            return Some(path);
        }
    }
    let exe = if cfg!(windows) { "codex.exe" } else { "codex" };
    if let Some(paths) = std::env::var_os("PATH") {
        if let Some(found) = std::env::split_paths(&paths)
            .map(|dir| dir.join(exe))
            .find(|p| p.is_file())
        {
            return Some(found);
        }
    }
    // The Codex desktop app ships the CLI in a versioned folder that is not on PATH.
    if let Some(local) = std::env::var_os("LOCALAPPDATA") {
        let bin = Path::new(&local).join("OpenAI").join("Codex").join("bin");
        let newest = std::fs::read_dir(bin)
            .into_iter()
            .flatten()
            .flatten()
            .map(|entry| entry.path().join(exe))
            .filter(|p| p.is_file())
            .max_by_key(|p| p.metadata().and_then(|m| m.modified()).ok());
        if newest.is_some() {
            return newest;
        }
    }
    let home = std::env::var_os("USERPROFILE").or_else(|| std::env::var_os("HOME"))?;
    let fallback = Path::new(&home)
        .join(".codex")
        .join(".sandbox-bin")
        .join(exe);
    fallback.is_file().then_some(fallback)
}

fn command(codex: &Path) -> Command {
    let mut cmd = Command::new(codex);
    #[cfg(windows)]
    cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    cmd
}

#[tauri::command]
pub async fn codex_status() -> CodexStatus {
    let Some(codex) = find_codex() else {
        return CodexStatus {
            found: false,
            path: None,
            version: None,
            logged_in: false,
            detail: "Codex CLI not found. Install Codex and sign in, then restart Eclipse.".into(),
        };
    };
    let version = command(&codex)
        .arg("--version")
        .output()
        .await
        .ok()
        .map(|out| {
            String::from_utf8_lossy(&out.stdout)
                .trim()
                .trim_start_matches("codex-cli")
                .trim()
                .to_string()
        });
    let (logged_in, detail) = match command(&codex).args(["login", "status"]).output().await {
        Ok(out) => {
            let text = format!(
                "{}{}",
                String::from_utf8_lossy(&out.stdout),
                String::from_utf8_lossy(&out.stderr)
            );
            let text = text.trim().to_string();
            let lower = text.to_lowercase();
            (
                out.status.success()
                    && lower.contains("logged in")
                    && !lower.contains("not logged in"),
                text,
            )
        }
        Err(e) => (false, e.to_string()),
    };
    CodexStatus {
        found: true,
        path: Some(codex.to_string_lossy().into_owned()),
        version,
        logged_in,
        detail,
    }
}

/// The only thing the agent is told up front: skills exist, and `boot` comes first.
/// Everything else it knows, it reads from a skill.
fn build_prompt(args: &TurnArgs, skills_dir: &Path, skills: &[Skill], memory: &Path) -> String {
    let index: String = skills
        .iter()
        .map(|s| format!("- {} — {}\n", s.name, s.description))
        .collect();
    let kernel = if args.thread_id.is_none() {
        format!(
            "You are Eclipse Agent. You have no built-in behaviours: everything you do, \
             including replying, is a skill — a markdown file you load from disk before acting.\n\n\
             Skills directory: {dir}\n\
             A skill lives at: {dir}{sep}<name>{sep}SKILL.md\n\n\
             Start by loading `boot`. It explains how to choose and load every other skill.\n\n\
             Skill index:\n{index}\n\
             Workspace: {workspace} ({access})\n\
             Memory file: {memory}",
            dir = skills_dir.display(),
            sep = std::path::MAIN_SEPARATOR,
            workspace = args.workspace,
            access = args.access,
            memory = memory.display(),
        )
    } else {
        format!(
            "Skill index (load any skill you have not loaded yet this session before using it):\n{index}"
        )
    };
    format!(
        "<eclipse_kernel>\n{}\n</eclipse_kernel>\n\n<user_message>\n{}\n</user_message>\n",
        kernel.trim_end(),
        args.text
    )
}

/// Names of known skills whose SKILL.md appears in a shell command.
fn skills_in(command: &str, known: &[Skill]) -> Vec<String> {
    let lower = command.to_ascii_lowercase();
    let mut found = Vec::new();
    for (idx, _) in lower.match_indices("skill.md") {
        let before = lower[..idx].trim_end_matches(['\\', '/']);
        let name = before
            .rsplit(|c: char| !(c.is_ascii_alphanumeric() || c == '-' || c == '_'))
            .next()
            .unwrap_or_default();
        if known.iter().any(|s| s.name == name) && !found.iter().any(|f| f == name) {
            found.push(name.to_string());
        }
    }
    found
}

async fn kill_tree(child: &mut Child) {
    // Codex spawns shells of its own; on Windows killing only the parent orphans them.
    #[cfg(windows)]
    {
        if let Some(pid) = child.id() {
            let _ = Command::new("taskkill")
                .args(["/PID", &pid.to_string(), "/T", "/F"])
                .creation_flags(0x0800_0000)
                .output()
                .await;
        }
    }
    let _ = child.kill().await;
}

#[tauri::command]
pub async fn send_turn(
    app: AppHandle,
    running: State<'_, Running>,
    args: TurnArgs,
) -> Result<(), String> {
    let codex = find_codex().ok_or("Codex CLI not found. Install Codex and sign in first.")?;
    if !EFFORTS.contains(&args.effort.as_str()) {
        return Err(format!("Unknown reasoning effort: {}", args.effort));
    }
    if !matches!(args.access.as_str(), "read-only" | "workspace-write") {
        return Err(format!("Unknown access mode: {}", args.access));
    }
    if let Some(thread) = &args.thread_id {
        if thread.is_empty()
            || !thread.chars().all(|c| c.is_ascii_hexdigit() || c == '-')
            || thread.starts_with('-')
        {
            return Err("Invalid thread id.".into());
        }
    }

    let skills_dir = skills::skills_dir(&app)?;
    let skills = skills::load(&skills_dir);
    let memory = skills::memory_file(&app)?;
    let workspace = PathBuf::from(&args.workspace);
    std::fs::create_dir_all(&workspace).map_err(|e| format!("Cannot use workspace: {e}"))?;
    let prompt = build_prompt(&args, &skills_dir, &skills, &memory);

    let mut cmd = command(&codex);
    cmd.arg("exec")
        .args([
            "--json",
            "--skip-git-repo-check",
            "--ignore-user-config",
            "-m",
            MODEL,
        ])
        .arg("-c")
        .arg(format!("model_reasoning_effort=\"{}\"", args.effort));
    // --ignore-user-config keeps personal Codex plugins out of Eclipse, but it also
    // drops the Windows sandbox selection, without which every write is rejected.
    #[cfg(windows)]
    cmd.arg("-c").arg("windows.sandbox=\"unelevated\"");
    cmd.arg("-s").arg(&args.access).arg("-C").arg(&workspace);
    // The agent may author skills and keep memory, so both live in writable roots.
    cmd.arg("--add-dir").arg(&skills_dir);
    if let Some(memory_dir) = memory.parent() {
        cmd.arg("--add-dir").arg(memory_dir);
    }
    if let Some(thread) = &args.thread_id {
        cmd.arg("resume").arg(thread);
    }
    cmd.arg("-")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start Codex: {e}"))?;
    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(prompt.as_bytes())
            .await
            .map_err(|e| e.to_string())?;
    }
    let stdout = child
        .stdout
        .take()
        .ok_or("Codex produced no output stream.")?;
    let mut stderr = child
        .stderr
        .take()
        .ok_or("Codex produced no error stream.")?;
    let stderr_task = tokio::spawn(async move {
        let mut buf = String::new();
        let _ = stderr.read_to_string(&mut buf).await;
        buf
    });

    let cancel = Arc::new(Notify::new());
    running
        .0
        .lock()
        .await
        .insert(args.conversation_id.clone(), cancel.clone());

    let emit = |event: Value| {
        let _ = app.emit(
            EVENT,
            json!({ "conversationId": args.conversation_id, "event": event }),
        );
    };

    let mut lines = BufReader::new(stdout).lines();
    let mut cancelled = false;
    loop {
        tokio::select! {
            line = lines.next_line() => {
                let Ok(Some(line)) = line else { break };
                let Ok(event) = serde_json::from_str::<Value>(&line) else { continue };
                let item = &event["item"];
                if item["type"] == "command_execution" {
                    for name in skills_in(item["command"].as_str().unwrap_or_default(), &skills) {
                        emit(json!({ "type": "eclipse.skill", "name": name, "itemId": item["id"] }));
                    }
                }
                emit(event);
            }
            _ = cancel.notified() => {
                cancelled = true;
                kill_tree(&mut child).await;
                break;
            }
        }
    }

    let status = child.wait().await.ok();
    running.0.lock().await.remove(&args.conversation_id);
    let stderr = stderr_task.await.unwrap_or_default();
    let failed = !cancelled && !status.is_some_and(|s| s.success());
    let error = failed.then(|| {
        let tail: Vec<&str> = stderr.lines().rev().take(6).collect();
        tail.into_iter().rev().collect::<Vec<_>>().join("\n")
    });
    emit(json!({ "type": "eclipse.done", "cancelled": cancelled, "error": error }));
    Ok(())
}

#[tauri::command]
pub async fn cancel_turn(
    running: State<'_, Running>,
    conversation_id: String,
) -> Result<(), String> {
    if let Some(cancel) = running.0.lock().await.get(&conversation_id) {
        cancel.notify_one();
    }
    Ok(())
}
