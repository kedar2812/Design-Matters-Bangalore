import type { Metadata } from "next";
import { site, whatsappHref } from "@/lib/site";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { Reveal } from "@/components/motion/Reveal";
import { Entry } from "@/components/motion/Entry";

export const metadata: Metadata = {
  title: "Contact — Start a Project",
  description:
    "Talk to Design Matters Architects about your site, residence or interior project. Studio in Indiranagar, Bengaluru. Call, WhatsApp or write to us.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="px-gutter pb-section pt-36">
      <Entry>
        <p className="mono-label mb-4">Get in touch</p>
        <h1 className="font-display text-h1 mb-16 max-w-3xl">
          Every project starts with a conversation.
        </h1>
      </Entry>

      <div className="grid gap-16 lg:grid-cols-12">
        {/* Form */}
        <Entry className="lg:col-span-7">
          <EnquiryForm source="contact-page" />
        </Entry>

        {/* Studio details */}
        <Entry delay={0.15} className="lg:col-span-4 lg:col-start-9">
          <div className="space-y-10">
            <div>
              <p className="mono-label mb-3">Prefer to talk?</p>
              <a
                href={whatsappHref("Hello Design Matters — I'd like to discuss a project.")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-h3 inline-block transition-colors hover:text-brass"
              >
                WhatsApp the studio &rarr;
              </a>
            </div>

            <div>
              <p className="mono-label mb-3">Call</p>
              <ul className="space-y-1 text-sm text-ink-soft">
                <li>
                  <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-brass">
                    {site.phone}
                  </a>
                </li>
                <li>
                  <a href={`tel:${site.phoneAlt.replace(/\s/g, "")}`} className="hover:text-brass">
                    {site.phoneAlt}
                  </a>
                </li>
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
                {site.address.line1}
                <br />
                {site.address.line2}
                <br />
                {site.address.city}, {site.address.state} {site.address.pin}
              </address>
            </div>

            <div>
              <p className="mono-label mb-3">Follow</p>
              <ul className="space-y-1 text-sm text-ink-soft">
                <li>
                  <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-brass">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href={site.socials.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-brass">
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </Entry>
      </div>

      {/* Map */}
      <Reveal className="mt-20">
        <div className="rule pt-6">
          <iframe
            title="Design Matters Architects — Indiranagar, Bengaluru"
            src="https://www.google.com/maps?q=Design+Matters+Architects,+12th+A+Main+Rd,+HAL+2nd+Stage,+Indiranagar,+Bengaluru&output=embed"
            className="h-96 w-full border-0 grayscale-[0.4]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Reveal>
    </main>
  );
}
