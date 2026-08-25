import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Real DMA portfolio, pulled from designmattersarchitects.com.
// Year/area/typology left null where not published — to be filled in
// from the studio dashboard once DMA confirms details.
const projects: {
  slug: string;
  title: string;
  category: string;
  location: string;
  typology?: string;
}[] = [
  { slug: "vivek-residence", title: "Vivek Residence", category: "Residential", location: "Bengaluru", typology: "Private residence" },
  { slug: "house-of-levels", title: "House of Levels", category: "Residential", location: "Bengaluru", typology: "Private residence" },
  { slug: "wellington-street-residence", title: "Wellington Street Residence", category: "Residential", location: "Richmond Town, Bengaluru", typology: "Private residence" },
  { slug: "indiranagar-duplex-residence", title: "Indiranagar Duplex Residence", category: "Residential", location: "Indiranagar, Bengaluru", typology: "Duplex residence" },
  { slug: "jibeesh-residence", title: "Jibeesh Residence", category: "Residential", location: "Bengaluru", typology: "Private residence" },
  { slug: "snn-clermont", title: "SNN Clermont", category: "Apartment", location: "Bengaluru", typology: "Apartment interiors" },
  { slug: "casa-grande-luxus", title: "Casa Grande Luxus", category: "Apartment", location: "Bengaluru", typology: "Apartment interiors" },
  { slug: "la-palazzo", title: "La Palazzo", category: "Apartment", location: "Bengaluru", typology: "Apartment interiors" },
  { slug: "epsilon", title: "Epsilon", category: "Residential", location: "Bengaluru", typology: "Villa interiors" },
  { slug: "suraj-interiors", title: "Suraj Interiors", category: "Interior", location: "Bengaluru", typology: "Interior design" },
  { slug: "indiranagar-dental-clinic", title: "Indiranagar Dental Clinic", category: "Commercial", location: "Indiranagar, Bengaluru", typology: "Healthcare / clinic" },
];

async function main() {
  // Admin user — password comes from env; never committed.
  const email = process.env.SEED_ADMIN_EMAIL ?? "kiran@designmattersblr.com";
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    throw new Error("Set SEED_ADMIN_PASSWORD in .env before seeding.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, role: "ADMIN" },
  });

  for (const [i, p] of projects.entries()) {
    await prisma.project.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        status: "PUBLISHED",
        order: i,
        metaDesc: `${p.title}, ${p.typology ?? p.category} by Design Matters Architects, ${p.location}.`,
      },
    });
  }

  console.log(`Seeded ${projects.length} projects + admin user (${email}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
