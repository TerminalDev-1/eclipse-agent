import { useState } from "react";
import type { AskQuestion } from "../lib/types";
import { ArrowUp, Check } from "./Icons";

/** The interactive card the `ask` skill produces. Answers go back as the next message. */
export function AskCard({
  questions,
  disabled,
  onSubmit,
}: {
  questions: AskQuestion[];
  disabled: boolean;
  onSubmit: (answer: string) => void;
}) {
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [typed, setTyped] = useState<Record<string, string>>({});

  const answersFor = (q: AskQuestion) => [...(picked[q.id] ?? []), ...(typed[q.id]?.trim() ? [typed[q.id].trim()] : [])];
  const complete = questions.every((q) => answersFor(q).length > 0);

  const toggle = (q: AskQuestion, option: string) =>
    setPicked((prev) => {
      const current = prev[q.id] ?? [];
      const next = current.includes(option) ? current.filter((o) => o !== option) : q.multi ? [...current, option] : [option];
      return { ...prev, [q.id]: next };
    });

  const submit = () => onSubmit(questions.map((q) => `${q.question}\n→ ${answersFor(q).join(", ")}`).join("\n\n"));

  return (
    <div className="ask" data-disabled={disabled}>
      {questions.map((q, index) => (
        <fieldset key={q.id} className="ask-question" disabled={disabled}>
          <legend>
            <span className="ask-number">{index + 1}</span>
            {q.question}
            {q.multi && <span className="ask-multi">choose any</span>}
          </legend>
          <div className="ask-options">
            {q.options.map((option) => {
              const on = picked[q.id]?.includes(option) ?? false;
              return (
                <button type="button" key={option} className="ask-option" aria-pressed={on} onClick={() => toggle(q, option)}>
                  {on && <Check />}
                  {option}
                </button>
              );
            })}
          </div>
          <input
            className="ask-other"
            placeholder="Or type your own answer"
            value={typed[q.id] ?? ""}
            onChange={(e) => setTyped((prev) => ({ ...prev, [q.id]: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && complete && submit()}
          />
        </fieldset>
      ))}
      {!disabled && (
        <button type="button" className="ask-submit" disabled={!complete} onClick={submit}>
          Send answers
          <ArrowUp />
        </button>
      )}
    </div>
  );
}
