# Avora Care — responsive landing page

A fully coded, responsive HTML/CSS/JavaScript landing page using the original Avora Care sage-and-cream branding and animated widescreen hero background.

## Preview

Open `index.html` in a browser, or start a local server in this folder:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## What's built

- Full-viewport (`100svh`) hero with looping WebM and MP4 fallback, plus a still-image fallback.
- Transparent fixed header at the top, transitioning to a softly frosted header after scrolling.
- Responsive navigation with functional mobile menu and section anchors.
- About/approach, values, services, process, contact, and footer sections.
- Reduced-motion support and video pausing in background tabs.
- Basic front-end enquiry validation.

## Before going live

1. **Connect the enquiry form.** In `script.js`, set `CONTACT_EMAIL` to the client's real email address if a `mailto:`-based form is acceptable. For reliable production form submissions, integrate Formspree, Cloudflare Workers, Apps Script or your backend. Until configured, the form deliberately displays a demo message instead of pretending an enquiry was sent.
2. Confirm Avora Care's actual service offerings, phrasing, service areas and contact details with the client. The four displayed service categories are **illustrative**, not verified.
3. Review legal pages (Privacy Policy, Cookies, Accessibility, etc.) and any applicable CQC/registration disclosure only when verified.
4. This includes original/generated hero artwork, and animation. Optimized videos are in `assets/`. Background audio is deliberately absent.
5. Fonts are requested via Google Fonts (DM Sans and Manrope); system sans-serif fallbacks are supplied. If preferred, self-host licensed font files.

## Deployment

Upload the contents of this folder to Cloudflare Pages, GitHub Pages, Netlify or any static web host. No build step, framework, Node package install, API key or backend is required to view the site.
