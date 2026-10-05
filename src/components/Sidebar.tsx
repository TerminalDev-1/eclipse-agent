import type { CodexStatus, Conversation } from "../lib/types";
import { Layers, Plus, Trash } from "./Icons";

function ago(time: number): string {
  const minutes = Math.floor((Date.now() - time) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}

export function Sidebar({
  conversations,
  activeId,
  view,
  skillCount,
  status,
  onSelect,
  onNew,
  onDelete,
  onSkills,
}: {
  conversations: Conversation[];
  activeId: string | null;
  view: "chat" | "skills";
  skillCount: number;
  status: CodexStatus | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSkills: () => void;
}) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  const ready = status?.found && status.loggedIn;
  return (
    <aside className="sidebar">
      <button type="button" className="sidebar-new" onClick={onNew}>
        <Plus />
        New session
      </button>

      <div className="sidebar-label">Sessions</div>
      <nav className="sidebar-list">
        {sorted.length === 0 && <p className="sidebar-empty">Nothing yet. Sessions you start appear here.</p>}
        {sorted.map((conv) => (
          <div key={conv.id} className="sidebar-item" data-active={view === "chat" && conv.id === activeId}>
            <button type="button" className="sidebar-item-main" onClick={() => onSelect(conv.id)}>
              <span className="sidebar-item-title">{conv.title}</span>
              <span className="sidebar-item-time">{ago(conv.updatedAt)}</span>
            </button>
            <button type="button" className="sidebar-item-delete" onClick={() => onDelete(conv.id)} aria-label={`Delete ${conv.title}`}>
              <Trash />
            </button>
          </div>
        ))}
      </nav>

      <button type="button" className="sidebar-skills" data-active={view === "skills"} onClick={onSkills}>
        <Layers />
        <span>Skills</span>
        <span className="sidebar-skills-count">{skillCount}</span>
      </button>

      <div className="sidebar-status" title={status?.path ?? status?.detail ?? ""}>
        <span className="status-dot" data-state={status ? (ready ? "ok" : "bad") : "wait"} />
        <span>
          {!status && "Looking for Codex…"}
          {status && ready && `Codex ${status.version ?? ""} · signed in`}
          {status && !status.found && "Codex not found"}
          {status?.found && !status.loggedIn && "Codex not signed in"}
        </span>
      </div>
    </aside>
  );
}
