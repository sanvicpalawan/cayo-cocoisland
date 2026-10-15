import { media } from "@/lib/media";
import type { SectionData, SectionType, Tone } from "./types";

/* ───────────── Field schema → drives every editor in the admin ───────────── */

export type Opt = { value: string; label: string };
export type FieldKind =
  | "heading" | "text" | "textarea" | "select" | "toggle" | "number" | "range" | "color"
  | "image" | "images" | "url" | "icon" | "strings" | "list" | "group";

export type Field = {
  kind: FieldKind;
  key: string;
  label: string;
  help?: string;
  placeholder?: string;
  rows?: number;
  options?: Opt[];
  num?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  fields?: Field[];
  itemTitle?: string;
  addLabel?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newItem?: () => any;
  captions?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  when?: (value: any) => boolean;
};

const f = (kind: FieldKind, key: string, label: string, extra: Partial<Field> = {}): Field => ({ kind, key, label, ...extra });
export const heading = (label: string) => f("heading", `_h_${label}`, label);
export const text = (key: string, label: string, extra?: Partial<Field>) => f("text", key, label, extra);
export const textarea = (key: string, label: string, rows = 3, extra?: Partial<Field>) => f("textarea", key, label, { rows, ...extra });
export const select = (key: string, label: string, options: Opt[], extra?: Partial<Field>) => f("select", key, label, { options, ...extra });
export const toggle = (key: string, label: string, extra?: Partial<Field>) => f("toggle", key, label, extra);
export const range = (key: string, label: string, min: number, max: number, step: number, unit = "", extra?: Partial<Field>) => f("range", key, label, { min, max, step, unit, ...extra });
export const number = (key: string, label: string, extra?: Partial<Field>) => f("number", key, label, extra);
export const color = (key: string, label: string, extra?: Partial<Field>) => f("color", key, label, extra);
export const image = (key: string, label: string, extra?: Partial<Field>) => f("image", key, label, extra);
export const images = (key: string, label: string, extra?: Partial<Field>) => f("images", key, label, extra);
export const url = (key: string, label: string, extra?: Partial<Field>) => f("url", key, label, extra);
export const icon = (key: string, label: string, extra?: Partial<Field>) => f("icon", key, label, extra);
export const strings = (key: string, label: string, extra?: Partial<Field>) => f("strings", key, label, extra);
export const group = (key: string, label: string, fields: Field[], extra?: Partial<Field>) => f("group", key, label, { fields, ...extra });
export const list = (key: string, label: string, fields: Field[], extra: Partial<Field> & { newItem: () => unknown }) =>
  f("list", key, label, { fields, ...extra });

const o = (value: string, label: string): Opt => ({ value, label });
export const MD_HELP = "Supports **bold**, *italic*, [link text](#/page) and blank lines between paragraphs. Start lines with “- ” for a bulleted list.";

export const VARIANTS: Opt[] = [
  o("primary", "Primary (accent colour)"),
  o("dark", "Dark"),
  o("outline", "Outline"),
  o("light", "Light — for dark backgrounds"),
  o("outlineLight", "Outline light — for dark backgrounds"),
  o("text", "Text link"),
  o("textLight", "Text link light — for dark backgrounds"),
];

export const BUTTON_FIELDS: Field[] = [
  text("label", "Label"),
  url("url", "Link"),
  select("variant", "Style", VARIANTS),
  icon("icon", "Icon (optional)"),
  toggle("newTab", "Always open in a new tab"),
];
export const buttons = (key = "buttons", label = "Buttons") =>
  list(key, label, BUTTON_FIELDS, { itemTitle: "label", addLabel: "Add button", newItem: () => ({ label: "New button", url: "#/", variant: "primary" }) });

const infoItems = (key = "items", label = "Info list", withIcon = false) =>
  list(key, label, [...(withIcon ? [icon("icon", "Icon")] : []), text("title", "Title"), textarea("text", "Text", 3, { help: MD_HELP })], {
    itemTitle: "title",
    addLabel: "Add item",
    newItem: () => ({ title: "New item", text: "Describe it here." }),
  });

