import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type JSX, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, ArrowRight, Check, ChevronLeft, ChevronRight, Compass, Mail, Minus, Plus, Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";
import { useCms, useSite } from "@/cms/store";
import { useImageSrc } from "@/cms/idb";
import { Icon } from "@/cms/icons";
import { whatsappLink } from "@/cms/links";
import type { ButtonData, ImageRef, Page, Section as SectionT, SectionData, SectionType, Tone } from "@/cms/types";
import { cdn, isCdnPath, media as RESORT_MEDIA, menuArt } from "@/lib/media";
import { Md } from "@/lib/markdown";
import { Gallery, InfoList, InstagramGallery, MapEmbed, YouTube, type InfoItem, type InfoStyle } from "./Blocks";
import { InquiryForm } from "./Forms";
import { DrawLine, EASE_EXPO, Magnetic, MaskImage, Reveal, SplitHeading, smoothScrollTo, stagger, useMotionConfig } from "./motion";
import { SmartLink } from "./SmartLink";
import {
  Buttons,
  CmsButton,
  Container,
  Eyebrow,
  Img,
  PassportStamp,
  Section,
  WaveDivider,
  buttonClass,
  isDarkTone,
  toneClass,
  usePalawanClock,
} from "./ui";

gsap.registerPlugin(ScrollTrigger);

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type P = { s: SectionT; page: Page; isFirst: boolean };
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const tid = (s: SectionT) => `${s.id}-title`;
const hasImages = (v: unknown) => arr<ImageRef>(v).some((i) => i && i.src);
const infoStyle = (v: unknown): InfoStyle => (v === "cards" || v === "numbered" || v === "cursorReveal" ? v : "list");

function Title({ s, isFirst, className, children }: { s: SectionT; isFirst: boolean; className: string; children: ReactNode }) {
  const Tag = isFirst ? "h1" : "h2";
  return (
    <Tag id={tid(s)} className={cn("whitespace-pre-line", className)}>
      {children}
    </Tag>
  );
}

function Head({ s, isFirst, light, lead, size = "text-h2", leadClass }: { s: SectionT; isFirst: boolean; light: boolean; lead?: string; size?: string; leadClass?: string }) {
  const d = s.data;
  return (
    <>
      {d.eyebrow ? <Eyebrow light={light}>{d.eyebrow}</Eyebrow> : null}
      {d.title ? (
        <Title s={s} isFirst={isFirst} className={cn(size, d.eyebrow && "mt-4")}>
          {d.title}
        </Title>
      ) : null}
      {lead ? <p className={cn("mt-5 whitespace-pre-line text-lead", light ? "text-ivory/85" : "text-muted", leadClass)}>{lead}</p> : null}
    </>
  );
}

/** Name · dotted leader · price — used by menus and price lists. */
function LeaderRow({ name, price, light, className }: { name: ReactNode; price?: string; light?: boolean; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}>
      <span className="font-serif text-h4 leading-snug">{name}</span>
      {price ? (
        <>
          <span aria-hidden className={cn("leader", light ? "text-ivory" : "text-ink")} />
          <span className={cn("tnum shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[0.8125rem] font-medium", light ? "bg-ivory/10 text-sand" : "bg-forest/15 text-forest")}>{price}</span>
        </>
      ) : null}
    </p>
  );
}

/* ───────────── 1. Expedition Hero ("The Edge of the Map") ───────────── */

const HERO_SIZE: Record<string, string> = {
  full: "min-h-[100svh]",
  large: "min-h-[86svh] md:min-h-[92svh]",
  medium: "min-h-[68svh] md:min-h-[76svh]",
};

