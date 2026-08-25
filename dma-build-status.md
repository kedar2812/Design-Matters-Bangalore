# Design Matters, build status

Audited 25 August 2026 against the build spec (`DPR_DMA.md`) and both
discovery form responses. Everything below was checked against the running
site, not against the plan.

**Where it is running:** https://srv1816472.hstgr.cloud

**Headline:** the site and the dashboard are built and working. The one
thing standing between this and "live" is the DNS cutover, which is a
client decision, not remaining work.

---

## 1. Website Discovery form

| What you asked for | Status |
|---|---|
| Premium / classy / designer, warm and human | Built |
| Pages: Home, Projects, About, Services | Built, plus Press, Testimonials, Contact, Journal |
| Project pages lead with hero photography | Built |
| Handles a mix of professional and phone shots | Built |
| Enquiring is the main call to action | Built. Enquiry form on every page, plus one-tap WhatsApp |
| Enquiries reach you in the dashboard | Built |
| Enquiries reach you on WhatsApp | Built |
| Enquiries reach you by email | Built, **not switched on** (see 4.2) |
| English only | Built |
| Instagram linked | Built |
| Keep the existing domain | **Not yet pointed at the new site** (see 4.1) |
| A written philosophy statement, "I'll provide it" | **Never received.** There is a holding statement on the About page in the meantime |

## 2. Studio Discovery form (the dashboard)

| What you asked for | Status |
|---|---|
| Replace the Excel enquiry tracking | Built |
| Project fields: title, year, location, area, team, description | Built |
| Save unfinished projects as drafts | Built |
| Control the order projects appear in | Built, drag to reorder |
| Capture name, phone, email, budget, location | Built, all five |
| WhatsApp reply button on each lead | Built |
| Metrics: total enquiries, this month, most viewed projects, visitors | Built, own analytics, no third-party tracking |
| A colleague uses it too | **One login exists.** Needs their email to create a second (see 4.4) |
| Categories: Residential, Commercial, Hospitality, Institutional, Interiors | Partly. Three have their own pages because three have built work. Commercial and Hospitality projects can be added today and appear in the portfolio; they get their own page when there is work to put on it |

The dashboard passes **35 automated end-to-end checks** covering login,
creating and editing a project, gallery upload and reorder, lead stages,
notes, deletion, analytics and the notification panel. No console errors.

## 3. Build spec, section by section

| Section | Status |
|---|---|
| 1. Stack (Next.js 15, Postgres, Prisma, Auth.js, Lenis/GSAP/Framer) | As specified, nothing substituted |
| 2. App structure | As specified |
| 3. Data model | As specified, plus lead activity history |
| 4. Public pages | Built. Filterable project index, narrative project pages, previous/next navigation, contact with map and WhatsApp |
| 5. Studio dashboard | Built, all five screens |
| 6. Motion rules | Built, full reduced-motion support |
| 7. Design system | Built |
| 8. Performance targets | **Met on desktop**, see below |
| 9. SEO | Built, scores 100. Search Console submission waits on the domain |
| 10. Deployment | Built, with the exceptions in section 4 |
| 11. Scope | Everything in scope is built |

### Performance, measured on the live site

| | Target | Desktop | Mobile (throttled 4G) |
|---|---|---|---|
| Lighthouse performance | 95+ | **95 to 98** | 92 |
| Largest contentful paint | under 1.5s | **0.8 to 1.1s** | 3.1s |
| Layout shift | under 0.1 | **0.004** | 0 |
| Blocking time | under 100ms | **0ms** | 60ms |
| Accessibility | — | **100** | |
| Best practices | — | **100** | |
| SEO | — | **100** | |

Desktop meets every target in the spec. Mobile is good but not
exceptional; the limit is the size of the hero photographs over a slow
connection, and it can be improved further if you want it.

## 4. What is outstanding

### 4.1 The domain (the only launch blocker)

The new site answers on the Hostinger address. Nothing points the studio's
own domain at it yet:

- `designmattersblr.com` is a **parked GoDaddy page**
- `designmattersarchitects.com` is **still the old Wix site**

To go live: decide which domain is the real one, point it through
Cloudflare at the server, reissue the certificate, and update the site
address in the server config. The redirects that send every old Wix URL to
its new page are already written and tested; they start working the moment
the domain moves.

Two related things are deliberately waiting on this:

- **Cloudflare is not in front of the site yet.** The spec puts it there
  for CDN and DDoS protection. It goes in as part of the cutover.
- **The staging address refuses search engines.** Otherwise Google indexes
  the whole portfolio under the Hostinger hostname and the real domain has
  to win those pages back later. This lifts automatically at cutover.

### 4.2 Email notifications

Built and tested, switched off. It needs a Resend account created by the
studio (it has to be theirs, for account recovery) and three DNS records.
Until then enquiries still arrive in the dashboard and on WhatsApp, and
each enquiry shows honestly that it was not emailed, with a button to send
it once the account exists. Details in `SETUP-EMAIL.md`.

### 4.3 Copy and photography still owed

Listed in full in `dma-round-2-what-we-still-need.md`:

- the Praangana Heritage write-up (the note said it was attached; only
  images came through)
- a sentence or two per person for the team page
- the philosophy statement promised on the discovery form
- locations, years and areas for the four newest projects
- photographer credits

None of these block launch. Each one has a place waiting for it.

### 4.4 A second dashboard login

Only Kiran has an account. Send the colleague's email address and one is
created in a minute.

### 4.5 One spec item deliberately not built

The spec lists a journal teaser on the home page. Both discovery forms
said no to a blog, so the journal exists and works but is not promoted on
the home page and is not indexed. Say the word and the teaser goes in.

## 5. Fixed during this audit

These were found by checking rather than reported, and are already live:

- **Nightly database backups were not running.** The spec calls for them.
  Now runs at 02:30 daily, keeps 14 days, verified working.
- **fail2ban was not installed.** The spec calls for it. Now active on SSH.
- **HTTP/2 was off** in the web server. Now on.
- **Two real accessibility defects.** One paragraph rendered at a contrast
  of 1.17:1, which is effectively invisible, and an invalid ARIA attribute
  made a headline read wrongly in a screen reader. Accessibility went from
  93 to 100.
- **Oversized images.** Laptops were being served images a third larger
  than they could display. Performance went from 92 to 95 to 98, and
  largest contentful paint from 1.5s to under 1.1s.
