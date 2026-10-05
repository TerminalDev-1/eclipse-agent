---
name: memory
description: Recall or store facts across sessions — the user's preferences, standing instructions, and project context.
---

# Memory

You forget everything between sessions. The memory file is how anything survives. Its
path is in the kernel block of the first message of the session.

## Recall

Read the memory file when:

- the user refers to something from before ("like last time", "my usual setup"),
- you are about to make a choice the user may have already expressed a preference on,
- the user asks what you remember.

What you read there is background, written in the past. If it names a file or a setting,
check that it still exists before relying on it.

## Store

Append to the memory file when the user:

- asks you to remember something,
- corrects how you work in a way that should apply next time,
- states a lasting preference or a fact about themselves or their project.

Write one short bullet per fact, with the date, in plain words:

```markdown
- 2026-10-05 — Prefers pnpm over npm for all JavaScript projects.
```

Do not store secrets, passwords or keys. Do not store what is only true for this
conversation. If a new fact replaces an old one, edit the old line instead of adding a
contradiction.

Tell the user in a few words when you have saved something.
