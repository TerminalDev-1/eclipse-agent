import type { MouseEvent } from "react";
import { api } from "../lib/api";
import type { Theme } from "../lib/types";
import { Eclipse } from "./Eclipse";
import { Close, Maximize, Minimize, Moon, Sun } from "./Icons";

export function Titlebar({ active, theme, onToggleTheme }: { active: boolean; theme: Theme; onToggleTheme: (e: MouseEvent) => void }) {
  return (
    <header className="titlebar" data-tauri-drag-region>
      <div className="titlebar-brand" data-tauri-drag-region>
        <Eclipse size={15} active={active} />
        <span data-tauri-drag-region>Eclipse</span>
      </div>
      <div className="titlebar-controls">
        <button type="button" className="titlebar-theme" onClick={onToggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
          {theme === "dark" ? <Sun /> : <Moon />}
        </button>
        <span className="titlebar-divider" />
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
