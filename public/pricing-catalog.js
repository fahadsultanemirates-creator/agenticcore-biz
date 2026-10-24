// GENERATED FILE -- DO NOT EDIT.
//
// Written by scripts/generate-legacy-catalog.mjs from src/data/catalog.ts
// on every build. The pre-React pages cannot import TypeScript, so this
// is how they see the same catalog the React app does.
//
// Editing this by hand will be silently undone by the next build, and
// worse, it would let the legacy pages offer services the real catalog
// has retired. Change src/data/catalog.ts instead.

const PRICING_CATALOG = [
  {
    "category": "Business Launch & Planning",
    "items": [
      {
        "id": "BIZ-01",
        "name": "Startup Roadmap & Business Action Plan",
        "unit": "one-time",
        "price": 25,
        "startingFrom": false,
        "display": "$25"
      },
      {
        "id": "BIZ-02",
        "name": "Business Feasibility & Market-Fit Report",
        "unit": "one-time",
        "price": 39,
        "startingFrom": false,
        "display": "$39"
      },
      {
        "id": "BIZ-03",
        "name": "Market & Competitor Research",
        "unit": "one-time",
        "price": 29,
        "startingFrom": false,
        "display": "$29"
      },
      {
        "id": "BIZ-05",
        "name": "Business Administration Starter System",
        "unit": "one-time",
        "price": 39,
        "startingFrom": false,
        "display": "$39"
      },
      {
        "id": "BIZ-06",
        "name": "Standard Operating Procedures Pack",
        "unit": "one-time",
        "price": 29,
        "startingFrom": false,
        "display": "$29"
      }
    ]
  },
  {
    "category": "Office & Financial Administration",
    "items": [
      {
        "id": "BIZ-07",
        "name": "Invoicing, Quotations & Receipts Setup",
        "unit": "one-time",
        "price": 19,
        "startingFrom": false,
        "display": "$19"
      },
      {
        "id": "BIZ-08",
        "name": "Expense & Cash-Flow Tracking System",
        "unit": "one-time",
        "price": 29,
        "startingFrom": false,
        "display": "$29"
      },
      {
        "id": "BIZ-13",
        "name": "Business Proposals & Professional Documents",
        "unit": "one-time",
        "price": 25,
        "startingFrom": true,
        "display": "from $25"
      }
    ]
  },
  {
    "category": "Customer Records & Setup",
    "items": [
      {
        "id": "BIZ-14",
        "name": "CRM Customer Records & Pipeline Setup",
        "unit": "one-time",
        "price": 39,
        "startingFrom": false,
        "display": "$39"
      }
    ]
  }
];

const BUSINESS_PACKAGES = [
  {
    "id": "PKG-LAUNCH-KIT",
    "name": "Business Launch Kit",
    "price": 69,
    "unit": "one-time",
    "display": "$69"
  }
];

/** Kept for the legacy pages that already call it. */
function formatCatalogPrice(item) {
  return item.display;
}

/**
 * Look a package up by the key stored in package_subscriptions.package_key.
 *
 * The legacy dashboard and admin pages each kept their own PACKAGE_LABELS
 * map, and an admin page kept its own PACKAGE_DEFAULT_AMOUNTS as well --
 * three hand-written copies of the package list, all of them still naming
 * the two retired engines at their old prices. They call these instead.
 */
function findPackage(key) {
  return BUSINESS_PACKAGES.find((p) => p.id === key);
}

/** The package's name, or the raw key if it is one we no longer carry. */
function packageLabel(key) {
  const found = findPackage(key);
  return found ? found.name : key;
}
