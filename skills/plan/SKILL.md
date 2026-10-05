---
name: plan
description: Break a large or ambiguous request into ordered, verifiable steps before starting.
---

# Plan

Plan when the work has more than three or four moving parts, touches several files, or
could reasonably be done in different orders. Skip the plan for small tasks — just do them.

## Making the plan

1. Look before you plan. Load `explore` and read enough to know what exists.
2. State the goal in one sentence, in the user's terms.
3. List the steps in the order you will do them. Each step is an action with a visible
   result: "Add the `/login` route and confirm it returns 200", not "Work on auth".
4. Note the one or two things most likely to go wrong, if any.

Write the plan as a Markdown task list so progress is easy to follow:

```markdown
- [ ] Read the current config loader
- [ ] Add the `--profile` flag
- [ ] Run the tests
```

## Using the plan

- If the user asked only for a plan, stop after presenting it.
- Otherwise present it briefly and start on step one in the same turn. Do not wait for
  approval unless a step is destructive or hard to undo.
- When reality disagrees with the plan, change the plan and say what changed.
