import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Play, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useImageSrc } from "@/cms/idb";
import { Icon } from "@/cms/icons";
import type { ImageRef } from "@/cms/types";
import { cdn, isCdnPath, srcSet } from "@/lib/media";
import { Md } from "@/lib/markdown";
import { Reveal, stagger } from "./motion";
import { Img } from "./ui";

/* ───────────── Info list ───────────── */

export type InfoItem = { title?: string; text?: string; icon?: string };
export type InfoStyle = "list" | "cards" | "numbered";

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

  if (style === "cards") {
    return (
      <dl className={cn("grid gap-4", grid, className)}>
        {list.map((it, i) => (
          <Reveal
            key={i}
            delay={delay(i)}
            className={cn(
              "group relative overflow-hidden rounded-[var(--img-radius,0px)] border p-6 transition-[translate,box-shadow,border-color] duration-500 ease-[cubic-bezier(.22,.61,.36,1)] hover:-translate-y-1 sm:p-7",
              dark ? "border-ivory/15 bg-ivory/[0.06] hover:border-sand/50 hover:bg-ivory/[0.09]" : "border-line bg-ivory/70 hover:border-stone hover:shadow-[0_26px_50px_-32px_rgba(42,32,25,0.55)]",
            )}
          >
            <span aria-hidden className={cn("absolute inset-x-0 top-0 h-px origin-left scale-x-0 transition-transform duration-700 ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-x-100", dark ? "bg-sand" : "bg-forest")} />
            {it.icon ? (
              <span className={cn("mb-5 grid size-11 place-items-center rounded-full transition-colors duration-500", dark ? "bg-ivory/10 text-sand group-hover:bg-sand group-hover:text-espresso-deep" : "bg-forest/10 text-forest group-hover:bg-forest group-hover:text-ivory")}>
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
              <span className={cn("mb-3 flex size-9 items-center justify-center rounded-full transition-transform duration-500 group-hover:scale-110", dark ? "bg-ivory/10 text-sand" : "bg-forest/10 text-forest")}>
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

/* ───────────── Map (Google Maps embed, as on the original site) ───────────── */

export function MapEmbed({ query, title, caption, className, ratio = "aspect-[4/3]" }: { query: string; title: string; caption?: string; className?: string; ratio?: string }) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=m&z=13&ie=UTF8&output=embed`;
  return (
    <figure className={className}>
      <div className={cn("relative overflow-hidden rounded-[var(--img-radius,0px)] border border-line bg-sand", ratio)}>
        <iframe src={src} title={title} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" />
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm opacity-80">
        <span>{caption ?? query}</span>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-4 hover:no-underline"
        >
          Open in Google Maps<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </figcaption>
    </figure>
  );
}

/* ───────────── YouTube (click-to-load) ───────────── */

export function YouTube({ id, title, className }: { id: string; title: string; className?: string }) {
  const [play, setPlay] = useState(false);
  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-[var(--img-radius,0px)] bg-espresso-deep", className)}>
      {play ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 h-full w-full" aria-label={`Play video: ${title}`}>
          <img src={`https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
          <span className="absolute inset-0 bg-gradient-to-t from-espresso-deep/70 to-transparent" aria-hidden />
          <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ivory text-ink shadow-lg transition-transform group-hover:scale-105">
            <Play className="size-6 translate-x-0.5 fill-current" aria-hidden />
          </span>
          <span className="absolute inset-x-0 bottom-0 p-4 text-left text-sm font-medium text-ivory sm:p-5">{title}</span>
        </button>
      )}
    </div>
  );
}

/* ───────────── Gallery + lightbox ───────────── */

export type GalleryItem = { image?: ImageRef; thumb?: string; src?: string; video?: string; alt: string; href?: string };

export function Gallery({
  items,
  ratio = "1 / 1",
  sizes = "(min-width: 768px) 33vw, 50vw",
  gridClass = "grid-cols-2 md:grid-cols-3",
  className,
}: {
  items: GalleryItem[];
  ratio?: string;
  sizes?: string;
  gridClass?: string;
  className?: string;
}) {
  const [index, setIndex] = useState<number | null>(null);
  if (!items.length) return null;
  return (
    <>
      <ul className={cn("grid gap-2 sm:gap-3", gridClass, className)}>
        {items.map((it, i) => (
          <li key={`${it.image?.src ?? it.thumb}-${i}`}>
            <button type="button" onClick={() => setIndex(i)} className="group relative block w-full overflow-hidden rounded-[var(--img-radius,0px)]" aria-label={`View larger: ${it.alt || "photo"}`}>
              {it.image ? (
                <Img image={it.image} ratio={ratio} sizes={sizes} alt="" imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
              ) : (
                <span className="relative block overflow-hidden bg-sand" style={{ aspectRatio: ratio }}>
                  <img src={it.thumb} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                </span>
              )}
              <span className="pointer-events-none absolute inset-0 bg-espresso-deep/0 transition-colors duration-300 group-hover:bg-espresso-deep/15" aria-hidden />
              {it.video ? (
                <span className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ivory/90 text-ink" aria-hidden>
                  <Play className="size-5 translate-x-px fill-current" />
                </span>
              ) : (
                <span className="absolute bottom-2.5 right-2.5 grid size-9 place-items-center rounded-full bg-ivory/90 text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden>
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
  const navBtn = "absolute top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-espresso-deep/60 text-ivory transition-colors hover:bg-ivory hover:text-ink";
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
          <p className="text-sm text-ivory/75" aria-live="polite">
            {index + 1} / {items.length}
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

export function InstagramGallery({ fallback, gridClass }: { fallback: GalleryItem[]; gridClass: string }) {
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
  return <Gallery items={items ?? fallback} gridClass={gridClass} sizes="(min-width: 1024px) 400px, 33vw" />;
}
