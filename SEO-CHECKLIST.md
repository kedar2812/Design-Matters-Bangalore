# SEO checklist — Design Matters Architects

Audited against **DPR §9 (SEO — build in, not bolt on)** and §11's "on-page
SEO pass; full technical SEO" scope line, on **2026-08-10**, and
**re-verified against the running site on 2026-08-27** after revision
round 2 added four projects and rebuilt the About page.

The re-audit crawled all 32 sitemap URLs on the live server and read the
rendered `<head>`, the JSON-LD, the Open Graph tags, the `<h1>` count and
every `<img>`, then replayed all 35 old Wix URLs against the new site.
Three things had drifted. **All three were fixed and deployed on
2026-08-28**, and §9 records what they were and how they are now
prevented rather than merely corrected. Everything else was confirmed
still true.

Legend: `[x]` done and verified against the running production build ·
`[ ]` open, with who it is waiting on.

Verification method: `npm run build` → `next start` → crawl every route in
the sitemap, reading the rendered `<head>`, the JSON-LD blocks, the HTTP
status codes and the redirect chain. Nothing below is ticked from reading
source alone.

---

## 1. Crawlability & indexing

- [x] **`robots.txt`** generated at `/robots.txt` (`app/robots.ts`). Allows
      everything except `/studio/`, `/login`, `/api/` and
      `/studio-disabled-404` (the no-database rewrite target).
- [x] **`/journal` deliberately NOT blocked in robots.txt.** The client
      opted out of a public blog, so those pages carry `noindex` — but a
      crawler has to be allowed to fetch a page to read that. Blocking the
      path would hide the directive and leave the URLs eligible for
      index-without-content on the strength of an external link. Unlinked
      + `noindex` + absent from the sitemap is the correct combination.
- [x] **`sitemap.xml`** generated at `/sitemap.xml` (`app/sitemap.ts`),
      rebuilt hourly, driven by published projects — **32 URLs** as of
      2026-08-27 (was 28; round 2 added four projects).
- [x] **`lastModified` on every entry.** Project pages use their own
      `updatedAt`; the static pages use the most recent project edit,
      which is the closest honest proxy for "when did this site change".
- [x] **Image sitemap** — **162** `<image:loc>` entries (was 117). Every hero and gallery
      frame is now offered to Google Images, which for architecture is a
      real front door and was previously discoverable only by rendering
      the page.
- [x] **Sitemap referenced from robots.txt.**
- [x] **Draft projects excluded** — the sitemap reads `getPublishedProjects`.
- [x] **Dashboard, login and API `noindex`** at the route level as well as
      in robots.txt.
- [x] **404s return a real 404 status** and carry `noindex`, plus a title
      (they had none — an untitled tab on a stale inbound link).

## 2. Per-page metadata

- [x] **Every indexable route has its own title and description.** No page
      falls through to a generic default. Re-verified across all 32 URLs
      on 2026-08-27 — including the four projects added in round 2.
- [~] **Titles rewritten to survive truncation.** Done in the 2026-08-10
      pass; **nine titles have since drifted back over the limit** and are
      tracked in §9.1. The rule still holds: the template appends
      ` — Design Matters Architects` (28 characters), so anything over
      ~60 loses the studio's name, which is the half a searcher
      recognises.
- [x] **Duplicate-brand titles fixed.** `/projects/woodsvale` had a
      dashboard `metaTitle` ending in "| Design Matters", and the template
      appended the brand again — 81 characters, brand twice. A stored
      title that already names the studio is now treated as absolute, so
      this cannot recur from a dashboard entry.
- [x] **Descriptions inside ~160 characters.** Home, About and Services
      were 171–221 and would have been truncated and likely rewritten by
      Google from the body copy. Re-checked 2026-08-27: the longest is now
      159, on `/services`.
- [x] **Category descriptions clipped at a sentence**, not mid-word at 300
      characters as before.
- [x] **Canonical URL on every page**, absolute, from `NEXT_PUBLIC_SITE_URL`.
- [x] **Clean URLs** — `/projects/<slug>`, no query strings, no IDs.
- [x] **`lang="en-IN"`** (was `en`).
- [x] **`max-image-preview:large`** declared for Googlebot, which is what
      permits a full-width photograph in the result — most of the click
      for a portfolio site.
- [x] **Search Console / Bing verification hooks** — `GOOGLE_SITE_VERIFICATION`
      and `BING_SITE_VERIFICATION` env vars render the meta tags when set.
      No code change needed at deploy.

## 3. Structured data (JSON-LD)

