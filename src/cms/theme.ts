import type { ColorKey, Theme } from "./types";

export type FontDef = { name: string; spec: string; fallback: string };

const SERIF = "'Iowan Old Style', 'Palatino Linotype', Georgia, serif";
const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const MONO = "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

/** Bundled via @fontsource Latin woff2 — no external CDN stylesheet needed when selected. */
const SELF_HOSTED_FONTS = new Set(["Instrument Serif", "Hanken Grotesk", "DM Mono"]);

export const HEADING_FONTS: FontDef[] = [
  { name: "Instrument Serif", spec: "ital@0;1", fallback: SERIF },
  { name: "Newsreader", spec: "ital,opsz,wght@0,6..72,300..600;1,6..72,300..500", fallback: SERIF },
  { name: "Cormorant Garamond", spec: "ital,wght@0,300;0,400;0,500;0,600;0,700;1,400", fallback: SERIF },
  { name: "Playfair Display", spec: "ital,wght@0,400..700;1,400..700", fallback: SERIF },
  { name: "Fraunces", spec: "ital,wght@0,300..700;1,300..700", fallback: SERIF },
  { name: "EB Garamond", spec: "ital,wght@0,400..700;1,400..700", fallback: SERIF },
  { name: "Lora", spec: "ital,wght@0,400..700;1,300..700", fallback: SERIF },
  { name: "Literata", spec: "ital,wght@0,300..700;1,300..700", fallback: SERIF },
  { name: "Libre Caslon Text", spec: "ital,wght@0,400;0,700;1,400", fallback: SERIF },
  { name: "Bodoni Moda", spec: "ital,wght@0,400..700;1,400..700", fallback: SERIF },
  { name: "DM Serif Display", spec: "ital@0;1", fallback: SERIF },
  { name: "Marcellus", spec: "", fallback: SERIF },
  { name: "Prata", spec: "", fallback: SERIF },
  { name: "Gilda Display", spec: "", fallback: SERIF },
  { name: "Jost", spec: "wght@300..700", fallback: SANS },
  { name: "Outfit", spec: "wght@300..700", fallback: SANS },
];

export const BODY_FONTS: FontDef[] = [
  { name: "Hanken Grotesk", spec: "wght@300..700", fallback: SANS },
  { name: "Inter", spec: "wght@300..700", fallback: SANS },
  { name: "DM Sans", spec: "wght@300..700", fallback: SANS },
  { name: "Manrope", spec: "wght@300..700", fallback: SANS },
  { name: "Plus Jakarta Sans", spec: "wght@300..700", fallback: SANS },
  { name: "Figtree", spec: "wght@300..700", fallback: SANS },
  { name: "Work Sans", spec: "wght@300..700", fallback: SANS },
  { name: "Karla", spec: "wght@300..700", fallback: SANS },
  { name: "Nunito Sans", spec: "wght@300..700", fallback: SANS },
  { name: "Mulish", spec: "wght@300..700", fallback: SANS },
  { name: "Source Sans 3", spec: "wght@300..700", fallback: SANS },
  { name: "Jost", spec: "wght@300..700", fallback: SANS },
  { name: "Outfit", spec: "wght@300..700", fallback: SANS },
  { name: "Lato", spec: "wght@300;400;700", fallback: SANS },
  { name: "Lora", spec: "ital,wght@0,400..700;1,400..700", fallback: SERIF },
];

const ALL_FONTS = [...HEADING_FONTS, ...BODY_FONTS];
const fontDef = (name: string) => ALL_FONTS.find((f) => f.name === name);

export function fontHref(names: string[]) {
  const remote = Array.from(new Set(names.filter((n) => n && !SELF_HOSTED_FONTS.has(n))));
  if (!remote.length) return "";
  const families = remote.map((n) => {
    const spec = fontDef(n)?.spec;
    return `family=${n.trim().replace(/\s+/g, "+")}${spec ? `:${spec}` : ""}`;
  });
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

const SHAPES: Record<Theme["buttons"]["shape"], string> = { square: "2px", soft: "6px", rounded: "12px", pill: "999px" };
const SIZES: Record<Theme["buttons"]["size"], [string, string, string]> = {
  sm: ["2.5rem", "1.15rem", "0.75rem"],
  md: ["3.125rem", "1.6rem", "0.78125rem"],
  lg: ["3.625rem", "2.05rem", "0.875rem"],
};

function parseRgb(hex: string): [number, number, number] | null {
  const raw = hex.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return [parseInt(raw[0] + raw[0], 16), parseInt(raw[1] + raw[1], 16), parseInt(raw[2] + raw[2], 16)];
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) {
    return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)];
  }
  return null;
}

