import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { cn } from "@/utils/cn";
import { useAdmin } from "@/admin/context";
import { useCms } from "@/cms/store";
import { useRoute } from "@/lib/router";

gsap.registerPlugin(ScrollTrigger);

/** Single easing family across the entire motion system: power3 / expo (no bounce). */
export const EASE_OUT = "power3.out";
export const EASE_EXPO = "expo.out";
export const EASE_IN_OUT = "expo.inOut";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

let activeLenis: Lenis | null = null;

/** Smoothly scrolls via Lenis when active, falling back cleanly to native scroll. */
export function smoothScrollTo(target: number | string | HTMLElement, options?: { offset?: number; immediate?: boolean; duration?: number }) {
  if (typeof window === "undefined") return;
  if (activeLenis && !options?.immediate) {
    activeLenis.scrollTo(target, {
      offset: options?.offset ?? 0,
      duration: options?.duration ?? 1.05,
    });
    return;
  }
  if (activeLenis && options?.immediate) {
    activeLenis.scrollTo(target, { offset: options?.offset ?? 0, immediate: true, force: true });
    return;
  }
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: options?.immediate ? "auto" : "smooth" });
  } else {
    const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
    el?.scrollIntoView({ behavior: options?.immediate ? "auto" : "smooth", block: "start" });
  }
}

function useMediaQuery(query: string, initial = false) {
  const [matches, setMatches] = useState(() => (typeof window !== "undefined" ? window.matchMedia(query).matches : initial));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export type MotionConfig = {
  /** Visitor motion enabled (not reduced-motion, Theme → animations enabled). */
  canAnimate: boolean;
  /** Smooth scroll enabled (disabled in Admin mode and reduced motion). */
  canSmoothScroll: boolean;
  /** Heavy scroll-pinning / horizontal hijack enabled (public desktop visitors only). */
  canPin: boolean;
  isAdmin: boolean;
  reducedMotion: boolean;
  isDesktop: boolean;
  hasFinePointer: boolean;
};

export function useMotionConfig(): MotionConfig {
  const { isAdmin } = useAdmin();
  const { content } = useCms();
  const animations = content.theme.layout.animations !== false;
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);
  const hasFinePointer = useMediaQuery("(hover: hover) and (pointer: fine)", false);

  return useMemo(() => {
    const canAnimate = animations && !reducedMotion;
    const canSmoothScroll = canAnimate && !isAdmin;
    const canPin = canAnimate && !isAdmin && isDesktop;
    return { canAnimate, canSmoothScroll, canPin, isAdmin, reducedMotion, isDesktop, hasFinePointer };
  }, [animations, reducedMotion, isAdmin, isDesktop, hasFinePointer]);
}

/**
 * Global Motion Stage — mounted once inside <Header /> so it has access to
 * CmsProvider, RouterProvider and AdminProvider without modifying App.tsx.
 *
 * Responsibilities:
 *  1. Lenis smooth scroll synced to GSAP ticker + ScrollTrigger (public visitors only).
 *  2. Hash-router page & ?s=section deep-link scroll reset + ScrollTrigger refresh.
 *  3. Scroll-driven atmospheric palette shifts (dawn -> noon -> golden -> night).
 *  4. Subtle film-grain overlay (hidden in Admin & reduced motion).
 */
/* ───────────── Expedition Cursor (desktop companion, native cursor intact) ───────────── */
function ExpeditionCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const { canAnimate, isAdmin, hasFinePointer } = useMotionConfig();
  const enabled = canAnimate && !isAdmin && hasFinePointer;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    gsap.set(el, { xPercent: -50, yPercent: -50, x: -100, y: -100, opacity: 0, scale: 0.6 });
    const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: EASE_OUT });
    const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: EASE_OUT });
    let shown = false;
    const onMove = (e: PointerEvent) => {
      xTo(e.clientX); yTo(e.clientY);
      if (!shown) { shown = true; gsap.to(el, { opacity: 1, duration: 0.3 }); }
      const t = e.target as HTMLElement | null;
      const hide = !!t?.closest(".admin-ui, [data-agent], iframe, input, textarea, select, dialog");
      const tagged = t?.closest<HTMLElement>("[data-cursor]");
      const label = !hide ? (tagged?.dataset.cursor || (t?.closest("a[href*='booking'], a[href*='{booking}']") ? "Book" : undefined)) : undefined;
      if (labelRef.current) labelRef.current.textContent = label ?? "";
      gsap.to(el, { scale: label ? 1 : 0.6, opacity: hide ? 0 : 1, backgroundColor: label ? "var(--color-forest)" : "var(--color-sand)", duration: 0.35, ease: EASE_OUT, overwrite: "auto" });
      el.dataset.active = label ? "true" : "false";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);
  if (!enabled) return null;
  return (
    <div ref={ref} aria-hidden className="expedition-cursor pointer-events-none fixed left-0 top-0 z-[90] flex size-14 items-center justify-center rounded-full border border-ivory/30 mix-blend-normal will-change-transform">
      <span ref={labelRef} className="font-mono text-[0.6rem] font-medium uppercase tracking-[0.18em] text-[var(--btn-primary-fg,var(--fg-on-dark))]" />
    </div>
  );
}

