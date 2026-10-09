// Regenerates public/pricing-catalog.js from src/data/catalog.ts.
//
// WHY THIS EXISTS. The pre-React pages are plain <script> tags: they
// cannot import the TypeScript catalog, so they read a global
// PRICING_CATALOG from public/pricing-catalog.js. That file used to be
// hand-maintained, and it was still serving the twelve retired
// marketing services -- which meant the legacy dashboard's "New
// Request" dropdown was offering them and writing them straight into
// the requests table. Hiding the cards would not have fixed that; the
// services were live in the ordering system.
//
// So the file is generated, every build, from the one catalog. It
// cannot drift, and a service retired in TypeScript disappears from
// the legacy dropdown in the same commit.
//
// Delete this script the day no .html page reads the global.

import { writeFileSync } from "node:fs";
import { activeServices, categories, formatPrice, packages } from "../src/data/catalog.ts";

const grouped = categories.map((c) => ({
  category: c.label,
  items: activeServices
    .filter((s) => s.category === c.id)
    .map((s) => ({
      id: s.id,
      name: s.name,
      unit: s.billing === "monthly" ? "per month" : "one-time",
      price: s.priceUsd,
      startingFrom: Boolean(s.startingFrom),
      display: formatPrice(s),
    })),
}));

const out = `// GENERATED FILE -- DO NOT EDIT.
//
// Written by scripts/generate-legacy-catalog.mjs from src/data/catalog.ts
// on every build. The pre-React pages cannot import TypeScript, so this
// is how they see the same catalog the React app does.
//
// Editing this by hand will be silently undone by the next build, and
// worse, it would let the legacy pages offer services the real catalog
// has retired. Change src/data/catalog.ts instead.

const PRICING_CATALOG = ${JSON.stringify(grouped, null, 2)};

const BUSINESS_PACKAGES = ${JSON.stringify(
  packages.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.priceUsd,
    unit: p.billing === "monthly" ? "per month" : "one-time",
    display: formatPrice(p),
  })),
  null,
  2
)};

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
`;

writeFileSync(new URL("../public/pricing-catalog.js", import.meta.url), out);

const count = grouped.reduce((n, g) => n + g.items.length, 0);
console.log(`pricing-catalog.js regenerated: ${count} services, ${packages.length} packages`);
