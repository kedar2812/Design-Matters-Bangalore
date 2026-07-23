import { EnquiryForm } from "@/components/site/EnquiryForm";
import { EnquiryGlow } from "@/components/site/EnquiryGlow";
import { Reveal } from "@/components/motion/Reveal";
import { getIdentity, whatsappHref, telHref } from "@/lib/settings";

/**
 * Drop-in enquiry block — the same lead form as the contact page, so
 * a visitor can write in without leaving the page they're on. Every
 * submission lands in the studio dashboard (`source` says from where).
 */
export async function EnquirySection({
  source,
  eyebrow = "Start a project",
  title = "Tell us about your site.",
  whatsappText,
}: {
  source: string;
  eyebrow?: string;
  title?: string;
  whatsappText?: string;
}) {
  const site = await getIdentity();
  const wa = whatsappHref(
    site.whatsapp,
    whatsappText ?? `Hello ${site.shortName} — I’d like to discuss a project.`,
  );

  return (
    <section className="px-gutter pb-section" aria-label="Enquiry">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-hairline px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <EnquiryGlow />
          <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="mono-label mb-4">{eyebrow}</p>
            <h2 className="font-display text-h2 max-w-md">{title}</h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink-soft">
              A sentence or two is plenty — we&rsquo;ll reply within a
              working day. Prefer to talk it through?
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              <li>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brass underline underline-offset-4 transition-colors hover:text-brass-deep"
                >
                  WhatsApp the studio
                </a>
              </li>
              <li>
                <a
                  href={telHref(site.phone)}
                  className="text-ink-soft transition-colors hover:text-brass"
                >
                  {site.phone}
                </a>
              </li>
            </ul>
          </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <EnquiryForm source={source} />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
