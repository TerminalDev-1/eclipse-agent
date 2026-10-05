import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { AgentEvent, AppPaths, CodexStatus, Skill, TurnArgs } from "./types";

type Listener = (conversationId: string, event: AgentEvent) => void;

export interface Api {
  status(): Promise<CodexStatus>;
  paths(): Promise<AppPaths>;
  skills(): Promise<Skill[]>;
  saveSkill(name: string, content: string): Promise<void>;
  openSkillsFolder(): Promise<void>;
  sendTurn(args: TurnArgs): Promise<void>;
  cancelTurn(conversationId: string): Promise<void>;
  onEvent(listener: Listener): () => void;
  pickFolder(current: string): Promise<string | null>;
  openLink(url: string): void;
  window: { minimize(): void; toggleMaximize(): void; close(): void };
}

const tauri: Api = {
  status: () => invoke("codex_status"),
  paths: () => invoke("app_paths"),
  skills: () => invoke("list_skills"),
  saveSkill: (name, content) => invoke("save_skill", { name, content }),
  openSkillsFolder: () => invoke("open_skills_folder"),
  sendTurn: (args) => invoke("send_turn", { args }),
  cancelTurn: (conversationId) => invoke("cancel_turn", { conversationId }),
  onEvent(listener) {
    const unlisten = listen<{ conversationId: string; event: AgentEvent }>("agent-event", (e) =>
      listener(e.payload.conversationId, e.payload.event),
    );
    return () => void unlisten.then((off) => off());
  },
  async pickFolder(current) {
    const picked = await open({ directory: true, defaultPath: current, title: "Choose a workspace" });
    return typeof picked === "string" ? picked : null;
  },
  openLink: (url) => void openUrl(url),
  window: {
    minimize: () => void getCurrentWindow().minimize(),
    toggleMaximize: () => void getCurrentWindow().toggleMaximize(),
    close: () => void getCurrentWindow().close(),
  },
};

export const inTauri = "__TAURI_INTERNALS__" in window;

// Outside the desktop shell (plain `pnpm dev` in a browser) a scripted stand-in drives the UI.
export const api: Api = inTauri ? tauri : (await import("./mock")).mock;
