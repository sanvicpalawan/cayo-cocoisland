import { uid } from "./idb";
import { SECTION_TYPES } from "./schema";
import type { Page, Section, SectionType, SiteContent } from "./types";

export const findPage = (c: SiteContent, pageId: string) => c.pages.find((p) => p.id === pageId);

export function move<T>(arr: T[], index: number, dir: number) {
  const to = index + dir;
  if (index < 0 || to < 0 || to >= arr.length) return;
  const [x] = arr.splice(index, 1);
  arr.splice(to, 0, x);
}

export function newSection(type: SectionType): Section {
  const def = SECTION_TYPES[type];
  return { id: uid(), type, ...(def.defaultTone ? { tone: def.defaultTone } : {}), data: def.create() };
}

export function addSection(c: SiteContent, pageId: string, type: SectionType, afterId?: string) {
  const p = findPage(c, pageId);
  if (!p) return null;
  const s = newSection(type);
  const i = afterId ? p.sections.findIndex((x) => x.id === afterId) : -1;
  if (i >= 0) p.sections.splice(i + 1, 0, s);
  else p.sections.push(s);
  return s.id;
}

export function moveSection(c: SiteContent, pageId: string, sectionId: string, dir: number) {
  const p = findPage(c, pageId);
  if (p) move(p.sections, p.sections.findIndex((s) => s.id === sectionId), dir);
}

export function duplicateSection(c: SiteContent, pageId: string, sectionId: string) {
  const p = findPage(c, pageId);
  const i = p ? p.sections.findIndex((s) => s.id === sectionId) : -1;
  if (!p || i < 0) return null;
  const copy = structuredClone(p.sections[i]);
  copy.id = uid();
  if (copy.anchor) copy.anchor = `${copy.anchor}-2`;
  p.sections.splice(i + 1, 0, copy);
  return copy.id;
}

export function deleteSection(c: SiteContent, pageId: string, sectionId: string) {
  const p = findPage(c, pageId);
  if (p) p.sections = p.sections.filter((s) => s.id !== sectionId);
}

export function toggleSection(c: SiteContent, pageId: string, sectionId: string) {
  const s = findPage(c, pageId)?.sections.find((x) => x.id === sectionId);
  if (s) s.hidden = !s.hidden;
}

export function replaceSection(c: SiteContent, pageId: string, next: Section) {
  const p = findPage(c, pageId);
  const i = p ? p.sections.findIndex((s) => s.id === next.id) : -1;
  if (p && i >= 0) p.sections[i] = next;
}

export const slugify = (s: string) =>
  "/" +
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function uniqueSlug(c: SiteContent, wanted: string, ignoreId?: string) {
  const base = wanted === "/" ? "/" : wanted.replace(/\/+$/, "") || "/page";
  let slug = base;
  let i = 2;
  while (c.pages.some((p) => p.slug === slug && p.id !== ignoreId)) slug = `${base === "/" ? "/home" : base}-${i++}`;
  return slug;
}

export function setPageSlug(c: SiteContent, pageId: string, raw: string) {
  const p = findPage(c, pageId);
  if (!p) return;
  const cleaned = raw.trim() === "/" ? "/" : slugify(raw.replace(/^\/+/, ""));
  p.slug = uniqueSlug(c, cleaned, pageId);
}

export function addPage(c: SiteContent, title: string): Page {
  const page: Page = {
    id: uid(),
    slug: uniqueSlug(c, slugify(title) === "/" ? "/page" : slugify(title)),
    title,
    seoTitle: title,
    seoDescription: "",
    sections: [{ id: uid(), type: "pageHeader", tone: "shell", data: { eyebrow: c.site.name, title, lead: "", buttons: [] } }, newSection("split")],
  };
  c.pages.push(page);
  return page;
}

export function duplicatePage(c: SiteContent, pageId: string) {
  const p = findPage(c, pageId);
  if (!p) return null;
  const copy = structuredClone(p);
  copy.id = uid();
  copy.title = `${p.title} (copy)`;
  copy.slug = uniqueSlug(c, `${p.slug === "/" ? "/home" : p.slug}-copy`);
  copy.sections.forEach((s) => (s.id = uid()));
  c.pages.push(copy);
  return copy;
}
