export type ButtonVariant = "primary" | "dark" | "outline" | "light" | "outlineLight" | "text" | "textLight";
export type Tone = "ivory" | "shell" | "espresso" | "deep" | "forest";
export type Spacing = "normal" | "compact" | "flush";

/** src: bare file name → resort CDN · "idb:<id>" → uploaded on this device · http(s)/data URL → as-is */
export type ImageRef = { src: string; alt: string; w?: number; h?: number; pos?: string; caption?: string };

export type ButtonData = { label: string; url: string; variant?: ButtonVariant; icon?: string; newTab?: boolean };

export type SectionType =
  | "hero"
  | "pageHeader"
  | "split"
  | "info"
  | "steps"
  | "gallery"
  | "menu"
  | "banner"
  | "inquiry"
  | "faq"
  | "pricing"
  | "table"
  | "text"
  | "chapters"
  | "showcase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SectionData = Record<string, any>;

export type Section = {
  id: string;
  type: SectionType;
  hidden?: boolean;
  anchor?: string;
  tone?: Tone;
  spacing?: Spacing;
  data: SectionData;
};

export type Page = { id: string; slug: string; title: string; seoTitle: string; seoDescription: string; sections: Section[] };

export type NavLink = { label: string; url: string; description?: string; children?: NavLink[] };
export type SocialLink = { icon: string; label: string; url: string };
export type FooterColumn = { title: string; links: { label: string; url: string }[] };

export type SiteSettings = {
  name: string;
  fullName: string;
  tagline: string;
  email: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  whatsappMessage: string;
  address: string;
  bookingUrl: string;
  siteUrl: string;
  inquiryRooms: string[];
};

export type ColorKey =
  | "ivory"
  | "shell"
  | "sand"
  | "stone"
  | "line"
  | "ink"
  | "muted"
  | "espresso"
  | "espresso-deep"
  | "forest"
  | "forest-deep"
  | "clay"
  | "bark";

export type Theme = {
  colors: Record<ColorKey, string>;
  fonts: { heading: string; body: string; headingWeight: number; headingScale: number; bodyScale: number; headingUppercase: boolean };
  buttons: {
    shape: "square" | "soft" | "rounded" | "pill";
    uppercase: boolean;
    tracking: number;
    weight: number;
    size: "sm" | "md" | "lg";
    primary: string;
    primaryText: string;
    shadow: boolean;
  };
  layout: { container: number; spacing: number; imageRadius: number; animations: boolean };
};

export type HeaderSettings = {
  logo: ImageRef;
  showLogoImage: boolean;
  title: string;
  subtitle: string;
  nav: NavLink[];
  book: { show: boolean; label: string; url: string };
  transparentOnHero: boolean;
  announcement: { enabled: boolean; text: string; url: string };
};

export type FooterSettings = {
  about: string;
  showContactDetails: boolean;
  showSocial: boolean;
  contactForm: { show: boolean; title: string; text: string };
  newsletter: { show: boolean; title: string; text: string };
  columns: FooterColumn[];
  copyright: string;
  bottomLink: { label: string; url: string };
};

export type AgentConfig = {
  enabled: boolean;
  name: string;
  subtitle: string;
  greeting: string;
  launcherLabel: string;
  quickReplies: string[];
  persona: string;
  useSiteKnowledge: boolean;
  extraKnowledge: string;
  model: string;
  fallbacks: string[];
  temperature: number;
  maxTokens: number;
  proxyUrl: string;
  handoff: boolean;
  handoffLabel: string;
};

export type SiteContent = {
  version: number;
  updatedAt: string;
  site: SiteSettings;
  theme: Theme;
  header: HeaderSettings;
  footer: FooterSettings;
  social: SocialLink[];
  pages: Page[];
  agent: AgentConfig;
};
