import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight, Copy, ExternalLink, Eye, EyeOff, MousePointerClick, Plus, Trash2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { useAdmin } from "@/admin/context";
import { useCms } from "@/cms/store";
import { Icon } from "@/cms/icons";
import { addPage, addSection, deleteSection, duplicatePage, duplicateSection, findPage, moveSection, setPageSlug, toggleSection } from "@/cms/ops";
import { COMMON_FIELDS, SECTION_TYPES } from "@/cms/schema";
import type { Page, Section, SectionData } from "@/cms/types";
import { useRoute } from "@/lib/router";
import { FieldsEditor, IconBtn, Label, btnCls, dangerBtn, inputCls, primaryBtn } from "../fields";

const sectionTitle = (s: Section) => String(s.data.title || s.data.cardTitle || s.data.eyebrow || SECTION_TYPES[s.type].label).split("\n")[0];

function SectionEditor({ page, section: s, index, count, open, onToggle }: { page: Page; section: Section; index: number; count: number; open: boolean; onToggle: () => void }) {
  const { update } = useCms();
  const def = SECTION_TYPES[s.type];
  const title = sectionTitle(s);
  const mut = (fn: (sec: Section) => void) =>
    update((d) => {
      const sec = findPage(d, page.id)?.sections.find((x) => x.id === s.id);
      if (sec) fn(sec);
    });
  const commonFields = def.dark ? COMMON_FIELDS.filter((f) => f.key === "anchor") : COMMON_FIELDS;
  return (
    <div id={`ed-${s.id}`} className={cn("scroll-mt-3 rounded-lg border bg-white", open ? "border-emerald-600/50 shadow-sm" : "border-zinc-200", s.hidden && "opacity-60")}>
      <div className="flex items-center gap-0.5 py-1.5 pl-1.5 pr-1">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-0.5 text-left" aria-expanded={open}>
          <ChevronRight className={cn("size-4 shrink-0 text-zinc-400 transition", open && "rotate-90")} />
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-600">
            <Icon name={def.icon} className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-zinc-900">{title}</span>
            <span className="block truncate text-[11px] text-zinc-500">
              {def.label}
              {s.hidden ? " · hidden" : ""}
              {s.anchor ? ` · #${s.anchor}` : ""}
            </span>
          </span>
        </button>
        <IconBtn icon={MousePointerClick} label="Show on page" onClick={() => document.querySelector(`[data-section-id="${s.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" })} />
        <IconBtn icon={ArrowUp} label="Move up" disabled={index === 0} onClick={() => update((d) => moveSection(d, page.id, s.id, -1))} />
        <IconBtn icon={ArrowDown} label="Move down" disabled={index === count - 1} onClick={() => update((d) => moveSection(d, page.id, s.id, 1))} />
        <IconBtn icon={Copy} label="Duplicate section" onClick={() => update((d) => duplicateSection(d, page.id, s.id))} />
        <IconBtn icon={s.hidden ? EyeOff : Eye} label={s.hidden ? "Show section" : "Hide section"} onClick={() => update((d) => toggleSection(d, page.id, s.id))} />
        <IconBtn icon={Trash2} label="Delete section" danger onClick={() => confirm(`Delete the “${title}” section?`) && update((d) => deleteSection(d, page.id, s.id))} />
      </div>
      {open ? (
        <div className="space-y-4 border-t border-zinc-200 p-3">
          <FieldsEditor
            fields={def.fields}
            value={s.data}
            onChange={(data: SectionData) =>
              mut((sec) => {
                sec.data = data;
              })
            }
          />
          <details className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <summary className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Section settings</summary>
            <div className="mt-3">
              <FieldsEditor
                fields={commonFields}
                value={{ anchor: s.anchor ?? "", tone: s.tone ?? def.defaultTone ?? "ivory", spacing: s.spacing ?? "normal" }}
                onChange={(v: { anchor: string; tone: Section["tone"]; spacing: Section["spacing"] }) =>
                  mut((sec) => {
                    sec.anchor = v.anchor.trim().replace(/[^\w-]/g, "-") || undefined;
                    sec.tone = def.dark ? undefined : v.tone;
                    sec.spacing = def.dark ? undefined : v.spacing;
                  })
                }
              />
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}

function PageSettings({ page }: { page: Page }) {
  const { update } = useCms();
  const [slug, setSlug] = useState(page.slug);
  useEffect(() => setSlug(page.slug), [page.slug]);
  const mut = (fn: (p: Page) => void) =>
    update((d) => {
      const p = findPage(d, page.id);
      if (p) fn(p);
    });
  const commitSlug = () => {
    if (slug === page.slug) return;
    let finalSlug = page.slug;
    update((d) => {
      setPageSlug(d, page.id, slug);
      finalSlug = findPage(d, page.id)?.slug ?? page.slug;
    });
    setSlug(finalSlug);
    window.location.hash = finalSlug;
  };
  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
      <div>
        <Label htmlFor="pg-title">Page name (used in menus and admin)</Label>
        <input id="pg-title" className={inputCls} value={page.title} onChange={(e) => mut((p) => void (p.title = e.target.value))} />
      </div>
      <div>
        <Label htmlFor="pg-slug">Page address</Label>
        <div className="flex items-center gap-1">
          <span className="text-[13px] text-zinc-500">#</span>
          <input id="pg-slug" className={inputCls} value={slug} disabled={page.slug === "/"} onChange={(e) => setSlug(e.target.value)} onBlur={commitSlug} onKeyDown={(e) => e.key === "Enter" && commitSlug()} />
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">{page.slug === "/" ? "The home page always lives at #/." : "Remember to update menu links if you change this."}</p>
      </div>
      <div>
        <Label htmlFor="pg-seo">Browser & Google title</Label>
        <input id="pg-seo" className={inputCls} value={page.seoTitle} onChange={(e) => mut((p) => void (p.seoTitle = e.target.value))} />
        <p className="mt-1 text-[11px] text-zinc-500">{page.seoTitle.length}/60 characters recommended</p>
      </div>
      <div>
        <Label htmlFor="pg-desc">Search & social description</Label>
        <textarea id="pg-desc" rows={3} className={inputCls} value={page.seoDescription} onChange={(e) => mut((p) => void (p.seoDescription = e.target.value))} />
        <p className="mt-1 text-[11px] text-zinc-500">{page.seoDescription.length}/160 characters recommended</p>
      </div>
    </div>
  );
}

export function PagesTab() {
  const { content, update } = useCms();
  const admin = useAdmin();
  const { path } = useRoute();
  const [pageId, setPageId] = useState(() => (content.pages.find((p) => p.slug === path) ?? content.pages[0])?.id);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const p = content.pages.find((x) => x.slug === path);
    if (p) setPageId(p.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => {
    if (!admin.focus) return;
    setPageId(admin.focus.pageId);
    setOpenId(admin.focus.sectionId);
    const id = admin.focus.sectionId;
    const t = window.setTimeout(() => document.getElementById(`ed-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    return () => window.clearTimeout(t);
  }, [admin.focus]);

  const page = content.pages.find((p) => p.id === pageId) ?? content.pages[0];
  if (!page) return <div className="p-4 text-[13px] text-zinc-600">No pages yet.</div>;

  const go = (p: Page) => {
    window.location.hash = p.slug;
  };
  const selectPage = (id: string) => {
    setPageId(id);
    setOpenId(null);
    const p = content.pages.find((x) => x.id === id);
    if (p) go(p);
  };
  const newPage = () => {
    const title = window.prompt("Name of the new page", "New page");
    if (!title?.trim()) return;
    const box: { page?: Page } = {};
    update((d) => {
      box.page = addPage(d, title.trim());
    });
    if (box.page) {
      setPageId(box.page.id);
      go(box.page);
    }
  };
  const copyPage = () => {
    const box: { page?: Page | null } = {};
    update((d) => {
      box.page = duplicatePage(d, page.id);
    });
    if (box.page) {
      setPageId(box.page.id);
      go(box.page);
    }
  };
  const removePage = () => {
    if (page.slug === "/") return alert("The home page can't be deleted.");
    if (!confirm(`Delete the page “${page.title}”? Menu links pointing to it will need updating.`)) return;
    update((d) => {
      d.pages = d.pages.filter((p) => p.id !== page.id);
    });
    window.location.hash = "/";
  };
  const addAtEnd = () =>
    admin.pickSectionType((type) => {
      const box: { id?: string | null } = {};
      update((d) => {
        box.id = addSection(d, page.id, type);
      });
      if (box.id) {
        setOpenId(box.id);
        const id = box.id;
        window.setTimeout(() => document.querySelector(`[data-section-id="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
      }
    });

  return (
    <div className="space-y-4 p-4">
      <div>
        <Label htmlFor="page-select">Page</Label>
        <div className="flex gap-1.5">
          <select id="page-select" className={cn(inputCls, "min-w-0 flex-1")} value={page.id} onChange={(e) => selectPage(e.target.value)}>
            {content.pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} — #{p.slug}
              </option>
            ))}
          </select>
          <button type="button" className={btnCls} onClick={() => go(page)} title="View this page">
            <ExternalLink className="size-3.5" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" className={btnCls} onClick={newPage}>
            <Plus className="size-3.5" /> New page
          </button>
          <button type="button" className={btnCls} onClick={copyPage}>
            <Copy className="size-3.5" /> Duplicate
          </button>
          <button type="button" className={btnCls} onClick={() => setShowSettings((v) => !v)} aria-expanded={showSettings}>
            Page settings & SEO
          </button>
          {page.slug !== "/" ? (
            <button type="button" className={dangerBtn} onClick={removePage}>
              <Trash2 className="size-3.5" /> Delete
            </button>
          ) : null}
        </div>
      </div>
      {showSettings ? <PageSettings page={page} /> : null}

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-[13px] font-semibold text-zinc-900">Sections</h3>
          <span className="text-[11px] text-zinc-500">Tip: hover a section on the page to edit it there</span>
        </div>
        <div className="space-y-2">
          {page.sections.map((s, i) => (
            <SectionEditor key={s.id} page={page} section={s} index={i} count={page.sections.length} open={openId === s.id} onToggle={() => setOpenId(openId === s.id ? null : s.id)} />
          ))}
        </div>
        <button type="button" className={cn(primaryBtn, "mt-3 w-full")} onClick={addAtEnd}>
          <Plus className="size-4" /> Add section
        </button>
      </div>
    </div>
  );
}
