import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { SectionType } from "@/cms/types";

export type AdminTab = "pages" | "header" | "footer" | "theme" | "media" | "contact" | "agent" | "settings";
export const PANEL_W = 460;
const SESSION_KEY = "cc-admin-session";

type Focus = { pageId: string; sectionId: string; n: number } | null;

type AdminApi = {
  isAdmin: boolean;
  panelOpen: boolean;
  tab: AdminTab;
  focus: Focus;
  loginOpen: boolean;
  typePicker: ((t: SectionType) => void) | null;
  setPanelOpen: (open: boolean) => void;
  openTab: (tab: AdminTab) => void;
  editSection: (pageId: string, sectionId: string) => void;
  /** Logo click: a single click runs `navigate`, three quick clicks open the editor. */
  registerLogoClick: (e: MouseEvent, navigate: () => void) => void;
  closeLogin: () => void;
  grant: () => void;
  lock: () => void;
  pickSectionType: (cb: (t: SectionType) => void) => void;
  closeTypePicker: () => void;
};

const AdminContext = createContext<AdminApi | null>(null);

const readSession = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
};

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(readSession);
  const [panelOpen, setPanelOpen] = useState(readSession);
  const [tab, setTab] = useState<AdminTab>("pages");
  const [focus, setFocus] = useState<Focus>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [typePicker, setTypePicker] = useState<((t: SectionType) => void) | null>(null);
  const clicks = useRef<number[]>([]);
  const clickTimer = useRef<number | undefined>(undefined);

  // Docked panel: shrink the page beside it on large screens so edits stay visible.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => document.documentElement.style.setProperty("--admin-w", isAdmin && panelOpen && mq.matches ? `${PANEL_W}px` : "0px");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [isAdmin, panelOpen]);

  /**
   * Navigation is held for a moment so the three quick clicks that open the editor
   * don't bounce the visitor to the home page on the way. Modified clicks
   * (open in new tab, middle click) are left entirely alone.
   */
  const registerLogoClick = useCallback(
    (e: MouseEvent, navigate: () => void) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      const now = Date.now();
      clicks.current = [...clicks.current.filter((t) => now - t < 900), now];
      window.clearTimeout(clickTimer.current);
      if (clicks.current.length >= 3) {
        clicks.current = [];
        if (isAdmin) setPanelOpen(true);
        else setLoginOpen(true);
        return;
      }
      clickTimer.current = window.setTimeout(() => {
        clicks.current = [];
        navigate();
      }, 360);
    },
    [isAdmin],
  );

  useEffect(() => () => window.clearTimeout(clickTimer.current), []);

  const grant = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* private mode */
    }
    setIsAdmin(true);
    setPanelOpen(true);
    setLoginOpen(false);
  }, []);

  const lock = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    setIsAdmin(false);
    setPanelOpen(false);
    setFocus(null);
  }, []);

  const api = useMemo<AdminApi>(
    () => ({
      isAdmin,
      panelOpen,
      tab,
      focus,
      loginOpen,
      typePicker,
      setPanelOpen,
      openTab: (t) => {
        setTab(t);
        setPanelOpen(true);
      },
      editSection: (pageId, sectionId) => {
        setTab("pages");
        setPanelOpen(true);
        setFocus((f) => ({ pageId, sectionId, n: (f?.n ?? 0) + 1 }));
      },
      registerLogoClick,
      closeLogin: () => setLoginOpen(false),
      grant,
      lock,
      pickSectionType: (cb) => setTypePicker(() => cb),
      closeTypePicker: () => setTypePicker(null),
    }),
    [isAdmin, panelOpen, tab, focus, loginOpen, typePicker, registerLogoClick, grant, lock],
  );

  return <AdminContext.Provider value={api}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}
