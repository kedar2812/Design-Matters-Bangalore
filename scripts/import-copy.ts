/**
 * Seed project narratives scraped from DMA's current website
 * (designmattersarchitects.com; House of Levels from Buildofy).
 * Text lightly copy-edited for the new site's voice — content and
 * facts are the studio's own. Re-runnable: replaces story blocks.
 *
 * Run: npx tsx scripts/import-copy.ts
 */
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type Story = {
  slug: string;
  concept: string;
  final?: string;
  year?: number;
  area?: string;
};

const stories: Story[] = [
  {
    slug: "vivek-residence",
    concept:
      "A residence on a compact site amidst dense foliage, built as an interplay of skilfully laid brickwork and neutral tones. Internal walls are minimised to open up the first floor, living, dining, kitchen and pooja in one continuous plan, while a double-height volume with a distinct jali separates living from dining without ever breaking visual connection.",
    final:
      "A coffered ceiling with alternating skylight voids crowns the double-height space; together with the jali it washes the floor in natural light, casting shifting patterns of shade and shadow through the day. Louvered windows overlook the living area below, terraces open to greenery, and brick, wood and warm light breathe life into the interior.",
  },
  {
    slug: "house-of-levels",
    concept:
      "A compact 30×40 Bengaluru home that redefines urban living through a thoughtful interplay of light, levels and material warmth. Designed around a central skylit courtyard, the house rises through staggered floor plates that create spatial distinction without sacrificing openness.",
    final:
      "A sculptural rubberwood staircase anchors the vertical movement, while bay windows, brick textures and natural stone lend depth to every zone, from an acoustically treated hobby room on the ground floor to elevated living areas, tranquil bedrooms and a serene terrace framed by terracotta jaalis.",
    year: 2025,
    area: "3,800 sq ft",
  },
  {
    slug: "wellington-street-residence",
    concept:
      "A dense neighbourhood, a modest 45'×45' plot, and a brief that asked for a lift and a comfortable staircase. The design segregates vertical circulation to the south-east corner and opens the living and bedroom areas to the north-facing road for light and ventilation. A laser-cut Fundermax screen becomes the façade's defining element, privacy from the busy road, while stepped terraces add breakout green space at every level.",
    final:
      "Humble tones of beige merge with rustic walnut as warm light seeps in through every niche. Minimal panels patterned on tree bark and foliage wrap the spaces, and intricately detailed apertures mimic vegetation, a play of light and shadow that makes moving through the house an immersive experience.",
  },
  {
    slug: "indiranagar-duplex-residence",
    concept:
      "Interiors for a duplex home in the prime of Indiranagar, handled in a contemporary register. Neutral colours with a contrast of carefully placed accent colour bring out the highlights, while subtle patterns and textures break the monotony and make the spaces more engaging to live in.",
  },
  {
    slug: "snn-clermont",
    concept:
      "This 4 BHK apartment embraces the clients' lifestyle and their vast collection of art, artefacts and books. A customised artwork by an artist friend takes the vantage position in the living room; dark-toned stone cladding on the opposite wall balances it, and the rest of the home is kept deliberately simple and light.",
    final:
      "The false ceiling stays quiet and elegant with veneered ply borders, and the corridor becomes a gallery for the art collection. Each bedroom follows the client's brief, a purple theme for the daughter, a subtly accented guest room, and a blue-themed master with rich panelling.",
  },
  {
    slug: "casa-grande-luxus",
    concept:
      "The interiors of this villa are defined by veneer, on the false ceiling and in panelling through the public areas, with a stunning Celestile mural forming the centrepiece of the living room.",
    final:
      "Rich veneer panelling, high headboards and Aristo sliding wardrobes in lacquered glass give the master and guest bedrooms a stately presence; the children's room is finished in a cheerful yellow-and-grey theme. At the staircase, stone cladding and textured paint frame a chandelier that drops through three floors.",
  },
  {
    slug: "la-palazzo",
    concept:
      "Contemporary elegance with everyday functionality: neutral tones, bold accents and thoughtful decor in harmony. A striking chandelier and a bold geometric rug layer the dining area with sophistication, a large grid mirror adds depth, and sheer curtains diffuse natural light, artwork and greenery bringing the rooms to life.",
  },
  {
    slug: "epsilon",
    concept:
      "At 15,000 sq ft, this sprawling villa is one of the studio's largest interior commissions, taken on at bare-shell stage, with every room and bathroom finished in exclusive materials: bespoke tiles from FCML and Celestile, white Vietnam marble in the public areas, solid wood flooring in the bedrooms.",
    final:
      "Each room follows a theme set by the client, a princess look for the daughter, a modern industrial edge for the son, an elegant master suite, while PVD-coated brass stands with wooden shelves partition the living and family areas.",
    area: "15,000 sq ft",
  },
  {
    slug: "suraj-interiors",
    concept:
      "An interior project in Arekere, Bengaluru that carries ethnicity with a touch of modernity. Pastel tones meet traditional prints, and intricate details, paintings, textiles, set a well-judged contrast against the neutral base.",
  },
  {
    slug: "indiranagar-dental-clinic",
    concept:
      "The aim: a comfortable environment for patients that never feels monotonous or clinical. Neutral colours with a contrasting sap green keep the space calm while holding the professional decorum of the practice.",
  },
];

async function main() {
  for (const s of stories) {
    const project = await prisma.project.findUnique({ where: { slug: s.slug } });
    if (!project) {
      console.warn(`! ${s.slug}: not in DB, skipped`);
      continue;
    }

    await prisma.storyBlock.deleteMany({ where: { projectId: project.id } });
    await prisma.storyBlock.create({
      data: { projectId: project.id, type: "CONCEPT", text: s.concept, order: 0 },
    });
    if (s.final) {
      await prisma.storyBlock.create({
        data: { projectId: project.id, type: "FINAL", text: s.final, order: 1 },
      });
    }

    const patch: { year?: number; area?: string } = {};
    if (s.year && !project.year) patch.year = s.year;
    if (s.area && !project.area) patch.area = s.area;
    if (Object.keys(patch).length > 0) {
      await prisma.project.update({ where: { id: project.id }, data: patch });
    }

    console.log(`✓ ${s.slug}: ${s.final ? 2 : 1} story block(s)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
