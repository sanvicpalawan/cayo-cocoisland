import { media } from "@/lib/media";
import { defaultPages } from "./pages";
import { PRESETS } from "./theme";
import type { AgentConfig, FooterSettings, HeaderSettings, SiteContent, SiteSettings, SocialLink, Theme } from "./types";

export const CONTENT_VERSION = 1;

export const DEFAULT_SITE: SiteSettings = {
  name: "Cayo Coco",
  fullName: "Cayo Coco Island Glamping",
  tagline: "Escape, relax, breathe",
  email: "hello@cayococoisland.com",
  whatsappNumber: "639569127483",
  whatsappDisplay: "+63 956 912 7483",
  whatsappMessage: "Hello Cayo Coco! I have a question about staying with you.",
  address: "Barangonan, Linapacan, Palawan, Philippines 5314",
  bookingUrl: "https://beds24.com/booking2.php?propid=278569",
  siteUrl: "https://cayococoisland.com",
  inquiryRooms: [
    "Mango Bungalow – Large double bed and shared bathroom",
    "Coconut Cottage – King bed and shared bathroom",
    "Coconut Cottage – King bed and private bathroom",
    "Ocean Suite – King bed and private bathroom",
  ],
};

export const DEFAULT_THEME: Theme = {
  colors: { ...PRESETS[0].colors },
  fonts: { heading: "Newsreader", body: "Hanken Grotesk", headingWeight: 400, headingScale: 1, bodyScale: 1, headingUppercase: false },
  buttons: { shape: "square", uppercase: true, tracking: 0.14, weight: 600, size: "md", primary: "", primaryText: "", shadow: false },
  layout: { container: 1320, spacing: 1, imageRadius: 0, animations: true },
};

export const DEFAULT_HEADER: HeaderSettings = {
  logo: media.logo,
  showLogoImage: true,
  title: "Cayo Coco",
  subtitle: "Island Glamping",
  nav: [
    { label: "The Experience", url: "#/" },
    { label: "Accommodation", url: "#/accommodations" },
    { label: "Cuisine", url: "#/cuisine" },
    {
      label: "The Island",
      url: "",
      children: [
        { label: "Island Experience", url: "#/the-island", description: "What's included and how to get here" },
        { label: "Activities", url: "#/activities", description: "The reef, island hopping and bonfires" },
      ],
    },
    {
      label: "About & FAQs",
      url: "",
      children: [
        { label: "About us", url: "#/about-us-and-faqs", description: "All that we stand for" },
        { label: "FAQs", url: "#/faqs-guests", description: "Bookings, payments and transfers" },
        { label: "Terms & privacy", url: "#/privacy-policy-and-terms-and-conditions" },
      ],
    },
    { label: "Contact & Travel", url: "#/contact-and-travel" },
  ],
  book: { show: true, label: "Book Now", url: "{booking}" },
  transparentOnHero: true,
  announcement: { enabled: false, text: "", url: "" },
};

export const DEFAULT_FOOTER: FooterSettings = {
  about: "A retreat from the crowds and a place for nature lovers — on Barangonan Island, Linapacan, between El Nido and Coron.",
  showContactDetails: true,
  showSocial: true,
  contactForm: { show: true, title: "Contact us", text: "Questions about your stay, transfers or special requests? Send us a message and we'll reply by email." },
  newsletter: { show: true, title: "Subscribe to our newsletter", text: "News and updates from the island, straight to your inbox." },
  columns: [
    { title: "Stay", links: [{ label: "The Experience", url: "#/" }, { label: "Accommodation", url: "#/accommodations" }, { label: "Cuisine & Misty's Bar", url: "#/cuisine" }] },
    { title: "Discover", links: [{ label: "Island Experience", url: "#/the-island" }, { label: "Activities", url: "#/activities" }, { label: "About us", url: "#/about-us-and-faqs" }] },
    { title: "Plan", links: [{ label: "Contact & Travel", url: "#/contact-and-travel" }, { label: "FAQs", url: "#/faqs-guests" }, { label: "Terms & privacy", url: "#/privacy-policy-and-terms-and-conditions" }] },
  ],
  copyright: "© {year} Cayo Coco Island Glamping · Linapacan, Palawan, Philippines",
  bottomLink: { label: "Check availability & book online", url: "{booking}" },
};

export const DEFAULT_SOCIAL: SocialLink[] = [
  { icon: "brand:facebook", label: "Facebook", url: "https://www.facebook.com/cayococoresort" },
  { icon: "brand:instagram", label: "Instagram", url: "https://www.instagram.com/islandcayococo/" },
  { icon: "brand:whatsapp", label: "WhatsApp", url: "{whatsapp}" },
];

export const DEFAULT_PERSONA = `You are {name}, the friendly WhatsApp concierge for {fullName}, an eco island glamping retreat on Barangonan Island, Linapacan, Palawan, Philippines.

How to reply:
- Write like a warm, helpful host chatting on WhatsApp: short paragraphs, plain text, no tables or headings. Keep replies under 120 words unless the guest asks for more detail. Use at most one emoji.
- Always reply in the language the guest writes in.
- Only use facts from the RESORT KNOWLEDGE below. If something isn't covered — such as availability, prices that aren't listed, or special arrangements — say you'll check with the team and share WhatsApp {whatsapp} or email {email}.
- Never invent prices, availability, schedules, policies or facilities. Never confirm, change or cancel a booking yourself: guests can book at {bookingUrl} or message the team.
- On the day of travel (missed transfer, delays or weather), tell the guest to message the team on WhatsApp straight away.`;

export const DEFAULT_AGENT: AgentConfig = {
  enabled: true,
  name: "Coco",
  subtitle: "Cayo Coco concierge · AI assistant",
  greeting: "Hi! 👋 I'm Coco, the Cayo Coco concierge. Ask me anything about the island, our rooms, food or how to get here.",
  launcherLabel: "Chat with us",
  quickReplies: ["How do I get to the island?", "What's included in my stay?", "Which rooms do you have?", "Can we book a dinner on the beach?"],
  persona: DEFAULT_PERSONA,
  useSiteKnowledge: true,
  extraKnowledge: "",
  model: "openrouter/free",
  fallbacks: ["google/gemma-4-31b-it:free", "nvidia/nemotron-3-super-120b-a12b:free"],
  temperature: 0.4,
  maxTokens: 500,
  proxyUrl: "",
  handoff: true,
  handoffLabel: "Continue on WhatsApp",
};

export function defaultContent(): SiteContent {
  return structuredClone({
    version: CONTENT_VERSION,
    updatedAt: new Date(0).toISOString(),
    site: DEFAULT_SITE,
    theme: DEFAULT_THEME,
    header: DEFAULT_HEADER,
    footer: DEFAULT_FOOTER,
    social: DEFAULT_SOCIAL,
    pages: defaultPages(),
    agent: DEFAULT_AGENT,
  });
}
