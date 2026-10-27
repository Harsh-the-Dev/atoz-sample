# Dearly — The thoughtful gift studio

An independently branded competitor concept in forest green, warm cream and copper. “Dearly” is a temporary name pending the client's confirmed brand. The catalogue and pricing remain illustrative.

## Open the website

Open **client-preview.html** directly in a modern browser, or share that file with the client. The complete offline preview is approximately **420 KB**, down from about **4.1 MB** in the original version. All images, styles and interactions are included; no install or network connection is required to explore it.

For local development, use Node 20 or newer. No `npm install` is required:

```sh
npm run dev      # http://localhost:5173
npm run build    # Optimized static output and refreshed standalone preview
npm run preview  # Production preview with compression and browser caching
npm test         # 20 tests: booking, catalogue, persistence validation, builds and HTTP delivery
```

Deploy the contents of **atoz-studio/dist** at a static host's domain root. The build includes content-hashed CSS/JS, Brotli and gzip variants, and a `_headers` file for hosts that support that convention. Other hosts should configure equivalent cache and compression headers. All image and script paths in the hosted version are absolute from the domain root.

## Connect WhatsApp and your brand

Edit **atoz-studio/site-config.js**, then run `npm run build`:

- `brand`: the business's confirmed brand name.
- `whatsappNumber`: the business's confirmed international number, including country code.

**The WhatsApp number is currently blank because it has not been supplied.** No invented number is used. The buttons and enquiry builder are implemented; while unconfigured, the review screen explains that the demo is not connected and offers an enquiry download. Once configured, it displays “Continue to WhatsApp” with the full message prefilled for that business.

The flow uses the [official WhatsApp click-to-chat format](https://faq.whatsapp.com/5913398998672934). It never sends a message automatically. Visitors review their information, open WhatsApp and press Send themselves. A quote request does not claim that a booking is confirmed.

WhatsApp entry points appear in the desktop navbar, hero, product dialog, shopping bag, bespoke-gifting cards, floating desktop action and mobile bottom bar. Forms support occasion, date, quantity, budget, delivery city and a personal brief. Gift notes are included only when the visitor selects the corresponding option.

## Design system

The interface is built from one token set in **atoz-studio/styles.css**, so every page section and dialog shares the same palette, type scale, spacing and components.

- **Palette**, taken from the studio's own photography: stone ivory and kraft linen surfaces, bottle-green ink for text and structural blocks, grosgrain wine as the single accent, rose blush for soft panels, and copper kept for small foil details such as the wordmark dot and the reading-progress line.
- **Type**: an old-style serif stack (Iowan Old Style, Palatino Linotype, Book Antiqua, Georgia) for headlines, editorial copy and the gift note itself, and a humanist sans stack (Avenir Next, Segoe UI, Helvetica Neue, Roboto) for navigation, buttons, prices, labels and forms. Both are system fonts, so nothing is downloaded. Nothing is set below 13 px, and headings are sentence case without tracked-caps labels.
- **Layout**: a left-aligned 1320 px grid with fluid gutters and section rhythm. The hero sets a tall photograph on a blush field with a gift tag overlapping it; the tag shape recurs only for the occasion buttons. Product photos act as the cards, bespoke options are a studio menu of three rows, and only the three-step booking process is numbered because it is a sequence.
- **Breakpoints**: 1180 px (laptop), 1050 px (navigation collapses to the drawer), 900 px (hero stacks), 720 px (mobile layout, bottom action bar) and 400 px (small phones). Touch targets are at least 44 px.

## Navigation, mobile layouts and interactions

- Sticky, compact-on-scroll navbar with reading progress and active-section indicators.
- Collection and occasion dropdowns supporting pointer, click, keyboard, Escape and outside-click dismissal.
- Mobile navigation drawer with direct occasion filters and saved favorites.
- Mobile bottom action bar, safe-area padding and space reserved in the footer.
- Larger readable type, touch controls, responsive grids and mobile form layouts.
- Search, occasion filters, gift finder, personalization, saved favorites and gift bag.
- Native modal focus containment, focus restoration and reduced-motion handling.
- Motion is limited to one hero entrance on load, product cards settling after a filter change, dialog and drawer entrances, the bag badge pulse and the toast. Reduced-motion and data-saving preferences disable all of it, including CSS transitions.

## Loading improvements

| Asset | Previous | Current |
| --- | ---: | ---: |
| Standalone preview | ~4.1 MB | ~450 KB |
| Five primary photos | 1,519,147 bytes | 248,198 bytes |
| Hero image on mobile, 640 px variant | 485,143 bytes for original full JPEG | 24,304 bytes |

The original JPEGs remain in source for reference but are excluded from the production build. Responsive WebP versions use `srcset`/`sizes`; below-fold photos decode asynchronously and load lazily. The hero has a matching responsive preload and high fetch priority. Every image has dimensions reserved to reduce layout shifts.

There are no external fonts, runtime packages, analytics or video downloads. The former animation library is no longer loaded. Production JavaScript is one deferred bundle (about 12 KB Brotli), and styles are about 8 KB Brotli. The standalone file embeds each photo exactly once. Production cache behavior and compression are covered by tests, with asset-size budgets to catch regressions.

These are measured file-size reductions, not Lighthouse scores or observed page-load timings. Actual loading speed depends on hosting, the network, device and browser.

## Verification and deployment status

The build, 20 automated tests, JavaScript syntax checks and HTML/CSS parsing pass. The desktop (1440 px), laptop (1024 px), small-tablet (800 px) and mobile (390 px) layouts, both navigation panels, keyboard focus states and every dialog (product, bag, saved gifts, search, gift finder, personalization, help, menu, booking and review) were rendered in headless Chrome and reviewed as screenshots, with no horizontal overflow at any width. Touch behavior, hover states and loading performance on physical devices have **not** been verified. The HTTP handler is tested without opening ports. No real WhatsApp message was sent during testing.

A private Sites destination was registered during the first version. Publishing was blocked because the environment could not resolve the source repository host. Its identity is retained in `atoz-studio/.openai/hosting.json`; no live deployment is claimed and no credentials are saved in the project.

The original reference domain could not be accessed. This update is an independent competitor concept, not a verified comparison of the other business's catalogue or services. It has no fabricated reviews or delivery promises. Payment processing and order fulfillment are not connected.

## Artwork

The existing five sample product images were created using the built-in image-generation tool, then optimized locally without changing their depicted content. Final responsive WebP files are in `atoz-studio/public/images/`; original JPEGs are retained there too.

Prompt direction: realistic artisan gift photography, soft natural window light, tactile paper and ceramic, warm ivory and rose, burgundy ribbons, restrained editorial composition, no logos or text. Subjects: wrapped gift boxes; a mug/candle/floral hamper; a heart-detail mug; an oak photo frame; and a dried floral bouquet. These depict illustrative sample merchandise.
