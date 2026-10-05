import { api } from "../lib/api";
import { Eclipse } from "./Eclipse";
import { Close, Maximize, Minimize } from "./Icons";

export function Titlebar({ active }: { active: boolean }) {
  return (
    <header className="titlebar" data-tauri-drag-region>
      <div className="titlebar-brand" data-tauri-drag-region>
        <Eclipse size={15} active={active} />
        <span data-tauri-drag-region>Eclipse</span>
      </div>
      <div className="titlebar-controls">
        <button type="button" onClick={api.window.minimize} aria-label="Minimize">
          <Minimize />
        </button>
        <button type="button" onClick={api.window.toggleMaximize} aria-label="Maximize">
          <Maximize />
        </button>
        <button type="button" className="titlebar-close" onClick={api.window.close} aria-label="Close">
          <Close />
        </button>
      </div>
    </header>
  );
}
