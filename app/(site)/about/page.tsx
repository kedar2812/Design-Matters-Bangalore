import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { Entry } from "@/components/motion/Entry";
import { TextScrub } from "@/components/motion/TextScrub";
import { EnquirySection } from "@/components/site/EnquirySection";
import { PressBand } from "@/components/site/PressBand";
import { PrincipalSection } from "@/components/site/PrincipalSection";
import { SectionHead } from "@/components/site/SectionHead";
import { StudioCollage } from "@/components/site/StudioCollage";
import { StudioCulture } from "@/components/site/StudioCulture";
import { TeamSection } from "@/components/site/TeamSection";
import { getIdentity, getSection } from "@/lib/settings";
import { pageOpenGraph, seoTitle } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: seoTitle("About the Studio & Ar. Kiran Hanumaiah"),
  description:
    "A Bangalore architecture and interior design studio founded in 2011 by Ar. Kiran Hanumaiah. Meet the eleven-strong team and the thinking behind the work.",
  alternates: { canonical: "/about" },
  openGraph: pageOpenGraph({ path: "/about" }),
};

export default async function AboutPage() {
  const [site, about] = await Promise.all([getIdentity(), getSection("about")]);

  return (
    <main className="pb-section pt-36">
      {/* Who We Are.
          The client's own copy, verbatim, and the first thing on the page
          when it loads, which is what round 3 asked for. Laid out the way
          digitalbluefoam.com/company/team opens: ruled monospace eyebrow,
          a large heading, then the paragraph set wide and left rather than
          indented into the middle of a twelve-column grid the way this
          page used to do it. */}
      <section className="px-gutter">
        <SectionHead
          as="h1"
          eyebrow={about.eyebrow}
          heading={about.heading}
        />
        <Entry className="mt-10 max-w-3xl">
          <div className="space-y-6 text-lg leading-relaxed text-ink-soft">
            {about.story.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </Entry>
      </section>

      {/* The studio, in pictures, the collage from the old About page,
          kept at Kiran's request (§2.4). It sits here, straight after the
          story, because it reads as "who we are" rather than as work. */}
      <section className="mt-section px-gutter" aria-label="The studio">
        <StudioCollage />
      </section>

      {/* Philosophy */}
      <section className="mt-section px-gutter">
        <div className="rule pt-8">
          <Reveal>
            <p className="mono-label mb-8">{about.philosophyEyebrow}</p>
          </Reveal>
          <TextScrub as="blockquote" className="font-display text-h1 max-w-5xl">
            &ldquo;{about.philosophyQuote}&rdquo;
          </TextScrub>
          <Reveal>
            <p className="mono-label mt-8 text-brass">
              {site.principal}, {site.principalTitle}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Principal, portrait, name and bio in one block on its own surface.
          This used to be a text-only section with the portrait appearing
          again inside the roster below; Kiran was on the page twice and
          fully neither time. */}
      <PrincipalSection
        eyebrow={about.principalEyebrow}
        bio={about.principalBio}
        founded={site.founded}
      />

      {/* Recognized for Excellence.
          The client's three lines, in the reference page's bordered cell
          grid rather than as three floating columns of text. Same rule
          treatment as the roster below it, so the two read as one system. */}
      <section className="mt-section px-gutter" aria-labelledby="recognition-heading">
        <div id="recognition-heading">
          <SectionHead
            eyebrow="The record"
            heading={about.recognitionHeading}
            intro={about.recognitionIntro}
          />
        </div>
        <ul className="mt-14 grid border-l border-t border-hairline md:grid-cols-3">
          {about.recognition.map((item, i) => (
            <li key={item.title} className="list-none border-b border-r border-hairline">
              <Reveal delay={(i % 3) * 0.08}>
                <div className="flex h-full flex-col p-6 sm:p-8">
                  <p className="mono-label text-brass">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="font-display text-h3 mt-4 leading-tight">{item.title}</h3>
                  <span aria-hidden className="mt-5 block h-px w-full bg-hairline" />
                  <p className="mt-5 text-sm leading-relaxed text-ink-soft">{item.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* Team, roster, hierarchy and portraits (lib/team.ts) */}
      <TeamSection heading={about.teamHeading} />

      {/* Life at the studio, the outing and the office */}
      <StudioCulture />

      {/* Press, the strip that earns the click through to /press */}
      <PressBand />

      {/* How we work, in the same cell grid as the two sections above. */}
      <section className="mt-section px-gutter">
        <SectionHead eyebrow="The method" heading={about.approachHeading} />
        <ul className="mt-14 grid border-l border-t border-hairline md:grid-cols-2">
          {about.approach.map((item, i) => (
            <li key={item.title} className="list-none border-b border-r border-hairline">
              <Reveal delay={(i % 2) * 0.1}>
                <div className="flex h-full flex-col p-6 sm:p-8">
                  <p className="mono-label text-brass">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="font-display text-h3 mt-4 leading-tight">{item.title}</h3>
                  <span aria-hidden className="mt-5 block h-px w-full bg-hairline" />
                  <p className="mt-5 leading-relaxed text-ink-soft">{item.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <div className="pt-section">
        <EnquirySection
          source="about"
          eyebrow="Work with the studio"
          title="Tell us about your project."
        />
      </div>
    </main>
  );
}
