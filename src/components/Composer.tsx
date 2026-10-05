import { useEffect, useRef, useState } from "react";
import type { Access, Effort, Settings } from "../lib/types";
import { Eclipse } from "./Eclipse";
import { ArrowUp, Folder, Lock, Pen, Stop } from "./Icons";
import { Menu, type MenuOption } from "./Menu";

// GPT-6 Luna is the only model Eclipse runs on for now; the picker is here for the day there are more.
const MODELS: MenuOption<"gpt-6-luna">[] = [
  { value: "gpt-6-luna", label: "GPT-6 Luna", hint: "Fast, light on usage", icon: <Eclipse size={20} /> },
];

const EFFORTS: MenuOption<Effort>[] = [
  { value: "low", label: "Low", hint: "Fastest, lighter reasoning" },
  { value: "medium", label: "Medium", hint: "Balanced for everyday work" },
  { value: "high", label: "High", hint: "Deeper reasoning" },
  { value: "xhigh", label: "Extra high", hint: "For complex problems" },
  { value: "max", label: "Max", hint: "The hardest problems, slowest" },
];

const ACCESS: MenuOption<Access>[] = [
  { value: "workspace-write", label: "Can edit", hint: "Read and change files in the workspace" },
  { value: "read-only", label: "Read only", hint: "Look, but change nothing" },
];

export function Composer({
  settings,
  workspace,
  running,
  disabled,
  focusKey,
  onSettings,
  onPickWorkspace,
  onSend,
  onStop,
}: {
  settings: Settings;
  workspace: string;
  running: boolean;
  disabled: boolean;
  focusKey: string;
  onSettings: (patch: Partial<Settings>) => void;
  onPickWorkspace: () => void;
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const [text, setText] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, [focusKey]);

  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [text]);

  const canSend = text.trim().length > 0 && !running && !disabled;
  const send = () => {
    if (!canSend) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="composer" data-running={running}>
      <textarea
        ref={input}
        rows={1}
        value={text}
        placeholder="Ask Eclipse for anything…"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
      />
      <div className="composer-bar">
        <Menu title="Model" value="gpt-6-luna" options={MODELS} onChange={() => {}} icon={<Eclipse size={12} />} />
        <Menu title="Reasoning" value={settings.effort} options={EFFORTS} onChange={(effort) => onSettings({ effort })} />
        <button type="button" className="pill" onClick={onPickWorkspace} title={`Workspace: ${workspace}`}>
          <Folder />
          <span className="pill-path">{workspace.split(/[\\/]/).filter(Boolean).pop()}</span>
        </button>
        <Menu
          title="Workspace access"
          value={settings.access}
          options={ACCESS}
          onChange={(access) => onSettings({ access })}
          icon={settings.access === "read-only" ? <Lock /> : <Pen />}
        />
        <span className="composer-spacer" />
        {running ? (
          <button type="button" className="send" data-stop onClick={onStop} aria-label="Stop">
            <Stop />
          </button>
        ) : (
          <button type="button" className="send" disabled={!canSend} onClick={send} aria-label="Send">
            <ArrowUp />
          </button>
        )}
      </div>
    </div>
  );
}