/* ───────────── Expedition Intro (once per session, 1.2s curtain) ───────────── */
function ExpeditionIntro() {
  const ref = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const { canAnimate, isAdmin } = useMotionConfig();
  const [done, setDone] = useState(() => { try { return !!sessionStorage.getItem("cc-intro-seen"); } catch { return true; } });
  useEffect(() => {
    if (done || !canAnimate || isAdmin) return;
    const el = ref.current; if (!el) return;
    let finished = false;
    const finish = () => { if (finished) return; finished = true; el.style.pointerEvents = "none"; el.style.opacity = "0"; try { sessionStorage.setItem("cc-intro-seen", "1"); } catch { /* noop */ } setDone(true); };
    gsap.set(el, { opacity: 1, pointerEvents: "auto" });
    const tl = gsap.timeline({ onComplete: finish });
    tl.fromTo(el.querySelectorAll("[data-intro-line]"), { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: EASE_EXPO })
      .fromTo(barRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: EASE_OUT }, "-=0.25")
      .to(el, { yPercent: -100, duration: 0.45, ease: EASE_IN_OUT }, "+=0.1");
    const kill = () => { tl.kill(); gsap.to(el, { yPercent: -100, duration: 0.3, ease: EASE_IN_OUT, onComplete: finish }); };
    const onKey = (e: KeyboardEvent) => { if (["Escape", " ", "Enter"].includes(e.key)) kill(); };
    el.addEventListener("click", kill); window.addEventListener("keydown", onKey);
    const safety = window.setTimeout(finish, 1350);
    return () => { tl.kill(); el.removeEventListener("click", kill); window.removeEventListener("keydown", onKey); window.clearTimeout(safety); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAnimate, isAdmin]);
  if (done || !canAnimate || isAdmin) return null;
  return (
    <div ref={ref} role="button" tabIndex={0} aria-label="Skip intro" className="expedition-intro on-dark fixed inset-0 z-[95] flex flex-col items-center justify-center bg-espresso-deep text-ivory">
      <p className="overflow-hidden font-mono text-[0.65rem] uppercase tracking-[0.3em] text-sand"><span data-intro-line className="inline-block">11°29′N · 119°52′E — LINAPACAN, PALAWAN</span></p>
      <p className="mt-3 overflow-hidden font-serif text-[clamp(3rem,10vw,7rem)] leading-none tracking-[-0.02em]"><span data-intro-line className="inline-block">CAYO COCO</span></p>
      <div className="mt-6 h-px w-48 overflow-hidden bg-ivory/15"><div ref={barRef} className="h-full w-full origin-left bg-forest" /></div>
      <p className="mt-4 font-mono text-[0.6rem] uppercase tracking-[0.24em] text-ivory/50">Click or press Esc to enter</p>
    </div>
  );
}

