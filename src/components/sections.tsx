import type { JSX, ReactNode } from "react";
import { ArrowRight, Check, Mail, Minus, Plus } from "lucide-react";
import { cn } from "@/utils/cn";
import { useCms, useSite } from "@/cms/store";
import { Icon } from "@/cms/icons";
import { whatsappLink } from "@/cms/links";
import type { ImageRef, Page, Section as SectionT, SectionData, SectionType, Tone } from "@/cms/types";
import { menuArt } from "@/lib/media";
import { Md } from "@/lib/markdown";
import { Gallery, InfoList, InstagramGallery, MapEmbed, YouTube, type InfoItem, type InfoStyle } from "./Blocks";
import { InquiryForm } from "./Forms";
import { Reveal, stagger } from "./motion";
import { SmartLink } from "./SmartLink";
import { Buttons, CmsButton, Container, Eyebrow, Img, Section, buttonClass, isDarkTone, toneClass } from "./ui";

type P = { s: SectionT; page: Page; isFirst: boolean };
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const tid = (s: SectionT) => `${s.id}-title`;
const hasImages = (v: unknown) => arr<ImageRef>(v).some((i) => i && i.src);
const infoStyle = (v: unknown): InfoStyle => (v === "cards" || v === "numbered" ? v : "list");

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
          <span className={cn("tnum shrink-0 rounded-full px-2.5 py-0.5 text-[0.9375rem] font-semibold", light ? "bg-ivory/10 text-sand" : "bg-forest/10 text-forest")}>{price}</span>
        </>
      ) : null}
    </p>
  );
}

/* ───────────── Hero ───────────── */

const HERO_SIZE: Record<string, string> = {
  full: "min-h-[100svh] max-h-[1100px]",
  large: "min-h-[82svh] md:min-h-[88svh] max-h-[1000px]",
  medium: "min-h-[62svh] md:min-h-[70svh] max-h-[820px]",
};

