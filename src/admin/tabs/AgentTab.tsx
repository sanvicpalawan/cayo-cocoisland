import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, KeyRound, LoaderCircle, Plus, RefreshCw, RotateCcw, Search, Send, Trash2, TriangleAlert, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useCms } from "@/cms/store";
import { downloadBlob, uid } from "@/cms/idb";
import { DEFAULT_PERSONA } from "@/cms/defaults";
import { Icon } from "@/cms/icons";
import { number, range, strings, text, textarea, toggle, type Field } from "@/cms/schema";
import type { AgentConfig } from "@/cms/types";
import { agentLocal, maskKey, useAgentLocal } from "@/agent/local";
import { chatProxy, checkKey, fetchModels, priceLabel } from "@/agent/openrouter";
import { buildKnowledge } from "@/agent/prompt";
import { buildWorkerScript } from "@/agent/worker";
import { draftWhatsAppReply, useAgentChat, useAgentMode } from "@/agent/useAgentChat";
import { ChatWindow } from "@/components/AgentWidget";
import { Card, FieldsEditor, Label, btnCls, inputCls, primaryBtn } from "../fields";

const AGENT_FIELDS: Field[] = [
  toggle("enabled", "Show the chat assistant on the website", { help: "Visitors without a public chat endpoint always get the normal WhatsApp button instead." }),
  text("name", "Assistant name"),
  text("subtitle", "Line under the name"),
  textarea("greeting", "Greeting message", 2),
  text("launcherLabel", "Chat button label"),
  strings("quickReplies", "Suggested questions", { addLabel: "Add question" }),
  textarea("persona", "Personality & rules", 12, { help: "Placeholders: {name}, {fullName}, {whatsapp}, {email}, {bookingUrl}" }),
  toggle("useSiteKnowledge", "Use the website content as knowledge", { help: "Rooms, inclusions, FAQs, transfers and policies are included automatically and follow your edits." }),
  textarea("extraKnowledge", "Extra knowledge", 5, { help: "Facts guests ask about that aren't on the website. The agent treats this as true — keep it accurate." }),
  range("temperature", "Creativity", 0, 1.2, 0.1),
  number("maxTokens", "Maximum reply length (tokens)", { min: 100, max: 2000, step: 50 }),
  toggle("handoff", "Show “Continue on WhatsApp” in the chat"),
  text("handoffLabel", "Hand-off button label", { when: (v) => v.handoff }),
];

const ago = (t: number) => {
  if (!t) return "never";
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
};

