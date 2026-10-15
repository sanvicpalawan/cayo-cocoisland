import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Bot, Copy, Eye, EyeOff, FileText, Images, Lock, Palette, PanelBottom, PanelTop, Pencil, Plus, Redo2, Settings, Share2, Trash2, Undo2, X, type LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { useCms } from "@/cms/store";
import { Icon } from "@/cms/icons";
import { addSection, deleteSection, duplicateSection, moveSection, toggleSection } from "@/cms/ops";
import { SECTION_TYPES } from "@/cms/schema";
import type { Page, Section, SectionType } from "@/cms/types";
import { useAdmin, type AdminTab } from "./context";
import { clearFails, lockState, registerFail, verifyPasskey } from "./passkey";
import { IconBtn, btnCls, primaryBtn } from "./fields";
import { AgentTab } from "./tabs/AgentTab";
import { PagesTab } from "./tabs/PagesTab";
import { ContactTab, FooterTab, HeaderTab, MediaTab, SettingsTab } from "./tabs/SiteTabs";
import { ThemeTab } from "./tabs/ThemeTab";

const TABS: { id: AdminTab; label: string; icon: LucideIcon; render: () => ReactNode }[] = [
  { id: "pages", label: "Pages & sections", icon: FileText, render: () => <PagesTab /> },
  { id: "header", label: "Header & menu", icon: PanelTop, render: () => <HeaderTab /> },
  { id: "footer", label: "Footer", icon: PanelBottom, render: () => <FooterTab /> },
  { id: "theme", label: "Theme — colours, fonts & buttons", icon: Palette, render: () => <ThemeTab /> },
  { id: "media", label: "Media library", icon: Images, render: () => <MediaTab /> },
  { id: "contact", label: "Contact & social media", icon: Share2, render: () => <ContactTab /> },
  { id: "agent", label: "AI agent & WhatsApp", icon: Bot, render: () => <AgentTab /> },
  { id: "settings", label: "Publish & settings", icon: Settings, render: () => <SettingsTab /> },
];