export const ITEM_STYLES: Opt[] = [o("list", "Lines — hairline rows"), o("cards", "Cards — raised tiles"), o("numbered", "Numbered rows")];
export const RATIOS: Opt[] = [o("1 / 1", "Square"), o("4 / 5", "Portrait 4:5"), o("3 / 4", "Portrait 3:4"), o("2 / 3", "Tall 2:3"), o("3 / 2", "Landscape 3:2"), o("4 / 3", "Landscape 4:3"), o("16 / 9", "Wide 16:9")];
export const TONES: Opt[] = [o("ivory", "Ivory"), o("shell", "Sand"), o("espresso", "Espresso (dark)"), o("deep", "Deep espresso (dark)"), o("forest", "Forest (dark)")];
const SPACINGS: Opt[] = [o("normal", "Normal"), o("compact", "Compact"), o("flush", "No space above")];

export const COMMON_FIELDS: Field[] = [
  text("anchor", "Anchor ID", { help: "Lets buttons and menus jump here, e.g. #/cuisine?s=breakfast", placeholder: "e.g. breakfast" }),
  select("tone", "Background", TONES),
  select("spacing", "Spacing", SPACINGS),
];

export type SectionDef = {
  label: string;
  description: string;
  icon: string;
  dark?: boolean;
  defaultTone?: Tone;
  fields: Field[];
  create: () => SectionData;
};

const sideOpts = [o("left", "Left"), o("right", "Right")];

