import type { SiteContent } from "@/cms/types";
import { buildSystemPrompt } from "./prompt";

/**
 * Generates a ready-to-deploy Cloudflare Worker that answers WhatsApp guests through the
 * WhatsApp Cloud API and also serves the website chat (so keys never live in the browser).
 */
const TEMPLATE = `/**
 * Cayo Coco — AI concierge for WhatsApp + website chat (Cloudflare Worker)
 * Generated __DATE__ by the Cayo Coco admin. Re-download after changing the agent or site content.
 *
 * ENDPOINTS
 *   GET  /webhook   WhatsApp Cloud API webhook verification
 *   POST /webhook   Incoming WhatsApp messages -> AI reply sent back to the guest
 *   POST /chat      Website chat widget. Paste https://<your-worker>/chat into
 *                   Admin -> AI Agent -> Connection -> Public chat endpoint
 *   GET  /health    Status check
 *
 * SETUP (about 15 minutes)
 *   1. dash.cloudflare.com -> Workers & Pages -> Create -> Worker. Replace the code with this file and deploy.
 *   2. Worker -> Settings -> Variables and secrets. Add as SECRETS:
 *        OPENROUTER_API_KEYS       one or more OpenRouter keys, comma-separated (rotated automatically on errors)
 *        WHATSAPP_TOKEN            permanent access token (Meta for Developers -> your app -> WhatsApp)
 *        WHATSAPP_PHONE_NUMBER_ID  "Phone number ID" from WhatsApp -> API setup
 *        WHATSAPP_VERIFY_TOKEN     any secret phrase you choose (used once, in step 4)
 *      Optional:
 *        ALLOWED_ORIGIN            e.g. https://cayococoisland.com (website chat CORS, defaults to *)
 *   3. Optional memory: create a KV namespace and bind it to the worker as HISTORY so the agent
 *      remembers the last messages of each guest for 7 days.
 *   4. Meta for Developers -> WhatsApp -> Configuration -> Webhook:
 *        Callback URL  https://<your-worker>.workers.dev/webhook
 *        Verify token  the same WHATSAPP_VERIFY_TOKEN
 *      Then subscribe to the "messages" webhook field.
 *   5. Send a WhatsApp message to your business number to test.
 *
 * Guests can always reach a human: messages containing a hand-off phrase get the hand-off reply.
 */
const CONFIG = __CONFIG__;

const GRAPH = "https://graph.facebook.com/v21.0/";
const OPENROUTER = "https://openrouter.ai/api/v1/chat/completions";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    try {
      if (url.pathname === "/webhook" && request.method === "GET") return verifyWebhook(url, env);
      if (url.pathname === "/webhook" && request.method === "POST") {
        const body = await request.json().catch(function () { return null; });
        ctx.waitUntil(handleWhatsApp(body, env));
        return new Response("OK", { status: 200 });
      }
      if (url.pathname === "/chat" && request.method === "POST") return await handleWebChat(request, env, cors);
      if (url.pathname === "/health") return json({ ok: true, models: CONFIG.models, whatsapp: Boolean(env.WHATSAPP_TOKEN), keys: getKeys(env).length }, 200, cors);
      return new Response("Not found", { status: 404, headers: cors });
    } catch (err) {
      return json({ error: String((err && err.message) || err) }, 500, cors);
    }
  }
};

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: Object.assign({ "Content-Type": "application/json" }, headers || {}) });
}

function verifyWebhook(url, env) {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === env.WHATSAPP_VERIFY_TOKEN) return new Response(challenge || "", { status: 200 });
  return new Response("Forbidden", { status: 403 });
}

async function handleWhatsApp(body, env) {
  if (!body || !Array.isArray(body.entry)) return;
  for (const entry of body.entry) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const msg of value.messages || []) {
        const from = msg.from;
        if (!from) continue;
        await markRead(env, msg.id);
        if (msg.type !== "text" || !msg.text || !msg.text.body) {
          await sendWhatsApp(env, from, CONFIG.nonTextReply);
          continue;
        }
        const text = String(msg.text.body).slice(0, 2000);
        const lower = text.toLowerCase();
        if (CONFIG.handoffPhrases.some(function (p) { return lower.indexOf(p) !== -1; })) {
          await sendWhatsApp(env, from, CONFIG.handoffReply);
          continue;
        }
        const history = await loadHistory(env, from);
        history.push({ role: "user", content: text });
        let reply = CONFIG.errorReply;
        try {
          reply = (await askAI(history, env)).text;
        } catch (e) {
          console.log("AI error", String(e));
        }
        history.push({ role: "assistant", content: reply });
        await saveHistory(env, from, history);
        await sendWhatsApp(env, from, reply);
      }
    }
  }
}

async function handleWebChat(request, env, cors) {
  const body = await request.json().catch(function () { return null; });
  const messages = (body && Array.isArray(body.messages) ? body.messages : [])
    .filter(function (m) { return m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"; })
    .slice(-12)
    .map(function (m) { return { role: m.role, content: m.content.slice(0, 2000) }; });
  if (!messages.length) return json({ error: "No messages" }, 400, cors);
  try {
    const out = await askAI(messages, env);
    return json({ reply: out.text, model: out.model }, 200, cors);
  } catch (e) {
    return json({ error: "The concierge is unavailable right now. Please message us on WhatsApp." }, 502, cors);
  }
}

function getKeys(env) {
  return String(env.OPENROUTER_API_KEYS || env.OPENROUTER_API_KEY || "").split(",").map(function (k) { return k.trim(); }).filter(Boolean);
}

async function askAI(history, env) {
  const keys = getKeys(env);
  if (!keys.length) throw new Error("OPENROUTER_API_KEYS is not set");
  const messages = [{ role: "system", content: CONFIG.systemPrompt }].concat(history.slice(-12));
  let lastError = "";
  for (const model of CONFIG.models) {
    for (const key of keys) {
      const res = await fetch(OPENROUTER, {
        method: "POST",
        headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json", "HTTP-Referer": CONFIG.siteUrl, "X-Title": CONFIG.siteName + " concierge" },
        body: JSON.stringify({ model: model, messages: messages, temperature: CONFIG.temperature, max_tokens: CONFIG.maxTokens })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data && data.choices && data.choices[0] && data.choices[0].message ? String(data.choices[0].message.content || "").trim() : "";
        if (text) return { text: text, model: data.model || model };
        lastError = model + ": empty reply";
        break;
      }
      lastError = model + ": HTTP " + res.status;
      if ([401, 402, 403, 429].indexOf(res.status) !== -1) continue;
      break;
    }
  }
  throw new Error(lastError || "All models failed");
}

async function sendWhatsApp(env, to, text) {
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) return;
  await fetch(GRAPH + env.WHATSAPP_PHONE_NUMBER_ID + "/messages", {
    method: "POST",
    headers: { "Authorization": "Bearer " + env.WHATSAPP_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: to, type: "text", text: { preview_url: true, body: String(text).slice(0, 4096) } })
  });
}

async function markRead(env, messageId) {
  if (!messageId || !env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) return;
  try {
    await fetch(GRAPH + env.WHATSAPP_PHONE_NUMBER_ID + "/messages", {
      method: "POST",
      headers: { "Authorization": "Bearer " + env.WHATSAPP_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId })
    });
  } catch (e) {}
}

async function loadHistory(env, from) {
  if (!env.HISTORY) return [];
  try {
    const raw = await env.HISTORY.get("wa:" + from);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

async function saveHistory(env, from, history) {
  if (!env.HISTORY) return;
  try {
    await env.HISTORY.put("wa:" + from, JSON.stringify(history.slice(-12)), { expirationTtl: 60 * 60 * 24 * 7 });
  } catch (e) {}
}
`;

export function buildWorkerScript(c: SiteContent) {
  const a = c.agent;
  const config = {
    siteName: c.site.fullName,
    siteUrl: c.site.siteUrl,
    models: Array.from(new Set([a.model, ...a.fallbacks].map((m) => m.trim()).filter(Boolean))),
    temperature: a.temperature,
    maxTokens: a.maxTokens,
    systemPrompt: buildSystemPrompt(c),
    handoffPhrases: ["real person", "human", "talk to staff", "speak to someone", "staff member", "talk to someone"],
    handoffReply: `Of course! I've let the ${c.site.name} team know — a member of staff will reply here as soon as possible. For anything urgent you can also email ${c.site.email}.`,
    nonTextReply: `Thanks for your message! I can only read text here — our team will look at it soon. You can also email ${c.site.email}.`,
    errorReply: `Sorry, I'm having trouble answering right now. Our team will reply here as soon as possible — or email ${c.site.email}.`,
  };
  return TEMPLATE.replace("__CONFIG__", JSON.stringify(config, null, 2)).replace("__DATE__", new Date().toISOString().slice(0, 10));
}
