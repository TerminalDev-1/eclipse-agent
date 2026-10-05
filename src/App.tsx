import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./lib/api";
import { applyEvent } from "./lib/reduce";
import type { AgentMessage, AppPaths, CodexStatus, Conversation, Settings, Skill } from "./lib/types";
import { Composer } from "./components/Composer";
import { Eclipse } from "./components/Eclipse";
import { Sidebar } from "./components/Sidebar";
import { SkillsView } from "./components/SkillsView";
import { Titlebar } from "./components/Titlebar";
import { Turn } from "./components/Turn";

const CONVERSATIONS_KEY = "eclipse.conversations";
const SETTINGS_KEY = "eclipse.settings";

const SUGGESTIONS = [
  "Explain how you work",
  "Look around this workspace and tell me what's here",
  "Plan a small CLI tool, and ask me what you need to know",
  "Write a skill for drafting commit messages",
];

function loadConversations(): Conversation[] {
  try {
    const stored: Conversation[] = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) ?? "[]");
    // A turn that was in flight when the app closed can never finish.
    return stored.map((conv) => ({
      ...conv,
      messages: conv.messages.map((m) => (m.role === "agent" && m.status === "running" ? { ...m, status: "cancelled" as const } : m)),
    }));
  } catch {
    return [];
  }
}

function loadSettings(): Settings {
  const defaults: Settings = { effort: "medium", access: "workspace-write", workspace: "" };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") };
  } catch {
    return defaults;
  }
}

const isRunning = (conv?: Conversation) => {
  const last = conv?.messages[conv.messages.length - 1];
  return last?.role === "agent" && last.status === "running";
};

export default function App() {
  const [conversations, setConversations] = useState(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<"chat" | "skills">("chat");
  const [settings, setSettings] = useState(loadSettings);
  const [status, setStatus] = useState<CodexStatus | null>(null);
  const [paths, setPaths] = useState<AppPaths | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  const active = useMemo(() => conversations.find((c) => c.id === activeId), [conversations, activeId]);
  const running = isRunning(active);
  const workspace = active?.workspace || settings.workspace || paths?.defaultWorkspace || "";
  const ready = !!status?.found && status.loggedIn;

  const refreshSkills = useCallback(() => api.skills().then(setSkills, () => {}), []);
  const checkCodex = useCallback(() => {
    setStatus(null);
    api.status().then(setStatus, (e) => setStatus({ found: false, path: null, version: null, loggedIn: false, detail: String(e) }));
  }, []);

  useEffect(() => {
    checkCodex();
    api.paths().then(setPaths, () => {});
    refreshSkills();
    return api.onEvent((conversationId, event) => {
      setConversations((prev) => prev.map((c) => (c.id === conversationId ? applyEvent(c, event) : c)));
      // The agent can write skills of its own, so re-index after every turn.
      if (event.type === "eclipse.done") refreshSkills();
    });
  }, [checkCodex, refreshSkills]);

  useEffect(() => localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations)), [conversations]);
  useEffect(() => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)), [settings]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || !workspace || isRunning(active)) return;
      const conv: Conversation = active ?? {
        id: crypto.randomUUID(),
        title: text.length > 48 ? `${text.slice(0, 48)}…` : text,
        workspace,
        messages: [],
        updatedAt: Date.now(),
      };
      const turn: AgentMessage = { id: crypto.randomUUID(), role: "agent", parts: [], skillItems: [], status: "running", startedAt: Date.now() };
      const next: Conversation = {
        ...conv,
        messages: [...conv.messages, { id: crypto.randomUUID(), role: "user", text }, turn],
        updatedAt: Date.now(),
      };
      setConversations((prev) => (prev.some((c) => c.id === conv.id) ? prev.map((c) => (c.id === conv.id ? next : c)) : [...prev, next]));
      setActiveId(conv.id);
      setView("chat");
      try {
        await api.sendTurn({
          conversationId: conv.id,
          threadId: conv.threadId ?? null,
          text,
          effort: settings.effort,
          workspace: conv.workspace,
          access: settings.access,
        });
      } catch (e) {
        const failure = { type: "eclipse.done", cancelled: false, error: String(e) };
        setConversations((prev) => prev.map((c) => (c.id === conv.id ? applyEvent(c, failure) : c)));
      }
    },
    [active, workspace, settings.effort, settings.access],
  );

  const pickWorkspace = async () => {
    const picked = await api.pickFolder(workspace);
    if (!picked) return;
    setSettings((s) => ({ ...s, workspace: picked }));
    if (active) setConversations((prev) => prev.map((c) => (c.id === active.id ? { ...c, workspace: picked } : c)));
  };

  const remove = (id: string) => {
    if (isRunning(conversations.find((c) => c.id === id))) api.cancelTurn(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === activeId) setActiveId(null);
  };

  return (
    <div className="app">
      <div className="sky" aria-hidden />
      <Titlebar active={conversations.some(isRunning)} />
      <div className="shell">
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          view={view}
          skillCount={skills.length}
          status={status}
          onSelect={(id) => {
            setActiveId(id);
            setView("chat");
          }}
          onNew={() => {
            setActiveId(null);
            setView("chat");
          }}
          onDelete={remove}
          onSkills={() => setView("skills")}
        />

        <main className="main">
          {view === "skills" ? (
            <SkillsView skills={skills} skillsDir={paths?.skillsDir ?? ""} onChanged={refreshSkills} />
          ) : (
            <>
              <div className="thread" ref={scroller}>
                {active ? (
                  <div className="thread-inner">
                    {active.messages.map((message, index) =>
                      message.role === "user" ? (
                        <div className="user-message" key={message.id}>
                          {message.text}
                        </div>
                      ) : (
                        <Turn key={message.id} turn={message} isLast={index === active.messages.length - 1} onAnswer={send} />
                      ),
                    )}
                  </div>
                ) : (
                  <div className="hero">
                    <Eclipse size={168} />
                    <h1>
                      Everything is a <em>skill</em>.
                    </h1>
                    <p>
                      Eclipse begins each session knowing only how to learn. Ask for something and watch it load what it needs.
                    </p>
                    <div className="hero-suggestions">
                      {SUGGESTIONS.map((suggestion) => (
                        <button type="button" key={suggestion} disabled={!ready} onClick={() => send(suggestion)}>
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="dock">
                {status && !ready && (
                  <div className="notice" role="status">
                    <span>
                      {status.found
                        ? "Codex isn't signed in. Run `codex login` in a terminal, then check again."
                        : "Eclipse runs on your Codex login, but the Codex CLI wasn't found on this machine."}
                    </span>
                    <button type="button" className="ghost" onClick={checkCodex}>
                      Check again
                    </button>
                  </div>
                )}
                <Composer
                  settings={settings}
                  workspace={workspace}
                  running={running}
                  disabled={!ready}
                  focusKey={`${view}:${activeId}`}
                  onSettings={(patch) => setSettings((s) => ({ ...s, ...patch }))}
                  onPickWorkspace={pickWorkspace}
                  onSend={send}
                  onStop={() => active && api.cancelTurn(active.id)}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
