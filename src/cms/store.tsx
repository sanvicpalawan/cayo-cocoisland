import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CONTENT_VERSION, defaultContent } from "./defaults";
import { kv } from "./idb";
import type { SiteContent } from "./types";

export type ContentSource = "draft" | "published" | "default";
export type SaveState = "idle" | "saving" | "saved" | "error";

const DRAFT_KEY = "content-draft";
/** Upload this file next to index.html to publish admin changes to every visitor. */
export const PUBLISHED_FILE = "site-content.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeDeep(base: any, over: any): any {
  if (Array.isArray(base)) return Array.isArray(over) ? over : base;
  if (base && typeof base === "object") {
    const out = { ...base };
    if (over && typeof over === "object" && !Array.isArray(over)) {
      for (const k of Object.keys(over)) out[k] = k in base ? mergeDeep(base[k], over[k]) : over[k];
    }
    return out;
  }
  return over === undefined || over === null ? base : over;
}

/** Validates content and fills in anything added in newer versions. */
export function migrate(raw: unknown): SiteContent | null {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as SiteContent).pages)) return null;
  const merged = mergeDeep(defaultContent(), raw) as SiteContent;
  merged.version = CONTENT_VERSION;
  return merged;
}

const withTimeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<undefined>((r) => setTimeout(() => r(undefined), ms))]);

export async function loadPublished(): Promise<{ content: SiteContent; source: ContentSource }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(PUBLISHED_FILE, { cache: "no-store", signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const c = migrate(await res.json());
      if (c) return { content: c, source: "published" };
    }
  } catch {
    /* not published yet, offline, or opened from file:// */
  }
  return { content: defaultContent(), source: "default" };
}

export async function loadInitialContent() {
  const draft = migrate(await withTimeout(kv.get<SiteContent>(DRAFT_KEY), 1500).catch(() => undefined));
  if (draft) return { content: draft, source: "draft" as ContentSource };
  return loadPublished();
}

type CmsApi = {
  content: SiteContent;
  source: ContentSource;
  saveState: SaveState;
  update: (mutate: (draft: SiteContent) => void) => void;
  replace: (next: SiteContent) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  discardDraft: () => Promise<void>;
};

const CmsContext = createContext<CmsApi | null>(null);

export function CmsProvider({ initial, source: initialSource, children }: { initial: SiteContent; source: ContentSource; children: ReactNode }) {
  const [content, setContent] = useState(initial);
  const [source, setSource] = useState<ContentSource>(initialSource);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [, bump] = useState(0);
  const ref = useRef(initial);
  const past = useRef<SiteContent[]>([]);
  const future = useRef<SiteContent[]>([]);
  const lastSnap = useRef(0);
  const dirty = useRef(false);

  const commit = useCallback((next: SiteContent, snapshot: boolean) => {
    if (snapshot) {
      past.current.push(ref.current);
      if (past.current.length > 80) past.current.shift();
    }
    future.current = [];
    ref.current = next;
    dirty.current = true;
    setContent(next);
    bump((n) => n + 1);
  }, []);

  const update = useCallback(
    (mutate: (draft: SiteContent) => void) => {
      const draft = structuredClone(ref.current);
      mutate(draft);
      draft.updatedAt = new Date().toISOString();
      const now = Date.now();
      const snapshot = now - lastSnap.current > 800; // typing bursts become one undo step
      lastSnap.current = now;
      commit(draft, snapshot);
    },
    [commit],
  );

  const replace = useCallback((next: SiteContent) => {
    lastSnap.current = 0;
    commit(next, true);
  }, [commit]);

  const travel = useCallback((from: SiteContent[], to: SiteContent[]) => {
    const target = from.pop();
    if (!target) return;
    to.push(ref.current);
    ref.current = target;
    dirty.current = true;
    lastSnap.current = 0;
    setContent(target);
    bump((n) => n + 1);
  }, []);
  const undo = useCallback(() => travel(past.current, future.current), [travel]);
  const redo = useCallback(() => travel(future.current, past.current), [travel]);

  useEffect(() => {
    if (!dirty.current) return;
    setSaveState("saving");
    const t = setTimeout(() => {
      kv.set(DRAFT_KEY, ref.current)
        .then(() => {
          setSaveState("saved");
          setSource("draft");
        })
        .catch(() => setSaveState("error"));
    }, 450);
    return () => clearTimeout(t);
  }, [content]);

  const discardDraft = useCallback(async () => {
    await kv.del(DRAFT_KEY).catch(() => undefined);
    const r = await loadPublished();
    past.current = [];
    future.current = [];
    dirty.current = false;
    ref.current = r.content;
    setContent(r.content);
    setSource(r.source);
    setSaveState("idle");
    bump((n) => n + 1);
  }, []);

  const api = useMemo<CmsApi>(
    () => ({ content, source, saveState, update, replace, undo, redo, canUndo: past.current.length > 0, canRedo: future.current.length > 0, discardDraft }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content, source, saveState, update, replace, undo, redo, discardDraft, past.current.length, future.current.length],
  );
  return <CmsContext.Provider value={api}>{children}</CmsContext.Provider>;
}

export function useCms() {
  const ctx = useContext(CmsContext);
  if (!ctx) throw new Error("useCms must be used inside <CmsProvider>");
  return ctx;
}

export const useSite = () => useCms().content.site;
