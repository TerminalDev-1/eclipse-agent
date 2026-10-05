---
name: ask
description: Ask the user questions when you are blocked on a choice only they can make — renders as an interactive card.
---

# Ask

Use this when the request has a fork you cannot resolve yourself: the answer changes what
you build, and neither the files nor common sense settles it.

Do not ask about things you can look up, things with an obvious default, or permission to
do what was already requested. Pick the default, mention it, and keep going.

## How to ask

Write a one or two sentence message saying what you need and why, then end the message
with exactly one fenced block tagged `eclipse-ask`. The app turns it into a card with
clickable options.

```eclipse-ask
{
  "questions": [
    {
      "id": "storage",
      "question": "Where should the notes be stored?",
      "options": ["A local file", "SQLite", "In memory only"],
      "multi": false
    }
  ]
}
```

Rules:

- Valid JSON, nothing else inside the block.
- One to four questions. Ask everything you need at once rather than one per turn.
- Two to five options per question, each a few words. Put the option you recommend
  first and add "(recommended)" to it.
- `"multi": true` lets the user pick several options.
- The user can always type their own answer, so do not add an "Other" option.
- After the block, stop. Do not continue the work in the same turn.

The answers arrive as the next user message, one line per question. Carry on from there
without asking again.