- [x] **Organization + ProfessionalService** (site-wide), now including
      `image`, `logo`, `hasMap`, `alternateName` and an expanded
      `knowsAbout` / `areaServed`. Google's LocalBusiness guidance treats
      `image` as required; without it the knowledge panel has nothing.
- [x] **WebSite** node — what Google reads to decide the site name printed
      above a result. No `SearchAction`: the site has no search endpoint,
      and declaring one that 404s is a broken promise to a crawler.
- [x] **BreadcrumbList** on category and project pages. This is the one
      type here with a visible payoff — Google replaces the raw URL with
      the trail, so a listing reads *Design Matters › Residential ›
      Woodsvale* instead of a slug.
- [x] **CreativeWork per project**, now carrying the whole gallery in
      `image` rather than the hero alone.
- [x] **Service / ItemList on `/services`**, generated from the same
      dashboard copy the page renders.
- [x] **AggregateRating + Review on `/testimonials`**, attached to the
      Organization by `@id` so it reads as one entity.
- [x] **ItemList of Article citations on `/press`.**
- [x] **All nodes cross-referenced by `@id`** rather than repeating the
      studio's details, so search engines resolve one entity.
- [x] **Instagram `sameAs` confirmed** (2026-08-27). The handle is
      `designmattersarchitects`, **without** a trailing underscore. The
      site had been using the underscore since the first import; it is
      corrected in `lib/content-defaults.ts`. A wrong `sameAs` weakens
      entity resolution, so this was worth settling before the cutover.
      No `SiteSetting` override exists on the live database, so the
      default is what renders once redeployed.

## 4. Social / link previews

- [x] **The Open Graph image was a 404 and is now fixed.** The root layout
      pointed at `/uploads/placeholders/vivek-residence-hero.jpg`;
      `scripts/import-client-projects.ts` deletes that whole directory
      once real photography lands. Every link the studio has shared on
      WhatsApp, LinkedIn or Instagram since that import has previewed with
      no image. Replaced with `/public/og-default.jpg` — a real 1200×630
      photograph, in `/public` where the import pipeline cannot sweep it.
- [x] **`og:image:width` / `height` / `alt`** declared, so platforms lay
      the card out before the image loads.
- [x] **`og:url`, `og:type`, `og:locale=en_IN`, `og:site_name`** — on
      every page, built by `pageOpenGraph()` in `lib/seo.ts` rather than
      inherited. Two gaps found on 2026-08-27 and fixed the next day; see
      §9.2 and §9.3 for why they could happen at all.
- [x] **`twitter:card=summary_large_image`** with image.
- [x] **Project pages set `og:type=article`** and their own hero image.

## 5. Icons

- [x] **The favicon was Vercel's black triangle** — the Next.js default,
      byte-for-byte. Google renders the favicon beside the listing in
      mobile search, so the studio's result was carrying another
      company's logo. Replaced with a `DM` monogram on the site's ink
      ground (`scripts/make-icons.ts`).
- [x] **`favicon.ico` at 16/32/48** — Google's favicon crawler rejects
      anything that is not a multiple of 48.
- [x] **`icon.png` (512)** and **`apple-icon.png` (180)** added; neither
      existed.

## 6. On-page content & keywords

- [x] **"Bangalore" now appears in the site's search surface.** It
      appeared **zero** times before this pass against 27 uses of
      "Bengaluru" — and "architects in Bangalore" is queried several times
      more often than the same phrase with Bengaluru, because the official
      rename never reached the way people type. The prose keeps the
      studio's spelling; Bangalore enters through titles, descriptions,
      `alternateName` and `areaServed`.
- [x] **Keyword list documented in `lib/seo.ts`** with the reasoning, and
      emitted as `<meta name="keywords">`. Note honestly: **Google has
      ignored that tag since 2009.** It is there for Bing/Yandex's weak
      signal and costs forty bytes. The list matters as the checklist the
      titles, headings and alt text are written against — not as a tag.
- [x] **Category pages carry the money phrases in their titles** —
      "Residential Architects in Bangalore", "Interior Designers in
      Bangalore", "Institutional Architects in Bengaluru". These are the
      studio's main non-brand search surface.
- [x] **Every phrase targeted is one the site can answer.** "Architects in
      Indiranagar" earns its place because the studio is in Indiranagar.
      Nothing aspirational is targeted — a ranking for a query the pages
      do not serve buys a visit that bounces.
