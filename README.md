# RM UI Starter (Login + Dashboard)
A minimal, contemporary CRM UI starter using **Tailwind CDN**, with:
- Brand crimsons (defaults) and **white‑label theming** via CSS variables
- Animated rainbow **gradient logotype**
- Accessible **Login** with 2FA step (demo)
- **Dashboard** with sidebar nav, KPIs, charts (Chart.js), and recent transactions table
- Fully responsive, Netlify‑friendly static files

## Quick start
1. Serve the folder (or just open `index.html`) locally.
2. Sign in → you’ll be taken to `dashboard.html` (demo navigation).
3. Use the profile menu to try theme presets (Default, Emerald, Indigo).

## White‑label theming
We use CSS variables and Tailwind’s arbitrary values to stay flexible:
```css
:root {
  --brand-400: #ef3c5b;
  --brand-600: #dc2743;
  --brand-700: #c21b35;
}
```
Buttons and accents are styled with classes like:
```html
<button class="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] focus:ring-[var(--brand-400)]">...</button>
```
Swap colors at runtime via JS:
```js
setTheme({ brand400: '#34d399', brand600: '#059669', brand700: '#047857', logoUrl: '/path/to/logo.png' });
```

## Accessibility notes
- Proper `<label for>` on inputs
- Visible focus rings (`focus:ring-2` in brand‑400)
- Semantic colors for statuses (green = success, yellow = pending, red = error)
- Responsive layout collapses sidebar to a hamburger on mobile

## Deploy to Netlify
Just drag‑and‑drop the folder into Netlify, or connect your GitHub repo and set publish directory to the repo root (no build step required).

## Tailwind customization
This starter uses the **CDN** build for speed. If you prefer a full Tailwind pipeline:
- Create `tailwind.config.js` and add brand colors under `theme.extend.colors.brand`.
- Replace `bg-[var(--brand-600)]` etc. with `bg-brand-600` utilities.
- Build with Tailwind CLI or your bundler of choice.

## Where to put your sandbox keys?
These pages don’t call any APIs yet. When you wire auth/analytics, keep secrets on the server side or via Netlify Functions / environment variables. Never expose real secrets in client code.
