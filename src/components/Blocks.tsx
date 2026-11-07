import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowUpRight, ChevronLeft, ChevronRight, Compass, Expand, Play, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useImageSrc } from "@/cms/idb";
import { Icon } from "@/cms/icons";
import type { ImageRef } from "@/cms/types";
import { cdn, isCdnPath, media as RESORT_MEDIA, srcSet } from "@/lib/media";
import { Md } from "@/lib/markdown";
import { Reveal, stagger, useMotionConfig } from "./motion";
import { Img } from "./ui";

/* ───────────── Info list ───────────── */

export type InfoItem = { title?: string; text?: string; icon?: string; image?: ImageRef };
export type InfoStyle = "list" | "cards" | "numbered" | "cursorReveal";
const CURSOR_FALLBACKS: ImageRef[] = [RESORT_MEDIA.cottage1, RESORT_MEDIA.lagoonSwim, RESORT_MEDIA.massage, RESORT_MEDIA.friends];

/** Expedition feature rows 01–04: giant numerals, cursor-following photo on desktop, tap-expand on mobile. */
function CursorRevealList({ items, dark }: { items: InfoItem[]; dark?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const { hasFinePointer, canAnimate, isAdmin } = useMotionConfig();
  const [active, setActive] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const withImg = items.map((it, i) => ({ ...it, image: it.image?.src ? it.image : CURSOR_FALLBACKS[i % CURSOR_FALLBACKS.length] }));
  useEffect(() => {
    const wrap = wrapRef.current, fl = floatRef.current;
    if (!wrap || !fl || !hasFinePointer || !canAnimate || isAdmin) return;
    gsap.set(fl, { xPercent: -50, yPercent: -58, scale: 0.85, opacity: 0, rotate: -3 });
    const xTo = gsap.quickTo(fl, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(fl, "y", { duration: 0.5, ease: "power3.out" });
    const onMove = (e: PointerEvent) => { const r = wrap.getBoundingClientRect(); xTo(e.clientX - r.left); yTo(e.clientY - r.top); };
    wrap.addEventListener("pointermove", onMove);
    return () => wrap.removeEventListener("pointermove", onMove);
  }, [hasFinePointer, canAnimate, isAdmin]);
  useEffect(() => {
    const fl = floatRef.current; if (!fl) return;
    gsap.to(fl, { opacity: active !== null ? 1 : 0, scale: active !== null ? 1 : 0.85, rotate: active !== null ? 2 : -3, duration: 0.45, ease: "power3.out", overwrite: "auto" });
  }, [active]);
  return (
    <div ref={wrapRef} className="relative" onPointerLeave={() => setActive(null)}>
      <div ref={floatRef} aria-hidden className="pointer-events-none absolute left-0 top-0 z-20 hidden w-64 lg:block">
        {withImg.map((it, i) => (
          <div key={i} className={cn("absolute inset-0 transition-opacity duration-300", i === (active ?? 0) ? "opacity-100" : "opacity-0")}>
            <Img image={it.image} ratio="4 / 5" sizes="256px" className="border border-ivory/20 shadow-2xl" />
          </div>
        ))}
        <div className="aspect-[4/5]" />
      </div>
      <dl>
        {withImg.map((it, i) => {
          const expanded = open === i;
          return (
            <Reveal key={i} delay={stagger(i, 80)} className={cn("row-rail group border-t last:border-b", dark ? "border-ivory/15" : "border-line")}>
              <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : i)} onPointerEnter={() => setActive(i)} className="flex w-full items-baseline gap-4 py-6 text-left sm:gap-8 sm:py-8">
                <span aria-hidden className="font-serif text-[clamp(2.6rem,6vw,5rem)] italic leading-none text-forest tnum">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1">
                  <dt className="font-serif text-[clamp(1.6rem,3.4vw,2.6rem)] leading-tight">{it.title}</dt>
                  <dd className={cn("mt-1 max-w-xl text-base leading-relaxed", dark ? "text-ivory/75" : "text-muted")}><Md text={it.text} className="space-y-2" /></dd>
                </span>
                <span aria-hidden className={cn("hidden shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.2em] lg:block", dark ? "text-sand" : "text-bark")}>{expanded ? "Tap to close" : "Hover / tap"}</span>
              </button>
              <div className={cn("grid transition-all duration-500 lg:hidden", expanded ? "grid-rows-[1fr] pb-6 opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <div className="overflow-hidden"><Img image={it.image} ratio="16 / 10" sizes="92vw" /></div>
              </div>
            </Reveal>
          );
        })}
      </dl>
    </div>
  );
}

const GRID: Record<number, string> = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 xl:grid-cols-4" };

export function InfoList({
  items,
  dark,
  columns = 1,
  style = "list",
  className,
}: {
  items: InfoItem[];
  dark?: boolean;
  columns?: number;
  style?: InfoStyle;
  className?: string;
}) {
  const list = items.filter((it) => it && (it.title || it.text));
  if (!list.length) return null;
  const grid = GRID[Math.min(4, Math.max(1, columns))] ?? "";
  const accent = dark ? "text-sand" : "text-forest";
  const body = cn("text-base leading-relaxed", dark ? "text-ivory/80" : "text-muted");
  const delay = (i: number) => stagger(columns > 1 ? i % columns : i, 70);

  if (style === "cursorReveal") return <CursorRevealList items={list} dark={dark} />;

  if (style === "cards") {
    return (
      <dl className={cn("grid gap-4", grid, className)}>
        {list.map((it, i) => (
          <Reveal
            key={i}
            delay={delay(i)}
            className={cn(
              "group relative overflow-hidden rounded-[var(--img-radius,0px)] border p-6 transition-[translate,border-color] duration-500 ease-[var(--ease-soft)] hover:-translate-y-1 sm:p-7",
              dark ? "border-ivory/15 bg-ivory/[0.05] hover:border-sand/45 hover:bg-ivory/[0.08]" : "border-line bg-shell/65 hover:border-stone",
            )}
          >
            <span aria-hidden className={cn("absolute inset-x-0 top-0 h-px origin-left scale-x-0 transition-transform duration-700 ease-[var(--ease-expo)] group-hover:scale-x-100", dark ? "bg-sand" : "bg-forest")} />
            {it.icon ? (
              <span className={cn("mb-5 grid size-11 place-items-center rounded-full transition-colors duration-500", dark ? "bg-ivory/10 text-sand group-hover:bg-sand group-hover:text-espresso-deep" : "bg-forest/15 text-forest group-hover:bg-forest group-hover:text-[var(--btn-primary-fg)]")}>
                <Icon name={it.icon} className="size-5" />
              </span>
            ) : null}
            <dt className="font-serif text-h4">{it.title}</dt>
            <dd className={cn("mt-2", body)}>
              <Md text={it.text} className="space-y-3" />
            </dd>
          </Reveal>
        ))}
      </dl>
    );
  }

  if (style === "numbered") {
    return (
      <dl className={cn("grid gap-x-10", grid, className)}>
        {list.map((it, i) => (
          <Reveal key={i} delay={delay(i)} className={cn("row-rail group grid grid-cols-[3rem_1fr] gap-x-4 border-t py-6 transition-colors", dark ? "border-ivory/15 text-sand" : "border-line text-forest")}>
            <span aria-hidden className={cn("font-serif text-h3 leading-none tnum transition-transform duration-500 group-hover:-translate-y-0.5", accent)}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className={dark ? "text-ivory" : "text-ink"}>
              <dt className="font-serif text-h4">{it.title}</dt>
              <dd className={cn("mt-1.5", body)}>
                <Md text={it.text} className="space-y-3" />
              </dd>
            </div>
          </Reveal>
        ))}
      </dl>
    );
  }

  return (
    <dl className={cn("grid gap-x-10", grid, className)}>
      {list.map((it, i) => (
        <Reveal key={i} delay={delay(i)} className={cn("row-rail group border-t py-5 transition-colors", dark ? "border-ivory/15 text-sand" : "border-line text-forest")}>
          <div className={dark ? "text-ivory" : "text-ink"}>
            {it.icon ? (
              <span className={cn("mb-3 flex size-9 items-center justify-center rounded-full transition-transform duration-500 group-hover:scale-110", dark ? "bg-ivory/10 text-sand" : "bg-forest/15 text-forest")}>
                <Icon name={it.icon} className="size-[18px]" />
              </span>
            ) : null}
            <dt className="font-serif text-h4">{it.title}</dt>
            <dd className={cn("mt-1.5", body)}>
              <Md text={it.text} className="space-y-3" />
            </dd>
          </div>
        </Reveal>
      ))}
    </dl>
  );
}

/* ───────────── Dark Nautical Expedition Map Frame ───────────── */

export function MapEmbed({
  query,
  title,
  caption,
  className,
  ratio = "aspect-[4/3]",
}: {
  query: string;
  title: string;
  caption?: string;
  className?: string;
  ratio?: string;
}) {
  const [natural, setNatural] = useState(false);
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=m&z=11&ie=UTF8&output=embed`;
  const externalHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return (
    <figure className={cn("on-dark overflow-hidden rounded-[var(--img-radius,0px)] border border-stone/60 bg-espresso-deep text-ivory", className)}>
      {/* Nautical chart telemetry header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory/12 bg-espresso-deep/95 px-4 py-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.18em]">
        <span className="inline-flex items-center gap-2 text-sand">
          <Compass className="size-3.5 text-forest" aria-hidden />
          <span className="truncate">CHART · {caption ?? query}</span>
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setNatural((v) => !v)}
            className="rounded-[2px] border border-ivory/20 px-2 py-0.5 text-[0.625rem] text-ivory/80 transition-colors hover:border-sand hover:text-sand"
          >
            {natural ? "Dark chart" : "Daylight map"}
          </button>
        </div>
      </div>

      {/* Map viewport with dark chart filter + corner survey ticks */}
      <div className={cn("group relative overflow-hidden bg-espresso-deep", ratio)}>
        <iframe
          src={src}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className={cn(
            "absolute inset-0 h-full w-full border-0 transition-[filter,opacity] duration-500",
            natural
              ? "opacity-95"
              : "opacity-90 [filter:invert(0.92)_hue-rotate(172deg)_saturate(0.55)_brightness(0.88)_contrast(1.14)]",
          )}
        />
        {/* Subtle vignette + reticle corners (pointer-events-none so map panning always works) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 shadow-[inset_0_0_48px_rgb(0_0_0/0.55)]" />
        <span aria-hidden className="pointer-events-none absolute left-3 top-3 size-3 border-l border-t border-sand/65" />
        <span aria-hidden className="pointer-events-none absolute right-3 top-3 size-3 border-r border-t border-sand/65" />
        <span aria-hidden className="pointer-events-none absolute bottom-3 left-3 size-3 border-b border-l border-sand/65" />
        <span aria-hidden className="pointer-events-none absolute bottom-3 right-3 size-3 border-b border-r border-sand/65" />
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-ivory/12 px-4 py-3 text-xs text-ivory/75">
        <span className="font-mono uppercase tracking-[0.14em]">{caption ?? query}</span>
        <a
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="View"
          className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-sand transition-colors hover:text-forest"
        >
          <span>Open in Google Maps</span>
          <ArrowUpRight className="size-3.5" aria-hidden />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </figcaption>
    </figure>
  );
}

/* ───────────── YouTube (click-to-load) ───────────── */

export function YouTube({ id, title, className }: { id: string; title: string; className?: string }) {
  const [play, setPlay] = useState(false);
  return (
    <div className={cn("on-dark relative aspect-video overflow-hidden rounded-[var(--img-radius,0px)] border border-stone/40 bg-espresso-deep", className)}>
      {play ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button type="button" data-cursor="View" onClick={() => setPlay(true)} className="group absolute inset-0 h-full w-full" aria-label={`Play video: ${title}`}>
          <img src={`https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-90 transition-all duration-700 group-hover:scale-[1.03] group-hover:opacity-100" />
          <span className="absolute inset-0 bg-gradient-to-t from-espresso-deep/80 via-espresso-deep/20 to-transparent" aria-hidden />
          <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-forest text-[var(--btn-primary-fg)] shadow-xl transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-110">
            <Play className="size-6 translate-x-0.5 fill-current" aria-hidden />
          </span>
          <span className="absolute inset-x-0 bottom-0 p-4 text-left font-mono text-xs uppercase tracking-[0.16em] text-ivory sm:p-5">{title}</span>
        </button>
      )}
    </div>
  );
}

