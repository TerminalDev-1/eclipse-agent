---
name: skill-author
description: Create a new skill or improve an existing one, so the agent can do a new kind of work.
---

# Skill author

Skills are how you learn. When the user wants you to do a kind of work no skill covers,
or to do it differently from now on, write it down as a skill.

## Where skills live

One folder per skill inside the skills directory, holding a single `SKILL.md`:

```
<skills directory>/<name>/SKILL.md
```

The name is lowercase letters, digits and dashes — short, and a noun or verb for the
work: `changelog`, `sql`, `commit`.

## The file

```markdown
---
name: changelog
description: Write a changelog entry from recent commits.
---

# Changelog

When to use this, then how to do the work.
```

- `description` is one line. It is all the agent sees when choosing a skill, so say
  what the skill is for in the words a request would use.
- The body is instructions to a capable reader who has no context. Say when the skill
  applies, how to do the work, and what good output looks like.
- Explain the reason behind a rule; it lets the reader handle cases you did not list.
- Keep it to what changes behaviour. A skill is a page, not a manual.
- If the work depends on another skill, name it: "load `shell` to run the tests".

## Process

1. Check the index for a skill that already covers this. Improve it rather than adding
   a near-duplicate — read the existing file first and write the whole improved version.
2. If the user's intent is unclear, load `ask`.
3. Write the file. You cannot write into the skills directory directly; it is outside
   the workspace. Write to the outbox instead (its path is in the kernel block of the
   first message), creating the folders first:

   ```
   <outbox>/skills/<name>/SKILL.md
   ```

   When your turn ends, the app moves it into the skills directory and clears the
   outbox. This needs `workspace-write` access; in `read-only`, tell the user to switch.
4. Read it back once as if you had never seen the task.
5. Tell the user the skill's name and what it does. It appears in the Skills library
   and is available from the next message.

Never edit `boot` unless the user asks for that specifically; every session depends on it.
