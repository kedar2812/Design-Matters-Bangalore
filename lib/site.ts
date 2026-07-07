/** Studio facts — single source of truth for contact + identity. */
export const site = {
  name: "Design Matters Architects",
  shortName: "Design Matters",
  tagline: "Architecture + Interior Design, Bengaluru",
  founded: 2011,
  principal: "Ar. Kiran Hanumaiah",
  address: {
    line1: "3302, 2nd Floor, 12th A Main Rd",
    line2: "HAL 2nd Stage, Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    pin: "560008",
  },
  coordinates: "12.9716° N, 77.6412° E",
  phone: "+91 98860 16711",
  phoneAlt: "+91 78921 04742",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919886016711",
  email: "kiran@designmattersblr.com",
  socials: {
    // The client's form says "designmattersarchitects", but the live
    // account is "@designmattersarchitects_" (underscore) — confirm at launch.
    instagram: "https://www.instagram.com/designmattersarchitects_/",
    linkedin: "https://in.linkedin.com/in/kiran-hanumaiah-825539a1",
    // TODO: confirm exact Houzz profile URL with DMA before launch.
    houzz: null as string | null,
  },
} as const;

// Discovery form: essential pages are Home / Projects / About / Services,
// and the client opted out of a public blog — no Journal here.
export const navLinks = [
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
] as const;

export const whatsappHref = (text?: string) =>
  `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
