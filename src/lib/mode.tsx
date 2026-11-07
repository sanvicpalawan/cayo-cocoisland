import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { SiteMode } from "@/cms/theme";

const KEY = "cc-site-mode";
const Ctx = createContext<{ mode: SiteMode; toggleMode: () => void }>({ mode: "light", toggleMode: () => {} });

export const useSiteMode = () => useContext(Ctx);

/** Light mode by default; remembers the visitor's choice on this device. */
export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<SiteMode>(() => {
    try {
      return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* private browsing */
    }
  }, [mode]);
  const toggleMode = useCallback(() => setMode((m) => (m === "light" ? "dark" : "light")), []);
  return <Ctx.Provider value={{ mode, toggleMode }}>{children}</Ctx.Provider>;
}