/* ───────────── Gallery + lightbox ───────────── */

export type GalleryItem = { image?: ImageRef; thumb?: string; src?: string; video?: string; alt: string; href?: string };

const MASONRY_RATIOS = ["4 / 5", "1 / 1", "3 / 4", "4 / 3", "2 / 3", "1 / 1", "4 / 5", "3 / 2", "4 / 5"];
export function Gallery({
  items,
  ratio = "1 / 1",
  sizes = "(min-width: 768px) 33vw, 50vw",
  gridClass = "grid-cols-2 md:grid-cols-3",
  className,
  masonry = false,
}: {
  items: GalleryItem[];
  ratio?: string;
  sizes?: string;
  gridClass?: string;
  className?: string;
  masonry?: boolean;
}) {
  const [index, setIndex] = useState<number | null>(null);
  if (!items.length)
    return (
      <div className="expedition-placeholder flex min-h-56 flex-col items-center justify-center gap-3 border border-line p-10 text-center">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-sand">11°29′N · 119°52′E</span>
        <p className="max-w-sm font-serif text-h4 italic">Views from the island are on their way — follow @islandcayococo for the latest.</p>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] opacity-60">Linapacan Archipelago</span>
      </div>
    );
  if (masonry) {
    const cols: GalleryItem[][] = [[], [], []];
    items.forEach((it, i) => cols[i % 3].push(it));
    const renderBtn = (it: GalleryItem, globalIdx: number, r: string) => (
      <button type="button" data-cursor="View" onClick={() => setIndex(globalIdx)} className="group relative block w-full overflow-hidden rounded-[var(--img-radius,0px)]" aria-label={`View larger: ${it.alt || "photo"}`}>
        {it.image ? <Img image={it.image} ratio={r} sizes={sizes} alt="" imgClassName="transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.04]" /> : (
          <span className="expedition-placeholder relative block overflow-hidden" style={{ aspectRatio: r }}><img src={it.thumb} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" /></span>
        )}
        <span className="pointer-events-none absolute inset-0 bg-espresso-deep/0 transition-colors duration-300 group-hover:bg-espresso-deep/20" aria-hidden />
        <span className="absolute bottom-2.5 right-2.5 grid size-9 place-items-center rounded-full bg-espresso-deep/85 text-[var(--fg-on-dark)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden><Expand className="size-4" /></span>
      </button>
    );
    return (
      <>
        <div className={cn("grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3", className)}>
          {cols.map((col, c) => (
            <div key={c} className={cn("flex flex-col gap-2 sm:gap-3", c === 2 && "hidden md:flex")}>
              {col.map((it, j) => { const gi = c + j * 3; return <Reveal key={gi} delay={stagger(gi, 70)} y={16}>{renderBtn(it, gi, MASONRY_RATIOS[gi % MASONRY_RATIOS.length])}</Reveal>; })}
            </div>
          ))}
        </div>
        {index !== null ? <Lightbox items={items} index={index} onIndex={setIndex} onClose={() => setIndex(null)} /> : null}
      </>
    );
  }
  return (
    <>
      <ul className={cn("grid gap-2 sm:gap-3", gridClass, className)}>
        {items.map((it, i) => (
          <li key={`${it.image?.src ?? it.thumb}-${i}`}>
            <button
              type="button"
              data-cursor="View"
              onClick={() => setIndex(i)}
              className="group relative block w-full overflow-hidden rounded-[var(--img-radius,0px)]"
              aria-label={`View larger: ${it.alt || "photo"}`}
            >
              {it.image ? (
                <Img image={it.image} ratio={ratio} sizes={sizes} alt="" imgClassName="transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.04]" />
              ) : (
                <span className="expedition-placeholder relative block overflow-hidden" style={{ aspectRatio: ratio }}>
                  <img src={it.thumb} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                </span>
              )}
              <span className="pointer-events-none absolute inset-0 bg-espresso-deep/0 transition-colors duration-300 group-hover:bg-espresso-deep/20" aria-hidden />
              {it.video ? (
                <span className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ivory/90 text-ink" aria-hidden>
                  <Play className="size-5 translate-x-px fill-current" />
                </span>
              ) : (
                <span className="absolute bottom-2.5 right-2.5 grid size-9 place-items-center rounded-full bg-espresso-deep/85 text-[var(--fg-on-dark)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden>
                  <Expand className="size-4" />
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {index !== null ? <Lightbox items={items} index={index} onIndex={setIndex} onClose={() => setIndex(null)} /> : null}
    </>
  );
}

function LightboxImage({ item }: { item: GalleryItem }) {
  const resolved = useImageSrc(item.image?.src);
  const img = item.image;
  const isCdn = !!img && isCdnPath(img.src);
  const src = img ? (isCdn ? cdn(img.src, 1920) : resolved) : item.src ?? item.thumb;
  if (!src) return null;
  return <img key={src} src={src} srcSet={isCdn ? srcSet(img!) : undefined} sizes="100vw" alt={item.alt} className="max-h-full max-w-full animate-fade-up object-contain" />;
}

function Lightbox({ items, index, onIndex, onClose }: { items: GalleryItem[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const d = ref.current;
    if (d && !d.open) d.showModal();
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      prevFocus?.focus({ preventScroll: true });
    };
  }, []);
  const go = (d: number) => onIndex((index + d + items.length) % items.length);
  const item = items[index];
  const navBtn = "absolute top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-espresso-deep/75 text-ivory border border-ivory/15 transition-colors hover:bg-forest hover:text-[var(--btn-primary-fg)]";
  return (
    <dialog
      ref={ref}
      aria-label="Image viewer"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      className="on-dark fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-ivory"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ivory/75 tnum" aria-live="polite">
            {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          </p>
          <button type="button" onClick={onClose} autoFocus aria-label="Close image viewer" className="grid size-11 place-items-center rounded-full hover:bg-ivory/10">
            <X className="size-6" />
          </button>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 sm:px-20" onClick={(e) => e.target === e.currentTarget && onClose()}>
          {item.video ? <video key={item.video} src={item.video} controls playsInline autoPlay className="max-h-full max-w-full" /> : <LightboxImage item={item} />}
          {items.length > 1 ? (
            <>
              <button type="button" onClick={() => go(-1)} aria-label="Previous image" className={cn(navBtn, "left-2 sm:left-6")}>
                <ChevronLeft className="size-6" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next image" className={cn(navBtn, "right-2 sm:right-6")}>
                <ChevronRight className="size-6" />
              </button>
            </>
          ) : null}
        </div>
        <p className="px-4 py-4 text-center text-sm text-ivory/80 sm:px-6">
          {item.alt}
          {item.href ? (
            <>
              {" · "}
              <a href={item.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                View on Instagram
              </a>
            </>
          ) : null}
        </p>
      </div>
    </dialog>
  );
}

/**
 * "Recent views of our place". Set VITE_INSTAGRAM_FEED_URL to a public JSON feed (e.g. Behold.so)
 * to show the live Instagram feed including videos; otherwise the chosen photos are shown.
 */
type FeedPost = Record<string, unknown>;
const str = (p: FeedPost, ...keys: string[]) => {
  for (const k of keys) if (typeof p[k] === "string" && p[k]) return p[k] as string;
  return undefined;
};

export function InstagramGallery({ fallback, gridClass, masonry }: { fallback: GalleryItem[]; gridClass: string; masonry?: boolean }) {
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  useEffect(() => {
    const feed = import.meta.env.VITE_INSTAGRAM_FEED_URL;
    if (!feed) return;
    let cancelled = false;
    fetch(feed)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: unknown) => {
        const d = data as { posts?: FeedPost[]; data?: FeedPost[] } | FeedPost[];
        const posts = Array.isArray(d) ? d : d.posts ?? d.data ?? [];
        const mapped = posts.slice(0, 9).map((p): GalleryItem => {
          const sizes = p.sizes as { medium?: { mediaUrl?: string } } | undefined;
          const isVideo = (str(p, "mediaType", "media_type") ?? "") === "VIDEO";
          const full = str(p, "mediaUrl", "media_url");
          return {
            thumb: sizes?.medium?.mediaUrl ?? str(p, "thumbnailUrl", "thumbnail_url") ?? full,
            src: isVideo ? str(p, "thumbnailUrl", "thumbnail_url") : full,
            video: isVideo ? full : undefined,
            alt: (str(p, "prunedCaption", "caption") ?? "Instagram post").slice(0, 140),
            href: str(p, "permalink"),
          };
        });
        const valid = mapped.filter((i) => i.thumb);
        if (!cancelled && valid.length) setItems(valid);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  return <Gallery items={items ?? fallback} gridClass={gridClass} sizes="(min-width: 1024px) 400px, 33vw" masonry={masonry} />;
}