function Hero({ s, isFirst }: P) {
  const d = s.data;
  const stats = arr<{ label: string; value: string }>(d.stats).filter((x) => x.label || x.value);
  const overlay = Math.min(1, (typeof d.overlay === "number" ? d.overlay : 45) / 50);
  return (
    <section
      id={s.anchor || undefined}
      aria-labelledby={d.title ? tid(s) : undefined}
      className={cn("on-dark relative isolate flex flex-col justify-end overflow-hidden bg-espresso-deep text-ivory", HERO_SIZE[d.size] ?? HERO_SIZE.large)}
    >
      {d.image?.src ? <Img image={d.image} flat priority={isFirst} sizes="100vw" className="absolute inset-0 -z-10 h-full w-full" imgClassName="animate-hero-in" /> : null}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-espresso-deep via-espresso-deep/30 to-espresso-deep/50" style={{ opacity: overlay }} />
      <Container className="pb-12 pt-32 md:pb-16">
        <div className="max-w-3xl animate-fade-up">
          {d.eyebrow ? <Eyebrow light>{d.eyebrow}</Eyebrow> : null}
          {d.title ? (
            <Title s={s} isFirst={isFirst} className="mt-5 text-display">
              {d.title}
            </Title>
          ) : null}
          {d.lead ? <p className="mt-6 max-w-2xl whitespace-pre-line text-lead text-ivory/90">{d.lead}</p> : null}
          <Buttons buttons={d.buttons} className="mt-9" />
        </div>
        {stats.length ? (
          <dl className="mt-12 hidden border-t border-ivory/20 text-[0.9375rem] sm:grid" style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))` }}>
            {stats.map((st, i) => (
              <Reveal key={i} delay={stagger(i, 110)} y={12} className={cn("group py-6 pr-8", i > 0 && "border-l border-ivory/15 pl-8")}>
                <dt className="text-eyebrow font-semibold uppercase text-sand">{st.label}</dt>
                <dd className="mt-2 text-ivory/90 transition-transform duration-500 group-hover:translate-x-0.5">{st.value}</dd>
              </Reveal>
            ))}
          </dl>
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
        <div className="max-w-3xl animate-fade-up">
          <Head s={s} isFirst={isFirst} light={light} size="text-h1" lead={d.lead} />
          <Buttons buttons={d.buttons} className="mt-8" />
        </div>
      </Container>
    </section>
  );
}

/* ───────────── Image & text ───────────── */

const BORDER_FOR: Record<Tone, string> = { ivory: "border-ivory", shell: "border-shell", espresso: "border-espresso", deep: "border-espresso-deep", forest: "border-forest-deep" };

function SplitMedia({ d, light, tone }: { d: SectionData; light: boolean; tone: Tone }) {
  const imgs = arr<ImageRef>(d.images).filter((i) => i?.src);
  const layout = d.mediaLayout ?? "single";
  const cap = cn("mt-3 text-sm", light ? "text-ivory/70" : "text-muted");
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
  if (layout === "overlap" && imgs.length > 1) {
    return (
      <div className="relative pb-10 sm:pb-12">
        <Reveal>
          <Img image={imgs[0]} ratio="3 / 2" sizes="(min-width: 1024px) 56vw, 100vw" />
        </Reveal>
        <Reveal delay={160} className={cn("absolute bottom-0 right-4 w-[42%] border-[6px] sm:right-8", BORDER_FOR[tone])}>
          <Img image={imgs[1]} ratio="4 / 3" sizes="(min-width: 1024px) 22vw, 42vw" />
        </Reveal>
      </div>
    );
  }
  if (layout === "pair" && imgs.length > 1) {
    return (
      <div className="grid grid-cols-12 items-end gap-3 sm:gap-5">
        <Reveal className="col-span-7">
          <Img image={imgs[0]} ratio="4 / 5" sizes="(min-width: 1024px) 34vw, 58vw" />
        </Reveal>
        <Reveal delay={140} as="figure" className="col-span-5 mb-12">
          <Img image={imgs[1]} ratio="3 / 4" sizes="(min-width: 1024px) 24vw, 42vw" />
          {d.caption ? <figcaption className={cap}>{d.caption}</figcaption> : null}
        </Reveal>
      </div>
    );
  }
  return (
    <Reveal as="figure">
      <Img image={imgs[0]} ratio={d.ratio || "4 / 5"} sizes="(min-width: 1024px) 50vw, 100vw" />
      {d.caption ? <figcaption className={cap}>{d.caption}</figcaption> : null}
    </Reveal>
  );
}

function Checklist({ items, light, title }: { items: string[]; light?: boolean; title?: string }) {
  const line = light ? "divide-ivory/15 border-ivory/15" : "divide-line border-line";
  return (
    <div className="mt-8">
      {title ? <h3 className={cn("text-eyebrow font-semibold uppercase", light ? "text-sand" : "text-bark")}>{title}</h3> : null}
      <ul className={cn("divide-y border-y", line, title && "mt-3")}>
        {items.map((f, i) => (
          <Reveal key={i} as="li" delay={stagger(i, 60)} y={10} className="group flex items-center gap-3.5 py-3.5">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full transition-[background-color,color,scale] duration-500 group-hover:scale-110",
                light ? "bg-sand/20 text-sand group-hover:bg-sand group-hover:text-espresso-deep" : "bg-forest/10 text-forest group-hover:bg-forest group-hover:text-ivory",
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

function SplitText({ s, isFirst, light, tone }: { s: SectionT; isFirst: boolean; light: boolean; tone: Tone }) {
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
            light ? "border-sand bg-ivory/10 hover:bg-ivory/[0.15]" : tone === "shell" ? "border-forest bg-ivory hover:bg-white" : "border-forest bg-shell hover:bg-sand/50",
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
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full transition-all duration-500 group-hover:translate-x-1", light ? "bg-ivory/10 text-sand group-hover:bg-sand group-hover:text-espresso-deep" : "bg-forest/10 text-forest group-hover:bg-forest group-hover:text-ivory")}>
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

function Split({ s, isFirst }: P) {
  const d = s.data;
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
            <SplitText s={s} isFirst={isFirst} light={light} tone={tone} />
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
  const groups = arr<{ title?: string; items?: InfoItem[] }>(d.groups).filter((g) => arr<InfoItem>(g.items).length);
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
  const body = groups.map((g, i) => (
    <div key={i} className={i > 0 ? "mt-12" : ""}>
      {g.title ? (
        <h3 className={cn("flex items-center gap-3 text-eyebrow font-semibold uppercase", light ? "text-sand" : "text-bark")}>
          {g.title}
          <span aria-hidden className={cn("h-px flex-1", light ? "bg-ivory/20" : "bg-line")} />
        </h3>
      ) : null}
      <InfoList items={arr<InfoItem>(g.items)} columns={cols} style={infoStyle(d.style)} dark={light} className={g.title ? "mt-3" : ""} />
    </div>
  ));
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
                  <Reveal className="mt-10 hidden lg:block">
                    <Img image={d.image} ratio="4 / 5" sizes="(min-width: 1024px) 28vw, 100vw" />
                  </Reveal>
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

/* ───────────── Journey & maps ───────────── */

function Steps({ s, isFirst }: P) {
  const d = s.data;
  const site = useSite();
  const tone: Tone = s.tone ?? "ivory";
  const light = isDarkTone(tone);
  const steps = arr<{ title: string; text: string }>(d.steps).filter((x) => x.title || x.text);
  const facts = arr<InfoItem>(d.facts).filter((x) => x.title || x.text);
  const maps = arr<{ query: string; caption?: string }>(d.maps).filter((m) => m.query);
  const side = d.layout !== "stacked" && maps.length > 0;
  const muted = light ? "text-ivory/80" : "text-muted";
  const hasHead = !!(d.eyebrow || d.title || d.lead);

  const stepsEl = steps.length ? (
    <ol className={cn("relative mt-10", steps.length > 1 && "before:absolute before:bottom-8 before:left-[1.1875rem] before:top-4 before:w-px", light ? "before:bg-gradient-to-b before:from-sand/50 before:to-sand/5" : "before:bg-gradient-to-b before:from-forest/40 before:to-forest/5")}>
      {steps.map((st, i) => (
        <Reveal key={i} as="li" delay={stagger(i, 110)} className="group relative grid grid-cols-[2.5rem_1fr] gap-x-5 pb-9 last:pb-0">
          <span
            aria-hidden
            className={cn(
              "tnum relative z-10 grid size-10 place-items-center rounded-full border text-[0.8125rem] font-semibold transition-[background-color,color,scale] duration-500 group-hover:scale-105",
              light ? "border-sand/40 bg-espresso-deep text-sand group-hover:bg-sand group-hover:text-espresso-deep" : "border-forest/25 bg-ivory text-forest group-hover:bg-forest group-hover:text-ivory",
            )}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="pt-1.5">
            <h3 className="font-serif text-h4">{st.title}</h3>
            {st.text ? <p className={cn("mt-1.5", muted)}>{st.text}</p> : null}
          </div>
        </Reveal>
      ))}
    </ol>
  ) : null;

  const factsEl = facts.length ? <InfoList items={facts} columns={side ? 2 : Math.min(facts.length, 3)} style="cards" dark={light} className={cn(side ? "mt-8" : "mt-12")} /> : null;

  const contact = d.contactBox ? (
    <Reveal y={10} className={cn("mt-8 border p-6", light ? "border-ivory/15 bg-ivory/5" : "border-line bg-shell")}>
      {d.contactText ? <p className="font-medium">{d.contactText}</p> : null}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a href={whatsappLink(site, d.contactMessage || undefined)} target="_blank" rel="noopener noreferrer" className={buttonClass(light ? "light" : "primary", "normal-case tracking-normal")}>
          <Icon name="brand:whatsapp" className="size-5" /> WhatsApp {site.whatsappDisplay}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <a href={`mailto:${site.email}?subject=${encodeURIComponent(`Transfer to ${site.name}`)}`} className={buttonClass(light ? "outlineLight" : "outline", "normal-case tracking-normal")}>
          <Mail className="size-5" aria-hidden /> {site.email}
        </a>
      </div>
    </Reveal>
  ) : null;

  const head = hasHead ? <Head s={s} isFirst={isFirst} light={light} lead={d.lead} /> : null;

  if (side) {
    return (
      <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined}>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:order-2 lg:col-span-6">
              {head}
              {stepsEl}
              {factsEl}
              {contact}
              <Buttons buttons={d.buttons} className="mt-8" />
            </div>
            <div className="lg:order-1 lg:col-span-6">
              <Reveal className="lg:sticky lg:top-28">
                <MapEmbed query={maps[0].query} title={`Map showing ${maps[0].caption || maps[0].query}`} caption={maps[0].caption} ratio="aspect-[4/3] lg:aspect-[4/5]" />
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined}>
      <Container>
        {head ? <div className="max-w-2xl">{head}</div> : null}
        {stepsEl ? <div className="max-w-3xl">{stepsEl}</div> : null}
        {factsEl}
        {maps.length ? (
          <div className={cn("grid gap-8", maps.length > 1 && "md:grid-cols-2", (hasHead || facts.length || steps.length) && "mt-12")}>
            {maps.map((m, i) => (
              <Reveal key={i} delay={stagger(i, 120)}>
                <MapEmbed query={m.query} title={`Map showing ${m.caption || m.query}`} caption={m.caption} />
              </Reveal>
            ))}
          </div>
        ) : null}
        {contact ? <div className="max-w-3xl">{contact}</div> : null}
        <Buttons buttons={d.buttons} className="mt-10" />
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
            <InstagramGallery fallback={items} gridClass={gridClass} />
          ) : (
            <Gallery items={items} ratio={d.ratio || "1 / 1"} gridClass={gridClass} sizes={cols === 4 ? "(min-width: 768px) 25vw, 50vw" : "(min-width: 1024px) 400px, 33vw"} />
          )}
        </Reveal>
      </Container>
    </Section>
  );
}

/* ───────────── Menu card ───────────── */

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
            <Reveal y={22} as="article" style={{ containerType: "inline-size" }} className="relative overflow-hidden rounded-[var(--img-radius,0px)] bg-ivory px-6 pb-12 pt-10 text-ink shadow-[0_40px_80px_-40px_rgba(62,47,36,0.45)] sm:px-14 sm:pb-16 sm:pt-14">
              <div aria-hidden className="pointer-events-none absolute inset-3 border border-stone/70 sm:inset-4" />
              {d.illustrations ? <img src={menuArt.kingfisher} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute right-3 top-5 w-16 mix-blend-multiply sm:right-5 sm:top-6 sm:w-32" /> : null}
              <header className={cn("relative sm:text-center", d.illustrations && "pr-16 sm:px-24")}>
                {d.cardEyebrow ? <p className="text-eyebrow font-semibold uppercase text-forest">{d.cardEyebrow}</p> : null}
                <h3 id={`${s.id}-card`} className="mt-3 font-serif text-[2.75rem] italic leading-none text-bark sm:text-[3.5rem]">
                  {d.cardTitle || "Menu"}
                </h3>
                {d.cardSubtitle ? <p className="mt-3 text-[0.9375rem] text-muted">{d.cardSubtitle}</p> : null}
              </header>
              <ul className="relative mt-10 divide-y divide-dashed divide-stone">
                {items.map((it, i) => (
                  <Reveal key={i} as="li" delay={stagger(i, 70)} y={10} className="group py-5 transition-colors duration-500 sm:px-6">
                    <LeaderRow name={it.name} price={it.price} className="sm:justify-center" />
                    {it.text ? <p className="mt-1.5 max-w-md text-base leading-relaxed text-muted sm:mx-auto sm:text-center">{it.text}</p> : null}
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
  return (
    <section
      id={s.anchor || undefined}
      aria-labelledby={d.title ? tid(s) : undefined}
      className={cn("on-dark relative isolate flex overflow-hidden bg-espresso-deep text-ivory", d.size === "large" ? "min-h-[80svh] items-end md:min-h-[86svh] md:items-center" : "items-center")}
    >
      {d.image?.src ? <Img image={d.image} flat sizes="100vw" className="absolute inset-0 -z-10 h-full w-full" /> : null}
      {center ? (
        <div aria-hidden className="absolute inset-0 -z-10 bg-espresso-deep" style={{ opacity: overlay }} />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-espresso-deep via-espresso-deep/50 to-espresso-deep/10 md:bg-gradient-to-r md:from-espresso-deep md:via-espresso-deep/50 md:to-transparent"
          style={{ opacity: overlay }}
        />
      )}
      <Container className={center ? "py-24 text-center md:py-36" : "py-20 md:py-28"}>
        <Reveal y={22} className={center ? "mx-auto max-w-3xl" : "max-w-xl"}>
          {d.eyebrow ? <Eyebrow light>{d.eyebrow}</Eyebrow> : null}
          {d.title ? (
            <Title s={s} isFirst={isFirst} className="mt-5 text-h1">
              {d.title}
            </Title>
          ) : null}
          <Md text={d.body} className={cn("mt-6 space-y-4 text-lead text-ivory/90", center && "mx-auto max-w-xl")} />
          <Buttons buttons={d.buttons} className={cn("mt-9", center && "justify-center")} />
          <Md text={d.note} className={cn("mt-8 space-y-2 text-[0.9375rem] text-ivory/75", center && "mx-auto max-w-xl")} linkClass="font-semibold text-ivory underline underline-offset-4 hover:no-underline" />
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
    <div className="border border-line bg-ivory p-6 text-ink sm:p-10">
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
                      <a href={whatsappLink(site)} target="_blank" rel="noopener noreferrer" className="text-muted underline underline-offset-4 hover:text-ink">
                        {site.whatsappDisplay}
                        <span className="sr-only"> (opens in a new tab)</span>
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
                      <SmartLink key={i} url={so.url} ariaLabel={`${so.label} (opens in a new tab)`} className="grid size-11 place-items-center rounded-full border border-line transition-colors hover:border-ink hover:bg-ink hover:text-ivory">
                        <Icon name={so.icon} className="size-5" />
                      </SmartLink>
                    ))}
                  </div>
                ) : null}
                {d.bookTitle || d.bookText ? (
                  <div className="mt-10 bg-shell p-6 text-ink">
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
                <Reveal className="mt-10 hidden lg:block">
                  <Img image={d.image} ratio="4 / 3" sizes="(min-width: 1024px) 40vw, 100vw" />
                </Reveal>
              ) : null}
              <div className="mt-8 flex flex-col items-start gap-4">
                <CmsButton button={{ label: "Ready to book? Check availability", url: "{booking}", variant: light ? "textLight" : "text" }} />
                <a href={whatsappLink(site)} target="_blank" rel="noopener noreferrer" className={cn("inline-flex items-center gap-2 text-[0.9375rem]", light ? "text-ivory/80 hover:text-ivory" : "text-muted hover:text-ink")}>
                  <Icon name="brand:whatsapp" className={cn("size-5", light ? "text-sand" : "text-forest")} />
                  Prefer to chat? WhatsApp {site.whatsappDisplay}
                  <span className="sr-only"> (opens in a new tab)</span>
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
                <h3 className={cn("flex items-center gap-3 border-b pb-4 text-eyebrow font-semibold uppercase", light ? "border-ivory/25 text-sand" : "border-ink/20 text-bark")}>
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
                  <summary className={cn("flex min-h-14 list-none items-center justify-between gap-6 py-5 pl-0 pr-1 font-serif text-[1.25rem] leading-snug transition-[color,padding] duration-300 hover:pl-2", light ? "hover:text-sand" : "hover:text-forest", "group-open:pl-2")}>
                    <span className="relative">
                      <span aria-hidden className={cn("absolute -left-2 top-1/2 h-0 w-0.5 -translate-y-1/2 transition-[height] duration-300 group-open:h-[calc(100%-0.5rem)]", light ? "bg-sand" : "bg-forest")} />
                      {it.q}
                    </span>
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full transition-[rotate,background-color,color] duration-300 group-open:rotate-45", light ? "bg-ivory/10 text-sand group-open:bg-sand group-open:text-espresso-deep" : "bg-forest/10 text-forest group-open:bg-forest group-open:text-ivory")}>
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
          <Reveal y={14} className={cn("mt-16 flex flex-col gap-6 border p-6 transition-shadow duration-500 sm:p-10 md:flex-row md:items-center md:justify-between", light ? "border-ivory/15 bg-ivory/5" : "border-line bg-ivory hover:shadow-[0_30px_60px_-40px_rgba(42,32,25,0.5)]")}>
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
            {d.aside ? <p className={cn("text-[0.9375rem]", muted)}>{d.aside}</p> : null}
          </div>
          {groups.length ? (
            <div className={cn("mt-8 grid gap-6", groups.length > 1 && "md:grid-cols-2")}>
              {groups.map((g, i) => (
                <Reveal
                  key={i}
                  delay={stagger(i, 120)}
                  className={cn(
                    "group/card overflow-hidden rounded-[max(var(--img-radius,0px),4px)] border transition-[translate,box-shadow,border-color] duration-500 ease-[cubic-bezier(.22,.61,.36,1)] hover:-translate-y-1",
                    light ? "border-ivory/15 bg-ivory/[0.04] hover:border-sand/40" : "border-line bg-ivory hover:border-stone hover:shadow-[0_34px_60px_-40px_rgba(42,32,25,0.55)]",
                  )}
                >
                  {g.title ? (
                    <h3 className={cn("relative flex items-center gap-3 overflow-hidden px-6 py-4 text-eyebrow font-semibold uppercase", light ? "bg-ivory/[0.06] text-sand" : "bg-shell text-bark")}>
                      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1 origin-top scale-y-0 transition-transform duration-500 group-hover/card:scale-y-100", light ? "bg-sand" : "bg-forest")} />
                      {g.title}
                    </h3>
                  ) : null}
                  <dl className={cn("divide-y", light ? "divide-ivory/10" : "divide-line")}>
                    {arr<{ name: string; price?: string; text?: string }>(g.rows).map((r, j) => (
                      <div key={j} className={cn("group/row px-6 py-5 transition-colors duration-300", light ? "hover:bg-ivory/[0.05]" : "hover:bg-shell/60")}>
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
        <span className={cn("grid size-6 place-items-center rounded-full", light ? "bg-sand/20 text-sand" : "bg-forest/10 text-forest")}>
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

        {/* Desktop: a real table, kept airy and legible */}
        <Reveal className={cn("mt-10 hidden overflow-hidden rounded-[max(var(--img-radius,0px),4px)] border md:block", light ? "border-ivory/15" : "border-line bg-ivory")}>
          <table className="w-full border-collapse text-left">
            {d.title ? <caption className="sr-only">{d.title}</caption> : null}
            <thead>
              <tr className={cn(light ? "bg-ivory/[0.07]" : "bg-shell")}>
                {columns.map((c, i) => (
                  <th key={i} scope="col" className={cn("px-5 py-4 text-eyebrow font-semibold uppercase", light ? "text-sand" : "text-bark", i > 0 && "text-center", i === 0 && "w-[34%]")}>
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
                          <span aria-hidden className={cn("mt-2 h-px w-0 shrink-0 transition-[width] duration-500 group-hover:w-4", light ? "bg-sand" : "bg-forest")} />
                          <span className="font-serif text-[1.15rem] leading-snug">{cells[0] ?? ""}</span>
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

        {/* Mobile: one card per row, no sideways scrolling */}
        <div className="mt-8 grid gap-3 md:hidden">
          {rows.map((cells, r) => (
            <Reveal key={r} delay={stagger(r, 70)} y={12} className={cn("overflow-hidden rounded-[max(var(--img-radius,0px),4px)] border", light ? "border-ivory/15 bg-ivory/[0.04]" : "border-line bg-ivory")}>
              <p className={cn("px-4 py-3 font-serif text-h4", light ? "bg-ivory/[0.06]" : "bg-shell")}>{cells[0] ?? ""}</p>
              <dl className={cn("divide-y", divide)}>
                {columns.slice(1).map((c, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt className={cn("text-[0.8125rem] font-medium uppercase tracking-wide", muted)}>{c}</dt>
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
                <span className={cn("tnum font-serif transition-transform duration-500 group-hover:-translate-y-0.5", light ? "text-sand" : "text-forest")} aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="relative">
                  {c.label}
                  <span aria-hidden className="absolute -bottom-1 left-0 h-px w-0 bg-current transition-[width] duration-500 group-hover:w-full" />
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

function Showcase({ s, isFirst }: P) {
  const d = s.data;
  const tone: Tone = s.tone ?? "forest";
  const light = isDarkTone(tone);
  const lists = arr<{ title?: string; items?: string[] }>(d.lists).filter((l) => l.title || arr(l.items).length);
  const imgs = arr<ImageRef>(d.images).filter((i) => i?.src);
  return (
    <Section id={s.anchor} tone={tone} spacing={s.spacing} labelledBy={d.title ? tid(s) : undefined}>
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <Head s={s} isFirst={isFirst} light={light} lead={d.lead} />
          </div>
          {lists.length ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:col-span-5 lg:col-start-8">
              {lists.map((l, i) => (
                <Reveal key={i} delay={stagger(i, 110)} y={12}>
                  {l.title ? <h3 className={cn("text-eyebrow font-semibold uppercase", light ? "text-sand" : "text-bark")}>{l.title}</h3> : null}
                  <ul className={cn("mt-3 space-y-1.5", light ? "text-ivory/85" : "text-muted")}>
                    {arr<string>(l.items).map((it, j) => (
                      <li key={j} className="flex gap-2.5">
                        <span aria-hidden className={cn("mt-[0.6em] size-1 shrink-0 rounded-full", light ? "bg-sand" : "bg-forest")} />
                        {it}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
        {imgs.length ? (
          <div className="mt-14 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
            {imgs.map((img, i) => (
              <Reveal key={i} delay={stagger(i, 110)} as="figure" className={cn("group", imgs.length > 1 && imgs.length % 2 === 1 && i === imgs.length - 1 && "hidden md:block")}>
                <Img image={img} ratio="4 / 5" sizes="(min-width: 768px) 30vw, 50vw" imgClassName="transition-transform duration-[900ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.04]" />
                {img.caption ? <figcaption className={cn("mt-3 text-sm", light ? "text-ivory/75" : "text-muted")}>{img.caption}</figcaption> : null}
              </Reveal>
            ))}
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
