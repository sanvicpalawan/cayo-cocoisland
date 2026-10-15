import { useSyncExternalStore } from "react";

/**
 * Device-only agent settings: OpenRouter API keys and the cached model catalogue.
 * These are NEVER written into site content, exports or the published website.
 */
export type KeyStatus = {
  ok: boolean;
  checkedAt: number;
  error?: string;
  label?: string;
  usage?: number;
  limit?: number | null;
  remaining?: number | null;
  freeTier?: boolean;
  daily?: string;
};
export type ApiKey = { id: string; label: string; key: string; status?: KeyStatus };
export type ModelInfo = { id: string; name: string; free: boolean; prompt: number; completion: number; context: number; description?: string };
export type AgentLocalState = { keys: ApiKey[]; rotation: "failover" | "roundrobin"; rr: number; models: ModelInfo[]; modelsAt: number };

const STORAGE = "cc-agent-local";
const initial: AgentLocalState = { keys: [], rotation: "failover", rr: 0, models: [], modelsAt: 0 };

function load(): AgentLocalState {
  try {
    const raw = localStorage.getItem(STORAGE);
    return raw ? { ...initial, ...JSON.parse(raw) } : initial;
  } catch {
    return initial;
  }
}

let state = load();
const subs = new Set<() => void>();
const emit = () => subs.forEach((fn) => fn());

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE) {
      state = load();
      emit();
    }
  });
}

export const agentLocal = {
  get: () => state,
  set(patch: Partial<AgentLocalState> | ((s: AgentLocalState) => Partial<AgentLocalState>)) {
    state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state));
    } catch {
      /* storage full — keep in memory */
    }
    emit();
  },
  subscribe(fn: () => void) {
    subs.add(fn);
    return () => {
      subs.delete(fn);
    };
  },
};

export const useAgentLocal = () => useSyncExternalStore(agentLocal.subscribe, agentLocal.get, agentLocal.get);

export const maskKey = (k: string) => (k.length > 14 ? `${k.slice(0, 9)}…${k.slice(-4)}` : "••••••");

/** Keys worth trying: valid or not yet checked. */
export const usableKeys = (s: AgentLocalState) => s.keys.filter((k) => k.key && k.status?.ok !== false);

export function markKey(id: string, status: Partial<KeyStatus>) {
  agentLocal.set((s) => ({
    keys: s.keys.map((k) => (k.id === id ? { ...k, status: { ...(k.status ?? { ok: true, checkedAt: Date.now() }), ...status, checkedAt: Date.now() } } : k)),
  }));
}