function KeysCard() {
  const local = useAgentLocal();
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [checking, setChecking] = useState<string | null>(null);
  const check = async (id: string, value: string) => {
    setChecking(id);
    const status = await checkKey(value);
    agentLocal.set((s) => ({ keys: s.keys.map((k) => (k.id === id ? { ...k, status } : k)) }));
    setChecking(null);
  };
  const add = async () => {
    const value = key.trim();
    if (!value) return;
    if (local.keys.some((k) => k.key === value)) return alert("This key is already added.");
    const id = uid();
    agentLocal.set((s) => ({ keys: [...s.keys, { id, label: label.trim() || `Key ${s.keys.length + 1}`, key: value }] }));
    setKey("");
    setLabel("");
    await check(id, value);
  };
  const refreshAll = async () => {
    for (const k of agentLocal.get().keys) await check(k.id, k.key);
  };
  const makeFirst = (id: string) => agentLocal.set((s) => ({ keys: [...s.keys.filter((k) => k.id === id), ...s.keys.filter((k) => k.id !== id)] }));
  return (
    <Card
      title="OpenRouter API keys"
      help={
        <>
          Stored only in this browser — never published or exported. Get keys at{" "}
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-700 underline">
            openrouter.ai/keys
          </a>
          .
        </>
      }
      actions={
        local.keys.length ? (
          <button type="button" className={btnCls} onClick={refreshAll} disabled={!!checking}>
            <RefreshCw className={cn("size-3.5", checking && "animate-spin")} /> Refresh keys
          </button>
        ) : null
      }
    >
      <ul className="space-y-2">
        {local.keys.map((k, i) => {
          const st = k.status;
          return (
            <li key={k.id} className="rounded-lg border border-zinc-200 p-2.5">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 shrink-0 text-zinc-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">
                    {k.label} {i === 0 ? <span className="ml-1 rounded bg-zinc-100 px-1.5 py-px text-[10px] font-semibold uppercase text-zinc-600">tried first</span> : null}
                  </p>
                  <p className="font-mono text-[11px] text-zinc-500">{maskKey(k.key)}</p>
                </div>
                {checking === k.id ? (
                  <LoaderCircle className="size-4 animate-spin text-zinc-400" />
                ) : st ? (
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", st.ok && !st.error ? "bg-emerald-100 text-emerald-800" : st.ok ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700")}>{st.ok && !st.error ? "Valid" : st.ok ? "Warning" : "Invalid"}</span>
                ) : (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">Unchecked</span>
                )}
              </div>
              {st ? (
                <p className="mt-1.5 text-[11px] leading-snug text-zinc-600">
                  {st.ok
                    ? [
                        st.usage !== undefined ? `Used $${st.usage.toFixed(2)}` : null,
                        st.limit != null ? `limit $${st.limit}` : "no spending limit",
                        st.remaining != null ? `$${st.remaining.toFixed(2)} remaining` : null,
                        st.freeTier ? "free tier" : null,
                        st.daily ?? null,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : null}
                  {st.error ? <span className="block text-red-600">{st.error}</span> : null}
                  <span className="block text-zinc-400">Checked {ago(st.checkedAt)}</span>
                </p>
              ) : null}
              <div className="mt-2 flex gap-1.5">
                <button type="button" className={btnCls} onClick={() => check(k.id, k.key)} disabled={!!checking}>
                  <RefreshCw className="size-3.5" /> Check
                </button>
                {i > 0 ? (
                  <button type="button" className={btnCls} onClick={() => makeFirst(k.id)}>
                    Use first
                  </button>
                ) : null}
                <button type="button" className={cn(btnCls, "ml-auto hover:bg-red-50 hover:text-red-700")} onClick={() => confirm(`Remove “${k.label}” from this browser?`) && agentLocal.set((s) => ({ keys: s.keys.filter((x) => x.id !== k.id) }))} aria-label={`Remove ${k.label}`}>
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 space-y-2 rounded-lg bg-zinc-50 p-2.5">
        <div className="grid grid-cols-[1fr_2fr] gap-1.5">
          <input className={inputCls} placeholder="Label" aria-label="Key label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <input className={cn(inputCls, "font-mono")} type="password" autoComplete="off" placeholder="sk-or-v1-…" aria-label="OpenRouter API key" value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        </div>
        <button type="button" className={primaryBtn} onClick={add} disabled={!key.trim()}>
          <Plus className="size-4" /> Add & verify key
        </button>
      </div>
      <div className="mt-3">
        <Label htmlFor="rotation">When a key fails or hits its limit</Label>
        <select id="rotation" className={inputCls} value={local.rotation} onChange={(e) => agentLocal.set({ rotation: e.target.value as "failover" | "roundrobin" })}>
          <option value="failover">Failover — always start with the first key, move on when it fails</option>
          <option value="roundrobin">Round robin — spread requests across all keys</option>
        </select>
      </div>
    </Card>
  );
}

function ModelsCard() {
  const { content, update } = useCms();
  const local = useAgentLocal();
  const a = content.agent;
  const [filter, setFilter] = useState<"free" | "paid" | "all">("free");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [limit, setLimit] = useState(30);
  const refresh = async () => {
    setLoading(true);
    setErr("");
    try {
      agentLocal.set({ models: await fetchModels(), modelsAt: Date.now() });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!agentLocal.get().models.length) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const byId = useMemo(() => new Map(local.models.map((m) => [m.id, m])), [local.models]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return local.models.filter((m) => (filter === "all" || (filter === "free") === m.free) && (!needle || `${m.name} ${m.id}`.toLowerCase().includes(needle)));
  }, [local.models, filter, q]);
  const freeCount = local.models.filter((m) => m.free).length;
  const setPrimary = (id: string) =>
    update((d) => {
      d.agent.model = id;
      d.agent.fallbacks = d.agent.fallbacks.filter((f) => f !== id);
    });
  const addFallback = (id: string) =>
    update((d) => {
      if (d.agent.model !== id && !d.agent.fallbacks.includes(id)) d.agent.fallbacks = [...d.agent.fallbacks, id].slice(0, 5);
    });
  const chip = (id: string, primary: boolean) => {
    const m = byId.get(id);
    return (
      <li key={id} className={cn("flex items-center gap-2 rounded-lg border p-2", primary ? "border-emerald-600/40 bg-emerald-50/60" : "border-zinc-200")}>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">{m?.name ?? id}</p>
          <p className="truncate font-mono text-[11px] text-zinc-500">
            {id} {m ? `· ${priceLabel(m)}` : ""}
          </p>
        </div>
        {!primary ? (
          <>
            <button type="button" className={btnCls} onClick={() => setPrimary(id)}>
              Primary
            </button>
            <button type="button" className="grid size-7 place-items-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" aria-label={`Remove fallback ${id}`} onClick={() => update((d) => void (d.agent.fallbacks = d.agent.fallbacks.filter((f) => f !== id)))}>
              <X className="size-4" />
            </button>
          </>
        ) : (
          <span className="text-[11px] font-semibold uppercase text-emerald-800">Primary</span>
        )}
      </li>
    );
  };
  return (
    <Card
      title="Models"
      help={`The agent tries the primary model first, then each fallback. Catalogue updated ${ago(local.modelsAt)} · ${local.models.length} models (${freeCount} free).`}
      actions={
        <button type="button" className={btnCls} onClick={refresh} disabled={loading}>
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} /> Refresh models
        </button>
      }
    >
      <ul className="space-y-1.5">
        {chip(a.model, true)}
        {a.fallbacks.map((f) => chip(f, false))}
      </ul>
      {err ? <p className="mt-2 text-xs text-red-600">Couldn't load models: {err}</p> : null}
      <div className="mt-3 flex gap-1.5">
        <div className="flex rounded-md bg-zinc-100 p-0.5 text-[12px]">
          {(["free", "paid", "all"] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn("rounded px-2 py-1", filter === f ? "bg-white font-semibold shadow-sm" : "text-zinc-600")}>
              {f === "free" ? "Free" : f === "paid" ? "Paid" : "All"}
            </button>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <input className={cn(inputCls, "pl-7")} placeholder="Search models" aria-label="Search models" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <ul className="mt-2 max-h-80 divide-y divide-zinc-100 overflow-y-auto rounded-lg border border-zinc-200">
        {list.slice(0, limit).map((m) => {
          const used = m.id === a.model || a.fallbacks.includes(m.id);
          return (
            <li key={m.id} className="flex items-center gap-2 p-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium" title={m.description}>
                  {m.name}
                </p>
                <p className="truncate text-[11px] text-zinc-500">
                  <span className={m.free ? "font-semibold text-emerald-700" : ""}>{priceLabel(m)}</span> · {Math.round(m.context / 1000)}K context
                </p>
              </div>
              {used ? (
                <Check className="size-4 text-emerald-700" aria-label="In use" />
              ) : (
                <>
                  <button type="button" className={btnCls} onClick={() => setPrimary(m.id)}>
                    Primary
                  </button>
                  <button type="button" className={btnCls} onClick={() => addFallback(m.id)} aria-label={`Add ${m.name} as fallback`}>
                    <Plus className="size-3.5" />
                  </button>
                </>
              )}
            </li>
          );
        })}
        {!list.length ? <li className="p-3 text-center text-xs text-zinc-500">{loading ? "Loading models…" : "No models match."}</li> : null}
      </ul>
      {list.length > limit ? (
        <button type="button" className={cn(btnCls, "mt-2 w-full")} onClick={() => setLimit((l) => l + 40)}>
          Show more ({list.length - limit})
        </button>
      ) : null}
      <p className="mt-2 text-[11px] leading-snug text-zinc-500">Free models are rate-limited by OpenRouter (requests per minute and per day) and can change without notice — keep a fallback, or add a paid model for reliability.</p>
    </Card>
  );
}

function DeployCard() {
  const { content, update } = useCms();
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const testEndpoint = async () => {
    setBusy(true);
    setTest(null);
    try {
      const r = await chatProxy(content.agent.proxyUrl.trim(), [{ role: "user", content: "Hello! What is included in a stay?" }]);
      setTest({ ok: true, text: `${r.model}: ${r.text.slice(0, 160)}…` });
    } catch (e) {
      setTest({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card title="WhatsApp & public website chat" help="To answer real WhatsApp guests automatically — and to let every website visitor use the chat — deploy the generated worker. It keeps your keys server-side.">
      <button type="button" className={primaryBtn} onClick={() => downloadBlob(new Blob([buildWorkerScript(content)], { type: "text/javascript" }), "cayo-coco-whatsapp-agent.js")}>
        <Download className="size-4" /> Download WhatsApp agent (Cloudflare Worker)
      </button>
      <details className="mt-3 rounded-md bg-zinc-50 p-3 text-[12px] leading-relaxed text-zinc-700">
        <summary className="font-semibold text-zinc-800">Setup steps</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Create a Worker at dash.cloudflare.com and paste the downloaded file.</li>
          <li>Add secrets: OPENROUTER_API_KEYS (comma-separated), WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN.</li>
          <li>Meta for Developers → WhatsApp → Configuration: callback URL https://&lt;worker&gt;/webhook, same verify token, subscribe to “messages”.</li>
          <li>Paste https://&lt;worker&gt;/chat below so website visitors can use the chat.</li>
          <li>Re-download the worker whenever you change the agent or site content.</li>
        </ol>
      </details>
      <div className="mt-3">
        <Label htmlFor="proxy">Public chat endpoint</Label>
        <input id="proxy" className={inputCls} placeholder="https://your-worker.workers.dev/chat" value={content.agent.proxyUrl} onChange={(e) => update((d) => void (d.agent.proxyUrl = e.target.value))} />
        <div className="mt-2 flex items-center gap-2">
          <button type="button" className={btnCls} disabled={!/^https?:\/\//.test(content.agent.proxyUrl.trim()) || busy} onClick={testEndpoint}>
            {busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Test endpoint
          </button>
          {test ? <span className={cn("min-w-0 flex-1 truncate text-[11px]", test.ok ? "text-emerald-700" : "text-red-600")}>{test.text}</span> : null}
        </div>
      </div>
    </Card>
  );
}

function BehaviourPanel() {
  const { content, update } = useCms();
  const [show, setShow] = useState(false);
  const knowledge = useMemo(() => (show ? buildKnowledge(content) : ""), [show, content]);
  return (
    <div className="space-y-4">
      <FieldsEditor fields={AGENT_FIELDS} value={content.agent} onChange={(v: AgentConfig) => update((d) => void (d.agent = v))} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnCls} onClick={() => setShow((s) => !s)}>
          {show ? "Hide" : "Preview"} website knowledge
        </button>
        <button type="button" className={btnCls} onClick={() => confirm("Restore the original personality & rules?") && update((d) => void (d.agent.persona = DEFAULT_PERSONA))}>
          <RotateCcw className="size-3.5" /> Reset personality
        </button>
      </div>
      {show ? (
        <div>
          <p className="mb-1 text-[11px] text-zinc-500">{knowledge.length.toLocaleString()} characters sent with each conversation</p>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-zinc-200">{knowledge}</pre>
        </div>
      ) : null}
    </div>
  );
}

function TestPanel() {
  const chat = useAgentChat({ forceDirect: true });
  const last = [...chat.messages].reverse().find((m) => m.role === "assistant");
  return (
    <div className="space-y-2">
      <p className="text-[12px] text-zinc-600">Chat as a guest would. Uses the keys and models above, from this browser.</p>
      <ChatWindow chat={chat} embedded />
      {last?.model ? <p className="text-[11px] text-zinc-500">Last reply by {last.model}</p> : null}
    </div>
  );
}

function WhatsAppPanel() {
  const { content } = useCms();
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [tone, setTone] = useState("warm");
  const [reply, setReply] = useState("");
  const [meta, setMeta] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const draft = async () => {
    setBusy(true);
    setErr("");
    setReply("");
    setMeta("");
    try {
      const r = await draftWhatsAppReply(content, msg, tone, setReply);
      setReply(r.text);
      setMeta(`${r.model} · ${(r.ms / 1000).toFixed(1)}s`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const digits = phone.replace(/\D/g, "");
  const waHref = `https://wa.me/${digits}?text=${encodeURIComponent(reply)}`;
  return (
    <div className="space-y-3">
      <p className="text-[12px] leading-relaxed text-zinc-600">Paste a guest's WhatsApp message and the agent drafts a reply from your website knowledge. Review it, then send it from your own WhatsApp in one tap.</p>
      <div>
        <Label htmlFor="wa-phone">Guest's WhatsApp number (optional, with country code)</Label>
        <input id="wa-phone" className={inputCls} inputMode="tel" placeholder="+44 7700 900123" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="wa-msg">Guest's message</Label>
        <textarea id="wa-msg" rows={5} className={inputCls} placeholder="Hi! We arrive in El Nido on the 12th — how do we get to the island and is breakfast included?" value={msg} onChange={(e) => setMsg(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <select aria-label="Tone" className={cn(inputCls, "w-40")} value={tone} onChange={(e) => setTone(e.target.value)}>
          <option value="warm">Warm & friendly</option>
          <option value="professional">Professional</option>
          <option value="brief">Brief</option>
        </select>
        <button type="button" className={cn(primaryBtn, "flex-1")} disabled={!msg.trim() || busy} onClick={draft}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />} {reply ? "Draft again" : "Draft reply"}
        </button>
      </div>
      {err ? <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{err}</p> : null}
      {reply ? (
        <div className="space-y-2">
          <Label htmlFor="wa-reply">Reply (edit before sending)</Label>
          <textarea id="wa-reply" rows={8} className={cn(inputCls, "bg-[#d9fdd3]/40")} value={reply} onChange={(e) => setReply(e.target.value)} />
          {meta ? <p className="text-[11px] text-zinc-500">Drafted by {meta}</p> : null}
          <div className="flex flex-wrap gap-2">
            <a href={waHref} target="_blank" rel="noopener noreferrer" className={cn(primaryBtn, "bg-[#00a884] hover:bg-[#008f6f]")}>
              <Icon name="brand:whatsapp" className="size-4" /> {digits ? "Open chat & send" : "Choose chat & send"}
            </a>
            <button
              type="button"
              className={btnCls}
              onClick={() => {
                navigator.clipboard?.writeText(reply);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AgentTab() {
  const mode = useAgentMode();
  const directMode = useAgentMode(true);
  const { content } = useCms();
  const [tab, setTab] = useState<"connection" | "behaviour" | "test" | "whatsapp">("connection");
  const status =
    mode === "proxy"
      ? { tone: "bg-emerald-50 text-emerald-900 border-emerald-200", text: "Website chat is live for all visitors through your public chat endpoint." }
      : mode === "direct"
        ? { tone: "bg-amber-50 text-amber-900 border-amber-200", text: "The chat works in this browser only (it uses your keys). Visitors see the WhatsApp button until you add a public chat endpoint." }
        : { tone: "bg-zinc-50 text-zinc-700 border-zinc-200", text: "Add an OpenRouter key to test the agent. Until then visitors see the WhatsApp button." };
  return (
    <div className="space-y-4 p-4">
      <div className={cn("flex gap-2 rounded-lg border p-3 text-[12px] leading-snug", status.tone)}>
        {mode === "proxy" ? <Check className="mt-0.5 size-4 shrink-0" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0" />}
        <p>
          {status.text}
          {!content.agent.enabled ? " The assistant is currently switched off in Behaviour." : ""}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-zinc-100 p-1 text-[12px]" role="tablist">
        {(
          [
            ["connection", "Connection"],
            ["behaviour", "Behaviour"],
            ["test", "Test chat"],
            ["whatsapp", "WhatsApp"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("rounded-md px-2 py-1.5", tab === id ? "bg-white font-semibold shadow-sm" : "text-zinc-600")}>
            {label}
          </button>
        ))}
      </div>
      {tab === "connection" ? (
        <div className="space-y-4">
          <KeysCard />
          <ModelsCard />
          <DeployCard />
        </div>
      ) : null}
      {tab === "behaviour" ? <BehaviourPanel /> : null}
      {tab === "test" ? directMode === "none" ? <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-[13px] text-zinc-600">Add and verify an OpenRouter key in Connection first.</p> : <TestPanel /> : null}
      {tab === "whatsapp" ? directMode === "none" ? <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-[13px] text-zinc-600">Add and verify an OpenRouter key in Connection first.</p> : <WhatsAppPanel /> : null}
    </div>
  );
}