- [x] **Semantic HTML, one `<h1>` per page**, verified on all 28 routes.
- [x] **`alt` text on every image** — checked programmatically again on
      2026-08-27 against the rendered HTML: 94 `<img>` elements across
      eight representative pages, **none missing `alt`**. They are
      descriptive sentences, not keyword lists. One deliberate exception:
      `components/site/CategoryPortals.tsx` uses `alt=""` on the three
      practice-area cover photographs, because the link already carries
      the category name and a screen reader would otherwise hear it
      twice. Those three frames are still in the image sitemap, so
      nothing is hidden from Google Images.
- [x] **Studio address in a real `<address>` element** in the footer, on
      every page, matching the `PostalAddress` in the JSON-LD. That
      agreement is what "NAP consistency" actually means.

## 7. Migration from the Wix site

- [x] **All 38 old URLs now 301 to the new site** (`next.config.ts`).
      **Replayed against the running server on 2026-08-27: 35 of 35
      redirectable URLs answered 301** (the other three are the old root
      plus `/about` and `/contact`, which are excluded below). This
      was the largest remaining risk: the day the domain points at this
      server, every one of those becomes a 404 and fifteen years of links
      and rankings go with it.
- [x] **The mapping was read off the live old pages, not inferred from
      their slugs** — on that site the two disagree. Wix's duplicate-page
      flow left `copy-of-` URLs that were then filled with entirely
      different projects: `/copy-of-neeraj-residence` is Vivek Residence,
      `/copy-of-soumya-and-chetan-s-residence` is the Jibeesh residence,
      `/copy-of-mvm` is the Badami public library. Every line was
      confirmed against the `<title>` of the page it redirects away from.
- [x] **Projects that did not carry over redirect to their practice area**
      rather than to the home page; anything whose type the old page did
      not establish goes to `/projects` rather than to a guess.
- [x] **301 rather than 308** (`statusCode: 301`, not `permanent: true`) —
      search engines honour both, but a lot of SEO tooling still reports
      308 as a soft/unknown redirect.
- [x] **`/about` and `/contact` deliberately excluded** — same path on
      both sites; a redirect would be a loop.
- [x] **`/projects/club-nadora-woodsvale` → `/projects/woodsvale`** (from
      revision round 1) still in place.

## 8. Performance (SEO-relevant — DPR §8)

- [x] AVIF/WebP, tuned `deviceSizes` ladder, 30-day optimizer cache.
- [x] Fonts self-hosted at build; no runtime Google requests.
- [x] Above-fold entry animations are CSS-only so LCP is not re-stamped.
- [x] `poweredByHeader: false`; `nosniff` / `X-Frame-Options` /
      `Referrer-Policy` set.
- [x] **The Kabini video no longer ships a 9:16 source into a 16:9 frame.**
      It was `object-cover`-ing a 720×1280 clip into `aspect-video`,
      throwing away two thirds of every frame and enlarging the rest —
      which is what made it look poor. Now framed 9:16 at four columns,
      where the 720px source lands at ~2× density.

---

## 9. Found by the 2026-08-27 re-audit — fixed 2026-08-28

All three were regressions against items ticked above, all three were
ours rather than the client's, and each is now prevented in code rather
than corrected by hand. Deployed and re-verified against the live server:
all 32 sitemap URLs clean.

### 9.1 Nine titles had drifted back over the truncation limit — fixed

The 2026-08-10 pass brought every title inside the limit by editing them
one at a time. That fix could not survive content being added, and it did
not: round 2's four new projects and the rebuilt About page put nine back
over, the worst at 72 characters. Generated project titles had no length
guard at all, so the tenth project would have done it again.

`seoTitle(main, optional?)` in `lib/seo.ts` is now the guard. It gives up
what is cheapest to lose, in order:

1. `main` plus `optional` when both fit. `optional` is the city on a
   project page: worth having when there is room, never worth the
   studio's name.
2. `main` alone under the full 28-character brand.
3. `main` under the short brand (` | Design Matters`), returned
   `absolute` so the template does not append the long one on top.

Step 3 is what the practice-area pages needed. "Residential Architects in
Bangalore" is the money phrase and must not be trimmed to make room for
the brand, so the brand gives way instead.

| Page | Was | Now |
|---|---|---|
| `/projects/badami-cbse-school-and-montessori` | 72 | 50 |
| `/projects/the-green-terraces-keya-homes` | 69 | 58 |
| `/services` | 67 | 56 |
| `/about` | 66 | 55 |
| `/projects/soumya-and-chetan-residence` | 66 | 55 |
| `/projects/institutional` | 65 | 54 |
| `/projects/the-minimal-indian-house` | 64 | 53 |
| `/projects/residential` | 63 | 52 |
| `/projects/life-by-lake-keya-homes` | 63 | 52 |
| `/projects` | 62 | 51 |

