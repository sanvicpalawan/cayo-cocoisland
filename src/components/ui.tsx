import { useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { useCms } from "@/cms/store";
import { useImageSrc } from "@/cms/idb";
import { Icon } from "@/cms/icons";
import type { ButtonData, ButtonVariant, ImageRef, Spacing, Tone } from "@/cms/types";
import { cdn, isCdnPath, srcSet } from "@/lib/media";
import { SmartLink, useResolvedUrl } from "./SmartLink";

/* ───────────── Layout ───────────── */

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[var(--container,1320px)] px-5 sm:px-8 lg:px-12", className)}>{children}</div>;
}

const TONES: Record<Tone, string> = {
  ivory: "bg-ivory text-ink",
  shell: "bg-shell text-ink",
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
      className={cn(toneClass(tone), spacing === "compact" ? "sec-sm" : "sec", spacing === "flush" && "pt-0", className)}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children, light, className }: { children: ReactNode; light?: boolean; className?: string }) {
  return <p className={cn("text-eyebrow font-semibold uppercase", light ? "text-sand" : "text-forest", className)}>{children}</p>;
}

/* ───────────── Buttons (style from Admin → Theme → Buttons) ───────────── */

const VARIANT_CLASS: Record<Exclude<ButtonVariant, "text" | "textLight">, string> = {
  primary: "btn-primary",
  dark: "bg-espresso text-ivory hover:bg-espresso-deep",
  outline: "border border-ink/60 text-ink hover:border-ink hover:bg-ink hover:text-ivory",
  light: "bg-ivory text-ink hover:bg-sand",
  outlineLight: "border border-ivory/60 text-ivory hover:border-ivory hover:bg-ivory hover:text-ink",
};

export function textLinkClass(light?: boolean, className?: string) {
  return cn(
    "group inline-flex items-center gap-2 border-b pb-1 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] transition-colors",
    light ? "border-ivory/50 text-ivory hover:border-ivory" : "border-ink/40 text-ink hover:border-ink",
    className,
  );
}

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  if (variant === "text" || variant === "textLight") return textLinkClass(variant === "textLight", className);
  return cn("btn", VARIANT_CLASS[variant] ?? VARIANT_CLASS.primary, className);
}

export function CmsButton({ button: b, className }: { button: ButtonData; className?: string }) {
  const r = useResolvedUrl(b.url);
  const isText = b.variant === "text" || b.variant === "textLight";
  const trailing = b.icon ? null : r.external ? (
    <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
  ) : r.internal ? (
    <ArrowRight className={cn("size-4 shrink-0", isText && "transition-transform group-hover:translate-x-1")} aria-hidden />
  ) : null;
  return (
    <SmartLink url={b.url} newTab={b.newTab || undefined} className={buttonClass(b.variant ?? "primary", className)}>
      {b.icon ? <Icon name={b.icon} className="size-4 shrink-0" /> : null}
      {b.label}
      {trailing}
    </SmartLink>
  );
}

export function Buttons({ buttons, className }: { buttons?: ButtonData[]; className?: string }) {
  const list = (Array.isArray(buttons) ? buttons : []).filter((b) => b && b.label);
  if (!list.length) return null;
  const hasText = list.some((b) => b.variant === "text" || b.variant === "textLight");
  return (
    <div className={cn("flex flex-wrap items-center", hasText ? "gap-x-7 gap-y-4" : "gap-3", className)}>
      {list.map((b, i) => (
        <CmsButton key={i} button={b} />
      ))}
    </div>
  );
}

/* ───────────── Images ───────────── */

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
  const isCdn = !!image && isCdnPath(image.src);
  const src = isCdn ? cdn(image!.src, 1440) : resolvedSrc;
  return (
    <div
      className={cn("relative overflow-hidden bg-sand/70", !flat && "rounded-[var(--img-radius,0px)]", className)}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      {src ? (
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
          onError={() => setLoaded(true)}
          style={{ objectPosition: image?.pos }}
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out", loaded ? "opacity-100" : "opacity-0", imgClassName)}
        />
      ) : null}
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
          className={cn("shrink-0", square ? "size-10 rounded-full object-cover sm:size-11" : "h-10 w-auto max-w-36 object-contain sm:h-11")}
          decoding="async"
        />
      ) : null}
      {header.title || header.subtitle ? (
        <span className="flex flex-col leading-none">
          {header.title ? <span className={cn("font-serif text-[1.35rem] tracking-[-0.01em]", light ? "text-ivory" : "text-ink")}>{header.title}</span> : null}
          {header.subtitle ? (
            <span className={cn("mt-1 text-[0.625rem] font-semibold uppercase tracking-[0.24em]", light ? "text-ivory/80" : "text-muted")}>{header.subtitle}</span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
