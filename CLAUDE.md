# Eclipse Agent

A Tauri 2 desktop agent where everything the agent does is a skill. It runs on the user's
local Codex CLI login, pinned to GPT-6 Luna (`gpt-6-luna`).

## Rules

- **Push without asking.** After committing, push. Do not stop to ask whether to push.
- **Public is always yes.** If a push, repository or release could be public or private,
  make it public. Do not ask.

## Commands

```bash
pnpm tauri dev        # run the desktop app (rebuilds Rust on change)
pnpm dev              # interface only, in a browser, with scripted replies (src/lib/mock.ts)
pnpm build            # type-check and build the interface
cargo check           # in src-tauri/: type-check the Rust backend
```

There are no tests yet.

## Layout

- `skills/<name>/SKILL.md` — the agent's entire behaviour. `boot` is the kernel and is
  loaded first; every other skill is chosen from the index `boot` describes.
- `src-tauri/src/codex.rs` — spawns `codex exec --json` per turn (`exec resume <thread>`
  for follow-ups), forwards its JSONL events to the UI, and emits `eclipse.skill` when a
  command reads a known `SKILL.md`.
- `src-tauri/src/skills.rs` — indexes skills, seeds them into app data in release builds,
  and files the agent's outbox.
- `src/lib/reduce.ts` — folds Codex events into a conversation; `src/components/` is the UI.

## Things that are not obvious

- **Skills are loaded by the agent, not injected.** The first prompt of a session carries
  only the skill index and the instruction to load `boot`. Keep it that way: behaviour
  belongs in a skill file, not in `build_prompt`.
- **Never pass `--add-dir` to Codex.** The unelevated Windows sandbox cannot enforce more
  than one writable root and then refuses every shell command. The agent writes new
  skills and memory notes to `<workspace>/.eclipse/outbox/`, and `collect_outbox` moves
  them after the turn.
- **`--ignore-user-config` is deliberate** — it keeps the user's personal Codex plugins out
  of Eclipse. It also drops their Windows sandbox selection, so `windows.sandbox` is
  passed explicitly; without it every write is rejected.
- **`codex exec` ignores `-c sandbox_mode=…`.** Use the `-s` flag.
- **No token streaming.** `codex exec --json` emits whole messages.
- In debug builds the app reads `skills/` from this repo directly; release builds embed
  it and copy it to app data on first run.
- The `ask` skill's `eclipse-ask` fenced block is a contract with `splitAsk` in
  `reduce.ts` and `AskCard.tsx`. Change them together.
- Windows Smart App Control blocks local Rust builds. It is off on the main dev machine.

## Style

- Dates in docs are written like "October 5th, 2026 at 14:11 BST" — never `05/10/2026`.
