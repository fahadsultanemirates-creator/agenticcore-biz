-- The package list stopped being the database's business.
--
-- package_subscriptions.package_key carried a CHECK that enumerated
-- ('starter-engine', 'omni-scale-growth-engine'). Those two packages no
-- longer exist. The three that replaced them -- PKG-LAUNCH-KIT,
-- PKG-BACK-OFFICE, PKG-OPS-PLUS -- could not be written at all: every
-- insert would have been rejected by the constraint.
--
-- The obvious fix is to list the three new keys instead. That is the same
-- mistake one row down: the catalogue would then live in src/data/catalog.ts
-- AND in a CHECK constraint, and the next time a package is added or renamed
-- somebody has to remember the second copy. That is exactly how
-- public/pricing-catalog.js drifted out of step with the React pages and
-- started selling services the site no longer advertised.
--
-- So the constraint now checks the SHAPE of a key, not its membership of a
-- list. It still catches an empty string, a null-ish blank, a stray space,
-- a pasted sentence, or a key long enough to suggest something went wrong --
-- which is all a database can honestly know about a product key. Which keys
-- are real is decided by the catalogue the application reads, in one place.
--
-- The old two keys satisfy the new shape, so any historical row survives.

alter table public.package_subscriptions
  drop constraint if exists package_subscriptions_package_key_check;

alter table public.package_subscriptions
  add constraint package_subscriptions_package_key_check
  check (package_key ~ '^[A-Za-z0-9][A-Za-z0-9_-]{1,46}[A-Za-z0-9]$');

comment on column public.package_subscriptions.package_key is
  'Package identifier from the application catalogue (src/data/catalog.ts), '
  'e.g. PKG-LAUNCH-KIT. Validated for shape only -- the catalogue, not this '
  'column, decides which packages exist.';
