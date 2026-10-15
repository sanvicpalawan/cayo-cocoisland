import type { SiteSettings } from "./types";

export function whatsappLink(site: Pick<SiteSettings, "whatsappNumber">, text?: string) {
  const base = `https://wa.me/${(site.whatsappNumber || "").replace(/\D/g, "")}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export type UrlKind = "page" | "booking" | "whatsapp" | "email" | "phone" | "external" | "none";
export type ResolvedUrl = { href: string; external: boolean; internal: boolean; kind: UrlKind };

/**
 * Content URLs:
 *  #/cuisine · #/cuisine?s=breakfast   internal page / section
 *  #breakfast                          section on the current page
 *  {booking}                           booking engine from Contact settings
 *  {whatsapp} · {whatsapp:Hello!}      WhatsApp chat (optional pre-filled text)
 *  {email} · {email:Subject}           email with optional subject
 *  https://… · mailto: · tel:          as-is
 */
export function resolveUrl(raw: string | undefined, site: SiteSettings, currentPath = "/"): ResolvedUrl {
  const u = (raw ?? "").trim();
  if (!u) return { href: "#", external: false, internal: false, kind: "none" };
  if (u === "{booking}") return { href: site.bookingUrl, external: true, internal: false, kind: "booking" };
  let m = u.match(/^\{whatsapp(?::([\s\S]*))?\}$/);
  if (m) return { href: whatsappLink(site, m[1] || undefined), external: true, internal: false, kind: "whatsapp" };
  m = u.match(/^\{email(?::([\s\S]*))?\}$/);
  if (m) return { href: `mailto:${site.email}${m[1] ? `?subject=${encodeURIComponent(m[1])}` : ""}`, external: false, internal: false, kind: "email" };
  if (u.startsWith("#/")) return { href: u, external: false, internal: true, kind: "page" };
  if (u.startsWith("#")) return { href: `#${currentPath}?s=${encodeURIComponent(u.slice(1))}`, external: false, internal: true, kind: "page" };
  if (u.startsWith("/")) return { href: `#${u}`, external: false, internal: true, kind: "page" };
  if (u.startsWith("mailto:")) return { href: u, external: false, internal: false, kind: "email" };
  if (u.startsWith("tel:")) return { href: u, external: false, internal: false, kind: "phone" };
  if (/^https?:\/\//i.test(u)) return { href: u, external: true, internal: false, kind: "external" };
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(u)) return { href: `https://${u}`, external: true, internal: false, kind: "external" };
  return { href: u, external: false, internal: false, kind: "external" };
}

/** "#/cuisine?s=x" → "/cuisine" */
export function internalPath(href: string) {
  return href.startsWith("#/") ? href.slice(1).split("?")[0] || "/" : null;
}

export const URL_KIND_LABEL: Record<UrlKind, string> = {
  page: "Page on this site",
  booking: "Booking engine (opens in a new tab)",
  whatsapp: "WhatsApp chat (opens in a new tab)",
  email: "Opens the visitor's email app",
  phone: "Phone call",
  external: "External website (opens in a new tab)",
  none: "No link",
};
