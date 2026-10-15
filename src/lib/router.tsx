import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

/**
 * Hash router — works when the site is a single static HTML file.
 *   #/cuisine              → page
 *   #/cuisine?s=breakfast  → page + section to scroll to
 * Pages are dynamic (created in the admin), so any slug is accepted here.
 */
export type RouteState = { path: string; section?: string; params: URLSearchParams; fromPathname: boolean };

function parseLocation(): RouteState {
  const { hash, pathname } = window.location;
  let raw = "/";
  let query = "";
  let fromPathname = false;
  if (hash.startsWith("#/")) {
    const [p, q = ""] = hash.slice(1).split("?");
    raw = p || "/";
    query = q;
  } else if (pathname && pathname !== "/" && !/\.html?$/i.test(pathname)) {
    raw = pathname;
    fromPathname = true;
  }
  raw = raw.length > 1 ? raw.replace(/\/+$/, "") : raw;
  const params = new URLSearchParams(query);
  let path = raw;
  try {
    path = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  return { path, section: params.get("s") ?? undefined, params, fromPathname };
}

export function href(path: string, section?: string, extra?: Record<string, string>) {
  const params = new URLSearchParams();
  if (section) params.set("s", section);
  if (extra) Object.entries(extra).forEach(([k, v]) => params.set(k, v));
  const q = params.toString();
  return `#${path}${q ? `?${q}` : ""}`;
}

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  return true;
}

const RouterContext = createContext<RouteState>({ path: "/", params: new URLSearchParams(), fromPathname: false });

export function RouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RouteState>(() => parseLocation());
  useEffect(() => {
    const onChange = () => setState(parseLocation());
    window.addEventListener("hashchange", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("popstate", onChange);
    };
  }, []);
  return <RouterContext.Provider value={state}>{children}</RouterContext.Provider>;
}

export const useRoute = () => useContext(RouterContext);

export function navigate(path: string, section?: string) {
  const target = href(path, section);
  if (window.location.hash === target) {
    if (section) scrollToSection(section);
  } else window.location.hash = target.slice(1);
}

/** Scroll + focus management and analytics after each navigation. */
export function useRouteEffects() {
  const { path, section, params } = useRoute();
  const key = `${path}|${section ?? ""}|${params.toString()}`;
  const first = useRef(true);

  useEffect(() => {
    let tries = 0;
    let timer: number | undefined;
    if (section) {
      const attempt = () => {
        if (scrollToSection(section) || tries++ > 12) return;
        timer = window.setTimeout(attempt, 60);
      };
      timer = window.setTimeout(attempt, first.current ? 140 : 30);
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
      if (!first.current) document.getElementById("main")?.focus({ preventScroll: true });
    }
    first.current = false;
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    w.gtag?.("event", "page_view", { page_title: document.title, page_location: window.location.href, page_path: path });
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string; section?: string; params?: Record<string, string> };

export function Link({ to, section, params, onClick, children, ...rest }: LinkProps) {
  const target = href(to, section, params);
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (window.location.hash === target || (target === "#/" && (window.location.hash === "" || window.location.hash === "#/"))) {
      e.preventDefault();
      if (section) scrollToSection(section);
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  return (
    <a href={target} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
