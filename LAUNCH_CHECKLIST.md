# Launch checklist

Tick each item on the **deployed** site, not just locally. Items marked *(automated)* are covered by `npm test` / `npm run test:e2e`, but are worth a manual look too.

## 1. Functional testing
- [ ] Upload by file picker, drag-and-drop and paste (Ctrl/Cmd+V).
- [ ] “Try a sample image” works.
- [ ] Invalid files show clear errors: a renamed text file, a GIF, a damaged PNG *(automated)*.
- [ ] A photo over 16.7 MP shows the scale-down prompt; “Choose a different image” cancels it *(automated)*.
- [ ] Clicking the image selects the right color at Fit, 100 % and zoomed-in levels *(automated)*.
- [ ] HEX/RGB inputs validate; the color picker works for both colors *(automated)*.
- [ ] Tolerance, feathering, matching mode, Preserve shading and Highlight affected area update the preview.
- [ ] Keep & pick another color, remove a kept replacement, Undo/Redo/Reset and keyboard shortcuts *(automated)*.
- [ ] Side by side, Compare slider, Original only, Result only views.
- [ ] Download PNG, JPEG and WebP; file names and dimensions are correct; transparency kept in PNG/WebP *(automated)*.
- [ ] Test real photos: a JPEG from a phone (check rotation), a transparent logo PNG, a screenshot, a WebP.

## 2. Mobile testing
- [ ] iPhone Safari and Android Chrome: upload from the photo library and camera roll.
- [ ] Tap-to-pick, sliders and inputs are easy to use; no horizontal scrolling *(automated in Chromium)*.
- [ ] Download works (iOS may open a share sheet or preview first).
- [ ] A large 12 MP phone photo processes without crashing.

## 3. Accessibility
- [ ] Whole editor usable with only the keyboard (Tab, arrows + Enter on the preview, Esc).
- [ ] Screen reader (VoiceOver or NVDA) announces image loaded, color selected, errors and download status.
- [ ] Zoom the browser to 200 %: content still usable.
- [ ] axe audit has no serious/critical issues *(automated)*.

## 4. SEO
- [ ] `VITE_SITE_URL` set to the canonical origin; deployment rebuilt.
- [ ] Each page: unique title and description, canonical link, one `<h1>` (View Source).
- [ ] `/sitemap.xml` lists exactly the 8 public pages; `/robots.txt` references it.
- [ ] Unknown URLs return the 404 page with HTTP status 404.
- [ ] Alternate hosts (www / non-www / `*.pages.dev`) redirect to the canonical host.
- [ ] Rich Results Test passes for `/` and `/faq`.
- [ ] Link preview shows the Open Graph image and title.
- [ ] PageSpeed Insights (mobile) checked; fix anything flagged as poor.

## 5. Privacy and legal pages
- [ ] `VITE_CONTACT_EMAIL` set; the address receives mail.
- [ ] Privacy Policy accurately reflects the hosting provider, analytics (if any) and advertising (if enabled).
- [ ] Terms of Service reviewed; operator name / governing law added if needed. Have both pages reviewed for your jurisdiction.
- [ ] `lastUpdated` in `src/config/site.js` is correct.
- [ ] Verified in DevTools → Network that no image data is sent anywhere while editing.

## 6. Domain and hosting
- [ ] Cloudflare Pages project builds from `main` with `npm run build` → `dist`, `NODE_VERSION=22`.
- [ ] Custom domain connected; certificate active; HTTPS everywhere.
- [ ] Security headers present (check with `curl -I https://<domain>/`).
- [ ] Registrar account secured with 2-factor authentication; domain auto-renew on.

## 7. Search Console and sitemap
- [ ] Property verified (DNS TXT, or `VITE_GOOGLE_SITE_VERIFICATION`).
- [ ] Sitemap submitted and read successfully.
- [ ] Home page inspected and indexing requested.
- [ ] Revisit the Pages and Core Web Vitals reports after 2–4 weeks.

## 8. Analytics (optional)
- [ ] If you add analytics, prefer a cookieless, privacy-friendly option (e.g. Cloudflare Web Analytics).
- [ ] Never send image data, file names or colors that could identify users.
- [ ] Update the Privacy Policy (and consent message, if needed) **before** enabling it.
- [ ] Update the CSP in `scripts/prerender.js` to allow the analytics script origin.

## 9. AdSense application readiness
- [ ] Site live on your own domain for long enough to be crawled, with the guides, FAQ, About, Contact, Privacy and Terms pages reachable from every page.
- [ ] Content reviewed for originality and usefulness; no placeholder text.
- [ ] Applied with your own account; `VITE_ADSENSE_CLIENT` set and redeployed; `/ads.txt` shows your publisher ID.
- [ ] Privacy & messaging: GDPR consent message (EEA/UK/CH) and US state message published.
- [ ] Privacy Policy now shows the advertising section.
- [ ] After approval: ad unit IDs set; ads appear only in content areas, never overlap or crowd the editor, upload or download controls.
- [ ] Never click your own ads. Approval is decided by Google and is not guaranteed.
