# Claude Code Prompt — Design Matters (DMA) Website Revision Round 1

> **Before pasting:** replace `<ORIGINAL_SITE_URL>` with the live/old Design Matters site URL, and confirm the repo path. Everything else is ready.

---

You are working on the production website for **Design Matters (DMA Architects & Designers)**, a Bangalore architecture and interior design practice led by **Ar. Kiran Hanumaiah**. I built and shipped this site; Kiran has now sent his first consolidated feedback round. Your job is to implement that feedback at a standard high enough that the client signs off in one pass.

This is a **refinement round, not a redesign.** Do not restructure the site, swap the type system, introduce a new visual language, or "improve" layouts that were not flagged. Every change below must look like it was always part of the original design.

---

## 0. Read this first

There is a folder in the repo root called `client insight/` (note the space — quote the path in every shell command). It contains three files. **Open and actually look at all three before writing any code:**

| File | What it is | What to do with it |
|---|---|---|
| `nice_page-retain_this_somewhere.jpg` | Screenshot of a page/collage Kiran explicitly likes and wants kept on the site. Also the cleanest reference for the brand's header, nav, logo lockup and palette. | Source of truth for brand colours + the collage layout to preserve (see §2.4) |
| `press.jpg` | Scans of Deccan Herald print features quoting Kiran / Design Matters | Content for the "Featured in Media" block (see §2.6) |
| `last_two_pages.pdf` | Last two pages of the DMA studio portfolio — a "Featured on Websites" collage of online publications, plus the closing studio-signage page | Content + visual reference for the "Featured on Websites" block (see §2.6) |

Also run a discovery pass before planning: read the existing component structure, the projects data source, the styling setup (Tailwind config / tokens / global CSS), and the image pipeline. Match existing conventions — file naming, data shape, component composition, animation approach. Do not add dependencies without asking me first.

**Stack context:** Next.js 15 (App Router), PostgreSQL, self-hosted VPS deployment. Animation via GSAP / ScrollTrigger / Lenis where already in use. The client-facing Studio+ dashboard is a separate concern — **do not touch dashboard code, auth, or schema in this round.**

---

## 1. Brand rules — non-negotiable

Colours sampled directly from `client insight/nice_page-retain_this_somewhere.jpg`:

| Token | Hex | Use |
|---|---|---|
| Bone / paper background | `#F3F4EE` | Global page background. This warm off-white, never pure `#FFFFFF`. |
| Graphite (primary text) | `#5A5C58` | Logo wordmark, nav, headings, body |
| Muted grey | `#8A8C88` | Inactive nav items, captions, metadata |
| Burnt orange (brand accent) | `#C0651A` | The "M" in **M**ATTERS, the underline rule under "Architecture+Design", active states, hairline accents |
| Divider grey | `#929290` | The full-width horizontal rule under the header |

**Verify these by sampling the screenshot yourself** rather than trusting the table — JPEG compression and antialiasing mean the true accent may sit a shade either side of `#C0651A`. If the codebase already has brand tokens defined, reconcile against them and flag any mismatch to me instead of silently changing either.

Discipline rules:
- Orange is an **accent, not a colour field.** It appears as thin rules, a single letter, hover/active states. Never as a button fill covering large area, never as a section background.
- The logo lockup is: `DESIGN` / `MATTERS` (with the M in orange) with a thin underline stroke, and `Architecture+Design` beneath with an orange rule under it. Do not restyle, recolour, re-space or re-case it.
- Typography stays as-is: geometric sans, wide letter-spacing on nav, generous whitespace. If you need a new text style, derive it from an existing one.
- The design language is **quiet, editorial, architectural**. Lots of negative space, images do the talking, no gradients, no drop shadows, no rounded "SaaS" cards, no decorative flourishes.

---

## 2. The change list

These are Kiran's words, translated into work. Implement all of them. Where he was ambiguous, I've marked **[ASK]** — surface those to me in your plan rather than guessing.

### 2.1 Homepage image quality (highest priority — his first complaint)

