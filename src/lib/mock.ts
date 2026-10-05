// A scripted stand-in for the Tauri backend, used only when the UI runs in a plain
// browser. It plays back the same event stream Codex produces so the interface can be
// designed and checked without the desktop shell.
import type { Api } from "./api";
import type { AgentEvent, Skill } from "./types";

const listeners = new Set<(conversationId: string, event: AgentEvent) => void>();
const timers = new Map<string, number[]>();

const names: [string, string][] = [
  ["boot", "The kernel. Load first in every session — how Eclipse works and how to choose and load every other skill."],
  ["ask", "Ask the user questions when you are blocked on a choice only they can make."],
  ["chat", "Write a message to the user — tone, length and formatting for every reply."],
  ["edit", "Create or change files in the workspace — code, config, documents."],
  ["explore", "Look around files, folders and codebases to understand what exists before acting."],
  ["plan", "Break a large or ambiguous request into ordered, verifiable steps before starting."],
  ["shell", "Run commands, scripts, builds and tests in the workspace."],
];

const skills: Skill[] = names.map(([name, description]) => ({
  name,
  description,
  path: `C:\\Eclipse\\skills\\${name}\\SKILL.md`,
  content: `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n\nPreview content.\n`,
}));

const reply = [
  "Here is how a turn works in Eclipse.\n",
  "1. I start knowing only how to **load skills**.\n2. `boot` tells me which skill fits what you asked.\n3. I read each one from disk before acting — you see every load above.\n",
  "| Skill | Used for |\n| --- | --- |\n| `chat` | Every reply |\n| `explore` | Reading the workspace |\n| `edit` | Changing files |\n",
  "```ts\nconst skill = await load(\"chat\");\nreply(skill.voice, \"Hello\");\n```\n",
].join("\n");

const askReply =
  "Two choices shape this, so I'd rather ask than guess.\n\n```eclipse-ask\n" +
  JSON.stringify({
    questions: [
      { id: "lang", question: "Which language should the tool use?", options: ["TypeScript (recommended)", "Rust", "Python"] },
      { id: "extras", question: "Which extras do you want?", options: ["Tests", "CI workflow", "README"], multi: true },
    ],
  }) +
  "\n```";

function script(text: string): [number, AgentEvent][] {
  const asking = /\bask|plan\b/i.test(text);
  const cmd = (id: string, command: string, done: boolean, output = "") => ({
    type: done ? "item.completed" : "item.started",
    item: { id, type: "command_execution", command, aggregated_output: output, exit_code: done ? 0 : null, status: done ? "completed" : "in_progress" },
  });
  const events: [number, AgentEvent][] = [
    [50, { type: "thread.started", thread_id: "00000000-0000-0000-0000-000000000000" }],
    [600, { type: "eclipse.skill", name: "boot", itemId: "i0" }],
    [1300, { type: "eclipse.skill", name: "chat", itemId: "i1" }],
  ];
  if (asking) {
    events.push([1900, { type: "eclipse.skill", name: "ask", itemId: "i2" }]);
    events.push([2800, { type: "item.completed", item: { id: "i3", type: "agent_message", text: askReply } }]);
  } else {
    events.push([1900, { type: "eclipse.skill", name: "explore", itemId: "i2" }]);
    events.push([2300, cmd("i3", "Get-ChildItem -Name", false)]);
    events.push([3100, cmd("i3", "Get-ChildItem -Name", true, "package.json\nskills\nsrc\nsrc-tauri\n")]);
    events.push([4000, { type: "item.completed", item: { id: "i4", type: "agent_message", text: reply } }]);
  }
  const end = events[events.length - 1][0];
  events.push([end + 100, { type: "turn.completed", usage: { input_tokens: 28508, cached_input_tokens: 25088, output_tokens: 412 } }]);
  events.push([end + 150, { type: "eclipse.done", cancelled: false, error: null }]);
  return events;
}

export const mock: Api = {
  status: async () => ({ found: true, path: "codex", version: "0.160.0", loggedIn: true, detail: "Logged in using ChatGPT" }),
  paths: async () => ({ skillsDir: "C:\\Eclipse\\skills", memoryFile: "C:\\Eclipse\\memory\\MEMORY.md", defaultWorkspace: "C:\\Users\\you\\Documents\\Eclipse" }),
  skills: async () => skills,
  saveSkill: async () => {},
  openSkillsFolder: async () => {},
  sendTurn: ({ conversationId, text }) =>
    new Promise((resolve) => {
      const ids = script(text).map(([delay, event]) =>
        window.setTimeout(() => {
          listeners.forEach((l) => l(conversationId, event));
          if (event.type === "eclipse.done") resolve();
        }, delay),
      );
      timers.set(conversationId, ids);
    }),
  async cancelTurn(conversationId) {
    timers.get(conversationId)?.forEach(clearTimeout);
    listeners.forEach((l) => l(conversationId, { type: "eclipse.done", cancelled: true, error: null }));
  },
  onEvent(listener) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
  pickFolder: async () => null,
  openLink: (url) => void window.open(url, "_blank", "noopener"),
  window: { minimize() {}, toggleMaximize() {}, close() {} },
};