export const SECTION_TYPES: Record<SectionType, SectionDef> = {
  hero: {
    label: "Hero photo",
    description: "Full-width photograph with headline, intro, buttons and a highlights strip.",
    icon: "Sunrise",
    dark: true,
    fields: [
      image("image", "Background photo"),
      text("eyebrow", "Eyebrow"),
      textarea("title", "Headline", 2),
      textarea("lead", "Intro", 3),
      buttons(),
      select("size", "Height", [o("full", "Full screen"), o("large", "Large"), o("medium", "Medium")]),
      range("overlay", "Darken photo", 0, 90, 5, "%"),
      list("stats", "Highlights strip", [text("label", "Label"), text("value", "Text")], { itemTitle: "label", addLabel: "Add highlight", newItem: () => ({ label: "Label", value: "Text" }) }),
    ],
    create: () => ({ image: media.lagoonAerial, eyebrow: "Cayo Coco", title: "A new headline", lead: "A short introduction to this page.", buttons: [{ label: "Book Now", url: "{booking}", variant: "light" }], size: "large", overlay: 45, stats: [] }),
  },
  pageHeader: {
    label: "Page title",
    description: "Text-led page header for practical pages, with buttons.",
    icon: "Quote",
    defaultTone: "shell",
    fields: [text("eyebrow", "Eyebrow"), textarea("title", "Title", 2), textarea("lead", "Intro", 3), buttons()],
    create: () => ({ eyebrow: "Eyebrow", title: "Page title", lead: "A short introduction.", buttons: [] }),
  },
  split: {
    label: "Image & text",
    description: "Editorial photo composition (single, pair, overlap, grid, video or map) beside text, lists and buttons.",
    icon: "Images",
    fields: [
      heading("Text"),
      text("eyebrow", "Eyebrow"),
      textarea("title", "Title", 2),
      textarea("lead", "Lead paragraph", 3),
      textarea("body", "Body text", 4, { help: MD_HELP }),
      textarea("note", "Highlight note", 2, { help: MD_HELP }),
      infoItems(),
      select("itemStyle", "Info list style", ITEM_STYLES, { when: (d) => (d.items?.length ?? 0) > 0 }),
      text("featuresTitle", "Checklist title"),
      strings("features", "Checklist", { addLabel: "Add line" }),
      list("links", "Arrow links", [text("label", "Label"), text("note", "Note"), url("url", "Link")], { itemTitle: "label", addLabel: "Add link", newItem: () => ({ label: "Link", note: "", url: "#/" }) }),
      buttons(),
      heading("Media"),
      select("mediaLayout", "Media layout", [o("single", "Single photo"), o("pair", "Two photos"), o("overlap", "Overlapping photos"), o("grid", "Photo grid with lightbox"), o("video", "YouTube video"), o("map", "Google map"), o("none", "No media")]),
      images("images", "Photos", { when: (d) => !["video", "map", "none"].includes(d.mediaLayout) }),
      text("caption", "Caption", { when: (d) => ["single", "pair"].includes(d.mediaLayout) }),
      select("ratio", "Photo shape", RATIOS, { when: (d) => ["single", "grid"].includes(d.mediaLayout) }),
      select("gridColumns", "Grid columns", [o("2", "2"), o("3", "3")], { num: true, when: (d) => d.mediaLayout === "grid" }),
      text("videoId", "YouTube video ID", { when: (d) => d.mediaLayout === "video", help: "The part after watch?v= in the YouTube link" }),
      text("videoTitle", "Video title", { when: (d) => d.mediaLayout === "video" }),
      text("mapQuery", "Map location", { when: (d) => d.mediaLayout === "map", help: "Anything you would type into Google Maps" }),
      text("mapCaption", "Map caption", { when: (d) => d.mediaLayout === "map" }),
      select("imagePosition", "Media position", sideOpts),
      select("mediaWidth", "Media width", [o("wide", "Wide (7/12)"), o("half", "Half (6/12)")]),
      select("align", "Vertical alignment", [o("center", "Centered"), o("start", "Top")]),
    ],
    create: () => ({ eyebrow: "Eyebrow", title: "A new section", lead: "Tell your guests something wonderful.", body: "", buttons: [], mediaLayout: "single", images: [media.beachAerial], ratio: "4 / 5", imagePosition: "right", mediaWidth: "wide", align: "center" }),
  },
  info: {
    label: "Info grid",
    description: "Heading with grouped information — inclusions, values, notes. Optional icons and cards.",
    icon: "ListChecks",
    fields: [
      text("eyebrow", "Eyebrow"),
      textarea("title", "Title", 2),
      textarea("intro", "Intro", 3),
      buttons(),
      list("groups", "Groups", [text("title", "Group label"), infoItems("items", "Items", true)], { itemTitle: "title", addLabel: "Add group", newItem: () => ({ title: "", items: [{ title: "New item", text: "" }] }) }),
      select("layout", "Layout", [o("side", "Heading left, items right"), o("stacked", "Heading above items")]),
      select("columns", "Columns", [o("1", "1"), o("2", "2"), o("3", "3"), o("4", "4")], { num: true }),
      select("style", "Item style", ITEM_STYLES),
      toggle("sticky", "Keep heading in view while scrolling", { when: (d) => d.layout !== "stacked" }),
      image("image", "Photo under heading (optional)", { when: (d) => d.layout !== "stacked" }),
    ],
    create: () => ({ eyebrow: "Eyebrow", title: "Good to know", intro: "", buttons: [], groups: [{ title: "", items: [{ title: "First item", text: "Details" }, { title: "Second item", text: "Details" }] }], layout: "side", columns: 2, style: "list", sticky: false }),
  },
  steps: {
    label: "Journey & maps",
    description: "Numbered steps, key facts, Google maps and contact buttons — ideal for directions.",
    icon: "Route",
    fields: [
      text("eyebrow", "Eyebrow"),
      textarea("title", "Title", 2),
      textarea("lead", "Intro", 3),
      list("steps", "Steps", [text("title", "Title"), textarea("text", "Text", 3)], { itemTitle: "title", addLabel: "Add step", newItem: () => ({ title: "Step", text: "" }) }),
      list("facts", "Key facts", [icon("icon", "Icon"), text("title", "Title"), textarea("text", "Text", 2)], { itemTitle: "title", addLabel: "Add fact", newItem: () => ({ icon: "Clock", title: "Fact", text: "" }) }),
      list("maps", "Maps", [text("query", "Location (Google Maps search)"), text("caption", "Caption")], { itemTitle: "caption", addLabel: "Add map", newItem: () => ({ query: "Cayo Coco Island Glamping", caption: "Cayo Coco" }) }),
      toggle("contactBox", "Show WhatsApp & email box"),
      text("contactText", "Contact box text", { when: (d) => d.contactBox }),
      text("contactMessage", "Pre-filled WhatsApp message", { when: (d) => d.contactBox }),
      buttons(),
      select("layout", "Layout", [o("side", "Map beside text"), o("stacked", "Everything stacked")]),
    ],
    create: () => ({ eyebrow: "Getting here", title: "How to get here", lead: "", steps: [{ title: "First step", text: "" }], facts: [], maps: [{ query: "Cayo Coco Island Glamping", caption: "Cayo Coco, Linapacan" }], contactBox: true, contactText: "Arrange your transfer directly with our team:", contactMessage: "Hello! I'd like to arrange my transfer to Cayo Coco.", buttons: [], layout: "side" }),
  },
  gallery: {
    label: "Photo gallery",
    description: "Responsive grid with lightbox. Can show your live Instagram feed when configured.",
    icon: "LayoutGrid",
    fields: [
      text("eyebrow", "Eyebrow"),
      textarea("title", "Title", 2),
      textarea("intro", "Intro", 2),
      buttons(),
      images("images", "Photos"),
      select("columns", "Columns", [o("2", "2"), o("3", "3"), o("4", "4")], { num: true }),
      select("ratio", "Photo shape", RATIOS),
      toggle("compact", "Compact heading"),
      toggle("instagram", "Use live Instagram feed when available", { help: "Requires VITE_INSTAGRAM_FEED_URL at build time; these photos are the fallback." }),
    ],
    create: () => ({ eyebrow: "", title: "Gallery", intro: "", buttons: [], images: [media.friends, media.coupleCocktails, media.bonfire], columns: 3, ratio: "1 / 1", compact: false, instagram: false }),
  },
  menu: {
    label: "Menu card",
    description: "Elegant, legible menu card with optional hand-drawn illustrations and prices.",
    icon: "UtensilsCrossed",
    defaultTone: "shell",
    fields: [
      text("eyebrow", "Eyebrow"),
      textarea("title", "Title", 2),
      textarea("intro", "Intro", 3),
      text("cardEyebrow", "Card eyebrow"),
      text("cardTitle", "Card title"),
      text("cardSubtitle", "Card subtitle"),
      list("items", "Dishes", [text("name", "Name"), textarea("text", "Description", 2), text("price", "Price (optional)")], { itemTitle: "name", addLabel: "Add dish", newItem: () => ({ name: "New dish", text: "" }) }),
      toggle("illustrations", "Show hand-drawn illustrations"),
      image("menuImage", "Original menu image (optional)"),
      text("menuImageCaption", "Menu image caption"),
    ],
    create: () => ({ eyebrow: "Menu", title: "Our menu", intro: "", cardEyebrow: "The Kingfisher Restaurant", cardTitle: "Menu", cardSubtitle: "", items: [{ name: "Dish", text: "Description" }], illustrations: true }),
  },
  banner: {
    label: "Full-width banner",
    description: "Immersive photo with text and buttons — for signature experiences or a closing call to action.",
    icon: "Megaphone",
    dark: true,
    fields: [
      image("image", "Background photo"),
      text("eyebrow", "Eyebrow"),
      textarea("title", "Title", 2),
      textarea("body", "Text", 3, { help: MD_HELP }),
      textarea("note", "Small print", 2, { help: MD_HELP }),
      buttons(),
      select("align", "Text position", [o("left", "Left"), o("center", "Centered")]),
      select("size", "Height", [o("large", "Large"), o("medium", "Medium")]),
      range("overlay", "Darken photo", 0, 95, 5, "%"),
    ],
    create: () => ({ image: media.beachDinnerSea, eyebrow: "Cayo Coco", title: "Ready to start your island adventure?", body: "", note: "", buttons: [{ label: "Book Now", url: "{booking}", variant: "light" }], align: "center", size: "medium", overlay: 65 }),
  },
  inquiry: {
    label: "Inquiry form",
    description: "Booking inquiry form with dates and room types, beside a photo or your contact details.",
    icon: "Mail",
    defaultTone: "shell",
    fields: [
      text("eyebrow", "Eyebrow"),
      textarea("title", "Title", 2),
      textarea("intro", "Intro", 3),
      select("variant", "Side panel", [o("image", "Photo and booking link"), o("details", "Contact details")]),
      image("image", "Photo", { when: (d) => d.variant !== "details" }),
      text("asideEyebrow", "Contact eyebrow", { when: (d) => d.variant === "details" }),
      text("asideTitle", "Contact title", { when: (d) => d.variant === "details" }),
      text("bookTitle", "Booking box title", { when: (d) => d.variant === "details" }),
      textarea("bookText", "Booking box text", 2, { when: (d) => d.variant === "details" }),
    ],
    create: () => ({ eyebrow: "Plan your stay", title: "You're interested in staying with us? That's amazing — let's get in touch!", intro: "Send us your dates and preferred accommodation, and we will make sure to find availability for you.", variant: "image", image: media.beachAerial }),
  },
  faq: {
    label: "FAQ",
    description: "Expandable questions in groups, with a closing call to action.",
    icon: "MessageCircle",
    fields: [
      text("eyebrow", "Eyebrow"),
      textarea("title", "Title", 2),
      list("groups", "Groups", [
        text("title", "Group title"),
        list("items", "Questions", [text("q", "Question"), textarea("a", "Answer", 4, { help: MD_HELP })], { itemTitle: "q", addLabel: "Add question", newItem: () => ({ q: "New question?", a: "Answer." }) }),
      ], { itemTitle: "title", addLabel: "Add group", newItem: () => ({ title: "Questions", items: [] }) }),
      text("ctaTitle", "Closing box title"),
      textarea("ctaText", "Closing box text", 2),
      buttons(),
    ],
    create: () => ({ eyebrow: "", title: "Questions", groups: [{ title: "General", items: [{ q: "A question?", a: "An answer." }] }], ctaTitle: "", ctaText: "", buttons: [] }),
  },
  pricing: {
    label: "Price list",
    description: "Groups of priced options with inclusions, plus notes.",
    icon: "Banknote",
    fields: [
      text("eyebrow", "Eyebrow"),
      textarea("title", "Title", 2),
      text("aside", "Note beside title"),
      list("groups", "Groups", [
        text("title", "Group title"),
        list("rows", "Options", [text("name", "Name"), text("price", "Price"), textarea("text", "Includes", 2)], { itemTitle: "name", addLabel: "Add option", newItem: () => ({ name: "Option", price: "", text: "" }) }),
      ], { itemTitle: "title", addLabel: "Add group", newItem: () => ({ title: "Group", rows: [] }) }),
      infoItems("items", "Notes"),
      toggle("divider", "Line above"),
    ],
    create: () => ({ eyebrow: "", title: "Prices", aside: "", groups: [{ title: "Options", rows: [{ name: "Option", price: "", text: "" }] }], items: [], divider: false }),
  },
  table: {
    label: "Comparison table",
    description: "Compare options side by side. A real table on desktop, one tidy card per row on mobile.",
    icon: "Table",
    fields: [
      text("eyebrow", "Eyebrow"),
      textarea("title", "Title", 2),
      textarea("intro", "Intro", 3),
      strings("columns", "Column headings", { addLabel: "Add column", help: "The first heading labels the rows (e.g. “Room”), the rest are what you compare." }),
      list("rows", "Rows", [strings("cells", "Cells", { addLabel: "Add cell", help: "One cell per column, in the same order. Write “yes” or “no” to show a tick or a dash." })], {
        itemTitle: "cells",
        addLabel: "Add row",
        newItem: () => ({ cells: ["New row", "", ""] }),
      }),
      textarea("note", "Note below the table", 2, { help: MD_HELP }),
      buttons(),
    ],
    create: () => ({
      eyebrow: "",
      title: "Compare your options",
      intro: "",
      columns: ["Option", "Detail", "Detail"],
      rows: [
        { cells: ["First option", "yes", "—"] },
        { cells: ["Second option", "yes", "yes"] },
      ],
      note: "",
      buttons: [],
    }),
  },
  text: {
    label: "Text",
    description: "A statement (title beside text) or a long article such as policies.",
    icon: "FileText",
    fields: [
      select("layout", "Layout", [o("statement", "Statement — title beside text"), o("article", "Article — readable column")]),
      text("eyebrow", "Eyebrow"),
      textarea("title", "Title", 2),
      text("subtitle", "Subtitle"),
      textarea("body", "Text", 5, { help: MD_HELP }),
      list("blocks", "Article blocks", [text("heading", "Heading"), textarea("body", "Text", 6, { help: MD_HELP })], { itemTitle: "heading", addLabel: "Add block", newItem: () => ({ heading: "Heading", body: "" }) }),
    ],
    create: () => ({ layout: "statement", title: "A statement", body: "Write something here.", blocks: [] }),
  },
  chapters: {
    label: "In-page menu",
    description: "A row of links that jump to sections on this page.",
    icon: "Hash",
    fields: [list("items", "Links", [text("label", "Label"), text("anchor", "Section anchor ID")], { itemTitle: "label", addLabel: "Add link", newItem: () => ({ label: "Section", anchor: "" }) })],
    create: () => ({ items: [] }),
  },
  showcase: {
    label: "Showcase",
    description: "Statement, short lists and a row of captioned photos — great on a dark background.",
    icon: "Sparkles",
    defaultTone: "forest",
    fields: [
      text("eyebrow", "Eyebrow"),
      textarea("title", "Title", 2),
      textarea("lead", "Intro", 3),
      list("lists", "Lists", [text("title", "Title"), strings("items", "Lines")], { itemTitle: "title", addLabel: "Add list", newItem: () => ({ title: "List", items: [] }) }),
      images("images", "Photos (add captions)", { captions: true }),
      buttons(),
    ],
    create: () => ({ eyebrow: "Activities", title: "A new showcase", lead: "", lists: [], images: [media.islandHopping, media.scuba, media.lagoonSwim], buttons: [] }),
  },
};