function LoginDialog() {
  const admin = useAdmin();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const lockedFor = Math.max(0, Math.ceil((lockState().until - now) / 1000));
  useEffect(() => {
    if (!lockedFor) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [lockedFor]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && admin.closeLogin();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [admin]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (lockedFor || !pin) return;
    if (verifyPasskey(pin)) {
      clearFails();
      admin.grant();
      return;
    }
    const r = registerFail();
    setPin("");
    setNow(Date.now());
    setError(r.until ? "Too many attempts — editing is locked for a moment." : `Incorrect passkey. ${Math.max(0, 5 - r.fails)} attempt${5 - r.fails === 1 ? "" : "s"} left.`);
  };
  return (
    <div className="admin-ui fixed inset-0 z-[100] grid place-items-center bg-zinc-950/60 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && admin.closeLogin()}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="login-title" className="w-full max-w-sm rounded-2xl bg-white p-6 text-zinc-900 shadow-2xl">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-700">
          <Lock className="size-5" />
        </div>
        <h2 id="login-title" className="mt-4 text-center text-lg font-semibold">
          Site editor
        </h2>
        <p className="mt-1 text-center text-[13px] text-zinc-500">Enter the admin passkey to edit the website.</p>
        <label htmlFor="admin-pass" className="sr-only">
          Passkey
        </label>
        <input
          id="admin-pass"
          autoFocus
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          disabled={!!lockedFor}
          onChange={(e) => {
            setPin(e.target.value);
            setError("");
          }}
          className="mt-5 h-12 w-full rounded-lg border border-zinc-300 text-center font-mono text-xl tracking-[0.5em] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 disabled:bg-zinc-100"
          placeholder="••••"
        />
        {lockedFor ? (
          <p role="alert" className="mt-2 text-center text-xs font-medium text-red-600">
            Locked — try again in {lockedFor}s.
          </p>
        ) : error ? (
          <p role="alert" className="mt-2 text-center text-xs font-medium text-red-600">
            {error}
          </p>
        ) : null}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={admin.closeLogin} className={cn(btnCls, "h-10")}>
            Cancel
          </button>
          <button type="submit" className={cn(primaryBtn, "h-10")} disabled={!pin || !!lockedFor}>
            Unlock
          </button>
        </div>
      </form>
    </div>
  );
}

function SaveState() {
  const { saveState, source } = useCms();
  const text = saveState === "saving" ? "Saving…" : saveState === "error" ? "Couldn't save — browser storage may be full" : source === "draft" ? "Saved in this browser · not yet published" : source === "published" ? "Showing the published version" : "Original content · no changes yet";
  return <p className={cn("truncate text-[11px]", saveState === "error" ? "text-red-600" : "text-zinc-500")}>{text}</p>;
}

function AdminPanel() {
  const admin = useAdmin();
  const cms = useCms();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select, [contenteditable='true']")) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) cms.redo();
        else cms.undo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [cms]);
  const tab = TABS.find((t) => t.id === admin.tab) ?? TABS[0];
  return (
    <aside aria-label="Site editor" className="admin-ui fixed inset-y-0 right-0 z-[80] flex w-full border-l border-zinc-200 bg-zinc-50 text-zinc-900 shadow-2xl lg:w-[460px]">
      <nav aria-label="Editor sections" className="flex w-14 shrink-0 flex-col items-center gap-1 bg-zinc-950 py-3">
        <span className="mb-2 grid size-9 place-items-center rounded-lg bg-emerald-600 text-[13px] font-bold text-white" aria-hidden>
          CC
        </span>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.label}
            aria-label={t.label}
            aria-current={admin.tab === t.id ? "page" : undefined}
            onClick={() => admin.openTab(t.id)}
            className={cn("grid size-10 place-items-center rounded-lg transition", admin.tab === t.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white")}
          >
            <t.icon className="size-5" />
          </button>
        ))}
        <button type="button" title="Lock admin" aria-label="Lock admin" onClick={admin.lock} className="mt-auto grid size-10 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-900 hover:text-white">
          <Lock className="size-5" />
        </button>
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-1 border-b border-zinc-200 bg-white px-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold">{tab.label}</h2>
            <SaveState />
          </div>
          <IconBtn icon={Undo2} label="Undo (Ctrl+Z)" disabled={!cms.canUndo} onClick={cms.undo} />
          <IconBtn icon={Redo2} label="Redo (Ctrl+Shift+Z)" disabled={!cms.canRedo} onClick={cms.redo} />
          <IconBtn icon={X} label="Close editor" onClick={() => admin.setPanelOpen(false)} />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{tab.render()}</div>
      </div>
    </aside>
  );
}

function AdminBar() {
  const admin = useAdmin();
  return (
    <div className="admin-ui fixed bottom-4 left-4 z-[75] flex items-center gap-1 rounded-full bg-zinc-950 p-1 pl-3 text-white shadow-xl">
      <span className="text-xs font-medium text-zinc-300">Admin</span>
      <button type="button" onClick={() => admin.setPanelOpen(true)} className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-500">
        <Pencil className="size-3.5" /> Edit site
      </button>
      <button type="button" onClick={admin.lock} aria-label="Lock admin" title="Lock admin" className="grid size-8 place-items-center rounded-full hover:bg-zinc-800">
        <Lock className="size-4" />
      </button>
    </div>
  );
}

