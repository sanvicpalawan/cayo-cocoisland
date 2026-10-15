import type { ApiKey, KeyStatus, ModelInfo } from "./local";

const BASE = "https://openrouter.ai/api/v1";

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };
export type ChatResult = { text: string; model: string; keyId: string; ms: number };

export class AgentError extends Error {
  code: "no-key" | "failed" | "proxy";
  constructor(code: AgentError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)) ? Number(v) : undefined);

/** Public model catalogue — no key required. */
export async function fetchModels(): Promise<ModelInfo[]> {
  const res = await fetch(`${BASE}/models`);
  if (!res.ok) throw new Error(`OpenRouter returned ${res.status}`);
  const json = (await res.json()) as { data?: Record<string, unknown>[] };
  return (json.data ?? [])
    .filter((m) => {
      const arch = (m.architecture ?? {}) as { output_modalities?: string[]; input_modalities?: string[] };
      const out = arch.output_modalities ?? ["text"];
      const input = arch.input_modalities ?? ["text"];
      return out.includes("text") && !out.includes("audio") && !out.includes("image") && input.includes("text");
    })
    .map((m) => {
      const pricing = (m.pricing ?? {}) as Record<string, string>;
      const prompt = num(pricing.prompt) ?? 0;
      const completion = num(pricing.completion) ?? 0;
      return {
        id: String(m.id),
        name: String(m.name ?? m.id),
        prompt,
        completion,
        free: prompt === 0 && completion === 0,
        context: num(m.context_length) ?? 0,
        description: String(m.description ?? "").slice(0, 240),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function priceLabel(m: Pick<ModelInfo, "free" | "prompt" | "completion">) {
  if (m.free) return "Free";
  if (m.prompt < 0 || m.completion < 0) return "Variable price";
  const f = (v: number) => (v * 1e6 >= 10 ? (v * 1e6).toFixed(0) : (v * 1e6).toFixed(2));
  return `$${f(m.prompt)} in · $${f(m.completion)} out / 1M tokens`;
}

/** GET /api/v1/key — validity, usage, limits and free-tier status of a key. */
export async function checkKey(key: string): Promise<KeyStatus> {
  try {
    const res = await fetch(`${BASE}/key`, { headers: { Authorization: `Bearer ${key.trim()}` } });
    const json = (await res.json().catch(() => ({}))) as { data?: Record<string, unknown>; error?: { message?: string } };
    if (!res.ok) return { ok: false, checkedAt: Date.now(), error: json.error?.message ?? `HTTP ${res.status}` };
    const d = json.data ?? {};
    const daily = d.free_model_daily_requests as Record<string, unknown> | undefined;
    let dailyText: string | undefined;
    if (daily && typeof daily === "object") {
      const remaining = num(daily.remaining);
      const limit = num(daily.limit ?? daily.ceiling);
      dailyText = remaining !== undefined && limit !== undefined ? `${remaining}/${limit} free-model requests left today` : undefined;
    }
    return {
      ok: true,
      checkedAt: Date.now(),
      label: typeof d.label === "string" ? d.label : undefined,
      usage: num(d.usage),
      limit: (num(d.limit) ?? null) as number | null,
      remaining: (num(d.limit_remaining) ?? null) as number | null,
      freeTier: !!d.is_free_tier,
      daily: dailyText,
    };
  } catch {
    return { ok: false, checkedAt: Date.now(), error: "Network error — could not reach OpenRouter" };
  }
}

async function errorText(res: Response) {
  const raw = await res.text().catch(() => "");
  try {
    const j = JSON.parse(raw) as { error?: { message?: string; metadata?: { raw?: string } } };
    return j.error?.message || raw.slice(0, 160) || `HTTP ${res.status}`;
  } catch {
    return raw.slice(0, 160) || `HTTP ${res.status}`;
  }
}

async function readStream(res: Response, onDelta?: (full: string) => void) {
  let text = "";
  let model = "";
  let error = "";
  const type = res.headers.get("content-type") ?? "";
  if (!res.body || !type.includes("text/event-stream")) {
    const j = (await res.json().catch(() => ({}))) as { choices?: { message?: { content?: string } }[]; model?: string; error?: { message?: string } };
    return { text: j.choices?.[0]?.message?.content ?? "", model: j.model ?? "", error: j.error?.message ?? "" };
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue; // ": OPENROUTER PROCESSING" keep-alives
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const j = JSON.parse(data) as { model?: string; error?: { message?: string }; choices?: { delta?: { content?: string }; finish_reason?: string }[] };
        if (j.model) model = j.model;
        if (j.error) error = j.error.message ?? "stream error";
        const ch = j.choices?.[0];
        if (ch?.delta?.content) {
          text += ch.delta.content;
          onDelta?.(text);
        }
        if (ch?.finish_reason === "error" && !error) error = "the provider stopped with an error";
      } catch {
        /* partial / non-JSON line */
      }
    }
  }
  return { text, model, error };
}

export type ChatOptions = {
  messages: ChatMsg[];
  models: string[];
  keys: ApiKey[];
  temperature: number;
  maxTokens: number;
  onDelta?: (full: string) => void;
  onKeyError?: (keyId: string, status: number, message: string) => void;
  signal?: AbortSignal;
  siteUrl?: string;
  title?: string;
};

/** Streams a reply, failing over across keys (401/402/403/429) and then across models. */
export async function chatOpenRouter(o: ChatOptions): Promise<ChatResult> {
  if (!o.keys.length) throw new AgentError("no-key", "No OpenRouter API key is configured on this device.");
  const models = Array.from(new Set(o.models.map((m) => m.trim()).filter(Boolean)));
  if (!models.length) models.push("openrouter/free");
  const errors: string[] = [];
  const t0 = performance.now();
  for (const model of models) {
    for (const k of o.keys) {
      let res: Response;
      try {
        res = await fetch(`${BASE}/chat/completions`, {
          method: "POST",
          signal: o.signal,
          headers: {
            Authorization: `Bearer ${k.key.trim()}`,
            "Content-Type": "application/json",
            ...(o.siteUrl ? { "HTTP-Referer": o.siteUrl } : {}),
            "X-Title": o.title ?? "Cayo Coco concierge",
          },
          body: JSON.stringify({ model, messages: o.messages, temperature: o.temperature, max_tokens: o.maxTokens, stream: true }),
        });
      } catch (e) {
        if (o.signal?.aborted) throw e;
        errors.push(`${model}: network error`);
        break;
      }
      if (!res.ok) {
        const msg = await errorText(res);
        errors.push(`${model} (${k.label}): ${msg}`);
        if ([401, 402, 403, 429].includes(res.status)) {
          o.onKeyError?.(k.id, res.status, msg);
          continue; // try the next key
        }
        break; // try the next model
      }
      const out = await readStream(res, o.onDelta);
      if (out.text.trim()) return { text: out.text.trim(), model: out.model || model, keyId: k.id, ms: Math.round(performance.now() - t0) };
      errors.push(`${model}: ${out.error || "empty reply"}`);
      break;
    }
  }
  throw new AgentError("failed", errors.slice(-3).join(" · ") || "All models failed");
}

/** Public website mode: the deployed worker holds the keys and the system prompt. */
export async function chatProxy(url: string, messages: ChatMsg[], signal?: AbortSignal): Promise<ChatResult> {
  const t0 = performance.now();
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: messages.filter((m) => m.role !== "system") }) });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new AgentError("proxy", "The chat service could not be reached.");
  }
  const j = (await res.json().catch(() => ({}))) as { reply?: string; model?: string; error?: string };
  if (!res.ok || !j.reply) throw new AgentError("proxy", j.error ?? `Chat service error (${res.status})`);
  return { text: j.reply, model: j.model ?? "concierge", keyId: "proxy", ms: Math.round(performance.now() - t0) };
}
