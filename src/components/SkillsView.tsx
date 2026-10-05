import { useEffect, useState, type CSSProperties } from "react";
import { api } from "../lib/api";
import type { Skill } from "../lib/types";
import { Folder, Plus } from "./Icons";

const template = (name: string) =>
  `---\nname: ${name}\ndescription: One line saying what this skill is for.\n---\n\n# ${name}\n\nWhen to use this skill, then how to do the work.\n`;

export function SkillsView({ skills, skillsDir, onChanged }: { skills: Skill[]; skillsDir: string; onChanged: () => Promise<void> }) {
  const [selected, setSelected] = useState<string>(skills[0]?.name ?? "");
  const [draft, setDraft] = useState("");
  const [newName, setNewName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const skill = skills.find((s) => s.name === selected);
  const original = skill?.content ?? (selected ? template(selected) : "");
  const dirty = draft !== original || (!skill && selected !== "");

  useEffect(() => {
    setDraft(original);
    setError("");
    // Reset the editor only when a different skill is opened or its file changes on disk.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, skill?.content]);

  const save = async () => {
    try {
      await api.saveSkill(selected, draft);
      await onChanged();
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch (e) {
      setError(String(e));
    }
  };

  const create = () => {
    const name = (newName ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!name) return;
    setNewName(null);
    setSelected(name);
  };

  return (
    <section className="skills">
      <header className="skills-head">
        <div>
          <h1>Skills</h1>
          <p>
            Everything Eclipse does is one of these files. It starts each session knowing only how to load them — edit one and
            you change how it works.
          </p>
        </div>
        <div className="skills-actions">
          <button type="button" className="ghost" onClick={() => api.openSkillsFolder()} title={skillsDir}>
            <Folder />
            Open folder
          </button>
          <button type="button" className="ghost" onClick={() => setNewName("")}>
            <Plus />
            New skill
          </button>
        </div>
      </header>

      <div className="skills-main">
        <div className="skills-list">
          {newName !== null && (
            <form
              className="skill-new"
              onSubmit={(e) => {
                e.preventDefault();
                create();
              }}
            >
              <input autoFocus placeholder="skill-name" value={newName} onChange={(e) => setNewName(e.target.value)} onBlur={() => !newName && setNewName(null)} />
            </form>
          )}
          {!skill && selected && (
            <button type="button" className="skill-card" data-active>
              <span className="skill-card-name">{selected}</span>
              <span className="skill-card-desc">New — not saved yet</span>
            </button>
          )}
          {skills.map((s, index) => (
            <button
              type="button"
              key={s.name}
              className="skill-card"
              data-active={s.name === selected}
              style={{ "--i": index } as CSSProperties}
              onClick={() => setSelected(s.name)}
            >
              <span className="skill-card-name">
                {s.name}
                {s.name === "boot" && <em>kernel</em>}
              </span>
              <span className="skill-card-desc">{s.description}</span>
            </button>
          ))}
        </div>

        <div className="skill-editor">
          <div className="skill-editor-bar">
            <code>{selected ? `${selected}/SKILL.md` : "No skill selected"}</code>
            {error && <span className="skill-editor-error">{error}</span>}
            <button type="button" className="primary" disabled={!dirty || !selected} onClick={save}>
              {saved ? "Saved" : "Save"}
            </button>
          </div>
          <textarea spellCheck={false} value={draft} onChange={(e) => setDraft(e.target.value)} disabled={!selected} />
        </div>
      </div>
    </section>
  );
}