function SectionTypePicker() {
  const admin = useAdmin();
  const pick = admin.typePicker;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && admin.closeTypePicker();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [admin]);
  if (!pick) return null;
  return (
    <div className="admin-ui fixed inset-0 z-[96] grid place-items-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && admin.closeTypePicker()}>
      <div role="dialog" aria-modal="true" aria-labelledby="picker-title" className="max-h-[90vh] w-[min(760px,96vw)] overflow-y-auto rounded-xl bg-white p-5 text-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="picker-title" className="text-base font-semibold">
            Add a section
          </h2>
          <button type="button" onClick={admin.closeTypePicker} className="grid size-8 place-items-center rounded-md hover:bg-zinc-100" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {(Object.keys(SECTION_TYPES) as SectionType[]).map((type) => {
            const def = SECTION_TYPES[type];
            return (
              <li key={type}>
                <button
                  type="button"
                  onClick={() => {
                    admin.closeTypePicker();
                    pick(type);
                  }}
                  className="flex h-full w-full items-start gap-3 rounded-lg border border-zinc-200 p-3 text-left transition hover:border-emerald-600 hover:bg-emerald-50/50"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-700">
                    <Icon name={def.icon} className="size-5" />
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold">{def.label}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-zinc-500">{def.description}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Wraps each section; in admin mode adds an on-page toolbar (edit, move, duplicate, hide, delete, add). */
export function SectionFrame({ page, section: s, index, count, children }: { page: Page; section: Section; index: number; count: number; children: ReactNode }) {
  const admin = useAdmin();
  const { update } = useCms();
  if (!admin.isAdmin) return s.hidden ? null : <>{children}</>;
  const def = SECTION_TYPES[s.type];
  const tb = "grid size-7 place-items-center rounded-md text-zinc-300 transition hover:bg-white/15 hover:text-white disabled:pointer-events-none disabled:opacity-30";
  return (
    <div data-section-id={s.id} className={cn("group/sec relative", s.hidden && "opacity-45")}>
      {children}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-20 outline-2 -outline-offset-2 outline-dashed outline-transparent transition-[outline-color] group-hover/sec:outline-emerald-500/80" />
      <div className={cn("admin-ui absolute left-3 z-30 flex items-center gap-0.5 rounded-lg bg-zinc-950/90 p-1 text-white opacity-80 shadow-lg transition group-hover/sec:opacity-100 focus-within:opacity-100", index === 0 ? "top-24" : "top-3")}>
        <span className="flex items-center gap-1.5 px-1.5 text-[11px] font-medium text-zinc-300">
          <Icon name={def.icon} className="size-3.5" />
          {def.label}
          {s.hidden ? " · hidden" : ""}
        </span>
        <button type="button" onClick={() => admin.editSection(page.id, s.id)} className="flex h-7 items-center gap-1 rounded-md bg-emerald-600 px-2 text-[11px] font-semibold text-white hover:bg-emerald-500">
          <Pencil className="size-3.5" /> Edit
        </button>
        <button type="button" className={tb} aria-label="Move section up" title="Move up" disabled={index === 0} onClick={() => update((d) => moveSection(d, page.id, s.id, -1))}>
          <ArrowUp className="size-4" />
        </button>
        <button type="button" className={tb} aria-label="Move section down" title="Move down" disabled={index === count - 1} onClick={() => update((d) => moveSection(d, page.id, s.id, 1))}>
          <ArrowDown className="size-4" />
        </button>
        <button type="button" className={tb} aria-label="Duplicate section" title="Duplicate" onClick={() => update((d) => duplicateSection(d, page.id, s.id))}>
          <Copy className="size-4" />
        </button>
        <button type="button" className={tb} aria-label={s.hidden ? "Show section" : "Hide section"} title={s.hidden ? "Show" : "Hide"} onClick={() => update((d) => toggleSection(d, page.id, s.id))}>
          {s.hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
        <button type="button" className={cn(tb, "hover:bg-red-500/30")} aria-label="Delete section" title="Delete" onClick={() => confirm(`Delete this ${def.label.toLowerCase()} section?`) && update((d) => deleteSection(d, page.id, s.id))}>
          <Trash2 className="size-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => admin.pickSectionType((type) => update((d) => void addSection(d, page.id, type, s.id)))}
        className="admin-ui absolute bottom-0 left-1/2 z-30 flex -translate-x-1/2 translate-y-1/2 items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition hover:bg-emerald-500 focus:opacity-100 group-hover/sec:opacity-100"
      >
        <Plus className="size-3.5" /> Add section
      </button>
    </div>
  );
}

export function AdminLayer() {
  const admin = useAdmin();
  return (
    <>
      {admin.loginOpen ? <LoginDialog /> : null}
      {admin.isAdmin ? admin.panelOpen ? <AdminPanel /> : <AdminBar /> : null}
      {admin.typePicker ? <SectionTypePicker /> : null}
    </>
  );
}
