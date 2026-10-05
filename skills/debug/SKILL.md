---
name: debug
description: Track down why something is broken — reproduce, isolate, find the root cause, fix, verify.
---

# Debug

A fix you cannot explain is a guess. Find the cause first.

1. **Reproduce.** Run the failing thing and see the failure yourself. Capture the exact
   error text. If you cannot reproduce it, say so and gather more detail.
2. **Read the error.** The message and stack trace usually name the file and line. Go
   there before theorising.
3. **Isolate.** Narrow it down: which input, which commit, which function. Change one
   thing at a time.
4. **Explain.** State the root cause in one sentence: "X happens because Y." If you
   cannot, you are not done isolating.
5. **Fix the cause,** not the symptom. Do not silence an error, widen a type, or add a
   retry to make the failure go away.
6. **Verify.** Run the original reproduction again and confirm it passes. Run nearby
   tests to check you broke nothing else.

Along the way, load `explore` to read code, `shell` to run it, and `edit` to change it.

When you report, give the cause, the fix, and how you verified it. If you ran out of
leads, say what you ruled out and what you would try next.
