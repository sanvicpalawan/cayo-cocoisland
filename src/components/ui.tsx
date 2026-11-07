import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { useCms } from "@/cms/store";
import { useImageSrc } from "@/cms/idb";
import { Icon } from "@/cms/icons";
import type { ButtonData, ButtonVariant, ImageRef, Spacing, Tone } from "@/cms/types";
import { cdn, isCdnPath, srcSet } from "@/lib/media";
import { Magnetic } from "./motion";
import { SmartLink, useResolvedUrl } from "./SmartLink";

/* ───────────── Live Palawan Telemetry (Asia/Manila · UTC+8) ───────────── */

export type IslandTelemetry = {
  time: string;
  phase: "DAWN" | "DAYLIGHT" | "GOLDEN HOUR" | "STARLIGHT";
};

function computePalawanTelemetry(): IslandTelemetry {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const hh = Number(parts.find((p) => p.type === "hour")?.value ?? 12);
    const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
    const hStr = String(hh % 24).padStart(2, "0");
    const phase: IslandTelemetry["phase"] =
      hh >= 5 && hh < 8 ? "DAWN" : hh >= 8 && hh < 16 ? "DAYLIGHT" : hh >= 16 && hh < 19 ? "GOLDEN HOUR" : "STARLIGHT";
    return { time: `${hStr}:${mm} PHT`, phase };
  } catch {
    return { time: "UTC+8 PHT", phase: "DAYLIGHT" };
  }
}

