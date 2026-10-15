import type { Section, SiteContent } from "@/cms/types";

/* Builds the agent's knowledge from the live site content, so answers stay grounded in what the resort publishes. */

const SKIP = new Set([
  "image", "images", "src", "url", "icon", "variant", "pos", "w", "h", "ratio", "size", "overlay", "layout", "mediaLayout", "imagePosition",
  "align", "columns", "gridColumns", "compact", "illustrations", "menuImage", "videoId", "newTab", "style", "sticky", "mediaWidth", "id", "alt",
  "tone", "spacing", "anchor", "maps", "mapQuery", "instagram", "divider", "contactBox", "contactMessage", "variant", "buttons", "links",
]);

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const clean = (s: string) => s.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();

function collect(v: unknown, out: string[]) {
  if (v == null) return;
  if (typeof v === "string") {
    const s = clean(v);
    if (s && !/^(#\/|\{|https?:|mailto:|idb:)/.test(s) && !/^[\w.-]+\.(jpe?g|png|webp|gif)$/i.test(s)) out.push(s);
    return;
  }
  if (Array.isArray(v)) return v.forEach((x) => collect(x, out));
  if (typeof v === "object") for (const [k, x] of Object.entries(v as Record<string, unknown>)) if (!SKIP.has(k)) collect(x, out);
}

function sectionText(s: Section): string[] {
  const d = s.data;
  const out: string[] = [];
  if (s.type === "chapters" || s.type === "inquiry") return out;
  if (s.type === "faq") {
    for (const g of arr<{ title?: string; items?: { q: string; a: string }[] }>(d.groups)) {
      if (g.title) out.push(`${g.title}:`);
      for (const it of arr<{ q: string; a: string }>(g.items)) out.push(`Q: ${clean(it.q)}\nA: ${clean(it.a)}`);
    }
    return out;
  }
  if (s.type === "pricing") {
    if (d.title) out.push(String(d.title));
    if (d.aside) out.push(String(d.aside));
    for (const g of arr<{ title?: string; rows?: { name: string; price?: string; text?: string }[] }>(d.groups)) {
      if (g.title) out.push(`${g.title}:`);
      for (const r of arr<{ name: string; price?: string; text?: string }>(g.rows)) out.push(`- ${r.name}${r.price ? `: ${r.price}` : ""}${r.text ? ` — ${clean(r.text)}` : ""}`);
    }
    collect(d.items, out);
    return out;
  }
  if (s.type === "steps") {
    collect({ eyebrow: d.eyebrow, title: d.title, lead: d.lead }, out);
    arr<{ title: string; text: string }>(d.steps).forEach((st, i) => out.push(`${i + 1}. ${st.title}: ${st.text}`));
    arr<{ title: string; text: string }>(d.facts).forEach((f) => out.push(`${f.title}: ${f.text}`));
    return out;
  }
  if (s.type === "menu") {
    collect({ title: d.title, intro: d.intro, cardTitle: d.cardTitle, cardSubtitle: d.cardSubtitle }, out);
    arr<{ name: string; text?: string; price?: string }>(d.items).forEach((it) => out.push(`- ${it.name}${it.price ? ` (${it.price})` : ""}${it.text ? `: ${it.text}` : ""}`));
    return out;
  }
  collect(d, out);
  return out;
}

export function buildKnowledge(c: SiteContent, maxChars = 26000) {
  const s = c.site;
  const lines: string[] = [
    "## Contact & booking",
    `Resort: ${s.fullName}`,
    `Email: ${s.email}`,
    `WhatsApp: ${s.whatsappDisplay} (https://wa.me/${s.whatsappNumber})`,
    `Address: ${s.address}`,
    `Online booking: ${s.bookingUrl}`,
    `Website: ${s.siteUrl}`,
  ];
  if (s.inquiryRooms.length) lines.push(`Room types listed in the inquiry form: ${s.inquiryRooms.join("; ")}`);
  for (const p of c.pages) {
    const pageLines: string[] = [];
    for (const sec of p.sections) {
      if (sec.hidden) continue;
      const t = sectionText(sec);
      if (t.length) pageLines.push(t.join("\n"));
    }
    if (pageLines.length) lines.push("", `## ${p.title}`, ...pageLines);
  }
  const seen = new Set<string>();
  const text = lines
    .join("\n")
    .split("\n")
    .filter((l) => {
      const k = l.trim();
      if (k.length < 30 || k.startsWith("##")) return true;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n…` : text;
}

export function fillPersona(c: SiteContent) {
  const s = c.site;
  const swap: [string, string][] = [
    ["{name}", c.agent.name],
    ["{fullName}", s.fullName],
    ["{whatsapp}", s.whatsappDisplay],
    ["{email}", s.email],
    ["{bookingUrl}", s.bookingUrl],
  ];
  return swap.reduce((txt, [k, v]) => txt.split(k).join(v), c.agent.persona || "");
}

export function buildSystemPrompt(c: SiteContent) {
  const parts = [fillPersona(c)];
  if (c.agent.useSiteKnowledge) parts.push(`RESORT KNOWLEDGE (from the official website)\n${buildKnowledge(c)}`);
  if (c.agent.extraKnowledge.trim()) parts.push(`ADDITIONAL NOTES FROM THE TEAM\n${c.agent.extraKnowledge.trim()}`);
  parts.push(`Today's date: ${new Date().toDateString()}.`);
  return parts.join("\n\n");
}