**The home page stays at 61**, one over the budget every other page is
held to. It already uses the short brand, so there is nothing left to
trim but the query itself, and Google truncates on pixel width rather
than a character count. The reason is written where the title is set, so
the next audit does not churn it.

### 9.2 The practice-area pages had no `og:image` or `og:type` — fixed

`categoryMetadata()` returned its own `openGraph` object containing only
a title and a URL. **Next.js does not merge `openGraph` into the
parent's** — a page that declares one replaces the root layout's
entirely — so `images`, `type`, `siteName` and `locale` were all dropped
on `/projects/residential`, `/projects/interiors` and
`/projects/institutional`.

Sharing any of those three on WhatsApp, LinkedIn or Instagram produced a
card with no photograph, and §6 calls them the studio's main non-brand
search surface. `twitter:image` still resolved, because `twitter` is a
separate metadata key and was not overridden — so the failure was
invisible on Twitter/X and present everywhere else, which is why it
survived the first audit.

The three now carry **the same photograph the page itself opens on**,
with a written `og:image:alt`, rather than the generic site card.

### 9.3 `og:url` was the site root on seven pages — fixed

`app/layout.tsx` set `openGraph.url = "/"`, and any page that did not
override it inherited the root. `/`, `/projects`, `/about`, `/services`,
`/contact`, `/press` and `/testimonials` all advertised the home page as
their canonical social URL. The `<link rel="canonical">` tags were
correct throughout, so this was only the Open Graph surface — but a
shared About link could resolve to the home page, and engagement merges
across pages that are not the same page.

### The fix that matters more than either

Both 9.2 and 9.3 are the same bug seen from two sides: `openGraph` is
replaced wholesale, so declaring a partial one is a silent way to delete
the rest. **`pageOpenGraph({ path, type?, image?, imageAlt? })` in
`lib/seo.ts` now builds the whole block for every page**, and `path` is
required. A page cannot now declare a partial Open Graph block, and
cannot inherit somebody else's URL.

Verification, on the live server after deploy: every one of the 32
sitemap URLs has its own `og:url`, an `og:image` that returns 200, an
`og:type`, `og:site_name`, `og:locale`, exactly one `<h1>`, an absolute
canonical and a title inside the limit.

## 10. Open — waiting on the client

- [ ] **Submit the sitemap to Google Search Console and Bing Webmaster
      Tools** (DPR §9, explicitly a deploy step). Needs the client to
      create/own the properties; the verification meta tags are already
      wired to env vars, so this is paste-and-redeploy.
- [ ] **Google Business Profile.** For "architects in Bangalore" the map
      pack usually outranks every organic result, and it is not something
      the website can do on its own. The `ProfessionalService` schema is
      ready to corroborate it — same name, address and phone.
- [ ] **Opening hours and price range** for the LocalBusiness schema. Both
      are Google-recommended local fields and both were deliberately left
      out rather than invented.
- [ ] **Houzz profile URL** — `sameAs` has an empty slot, and the About
      copy already claims three years of Best of Houzz awards.
- [ ] **Whether "Bangalore" may appear in visible body copy.** Right now it
      is confined to titles, meta and schema. One natural sentence on the
      home or About page would help, but it is the studio's voice to
      change, not ours.
- [ ] **Story content for the remaining projects.** Several project pages
      are photography with a thin title block; thin pages rank thin.

## 11. Open — deploy-time, at DNS cutover

- [ ] **Rebuild with the real `NEXT_PUBLIC_SITE_URL`.** It is baked in at
      build time and feeds every canonical, the sitemap, the OG image URL
      and every `@id` in the JSON-LD. A cutover without a rebuild leaves
      the whole site canonicalised to `srv1816472.hstgr.cloud`.
- [ ] **Pick one hostname and 301 the other** (`www` vs apex) at Nginx or
      Cloudflare, matching whichever `NEXT_PUBLIC_SITE_URL` names. The old
      site is on `www.designmattersarchitects.com`.
- [ ] **Force HTTPS** and keep HTTP→HTTPS at 301.
- [ ] **In Search Console, use the Change of Address tool** once both the
      old Wix property and the new one are verified.
- [ ] **Re-crawl the 38 redirects against the live domain** after cutover.

## 12. Out of scope (DPR §11 "OUT")

Keyword research as an ongoing service, content strategy, article writing,
backlink/off-site work, paid ads and directory citations are explicitly
excluded from the Studio+ plan. The keyword list in `lib/seo.ts` is the
on-page pass that *is* in scope, not a research deliverable. If ongoing support 
is required, refer to original proposal and revert with confirmation.