function Hero({ s, isFirst }: P) {
  const d = s.data;
  const heroRef = useRef<HTMLElement>(null);
  const mediaWrapRef = useRef<HTMLDivElement>(null);
  const clock = usePalawanClock();
  const { canAnimate, isAdmin, isDesktop } = useMotionConfig();
  const [videoFailed, setVideoFailed] = useState(false);

  const isFull = d.size === "full";
  const stats = arr<{ label: string; value: string }>(d.stats).filter((x) => x.label || x.value);
  const rawOverlay = typeof d.overlay === "number" ? d.overlay : 45;
  const scrimStrength = Math.min(0.95, Math.max(0.25, rawOverlay / 62));

  const resolvedImg = useImageSrc(d.image?.src);
  const posterUrl = d.image?.src ? (isCdnPath(d.image.src) ? cdn(d.image.src, 1920) : resolvedImg) : undefined;
  const videoUrl = typeof d.videoUrl === "string" ? d.videoUrl.trim() : "";
  const showVideo = Boolean(videoUrl) && !videoFailed;

  const heroButtons: ButtonData[] = arr<ButtonData>(d.buttons).map((b, idx) =>
    idx === 0 && b.url === "{booking}" && (!b.variant || b.variant === "light") ? { ...b, variant: "primary" } : b,
  );

  useIsoLayoutEffect(() => {
    const section = heroRef.current;
    const mediaEl = mediaWrapRef.current;
    if (!section || !mediaEl || !canAnimate || isAdmin) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        mediaEl,
        { scale: 1.11 },
        { scale: 1.02, duration: 1.9, ease: EASE_EXPO, overwrite: "auto" },
      );

      if (isDesktop) {
        gsap.to(mediaEl, {
          yPercent: 13,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }
    }, section);

    return () => ctx.revert();
  }, [canAnimate, isAdmin, isDesktop, d.image?.src, videoUrl]);

  const coordinates = (typeof d.coordinates === "string" && d.coordinates.trim()) || "11°29′14″N · 119°52′08″E";

  return (
    <section
      ref={heroRef}
      id={s.anchor || undefined}
      aria-labelledby={d.title ? tid(s) : undefined}
      className={cn(
        "on-dark relative isolate flex flex-col justify-between overflow-hidden bg-espresso-deep text-ivory",
        HERO_SIZE[d.size] ?? HERO_SIZE.large,
      )}
    >
      <div ref={mediaWrapRef} className="pointer-events-none absolute inset-0 -z-20 will-change-transform">
        {showVideo ? (
          <video
            key={videoUrl}
            src={videoUrl}
            poster={posterUrl}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <Img image={d.image} flat priority={isFirst} sizes="100vw" className="h-full w-full" />
        )}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-espresso-deep/85 via-espresso-deep/25 to-espresso-deep/95"
        style={{ opacity: scrimStrength }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_18%_78%,color-mix(in_oklab,var(--color-espresso-deep)_78%,transparent),transparent_72%)]"
      />

      <Container className="pt-22 sm:pt-26 lg:pt-28">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-y border-ivory/15 py-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-ivory/80">
          <div className="flex items-center gap-2.5">
            <Compass className="size-3.5 text-forest" aria-hidden />
            <span className="tnum">{coordinates}</span>
          </div>
          <div className="hidden items-center gap-3 md:flex" aria-hidden>
            <span className="h-px w-8 bg-ivory/25" />
            <span className="text-sand/90">EL NIDO ↔ CORON STRAIT</span>
            <span className="h-px w-8 bg-ivory/25" />
          </div>
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="size-1.5 rounded-full bg-forest" />
            <span className="tnum">LOCAL {clock.time}</span>
            <span className="hidden text-sand/85 sm:inline">· {clock.phase}</span>
          </div>
        </div>
      </Container>

      <Container className={cn("mt-auto", isFull ? "pb-8 pt-12 md:pb-12 md:pt-16" : "pb-12 pt-12 md:pb-16")}>
        <div className="relative">
          {d.eyebrow ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <Eyebrow light>{d.eyebrow}</Eyebrow>
              {isFull ? <PassportStamp className="hidden lg:inline-flex" /> : null}
            </div>
          ) : null}

          {d.title ? (
            <SplitHeading
              as={isFirst ? "h1" : "h2"}
              id={tid(s)}
              text={String(d.title)}
              accentItalic={isFull}
              priority={isFirst}
              className={cn(
                "max-w-[16ch] text-ivory drop-shadow-[0_12px_36px_rgb(0_0_0/0.45)]",
                isFull ? "text-hero" : "text-display max-w-[18ch]",
              )}
            />
          ) : null}

          <div className="mt-8 grid items-end gap-8 lg:mt-10 lg:grid-cols-12">
            <div className="lg:col-span-6 lg:col-start-1">
              {d.lead ? (
                <p className="max-w-xl whitespace-pre-line text-lead text-ivory/90">
                  {d.lead}
                </p>
              ) : null}
              <Buttons buttons={heroButtons} className="mt-7" />
            </div>

            {isFull ? (
              <div className="hidden justify-end lg:col-span-4 lg:col-start-9 lg:flex">
                <button
                  type="button"
                  onClick={() => {
                    const next = heroRef.current?.nextElementSibling as HTMLElement | null;
                    if (next) smoothScrollTo(next, { offset: -64 });
                  }}
                  className="group inline-flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-ivory/75 transition-colors hover:text-sand"
                >
                  <span>SOUND THE REEF</span>
                  <span className="grid size-9 place-items-center rounded-full border border-ivory/25 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-y-1 group-hover:border-forest group-hover:bg-forest group-hover:text-[var(--btn-primary-fg)]">
                    <ArrowDown className="size-3.5" aria-hidden />
                  </span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {stats.length ? (
          <div className="mt-10 pt-2 md:mt-12">
            <DrawLine className="bg-ivory/20" />
            <dl
              className="grid gap-y-5 pt-5 text-[0.9375rem] sm:grid-cols-3 sm:gap-x-8"
              style={{ gridTemplateColumns: stats.length > 3 ? `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))` : undefined }}
            >
              {stats.map((st, i) => (
                <Reveal
                  key={i}
                  delay={stagger(i, 95)}
                  y={14}
                  className={cn("group relative", i > 0 && "sm:border-l sm:border-ivory/15 sm:pl-8")}
                >
                  <dt className="flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-sand">
                    <span className="tnum opacity-65">0{i + 1}</span>
                    <span>/</span>
                    <span>{st.label}</span>
                  </dt>
                  <dd className="mt-1.5 font-serif text-[1.25rem] leading-snug text-ivory/95 transition-transform duration-500 ease-[var(--ease-soft)] group-hover:translate-x-1">
                    {st.value}
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>
        ) : null}
      </Container>
    </section>
  );
}

/* ───────────── Page header ───────────── */

function PageHeader({ s, isFirst }: P) {
  const d = s.data;
  const tone: Tone = s.tone ?? "shell";
  const light = isDarkTone(tone);
  return (
    <section
      id={s.anchor || undefined}
      aria-labelledby={d.title ? tid(s) : undefined}
      className={cn(toneClass(tone), "border-b", light ? "border-ivory/10" : "border-line", isFirst ? "pb-14 pt-32 md:pb-20 md:pt-40" : "sec")}
    >
      <Container>
        <div className="max-w-4xl">
          {d.eyebrow ? <Eyebrow light={light}>{d.eyebrow}</Eyebrow> : null}
          {d.title ? (
            <SplitHeading
              as={isFirst ? "h1" : "h2"}
              id={tid(s)}
              text={String(d.title)}
              priority={isFirst}
              className={cn("text-display", d.eyebrow && "mt-4")}
            />
          ) : null}
          {d.lead ? <p className={cn("mt-5 max-w-2xl whitespace-pre-line text-lead", light ? "text-ivory/85" : "text-muted")}>{d.lead}</p> : null}
          <Buttons buttons={d.buttons} className="mt-8" />
        </div>
      </Container>
    </section>
  );
}

/* ───────────── 4. Signature "How to Get Here" Pinned Boat-Route Journey ───────────── */

type JourneyStep = {
  title?: string;
  leg?: string;
  coords?: string;
  text?: string;
  image?: ImageRef;
};

type JourneyFact = {
  icon?: string;
  stat?: string;
  title?: string;
  text?: string;
};

const ROUTE_CURVE = "M 96 418 C 142 378, 192 358, 236 326 S 276 296, 304 278 C 352 246, 404 202, 448 168 S 506 126, 548 98";
const DEFAULT_LEGS = ["EL NIDO · TOWNSQUARE", "SAN FERNANDO · DIPNAY PORT", "BARANGONAN · LINAPACAN"];
const DEFAULT_COORDS = ["11°10′48″N · 119°23′18″E", "11°16′12″N · 119°32′04″E", "11°29′14″N · 119°52′08″E"];
const DEFAULT_STEP_IMAGES: ImageRef[] = [RESORT_MEDIA.townSquare, RESORT_MEDIA.beachAerial, RESORT_MEDIA.lagoonAerial];

/** Extracts a punchy display numeral from a fact when `stat` wasn't explicitly filled in CMS. */
function deriveFactNumeral(f: JourneyFact, index: number): string {
  if (f.stat && f.stat.trim()) return f.stat.trim();
  const combined = `${f.title ?? ""} ${f.text ?? ""}`;
  const rangeMatch = combined.match(/(\d+(?:\.\d+)?)\s*(?:to|–|-)\s*(\d+(?:\.\d+)?)\s*hours?/i);
  if (rangeMatch) return `${rangeMatch[1]}–${rangeMatch[2]}h`;
  const timeMatch = combined.match(/\b(\d{1,2}:\d{2})\b/);
  if (timeMatch) return timeMatch[1];
  const approxHr = combined.match(/(?:approx\.?\s*|~\s*)(\d+(?:\.\d+)?)\s*hours?/i);
  if (approxHr) return `~${approxHr[1]}h`;
  const hrMatch = combined.match(/\b(\d+(?:\.\d+)?)\s*hours?/i);
  if (hrMatch) return `${hrMatch[1]}h`;
  return `0${index + 1}`;
}

function TransferDispatchStrip({
  contactText,
  contactMessage,
  buttons,
  light,
}: {
  contactText?: string;
  contactMessage?: string;
  buttons?: ButtonData[];
  light?: boolean;
}) {
  const site = useSite();
  return (
    <div
      className={cn(
        "on-dark relative overflow-hidden rounded-[var(--img-radius,0px)] border border-stone/60 bg-espresso-deep p-6 text-ivory sm:p-9 lg:p-11",
        light && "border-ivory/20",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-forest)_28%,transparent),transparent_70%)]"
      />
      <div className="relative grid items-center gap-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <PassportStamp label="TRANSFER DISPATCH" sub="DIRECT GUEST SHUTTLE" />
          <p className="mt-4 font-serif text-h3 leading-tight text-ivory">
            {contactText || "Arrange your transfer directly with our team"}
          </p>
          <p className="mt-2 max-w-xl text-sm text-ivory/72">
            No mobile cell tower on Barangonan Island — message our crew on WhatsApp or email ahead of arrival so your El Nido taxi and boat are waiting.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:col-span-6 lg:justify-end">
          <Magnetic>
            <a
              href={whatsappLink(site, contactMessage || undefined)}
              data-cursor="Book"
              className={buttonClass("primary", "normal-case tracking-wide")}
            >
              <Icon name="brand:whatsapp" className="size-4" />
              <span>WhatsApp {site.whatsappDisplay}</span>
              </a>
          </Magnetic>
          <a
            href={`mailto:${site.email}?subject=${encodeURIComponent(`Transfer to ${site.name}`)}`}
            data-cursor="View"
            className={buttonClass("outlineLight", "normal-case tracking-wide")}
          >
            <Mail className="size-4" aria-hidden />
            <span>{site.email}</span>
          </a>
        </div>
      </div>

      {arr<ButtonData>(buttons).length ? (
        <div className="relative mt-7 border-t border-ivory/12 pt-5">
          <Buttons
            buttons={arr<ButtonData>(buttons).map((b) => (b.variant === "text" ? { ...b, variant: "textLight" } : b))}
          />
        </div>
      ) : null}
    </div>
  );
}

function JourneySection({ s, isFirst }: P) {
  const d = s.data;
  const tone: Tone = s.tone ?? "ivory";
  const light = isDarkTone(tone);
  const { canAnimate, canPin, isAdmin } = useMotionConfig();

  const uidRaw = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const maskId = `route-mask-${uidRaw}`;

  const steps = useMemo(
    () =>
      arr<JourneyStep>(d.steps)
        .filter((x) => x && (x.title || x.text))
        .map((st, i) => ({
          title: st.title || `Waypoint 0${i + 1}`,
          leg: st.leg || DEFAULT_LEGS[i] || `WAYPOINT 0${i + 1}`,
          coords: st.coords || DEFAULT_COORDS[i] || "11°20′N · 119°38′E",
          text: st.text || "",
          image: st.image?.src ? st.image : DEFAULT_STEP_IMAGES[i],
        })),
    [d.steps],
  );

  const facts = arr<JourneyFact>(d.facts).filter((x) => x && (x.title || x.text || x.stat));
  const maps = arr<{ query: string; caption?: string }>(d.maps).filter((m) => m && m.query);

  const sectionRef = useRef<HTMLElement>(null);
  const pinStageRef = useRef<HTMLDivElement>(null);
  const measurePathRef = useRef<SVGPathElement>(null);
  const maskPathRef = useRef<SVGPathElement>(null);
  const vesselRef = useRef<SVGGElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  const [activeStep, setActiveStep] = useState(0);
  const activeStepRef = useRef(0);
  const [nodeCoords, setNodeCoords] = useState<{ x: number; y: number }[]>([
    { x: 96, y: 418 },
    { x: 304, y: 278 },
    { x: 548, y: 98 },
  ]);

  const enablePin = canPin && steps.length >= 2;

  // Compute exact waypoint positions along the SVG curve so any step count (2, 3, 4+) sits accurately on the route
  useIsoLayoutEffect(() => {
    const path = measurePathRef.current;
    if (!path || !steps.length) return;
    try {
      const total = path.getTotalLength();
      const pts = steps.map((_, i) => {
        const t = steps.length === 1 ? 0.5 : i / (steps.length - 1);
        const p = path.getPointAtLength(t * total);
        return { x: p.x, y: p.y };
      });
      setNodeCoords(pts);
      if (vesselRef.current && pts[0]) {
        vesselRef.current.setAttribute("transform", `translate(${pts[0].x.toFixed(1)}, ${pts[0].y.toFixed(1)})`);
      }
    } catch {
      /* SVG unavailable in non-DOM test env */
    }
  }, [steps.length]);

  // Pinned desktop scroll choreography: draws dotted boat route & swaps steps cleanly
  useIsoLayoutEffect(() => {
    const section = sectionRef.current;
    const stage = pinStageRef.current;
    const path = measurePathRef.current;
    const maskPath = maskPathRef.current;
    const vessel = vesselRef.current;
    if (!section || !stage || !path || !maskPath) return;

    if (!enablePin) {
      triggerRef.current = null;
      maskPath.style.strokeDashoffset = "0";
      if (vessel && nodeCoords[activeStep]) {
        const pt = nodeCoords[activeStep];
        vessel.setAttribute("transform", `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`);
      }
      if (canAnimate && !isAdmin) {
        const ctx = gsap.context(() => {
          gsap.fromTo(
            maskPath,
            { strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              duration: 1.4,
              ease: EASE_EXPO,
              scrollTrigger: { trigger: stage, start: "top 80%", once: true },
            },
          );
        }, section);
        return () => ctx.revert();
      }
      return;
    }

    let totalLen = 600;
    try {
      totalLen = path.getTotalLength();
    } catch {
      /* fallback */
    }

    const ctx = gsap.context(() => {
      maskPath.style.strokeDashoffset = "1";
      const st = ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * Math.max(1.65, steps.length * 0.72))}`,
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          maskPath.style.strokeDashoffset = (1 - p).toFixed(4);
          if (vessel) {
            try {
              const pt = path.getPointAtLength(p * totalLen);
              vessel.setAttribute("transform", `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`);
            } catch {
              /* ignore */
            }
          }
          const idx = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.9999));
          if (idx !== activeStepRef.current) {
            activeStepRef.current = idx;
            setActiveStep(idx);
          }
        },
      });
      triggerRef.current = st;
    }, section);

    return () => {
      triggerRef.current = null;
      ctx.revert();
    };
  }, [enablePin, canAnimate, isAdmin, steps.length, nodeCoords]);

  // Keep vessel synced when clicking tabs in unpinned mode
  useEffect(() => {
    if (enablePin) return;
    const pt = nodeCoords[activeStep];
    if (vesselRef.current && pt) {
      vesselRef.current.setAttribute("transform", `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`);
    }
  }, [activeStep, enablePin, nodeCoords]);

  const jumpToStep = (idx: number) => {
    activeStepRef.current = idx;
    setActiveStep(idx);
    const st = triggerRef.current;
    if (enablePin && st) {
      const targetRatio = steps.length <= 1 ? 0 : idx / (steps.length - 1);
      const targetY = st.start + (st.end - st.start) * Math.min(0.98, Math.max(0.02, targetRatio * 0.92 + 0.04));
      smoothScrollTo(targetY, { duration: 0.85 });
    }
  };

  const current = steps[activeStep] ?? steps[0];

  return (
    <Section
      id={s.anchor}
      tone={tone}
      spacing="flush"
      labelledBy={d.title ? tid(s) : undefined}
      className="overflow-x-clip"
    >
      <div ref={sectionRef as React.RefObject<HTMLDivElement>}>
        {/* Pinned Expedition Route Stage (unpinned automatically on mobile, reduced-motion, or Admin) */}
        <div
          ref={pinStageRef}
          className={cn(
            "relative flex flex-col justify-center",
            enablePin ? "min-h-[100svh] py-16 lg:py-12" : "sec pb-12",
          )}
        >
          <Container>
            {/* Stage Header */}
            <div className="mb-8 grid items-end gap-6 lg:mb-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                {d.eyebrow ? <Eyebrow light={light}>{d.eyebrow}</Eyebrow> : null}
                {d.title ? (
                  <SplitHeading
                    as={isFirst ? "h1" : "h2"}
                    id={tid(s)}
                    text={String(d.title)}
                    className={cn("text-h1", d.eyebrow && "mt-3")}
                  />
                ) : null}
              </div>
              {d.lead ? (
                <p className={cn("text-base leading-relaxed lg:col-span-5", light ? "text-ivory/80" : "text-muted")}>
                  {d.lead}
                </p>
              ) : null}
            </div>

            {steps.length ? (
              <div className="grid items-stretch gap-6 lg:grid-cols-12 lg:gap-8">
                {/* Left: Dark Nautical Archipelago SVG Chart */}
                <div className="on-dark relative overflow-hidden rounded-[var(--img-radius,0px)] border border-stone/60 bg-espresso-deep p-4 text-ivory sm:p-6 lg:col-span-7">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ivory/12 pb-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ivory/70">
                    <span className="inline-flex items-center gap-2 text-sand">
                      <Compass className="size-3.5 text-forest" aria-hidden />
                      <span>NORTHERN PALAWAN · LINAPACAN STRAIT</span>
                    </span>
                    <span className="tnum">
                      WAYPOINT 0{activeStep + 1} / 0{steps.length}
                    </span>
                  </div>

                  <div className="relative mt-3 aspect-[64/48] w-full">
                    <svg
                      viewBox="0 0 640 480"
                      fill="none"
                      role="img"
                      aria-label="Expedition boat and overland route from El Nido through San Fernando rice fields to Barangonan Island in Linapacan"
                      className="h-full w-full select-none"
                    >
                      <defs>
                        <mask id={maskId} maskUnits="userSpaceOnUse">
                          <path
                            ref={maskPathRef}
                            d={ROUTE_CURVE}
                            pathLength={1}
                            stroke="white"
                            strokeWidth="16"
                            strokeLinecap="round"
                            fill="none"
                            style={{ strokeDasharray: 1, strokeDashoffset: enablePin ? 1 : 0 }}
                          />
                        </mask>
                      </defs>

                      {/* Nautical lat/lon chart graticule */}
                      <g stroke="var(--color-stone)" strokeOpacity="0.32" strokeWidth="1">
                        <line x1="0" y1="110" x2="640" y2="110" strokeDasharray="2 6" />
                        <line x1="0" y1="240" x2="640" y2="240" strokeDasharray="2 6" />
                        <line x1="0" y1="370" x2="640" y2="370" strokeDasharray="2 6" />
                        <line x1="140" y1="0" x2="140" y2="480" strokeDasharray="2 6" />
                        <line x1="340" y1="0" x2="340" y2="480" strokeDasharray="2 6" />
                        <line x1="540" y1="0" x2="540" y2="480" strokeDasharray="2 6" />
                      </g>

                      {/* Latitude / Longitude margin ticks */}
                      <g fill="var(--color-muted)" fillOpacity="0.65" style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em" }}>
                        <text x="12" y="104">11°30′N</text>
                        <text x="12" y="234">11°20′N</text>
                        <text x="12" y="364">11°10′N</text>
                        <text x="346" y="468">119°35′E</text>
                        <text x="544" y="468">119°52′E</text>
                      </g>

                      {/* Stylised Northern Palawan mainland & Linapacan archipelago silhouettes */}
                      <g fill="var(--color-shell)" stroke="var(--color-stone)" strokeWidth="1.2">
                        {/* El Nido -> San Fernando peninsula & rice-field hills */}
                        <path d="M 18 476 L 44 398 C 66 372, 92 362, 122 366 C 156 370, 188 336, 224 304 C 258 274, 292 258, 326 266 C 344 270, 342 298, 314 328 C 282 362, 248 410, 224 476 Z" />
                        {/* Stepping-stone islands across Linapacan Strait */}
                        <path d="M 378 214 C 392 204, 412 208, 416 220 C 420 232, 396 238, 382 228 Z" />
                        <path d="M 442 156 C 456 146, 476 150, 482 164 C 486 176, 462 182, 446 172 Z" />
                        {/* Barangonan Island (Cayo Coco cove) */}
                        <path d="M 516 84 C 538 68, 574 72, 592 92 C 604 106, 586 128, 562 126 C 544 124, 538 110, 524 114 C 510 118, 504 96, 516 84 Z" />
                      </g>

                      {/* Subtle bathymetric reef halo around Barangonan Island */}
                      <circle cx="548" cy="98" r="42" stroke="var(--color-sand)" strokeOpacity="0.22" strokeDasharray="3 5" />
                      <circle cx="548" cy="98" r="64" stroke="var(--color-stone)" strokeOpacity="0.28" />

                      {/* Hidden measurement path + Ghost base route */}
                      <path ref={measurePathRef} d={ROUTE_CURVE} fill="none" stroke="transparent" strokeWidth="1" />
                      <path d={ROUTE_CURVE} fill="none" stroke="var(--color-stone)" strokeWidth="1.75" strokeDasharray="3 8" opacity="0.65" />

                      {/* Scroll-drawn active dotted route (stationary dots revealed smoothly by mask) */}
                      <path
                        d={ROUTE_CURVE}
                        fill="none"
                        stroke="var(--color-forest)"
                        strokeWidth="3"
                        strokeDasharray="2 9"
                        strokeLinecap="round"
                        mask={`url(#${maskId})`}
                      />

                      {/* Waypoint Nodes */}
                      {steps.map((st, i) => {
                        const pt = nodeCoords[i] ?? { x: 96 + i * 220, y: 418 - i * 160 };
                        const reached = enablePin ? i <= activeStep : true;
                        const currentIdx = i === activeStep;
                        const labelAbove = i === steps.length - 1;
                        return (
                          <g
                            key={i}
                            transform={`translate(${pt.x}, ${pt.y})`}
                            onClick={() => jumpToStep(i)}
                            className="cursor-pointer"
                          >
                            {currentIdx ? (
                              <circle r="18" fill="var(--color-forest)" fillOpacity="0.2" stroke="var(--color-forest)" strokeOpacity="0.6" strokeWidth="1" />
                            ) : null}
                            <circle
                              r={currentIdx ? "6.5" : "5"}
                              fill={reached ? "var(--color-forest)" : "var(--color-espresso-deep)"}
                              stroke={reached ? "var(--color-sand)" : "var(--color-stone)"}
                              strokeWidth="1.75"
                            />
                            <text
                              x={labelAbove ? -8 : 14}
                              y={labelAbove ? -16 : 4}
                              textAnchor={labelAbove ? "end" : "start"}
                              fill={currentIdx ? "var(--color-sand)" : "var(--fg-on-dark)"}
                              fillOpacity={reached ? "0.95" : "0.55"}
                              style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase" }}
                            >
                              0{i + 1} · {st.title}
                            </text>
                          </g>
                        );
                      })}

                      {/* Live moving boat / shuttle beacon */}
                      <g ref={vesselRef} transform="translate(96, 418)">
                        <circle r="11" fill="var(--color-forest)" fillOpacity="0.28" />
                        <polygon points="0,-6 5,0 0,6 -5,0" fill="var(--color-sand)" stroke="var(--color-espresso-deep)" strokeWidth="1.2" />
                      </g>

                      {/* Compass rose (top-left) */}
                      <g transform="translate(46, 52)" stroke="var(--color-sand)" strokeOpacity="0.65">
                        <circle r="16" fill="none" strokeWidth="0.8" strokeDasharray="2 3" />
                        <line x1="0" y1="-21" x2="0" y2="21" strokeWidth="0.9" />
                        <line x1="-21" y1="0" x2="21" y2="0" strokeWidth="0.9" />
                        <polygon points="0,-16 3,-4 -3,-4" fill="var(--color-forest)" stroke="none" />
                        <text x="0" y="-25" textAnchor="middle" fill="var(--color-sand)" stroke="none" style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.2em" }}>
                          N
                        </text>
                      </g>
                    </svg>
                  </div>

                  {/* Interactive Waypoint Selector Tabs */}
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-ivory/12 pt-3" role="tablist" aria-label="Journey waypoints">
                    {steps.map((st, i) => {
                      const active = i === activeStep;
                      return (
                        <button
                          key={i}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => jumpToStep(i)}
                          className={cn(
                            "rounded-[2px] border px-3 py-2 text-left transition-colors",
                            active
                              ? "border-forest bg-forest/15 text-ivory"
                              : "border-ivory/10 bg-ivory/[0.03] text-ivory/65 hover:border-ivory/30 hover:text-ivory",
                          )}
                        >
                          <span className="block font-mono text-[0.625rem] uppercase tracking-[0.2em] text-sand tnum">
                            LEG 0{i + 1}
                          </span>
                          <span className="mt-0.5 block truncate font-serif text-base leading-snug">{st.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Active Waypoint Card (Pinned Desktop) OR Full Waypoint Stack (Mobile / Admin) */}
                <div className="flex flex-col justify-between lg:col-span-5">
                  {enablePin && current ? (
                    <div
                      key={activeStep}
                      className="flex h-full flex-col justify-between rounded-[var(--img-radius,0px)] border border-line bg-shell/75 p-6 sm:p-8"
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-bark">
                          <span>{current.leg}</span>
                          <span className="tnum text-muted">{current.coords}</span>
                        </div>
                        <DrawLine className="my-4" />
                        <div className="flex items-baseline gap-4">
                          <span className="font-serif text-[3.5rem] italic leading-none text-forest tnum">
                            0{activeStep + 1}
                          </span>
                          <h3 className="font-serif text-h2 leading-none">{current.title}</h3>
                        </div>
                        {current.text ? (
                          <p className={cn("mt-5 text-base leading-relaxed", light ? "text-ivory/85" : "text-muted")}>
                            {current.text}
                          </p>
                        ) : null}
                      </div>

                      {current.image?.src ? (
                        <div className="mt-6">
                          <Img
                            image={current.image}
                            ratio="16 / 10"
                            sizes="(min-width: 1024px) 34vw, 92vw"
                            className="border border-stone/40"
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    /* Mobile / Reduced-Motion / Admin mode: clean unpinned stack of all waypoints */
                    <ol className="space-y-4">
                      {steps.map((st, i) => (
                        <li
                          key={i}
                          onClick={() => setActiveStep(i)}
                          className={cn(
                            "rounded-[var(--img-radius,0px)] border p-5 transition-colors sm:p-6",
                            i === activeStep ? "border-forest/60 bg-shell/85" : "border-line bg-shell/45",
                          )}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bark">
                            <span>0{i + 1} · {st.leg}</span>
                            <span className="tnum text-muted">{st.coords}</span>
                          </div>
                          <h3 className="mt-2 font-serif text-h3 leading-tight">{st.title}</h3>
                          {st.text ? <p className={cn("mt-2 text-[0.95rem] leading-relaxed", light ? "text-ivory/80" : "text-muted")}>{st.text}</p> : null}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            ) : null}
          </Container>
        </div>

        {/* Lower Expedition Deck: Big Numerals + Dark Map Frame + Strong WhatsApp/Email Transfer Strip */}
        <Container className="pb-20 pt-4 md:pb-28">
          {facts.length ? (
            <div className="mb-12 border-y border-line py-8 md:py-10">
              <dl className={cn("grid gap-8", facts.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3")}>
                {facts.map((f, i) => {
                  const bigStat = deriveFactNumeral(f, i);
                  return (
                    <Reveal
                      key={i}
                      delay={stagger(i, 100)}
                      className={cn("flex flex-col justify-between gap-3", i > 0 && "md:border-l md:border-line md:pl-8")}
                    >
                      <dt className="flex items-center gap-2.5 font-mono text-eyebrow uppercase text-bark">
                        {f.icon ? <Icon name={f.icon} className="size-4 text-forest" /> : null}
                        <span>{f.title}</span>
                      </dt>
                      <dd>
                        <span className="block font-serif text-[clamp(3.25rem,6vw,5.4rem)] leading-[0.88] tracking-[-0.03em] text-forest tnum">
                          {bigStat}
                        </span>
                        {f.text ? (
                          <p className={cn("mt-3 max-w-md text-[0.95rem] leading-relaxed", light ? "text-ivory/80" : "text-muted")}>
                            {f.text}
                          </p>
                        ) : null}
                      </dd>
                    </Reveal>
                  );
                })}
              </dl>
            </div>
          ) : null}

          {maps.length ? (
            <div className={cn("mb-10 grid gap-6", maps.length > 1 && "lg:grid-cols-2")}>
              {maps.map((m, i) => (
                <Reveal key={i} delay={stagger(i, 110)}>
                  <MapEmbed
                    query={m.query}
                    title={`Map showing ${m.caption || m.query}`}
                    caption={m.caption}
                    ratio={maps.length > 1 ? "aspect-[16/10]" : "aspect-[16/9] lg:aspect-[21/9]"}
                  />
                </Reveal>
              ))}
            </div>
          ) : null}

          {d.contactBox ? (
            <Reveal y={16}>
              <TransferDispatchStrip
                contactText={d.contactText}
                contactMessage={d.contactMessage}
                buttons={d.buttons}
                light={light}
              />
            </Reveal>
          ) : arr<ButtonData>(d.buttons).length ? (
            <Buttons buttons={d.buttons} className="mt-8" />
          ) : null}
        </Container>
      </div>
      <WaveDivider />
    </Section>
  );
}

/* ───────────── Steps (delegates multi-step directions to JourneySection; renders big numerals + dark map for logistics sections) ───────────── */

function Steps({ s, page, isFirst }: P) {
  const d = s.data;
  const steps = arr<{ title: string; text: string }>(d.steps).filter((x) => x && (x.title || x.text));
  if (steps.length >= 2) {
    return <JourneySection s={s} page={page} isFirst={isFirst} />;
  }

  const tone: Tone = s.tone ?? "ivory";
  const light = isDarkTone(tone);
  const facts = arr<JourneyFact>(d.facts).filter((x) => x && (x.title || x.text || x.stat));
  const maps = arr<{ query: string; caption?: string }>(d.maps).filter((m) => m.query);
  const hasHead = !!(d.eyebrow || d.title || d.lead);

  return (
    <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined}>
      <Container>
        {hasHead ? (
          <div className="max-w-3xl">
            <Head s={s} isFirst={isFirst} light={light} lead={d.lead} />
          </div>
        ) : null}

        {steps.length === 1 ? (
          <div className="mt-8 max-w-2xl border-l-2 border-forest pl-5">
            <h3 className="font-serif text-h4">{steps[0].title}</h3>
            {steps[0].text ? <p className={cn("mt-1.5", light ? "text-ivory/80" : "text-muted")}>{steps[0].text}</p> : null}
          </div>
        ) : null}

        {facts.length ? (
          <div className={cn("border-y border-line py-8", hasHead ? "mt-10" : "")}>
            <dl className={cn("grid gap-8", facts.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3")}>
              {facts.map((f, i) => (
                <Reveal key={i} delay={stagger(i, 95)} className={cn(i > 0 && "md:border-l md:border-line md:pl-8")}>
                  <dt className="flex items-center gap-2 font-mono text-eyebrow uppercase text-bark">
                    {f.icon ? <Icon name={f.icon} className="size-4 text-forest" /> : null}
                    <span>{f.title}</span>
                  </dt>
                  <dd className="mt-2">
                    <span className="block font-serif text-[clamp(2.85rem,5vw,4.6rem)] leading-[0.9] tracking-[-0.03em] text-forest tnum">
                      {deriveFactNumeral(f, i)}
                    </span>
                    {f.text ? <p className={cn("mt-2.5 text-[0.95rem] leading-relaxed", light ? "text-ivory/80" : "text-muted")}>{f.text}</p> : null}
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>
        ) : null}

        {maps.length ? (
          <div className={cn("grid gap-6", maps.length > 1 && "lg:grid-cols-2", (hasHead || facts.length) && "mt-10")}>
            {maps.map((m, i) => (
              <Reveal key={i} delay={stagger(i, 110)}>
                <MapEmbed query={m.query} title={`Map showing ${m.caption || m.query}`} caption={m.caption} ratio="aspect-[16/10]" />
              </Reveal>
            ))}
          </div>
        ) : null}

        {d.contactBox ? (
          <div className="mt-10">
            <TransferDispatchStrip
              contactText={d.contactText}
              contactMessage={d.contactMessage}
              buttons={d.buttons}
              light={light}
            />
          </div>
        ) : arr<ButtonData>(d.buttons).length ? (
          <Buttons buttons={d.buttons} className="mt-9" />
        ) : null}
      </Container>
    </Section>
  );
}

/* ───────────── 5. Horizontal Pinned Rooms Rail (Desktop) / Swipe Carousel (Mobile) ───────────── */

type RoomPanelData = {
  name?: string;
  badge?: string;
  tagline?: string;
  description?: string;
  image?: ImageRef;
  secondaryImage?: ImageRef;
  specs?: string[];
  bookLabel?: string;
  bookUrl?: string;
  detailLabel?: string;
  detailUrl?: string;
};

function RoomRailSection({ s, isFirst }: P) {
  const d = s.data;
  const tone: Tone = s.tone ?? "shell";
  const light = isDarkTone(tone);
  const { canPin, hasFinePointer } = useMotionConfig();

  const rooms = useMemo(
    () =>
      arr<RoomPanelData>(d.rooms)
        .filter((r) => r && (r.name || r.image?.src))
        .map((r, i) => ({
          name: r.name || `Sanctuary 0${i + 1}`,
          badge: r.badge || "OCEAN BREEZE SANCTUARY",
          tagline: r.tagline || "",
          description: r.description || "",
          image: r.image,
          secondaryImage: r.secondaryImage,
          specs: arr<string>(r.specs).filter(Boolean),
          bookLabel: r.bookLabel || "Check availability",
          bookUrl: r.bookUrl || "{booking}",
          detailLabel: r.detailLabel || "Room details",
          detailUrl: r.detailUrl || "#/accommodations",
        })),
    [d.rooms],
  );

  const sectionRef = useRef<HTMLDivElement>(null);
  const pinViewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const [openSpecs, setOpenSpecs] = useState<number | null>(null);

  const enablePin = canPin && rooms.length >= 2;

  // Desktop GSAP horizontal pinned scroll rail + internal image counter-parallax
  useIsoLayoutEffect(() => {
    const root = sectionRef.current;
    const viewport = pinViewportRef.current;
    const track = trackRef.current;
    if (!root || !viewport || !track || !enablePin) return;

    const ctx = gsap.context(() => {
      const getDistance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

      const tween = gsap.to(track, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: viewport,
          start: "top top",
          end: () => `+=${Math.max(getDistance(), window.innerHeight * 1.2)}`,
          pin: true,
          scrub: 0.55,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressBarRef.current) {
              progressBarRef.current.style.transform = `scaleX(${Math.max(0.08, self.progress)})`;
            }
            const idx = Math.min(rooms.length - 1, Math.floor(self.progress * rooms.length * 0.9999));
            if (idx !== activeIndexRef.current) {
              activeIndexRef.current = idx;
              setActiveIndex(idx);
            }
          },
        },
      });

      // Subtle internal horizontal drift on each room's background image
      const mediaLayers = track.querySelectorAll<HTMLElement>("[data-room-parallax]");
      mediaLayers.forEach((layer) => {
        gsap.fromTo(
          layer,
          { xPercent: -4, scale: 1.08 },
          {
            xPercent: 4,
            scale: 1.08,
            ease: "none",
            scrollTrigger: {
              trigger: layer.closest("[data-room-card]") ?? layer,
              containerAnimation: tween,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, [enablePin, rooms.length]);

  const scrollCarousel = (dir: -1 | 1) => {
    const scroller = mobileScrollRef.current;
    if (!scroller) return;
    const card = scroller.querySelector<HTMLElement>("[data-room-card]");
    const step = (card?.offsetWidth ?? scroller.clientWidth * 0.85) + 20;
    scroller.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const renderRoomCard = (room: (typeof rooms)[number], i: number, pinnedMode: boolean) => {
    const specsOpen = openSpecs === i;
    return (
      <article
        key={`${room.name}-${i}`}
        data-room-card
        onMouseEnter={() => {
          if (hasFinePointer && room.specs.length) setOpenSpecs(i);
        }}
        onMouseLeave={() => {
          if (hasFinePointer) setOpenSpecs((cur) => (cur === i ? null : cur));
        }}
        className={cn(
          "on-dark group/room relative isolate flex shrink-0 flex-col justify-between overflow-hidden rounded-[var(--img-radius,0px)] border border-stone/50 bg-espresso-deep text-ivory",
          pinnedMode
            ? "h-[min(74svh,700px)] w-[min(72vw,960px)]"
            : "min-h-[480px] w-[86vw] snap-center sm:min-h-[540px] sm:w-[74vw] lg:w-[60vw]",
        )}
      >
        {/* Huge full-bleed room image panel */}
        <div data-room-parallax className="pointer-events-none absolute inset-0 -z-20 h-full w-full will-change-transform">
          <Img
            image={room.image}
            flat
            sizes={pinnedMode ? "72vw" : "(min-width: 1024px) 60vw, 86vw"}
            className="h-full w-full"
            imgClassName="transition-transform duration-[1100ms] ease-[var(--ease-soft)] group-hover/room:scale-[1.04]"
          />
        </div>

        {/* Multi-stop WCAG AA editorial scrims */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-espresso-deep via-espresso-deep/38 to-espresso-deep/45"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-espresso-deep/75 via-transparent to-transparent"
        />

        {/* Top Strip: Room Number + Category Badge + Specs Toggle */}
        <div className="relative z-10 flex items-center justify-between gap-3 p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-medium tracking-[0.22em] text-sand tnum">
              0{i + 1} / 0{rooms.length}
            </span>
            <span aria-hidden className="h-px w-6 bg-ivory/25" />
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ivory/85">
              {room.badge}
            </span>
          </div>

          {room.specs.length || room.description ? (
            <button
              type="button"
              aria-expanded={specsOpen}
              onClick={() => setOpenSpecs((cur) => (cur === i ? null : i))}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[2px] border px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.18em] backdrop-blur-md transition-colors",
                specsOpen
                  ? "border-forest bg-forest text-[var(--btn-primary-fg)]"
                  : "border-ivory/30 bg-espresso-deep/60 text-ivory hover:border-sand hover:text-sand",
              )}
            >
              <Sparkles className="size-3" aria-hidden />
              <span>{specsOpen ? "Hide specs" : "Room specs"}</span>
            </button>
          ) : null}
        </div>

        {/* Interactive Specs Drawer (opens on desktop hover or tap on any device) */}
        {room.specs.length || room.description ? (
          <div
            className={cn(
              "relative z-10 mx-5 transition-all duration-500 ease-[var(--ease-expo)] sm:mx-7 sm:max-w-xl",
              specsOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
            )}
          >
            <div className="grid gap-4 rounded-[2px] border border-ivory/15 bg-espresso-deep/88 p-4 backdrop-blur-xl sm:grid-cols-12 sm:p-5">
              <div className={room.secondaryImage?.src ? "sm:col-span-8" : "sm:col-span-12"}>
                {room.description ? <p className="text-sm leading-relaxed text-ivory/85">{room.description}</p> : null}
                {room.specs.length ? (
                  <ul className="mt-3 grid gap-1.5 border-t border-ivory/12 pt-3 text-xs text-ivory/90">
                    {room.specs.map((sp, k) => (
                      <li key={k} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-forest" strokeWidth={2.5} aria-hidden />
                        <span>{sp}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {room.secondaryImage?.src ? (
                <div className="hidden sm:col-span-4 sm:block">
                  <Img image={room.secondaryImage} ratio="3 / 4" sizes="180px" className="h-full border border-ivory/15" />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Bottom Stage: Giant Overlapping Room Name + Per-Room Booking & Details */}
        <div className="relative z-10 mt-auto p-5 pt-6 sm:p-8">
          <h3 className="-ml-0.5 font-serif text-[clamp(2.65rem,5.4vw,5.6rem)] leading-[0.88] tracking-[-0.026em] text-ivory drop-shadow-[0_10px_28px_rgb(0_0_0/0.5)]">
            {room.name}
          </h3>
          {room.tagline ? (
            <p className="mt-2 font-serif text-[1.25rem] italic text-sand/95">{room.tagline}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ivory/15 pt-5">
            <div className="flex flex-wrap items-center gap-4">
              <CmsButton
                button={{ label: room.bookLabel, url: room.bookUrl, variant: "primary" }}
                magnetic
              />
              {room.detailUrl ? (
                <CmsButton
                  button={{ label: room.detailLabel, url: room.detailUrl, variant: "textLight" }}
                  magnetic={false}
                />
              ) : null}
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <Section
      id={s.anchor}
      tone={tone}
      spacing={enablePin ? "flush" : s.spacing}
      labelledBy={d.title ? tid(s) : undefined}
      className="overflow-x-clip"
    >
      <div ref={sectionRef}>
        {enablePin ? (
          /* Desktop Horizontal Pinned Scroll Rail */
          <div ref={pinViewportRef} className="relative flex h-[100svh] flex-col justify-center overflow-hidden">
            {/* Top rail progress bar & counter */}
            <Container className="mb-5">
              <div className="flex items-center justify-between gap-6 font-mono text-[0.6875rem] uppercase tracking-[0.2em]">
                <span className={light ? "text-sand" : "text-bark"}>
                  {d.eyebrow || "Accommodation"} · Horizontal Sanctuary Index
                </span>
                <div className="flex items-center gap-4">
                  <span className="tnum">
                    0{activeIndex + 1} — 0{rooms.length}
                  </span>
                  <div className="h-px w-28 overflow-hidden bg-line">
                    <div
                      ref={progressBarRef}
                      className="h-full w-full origin-left scale-x-[0.33] bg-forest transition-transform duration-150"
                    />
                  </div>
                </div>
              </div>
            </Container>

            <div
              ref={trackRef}
              className="flex items-stretch gap-8 pl-[max(1.25rem,calc((100vw-var(--container,1440px))/2+3rem))] pr-16 will-change-transform"
            >
              {/* Intro Editorial Lead Panel */}
              <div className="flex w-[min(36vw,460px)] shrink-0 flex-col justify-between py-4 pr-4">
                <div>
                  {d.eyebrow ? <Eyebrow light={light}>{d.eyebrow}</Eyebrow> : null}
                  {d.title ? (
                    <SplitHeading
                      as={isFirst ? "h1" : "h2"}
                      id={tid(s)}
                      text={String(d.title)}
                      className={cn("text-display", d.eyebrow && "mt-4")}
                    />
                  ) : null}
                  {d.lead ? (
                    <p className={cn("mt-5 text-lead", light ? "text-ivory/85" : "text-ink/90")}>
                      {d.lead}
                    </p>
                  ) : null}
                  <Md text={d.body} className={cn("mt-4 space-y-3 text-[0.95rem]", light ? "text-ivory/75" : "text-muted")} />
                </div>

                <div>
                  <PassportStamp label="NO AIR-CON · SEA BREEZE" sub="SOLAR POWERED" className="mb-6" />
                  <Buttons buttons={d.buttons} />
                </div>
              </div>

              {/* Room Panels */}
              {rooms.map((room, i) => renderRoomCard(room, i, true))}
            </div>
          </div>
        ) : (
          /* Mobile Touch Swipe Carousel & Admin-Safe Unpinned Rail */
          <Container>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <Head s={s} isFirst={isFirst} light={light} lead={d.lead} />
                <Md text={d.body} className={cn("mt-4 space-y-3", light ? "text-ivory/75" : "text-muted")} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <Buttons buttons={d.buttons} />
                {rooms.length > 1 ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollCarousel(-1)}
                      aria-label="Previous room"
                      className="grid size-10 place-items-center rounded-full border border-stone/60 text-ink transition-colors hover:border-forest hover:bg-forest hover:text-[var(--btn-primary-fg)]"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCarousel(1)}
                      aria-label="Next room"
                      className="grid size-10 place-items-center rounded-full border border-stone/60 text-ink transition-colors hover:border-forest hover:bg-forest hover:text-[var(--btn-primary-fg)]"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {rooms.length ? (
              <div
                ref={mobileScrollRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const max = Math.max(1, el.scrollWidth - el.clientWidth);
                  const idx = Math.min(rooms.length - 1, Math.round((el.scrollLeft / max) * (rooms.length - 1)));
                  if (idx !== activeIndex) setActiveIndex(idx);
                }}
                className="no-scrollbar -mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:gap-6 sm:px-8 lg:mx-0 lg:px-0"
              >
                {rooms.map((room, i) => renderRoomCard(room, i, false))}
              </div>
            ) : null}

            {rooms.length > 1 ? (
              <div className="mt-5 flex items-center justify-between font-mono text-xs uppercase tracking-[0.2em] text-muted lg:hidden">
                <span>Swipe to explore rooms</span>
                <span className="tnum text-sand">
                  0{activeIndex + 1} / 0{rooms.length}
                </span>
              </div>
            ) : null}
          </Container>
        )}
      </div>
    </Section>
  );
}

/* ───────────── Image & text ───────────── */

const BORDER_FOR: Record<Tone, string> = {
  ivory: "border-ivory",
  shell: "border-shell",
  espresso: "border-espresso",
  deep: "border-espresso-deep",
  forest: "border-forest-deep",
};

/** Asymmetric 3-speed parallax photo collage + menu-style header (Restaurant). */
function CollageMedia({ imgs, caption, light }: { imgs: ImageRef[]; caption?: string; light: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { canAnimate, isAdmin, isDesktop } = useMotionConfig();
  useIsoLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el || !canAnimate || isAdmin || !isDesktop) return;
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-collage-speed]").forEach((node) => {
        const speed = Number(node.dataset.collageSpeed) || 0;
        gsap.fromTo(node, { y: -speed }, { y: speed, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }, el);
    return () => ctx.revert();
  }, [canAnimate, isAdmin, isDesktop]);
  const cap = cn("mt-3 font-mono text-xs uppercase tracking-[0.16em]", light ? "text-ivory/70" : "text-muted");
  return (
    <figure>
      <div className="mb-5 flex items-baseline gap-3">
        <span className={cn("font-serif text-h4 italic", light ? "text-sand" : "text-forest")}>Today at the Kingfisher</span>
        <span aria-hidden className="leader" />
        <span className={cn("font-mono text-[0.65rem] uppercase tracking-[0.2em]", light ? "text-ivory/60" : "text-muted")}>Sunrise — 22:00</span>
      </div>
      <div ref={wrapRef} className="grid grid-cols-12 items-start gap-3 sm:gap-4">
        <div data-collage-speed="14" className="col-span-7 will-change-transform"><MaskImage><Img image={imgs[0]} ratio="4 / 5" sizes="(min-width: 1024px) 34vw, 58vw" /></MaskImage></div>
        <div className="col-span-5 flex flex-col gap-3 sm:gap-4">
          <div data-collage-speed="30" className="will-change-transform"><Img image={imgs[1]} ratio="3 / 4" sizes="(min-width: 1024px) 24vw, 42vw" /></div>
          {imgs[2] ? <div data-collage-speed="6" className="will-change-transform"><Img image={imgs[2]} ratio="4 / 3" sizes="(min-width: 1024px) 24vw, 42vw" /></div> : null}
        </div>
      </div>
      {caption ? <figcaption className={cap}>{caption}</figcaption> : null}
    </figure>
  );
}

function SplitMedia({ d, light, tone }: { d: SectionData; light: boolean; tone: Tone }) {
  const imgs = arr<ImageRef>(d.images).filter((i) => i?.src);
  const layout = d.mediaLayout ?? "single";
  const cap = cn("mt-3 font-mono text-xs uppercase tracking-[0.16em]", light ? "text-ivory/70" : "text-muted");
  if (layout === "video") return d.videoId ? <Reveal><YouTube id={d.videoId} title={d.videoTitle || "Video"} /></Reveal> : null;
  if (layout === "map") return d.mapQuery ? <Reveal><MapEmbed query={d.mapQuery} title={`Map showing ${d.mapCaption || d.mapQuery}`} caption={d.mapCaption} /></Reveal> : null;
  if (!imgs.length || layout === "none") return null;
  if (layout === "grid") {
    return (
      <Gallery
        items={imgs.map((image) => ({ image, alt: image.alt }))}
        ratio={d.ratio || "3 / 2"}
        gridClass={Number(d.gridColumns) === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}
        sizes="(min-width: 1024px) 28vw, 50vw"
      />
    );
  }
  if (layout === "collage" && imgs.length > 1) {
    return <CollageMedia imgs={imgs} caption={d.caption} light={light} />;
  }
  if (layout === "overlap" && imgs.length > 1) {
    return (
      <div className="relative pb-10 sm:pb-14">
        <MaskImage parallax={5}>
          <Img image={imgs[0]} ratio="3 / 2" sizes="(min-width: 1024px) 56vw, 100vw" />
        </MaskImage>
        <Reveal delay={160} className={cn("absolute bottom-0 right-4 w-[44%] border-[6px] shadow-2xl sm:right-8", BORDER_FOR[tone])}>
          <Img image={imgs[1]} ratio="4 / 3" sizes="(min-width: 1024px) 22vw, 42vw" />
        </Reveal>
      </div>
    );
  }
  if (layout === "pair" && imgs.length > 1) {
    return (
      <div className="grid grid-cols-12 items-end gap-3 sm:gap-5">
        <MaskImage parallax={4} className="col-span-7">
          <Img image={imgs[0]} ratio="4 / 5" sizes="(min-width: 1024px) 34vw, 58vw" />
        </MaskImage>
        <Reveal delay={140} as="figure" className="col-span-5 mb-12">
          <Img image={imgs[1]} ratio="3 / 4" sizes="(min-width: 1024px) 24vw, 42vw" />
          {d.caption ? <figcaption className={cap}>{d.caption}</figcaption> : null}
        </Reveal>
      </div>
    );
  }
  return (
    <figure>
      <MaskImage parallax={4}>
        <Img image={imgs[0]} ratio={d.ratio || "4 / 5"} sizes="(min-width: 1024px) 50vw, 100vw" />
      </MaskImage>
      {d.caption ? <figcaption className={cap}>{d.caption}</figcaption> : null}
    </figure>
  );
}

function Checklist({ items, light, title }: { items: string[]; light?: boolean; title?: string }) {
  const line = light ? "divide-ivory/15 border-ivory/15" : "divide-line border-line";
  return (
    <div className="mt-8">
      {title ? <h3 className={cn("font-mono text-eyebrow font-medium uppercase", light ? "text-sand" : "text-bark")}>{title}</h3> : null}
      <ul className={cn("divide-y border-y", line, title && "mt-3")}>
        {items.map((f, i) => (
          <Reveal key={i} as="li" delay={stagger(i, 60)} y={10} className="group flex items-center gap-3.5 py-3.5">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full transition-[background-color,color,scale] duration-500 group-hover:scale-110",
                light ? "bg-sand/20 text-sand group-hover:bg-sand group-hover:text-espresso-deep" : "bg-forest/15 text-forest group-hover:bg-forest group-hover:text-[var(--btn-primary-fg)]",
              )}
            >
              <Check className="size-3.5" strokeWidth={2.4} aria-hidden />
            </span>
            <span className="transition-transform duration-500 group-hover:translate-x-0.5">{f}</span>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}

function SplitText({ s, isFirst, light }: { s: SectionT; isFirst: boolean; light: boolean }) {
  const d = s.data;
  const items = arr<InfoItem>(d.items);
  const features = arr<string>(d.features).filter(Boolean);
  const links = arr<{ label: string; note?: string; url: string }>(d.links).filter((l) => l.label);
  const muted = light ? "text-ivory/80" : "text-muted";
  const line = light ? "divide-ivory/15 border-ivory/15" : "divide-line border-line";
  return (
    <>
      <Head s={s} isFirst={isFirst} light={light} lead={d.lead} leadClass={light ? "text-ivory/85" : "text-ink/85"} />
      <Md text={d.body} className={cn("mt-4 space-y-4", muted)} />
      {d.note ? (
        <Reveal
          y={10}
          className={cn(
            "mt-8 border-l-2 px-5 py-4 text-[0.9375rem] transition-colors duration-500",
            light ? "border-sand bg-ivory/10 hover:bg-ivory/[0.14]" : "border-forest bg-shell/70 hover:bg-shell",
          )}
        >
          <Md text={d.note} className="space-y-2" />
        </Reveal>
      ) : null}
      {items.some((i) => i.title || i.text) ? <InfoList items={items} dark={light} style={infoStyle(d.itemStyle)} className="mt-8" /> : null}
      {features.length ? <Checklist items={features} light={light} title={d.featuresTitle} /> : null}
      {links.length ? (
        <ul className={cn("mt-8 divide-y border-y", line)}>
          {links.map((l, i) => (
            <Reveal key={i} as="li" delay={stagger(i, 60)} y={10}>
              <SmartLink url={l.url} className="group flex items-center justify-between gap-4 py-4 transition-[padding] duration-500 hover:pl-1.5">
                <span>
                  <span className="block font-serif text-h4">{l.label}</span>
                  {l.note ? <span className={cn("text-[0.9375rem]", muted)}>{l.note}</span> : null}
                </span>
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full transition-all duration-500 group-hover:translate-x-1", light ? "bg-ivory/10 text-sand group-hover:bg-sand group-hover:text-espresso-deep" : "bg-forest/15 text-forest group-hover:bg-forest group-hover:text-[var(--btn-primary-fg)]")}>
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </SmartLink>
            </Reveal>
          ))}
        </ul>
      ) : null}
      <Buttons buttons={d.buttons} className="mt-8" />
    </>
  );
}

function Split({ s, page, isFirst }: P) {
  const d = s.data;
  const links = arr<{ label: string; note?: string; url: string }>(d.links).filter((l) => l.label);

  // Backward-compatibility upgrade: if a saved draft still has the legacy Home `#rooms` split section, render it as RoomRailSection
  if (s.anchor === "rooms" && links.length >= 2) {
    const fallbackImages = [RESORT_MEDIA.oceanSuite1, RESORT_MEDIA.cottage1, RESORT_MEDIA.cottage2];
    const imgs = arr<ImageRef>(d.images).filter((i) => i?.src);
    const synthesized: SectionT = {
      ...s,
      type: "roomRail",
      data: {
        eyebrow: d.eyebrow,
        title: d.title,
        lead: d.lead,
        body: d.body,
        buttons: d.buttons,
        rooms: links.map((l, idx) => ({
          name: l.label,
          badge: idx === 0 ? "BEACHFRONT · ENSUITE" : "PALM GROVE",
          tagline: l.note ?? "",
          description: d.lead ?? "",
          image: imgs[idx] ?? fallbackImages[idx % fallbackImages.length],
          specs: ["King bed with mosquito net", "Natural ocean-breeze cooling & fan"],
          bookLabel: "Check availability",
          bookUrl: "{booking}",
          detailLabel: "Room details",
          detailUrl: l.url,
        })),
      },
    };
    return <RoomRailSection s={synthesized} page={page} isFirst={isFirst} />;
  }

  const tone: Tone = s.tone ?? "ivory";
  const light = isDarkTone(tone);
  const layout = d.mediaLayout ?? "single";
  const hasMedia = layout === "video" ? !!d.videoId : layout === "map" ? !!d.mapQuery : layout !== "none" && hasImages(d.images);
  const left = d.imagePosition !== "right";
  const half = d.mediaWidth === "half";
  const mediaCol = <div className={half ? "lg:col-span-6" : "lg:col-span-7"}>{<SplitMedia d={d} light={light} tone={tone} />}</div>;
  return (
    <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined}>
      <Container>
        <div className={cn("grid gap-12 lg:grid-cols-12 lg:gap-16", d.align === "start" ? "items-start" : "items-center")}>
          {hasMedia && left ? mediaCol : null}
          <div className={hasMedia ? (half ? "lg:col-span-6" : "lg:col-span-5") : "lg:col-span-8"}>
            <SplitText s={s} isFirst={isFirst} light={light} />
          </div>
          {hasMedia && !left ? mediaCol : null}
        </div>
      </Container>
    </Section>
  );
}

/* ───────────── Info grid ───────────── */

function Info({ s, isFirst }: P) {
  const d = s.data;
  const tone: Tone = s.tone ?? "ivory";
  const light = isDarkTone(tone);
  const groups = arr<{ title?: string; menuBlock?: boolean; items?: InfoItem[] }>(d.groups).filter((g) => arr<InfoItem>(g.items).length);
  const cols = Number(d.columns) || 2;
  const stacked = d.layout === "stacked";
  const hasHead = !!(d.eyebrow || d.title || d.intro || arr(d.buttons).length);
  const head = hasHead ? (
    <>
      <Head s={s} isFirst={isFirst} light={light} />
      {d.intro ? <p className={cn("mt-5 whitespace-pre-line", stacked && "text-lead", light ? "text-ivory/80" : "text-muted")}>{d.intro}</p> : null}
      <Buttons buttons={d.buttons} className="mt-8" />
    </>
  ) : null;
  const body = groups.map((g, i) => {
    const isMenu = !!g.menuBlock || /purchase|bar/i.test(g.title ?? "");
    if (isMenu) {
      return (
        <Reveal key={i} y={18} className={cn("relative mt-12 border border-stone/50 p-1.5", i === 0 && "mt-0")}>
          <div className={cn("border px-6 py-7 sm:px-9 sm:py-9", light ? "border-ivory/20" : "border-ink/15")}>
            <p className={cn("text-center font-mono text-[0.65rem] uppercase tracking-[0.28em]", light ? "text-sand" : "text-bark")}>The Island Bar · Available for purchase</p>
            <h3 className="mt-2 text-center font-serif text-h3 italic">{(g.title ?? "The Island Bar").replace(/^Available for purchase\s*·\s*/i, "")}</h3>
            <ul className="mt-7 space-y-5">
              {arr<InfoItem>(g.items).map((it, j) => (
                <li key={j}>
                  <p className="flex items-baseline gap-3"><span className="font-serif text-h4">{it.title}</span><span aria-hidden className="leader" /><span className={cn("shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.18em]", light ? "text-sand" : "text-forest")}>Bar menu</span></p>
                  {it.text ? <div className={cn("mt-1 max-w-lg text-[0.95rem] leading-relaxed", light ? "text-ivory/75" : "text-muted")}><Md text={it.text} className="space-y-2" /></div> : null}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      );
    }
    return (
      <div key={i} className={i > 0 ? "mt-12" : ""}>
        {g.title ? (
          <div className="mb-3">
            <h3 className={cn("font-mono text-eyebrow font-medium uppercase", light ? "text-sand" : "text-bark")}>{g.title}</h3>
            <DrawLine className={cn("mt-3", light && "bg-ivory/20")} />
          </div>
        ) : null}
        <InfoList items={arr<InfoItem>(g.items)} columns={cols} style={infoStyle(d.style)} dark={light} className={g.title ? "mt-2" : ""} />
      </div>
    );
  });
  return (
    <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined}>
      <Container>
        {stacked ? (
          <>
            {head ? <div className="max-w-2xl">{head}</div> : null}
            <div className={head ? "mt-12" : ""}>{body}</div>
          </>
        ) : (
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <div className={d.sticky ? "lg:sticky lg:top-28" : ""}>
                {head}
                {d.image?.src ? (
                  <MaskImage parallax={4} className="mt-10 hidden lg:block">
                    <Img image={d.image} ratio="4 / 5" sizes="(min-width: 1024px) 28vw, 100vw" />
                  </MaskImage>
                ) : null}
              </div>
            </div>
            <div className="lg:col-span-8">{body}</div>
          </div>
        )}
      </Container>
    </Section>
  );
}

/* ───────────── Gallery ───────────── */

function GallerySection({ s, isFirst }: P) {
  const d = s.data;
  const tone: Tone = s.tone ?? "ivory";
  const light = isDarkTone(tone);
  const items = arr<ImageRef>(d.images)
    .filter((i) => i?.src)
    .map((image) => ({ image, alt: image.alt }));
  const cols = Number(d.columns) || 3;
  const gridClass = cols === 2 ? "grid-cols-2" : cols === 4 ? "grid-cols-2 md:grid-cols-4" : d.instagram ? "grid-cols-3" : "grid-cols-2 md:grid-cols-3";
  const hasHead = !!(d.eyebrow || d.title || d.intro || arr(d.buttons).length);
  return (
    <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined}>
      <Container>
        {hasHead ? (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <Head s={s} isFirst={isFirst} light={light} size={d.compact ? "text-h3" : "text-h2"} lead={d.intro} />
            </div>
            <Buttons buttons={d.buttons} className="shrink-0" />
          </div>
        ) : null}
        <Reveal className={hasHead ? (d.compact ? "mt-8" : "mt-12") : ""}>
          {d.instagram ? (
            <InstagramGallery fallback={items} gridClass={gridClass} masonry={!!d.masonry} />
          ) : (
            <Gallery items={items} ratio={d.ratio || "1 / 1"} gridClass={gridClass} masonry={!!d.masonry} sizes={cols === 4 ? "(min-width: 768px) 25vw, 50vw" : "(min-width: 1024px) 400px, 33vw"} />
          )}
        </Reveal>
      </Container>
    </Section>
  );
}

/* ───────────── Menu card (parchment linen card over lagoon table) ───────────── */

function MenuSection({ s, isFirst }: P) {
  const d = s.data;
  const tone: Tone = s.tone ?? "shell";
  const light = isDarkTone(tone);
  const items = arr<{ name: string; text?: string; price?: string }>(d.items).filter((i) => i.name);
  const menuImg: ImageRef | undefined = d.menuImage?.src ? d.menuImage : undefined;
  return (
    <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined}>
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:col-span-5">
            <Head s={s} isFirst={isFirst} light={light} lead={d.intro} />
            {menuImg ? (
              <div className="mt-10 flex items-end gap-5">
                <div className="w-28 shrink-0 sm:w-32">
                  <Gallery items={[{ image: menuImg, alt: menuImg.alt || "Menu" }]} ratio={menuImg.w && menuImg.h ? `${menuImg.w} / ${menuImg.h}` : "3 / 4"} gridClass="grid-cols-1" sizes="128px" />
                </div>
                {d.menuImageCaption ? <p className={cn("pb-1 text-sm", light ? "text-ivory/70" : "text-muted")}>{d.menuImageCaption}</p> : null}
              </div>
            ) : null}
          </div>
          <div className="lg:col-span-7">
            <Reveal
              y={22}
              as="article"
              style={{ containerType: "inline-size" }}
              className="relative overflow-hidden rounded-[var(--img-radius,0px)] bg-[var(--fg-on-dark)] px-6 pb-12 pt-10 text-[var(--fg-on-light)] shadow-[0_40px_80px_-36px_rgb(0_0_0/0.65)] sm:px-14 sm:pb-16 sm:pt-14"
            >
              <div aria-hidden className="pointer-events-none absolute inset-3 border border-[color:var(--fg-on-light)]/20 sm:inset-4" />
              {d.illustrations ? <img src={menuArt.kingfisher} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute right-3 top-5 w-16 mix-blend-multiply sm:right-5 sm:top-6 sm:w-32" /> : null}
              <header className={cn("relative sm:text-center", d.illustrations && "pr-16 sm:px-24")}>
                {d.cardEyebrow ? <p className="font-mono text-eyebrow font-medium uppercase text-forest-deep">{d.cardEyebrow}</p> : null}
                <h3 id={`${s.id}-card`} className="mt-3 font-serif text-[2.75rem] italic leading-none sm:text-[3.5rem]">
                  {d.cardTitle || "Menu"}
                </h3>
                {d.cardSubtitle ? <p className="mt-3 text-[0.9375rem] opacity-75">{d.cardSubtitle}</p> : null}
              </header>
              <ul className="relative mt-10 divide-y divide-dashed divide-[color:var(--fg-on-light)]/20">
                {items.map((it, i) => (
                  <Reveal key={i} as="li" delay={stagger(i, 70)} y={10} className="group py-5 transition-colors duration-500 sm:px-6">
                    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:justify-center">
                      <span className="font-serif text-h4 leading-snug">{it.name}</span>
                      {it.price ? (
                        <>
                          <span aria-hidden className="leader" />
                          <span className="tnum shrink-0 rounded-full bg-forest/15 px-2.5 py-0.5 font-mono text-[0.8125rem] font-medium text-forest-deep">{it.price}</span>
                        </>
                      ) : null}
                    </p>
                    {it.text ? <p className="mt-1.5 max-w-md text-base leading-relaxed opacity-75 sm:mx-auto sm:text-center">{it.text}</p> : null}
                  </Reveal>
                ))}
              </ul>
              {d.illustrations ? (
                <>
                  <img src={menuArt.egg} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute -left-1 top-[46%] hidden w-20 mix-blend-multiply lg:block" />
                  <img src={menuArt.fruitBowl} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute -right-1 bottom-28 hidden w-24 mix-blend-multiply lg:block" />
                  <img src={menuArt.pancakes} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute bottom-3 left-3 hidden w-24 mix-blend-multiply lg:block" />
                </>
              ) : null}
            </Reveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ───────────── Banner ───────────── */

function Banner({ s, isFirst }: P) {
  const d = s.data;
  const center = d.align === "center";
  const overlay = (typeof d.overlay === "number" ? d.overlay : center ? 65 : 90) / 100;
  const fillRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const { canAnimate, isAdmin } = useMotionConfig();
  useIsoLayoutEffect(() => {
    const el = fillRef.current, sec = sectionRef.current;
    if (!el || !sec || !center || !canAnimate || isAdmin) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el, { "--fill-p": 0 } as gsap.TweenVars, { "--fill-p": 1, ease: "none", scrollTrigger: { trigger: sec, start: "top 75%", end: "center center", scrub: true } } as gsap.TweenVars);
    }, sec);
    return () => ctx.revert();
  }, [center, canAnimate, isAdmin, d.title]);
  if (center) {
    const btns = arr<ButtonData>(d.buttons).filter((b) => b.label);
    const primary = btns[0]; const secondary = btns.slice(1);
    return (
      <section ref={sectionRef} id={s.anchor || undefined} aria-labelledby={d.title ? tid(s) : undefined} className="on-dark relative isolate flex min-h-[100svh] items-center overflow-hidden bg-espresso-deep text-ivory">
        {d.image?.src ? <Img image={d.image} flat sizes="100vw" className="absolute inset-0 -z-20 h-full w-full" /> : null}
        <div aria-hidden className="absolute inset-0 -z-10" style={{ opacity: overlay, background: "linear-gradient(180deg, color-mix(in oklab, var(--color-espresso-deep) 88%, transparent), color-mix(in oklab, var(--color-forest) 34%, var(--color-espresso-deep)) 55%, color-mix(in oklab, var(--color-bark) 30%, var(--color-espresso-deep)))" }} />
        <Container className="py-24 text-center md:py-32">
          <Reveal y={22} className="mx-auto max-w-4xl">
            {d.eyebrow ? <Eyebrow light>{d.eyebrow}</Eyebrow> : null}
            {d.title ? <h2 ref={fillRef} id={tid(s)} className="scrub-fill-text mt-6 font-serif text-display leading-[0.95]">{String(d.title)}</h2> : null}
            <Md text={d.body} className="mx-auto mt-6 max-w-xl space-y-4 text-lead text-ivory/90" />
            {primary ? <div className="mt-10 flex justify-center"><CmsButton button={primary} magnetic className="scale-110" /></div> : null}
            {secondary.length ? <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">{secondary.map((b, i) => <CmsButton key={i} button={{ ...b, variant: "textLight" }} magnetic={false} />)}</div> : null}
            <Md text={d.note} className="mx-auto mt-8 max-w-xl space-y-2 text-[0.9375rem] text-ivory/75" linkClass="font-semibold text-ivory underline underline-offset-4 hover:no-underline" />
          </Reveal>
        </Container>
      </section>
    );
  }
  return (
    <section id={s.anchor || undefined} aria-labelledby={d.title ? tid(s) : undefined} className={cn("on-dark relative isolate flex overflow-hidden bg-espresso-deep text-ivory", d.size === "large" ? "min-h-[80svh] items-end md:min-h-[86svh] md:items-center" : "items-center")}>
      {d.image?.src ? <Img image={d.image} flat sizes="100vw" className="absolute inset-0 -z-10 h-full w-full" /> : null}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-espresso-deep via-espresso-deep/55 to-espresso-deep/15 md:bg-gradient-to-r md:from-espresso-deep md:via-espresso-deep/55 md:to-transparent" style={{ opacity: overlay }} />
      <Container className="py-20 md:py-28">
        <Reveal y={22} className="max-w-xl">
          {d.eyebrow ? <Eyebrow light>{d.eyebrow}</Eyebrow> : null}
          {d.title ? <Title s={s} isFirst={isFirst} className="mt-5 text-h1">{d.title}</Title> : null}
          <Md text={d.body} className="mt-6 space-y-4 text-lead text-ivory/90" />
          <Buttons buttons={d.buttons} className="mt-9" />
          <Md text={d.note} className="mt-8 space-y-2 text-[0.9375rem] text-ivory/75" linkClass="font-semibold text-ivory underline underline-offset-4 hover:no-underline" />
        </Reveal>
      </Container>
    </section>
  );
}

/* ───────────── Inquiry ───────────── */

function Inquiry({ s, isFirst }: P) {
  const d = s.data;
  const site = useSite();
  const { content } = useCms();
  const tone: Tone = s.tone ?? "shell";
  const light = isDarkTone(tone);
  const form = (
    <div className="border border-line bg-ivory/70 p-6 text-ink backdrop-blur-sm sm:p-10">
      <InquiryForm idPrefix={`${s.id}-form`} />
    </div>
  );
  const row = "flex gap-4 border-t border-line py-5";

  if (d.variant === "details") {
    return (
      <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined} fabHide>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <Head s={s} isFirst={isFirst} light={light} lead={d.intro} />
              <div className="mt-8">{form}</div>
            </div>
            <aside className="lg:col-span-5" aria-label={d.asideTitle || "Contact details"}>
              <div className="lg:sticky lg:top-28">
                {d.asideEyebrow ? <Eyebrow light={light}>{d.asideEyebrow}</Eyebrow> : null}
                {d.asideTitle ? <h3 className="mt-4 text-h3">{d.asideTitle}</h3> : null}
                <ul className="mt-6 border-b border-line">
                  <li className={row}>
                    <Mail className="mt-1 size-5 shrink-0 text-forest" aria-hidden />
                    <div>
                      <p className="font-semibold">Enquiries</p>
                      <a href={`mailto:${site.email}`} className="text-muted underline underline-offset-4 hover:text-ink">
                        {site.email}
                      </a>
                    </div>
                  </li>
                  <li className={row}>
                    <Icon name="brand:whatsapp" className="mt-1 size-5 shrink-0 text-forest" />
                    <div>
                      <p className="font-semibold">WhatsApp</p>
                      <a href={whatsappLink(site)} className="text-muted underline underline-offset-4 hover:text-ink">
                        {site.whatsappDisplay}
                      </a>
                      <p className="mt-1 text-sm text-muted">We do not have phone signal on the island — WhatsApp is the best way to reach us.</p>
                    </div>
                  </li>
                  <li className={row}>
                    <Icon name="MapPin" className="mt-1 size-5 shrink-0 text-forest" />
                    <div>
                      <p className="font-semibold">Address</p>
                      <p className="text-muted">{site.address}</p>
                    </div>
                  </li>
                </ul>
                {content.social.length ? (
                  <div className="mt-6 flex gap-3">
                    {content.social.map((so, i) => (
                      <SmartLink key={i} url={so.url} ariaLabel={`${so.label} (opens in a new tab)`} className="grid size-11 place-items-center rounded-full border border-line transition-colors hover:border-forest hover:bg-forest hover:text-[var(--btn-primary-fg)]">
                        <Icon name={so.icon} className="size-5" />
                      </SmartLink>
                    ))}
                  </div>
                ) : null}
                {d.bookTitle || d.bookText ? (
                  <div className="mt-10 border border-line bg-shell p-6 text-ink">
                    {d.bookTitle ? <h3 className="font-serif text-h4">{d.bookTitle}</h3> : null}
                    {d.bookText ? <p className="mt-2 text-[0.9375rem] text-muted">{d.bookText}</p> : null}
                    <CmsButton button={{ label: "Check availability", url: "{booking}", variant: "primary" }} className="mt-5" />
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined} fabHide>
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Head s={s} isFirst={isFirst} light={light} lead={d.intro} />
              {d.image?.src ? (
                <MaskImage parallax={4} className="mt-10 hidden lg:block">
                  <Img image={d.image} ratio="4 / 3" sizes="(min-width: 1024px) 40vw, 100vw" />
                </MaskImage>
              ) : null}
              <div className="mt-8 flex flex-col items-start gap-4">
                <CmsButton button={{ label: "Ready to book? Check availability", url: "{booking}", variant: light ? "textLight" : "text" }} />
                <a href={whatsappLink(site)} className={cn("inline-flex items-center gap-2 text-[0.9375rem]", light ? "text-ivory/80 hover:text-ivory" : "text-muted hover:text-ink")}>
                  <Icon name="brand:whatsapp" className={cn("size-5", light ? "text-sand" : "text-forest")} />
                  Prefer to chat? WhatsApp {site.whatsappDisplay}
                </a>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">{form}</div>
        </div>
      </Container>
    </Section>
  );
}

/* ───────────── FAQ ───────────── */

function Faq({ s, isFirst }: P) {
  const d = s.data;
  const tone: Tone = s.tone ?? "ivory";
  const light = isDarkTone(tone);
  const muted = light ? "text-ivory/80" : "text-muted";
  const groups = arr<{ title?: string; items?: { q: string; a: string }[] }>(d.groups).filter((g) => arr(g.items).length);
  return (
    <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined}>
      <Container>
        <Head s={s} isFirst={isFirst} light={light} />
        <div className={cn("mt-12 grid gap-12 lg:gap-16", groups.length > 1 && "lg:grid-cols-2")}>
          {groups.map((g, i) => (
            <div key={i}>
              {g.title ? (
                <h3 className={cn("flex items-center gap-3 border-b pb-4 font-mono text-eyebrow font-medium uppercase", light ? "border-ivory/25 text-sand" : "border-line text-bark")}>
                  {g.title}
                </h3>
              ) : null}
              {arr<{ q: string; a: string }>(g.items).map((it, j) => (
                <Reveal
                  key={j}
                  as="details"
                  delay={stagger(j, 45)}
                  y={10}
                  className={cn(
                    "group border-b transition-colors duration-300",
                    light ? "border-ivory/15 open:bg-ivory/[0.04] hover:border-ivory/30" : "border-line open:bg-shell/50 hover:border-stone",
                  )}
                >
                  <summary className={cn("flex min-h-14 list-none items-center justify-between gap-6 py-5 pl-0 pr-1 font-serif text-[1.3rem] leading-snug transition-[color,padding] duration-300 hover:pl-2", light ? "hover:text-sand" : "hover:text-forest", "group-open:pl-2")}>
                    <span className="relative">
                      <span aria-hidden className={cn("absolute -left-2 top-1/2 h-0 w-0.5 -translate-y-1/2 transition-[height] duration-300 group-open:h-[calc(100%-0.5rem)]", light ? "bg-sand" : "bg-forest")} />
                      {it.q}
                    </span>
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full transition-[rotate,background-color,color] duration-300 group-open:rotate-45", light ? "bg-ivory/10 text-sand group-open:bg-sand group-open:text-espresso-deep" : "bg-forest/15 text-forest group-open:bg-forest group-open:text-[var(--btn-primary-fg)]")}>
                      <Plus className="size-4" aria-hidden />
                    </span>
                  </summary>
                  <Md text={it.a} className={cn("acc-body space-y-3 pb-6 pl-2 pr-2 sm:pr-10", muted)} />
                </Reveal>
              ))}
            </div>
          ))}
        </div>
        {d.ctaTitle || arr(d.buttons).length ? (
          <Reveal y={14} className={cn("mt-16 flex flex-col gap-6 border p-6 transition-shadow duration-500 sm:p-10 md:flex-row md:items-center md:justify-between", light ? "border-ivory/15 bg-ivory/5" : "border-line bg-shell/70")}>
            <div>
              {d.ctaTitle ? <h3 className="text-h3">{d.ctaTitle}</h3> : null}
              {d.ctaText ? <p className={cn("mt-2", muted)}>{d.ctaText}</p> : null}
            </div>
            <Buttons buttons={d.buttons} className="shrink-0" />
          </Reveal>
        ) : null}
      </Container>
    </Section>
  );
}

/* ───────────── Price list ───────────── */

function Pricing({ s, isFirst }: P) {
  const d = s.data;
  const tone: Tone = s.tone ?? "ivory";
  const light = isDarkTone(tone);
  const muted = light ? "text-ivory/75" : "text-muted";
  const groups = arr<{ title?: string; rows?: { name: string; price?: string; text?: string }[] }>(d.groups).filter((g) => arr(g.rows).length);
  return (
    <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined}>
      <Container>
        <div className={cn(d.divider && "border-t pt-12", light ? "border-ivory/15" : "border-line")}>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <Head s={s} isFirst={isFirst} light={light} size="text-h3" />
            </div>
            {d.aside ? <p className={cn("font-mono text-xs uppercase tracking-[0.16em]", muted)}>{d.aside}</p> : null}
          </div>
          {groups.length ? (
            <div className={cn("mt-8 grid gap-6", groups.length > 1 && "md:grid-cols-2")}>
              {groups.map((g, i) => (
                <Reveal
                  key={i}
                  delay={stagger(i, 120)}
                  className={cn(
                    "group/card overflow-hidden rounded-[var(--img-radius,0px)] border transition-[translate,border-color] duration-500 ease-[var(--ease-soft)] hover:-translate-y-1",
                    light ? "border-ivory/15 bg-ivory/[0.04] hover:border-sand/40" : "border-line bg-shell/60 hover:border-stone",
                  )}
                >
                  {g.title ? (
                    <h3 className={cn("relative flex items-center gap-3 overflow-hidden px-6 py-4 font-mono text-eyebrow font-medium uppercase", light ? "bg-ivory/[0.06] text-sand" : "bg-shell text-bark")}>
                      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1 origin-top scale-y-0 transition-transform duration-500 group-hover/card:scale-y-100", light ? "bg-sand" : "bg-forest")} />
                      {g.title}
                    </h3>
                  ) : null}
                  <dl className={cn("divide-y", light ? "divide-ivory/10" : "divide-line")}>
                    {arr<{ name: string; price?: string; text?: string }>(g.rows).map((r, j) => (
                      <div key={j} className={cn("group/row px-6 py-5 transition-colors duration-300", light ? "hover:bg-ivory/[0.05]" : "hover:bg-ivory/50")}>
                        <dt>
                          <LeaderRow name={r.name} price={r.price} light={light} />
                        </dt>
                        {r.text ? <dd className={cn("mt-2 text-[0.9375rem] leading-relaxed", muted)}>{r.text}</dd> : null}
                      </div>
                    ))}
                  </dl>
                </Reveal>
              ))}
            </div>
          ) : null}
          {arr<InfoItem>(d.items).some((i) => i.title || i.text) ? <InfoList items={arr<InfoItem>(d.items)} columns={2} dark={light} className="mt-10" /> : null}
        </div>
      </Container>
    </Section>
  );
}

/* ───────────── Comparison table ───────────── */

const YES = /^(yes|y|true|✓|✔|included|si|oui)$/i;
const NO = /^(no|n|false|-|–|—|x|✗|not included)$/i;

function Cell({ value, light, className }: { value: string; light?: boolean; className?: string }) {
  const v = (value ?? "").trim();
  if (YES.test(v))
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <span className={cn("grid size-6 place-items-center rounded-full", light ? "bg-sand/20 text-sand" : "bg-forest/15 text-forest")}>
          <Check className="size-3.5" strokeWidth={2.4} aria-hidden />
        </span>
        <span className="sr-only">Yes</span>
      </span>
    );
  if (NO.test(v))
    return (
      <span className={cn("inline-flex items-center", className)}>
        <Minus className={cn("size-4", light ? "text-ivory/35" : "text-stone")} aria-hidden />
        <span className="sr-only">No</span>
      </span>
    );
  return <span className={cn("tnum", className)}>{v}</span>;
}

function TableSection({ s, isFirst }: P) {
  const d = s.data;
  const tone: Tone = s.tone ?? "ivory";
  const light = isDarkTone(tone);
  const muted = light ? "text-ivory/75" : "text-muted";
  const columns = arr<string>(d.columns).filter((c) => c !== undefined && c !== null);
  const rows = arr<{ cells?: string[] }>(d.rows)
    .map((r) => arr<string>(r.cells))
    .filter((cells) => cells.some((c) => (c ?? "").trim()));
  const hasHead = !!(d.eyebrow || d.title || d.intro);
  if (!columns.length || !rows.length) {
    return (
      <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined}>
        <Container>
          <Head s={s} isFirst={isFirst} light={light} lead={d.intro} />
        </Container>
      </Section>
    );
  }
  const divide = light ? "divide-ivory/12" : "divide-line";
  return (
    <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined}>
      <Container>
        {hasHead ? (
          <div className="max-w-2xl">
            <Head s={s} isFirst={isFirst} light={light} lead={d.intro} />
          </div>
        ) : null}

        <Reveal className={cn("mt-10 hidden overflow-hidden rounded-[var(--img-radius,0px)] border md:block", light ? "border-ivory/15" : "border-line bg-ivory/60")}>
          <table className="w-full border-collapse text-left">
            {d.title ? <caption className="sr-only">{d.title}</caption> : null}
            <thead>
              <tr className={cn(light ? "bg-ivory/[0.07]" : "bg-shell")}>
                {columns.map((c, i) => (
                  <th key={i} scope="col" className={cn("px-5 py-4 font-mono text-eyebrow font-medium uppercase", light ? "text-sand" : "text-bark", i > 0 && "text-center", i === 0 && "w-[34%]")}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={cn("divide-y", divide)}>
              {rows.map((cells, r) => (
                <tr key={r} className={cn("group transition-colors duration-300", light ? "hover:bg-ivory/[0.05]" : "hover:bg-shell/60")}>
                  {columns.map((_, c) => (
                    <td key={c} className={cn("px-5 py-4 align-top", c > 0 && "text-center")}>
                      {c === 0 ? (
                        <span className="flex items-start gap-3">
                          <span aria-hidden className={cn("mt-2.5 h-px w-0 shrink-0 transition-[width] duration-500 group-hover:w-4", light ? "bg-sand" : "bg-forest")} />
                          <span className="font-serif text-[1.25rem] leading-snug">{cells[0] ?? ""}</span>
                        </span>
                      ) : (
                        <Cell value={cells[c] ?? ""} light={light} className={cn("text-[0.9375rem]", muted)} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        <div className="mt-8 grid gap-3 md:hidden">
          {rows.map((cells, r) => (
            <Reveal key={r} delay={stagger(r, 70)} y={12} className={cn("overflow-hidden rounded-[var(--img-radius,0px)] border", light ? "border-ivory/15 bg-ivory/[0.04]" : "border-line bg-ivory/60")}>
              <p className={cn("px-4 py-3 font-serif text-h4", light ? "bg-ivory/[0.06]" : "bg-shell")}>{cells[0] ?? ""}</p>
              <dl className={cn("divide-y", divide)}>
                {columns.slice(1).map((c, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt className={cn("font-mono text-xs uppercase tracking-wider", muted)}>{c}</dt>
                    <dd className="text-right">
                      <Cell value={cells[i + 1] ?? ""} light={light} className="text-[0.9375rem]" />
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ))}
        </div>

        {d.note ? <Md text={d.note} className={cn("mt-6 space-y-2 text-[0.9375rem]", muted)} /> : null}
        <Buttons buttons={d.buttons} className="mt-9" />
      </Container>
    </Section>
  );
}

/* ───────────── Text ───────────── */

function TextSection({ s, isFirst }: P) {
  const d = s.data;
  const tone: Tone = s.tone ?? "ivory";
  const light = isDarkTone(tone);
  const muted = light ? "text-ivory/80" : "text-muted";
  const line = light ? "border-ivory/15" : "border-line";
  const blocks = arr<{ heading?: string; body?: string }>(d.blocks).filter((b) => b.heading || b.body);
  const blockList = blocks.length ? (
    <div className="mt-10 space-y-10">
      {blocks.map((b, i) => (
        <Reveal key={i} as="section" y={12} className={cn("border-t pt-8", line)}>
          {b.heading ? <h3 className="font-serif text-h4">{b.heading}</h3> : null}
          <Md text={b.body} className={cn("mt-4 space-y-4", muted)} />
        </Reveal>
      ))}
    </div>
  ) : null;
  if (d.layout === "article") {
    return (
      <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined}>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Head s={s} isFirst={isFirst} light={light} />
            {d.subtitle ? <p className={cn("mt-3", muted)}>{d.subtitle}</p> : null}
            <Md text={d.body} className={cn("mt-6 space-y-4 text-lead", muted)} />
            {blockList}
          </div>
        </Container>
      </Section>
    );
  }
  return (
    <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined}>
      <Container>
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Head s={s} isFirst={isFirst} light={light} size="text-h3" />
          </div>
          <div className="lg:col-span-8">
            {d.subtitle ? <p className={cn("mb-3 font-medium", muted)}>{d.subtitle}</p> : null}
            <Md text={d.body} className={cn("space-y-4 text-lead", muted)} />
            {blockList}
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ───────────── In-page chapters ───────────── */

function Chapters({ s, page }: P) {
  const items = arr<{ label: string; anchor: string }>(s.data.items).filter((i) => i.label && i.anchor);
  if (!items.length) return null;
  const tone: Tone = s.tone ?? "ivory";
  const light = isDarkTone(tone);
  return (
    <nav id={s.anchor || undefined} aria-label="On this page" className={cn("border-b", light ? "border-ivory/10" : "border-line", toneClass(tone))}>
      <Container>
        <ul className="no-scrollbar -mx-5 flex gap-8 overflow-x-auto px-5 sm:mx-0 sm:px-0 lg:justify-between">
          {items.map((c, i) => (
            <li key={i} className="shrink-0">
              <SmartLink url={`#${page.slug}?s=${encodeURIComponent(c.anchor.replace(/^#/, ""))}`} className="group inline-flex min-h-14 items-center gap-2.5 text-[0.9375rem] opacity-80 transition-opacity hover:opacity-100">
                <span className={cn("tnum font-mono text-xs transition-transform duration-500 group-hover:-translate-y-0.5", light ? "text-sand" : "text-forest")} aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="relative">
                  {c.label}
                  <span aria-hidden className="absolute -bottom-1 left-0 h-px w-0 bg-forest transition-[width] duration-500 group-hover:w-full" />
                </span>
              </SmartLink>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}

/* ───────────── Showcase ───────────── */

type ShowcaseStrip = { title?: string; tag?: string; text?: string; image?: ImageRef; url?: string };
function Showcase({ s, isFirst }: P) {
  const d = s.data;
  const tone: Tone = s.tone ?? "forest";
  const light = isDarkTone(tone);
  const lists = arr<{ title?: string; items?: string[] }>(d.lists).filter((l) => l.title || arr(l.items).length);
  const imgs = arr<ImageRef>(d.images).filter((i) => i?.src);
  const strips = useMemo<Required<ShowcaseStrip>[]>(() => {
    const raw = arr<ShowcaseStrip>(d.strips).filter((x) => x && (x.title || x.image?.src));
    if (raw.length) return raw.map((x, i) => ({ title: x.title || `Experience 0${i + 1}`, tag: x.tag || "Included", text: x.text || "", image: x.image?.src ? x.image : imgs[i % Math.max(1, imgs.length)] || RESORT_MEDIA.lagoonSwim, url: x.url || "#/activities" }));
    // Synthesize from legacy lists + images
    const out: Required<ShowcaseStrip>[] = [];
    lists.forEach((l) => arr<string>(l.items).forEach((item) => out.push({ title: item, tag: l.title || "Included", text: d.lead || "", image: imgs[out.length % Math.max(1, imgs.length)] || RESORT_MEDIA.lagoonSwim, url: "#/activities" })));
    return out.slice(0, 6);
  }, [d.strips, d.lead, lists, imgs]);
  const [active, setActive] = useState(0);
  const included = (tag: string) => /includ/i.test(tag);
  return (
    <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined}>
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6"><Head s={s} isFirst={isFirst} light={light} lead={d.lead} /></div>
          {lists.length ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:col-span-5 lg:col-start-8">
              {lists.map((l, i) => (
                <Reveal key={i} delay={stagger(i, 110)} y={12}>
                  {l.title ? <h3 className={cn("font-mono text-eyebrow font-medium uppercase", light ? "text-sand" : "text-bark")}>{l.title}</h3> : null}
                  <ul className={cn("mt-3 space-y-1.5", light ? "text-ivory/85" : "text-muted")}>
                    {arr<string>(l.items).map((it, j) => (<li key={j} className="flex gap-2.5"><span aria-hidden className={cn("mt-[0.6em] size-1 shrink-0 rounded-full", light ? "bg-sand" : "bg-forest")} />{it}</li>))}
                  </ul>
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
        {strips.length ? (
          <>
            {/* Desktop: hover-expanding horizontal accordion */}
            <div className="mt-12 hidden h-[520px] gap-2 lg:flex" onPointerLeave={() => setActive(0)}>
              {strips.map((strip, i) => {
                const isActive = i === active;
                return (
                  <article key={i} onPointerEnter={() => setActive(i)} className={cn("on-dark group relative isolate min-w-0 overflow-hidden rounded-[var(--img-radius,0px)] border border-ivory/10 bg-espresso-deep text-ivory transition-[flex] duration-700 ease-[var(--ease-expo)]", isActive ? "flex-[3.4]" : "flex-[1]")}>
                    <div className="absolute inset-0 -z-20"><Img image={strip.image} flat sizes={isActive ? "50vw" : "16vw"} className="h-full w-full" imgClassName={cn("transition-all duration-700", isActive ? "scale-100 opacity-100" : "scale-105 opacity-70")} /></div>
                    <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-espresso-deep/95 via-espresso-deep/30 to-espresso-deep/40" />
                    <span className={cn("absolute left-1/2 top-5 -translate-x-1/2 rounded-full px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] whitespace-nowrap", included(strip.tag) ? "bg-forest text-[var(--btn-primary-fg)]" : "bg-ivory/15 text-sand backdrop-blur", isActive && "left-5 translate-x-0")}>{strip.tag}</span>
                    <h3 className={cn("absolute font-serif leading-tight transition-all duration-500", isActive ? "bottom-28 left-6 right-6 text-h2" : "bottom-6 left-1/2 origin-bottom-left -translate-x-1/2 -rotate-90 whitespace-nowrap text-h4")}>{strip.title}</h3>
                    {isActive ? (<div className="absolute inset-x-0 bottom-0 p-6"><p className="max-w-md text-ivory/85">{strip.text}</p>{strip.url ? <SmartLink url={strip.url} data-cursor="View" className="mt-3 inline-flex font-mono text-[0.7rem] uppercase tracking-[0.18em] text-sand hover:text-forest">Explore →</SmartLink> : null}</div>) : null}
                  </article>
                );
              })}
            </div>
            {/* Mobile: tap-expanding vertical strips */}
            <div className="mt-10 flex flex-col gap-2 lg:hidden">
              {strips.map((strip, i) => {
                const open = i === active;
                return (
                  <article key={i} className="on-dark overflow-hidden rounded-[var(--img-radius,0px)] border border-ivory/10 bg-espresso-deep text-ivory">
                    <button type="button" aria-expanded={open} onClick={() => setActive(open ? -1 : i)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                      <span className="font-serif text-h4">{strip.title}</span>
                      <span className={cn("shrink-0 rounded-full px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em]", included(strip.tag) ? "bg-forest text-[var(--btn-primary-fg)]" : "bg-ivory/15 text-sand")}>{strip.tag}</span>
                    </button>
                    <div className={cn("grid transition-all duration-500", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}><div className="overflow-hidden"><Img image={strip.image} ratio="16 / 9" sizes="92vw" />{strip.text ? <p className="p-4 text-ivory/85">{strip.text}</p> : null}</div></div>
                  </article>
                );
              })}
            </div>
          </>
        ) : imgs.length ? (
          <div className="mt-14 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
            {imgs.map((img, i) => (<Reveal key={i} delay={stagger(i, 110)} as="figure" className="group"><Img image={img} ratio="4 / 5" sizes="(min-width: 768px) 30vw, 50vw" />{img.caption ? <figcaption className={cn("mt-3 font-mono text-xs uppercase tracking-[0.14em]", light ? "text-ivory/75" : "text-muted")}>{img.caption}</figcaption> : null}</Reveal>))}
          </div>
        ) : null}
        <Buttons buttons={d.buttons} className="mt-12" />
      </Container>
    </Section>
  );
}

const RENDERERS: Record<SectionType, (p: P) => JSX.Element | null> = {
  hero: Hero,
  pageHeader: PageHeader,
  split: Split,
  info: Info,
  steps: Steps,
  journey: JourneySection,
  roomRail: RoomRailSection,
  gallery: GallerySection,
  menu: MenuSection,
  banner: Banner,
  inquiry: Inquiry,
  faq: Faq,
  pricing: Pricing,
  table: TableSection,
  text: TextSection,
  chapters: Chapters,
  showcase: Showcase,
};

export function SectionView({ section, page, isFirst }: { section: SectionT; page: Page; isFirst: boolean }) {
  const R = RENDERERS[section.type];
  return R ? <R s={section} page={page} isFirst={isFirst} /> : null;
}
