// Always release the welcome screen, including when an asset is slow to load.
(() => {
  const loader = document.getElementById('site-loader');
  if (!document.documentElement.classList.contains('site-loading')) return;
  const pageElements = [...document.body.children].filter(el => el !== loader && !['SCRIPT', 'SVG'].includes(el.tagName));
  const inertStates = pageElements.map(el => el.inert);
  pageElements.forEach(el => { el.inert = true; });
  let dismissed = false;
  window.dismissSiteLoader = () => {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(window.siteLoadingTimeout);
    document.documentElement.classList.remove('site-loading');
    pageElements.forEach((el, index) => { el.inert = inertStates[index]; });
    loader.setAttribute('aria-hidden', 'true');
    setTimeout(() => loader.remove(), 650);
  };
  function finishLoading() {
    const minimum = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 2000;
    const remaining = Math.max(0, minimum - (performance.now() - window.siteLoadingStarted));
    setTimeout(window.dismissSiteLoader, remaining);
  }
  if (document.readyState === 'complete') finishLoading();
  else window.addEventListener('load', finishLoading, { once: true });
  window.addEventListener('pageshow', event => { if (event.persisted) window.dismissSiteLoader(); });
})();

/* Avora Care: navigation, scroll transitions and WhatsApp enquiries. */
const header = document.getElementById('site-header');
const mobileToggle = document.getElementById('menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
const video = document.getElementById('hero-video');

function syncHeader() {
  header.classList.toggle('scrolled', window.scrollY > 24);
}
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

function setMenu(open) {
  header.classList.toggle('menu-active', open);
  document.body.classList.toggle('menu-open', open);
  mobileToggle.setAttribute('aria-expanded', String(open));
  mobileToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (open) mobileNav.removeAttribute('inert');
  else mobileNav.setAttribute('inert', '');
  syncHeader();
}
mobileToggle.addEventListener('click', () => setMenu(!header.classList.contains('menu-active')));
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
window.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });
window.addEventListener('resize', () => { if (window.innerWidth > 900 && header.classList.contains('menu-active')) setMenu(false); });

// Track the last navigation section that has reached the upper part of the viewport.
const sections = [...document.querySelectorAll('main section[id]')];
const desktopLinks = [...document.querySelectorAll('.desktop-nav .nav-link')];
function syncActiveSection() {
  const marker = header.offsetHeight + window.innerHeight * .2;
  let active = sections[0];
  sections.forEach(section => {
    if (section.id === 'approach' && document.documentElement.classList.contains('scroll-transition')) {
      if (section.parentElement.getBoundingClientRect().top <= -window.innerHeight * .5) active = section;
    } else if (section.getBoundingClientRect().top <= marker) active = section;
  });
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
    active = sections[sections.length - 1];
  }
  if (!active) return;
  desktopLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + active.id));
}
window.addEventListener('scroll', syncActiveSection, { passive: true });
window.addEventListener('resize', syncActiveSection);
syncActiveSection();

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
  }, { threshold: .08, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
}

// Respect OS reduced-motion setting and avoid wasting power in hidden tabs.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// Tall mobile content must scroll in normal flow rather than overlap the pinned hero.
const compactHeroLayout = window.matchMedia('(max-width: 900px), (max-height: 650px)');
const hero = document.getElementById('home');
const approach = document.getElementById('approach');
const fallingLeaf = document.getElementById('falling-leaf');
const leafFlightPath = document.getElementById('leaf-flight-path');
const leafPathLength = leafFlightPath?.getTotalLength() || 0;
const clampProgress = value => Math.min(1, Math.max(0, value));
let transitionFrame = 0;
function syncHeroTransition() {
  transitionFrame = 0;
  if (!hero || !approach) return;
  const transitionEnabled = !reducedMotion.matches && !compactHeroLayout.matches;
  document.documentElement.classList.toggle('scroll-transition', transitionEnabled);
  if (!transitionEnabled) {
    const fade = reducedMotion.matches ? 0 : clampProgress(-hero.getBoundingClientRect().top / (window.innerHeight * .4));
    hero.style.setProperty('--hero-whiteout', fade.toFixed(3));
    approach.classList.remove('is-present');
    approach.style.removeProperty('--approach-opacity');
    approach.style.removeProperty('--approach-offset');
    if (fallingLeaf) fallingLeaf.style.opacity = '0';
    return;
  }
  const viewport = window.innerHeight;
  const distance = -hero.parentElement.getBoundingClientRect().top;
  const heroProgress = clampProgress(distance / (viewport * .4));
  const approachProgress = clampProgress((distance - viewport * .45) / (viewport * .3));
  // Smooth both ends while keeping the animation tied to the scroll position.
  const fade = approachProgress * approachProgress * (3 - 2 * approachProgress);
  hero.style.setProperty('--hero-whiteout', heroProgress.toFixed(3));
  approach.classList.toggle('is-present', fade > .1);
  approach.style.setProperty('--approach-opacity', fade.toFixed(3));
  approach.style.setProperty('--approach-offset', `${(1 - fade) * 28}px`);
  if (fallingLeaf && leafPathLength) {
    if (reducedMotion.matches || window.innerWidth <= 900) {
      fallingLeaf.style.opacity = '0';
      return;
    }
    // Run the supplied flight path during the approach section's scroll hold.
    const progress = clampProgress((distance / viewport - .65) / 2.5);
    const point = leafFlightPath.getPointAtLength(progress * leafPathLength);
    const sectionBounds = approach.getBoundingClientRect();
    const contentBounds = approach.querySelector('.intro-grid').getBoundingClientRect();
    const gutter = Math.max(0, sectionBounds.right - contentBounds.right);
    const leafWidth = Math.min(40, gutter * .5);
    fallingLeaf.style.setProperty('--leaf-center', `${contentBounds.right - sectionBounds.left + gutter / 2}px`);
    fallingLeaf.style.setProperty('--leaf-width', `${leafWidth}px`);
    // Centre the path's sideways excursions in the available right-hand gutter.
    const windRoom = Math.max(0, gutter - leafWidth - 16);
    const x = (point.x / 100 - .5) * windRoom;
    const y = (point.y / 100) * viewport;
    const angle = -25 + progress * 370 + Math.sin(progress * Math.PI * 8) * 16;
    const opacity = Math.max(0, Math.min(1, progress / .1, (1 - progress) / .18));
    fallingLeaf.style.transform = `translateX(-50%) translate3d(${x}px, ${y}px, 0) rotate(${angle}deg)`;
    fallingLeaf.style.opacity = String(opacity);
  }
}
function requestHeroTransition() {
  if (!transitionFrame) transitionFrame = requestAnimationFrame(syncHeroTransition);
}
window.addEventListener('scroll', requestHeroTransition, { passive: true });
window.addEventListener('resize', requestHeroTransition);
window.addEventListener('load', requestHeroTransition);
window.addEventListener('pageshow', requestHeroTransition);
reducedMotion.addEventListener?.('change', requestHeroTransition);
compactHeroLayout.addEventListener?.('change', requestHeroTransition);
syncHeroTransition();

