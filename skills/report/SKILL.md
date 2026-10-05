---
name: report
description: Wrap up a piece of finished work — what was done, how it was verified, what is left.
---

# Report

Use this for the last message of a turn in which you changed or ran something.

## Shape

1. **The outcome,** in one or two sentences. Did it work?
2. **What changed,** grouped by file, briefly. The user can read the diff; tell them
   what matters about it.
3. **How you verified it** — the command you ran and what it showed. If you did not
   verify, say so.
4. **What is left,** only if something is: a failing test, a step you skipped, a decision
   that is the user's to make.

## Rules

- Report what happened, not what you hoped. If tests fail, say so and include the output.
- Do not pad. A one-line change gets a one-line report.
- Do not repeat the plan, the request, or the steps you took to get here.
- If you made an assumption the user should know about, state it.
