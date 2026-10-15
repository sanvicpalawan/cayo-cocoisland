import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/utils/cn";

/**
 * Scroll reveal that works in every browser (IntersectionObserver), unlike CSS scroll-timelines.
 * Content is ALWAYS rendered: if motion is off, unsupported, or the observer never fires,
 * elements simply start visible — nothing can get stuck invisible.
 */
const motionEnabled = () =>
  typeof window !== "undefined" &&
  "IntersectionObserver" in window &&
  !document.documentElement.classList.contains("no-anim") &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useInView<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(() => !enabled || !motionEnabled());
  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.01 },
    );
    io.observe(el);
    // Safety net: never leave content hidden.
    const t = window.setTimeout(() => setInView(true), 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, [inView]);
  return { ref, inView };
}

export const stagger = (index: number, step = 70, max = 420) => Math.min(index * step, max);

export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
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
      className={cn("transition-[opacity,translate,filter] duration-[850ms] ease-[cubic-bezier(.22,.61,.36,1)] motion-reduce:transition-none", inView ? "translate-y-0 opacity-100 blur-0" : cn("translate-y-[var(--rv-y)] opacity-0", blur && "blur-[6px]"), className)}
    >
      {children}
    </Tag>
  );
}


