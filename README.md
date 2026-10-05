# Eclipse Agent

A desktop agent where **everything is a skill**. Eclipse starts each session knowing only
how to load skills — markdown files on disk. To reply it loads `chat`; to ask you a
question it loads `ask`; to change a file it loads `edit`. The interface shows every
skill as it is loaded.

First commit: 05/10/2026, 14:11 BST

## How it works

- **Engine.** Each turn runs the Codex CLI you already have installed and signed in to
  (`codex exec --json`, then `codex exec resume` for follow-ups), pinned to
  **GPT-6 Luna** (`gpt-6-luna`). Eclipse never reads or stores your credentials.
- **Skills.** One folder per skill: `skills/<name>/SKILL.md`. The agent is given only an
  index of names and descriptions and told to load `boot` first; `boot` explains how to
  pick the rest. A skill load is a real file read, which the app detects and shows as a
  chip.
- **Your Codex setup stays separate.** Eclipse runs Codex with `--ignore-user-config`, so
  your personal Codex plugins and settings are not loaded.

## Skills

| Skill          | Used for                                               |
| -------------- | ------------------------------------------------------ |
| `boot`         | The kernel: how to choose and load every other skill   |
| `chat`         | Writing any message to you                             |
| `ask`          | Asking you questions, shown as an interactive card     |
| `plan`         | Breaking a large request into steps                    |
| `explore`      | Reading files and codebases                            |
| `edit`         | Creating or changing files                             |
| `shell`        | Running commands, builds and tests                     |
| `debug`        | Finding the root cause of a failure                    |
| `review`       | Critiquing code or a document                          |
| `explain`      | Teaching a concept or how something works              |
| `memory`       | Remembering things across sessions                     |
| `report`       | Wrapping up finished work                              |
| `skill-author` | Writing new skills                                     |

Edit any of them, or add your own, from the **Skills** view in the app. The agent can
also write skills itself.

## Requirements

- The Codex CLI, signed in (`codex login`)
- Node.js and pnpm
- Rust and the [Tauri 2 prerequisites](https://tauri.app/start/prerequisites/)

On Windows, Smart App Control blocks the unsigned files a local Rust build produces, so
the app cannot be built while it is enforcing.

## Run

```bash
pnpm install
pnpm tauri dev
```

Build an installer with `pnpm tauri build`.

`pnpm dev` on its own opens the interface in a browser with scripted replies
(`src/lib/mock.ts`), which is handy for working on the design without the desktop shell.

## Layout

```
skills/         the skill files — the agent's entire behaviour
src/            the interface (React + TypeScript)
src-tauri/      the desktop shell and the Codex bridge (Rust)
```
