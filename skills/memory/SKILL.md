---
name: memory
description: Recall or store facts across sessions — the user's preferences, standing instructions, and project context.
---

# Memory

You forget everything between sessions. The memory file is how anything survives. Its
path, and the path of the outbox, are in the kernel block of the first message of the
session.

## Recall

Read the memory file when:

- the user refers to something from before ("like last time", "my usual setup"),
- you are about to make a choice the user may have already expressed a preference on,
- the user asks what you remember.

What you read there is background, written in the past. If it names a file or a setting,
check that it still exists before relying on it.

## Store

Store something when the user:

- asks you to remember it,
- corrects how you work in a way that should apply next time,
- states a lasting preference or a fact about themselves or their project.

You cannot write to the memory file directly — it is outside the workspace. Instead,
write the new notes to `memory.md` in the outbox folder. Create the folder first if it
does not exist. When your turn ends, the app appends that file to memory and clears the
outbox. This needs `workspace-write` access; in `read-only`, tell the user to switch.

One short bullet per fact, with the date, in plain words:

```markdown
- 2026-10-05 — Prefers pnpm over npm for all JavaScript projects.
```

Write only the new notes, not a copy of the existing memory. Do not store secrets,
passwords or keys, or anything only true for this conversation.

Tell the user in a few words what you saved.