> *"Pictures in the first page not that clear and not impressive. Please use the images that show up in our original website as they are good. Mobile view looks good but the web view, the images don't look that good."*

Mobile is fine; **desktop/web view is the problem.** Diagnose properly before fixing — likely causes, in order:

1. Source assets are too small and being upscaled into large desktop containers. Pull the higher-resolution originals from `<ORIGINAL_SITE_URL>` and replace the current homepage assets.
2. Over-aggressive compression — check `next/image` `quality` (raise to 85–90 for hero/feature imagery) and any build-time optimisation squeezing them.
3. Missing or wrong `sizes` attribute, so the browser downloads a mobile-width candidate for a desktop-width slot. Every `next/image` on the homepage needs an accurate `sizes`.
4. Crop/art-direction: images composed for portrait mobile getting centre-cropped badly at wide aspect ratios. Where a hero crop is losing the subject, use art direction (different crop per breakpoint) rather than letting `object-cover` decide.

Requirements:
- Serve **2x for retina at the largest rendered desktop size**; no image should ever be upscaled beyond its intrinsic dimensions.
- Modern formats (AVIF/WebP) with fallback, `priority` on above-the-fold hero only, lazy elsewhere.
- Preserve LCP: after the fix, run a check and report before/after on homepage LCP and total image payload. Quality gain must not cost more than a reasonable amount of load time — if it does, tell me the tradeoff instead of silently picking.
- Optimised assets committed to the repo (or the media pipeline) — do not hotlink from the old site.

**Deliverable:** side-by-side before/after screenshots at 1440px and 1920px widths in your summary.

### 2.2 Woodsvale / Club Nadora reclassification

> *"Club Nadora should come under residential — Villa projects — project should be named 'Woodsvale' — Villas off Sarjapur Road. Club Nadora is inside the Woodsvale project."*

- Rename the project to **Woodsvale**, subtitle/location line: **Villas off Sarjapur Road**.
- Recategorise under **Residential → Villas**.
- **Club Nadora becomes a component *within* Woodsvale**, not a standalone project — present it as a section/sub-block on the Woodsvale project page (the clubhouse within the villa development), with its existing imagery carried over.
- Update every reference: project listing/filter, category counts, nav or filter chips, any homepage feature card, sitemap, and internal links.
- **Add a 301 redirect** from the old Club Nadora URL to the new Woodsvale URL so nothing 404s and existing SEO carries over. Update structured data / meta title / OG tags for the renamed project.

### 2.3 Life by the Lake — collaboration credit

> *"Life by the lake — pls mention done in association with Studio Parametric. The exterior pics of this project to be highlighted as the interior design was done by someone else."*

- Add a credit line on the project page: **"In association with Studio Parametric"** — set in the muted grey, placed with the project metadata (year / location / typology), styled consistently with existing metadata, not as a badge or callout.
- **Re-order the gallery so exteriors lead.** Exteriors get the hero and the first several slots and the larger grid cells; interiors move to a smaller, later group.
- Add a short, factual scope note so the split is unambiguous — e.g. *"Architecture and exterior design by Design Matters"*. **[ASK]** Confirm exact wording with me before shipping; a credit line is reputationally sensitive and Kiran should approve the phrasing verbatim.

### 2.4 Retain the collage

> *"Can we retain this collage somewhere in our website — it looks nice (attached)"*

The attached screenshot (`nice_page-retain_this_somewhere.jpg`) shows an asymmetric editorial image grid: one tall portrait image on the left (studio signage with the plumeria), a wide landscape image top-right (materials flat-lay — timber samples, swatches, an open book), and two images below it (the terracotta jaali with the chair, and the mural-walled meeting room).