export function MotionStage() {
  const { canAnimate, canSmoothScroll, isAdmin } = useMotionConfig();
  const { content } = useCms();
  const route = useRoute();
  const routeKey = `${route.path}|${route.section ?? ""}|${route.params.toString()}`;
  const prevPath = useRef(route.path);

  // 1. Lenis + GSAP ticker bridge
  useEffect(() => {
    if (!canSmoothScroll) {
      if (activeLenis) {
        activeLenis.destroy();
        activeLenis = null;
      }
      document.documentElement.classList.remove("lenis", "lenis-smooth", "lenis-stopped");
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      autoRaf: false,
      autoToggle: true,
      allowNestedScroll: true,
      stopInertiaOnNavigate: true,
      respectReducedMotion: true,
      prevent: (node) => Boolean(node.closest?.(".admin-ui, [data-agent], dialog, #mobile-menu, [data-lenis-prevent]")),
    });
    activeLenis = lenis;

    const onLenisScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onLenisScroll);

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.off("scroll", onLenisScroll);
      lenis.destroy();
      if (activeLenis === lenis) activeLenis = null;
      document.documentElement.classList.remove("lenis", "lenis-smooth", "lenis-stopped");
    };
  }, [canSmoothScroll]);

  // 2. Cooperate with Hash Router (#/path and ?s=section deep links) + clean ScrollTrigger refresh
  useEffect(() => {
    const pathChanged = prevPath.current !== route.path;
    prevPath.current = route.path;

    if (!route.section && pathChanged) {
      if (activeLenis) activeLenis.scrollTo(0, { immediate: true, force: true });
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    let timerA: number | undefined;
    let timerB: number | undefined;

    if (route.section) {
      const targetId = route.section;
      timerA = window.setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          if (activeLenis) activeLenis.scrollTo(el, { offset: -88, duration: 1.0 });
          else el.scrollIntoView({ behavior: canAnimate ? "smooth" : "auto", block: "start" });
        }
      }, pathChanged ? 150 : 40);
    }

    // Refresh ScrollTrigger after new page DOM & lazy aspect-ratio frames settle
    timerB = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 220);

    return () => {
      window.clearTimeout(timerA);
      window.clearTimeout(timerB);
    };
  }, [routeKey, route.path, route.section, canAnimate]);

  // Refresh triggers when CMS sections are edited/reordered or admin drawer docks
  useEffect(() => {
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 160);
    return () => window.clearTimeout(t);
  }, [content.pages, isAdmin]);

  // 3. Atmospheric palette shift: Dawn -> Noon -> Golden Hour -> Night
  useEffect(() => {
    const root = document.documentElement;
    if (!canAnimate || isAdmin) {
      root.dataset.atmo = "dawn";
      return;
    }

    const main = document.getElementById("main");
    if (!main) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: main,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const p = self.progress;
          const next = p < 0.26 ? "dawn" : p < 0.56 ? "noon" : p < 0.82 ? "golden" : "night";
          if (root.dataset.atmo !== next) root.dataset.atmo = next;
        },
      });
    }, main);

    return () => {
      ctx.revert();
    };
  }, [canAnimate, isAdmin, route.path, content.pages.length]);

  if (isAdmin || !canAnimate) return null;
  return (
    <>
      <div aria-hidden className="film-grain" />
      <ExpeditionCursor />
      <ExpeditionIntro />
    </>
  );
}

/* ───────────── Backward-compatible Reveal & useInView API ───────────── */

const motionAllowed = () =>
  typeof window !== "undefined" &&
  !document.documentElement.classList.contains("no-anim") &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useInView<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(() => !enabled || !motionAllowed());

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el || !motionAllowed()) {
      setInView(true);
      return;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 92%",
        once: true,
        onEnter: () => setInView(true),
      });
    }, el);

    // Safety net so content can never remain hidden
    const fallback = window.setTimeout(() => setInView(true), 2200);
    return () => {
      ctx.revert();
      window.clearTimeout(fallback);
    };
  }, [inView]);

  return { ref, inView };
}

export const stagger = (index: number, step = 75, max = 450) => Math.min(index * step, max);

