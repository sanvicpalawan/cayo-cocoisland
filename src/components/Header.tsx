import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ArrowUpRight, ChevronDown, Mail, Menu, PanelTop, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useAdmin } from "@/admin/context";
import { useCms } from "@/cms/store";
import { Icon } from "@/cms/icons";
import { internalPath, resolveUrl, whatsappLink } from "@/cms/links";
import type { NavLink } from "@/cms/types";
import { useRoute } from "@/lib/router";
import { SmartLink } from "./SmartLink";
import { Logo, buttonClass } from "./ui";

export function Header({ overlay }: { overlay: boolean }) {
  const { content } = useCms();
  const { header, site } = content;
  const admin = useAdmin();
  const { path } = useRoute();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<number | null>(null);
  const [height, setHeight] = useState(64);
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.querySelector<HTMLElement>("[data-bar]")?.getBoundingClientRect().bottom ?? 64));
    ro.observe(el);
    return () => ro.disconnect();
  }, [header.announcement.enabled]);

  useEffect(() => {
    setMobileOpen(false);
    setOpenGroup(null);
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

  const solid = !overlay || scrolled || mobileOpen;
  const light = !solid;
  const isActive = (url: string) => {
    const r = resolveUrl(url, site, path);
    return r.internal && !r.href.includes("?") && internalPath(r.href) === path;
  };
  const groupActive = (item: NavLink) => (item.children ?? []).some((c) => isActive(c.url));
  const linkCls = (active: boolean) =>
    cn(
      "relative inline-flex h-10 items-center gap-1 text-[0.9375rem] font-medium transition-colors",
      "after:absolute after:inset-x-0 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100",
      active && "after:scale-x-100",
      light ? "text-ivory/90 hover:text-ivory" : "text-ink/80 hover:text-ink",
      active && (light ? "text-ivory" : "text-ink"),
    );
  const nav = header.nav.filter((n) => n.label);
  const book = header.book;
  const bookHref = resolveUrl(book.url, site, path);

  return (
    <header
      ref={headerRef}
      className={cn("fixed left-0 top-0 z-50 transition-[background-color,box-shadow,color] duration-300", solid ? "bg-ivory shadow-[0_1px_0_var(--color-line)]" : "bg-gradient-to-b from-espresso-deep/45 to-transparent")}
      style={{ right: "var(--admin-w, 0px)" }}
    >
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to content
      </a>
      {header.announcement.enabled && header.announcement.text ? (
        <div className="on-dark bg-espresso-deep px-5 py-2 text-center text-sm text-ivory">
          {header.announcement.url ? (
            <SmartLink url={header.announcement.url} className="underline-offset-4 hover:underline">
              {header.announcement.text}
            </SmartLink>
          ) : (
            header.announcement.text
          )}
        </div>
      ) : null}
      <div data-bar className="mx-auto flex h-16 max-w-[var(--container,1320px)] items-center justify-between gap-6 px-5 sm:px-8 lg:h-[76px] lg:px-12">
        <a
          href="#/"
          onClick={(e) =>
            admin.registerLogoClick(e, () => {
              if ((window.location.hash || "#/") === "#/") window.scrollTo({ top: 0, behavior: "smooth" });
              else window.location.hash = "/";
            })
          }
          aria-label={`${site.fullName} — home`}
          className="shrink-0 select-none"
        >
          <Logo light={light} />
        </a>

        <nav ref={navRef} aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-7">
            {nav.map((item, i) =>
              item.children?.length ? (
                <li key={i} className="relative" onMouseEnter={() => setOpenGroup(i)} onMouseLeave={() => setOpenGroup((g) => (g === i ? null : g))}>
                  <button
                    type="button"
                    aria-expanded={openGroup === i}
                    aria-controls={`menu-${i}`}
                    onClick={(e) => setOpenGroup((g) => (g === i && e.detail === 0 ? null : i))}
                    className={linkCls(groupActive(item))}
                  >
                    {item.label}
                    <ChevronDown className={cn("size-4 transition-transform", openGroup === i && "rotate-180")} aria-hidden />
                  </button>
                  <div id={`menu-${i}`} className={cn("absolute left-1/2 top-full w-72 -translate-x-1/2 pt-3 transition-all duration-200", openGroup === i ? "visible opacity-100" : "invisible -translate-y-1 opacity-0")}>
                    <ul className="border border-line bg-ivory p-2 text-ink shadow-[0_24px_48px_-24px_rgba(42,32,25,0.45)]">
                      {item.children.map((c, j) => (
                        <li key={j}>
                          <SmartLink url={c.url} ariaCurrent={isActive(c.url) ? "page" : undefined} className={cn("block rounded-[2px] px-4 py-3 transition-colors hover:bg-shell", isActive(c.url) && "bg-shell")}>
                            <span className="block font-medium">{c.label}</span>
                            {c.description ? <span className="mt-0.5 block text-sm text-muted">{c.description}</span> : null}
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

        <div className="flex items-center gap-2 sm:gap-3">
          {book.show && book.label ? (
            <a href={bookHref.href} {...(bookHref.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={buttonClass(light ? "light" : "primary", "min-h-10 px-4 sm:min-h-11 sm:px-5")}>
              {book.label}
              {bookHref.external ? <ArrowUpRight className="hidden size-4 sm:block" aria-hidden /> : null}
              {bookHref.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
            </a>
          ) : null}
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className={cn("grid size-11 place-items-center rounded-[2px] xl:hidden", light ? "text-ivory" : "text-ink")}
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" ref={panelRef} onKeyDown={trapFocus} hidden={!mobileOpen} className="fixed inset-x-0 bottom-0 overflow-y-auto overscroll-contain border-t border-line bg-ivory xl:hidden" style={{ top: height, right: "var(--admin-w, 0px)" }}>
        <nav aria-label="Mobile" className="mx-auto flex min-h-full max-w-[var(--container,1320px)] flex-col px-5 pb-10 pt-6 sm:px-8">
          <ul className="divide-y divide-line">
            {nav.map((item, i) =>
              item.children?.length ? (
                <li key={i} className="py-4">
                  <p className="text-eyebrow font-semibold uppercase text-muted">{item.label}</p>
                  <ul className="mt-2">
                    {item.children.map((c, j) => (
                      <li key={j}>
                        <SmartLink url={c.url} ariaCurrent={isActive(c.url) ? "page" : undefined} className={cn("flex min-h-12 items-center font-serif text-[1.65rem] leading-tight", isActive(c.url) ? "text-forest" : "text-ink")}>
                          {c.label}
                        </SmartLink>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={i} className="py-2">
                  <SmartLink url={item.url} ariaCurrent={isActive(item.url) ? "page" : undefined} className={cn("flex min-h-12 items-center font-serif text-[1.65rem] leading-tight", isActive(item.url) ? "text-forest" : "text-ink")}>
                    {item.label}
                  </SmartLink>
                </li>
              ),
            )}
          </ul>
          <div className="mt-auto flex flex-col gap-3 pt-8">
            {book.show && book.label ? (
              <a href={bookHref.href} {...(bookHref.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={buttonClass("primary", "w-full")}>
                {book.label} <ArrowUpRight className="size-4" aria-hidden />
              </a>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <a href={whatsappLink(site)} target="_blank" rel="noopener noreferrer" className={buttonClass("outline", "w-full px-3")}>
                <Icon name="brand:whatsapp" className="size-4" /> WhatsApp
              </a>
              <a href={`mailto:${site.email}`} className={buttonClass("outline", "w-full px-3")}>
                <Mail className="size-4" aria-hidden /> Email
              </a>
            </div>
          </div>
        </nav>
      </div>

      {admin.isAdmin ? (
        <button type="button" onClick={() => admin.openTab("header")} className="admin-ui absolute -bottom-9 left-3 z-10 flex items-center gap-1.5 rounded-md bg-zinc-950/90 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-zinc-900">
          <PanelTop className="size-3.5" /> Edit header
        </button>
      ) : null}
    </header>
  );
}
