import type { Metadata } from "next";
import { getIdentity, getSection, whatsappHref, telHref } from "@/lib/settings";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { EnquiryGlow } from "@/components/site/EnquiryGlow";
import { Reveal } from "@/components/motion/Reveal";
import { Entry } from "@/components/motion/Entry";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact — Start a Project",
  description:
    "Talk to Design Matters Architects about your site, residence or interior project. Studio in Indiranagar, Bengaluru. Call, WhatsApp or write to us.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [site, content] = await Promise.all([getIdentity(), getSection("contact")]);

  const socials = [
    { label: "Instagram", href: site.instagram },
    { label: "LinkedIn", href: site.linkedin },
    { label: "Houzz", href: site.houzz },
  ].filter((s) => s.href);

  return (
    <main className="px-gutter pb-section pt-36">
      <Entry>
        <p className="mono-label mb-4">{content.eyebrow}</p>
        <h1 className="font-display text-h1 mb-16 max-w-3xl">{content.heading}</h1>
      </Entry>

      <div className="grid gap-16 lg:grid-cols-12">
        {/* Form */}
        <Entry className="lg:col-span-7">
          <div className="relative isolate overflow-hidden rounded-[2rem] border border-hairline p-4 sm:p-6">
            <EnquiryGlow />
            <EnquiryForm source="contact-page" />
          </div>
        </Entry>

        {/* Studio details */}
        <Entry delay={0.15} className="lg:col-span-4 lg:col-start-9">
          <div className="space-y-10">
            <div>
              <p className="mono-label mb-3">Prefer to talk?</p>
              <a
                href={whatsappHref(site.whatsapp, content.whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-h3 inline-block transition-colors hover:text-brass"
              >
                {content.whatsappLabel} &rarr;
              </a>
            </div>

            <div>
              <p className="mono-label mb-3">Call</p>
              <ul className="space-y-1 text-sm text-ink-soft">
                {[site.phone, site.phoneAlt].filter(Boolean).map((p) => (
                  <li key={p}>
                    <a href={telHref(p)} className="hover:text-brass">
                      {p}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mono-label mb-3">Write</p>
              <a href={`mailto:${site.email}`} className="text-sm text-ink-soft hover:text-brass">
                {site.email}
              </a>
            </div>

            <div>
              <p className="mono-label mb-3">Visit</p>
              <address className="text-sm not-italic leading-relaxed text-ink-soft">
                {site.addressLine1}
                <br />
                {site.addressLine2}
                <br />
                {site.city}, {site.state} {site.pin}
              </address>
            </div>

            {socials.length > 0 && (
              <div>
                <p className="mono-label mb-3">Follow</p>
                <ul className="space-y-1 text-sm text-ink-soft">
                  {socials.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-brass"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Entry>
      </div>

      {/* Map */}
      <Reveal className="mt-20">
        <div className="rule pt-6">
          <iframe
            title={`${site.name} — ${site.city}`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(site.mapQuery)}&output=embed`}
            className="rounded-frame h-96 w-full border-0 grayscale-[0.4] dark:grayscale-[0.25] dark:invert dark:hue-rotate-180"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Reveal>
    </main>
  );
}
