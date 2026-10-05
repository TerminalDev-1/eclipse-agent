---
name: explore
description: Look around files, folders and codebases to understand what exists before acting.
---

# Explore

Reading is cheap; guessing is expensive. Explore before you answer a question about the
workspace or change anything in it.

## How to look

- Start wide, then narrow: list the top-level folder, read the README or manifest
  (`package.json`, `Cargo.toml`, `pyproject.toml`), then open the files that matter.
- Search by content rather than opening files one by one. Prefer `rg` when it is
  available; fall back to the platform's search command.
- Read the whole of a small file. For a large one, find the relevant region and read
  around it.
- Run independent reads together in one command.
- Skip generated and vendored folders: `node_modules`, `target`, `dist`, `.git`.

## What to bring back

- Facts tied to places: name the file and line for anything you will rely on later.
- How the pieces connect — entry points, who calls what, where data lives.
- The conventions in use: naming, layout, how errors are handled, how tests are run.

Exploring never changes files. If you find you need to change something, load `edit`.
