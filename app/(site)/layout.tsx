import { LenisProvider } from "@/components/motion/LenisProvider";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { Beacon } from "@/components/site/Beacon";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";
import { jsonLdScript, organizationJsonLd } from "@/lib/seo";
import { getIdentity, getSection, whatsappHref } from "@/lib/settings";
import { CATEGORIES, categoryHref } from "@/lib/categories";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // One read per request (cached in lib/settings) feeds the chrome that
  // wraps every page, so identity edits land site-wide.
  const [identity, orgJsonLd, projects] = await Promise.all([
    getIdentity(),
    organizationJsonLd(),
    getSection("projects"),
  ]);

  // The nav's Projects menu describes each practice area in the
  // studio's own words, so the taglines travel with it.
  const categoryLinks = CATEGORIES.map((c) => ({
    href: categoryHref(c.slug),
    label: c.label,
    tagline: projects[`${c.slug}Tagline`],
    numeral: c.numeral,
  }));

  return (
    <LenisProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(orgJsonLd)}
      />
      <Nav shortName={identity.shortName} categoryLinks={categoryLinks} />
      {children}
      <Footer identity={identity} />
      <WhatsAppFab
        href={whatsappHref(
          identity.whatsapp,
          `Hello ${identity.shortName} — I'd like to discuss a project.`,
        )}
      />
      <Beacon />
    </LenisProvider>
  );
}
