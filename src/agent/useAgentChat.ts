import { useCallback, useEffect, useRef, useState } from "react";
import { useCms } from "@/cms/store";
import type { SiteContent } from "@/cms/types";
import { agentLocal, markKey, useAgentLocal, usableKeys, type ApiKey } from "./local";
import { chatOpenRouter, chatProxy, type ChatMsg, type ChatResult } from "./openrouter";
import { buildSystemPrompt } from "./prompt";

export type UiMsg = { role: "user" | "assistant"; content: string; at: number; model?: string };
export type ChatMode = "proxy" | "direct" | "none";

export function useAgentMode(forceDirect = false): ChatMode {
  const { content } = useCms();
  const local = useAgentLocal();
  if (!forceDirect && content.agent.proxyUrl.trim()) return "proxy";
  return usableKeys(local).length ? "direct" : "none";
}

/** Keys in the order to try them (round-robin rotates the starting key on every request). */
function orderedKeys(): ApiKey[] {
  const s = agentLocal.get();
  const keys = usableKeys(s);
  if (s.rotation !== "roundrobin" || keys.length < 2) return keys;
  const start = s.rr % keys.length;
  agentLocal.set({ rr: s.rr + 1 });
  return [...keys.slice(start), ...keys.slice(0, start)];
}

const onKeyError = (id: string, status: number, message: string) => {
  if (status === 401 || status === 403) markKey(id, { ok: false, error: message });
  else if (status === 402) markKey(id, { error: `No credits: ${message}` });
};

export async function runDirect(content: SiteContent, messages: ChatMsg[], onDelta?: (t: string) => void, signal?: AbortSignal, system?: string): Promise<ChatResult> {
  const a = content.agent;
  return chatOpenRouter({
    messages: [{ role: "system", content: system ?? buildSystemPrompt(content) }, ...messages],
    models: [a.model, ...a.fallbacks],
    keys: orderedKeys(),
    temperature: a.temperature,
    maxTokens: a.maxTokens,
    onDelta,
    onKeyError,
    signal,
    siteUrl: content.site.siteUrl,
    title: `${content.site.fullName} concierge`,
  });
}

export function useAgentChat({ persistKey, forceDirect }: { persistKey?: string; forceDirect?: boolean } = {}) {
  const { content } = useCms();
  const mode = useAgentMode(forceDirect);
  const [messages, setMessages] = useState<UiMsg[]>(() => {
    if (!persistKey) return [];
    try {
      return JSON.parse(sessionStorage.getItem(persistKey) || "[]") as UiMsg[];
    } catch {
      return [];
    }
  });
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState("");
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!persistKey) return;
    try {
      sessionStorage.setItem(persistKey, JSON.stringify(messages.slice(-30)));
    } catch {
      /* ignore */
    }
  }, [messages, persistKey]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const q = text.trim().slice(0, 2000);
      if (!q || busy) return;
      const history: UiMsg[] = [...messages, { role: "user", content: q, at: Date.now() }];
      setMessages(history);
      setBusy(true);
      setError("");
      setStreaming("");
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const apiMessages: ChatMsg[] = history.slice(-12).map((m) => ({ role: m.role, content: m.content }));
        const result = mode === "proxy" ? await chatProxy(content.agent.proxyUrl.trim(), apiMessages, ctrl.signal) : await runDirect(content, apiMessages, setStreaming, ctrl.signal);
        setMessages((h) => [...h, { role: "assistant", content: result.text, at: Date.now(), model: result.model }]);
      } catch (e) {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
        setStreaming("");
      }
    },
    [busy, messages, mode, content],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError("");
    setStreaming("");
    setBusy(false);
  }, []);

  return { messages, send, busy, streaming, error, reset, mode };
}

export type AgentChat = ReturnType<typeof useAgentChat>;

const TONES: Record<string, string> = {
  warm: "warm, friendly and personal",
  professional: "polite and professional",
  brief: "very brief and to the point",
};

/** Staff tool: drafts a WhatsApp reply to a guest message, grounded in the same knowledge. */
export function draftWhatsAppReply(content: SiteContent, guestMessage: string, tone: string, onDelta?: (t: string) => void, signal?: AbortSignal) {
  const system = `${buildSystemPrompt(content)}

TASK: You are drafting a WhatsApp reply on behalf of the ${content.site.name} team, to be reviewed by staff before sending. Write only the message text — no subject line, no notes. Tone: ${TONES[tone] ?? TONES.warm}. If the guest asks about availability, prices that aren't in the knowledge, or anything you can't confirm, write that the team will check and come back shortly.`;
  return runDirect(content, [{ role: "user", content: `Guest's WhatsApp message(s):\n\n${guestMessage.trim().slice(0, 4000)}` }], onDelta, signal, system);
}
