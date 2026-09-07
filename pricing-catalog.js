// AgenticCore Biz — service catalog + package pricing. Single source of
// truth for services.html and index.html's pricing displays. Prices are
// ranges for most à la carte services (the exact number is confirmed
// during scoping, same as every other service here), and fixed monthly
// prices for the two standard packages. The Custom Package deliberately
// has no price at all -- see PACKAGES below.

const PRICING_CATALOG = [
  {
    category: 'AI Video & Creative',
    page: 'services-ai-video-creative.html',
    items: [
      { name: 'Multilingual AI Avatar Spokesperson videos', unit: 'per 60–90s video', priceLow: 175, priceHigh: 250 },
      { name: 'Automated Video Repurposing', unit: 'per month, 12 vertical shorts/reels', priceLow: 450, priceHigh: 750 },
      { name: 'Dynamic Ad Creative Production', unit: '15–20 modular ad variants', priceLow: 350, priceHigh: 600 }
    ]
  },
  {
    category: 'Lead Generation & Outreach',
    page: 'services-lead-generation.html',
    items: [
      { name: 'Multi-Agent Lead Scraping & Enrichment', unit: '1,000 ICP-verified B2B leads', priceLow: 400, priceHigh: 700 },
      { name: 'Hyper-Personalized Cold Outreach', unit: 'per month, full outbound infrastructure', priceLow: 1200, priceHigh: 1800 },
      { name: 'Automated Lead Qualification & Scoring', unit: 'setup', priceLow: 500, priceHigh: 900 }
    ]
  },
  {
    category: 'Customer Engagement',
    page: 'services-customer-engagement.html',
    items: [
      { name: '24/7 AI Sales & Support Chatbot', unit: 'setup + monthly', priceLow: 650, priceHigh: 650, priceLowMonthly: 150, priceHighMonthly: 150 },
      { name: 'Automated Review & Reputation Management', unit: 'per month', priceLow: 300, priceHigh: 450 },
      { name: 'Behavioral Re-engagement Workflows', unit: 'setup', priceLow: 450, priceHigh: 800 }
    ]
  },
  {
    category: 'Paid Media & Optimization',
    page: 'services-paid-media.html',
    items: [
      { name: 'Predictive Audience Targeting & Setup', unit: 'setup', priceLow: 400, priceHigh: 650 },
      { name: 'Autonomous Ad Budget Allocation', unit: 'per month', priceLow: 600, priceHigh: 1000 },
      { name: 'Algorithmic A/B Testing & CRO', unit: 'per month', priceLow: 500, priceHigh: 850 }
    ]
  },
  {
    category: 'Organic Growth & Intelligence',
    page: 'services-organic-growth.html',
    items: [
      { name: 'Programmatic SEO & Content Hubs', unit: 'setup', priceLow: 800, priceHigh: 1500 },
      { name: 'Real-Time Competitor & Market Tracking', unit: 'per month', priceLow: 350, priceHigh: 500 }
    ]
  }
];

// Package 3 ("Custom Package") deliberately carries no price -- it is
// never a checkout item. Selecting it routes straight into a
// requirements conversation with a human manager; price and scope are
// only set after that conversation, same discovery-first principle that
// applies to every service on this site.
const PACKAGES = [
  {
    key: 'starter-engine',
    name: 'AI Starter Engine',
    price: 950,
    billing: 'per month',
    description: 'A focused starting point: always-on customer engagement plus a steady stream of content.',
    includes: [
      '24/7 AI sales & support chatbot',
      '4 multilingual AI avatar videos',
      '8 repurposed vertical shorts/reels',
      'Automated review & reputation management',
      'Monthly performance report'
    ]
  },
  {
    key: 'omni-scale-growth-engine',
    name: 'Omni-Scale Growth Engine',
    price: 3450,
    billing: 'per month',
    featured: true,
    description: 'Full-scale, multi-channel growth: outbound, paid, organic, and creative, run and optimized continuously.',
    includes: [
      '2,500 ICP-verified leads per month',
      '10 multilingual AI avatar videos',
      '20 repurposed vertical shorts/reels',
      '30 modular ad creative variants',
      'Autonomous ad budget allocation + algorithmic CRO',
      'Real-time competitor & market tracking',
      '10 programmatic SEO pages per month',
      'Bi-weekly strategy calls with your manager'
    ]
  },
  {
    key: 'custom',
    name: 'Custom Package',
    price: null,
    billing: 'Custom — Let’s talk',
    description: 'Not sure which package fits, or need something neither one covers? We scope it with you directly, first.',
    includes: [
      'A real conversation about your business and goals before anything is proposed',
      'A plan and price built around what you actually need',
      'The same team and delivery standards as every other package'
    ]
  }
];

function formatCatalogPrice(item) {
  if (item.priceLowMonthly) {
    const setup = item.priceLow === item.priceHigh ? `$${item.priceLow}` : `$${item.priceLow}–$${item.priceHigh}`;
    return `${setup} setup + $${item.priceLowMonthly}/mo`;
  }
  return item.priceLow === item.priceHigh ? `$${item.priceLow}` : `$${item.priceLow}–$${item.priceHigh}`;
}