- Rebuild this as a **reusable collage section component** that reproduces that composition: uneven column widths, deliberate gaps, images bleeding to different depths, generous bone-coloured negative space around it. Not a uniform 2×2 grid.
- Place it on the **About / Studio page** as the visual introduction to the practice (it reads as "who we are" imagery, not project work). **[ASK]** If you think the homepage is the stronger placement, make the case in your plan and I'll decide — do not place it in both.
- Responsive behaviour: collapse to a single-column vertical rhythm on mobile while keeping the alternating scale (some full-bleed, some inset), so it doesn't flatten into a boring stack.
- Subtle scroll-reveal only if the rest of the site already does this. No parallax, no hover zoom.
- Use the **original high-resolution versions** of these four photographs from the old site, not crops of the screenshot.

### 2.5 Team section — full rebuild

> *"Team to be highlighted and mentioned."*

**Roster — implement exactly:**

| Name | Designation |
|---|---|
| Kiran Hanumaiah | Principal Architect |
| Harshitha | Senior Architect |
| Jerin Sabu | Senior Architect |
| Pallavi VK | Senior Architect |
| Divya | Architect |
| Diya | Architect |
| Prathamesh | Architect |
| Nidhi | Architect |
| Anusha Kolli | Architect |

- **Remove entirely:** Keerthana, Maitri Shah, Shefreen (they have left the firm). Remove their photos and any other on-site mentions — check testimonials, project credits and blog/journal content too, not just the team page.
- **Only the people listed above get photos.** No other headshots anywhere in the team section.
- **Kiran's photo** must be sourced from `<ORIGINAL_SITE_URL>` (he specifically pointed at it).
- **[ASK]** I do not have headshots for Divya, Diya, Prathamesh, Nidhi or Anusha Kolli. Build the component so a missing photo degrades gracefully — a clean bone-toned placeholder with initials in graphite, consistent aspect ratio, never a broken image or a stock avatar. Flag the missing assets in your summary as a list I can send back to Kiran.
- **[ASK]** Full/spelled names for Divya, Diya, Prathamesh and Nidhi weren't given (surnames missing). Render exactly as written above and flag it — I'll confirm with Kiran.
- **Hierarchy in layout:** Principal presented distinctly (larger, or its own row), then Senior Architects, then Architects. Grid alignment stays consistent; uniform grayscale-or-not treatment across all photos — pick one and apply it universally.
- **Team culture block:** add studio/team photographs plus the **team outing video** that existed on the original site. Video must be self-hosted or embedded lightweight, muted, lazy-loaded, poster image set, `playsInline`, never autoplay with sound, and must not block LCP or ship a heavyweight embed player on initial load.
- Make the roster **data-driven** (a single array/JSON or DB table with name, designation, order, image, optional bio). Kiran's team will change again — the next update should be a one-line data edit, not a component rewrite. Sort by explicit order field, not by array position accident.

### 2.6 Press & publications section (new)

> *"Projects published in websites / Buildofy to be mentioned. Pls refer our portfolio page attached for reference."*

Build a **Press / Featured** section — this is credibility real estate, so treat it as a designed section, not a link dump. The portfolio pages in `client insight/` show the intended two-part structure: **Featured on Websites** and **Featured in Media**.

**Featured on Websites** — build from these exact URLs (verify each resolves; fetch title, publication date and lead image where permitted):

*Buildofy (Kiran notes this is a highly regarded platform — give it visual priority):*
- https://www.buildofy.com/projects/split-level-residence-bengaluru-karnataka
- https://www.buildofy.com/projects/shambhavi-bengaluru-karnataka

*The Architects Diary:*
- https://thearchitectsdiary.com/this-compact-house-design-is-rooted-in-tradition-design-matters/
- https://thearchitectsdiary.com/this-30-x-40-plot-nestled-in-the-heart-of-south-bengaluru-design-matters/
- https://thearchitectsdiary.com/a-house-where-design-can-bring-in-lots-of-sunshine-design-matters/
- https://thearchitectsdiary.com/a-bright-airy-4bhk-contemporary-home-enriched-with-plenty-of-ventilation-design-matters/
- https://thearchitectsdiary.com/minimalist-house-design-with-traditional-indian-elements-design-matters/

