import type { Metadata } from "next";
import { MaskedHeading } from "@/components/motion/MaskedHeading";
import { Reveal } from "@/components/motion/Reveal";
import { Entry } from "@/components/motion/Entry";
import { TextScrub } from "@/components/motion/TextScrub";
import { EnquirySection } from "@/components/site/EnquirySection";
import { PressBand } from "@/components/site/PressBand";
import { PrincipalSection } from "@/components/site/PrincipalSection";
import { StudioCollage } from "@/components/site/StudioCollage";
import { StudioCulture } from "@/components/site/StudioCulture";
import { TeamSection } from "@/components/site/TeamSection";
import { getIdentity, getSection } from "@/lib/settings";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About the Studio & Ar. Kiran Hanumaiah",
  description:
    "A Bangalore architecture and interior design studio founded in 2011 by Ar. Kiran Hanumaiah. Meet the eleven-strong team and the thinking behind the work.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [site, about] = await Promise.all([getIdentity(), getSection("about")]);

  return (
    <main className="pb-section pt-36">
      {/* Story */}
      <section className="px-gutter">
        <p className="mono-label mb-4">
          {about.eyebrow} — est. {site.founded}
        </p>
        <MaskedHeading className="font-display text-h1 max-w-4xl">
          {about.heading}
        </MaskedHeading>

        <div className="mt-16 grid gap-10 md:grid-cols-12">
          <Entry className="md:col-span-6 md:col-start-4">
            <div className="space-y-6 leading-relaxed text-ink-soft">
              {about.story.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </Entry>
        </div>
      </section>

      {/* The studio, in pictures — the collage from the old About page,
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
              — {site.principal}, {site.principalTitle}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Principal — portrait, name and bio in one block on its own surface.
          This used to be a text-only section with the portrait appearing
          again inside the roster below; Kiran was on the page twice and
          fully neither time. */}
      <PrincipalSection
        eyebrow={about.principalEyebrow}
        bio={about.principalBio}
        founded={site.founded}
      />

      {/* Team — roster, hierarchy and portraits (lib/team.ts) */}
      <TeamSection heading={about.teamHeading} />

      {/* Life at the studio — the outing and the office */}
      <StudioCulture />

      {/* Press — the strip that earns the click through to /press */}
      <PressBand />

      {/* Approach */}
      <section className="mt-section px-gutter">
        <Reveal>
          <div className="rule mb-12 pt-4">
            <h2 className="font-display text-h2">{about.approachHeading}</h2>
          </div>
        </Reveal>
        <div className="grid gap-x-gutter gap-y-14 md:grid-cols-2">
          {about.approach.map((item, i) => (
            <Reveal key={item.title} delay={(i % 2) * 0.12}>
              <p className="mono-label mb-3">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="font-display text-h3 mb-4">{item.title}</h3>
              <p className="max-w-md leading-relaxed text-ink-soft">{item.body}</p>
            </Reveal>
          ))}
        </div>
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
