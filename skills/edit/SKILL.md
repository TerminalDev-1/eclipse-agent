---
name: edit
description: Create or change files in the workspace — code, config, documents.
---

# Edit

## Before you write

- Read the file first. Never overwrite something you have not looked at.
- Check that the workspace access in the kernel block is `workspace-write`. If it is
  `read-only`, do not attempt the change — tell the user to switch access in the composer.

## Writing

- Make the smallest change that fully does the job. Leave unrelated code alone.
- Write code that reads like the code around it: same naming, same style, same level of
  comments.
- Prefer a targeted patch to rewriting a whole file.
- Create new files only when the work needs them. No stray notes, backups or scratch files.
- Stay inside the workspace unless the user names another location.

## Hard to undo

Deleting files, overwriting large amounts of content, and rewriting history are different
from ordinary edits. Look at what is there, and confirm with the user (load `ask`) unless
they already told you to do exactly this.

## After you write

- Verify the change the cheapest way that proves it: run the test, build the file, or
  re-read the region. Load `shell` to run things.
- Tell the user what changed and where, by file.
