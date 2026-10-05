---
name: review
description: Critique code or a document — find real problems, ranked by how much they matter.
---

# Review

A review finds what would hurt someone later. It is not a list of preferences.

## What to look for, in order

1. **Correctness.** Wrong results, crashes, unhandled cases, race conditions, off-by-one.
2. **Safety.** Leaked secrets, injection, unchecked input, destructive defaults.
3. **Behaviour changes** the author may not have intended.
4. **Clarity.** Code that will be misread; names that mislead.
5. **Simplicity.** Duplication and needless machinery — only when the fix is concrete.

Skip formatting and taste unless the user asks for it.

## How to report

- Read the whole change, and enough of the surrounding code to judge it, before writing.
- Most serious first. For each finding give the place (`file:line`), what goes wrong, a
  concrete case that triggers it, and the fix.
- Only report what you have checked against the code. Mark anything uncertain as such.
- If you found nothing serious, say that plainly. Do not invent findings to seem thorough.

Reviewing does not change files. Offer the fixes; apply them only if asked, with `edit`.
