import { useEffect, useState } from "react";
import { formatDuration, formatTokens, splitAsk } from "../lib/reduce";
import type { AgentMessage, Part } from "../lib/types";
import { AskCard } from "./AskCard";
import { Eclipse } from "./Eclipse";
import { Check, Chevron, File, Search, Terminal } from "./Icons";
import { Markdown } from "./Markdown";

function Command({ part }: { part: Extract<Part, { kind: "command" }> }) {
  const [open, setOpen] = useState(false);
  const running = part.status === "in_progress";
  const failed = !running && part.exitCode !== 0;
  return (
    <div className="command" data-state={running ? "running" : failed ? "failed" : "ok"}>
      <button type="button" className="command-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Terminal />
        <code>{part.command}</code>
        {failed && <span className="command-exit">exit {part.exitCode}</span>}
        <Chevron className="command-chevron" data-open={open} />
      </button>
      {open && <pre className="command-output">{part.output.trim() || (running ? "Running…" : "No output")}</pre>}
    </div>
  );
}

function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <>{formatDuration(now - since)}</>;
}

/** What the agent is doing right now, judged by the last thing it did. */
function activity(parts: Part[]): string {
  const last = parts[parts.length - 1];
  if (!last) return "Waking up";
  if (last.kind === "skill") return `Loading ${last.name}`;
  if (last.kind === "command" && last.status === "in_progress") return "Running a command";
  if (last.kind === "files") return "Editing files";
  if (last.kind === "search") return "Searching";
  return "Thinking";
}

/** Consecutive skill loads collapse into one trail of chips. */
function groupParts(parts: Part[]): (Part | { kind: "skills"; names: string[] })[] {
  const grouped: (Part | { kind: "skills"; names: string[] })[] = [];
  for (const part of parts) {
    const last = grouped[grouped.length - 1];
    if (part.kind === "skill") {
      if (last?.kind === "skills") last.names.push(part.name);
      else grouped.push({ kind: "skills", names: [part.name] });
    } else grouped.push(part);
  }
  return grouped;
}

export function Turn({ turn, isLast, onAnswer }: { turn: AgentMessage; isLast: boolean; onAnswer: (text: string) => void }) {
  const running = turn.status === "running";
  const skillCount = turn.parts.filter((p) => p.kind === "skill").length;
  const tokens = turn.usage ? turn.usage.input_tokens - turn.usage.cached_input_tokens + turn.usage.output_tokens : 0;

  return (
    <article className="turn">
      <div className="turn-mark">
        <Eclipse size={22} active={running} />
      </div>
      <div className="turn-body">
        {groupParts(turn.parts).map((part, index) => {
          switch (part.kind) {
            case "skills":
              return (
                <div className="skill-trail" key={index}>
                  <span className="skill-trail-label">loaded</span>
                  {part.names.map((name) => (
                    <span className="skill-chip" key={name}>
                      <i />
                      {name}
                    </span>
                  ))}
                </div>
              );
            case "text":
              return splitAsk(part.text).map((segment, i) =>
                segment.type === "md" ? (
                  <Markdown key={`${part.id}-${i}`} text={segment.text} />
                ) : (
                  <AskCard key={`${part.id}-${i}`} questions={segment.questions} disabled={!isLast || running} onSubmit={onAnswer} />
                ),
              );
            case "reasoning":
              return (
                <p className="reasoning" key={part.id}>
                  {part.text}
                </p>
              );
            case "command":
              return <Command key={part.id} part={part} />;
            case "files":
              return (
                <div className="files" key={part.id}>
                  {part.changes.map((change) => (
                    <span className="file-chip" key={change.path} data-kind={change.kind}>
                      <File />
                      {change.path.split(/[\\/]/).pop()}
                      <em>{change.kind}</em>
                    </span>
                  ))}
                </div>
              );
            case "search":
              return (
                <div className="file-chip" key={part.id}>
                  <Search />
                  {part.query}
                </div>
              );
            case "todo":
              return (
                <ul className="todo" key={part.id}>
                  {part.items.map((item, i) => (
                    <li key={i} data-done={item.completed}>
                      <span className="todo-box">{item.completed && <Check />}</span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              );
            case "error":
              return (
                <div className="turn-error" key={part.id} role="alert">
                  {part.message}
                </div>
              );
            default:
              return null;
          }
        })}

        {running ? (
          <div className="turn-working">
            <span className="comet" />
            <span className="shimmer" key={activity(turn.parts)}>
              {activity(turn.parts)}
            </span>
            <span className="turn-meta">
              <Elapsed since={turn.startedAt} />
            </span>
          </div>
        ) : (
          <div className="turn-meta">
            {turn.status === "cancelled" && <span>Stopped</span>}
            {skillCount > 0 && <span>{skillCount === 1 ? "1 skill" : `${skillCount} skills`}</span>}
            {turn.endedAt && <span>{formatDuration(turn.endedAt - turn.startedAt)}</span>}
            {tokens > 0 && <span>{formatTokens(tokens)} tokens</span>}
          </div>
        )}
      </div>
    </article>
  );
}
