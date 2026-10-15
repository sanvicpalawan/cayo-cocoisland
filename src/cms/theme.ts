import type { ColorKey, Theme } from "./types";

export type FontDef = { name: string; spec: string; fallback: string };

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export const HEADING_FONTS: FontDef[] = [
  { name: "Newsreader", spec: "ital,opsz,wght@0,6..72,300..600;1,6..72,300..500", fallback: SERIF },
  { name: "Cormorant Garamond", spec: "ital,wght@0,300;0,400;0,500;0,600;0,700;1,400", fallback: SERIF },
  { name: "Playfair Display", spec: "ital,wght@0,400..700;1,400..700", fallback: SERIF },
  { name: "Fraunces", spec: "ital,wght@0,300..700;1,300..700", fallback: SERIF },
  { name: "EB Garamond", spec: "ital,wght@0,400..700;1,400..700", fallback: SERIF },
  { name: "Lora", spec: "ital,wght@0,400..700;1,400..700", fallback: SERIF },
  { name: "Literata", spec: "ital,wght@0,300..700;1,300..700", fallback: SERIF },
  { name: "Libre Caslon Text", spec: "ital,wght@0,400;0,700;1,400", fallback: SERIF },
  { name: "Bodoni Moda", spec: "ital,wght@0,400..700;1,400..700", fallback: SERIF },
  { name: "DM Serif Display", spec: "ital@0;1", fallback: SERIF },
  { name: "Instrument Serif", spec: "ital@0;1", fallback: SERIF },
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
  const families = Array.from(new Set(names.filter(Boolean))).map((n) => {
    const spec = fontDef(n)?.spec;
    return `family=${n.trim().replace(/\s+/g, "+")}${spec ? `:${spec}` : ""}`;
  });
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

const SHAPES: Record<Theme["buttons"]["shape"], string> = { square: "2px", soft: "6px", rounded: "12px", pill: "999px" };
const SIZES: Record<Theme["buttons"]["size"], [string, string, string]> = {
  sm: ["2.5rem", "1.15rem", "0.75rem"],
  md: ["3rem", "1.5rem", "0.8125rem"],
  lg: ["3.5rem", "1.9rem", "0.9rem"],
};

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  const s = root.style;
  for (const [k, v] of Object.entries(t.colors)) if (v) s.setProperty(`--color-${k}`, v);
  s.setProperty("--font-serif", `"${t.fonts.heading}", ${fontDef(t.fonts.heading)?.fallback ?? SERIF}`);
  s.setProperty("--font-sans", `"${t.fonts.body}", ${fontDef(t.fonts.body)?.fallback ?? SANS}`);
  s.setProperty("--heading-weight", String(t.fonts.headingWeight || 400));
  s.setProperty("--type-scale", String(t.fonts.headingScale || 1));
  s.setProperty("--body-scale", String(t.fonts.bodyScale || 1));
  s.setProperty("--heading-transform", t.fonts.headingUppercase ? "uppercase" : "none");

  const b = t.buttons;
  const [height, px, fs] = SIZES[b.size] ?? SIZES.md;
  s.setProperty("--btn-radius", SHAPES[b.shape] ?? "2px");
  s.setProperty("--btn-h", height);
  s.setProperty("--btn-px", px);
  s.setProperty("--btn-fs", fs);
  s.setProperty("--btn-weight", String(b.weight || 600));
  s.setProperty("--btn-tracking", `${b.uppercase ? b.tracking : Math.min(b.tracking, 0.04)}em`);
  s.setProperty("--btn-transform", b.uppercase ? "uppercase" : "none");
  s.setProperty("--btn-primary", b.primary || "var(--color-forest)");
  s.setProperty("--btn-primary-hover", b.primary ? `color-mix(in oklab, ${b.primary} 80%, black)` : "var(--color-forest-deep)");
  s.setProperty("--btn-primary-fg", b.primaryText || "var(--color-ivory)");
  s.setProperty("--btn-shadow", b.shadow ? "0 12px 26px -14px rgb(0 0 0 / 0.55)" : "none");

  s.setProperty("--container", `${t.layout.container || 1320}px`);
  s.setProperty("--space", String(t.layout.spacing ?? 1));
  s.setProperty("--img-radius", `${t.layout.imageRadius ?? 0}px`);
  root.classList.toggle("no-anim", !t.layout.animations);

  const href = fontHref([t.fonts.heading, t.fonts.body]);
  let link = document.getElementById("cms-fonts") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = "cms-fonts";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.getAttribute("href") !== href) link.setAttribute("href", href);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t.colors["espresso-deep"] || "#2a2019");
}