export function usePalawanClock(): IslandTelemetry {
  const [telemetry, setTelemetry] = useState<IslandTelemetry>(computePalawanTelemetry);
  useEffect(() => {
    setTelemetry(computePalawanTelemetry());
    const id = window.setInterval(() => setTelemetry(computePalawanTelemetry()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return telemetry;
}

/* ───────────── Layout ───────────── */

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[var(--container,1440px)] px-5 sm:px-8 lg:px-12", className)}>{children}</div>;
}

const TONES: Record<Tone, string> = {
  ivory: "bg-[var(--atmo-bg,var(--color-ivory))] text-ink transition-colors duration-700",
  shell: "bg-[var(--atmo-surface,var(--color-shell))] text-ink transition-colors duration-700",
  espresso: "on-dark bg-espresso text-ivory",
  deep: "on-dark bg-espresso-deep text-ivory",
  forest: "on-dark bg-forest-deep text-ivory",
};
export const toneClass = (t: Tone = "ivory") => TONES[t] ?? TONES.ivory;
export const isDarkTone = (t?: Tone) => t === "espresso" || t === "deep" || t === "forest";

export function Section({
  id,
  tone = "ivory",
  spacing = "normal",
  className,
  children,
  labelledBy,
  fabHide,
}: {
  id?: string;
  tone?: Tone;
  spacing?: Spacing;
  className?: string;
  children: ReactNode;
  labelledBy?: string;
  fabHide?: boolean;
}) {
  return (
    <section
      id={id || undefined}
      aria-labelledby={labelledBy}
      data-fab-hide={fabHide || undefined}
      className={cn("relative", toneClass(tone), spacing === "compact" ? "sec-sm" : "sec", spacing === "flush" && "pt-0", className)}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children, light, className }: { children: ReactNode; light?: boolean; className?: string }) {
  return (
    <p className={cn("inline-flex items-center gap-2.5 font-mono text-eyebrow font-medium uppercase", light ? "text-sand" : "text-bark", className)}>
      <span aria-hidden className="inline-block size-1.5 rotate-45 bg-forest" />
      <span>{children}</span>
    </p>
  );
}

/* ───────────── Hand-Drawn SVG Horizon Wave & Stamp Motifs ───────────── */

export function WaveDivider({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1440 28"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("pointer-events-none block h-4 w-full text-stone/55", flip && "scale-y-[-1]", className)}
    >
      <path
        d="M0 15C148 5 262 24 418 14C574 4 686 23 852 13C1018 3 1168 23 1312 14C1364 11 1406 9 1440 12"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PassportStamp({ label = "BARANGONAN · LINAPACAN", sub = "11°29′N · 119°52′E", className }: { label?: string; sub?: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "inline-flex select-none items-center gap-3 rounded-[2px] border border-dashed border-bark/45 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bark/90",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-forest" />
      <span>{label}</span>
      <span className="opacity-50">·</span>
      <span className="tnum opacity-85">{sub}</span>
    </div>
  );
}

/* ───────────── Buttons (style from Admin → Theme → Buttons) ───────────── */

const VARIANT_CLASS: Record<Exclude<ButtonVariant, "text" | "textLight">, string> = {
  primary: "btn-primary",
  dark: "bg-espresso text-[var(--fg-on-dark)] border border-stone/60 hover:bg-espresso-deep",
  outline: "border border-ink/50 text-ink hover:border-forest hover:bg-forest hover:text-[var(--btn-primary-fg)]",
  light: "bg-ivory text-ink hover:bg-sand",
  outlineLight: "border border-ivory/45 text-ivory backdrop-blur-[2px] hover:border-forest hover:bg-forest hover:text-[var(--btn-primary-fg)]",
};

export function textLinkClass(light?: boolean, className?: string) {
  return cn(
    "group inline-flex items-center gap-2 border-b pb-1 font-mono text-[0.75rem] font-medium uppercase tracking-[0.18em] transition-colors",
    light ? "border-ivory/45 text-ivory hover:border-forest hover:text-sand" : "border-ink/40 text-ink hover:border-forest hover:text-forest",
    className,
  );
}

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  if (variant === "text" || variant === "textLight") return textLinkClass(variant === "textLight", className);
  return cn("btn", VARIANT_CLASS[variant] ?? VARIANT_CLASS.primary, className);
}

export function CmsButton({ button: b, className, magnetic }: { button: ButtonData; className?: string; magnetic?: boolean }) {
  const r = useResolvedUrl(b.url);
  const variant = b.variant ?? "primary";
  const isText = variant === "text" || variant === "textLight";
  const isMagnetic = magnetic ?? (variant === "primary" || variant === "light" || r.kind === "booking");
  const cursorLabel = r.kind === "booking" ? "Book" : isText ? undefined : "View";

  const trailing = b.icon ? null : r.external ? (
    <ArrowUpRight className="size-4 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
  ) : r.internal ? (
    <ArrowRight className={cn("size-4 shrink-0 transition-transform duration-300", isText ? "group-hover:translate-x-1" : "group-hover:translate-x-0.5")} aria-hidden />
  ) : null;

  const link = (
    <SmartLink
      url={b.url}
      newTab={b.newTab || undefined}
      data-cursor={cursorLabel}
      className={cn("group", buttonClass(variant, className))}
    >
      {b.icon ? <Icon name={b.icon} className="size-4 shrink-0" /> : null}
      <span>{b.label}</span>
      {trailing}
    </SmartLink>
  );

  return isMagnetic ? <Magnetic>{link}</Magnetic> : link;
}

export function Buttons({ buttons, className }: { buttons?: ButtonData[]; className?: string }) {
  const list = (Array.isArray(buttons) ? buttons : []).filter((b) => b && b.label);
  if (!list.length) return null;
  const hasText = list.some((b) => b.variant === "text" || b.variant === "textLight");
  return (
    <div className={cn("flex flex-wrap items-center", hasText ? "gap-x-7 gap-y-4" : "gap-3.5", className)}>
      {list.map((b, i) => (
        <CmsButton key={i} button={b} />
      ))}
    </div>
  );
}

/* ───────────── Images (CMS-driven with designed expedition placeholder) ───────────── */

/** Responsive image in a fixed-ratio frame. Handles resort CDN paths, uploaded (IndexedDB) images and URLs. */
export function Img({
  image,
  ratio,
  sizes = "100vw",
  priority,
  className,
  imgClassName,
  alt,
  flat,
}: {
  image?: ImageRef;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  alt?: string;
  flat?: boolean;
}) {
  const resolvedSrc = useImageSrc(image?.src);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const isCdn = !!image && isCdnPath(image.src);
  const src = isCdn ? cdn(image!.src, 1440) : resolvedSrc;

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImg = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        "expedition-placeholder relative overflow-hidden",
        !flat && "rounded-[var(--img-radius,0px)]",
        className,
      )}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      {showImg ? (
        <img
          key={src}
          src={src}
          srcSet={isCdn ? srcSet(image!) : undefined}
          sizes={sizes}
          alt={alt ?? image?.alt ?? ""}
          width={image?.w}
          height={image?.h}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          ref={(el) => {
            if (el && el.complete && el.naturalWidth > 0 && !loaded) setLoaded(true);
          }}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
          style={{ objectPosition: image?.pos }}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-[var(--ease-soft)]",
            loaded ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      ) : (
        <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted/60">
          <span className="inline-flex items-center gap-2">
            <span className="size-1.5 rotate-45 bg-bark/70" />
            <span>11°29′N · 119°52′E</span>
          </span>
          <span className="self-end opacity-70">LINAPACAN ARCHIPELAGO</span>
        </div>
      )}
    </div>
  );
}

/* ───────────── Brand ───────────── */

export function Logo({ light }: { light?: boolean }) {
  const { header } = useCms().content;
  const resolved = useImageSrc(header.logo?.src);
  const src = header.logo && isCdnPath(header.logo.src) ? cdn(header.logo.src, 112) : resolved;
  const square = !header.logo?.w || !header.logo?.h || Math.abs(header.logo.w - header.logo.h) < 4;
  return (
    <span className="flex items-center gap-3">
      {header.showLogoImage && src ? (
        <img
          src={src}
          alt=""
          className={cn(
            "shrink-0 ring-1 ring-current/15",
            square ? "size-9 rounded-full object-cover sm:size-10" : "h-9 w-auto max-w-36 object-contain sm:h-10",
          )}
          decoding="async"
        />
      ) : null}
      {header.title || header.subtitle ? (
        <span className="flex flex-col leading-none">
          {header.title ? (
            <span className={cn("font-serif text-[1.45rem] tracking-[-0.015em]", light ? "text-[var(--fg-on-dark)]" : "text-ink")}>
              {header.title}
            </span>
          ) : null}
          {header.subtitle ? (
            <span className={cn("mt-1 font-mono text-[0.6rem] font-medium uppercase tracking-[0.22em]", light ? "text-sand/85" : "text-bark")}>
              {header.subtitle}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
