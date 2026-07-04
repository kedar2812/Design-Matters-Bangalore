# Design Matters — Bangalore

A custom-built website and studio dashboard for **Design Matters Architects**, an architecture and interior design practice based in Indiranagar, Bengaluru, led by Ar. Kiran Hanumaiah since 2011.

This is not a template. Every screen — public and internal — was designed and built specifically for how an architecture studio presents its work and runs its practice.

## The website

A photography-first, editorial portfolio. Restrained by intention: warm paper-like surfaces, a characterful serif for headlines, drafting-style rules and dimension labels as the one signature detail, and motion that's only there when it helps you experience the work.

- **Home** — full-bleed hero, selected work, the studio in one line
- **Projects** — filterable index of built work; each project told as a story, concept → process → result, with a drawing-title-block of facts (location, year, typology, area, team)
- **About** — the studio's story, the principal, the team, and how they work
- **Services** — architecture, interiors and consultation, with the process from brief to handover
- **Journal** — notes from the studio, written and published in-house
- **Contact** — enquiry form that lands directly in the studio's own pipeline, plus one-tap WhatsApp

Built to be fast on real phones and real networks, accessible, and search-friendly from day one — clean URLs, proper metadata and structured data throughout.

## The studio dashboard

A private workspace at `/studio` for the Design Matters team — no third-party CMS, no generic admin panel. It speaks the studio's language:

- **Overview** — what needs attention today, at a glance
- **Projects** — add and edit work, upload and reorder photography by drag, control what's live on the site and in what order
- **Enquiries** — every enquiry from the site lands here and moves through a simple pipeline: new → contacted → in discussion → won/lost, with private notes per client
- **Journal** — write, edit and publish entries with a clean block editor
- **Analytics** — first-party and privacy-friendly: visits, top pages, which projects draw attention, and where enquiries come from. No cookies, no trackers, nothing sent to third parties.

## Under the hood (briefly)

Next.js, PostgreSQL and Tailwind CSS, fully self-hosted on a single VPS with Cloudflare in front. Media is processed and stored on the server. One codebase, no external paid services, no lock-in.

## Running locally

```bash
npm install
cp .env.example .env    # fill in database URL and secrets
npx prisma migrate dev  # create the schema
npx prisma db seed      # seed projects + admin user
npm run dev
```

The site runs at `http://localhost:3000`; the dashboard sign-in is at `/login`.

---

© Design Matters Architects, Bengaluru. All project names, content and photography belong to the studio.
