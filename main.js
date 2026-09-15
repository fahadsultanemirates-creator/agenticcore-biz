// Nav scroll state
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });
}

// Mobile nav drawer. Below 860px main.css turns .nav-links into a
// drop-down panel toggled by .nav-menu-toggle; above it, both the
// button and this state are inert (the button is display:none and
// .nav-links is a plain inline row, so .is-open has no effect).
(function initMobileNav() {
  const toggle = document.querySelector('.nav-menu-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  function setOpen(open) {
    links.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // Same-page anchors (index.html's "See how it works") don't navigate,
  // so the drawer would stay open over the section it just scrolled to.
  links.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  document.addEventListener('click', (e) => {
    if (!nav || nav.contains(e.target)) return;
    setOpen(false);
  });

  // Dragging past the breakpoint with the drawer open would otherwise
  // leave .is-open set on a desktop-layout nav -- harmless today, but
  // only because .is-open happens to resolve to the same `display:flex`
  // the desktop rule already sets.
  window.matchMedia('(max-width: 860px)').addEventListener('change', (e) => {
    if (!e.matches) setOpen(false);
  });
})();
