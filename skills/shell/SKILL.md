---
name: shell
description: Run commands, scripts, builds and tests in the workspace.
---

# Shell

## Running things

- Know what a command does before you run it. If you are unsure, read its help first.
- Use the shell the platform gives you and its syntax — PowerShell on Windows, a POSIX
  shell elsewhere. Do not assume Unix tools exist on Windows.
- Use the project's own scripts when it has them (`npm test`, `cargo test`, `make`).
- Quote paths. Paths with spaces break unquoted commands.
- Long-running servers and watchers never return. Run a one-shot build or test instead,
  or tell the user what to start themselves.

## Reading results

- Read the output, including the exit code. A command that printed an error did not
  succeed, whatever came after it.
- When something fails, read the actual message before trying again. Do not rerun the same
  command hoping for a different result.
- If the failure is a real bug rather than a typo in your command, load `debug`.

## Care

- Commands run inside a sandbox scoped to the workspace. If the sandbox blocks something,
  say so plainly rather than hunting for a way around it.
- Never run commands that delete broadly, reset version control, or change system
  settings unless the user asked for precisely that.
- Do not install global tools or change the user's environment without saying so first.
