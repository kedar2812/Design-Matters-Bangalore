import { LenisProvider } from "@/components/motion/LenisProvider";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { Beacon } from "@/components/site/Beacon";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";
import { jsonLdScript, organizationJsonLd } from "@/lib/seo";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LenisProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd())}
      />
      <Nav />
      {children}
      <Footer />
      <WhatsAppFab />
      <Beacon />
    </LenisProvider>
  );
}