**Featured in Media** — from `press.jpg`: Deccan Herald print features in which Kiran Hanumaiah / Design Matters is quoted as an expert source (skylights & natural light, kitchen design, gazebos and pergolas). Read the scans carefully and transcribe headlines, publication and bylines accurately — **do not invent or approximate a headline, date or writer's name.** If a detail in the scan is not legible, leave it out and flag it to me rather than guessing. Do not reproduce article body text; a headline, publication name and date is the correct amount.

Implementation requirements:
- Each entry: publication logo/wordmark or name, headline, project name, year, and for online pieces an outbound link (`target="_blank"`, `rel="noopener noreferrer"`).
- Cross-link each press item to the corresponding **project page on the DMA site** where one exists (Shambhavi, the 30×40 plot, the 4BHK, etc.) — this is the SEO and navigation win.
- For print scans, display them as tasteful thumbnails that open a lightbox of the full scan. Keep scans as optimised images with descriptive `alt` text.
- Add the section to the main navigation **[ASK]** — either as its own `Press` nav item or as a section within `About`. Recommend one in your plan; nav changes need my sign-off.
- Add `Article`/`CreativeWork` structured data where appropriate.

### 2.7 Testimonials

> *"Testimonial pages… can be made more interesting with pictures"*

- Rework testimonials to pair each quote with imagery — ideally the **project the client is talking about** (strongest option: quote sits beside a photograph of their own home). Client portraits only where we actually have them.
- Keep quotes as the typographic focus: generous size, restrained styling, attribution in muted grey with name, project and location.
- No carousel auto-rotation that steals control from the reader; if a slider exists, it must be swipeable, keyboard-navigable, pausable, and have visible controls.
- **[ASK]** Flag which testimonials currently lack an associated project image so I can request assets from Kiran.

---

## 3. Quality bar — what "done" means

Nothing ships until all of these hold:

**Visual**
- Renders correctly at 320, 375, 768, 1024, 1440, 1920 and 2560px. Desktop is where the client is judging this — check the wide breakpoints most carefully.
- Vertical rhythm and horizontal margins match the existing system exactly. No section that feels bolted on.
- Zero layout shift on image load (explicit dimensions / aspect-ratio everywhere). CLS < 0.1.

**Technical**
- No TypeScript errors, no ESLint errors, no console warnings in dev or prod build.
- `next build` passes clean.
- Lighthouse on homepage, About and a project page: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95. Report the actual numbers.
- All images have meaningful `alt` text (describe the architecture, not "image").
- Keyboard navigable throughout; visible focus states in the brand accent; semantic headings in order.
- No broken links — crawl the site and verify, including the new outbound press links and the Club Nadora → Woodsvale redirect.

**Content integrity**
- Every name, designation, project name, headline and URL matches the source data in this brief **character for character**. Spelling a team member's name wrong is the single most embarrassing failure mode here. Double-check the roster against §2.5 as a final step.

---

## 4. How to work

1. **Plan first.** Before touching code: read `client insight/` and the codebase, then give me a written implementation plan — file-by-file, with your reasoning on the image-quality diagnosis, your recommendation on the two placement **[ASK]** items, and a consolidated list of every asset and answer you need from Kiran. Wait for my approval.
2. **Then execute** in the order above (image quality first — it's his loudest complaint and the most visible win).
3. **Commit per logical change** with clear messages (`fix(home): replace upscaled hero assets with 2x originals`), not one giant commit.
4. **Do not guess on content.** If a name, a credit line, a headline or a URL is uncertain, stop and ask. Wrong content is worse than missing content on a client-facing site.
5. **Do not touch** the Studio+ dashboard, auth, database schema, or anything outside this change list. If you spot a bug elsewhere, note it in your summary — don't fix it inline.

**Final output I need from you:**
- A **change log** mapping each of Kiran's numbered points → what was done → where to see it (page + section).
- **Before/after screenshots** for §2.1 and any layout-affecting change.
- A clean, non-technical **"Changes made" note I can forward to Kiran directly**, written in his language (project names and sections, not file paths).
- The **outstanding asset/answer request list** for Kiran, as a single numbered list.