/* ───────────── Global settings schemas ───────────── */

const navChild = [text("label", "Label"), url("url", "Link"), text("description", "Short description")];
export const HEADER_FIELDS: Field[] = [
  heading("Logo"),
  image("logo", "Logo image"),
  toggle("showLogoImage", "Show logo image"),
  text("title", "Name"),
  text("subtitle", "Line under the name"),
  heading("Navigation"),
  list("nav", "Menu items", [text("label", "Label"), url("url", "Link", { help: "Leave empty when this item opens a drop-down." }), list("children", "Drop-down items", navChild, { itemTitle: "label", addLabel: "Add drop-down item", newItem: () => ({ label: "Page", url: "#/" }) })], {
    itemTitle: "label",
    addLabel: "Add menu item",
    newItem: () => ({ label: "New item", url: "#/" }),
  }),
  heading("Book button"),
  group("book", "Book button", [toggle("show", "Show"), text("label", "Label"), url("url", "Link")]),
  heading("Behaviour"),
  toggle("transparentOnHero", "Transparent header over hero photos"),
  heading("Announcement bar"),
  group("announcement", "Announcement", [toggle("enabled", "Show announcement bar"), text("text", "Text"), url("url", "Link (optional)")]),
];

export const FOOTER_FIELDS: Field[] = [
  textarea("about", "About text", 3),
  toggle("showContactDetails", "Show email, WhatsApp and address"),
  toggle("showSocial", "Show social icons"),
  group("contactForm", "Contact form", [toggle("show", "Show contact form"), text("title", "Title"), textarea("text", "Text", 2)]),
  group("newsletter", "Newsletter", [toggle("show", "Show newsletter sign-up"), text("title", "Title"), textarea("text", "Text", 2)]),
  list("columns", "Link columns", [text("title", "Column title"), list("links", "Links", [text("label", "Label"), url("url", "Link")], { itemTitle: "label", addLabel: "Add link", newItem: () => ({ label: "Link", url: "#/" }) })], {
    itemTitle: "title",
    addLabel: "Add column",
    newItem: () => ({ title: "Column", links: [] }),
  }),
  text("copyright", "Copyright line", { help: "{year} is replaced with the current year" }),
  group("bottomLink", "Bottom link", [text("label", "Label"), url("url", "Link")]),
];

export const SITE_FIELDS: Field[] = [
  heading("Resort"),
  text("name", "Short name"),
  text("fullName", "Full name"),
  text("tagline", "Tagline"),
  text("siteUrl", "Website address", { help: "Used for sharing and by the AI agent" }),
  heading("Contact"),
  text("email", "Enquiries email"),
  text("whatsappNumber", "WhatsApp number (digits with country code)", { placeholder: "639569127483" }),
  text("whatsappDisplay", "WhatsApp number as displayed"),
  textarea("whatsappMessage", "Default WhatsApp message", 2),
  textarea("address", "Address", 2),
  heading("Booking"),
  text("bookingUrl", "Booking engine link", { help: "Used by every {booking} button" }),
  strings("inquiryRooms", "Room options in the inquiry form", { addLabel: "Add room option" }),
];

export const SOCIAL_FIELD: Field = list("social", "Social media icons", [icon("icon", "Icon"), text("label", "Name"), url("url", "Link")], {
  itemTitle: "label",
  addLabel: "Add social link",
  newItem: () => ({ icon: "brand:instagram", label: "Instagram", url: "https://instagram.com/" }),
});
