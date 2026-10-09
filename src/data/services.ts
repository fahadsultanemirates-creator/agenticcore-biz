import {
  BarChart3,
  Bot,
  FlaskConical,
  LineChart,
  Mail,
  MessageSquare,
  Megaphone,
  PenLine,
  Phone,
  Search,
  Star,
  Target,
  Video,
  type LucideIcon,
} from "lucide-react";

/**
 * A price that is a RANGE, not a number.
 *
 * This is the whole reason .biz works differently from .click and
 * .agency. There, a service has one price, so an invoice can be issued
 * the moment somebody picks it and a chain watcher can settle it. Here a
 * chatbot is $209-$419 depending on what it has to do, and nobody can say
 * which end of that until they have seen the business. So the published
 * figure is an honest range and the real number comes out of the
 * discovery call -- which is also what the landing page promises.
 */
export type Price = {
  /** One-off, or the setup half of setup-plus-monthly. */
  lowUsd: number;
  highUsd: number;
  /** What the one-off figure is FOR: "setup", "per page", "per video". */
  unit: string;
  /** The recurring half, where a service has one. */
  monthlyLowUsd?: number;
  monthlyHighUsd?: number;
  /** The other way to buy it, where there is one. */
  alternative?: string;
};

export type Service = {
  name: string;
  icon: LucideIcon;
  price: Price;
  /** What it actually does, in a line. */
  detail: string;
};

export type ServiceCategory = {
  id: string;
  label: string;
  tagline: string;
  icon: LucideIcon;
  services: Service[];
};

/**
 * The real price sheet, ported from public/pricing-catalog.js.
 *
 * Kept as code rather than a table for the same reason as the other two
 * sites: pricing is a display concern, and putting it in the database
 * would mean a migration every time a number moves. The legacy pages
 * still read the .js copy, so the two have to agree until those pages go.
 *
 * À la carte only. There are no bundles here and there never were.
 */
export const serviceCategories: ServiceCategory[] = [
  {
    id: "engagement",
    label: "Customer Engagement & Support",
    tagline: "Answer every enquiry, day or night.",
    icon: MessageSquare,
    services: [
      {
        name: "AI Chatbot / Website Assistant",
        icon: Bot,
        detail: "Trained on your business, answering on your site instead of a contact form.",
        price: { lowUsd: 209, highUsd: 419, unit: "setup", monthlyLowUsd: 104, monthlyHighUsd: 209 },
      },
      {
        name: "AI Voice Agent (Phone Answering)",
        icon: Phone,
        detail: "Picks up when you cannot, takes the details, books the callback.",
        price: { lowUsd: 209, highUsd: 209, unit: "setup", monthlyLowUsd: 139, monthlyHighUsd: 279 },
      },
      {
        name: "AI Reputation & Review Management",
        icon: Star,
        detail: "Reviews watched and answered, so the bad one is not the newest one.",
        price: { lowUsd: 209, highUsd: 319, unit: "per month" },
      },
    ],
  },
  {
    id: "content",
    label: "Content, Social & Video",
    tagline: "Everything that gets posted, written and shot.",
    icon: PenLine,
    services: [
      {
        name: "AI Social Media Management",
        icon: Megaphone,
        detail: "Planned, written, scheduled and posted — not a content calendar you fill in.",
        price: { lowUsd: 279, highUsd: 559, unit: "per month" },
      },
      {
        name: "AI SEO Content & Optimization",
        icon: Search,
        detail: "Pages that answer what people actually search for, and rank for it.",
        price: { lowUsd: 349, highUsd: 699, unit: "per month" },
      },
      {
        name: "AI Website & Landing Page Copy",
        icon: PenLine,
        detail: "Copy that sells the thing, written against your competitors' pages.",
        price: {
          lowUsd: 209,
          highUsd: 419,
          unit: "per page",
          alternative: "or $349–$699/mo for ongoing copy",
        },
      },
      {
        name: "AI Short-Form Video Ads (UGC-style)",
        icon: Video,
        detail: "The vertical video format that still gets watched all the way through.",
        price: {
          lowUsd: 69,
          highUsd: 104,
          unit: "per video",
          alternative: "or $559–$909/mo for 10 videos",
        },
      },
    ],
  },
  {
    id: "growth",
    label: "Growth & Acquisition",
    tagline: "Finding buyers, not followers.",
    icon: Target,
    services: [
      {
        name: "AI Lead Generation & Outreach",
        icon: Target,
        detail: "Qualified lists, researched approaches, and the follow-up nobody does.",
        price: { lowUsd: 489, highUsd: 909, unit: "per month" },
      },
      {
        name: "AI-Assisted PPC / Ad Management",
        icon: BarChart3,
        detail: "Ads built, run and cut when they stop paying for themselves.",
        price: {
          lowUsd: 209,
          highUsd: 209,
          unit: "setup",
          monthlyLowUsd: 349,
          monthlyHighUsd: 629,
          alternative: "or ~10% of ad spend",
        },
      },
      {
        name: "AI Email Marketing Automation",
        icon: Mail,
        detail: "Sequences that run themselves once the list is worth sending to.",
        price: {
          lowUsd: 350,
          highUsd: 700,
          unit: "build",
          monthlyLowUsd: 349,
          monthlyHighUsd: 699,
        },
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytics & Optimization",
    tagline: "Knowing which half of it worked.",
    icon: LineChart,
    services: [
      {
        name: "AI Marketing Analytics Dashboard",
        icon: LineChart,
        detail: "One place that says what is working, instead of five tabs that disagree.",
        price: { lowUsd: 139, highUsd: 279, unit: "per month" },
      },
      {
        name: "AI Conversion Rate Optimization (CRO) & A/B Testing",
        icon: FlaskConical,
        detail: "Same traffic, more of it converting, proven rather than claimed.",
        price: { lowUsd: 349, highUsd: 599, unit: "per month" },
      },
    ],
  },
];

/** `$209` when the ends agree, `$209–$419` when they do not. */
export function priceRange(low: number, high: number): string {
  return low === high ? `$${low}` : `$${low}–$${high}`;
}

/**
 * The full price of a service, the way the legacy formatCatalogPrice
 * wrote it: the one-off, then the monthly, then the alternative.
 */
export function formatPrice(price: Price): string {
  let out = priceRange(price.lowUsd, price.highUsd);
  if (price.monthlyLowUsd != null && price.monthlyHighUsd != null) {
    out += ` + ${priceRange(price.monthlyLowUsd, price.monthlyHighUsd)}/mo`;
  }
  if (price.alternative) out += ` (${price.alternative})`;
  return out;
}

export const SERVICE_COUNT = serviceCategories.reduce((n, c) => n + c.services.length, 0);

/** The cheapest thing on the sheet, for the hero's "from" line. */
export const CHEAPEST_USD = Math.min(
  ...serviceCategories.flatMap((c) => c.services.map((s) => s.price.lowUsd))
);

/** Spend that unlocks the Business Pool, as business-pool.html sells it. */
export const BUSINESS_POOL_THRESHOLD_USD = 5000;
