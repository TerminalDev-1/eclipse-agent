import type { AgentEvent, AgentMessage, AskQuestion, Conversation, Part } from "./types";

/** Codex reports commands wrapped in the shell that ran them; show just the command. */
function cleanCommand(command: string): string {
  const shell = command.match(/^"?[^"]*?(?:powershell|pwsh|bash|zsh|sh)(?:\.exe)?"?\s+-(?:Command|lc|c)\s+([\s\S]*)$/i);
  let inner = (shell ? shell[1] : command).trim();
  const quote = inner[0];
  if ((quote === '"' || quote === "'") && inner.endsWith(quote)) inner = inner.slice(1, -1);
  return inner;
}

function partFromItem(item: AgentEvent): Part | null {
  const id = String(item.id);
  switch (item.type) {
    case "agent_message":
      return { kind: "text", id, text: item.text ?? "" };
    case "reasoning":
      return { kind: "reasoning", id, text: item.text ?? "" };
    case "command_execution":
      return {
        kind: "command",
        id,
        command: cleanCommand(item.command ?? ""),
        output: item.aggregated_output ?? "",
        exitCode: item.exit_code ?? null,
        status: item.status ?? "in_progress",
      };
    case "file_change":
      return { kind: "files", id, changes: item.changes ?? [] };
    case "web_search":
      return { kind: "search", id, query: item.query ?? "" };
    case "todo_list":
      return { kind: "todo", id, items: item.items ?? [] };
    case "error":
      return { kind: "error", id, message: item.message ?? "Unknown error" };
    default:
      return null;
  }
}

function upsert(parts: Part[], part: Part) {
  const at = parts.findIndex((p) => "id" in p && "id" in part && p.id === part.id && p.kind === part.kind);
  if (at >= 0) parts[at] = part;
  else parts.push(part);
}

/** Fold one event into the conversation's in-flight agent turn. */
export function applyEvent(conv: Conversation, ev: AgentEvent): Conversation {
  if (ev.type === "thread.started") return { ...conv, threadId: ev.thread_id };

  const at = conv.messages.length - 1;
  const last = conv.messages[at];
  if (!last || last.role !== "agent" || last.status !== "running") return conv;
  const turn: AgentMessage = { ...last, parts: [...last.parts], skillItems: [...last.skillItems] };

  switch (ev.type) {
    case "eclipse.skill": {
      if (!turn.skillItems.includes(ev.itemId)) turn.skillItems.push(ev.itemId);
      if (!turn.parts.some((p) => p.kind === "skill" && p.name === ev.name)) {
        turn.parts.push({ kind: "skill", name: ev.name });
      }
      break;
    }
    case "item.started":
    case "item.updated":
    case "item.completed": {
      const part = partFromItem(ev.item);
      if (part && !(part.kind === "command" && turn.skillItems.includes(part.id))) upsert(turn.parts, part);
      break;
    }
    case "turn.completed":
      turn.usage = ev.usage;
      break;
    case "turn.failed":
      turn.parts.push({ kind: "error", id: `failed-${turn.parts.length}`, message: ev.error?.message ?? "The turn failed." });
      break;
    case "error":
      upsert(turn.parts, { kind: "error", id: "stream-error", message: ev.message ?? "Unknown error" });
      break;
    case "eclipse.done": {
      const hasError = turn.parts.some((p) => p.kind === "error");
      if (ev.error && !hasError) turn.parts.push({ kind: "error", id: "exit", message: ev.error });
      turn.status = ev.cancelled ? "cancelled" : ev.error || hasError ? "error" : "done";
      turn.endedAt = Date.now();
      break;
    }
    default:
      return conv;
  }

  const messages = conv.messages.slice();
  messages[at] = turn;
  return { ...conv, messages, updatedAt: Date.now() };
}

export type Segment = { type: "md"; text: string } | { type: "ask"; questions: AskQuestion[] };

/** Split a message into markdown and the interactive question blocks the `ask` skill emits. */
export function splitAsk(text: string): Segment[] {
  const segments: Segment[] = [];
  const pattern = /```eclipse-ask\s*\n([\s\S]*?)```/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const before = text.slice(cursor, match.index).trim();
    if (before) segments.push({ type: "md", text: before });
    try {
      const questions = JSON.parse(match[1]).questions;
      if (Array.isArray(questions) && questions.length) segments.push({ type: "ask", questions });
    } catch {
      segments.push({ type: "md", text: match[0] });
    }
    cursor = match.index + match[0].length;
  }
  const rest = text.slice(cursor).trim();
  if (rest) segments.push({ type: "md", text: rest });
  return segments;
}

export function formatTokens(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}
