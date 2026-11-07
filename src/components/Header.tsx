import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ArrowUpRight, ChevronDown, Compass, Mail, Menu, Moon, PanelTop, Sun, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useAdmin } from "@/admin/context";
import { useCms } from "@/cms/store";
import { Icon } from "@/cms/icons";
import { internalPath, resolveUrl, whatsappLink } from "@/cms/links";
import type { NavLink } from "@/cms/types";
import { useSiteMode } from "@/lib/mode";
import { useRoute } from "@/lib/router";
import { Magnetic, MotionStage, smoothScrollTo } from "./motion";
import { SmartLink } from "./SmartLink";
import { Logo, buttonClass, usePalawanClock } from "./ui";

export function Header({ overlay }: { overlay: boolean }) {
  const { content } = useCms();
  const { header, site } = content;
  const admin = useAdmin();
  const { path } = useRoute();
  const clock = usePalawanClock();
  const { mode, toggleMode } = useSiteMode();

  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<number | null>(null);
  const [height, setHeight] = useState(72);

  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastY = useRef(0);

  // Glass nav hides on scroll down and returns immediately on scroll up (never hides in Admin mode)
  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY.current;
      setScrolled(y > 28);
      if (y < 84 || admin.isAdmin) {
        setHidden(false);
      } else if (delta > 9 && !mobileOpen && openGroup === null) {
        setHidden(true);
      } else if (delta < -6) {
        setHidden(false);
      }
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [admin.isAdmin, mobileOpen, openGroup]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.querySelector<HTMLElement>("[data-bar]")?.getBoundingClientRect().height ?? 72));
    ro.observe(el);
    return () => ro.disconnect();
  }, [header.announcement.enabled]);

  useEffect(() => {
    setMobileOpen(false);
    setOpenGroup(null);
    setHidden(false);
  }, [path]);

  useEffect(() => {
    if (openGroup === null) return;
    const onDown = (e: PointerEvent) => navRef.current && !navRef.current.contains(e.target as Node) && setOpenGroup(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenGroup(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openGroup]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const t = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>("a,button")?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [mobileOpen]);

  const trapFocus = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const all = [toggleRef.current, ...Array.from(panelRef.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled])"))].filter(Boolean) as HTMLElement[];
    const first = all[0];
    const last = all[all.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Frosted dark lagoon glass when scrolled or when not overlaying a hero
  const glass = !overlay || scrolled || mobileOpen;
  const isActive = (url: string) => {
    const r = resolveUrl(url, site, path);
    return r.internal && !r.href.includes("?") && internalPath(r.href) === path;
  };
  const groupActive = (item: NavLink) => (item.children ?? []).some((c) => isActive(c.url));

  const linkCls = (active: boolean) =>
    cn(
      "relative inline-flex h-10 items-center gap-1.5 text-[0.875rem] font-medium tracking-[0.02em] transition-colors duration-300",
      "after:absolute after:inset-x-0 after:bottom-1.5 after:h-px after:origin-left after:scale-x-0 after:bg-forest after:transition-transform after:duration-500 after:ease-[var(--ease-expo)] hover:after:scale-x-100",
      active && "after:scale-x-100",
      active ? "text-[var(--fg-on-dark)]" : "text-[var(--fg-on-dark)]/82 hover:text-[var(--fg-on-dark)]",
    );

  const nav = header.nav.filter((n) => n.label);
  const book = header.book;
  const bookHref = resolveUrl(book.url, site, path);
  const hideNow = hidden && !mobileOpen && openGroup === null && !admin.isAdmin;

  return (
    <>
      <MotionStage />
      <header
        ref={headerRef}
        onFocusCapture={() => setHidden(false)}
        className={cn(
          "on-dark fixed left-0 top-0 z-50 transition-[transform,background-color,border-color,backdrop-filter] duration-500 ease-[var(--ease-expo)]",
          hideNow ? "-translate-y-full" : "translate-y-0",
          glass
            ? "border-b border-[color:var(--fg-on-dark)]/12 bg-espresso-deep/80 backdrop-blur-xl"
            : "border-b border-transparent bg-gradient-to-b from-espresso-deep/75 via-espresso-deep/25 to-transparent",
        )}
        style={{ right: "var(--admin-w, 0px)" }}
      >
        <a
          href="#main"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("main")?.focus();
          }}
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:bg-forest focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-[var(--btn-primary-fg)]"
        >
          Skip to content
        </a>

        {header.announcement.enabled && header.announcement.text ? (
          <div className="border-b border-[color:var(--fg-on-dark)]/10 bg-espresso-deep px-5 py-2 text-center font-mono text-xs uppercase tracking-[0.16em] text-sand">
            {header.announcement.url ? (
              <SmartLink url={header.announcement.url} className="underline-offset-4 hover:underline">
                {header.announcement.text}
              </SmartLink>
            ) : (
              header.announcement.text
            )}
          </div>
        ) : null}

        <div data-bar className="mx-auto flex h-16 max-w-[var(--container,1440px)] items-center justify-between gap-4 px-5 sm:px-8 lg:h-[76px] lg:px-12">
          <div className="flex items-center gap-6">
            <a
              href="#/"
              onClick={(e) =>
                admin.registerLogoClick(e, () => {
                  if ((window.location.hash || "#/") === "#/") smoothScrollTo(0);
                  else window.location.hash = "/";
                })
              }
              aria-label={`${site.fullName} — home`}
              className="shrink-0 select-none"
            >
              <Logo light />
            </a>

            {/* Subtle expedition telemetry pill on wide screens */}
            <div
              aria-hidden
              className="hidden items-center gap-2 border-l border-[color:var(--fg-on-dark)]/15 pl-5 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-[var(--fg-on-dark)]/65 2xl:flex"
            >
              <Compass className="size-3.5 text-forest" />
              <span className="tnum">{clock.time}</span>
            </div>
          </div>

          <nav ref={navRef} aria-label="Main" className="hidden xl:block">
            <ul className="flex items-center gap-7">
              {nav.map((item, i) =>
                item.children?.length ? (
                  <li
                    key={i}
                    className="relative"
                    onMouseEnter={() => setOpenGroup(i)}
                    onMouseLeave={() => setOpenGroup((g) => (g === i ? null : g))}
                  >
                    <button
                      type="button"
                      aria-expanded={openGroup === i}
                      aria-controls={`menu-${i}`}
                      onClick={(e) => setOpenGroup((g) => (g === i && e.detail === 0 ? null : i))}
                      className={linkCls(groupActive(item))}
                    >
                      {item.label}
                      <ChevronDown className={cn("size-3.5 opacity-70 transition-transform duration-300", openGroup === i && "rotate-180 opacity-100")} aria-hidden />
                    </button>
                    <div
                      id={`menu-${i}`}
                      className={cn(
                        "absolute left-1/2 top-full w-76 -translate-x-1/2 pt-3 transition-all duration-300 ease-[var(--ease-expo)]",
                        openGroup === i ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0",
                      )}
                    >
                      <ul className="border border-[color:var(--fg-on-dark)]/15 bg-espresso-deep/95 p-2 text-[var(--fg-on-dark)] shadow-[0_28px_60px_-20px_rgb(0_0_0/0.75)] backdrop-blur-xl">
                        {item.children.map((c, j) => (
                          <li key={j}>
                            <SmartLink
                              url={c.url}
                              ariaCurrent={isActive(c.url) ? "page" : undefined}
                              className={cn(
                                "group/sub block rounded-[2px] px-4 py-3 transition-colors hover:bg-[color:var(--fg-on-dark)]/[0.07]",
                                isActive(c.url) && "bg-[color:var(--fg-on-dark)]/[0.08]",
                              )}
                            >
                              <span className="flex items-center justify-between font-serif text-[1.2rem] leading-tight">
                                <span>{c.label}</span>
                                <span aria-hidden className="font-mono text-[0.65rem] text-sand/70 transition-transform duration-300 group-hover/sub:translate-x-0.5">
                                  0{j + 1}
                                </span>
                              </span>
                              {c.description ? <span className="mt-0.5 block text-xs text-[var(--fg-on-dark)]/65">{c.description}</span> : null}
                            </SmartLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ) : (
                  <li key={i}>
                    <SmartLink url={item.url} ariaCurrent={isActive(item.url) ? "page" : undefined} className={linkCls(isActive(item.url))}>
                      {item.label}
                    </SmartLink>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {book.show && book.label ? (
              <Magnetic>
                <a
                  href={bookHref.href}
                  data-cursor="Book"
                  {...(bookHref.external && bookHref.kind !== "booking" && bookHref.kind !== "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={buttonClass("primary", "min-h-10 px-4 sm:min-h-11 sm:px-5")}
                >
                  <span>{book.label}</span>
                  {bookHref.external ? <ArrowUpRight className="hidden size-3.5 sm:block" aria-hidden /> : null}
                  {bookHref.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
                </a>
              </Magnetic>
            ) : null}
            <button
              type="button"
              onClick={toggleMode}
              aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
              title={mode === "light" ? "Dark mode" : "Light mode"}
              className="grid size-11 place-items-center rounded-[2px] border border-[color:var(--fg-on-dark)]/15 text-[var(--fg-on-dark)] transition-colors hover:border-[color:var(--fg-on-dark)]/40 hover:text-sand"
            >
              {mode === "light" ? <Moon className="size-5" aria-hidden /> : <Sun className="size-5" aria-hidden />}
            </button>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="grid size-11 place-items-center rounded-[2px] border border-[color:var(--fg-on-dark)]/15 text-[var(--fg-on-dark)] transition-colors hover:border-[color:var(--fg-on-dark)]/40 xl:hidden"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Full-screen editorial mobile navigation drawer */}
        <div
          id="mobile-menu"
          data-lenis-prevent
          ref={panelRef}
          onKeyDown={trapFocus}
          hidden={!mobileOpen}
          className="fixed inset-x-0 bottom-0 overflow-y-auto overscroll-contain border-t border-[color:var(--fg-on-dark)]/12 bg-espresso-deep/98 text-[var(--fg-on-dark)] backdrop-blur-2xl xl:hidden"
          style={{ top: height, right: "var(--admin-w, 0px)" }}
        >
          <nav aria-label="Mobile" className="mx-auto flex min-h-full max-w-[var(--container,1440px)] flex-col px-5 pb-10 pt-6 sm:px-8">
            <div className="mb-4 flex items-center justify-between border-b border-[color:var(--fg-on-dark)]/12 pb-4 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-sand/85">
              <span>11°29′N · 119°52′E</span>
              <span className="tnum">{clock.time} · {clock.phase}</span>
            </div>

            <ul className="divide-y divide-[color:var(--fg-on-dark)]/12">
              {nav.map((item, i) =>
                item.children?.length ? (
                  <li key={i} className="py-4">
                    <p className="font-mono text-eyebrow uppercase text-sand/80">
                      0{i + 1} — {item.label}
                    </p>
                    <ul className="mt-2 space-y-1 pl-4">
                      {item.children.map((c, j) => (
                        <li key={j}>
                          <SmartLink
                            url={c.url}
                            ariaCurrent={isActive(c.url) ? "page" : undefined}
                            className={cn(
                              "flex min-h-12 items-baseline justify-between font-serif text-[2rem] leading-none",
                              isActive(c.url) ? "italic text-forest" : "text-[var(--fg-on-dark)]",
                            )}
                          >
                            <span>{c.label}</span>
                          </SmartLink>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li key={i} className="py-2.5">
                    <SmartLink
                      url={item.url}
                      ariaCurrent={isActive(item.url) ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-baseline justify-between font-serif text-[2.1rem] leading-none",
                        isActive(item.url) ? "italic text-forest" : "text-[var(--fg-on-dark)]",
                      )}
                    >
                      <span>{item.label}</span>
                      <span aria-hidden className="font-mono text-xs tracking-[0.2em] text-sand/60">
                        0{i + 1}
                      </span>
                    </SmartLink>
                  </li>
                ),
              )}
            </ul>

            <div className="mt-auto flex flex-col gap-3 pt-8">
              {book.show && book.label ? (
                <a
                  href={bookHref.href}
                  {...(bookHref.external && bookHref.kind !== "booking" && bookHref.kind !== "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={buttonClass("primary", "w-full")}
                >
                  <span>{book.label}</span>
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <a href={whatsappLink(site)} className={buttonClass("outlineLight", "w-full px-3")}>
                  <Icon name="brand:whatsapp" className="size-4" /> WhatsApp
                </a>
                <a href={`mailto:${site.email}`} className={buttonClass("outlineLight", "w-full px-3")}>
                  <Mail className="size-4" aria-hidden /> Email
                </a>
              </div>
            </div>
          </nav>
        </div>

        {admin.isAdmin ? (
          <button
            type="button"
            onClick={() => admin.openTab("header")}
            className="admin-ui absolute -bottom-9 left-3 z-10 flex items-center gap-1.5 rounded-md bg-zinc-950/90 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-zinc-900"
          >
            <PanelTop className="size-3.5" /> Edit header
          </button>
        ) : null}
      </header>
    </>
  );
}