function syncVideo() {
  if (!video) return;
  if (reducedMotion.matches || document.hidden) video.pause();
  else video.play().catch(() => {});
}
if (video) {
  reducedMotion.addEventListener?.('change', syncVideo);
  document.addEventListener('visibilitychange', syncVideo);
  syncVideo();
}

document.getElementById('year').textContent = new Date().getFullYear();

const contactSection = document.getElementById('contact');
const contactLink = document.getElementById('contact-whatsapp');
const floatingWhatsapp = document.querySelector('.whatsapp-button');
const enquiryMessages = {
  care: "Hello, I'm looking for care for myself. Could you tell me more about your services?",
  family: "Hello, I'm enquiring about care for someone close to me. Could you tell me more?",
  team: "Hello, I'd like to join the Avora Care team. Could you tell me about opportunities?",
  other: "Hello, I'd like to find out more about Avora Care."
};
const contactOptions = document.querySelectorAll('input[name="enquiry"]');
const contactMessage = document.getElementById('contact-message');
const otherMessage = document.getElementById('contact-other-message');
function resizeContactMessage() {
  if (otherMessage.hidden) return;
  contactMessage.style.height = 'auto';
  contactMessage.style.height = `${contactMessage.scrollHeight + contactMessage.offsetHeight - contactMessage.clientHeight}px`;
}
function updateWhatsappMessage() {
  const selected = document.querySelector('input[name="enquiry"]:checked');
  const reason = selected?.value || 'other';
  const showMessage = selected?.value === 'other';
  otherMessage.hidden = !showMessage;
  resizeContactMessage();
  const introduction = enquiryMessages[reason];
  const details = showMessage ? contactMessage.value.trim() : '';
  const message = details ? `${introduction}\n\n${details}` : introduction;
  contactLink.href = `https://wa.me/447777777777?text=${encodeURIComponent(message)}`;
}
contactOptions.forEach(option => option.addEventListener('change', updateWhatsappMessage));
contactMessage.addEventListener('input', updateWhatsappMessage);
window.addEventListener('resize', resizeContactMessage);
updateWhatsappMessage();

let contactFrame = 0;
function syncContactTransition() {
  contactFrame = 0;
  const immersive = !reducedMotion.matches;
  document.documentElement.classList.toggle('contact-immersive', immersive);
  const bounds = contactSection.getBoundingClientRect();
  const viewport = window.innerHeight;
  const entrance = clampProgress((viewport * .18 - bounds.top) / (viewport * .18));
  // Return to white as the footer enters, rather than after the CTA has gone.
  const exit = clampProgress((bounds.bottom - viewport * .65) / (viewport * .55));
  const wash = immersive ? entrance * exit : 0;
  document.documentElement.style.setProperty('--contact-wash', String(wash * wash * (3 - 2 * wash)));
  const takeover = entrance > .92 && exit > .5 && !header.contains(document.activeElement) && !header.classList.contains('menu-active');
  document.documentElement.classList.toggle('contact-takeover', takeover);
  header.inert = takeover;
  const hideWhatsapp = bounds.top < viewport && bounds.bottom > viewport * .9;
  document.documentElement.classList.toggle('whatsapp-hidden', hideWhatsapp);
  floatingWhatsapp.inert = hideWhatsapp;
}
function requestContactTransition() {
  if (!contactFrame) contactFrame = requestAnimationFrame(syncContactTransition);
}
window.addEventListener('scroll', requestContactTransition, { passive: true });
window.addEventListener('resize', requestContactTransition);
window.addEventListener('pageshow', requestContactTransition);
window.addEventListener('load', requestContactTransition);
window.addEventListener('focusin', requestContactTransition);
reducedMotion.addEventListener?.('change', requestContactTransition);
syncContactTransition();