function luminance(hex: string, fallback = 0.5): number {
  const rgb = parseRgb(hex);
  if (!rgb) return fallback;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(lumA: number, lumB: number): number {
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export type SiteMode = "light" | "dark";

/** Bright daytime palette (default) and the original dark lagoon palette. */
export const MODE_COLORS: Record<SiteMode, Record<ColorKey, string>> = {
  light: {
    ivory: "#faf6ee", shell: "#f2e9d9", sand: "#e6d5b8", stone: "#b3a184", line: "#ded1ba",
    ink: "#13272d", muted: "#5b6d70", espresso: "#14333d", "espresso-deep": "#0a212a",
    forest: "#d94f30", "forest-deep": "#b23a20", clay: "#b5381f", bark: "#8a5229",
  },
  dark: {
    ivory: "#071418", shell: "#0d2128", sand: "#e6d3b3", stone: "#294750", line: "#18313a",
    ink: "#f4ecdc", muted: "#9db5b9", espresso: "#0b1c22", "espresso-deep": "#040b0e",
    forest: "#e85d3d", "forest-deep": "#c24327", clay: "#ff7d61", bark: "#daa86d",
  },
};

export function applyTheme(t: Theme, mode: SiteMode = "light") {
  const colors = { ...t.colors, ...MODE_COLORS[mode] };
  const root = document.documentElement;
  const s = root.style;
  root.dataset.siteMode = mode;
  for (const [k, v] of Object.entries(colors)) if (v) s.setProperty(`--color-${k}`, v);

  // Derive WCAG-safe light/dark foregrounds so both dark-lagoon and light-parchment themes work seamlessly.
  const ivoryLum = luminance(colors.ivory || "#faf6ee", 0.9);
  const inkLum = luminance(colors.ink || "#13272d", 0.02);
  const isDarkBase = ivoryLum < inkLum;
  const lightToken = isDarkBase ? "var(--color-ink)" : "var(--color-ivory)";
  const darkToken = isDarkBase ? "var(--color-ivory)" : "var(--color-ink)";
  const lightLum = Math.max(ivoryLum, inkLum);
  const darkLum = Math.min(ivoryLum, inkLum);

  root.dataset.themeMode = isDarkBase ? "dark" : "light";
  s.setProperty("--fg-on-dark", lightToken);
  s.setProperty("--fg-on-light", darkToken);

  s.setProperty("--font-serif", `"${t.fonts.heading}", ${fontDef(t.fonts.heading)?.fallback ?? SERIF}`);
  s.setProperty("--font-sans", `"${t.fonts.body}", ${fontDef(t.fonts.body)?.fallback ?? SANS}`);
  s.setProperty("--font-mono", MONO);
  s.setProperty("--heading-weight", String(t.fonts.headingWeight || 400));
  s.setProperty("--type-scale", String(t.fonts.headingScale || 1));
  s.setProperty("--body-scale", String(t.fonts.bodyScale || 1));
  s.setProperty("--heading-transform", t.fonts.headingUppercase ? "uppercase" : "none");

  const b = t.buttons;
  const [height, px, fs] = SIZES[b.size] ?? SIZES.md;
  const primaryHex = b.primary || colors.forest || "#d94f30";
  const primaryLum = luminance(primaryHex, 0.24);
  const autoPrimaryFg = contrast(primaryLum, darkLum) >= contrast(primaryLum, lightLum) ? darkToken : lightToken;

  s.setProperty("--btn-radius", SHAPES[b.shape] ?? "2px");
  s.setProperty("--btn-h", height);
  s.setProperty("--btn-px", px);
  s.setProperty("--btn-fs", fs);
  s.setProperty("--btn-weight", String(b.weight || 500));
  s.setProperty("--btn-tracking", `${b.uppercase ? b.tracking : Math.min(b.tracking, 0.04)}em`);
  s.setProperty("--btn-transform", b.uppercase ? "uppercase" : "none");
  s.setProperty("--btn-primary", b.primary || "var(--color-forest)");
  s.setProperty("--btn-primary-hover", b.primary ? `color-mix(in oklab, ${b.primary} 82%, black)` : "var(--color-forest-deep)");
  s.setProperty("--btn-primary-fg", b.primaryText || autoPrimaryFg);
  s.setProperty("--btn-shadow", b.shadow ? "0 14px 32px -14px rgb(0 0 0 / 0.6)" : "none");

  s.setProperty("--container", `${t.layout.container || 1440}px`);
  s.setProperty("--space", String(t.layout.spacing ?? 1));
  s.setProperty("--img-radius", `${t.layout.imageRadius ?? 0}px`);
  root.classList.toggle("no-anim", !t.layout.animations);

  // Only load Google Fonts when the admin picks a non-bundled typeface.
  const href = fontHref([t.fonts.heading, t.fonts.body]);
  const existing = document.getElementById("cms-fonts") as HTMLLinkElement | null;
  if (!href) {
    existing?.remove();
  } else {
    const link = existing ?? document.createElement("link");
    if (!existing) {
      link.id = "cms-fonts";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.getAttribute("href") !== href) link.setAttribute("href", href);
  }

  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", mode === "light" ? (colors.ivory || "#faf6ee") : (colors["espresso-deep"] || "#040b0e"));
}

export const COLOR_LABELS: { key: ColorKey; label: string; help: string }[] = [
  { key: "ivory", label: "Background", help: "Main page background (deep lagoon base)" },
  { key: "shell", label: "Soft surface", help: "Alternate section & card surface" },
  { key: "sand", label: "Warm sand", help: "Sun-bleached highlights & dark-section accents" },
  { key: "stone", label: "Stone", help: "Input rules, frames & dividers" },
  { key: "line", label: "Lines", help: "Nautical chart hairlines" },
  { key: "ink", label: "Text", help: "Primary sun-bleached headings & body text" },
  { key: "muted", label: "Muted text", help: "Secondary sea-mist paragraphs" },
  { key: "espresso", label: "Dusk surface", help: "Twilight & dark feature sections" },
  { key: "espresso-deep", label: "Abyssal dark", help: "Heroes, night sections & footer" },
  { key: "forest", label: "Sunset accent", help: "Primary CTAs, active markers & hover" },
  { key: "forest-deep", label: "Accent deep", help: "CTA hover & rich editorial sections" },
  { key: "bark", label: "Coordinates & labels", help: "Compass brass eyebrows & logbook tags" },
  { key: "clay", label: "Alerts", help: "Required marks and form alerts" },
];

export const PRESETS: { name: string; colors: Record<ColorKey, string> }[] = [
  {
    name: "Edge of the Map",
    colors: {
      ivory: "#071418",
      shell: "#0d2128",
      sand: "#e6d3b3",
      stone: "#294750",
      line: "#18313a",
      ink: "#f4ecdc",
      muted: "#9db5b9",
      espresso: "#0b1c22",
      "espresso-deep": "#040b0e",
      forest: "#e85d3d",
      "forest-deep": "#c24327",
      clay: "#ff7d61",
      bark: "#daa86d",
    },
  },
  {
    name: "Golden Strait",
    colors: {
      ivory: "#120f0d",
      shell: "#1c1713",
      sand: "#ebd6b5",
      stone: "#473b31",
      line: "#2d241e",
      ink: "#f6eee0",
      muted: "#b8aa99",
      espresso: "#19130f",
      "espresso-deep": "#0a0807",
      forest: "#ee6b42",
      "forest-deep": "#c64c27",
      clay: "#ff8566",
      bark: "#e0ad6e",
    },
  },
  {
    name: "Bioluminescent Night",
    colors: {
      ivory: "#050f14",
      shell: "#0a1c24",
      sand: "#d8e6df",
      stone: "#21404d",
      line: "#132933",
      ink: "#eef5f2",
      muted: "#93b0b8",
      espresso: "#08171f",
      "espresso-deep": "#03090d",
      forest: "#f06848",
      "forest-deep": "#c7482b",
      clay: "#ff8066",
      bark: "#7ec8b8",
    },
  },
  {
    name: "Sun-Bleached Atlas",
    colors: {
      ivory: "#f5ede0",
      shell: "#ebe0cd",
      sand: "#dccbb0",
      stone: "#bfb097",
      line: "#d9ccb6",
      ink: "#0c1b20",
      muted: "#48595e",
      espresso: "#0f242b",
      "espresso-deep": "#071418",
      forest: "#d94f30",
      "forest-deep": "#b33b20",
      clay: "#b5381f",
      bark: "#8a5229",
    },
  },
  {
    name: "Cayo Classic",
    colors: {
      ivory: "#fbf7f0",
      shell: "#f4ece0",
      sand: "#e8dac4",
      stone: "#cdbfa9",
      line: "#e3d7c5",
      ink: "#1f1a15",
      muted: "#5c5248",
      espresso: "#3e2f24",
      "espresso-deep": "#2a2019",
      forest: "#3d5a47",
      "forest-deep": "#2e4537",
      clay: "#9a4a2e",
      bark: "#4a2c0d",
    },
  },
];
