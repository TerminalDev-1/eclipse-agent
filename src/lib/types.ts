export type Effort = "low" | "medium" | "high" | "xhigh" | "max";
export type Access = "read-only" | "workspace-write";

export interface CodexStatus {
  found: boolean;
  path: string | null;
  version: string | null;
  loggedIn: boolean;
  detail: string;
}

export interface AppPaths {
  skillsDir: string;
  memoryFile: string;
  defaultWorkspace: string;
}

export interface Skill {
  name: string;
  description: string;
  path: string;
  content: string;
}

export interface TurnArgs {
  conversationId: string;
  threadId: string | null;
  text: string;
  effort: Effort;
  workspace: string;
  access: Access;
}

export type Part =
  | { kind: "skill"; name: string }
  | { kind: "text"; id: string; text: string }
  | { kind: "reasoning"; id: string; text: string }
  | { kind: "command"; id: string; command: string; output: string; exitCode: number | null; status: string }
  | { kind: "files"; id: string; changes: { path: string; kind: string }[] }
  | { kind: "search"; id: string; query: string }
  | { kind: "todo"; id: string; items: { text: string; completed: boolean }[] }
  | { kind: "error"; id: string; message: string };

export interface Usage {
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
}

export interface UserMessage {
  id: string;
  role: "user";
  text: string;
}

export interface AgentMessage {
  id: string;
  role: "agent";
  parts: Part[];
  /** Ids of commands that were skill loads; they show as skill chips, not commands. */
  skillItems: string[];
  status: "running" | "done" | "error" | "cancelled";
  usage?: Usage;
  startedAt: number;
  endedAt?: number;
}

export type Message = UserMessage | AgentMessage;

export interface Conversation {
  id: string;
  title: string;
  threadId?: string;
  workspace: string;
  messages: Message[];
  updatedAt: number;
}

export interface Settings {
  effort: Effort;
  access: Access;
  workspace: string;
}

export interface AskQuestion {
  id: string;
  question: string;
  options: string[];
  multi?: boolean;
}

/** One JSONL event from `codex exec --json`, or an `eclipse.*` event from the app. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AgentEvent = { type: string } & Record<string, any>;
