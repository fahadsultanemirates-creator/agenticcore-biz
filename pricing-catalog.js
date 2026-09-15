// AgenticCore Biz — service catalog. Single source of truth for
// services.html and index.html's pricing displays, and the dashboard's
// New Request dropdown (dashboard.js). À la carte only -- no packages.

const PRICING_CATALOG = [
  {
    category: 'Customer Engagement & Support',
    items: [
      { name: 'AI Chatbot / Website Assistant', unit: 'setup + monthly', priceLow: 209, priceHigh: 419, priceLowMonthly: 104, priceHighMonthly: 209 },
      { name: 'AI Voice Agent (Phone Answering)', unit: 'setup + monthly', priceLow: 209, priceHigh: 209, priceLowMonthly: 139, priceHighMonthly: 279 },
      { name: 'AI Reputation & Review Management', unit: 'per month', priceLow: 209, priceHigh: 319 }
    ]
  },
  {
    category: 'Content, Social & Video',
    items: [
      { name: 'AI Social Media Management', unit: 'per month', priceLow: 279, priceHigh: 559 },
      { name: 'AI SEO Content & Optimization', unit: 'per month', priceLow: 349, priceHigh: 699 },
      { name: 'AI Website & Landing Page Copy', unit: 'per page', priceLow: 209, priceHigh: 419, altPricing: 'or $349–$699/mo for ongoing copy' },
      { name: 'AI Short-Form Video Ads (UGC-style)', unit: 'per video', priceLow: 69, priceHigh: 104, altPricing: 'or $559–$909/mo for 10 videos' }
    ]
  },
  {
    category: 'Growth & Acquisition',
    items: [
      { name: 'AI Lead Generation & Outreach', unit: 'per month', priceLow: 489, priceHigh: 909 },
      { name: 'AI-Assisted PPC / Ad Management', unit: 'setup + monthly', priceLow: 209, priceHigh: 209, priceLowMonthly: 349, priceHighMonthly: 629, altPricing: 'or ~10% of ad spend' },
      { name: 'AI Email Marketing Automation', unit: 'build + monthly', priceLow: 350, priceHigh: 700, priceLowMonthly: 349, priceHighMonthly: 699 }
    ]
  },
  {
    category: 'Analytics & Optimization',
    items: [
      { name: 'AI Marketing Analytics Dashboard', unit: 'per month', priceLow: 139, priceHigh: 279 },
      { name: 'AI Conversion Rate Optimization (CRO) & A/B Testing', unit: 'per month', priceLow: 349, priceHigh: 599 }
    ]
  }
];

function formatCatalogPrice(item) {
  const primary = item.priceLow === item.priceHigh ? `$${item.priceLow}` : `$${item.priceLow}–$${item.priceHigh}`;
  let out = primary;
  if (item.priceLowMonthly) {
    const monthly = item.priceLowMonthly === item.priceHighMonthly ? `$${item.priceLowMonthly}` : `$${item.priceLowMonthly}–$${item.priceHighMonthly}`;
    out = `${primary} + ${monthly}/mo`;
  }
  if (item.altPricing) out += ` (${item.altPricing})`;
  return out;
}
