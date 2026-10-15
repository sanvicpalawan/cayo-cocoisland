import type { SVGProps } from "react";
import {
  Anchor, Apple, ArrowRight, ArrowUpRight, Award, Baby, BadgeCheck, Banknote, Bath, BatteryCharging, Bed, BedDouble, Beer, Bike, Bird,
  Bus, CakeSlice, Calendar, CalendarCheck, Camera, Car, Check, ChefHat, Cherry, CircleCheck, Citrus, Clock, Clock3, CloudSun, Coffee,
  Compass, CreditCard, Croissant, CupSoda, DoorOpen, Download, Droplets, Dumbbell, ExternalLink, Fan, Fish, Flame, Flower2, Footprints,
  Gamepad2, Gem, Gift, GlassWater, Globe, HandHeart, Headset, Heart, Hotel, House, IceCreamCone, Info, Kayak, Key, Leaf, LifeBuoy,
  Link as LinkIcon, Mail, Map as MapIcon, MapPin, MapPinned, Martini, Megaphone, MessageCircle, Moon, Mountain, Music, Navigation,
  Phone, Plane, Play, Quote, Route, Sailboat, Salad, Send, Share2, Shell, Ship, ShipWheel, ShieldCheck, ShoppingBag, ShowerHead,
  Smartphone, Smile, Snowflake, Soup, Sparkles, Star, Store, Sun, Sunrise, Sunset, Tent, Ticket, TreePalm, Turtle, Tv, Umbrella,
  User, Users, Utensils, UtensilsCrossed, Volleyball, Wallet, Waves, Wifi, Wind, Wine, Zap,
  // Editor / section icons
  FileText, Hash, Images, LayoutGrid, ListChecks, Rows3, Table, type LucideIcon,
} from "lucide-react";

type SvgProps = SVGProps<SVGSVGElement>;

/* Brand marks (Lucide no longer ships brand logos). */
const BRAND: Record<string, (p: SvgProps) => React.JSX.Element> = {
  "brand:whatsapp": (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.23 8.23 0 0 1 8.24 8.24c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.02 2.57.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.29Z" />
    </svg>
  ),
  "brand:instagram": (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".7" fill="currentColor" />
    </svg>
  ),
  "brand:facebook": (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.87.25-1.46 1.5-1.46h1.6V4.46A21 21 0 0 0 14.27 4.3c-2.3 0-3.87 1.4-3.87 3.97v2.23H7.8v3h2.6V21h3.1Z" />
    </svg>
  ),
  "brand:tiktok": (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .75-5.07V9.68a5.68 5.68 0 0 0-.75-.05 5.73 5.73 0 1 0 5.73 5.73V9.01a7.35 7.35 0 0 0 4.29 1.37V7.29a4.28 4.28 0 0 1-3.28-1.47Z" />
    </svg>
  ),
  "brand:youtube": (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
    </svg>
  ),
  "brand:x": (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.49h2.04L6.49 3.24H4.3l13.31 17.4Z" />
    </svg>
  ),
  "brand:linkedin": (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  ),
};

const LUCIDE: Record<string, LucideIcon> = {
  Mail, Phone, MessageCircle, Send, Globe, Link: LinkIcon, Share2, Smartphone, Headset, Megaphone,
  MapPin, MapPinned, Map: MapIcon, Navigation, Compass, Route, Plane, Car, Bus, Ship, Sailboat, Anchor, Clock, Clock3, Calendar, CalendarCheck, Ticket, Footprints,
  TreePalm, Waves, Sun, Sunrise, Sunset, Moon, Star, Mountain, Leaf, Flower2, Shell, Fish, Turtle, Bird, Wind, Droplets, CloudSun, Umbrella, Flame, Tent,
  Bed, BedDouble, Bath, ShowerHead, Fan, Snowflake, Wifi, Zap, BatteryCharging, Key, DoorOpen, House, Hotel, Tv,
  Utensils, UtensilsCrossed, ChefHat, Coffee, Wine, Martini, Beer, GlassWater, CupSoda, Soup, Salad, Croissant, CakeSlice, IceCreamCone, Apple, Citrus, Cherry,
  Kayak, Volleyball, Bike, Dumbbell, Gamepad2, Trophy: Award, Camera, Music, LifeBuoy, ShipWheel,
  Check, CircleCheck, BadgeCheck, ShieldCheck, Info, Heart, Sparkles, Gift, Award, Users, User, Baby, HandHeart, Smile, Store, ShoppingBag, CreditCard, Wallet, Banknote, Gem, Quote,
  ArrowRight, ArrowUpRight, ExternalLink, Download, Play,
  FileText, Hash, Images, LayoutGrid, ListChecks, Rows3, Table,
};

export const ICON_GROUPS: { label: string; names: string[] }[] = [
  { label: "Social", names: Object.keys(BRAND) },
  { label: "Contact", names: ["Mail", "Phone", "MessageCircle", "Send", "Globe", "Link", "Share2", "Smartphone", "Headset", "Megaphone"] },
  { label: "Travel", names: ["MapPin", "MapPinned", "Map", "Navigation", "Compass", "Route", "Plane", "Car", "Bus", "Ship", "Sailboat", "Anchor", "Clock", "Clock3", "Calendar", "CalendarCheck", "Ticket", "Footprints"] },
  { label: "Island", names: ["TreePalm", "Waves", "Sun", "Sunrise", "Sunset", "Moon", "Star", "Mountain", "Leaf", "Flower2", "Shell", "Fish", "Turtle", "Bird", "Wind", "Droplets", "CloudSun", "Umbrella", "Flame", "Tent"] },
  { label: "Stay", names: ["Bed", "BedDouble", "Bath", "ShowerHead", "Fan", "Snowflake", "Wifi", "Zap", "BatteryCharging", "Key", "DoorOpen", "House", "Hotel", "Tv"] },
  { label: "Food & drink", names: ["Utensils", "UtensilsCrossed", "ChefHat", "Coffee", "Wine", "Martini", "Beer", "GlassWater", "CupSoda", "Soup", "Salad", "Croissant", "CakeSlice", "IceCreamCone", "Apple", "Citrus", "Cherry"] },
  { label: "Activities", names: ["Kayak", "Volleyball", "Bike", "Dumbbell", "Gamepad2", "Camera", "Music", "LifeBuoy", "ShipWheel"] },
  { label: "General", names: ["Check", "CircleCheck", "BadgeCheck", "ShieldCheck", "Info", "Heart", "Sparkles", "Gift", "Award", "Users", "User", "Baby", "HandHeart", "Smile", "Store", "ShoppingBag", "CreditCard", "Wallet", "Banknote", "Gem", "Quote", "ArrowRight", "ArrowUpRight", "ExternalLink", "Download", "Play"] },
];

export const iconLabel = (name: string) => name.replace(/^brand:/, "").replace(/([a-z])([A-Z0-9])/g, "$1 $2").replace(/^\w/, (c) => c.toUpperCase());

export function Icon({ name, className, strokeWidth = 1.6 }: { name?: string; className?: string; strokeWidth?: number }) {
  if (!name) return null;
  const Brand = BRAND[name];
  if (Brand) return <Brand className={className} aria-hidden="true" />;
  const L = LUCIDE[name];
  return L ? <L className={className} strokeWidth={strokeWidth} aria-hidden="true" /> : null;
}
