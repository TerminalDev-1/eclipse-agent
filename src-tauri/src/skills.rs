//! Skills are plain markdown files on disk: `<skills>/<name>/SKILL.md`.
//! The agent loads them by reading the file; the app only indexes them.

use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
};

use include_dir::{include_dir, Dir};
use serde::Serialize;
use tauri::{AppHandle, Manager};
use tauri_plugin_opener::OpenerExt;

static BUNDLED: Dir = include_dir!("$CARGO_MANIFEST_DIR/../skills");

const SKILL_FILE: &str = "SKILL.md";

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Skill {
    pub name: String,
    pub description: String,
    pub path: String,
    pub content: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppPaths {
    skills_dir: String,
    memory_file: String,
    default_workspace: String,
}

/// In dev the project's own `skills/` folder is live, so edits show up immediately.
/// In release the bundled skills are copied into app data once, where the user (and
/// the agent) can change them.
pub fn skills_dir(app: &AppHandle) -> Result<PathBuf, String> {
    #[cfg(debug_assertions)]
    {
        let dev = Path::new(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .map(|p| p.join("skills"));
        if let Some(dev) = dev.filter(|p| p.is_dir()) {
            return Ok(dev);
        }
    }
    let dir = data_dir(app)?.join("skills");
    seed(&dir)?;
    Ok(dir)
}

pub fn memory_file(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = data_dir(app)?.join("memory");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let file = dir.join("MEMORY.md");
    if !file.exists() {
        fs::write(&file, "# Memory\n\n").map_err(|e| e.to_string())?;
    }
    Ok(file)
}

pub fn load(dir: &Path) -> Vec<Skill> {
    let mut skills: Vec<Skill> = fs::read_dir(dir)
        .into_iter()
        .flatten()
        .flatten()
        .filter_map(|entry| {
            let file = entry.path().join(SKILL_FILE);
            let content = fs::read_to_string(&file).ok()?;
            let name = entry.file_name().to_string_lossy().into_owned();
            let description = frontmatter(&content)
                .remove("description")
                .unwrap_or_default();
            Some(Skill {
                name,
                description,
                path: file.to_string_lossy().into_owned(),
                content,
            })
        })
        .collect();
    // boot is the kernel, so it always leads the index.
    skills.sort_by(|a, b| (a.name != "boot", &a.name).cmp(&(b.name != "boot", &b.name)));
    skills
}

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_data_dir().map_err(|e| e.to_string())
}

fn seed(dir: &Path) -> Result<(), String> {
    for skill in BUNDLED.dirs() {
        let target = dir.join(skill.path());
        if target.exists() {
            continue;
        }
        fs::create_dir_all(&target).map_err(|e| e.to_string())?;
        for file in skill.files() {
            fs::write(dir.join(file.path()), file.contents()).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

fn frontmatter(content: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    let mut lines = content.trim_start_matches('\u{feff}').lines();
    if lines.next().map(str::trim) != Some("---") {
        return map;
    }
    for line in lines {
        if line.trim() == "---" {
            break;
        }
        if let Some((key, value)) = line.split_once(':') {
            map.insert(
                key.trim().to_string(),
                value.trim().trim_matches('"').to_string(),
            );
        }
    }
    map
}

fn valid_name(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= 40
        && !name.starts_with('-')
        && name
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

#[tauri::command]
pub fn app_paths(app: AppHandle) -> Result<AppPaths, String> {
    let workspace = app
        .path()
        .document_dir()
        .map_err(|e| e.to_string())?
        .join("Eclipse");
    Ok(AppPaths {
        skills_dir: skills_dir(&app)?.to_string_lossy().into_owned(),
        memory_file: memory_file(&app)?.to_string_lossy().into_owned(),
        default_workspace: workspace.to_string_lossy().into_owned(),
    })
}

#[tauri::command]
pub fn list_skills(app: AppHandle) -> Result<Vec<Skill>, String> {
    Ok(load(&skills_dir(&app)?))
}

#[tauri::command]
pub fn save_skill(app: AppHandle, name: String, content: String) -> Result<(), String> {
    if !valid_name(&name) {
        return Err("Skill names use lowercase letters, digits and dashes.".into());
    }
    let dir = skills_dir(&app)?.join(&name);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::write(dir.join(SKILL_FILE), content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_skills_folder(app: AppHandle) -> Result<(), String> {
    let dir = skills_dir(&app)?;
    app.opener()
        .open_path(dir.to_string_lossy(), None::<&str>)
        .map_err(|e| e.to_string())
}