export const COLOR_LABELS: { key: ColorKey; label: string; help: string }[] = [
  { key: "ivory", label: "Background", help: "Main page background" },
  { key: "shell", label: "Soft surface", help: "Alternate section background" },
  { key: "sand", label: "Sand", help: "Image placeholders, hovers" },
  { key: "stone", label: "Stone", help: "Input borders, dividers" },
  { key: "line", label: "Lines", help: "Hairline borders" },
  { key: "ink", label: "Text", help: "Headings and body text" },
  { key: "muted", label: "Muted text", help: "Secondary paragraphs" },
  { key: "espresso", label: "Dark sections", help: "Espresso section background" },
  { key: "espresso-deep", label: "Deepest dark", help: "Footer, heroes, overlays" },
  { key: "forest", label: "Accent", help: "Primary buttons, eyebrows, icons" },
  { key: "forest-deep", label: "Accent dark", help: "Accent hover, forest sections" },
  { key: "bark", label: "Labels", help: "Small group labels" },
  { key: "clay", label: "Alerts", help: "Required marks and errors" },
];

export const PRESETS: { name: string; colors: Record<ColorKey, string> }[] = [
  {
    name: "Cayo Coco",
    colors: { ivory: "#fbf7f0", shell: "#f4ece0", sand: "#e8dac4", stone: "#cdbfa9", line: "#e3d7c5", ink: "#1f1a15", muted: "#5c5248", espresso: "#3e2f24", "espresso-deep": "#2a2019", forest: "#3d5a47", "forest-deep": "#2e4537", clay: "#9a4a2e", bark: "#4a2c0d" },
  },
  {
    name: "Lagoon",
    colors: { ivory: "#f8f8f4", shell: "#e9f0ec", sand: "#d7e3dc", stone: "#b7c7bf", line: "#d6e1db", ink: "#13201c", muted: "#4e5f58", espresso: "#1f3a36", "espresso-deep": "#132623", forest: "#2b7a6f", "forest-deep": "#1f5c53", clay: "#b0543a", bark: "#2f4f47" },
  },
  {
    name: "Sunset",
    colors: { ivory: "#fff8f1", shell: "#fbeadb", sand: "#f2d3b8", stone: "#dcb898", line: "#f0dcc8", ink: "#2a1710", muted: "#6b4f42", espresso: "#5a2e1d", "espresso-deep": "#3b1d12", forest: "#b4532d", "forest-deep": "#8f3f20", clay: "#a3321f", bark: "#7a3a1c" },
  },
  {
    name: "Jungle night",
    colors: { ivory: "#f5f3ec", shell: "#e6e6da", sand: "#d2d4c0", stone: "#b4b8a0", line: "#d9dacb", ink: "#171b14", muted: "#525849", espresso: "#263021", "espresso-deep": "#161c13", forest: "#5b7b4a", "forest-deep": "#45603a", clay: "#a1482c", bark: "#3d4a2a" },
  },
  {
    name: "Monochrome",
    colors: { ivory: "#fafafa", shell: "#f0f0ef", sand: "#e2e1df", stone: "#c6c4c0", line: "#e4e3e0", ink: "#141414", muted: "#55534f", espresso: "#262626", "espresso-deep": "#111111", forest: "#2b2b2b", "forest-deep": "#000000", clay: "#b23a24", bark: "#3a3a3a" },
  },
];