export function Reveal({
  children,
  className,
  delay = 0,
  y = 20,
  blur,
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  blur?: boolean;
  as?: ElementType;
  style?: CSSProperties;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <Tag
      ref={ref}
      style={{ ...style, transitionDelay: inView ? `${delay}ms` : "0ms", "--rv-y": `${y}px` } as CSSProperties}
      className={cn(
        "transition-[opacity,translate,filter] duration-[920ms] ease-[var(--ease-soft)] motion-reduce:transition-none",
        inView ? "translate-y-0 opacity-100 blur-0" : cn("translate-y-[var(--rv-y)] opacity-0", blur && "blur-[6px]"),
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/* ───────────── Editorial Split-Line Heading Reveal ───────────── */

/**
 * Splits a headline into masked lines/clauses and reveals each upward with power3/expo easing.
 * Screen readers read the clean full string once via aria-label; Admin & reduced-motion render immediately.
 */
export function SplitHeading({
  text,
  as: Tag = "h2",
  id,
  className,
  accentItalic = false,
  priority = false,
}: {
  text: string;
  as?: "h1" | "h2" | "h3";
  id?: string;
  className?: string;
  /** Italicises the middle clause (e.g. "Escape, *relax,* breathe.") for editorial tension. */
  accentItalic?: boolean;
  priority?: boolean;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const { canAnimate, isAdmin } = useMotionConfig();

  const lines = useMemo(() => {
    const rawLines = String(text ?? "")
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (rawLines.length > 1) return rawLines;
    const single = rawLines[0] ?? "";
    // If short punctuated cadence like "Escape, relax, breathe." split cleanly by comma phrases
    const commaParts = single.split(/(?<=,)\s+/).filter(Boolean);
    if (accentItalic && commaParts.length >= 2 && commaParts.length <= 4 && single.length <= 42) {
      return commaParts;
    }
    // Otherwise split into balanced word groups (~3 words per masked line)
    const words = single.split(/\s+/).filter(Boolean);
    if (words.length <= 3) return [single];
    const perLine = words.length <= 6 ? 2 : 3;
    const out: string[] = [];
    for (let i = 0; i < words.length; i += perLine) {
      out.push(words.slice(i, i + perLine).join(" "));
    }
    return out;
  }, [text, accentItalic]);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || !canAnimate || isAdmin) return;
    const ctx = gsap.context(() => {
      const items = el.querySelectorAll<HTMLElement>("[data-split-line]");
      if (!items.length) return;
      if (priority) {
        gsap.fromTo(
          items,
          { yPercent: 108, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 1.05, stagger: 0.09, ease: EASE_EXPO, delay: 0.08, clearProps: "transform" },
        );
      } else {
        gsap.fromTo(
          items,
          { yPercent: 105, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.95,
            stagger: 0.08,
            ease: EASE_OUT,
            clearProps: "transform",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      }
    }, el);
    return () => ctx.revert();
  }, [canAnimate, isAdmin, text, priority]);

  return (
    <Tag ref={ref} id={id} aria-label={text} className={className}>
      {lines.map((line, i) => {
        const italic = accentItalic && lines.length >= 2 && i === 1;
        return (
          <span key={`${line}-${i}`} aria-hidden className="block overflow-hidden pb-[0.09em] -mb-[0.09em]">
            <span data-split-line className={cn("inline-block will-change-transform", italic && "italic text-sand")}>
              {line}
              {i < lines.length - 1 ? " " : ""}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}

/* ───────────── Clip-Path Mask Image + Parallax ───────────── */

export function MaskImage({
  children,
  className,
  parallax = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Subtle vertical parallax percentage on desktop (e.g. 8). */
  parallax?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { canAnimate, isAdmin, isDesktop } = useMotionConfig();

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || !canAnimate || isAdmin) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { clipPath: "inset(10% 0% 10% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.15,
          ease: EASE_EXPO,
          clearProps: "clipPath",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        },
      );
      if (parallax && isDesktop) {
        const inner = el.querySelector<HTMLElement>("[data-parallax-media]");
        if (inner) {
          gsap.fromTo(
            inner,
            { yPercent: -parallax, scale: 1 + Math.abs(parallax) * 0.012 },
            {
              yPercent: parallax,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        }
      }
    }, el);
    return () => ctx.revert();
  }, [canAnimate, isAdmin, isDesktop, parallax]);

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      {parallax ? (
        <div data-parallax-media className="h-full w-full will-change-transform">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/* ───────────── Hairline Rule Line-Draw ───────────── */

export function DrawLine({ className, delay = 0 }: { className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { canAnimate, isAdmin } = useMotionConfig();

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || !canAnimate || isAdmin) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.0,
          delay,
          ease: EASE_EXPO,
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [canAnimate, isAdmin, delay]);

  return <div ref={ref} aria-hidden className={cn("h-px w-full origin-left bg-line", className)} />;
}

/* ───────────── Desktop Magnetic CTA Wrapper ───────────── */

export function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const { canAnimate, isAdmin, hasFinePointer } = useMotionConfig();
  const active = canAnimate && !isAdmin && hasFinePointer;

  const onMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (!active || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * strength;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * strength;
    gsap.to(ref.current, { x: dx, y: dy, duration: 0.45, ease: EASE_OUT, overwrite: "auto" });
  };

  const onLeave = () => {
    if (!ref.current) return;
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.65, ease: EASE_EXPO, overwrite: "auto" });
  };

  return (
    <span ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={cn("inline-flex will-change-transform", className)}>
      {children}
    </span>
  );
}
