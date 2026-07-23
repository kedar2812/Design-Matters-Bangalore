/**
 * Seed the Testimonial table with the studio's real Google reviews.
 *
 *   npx tsx scripts/import-testimonials.ts
 *
 * Pulled by hand from the studio's Google Business listing
 * (https://maps.google.com/?cid=7913232271800381208 — 4.9, 87 ratings)
 * on 2026-07-23. Review text is verbatim; relative dates are converted
 * to absolute labels as of that day. Idempotent: rows upsert on a
 * stable `googleId`, so re-running never duplicates — but it WILL
 * restore text/flags, so don't re-run after the client starts editing.
 *
 * Curation: genuine client reviews are published; ratings-only stubs,
 * intern reviews and drive-by comments are imported as hidden so the
 * studio can decide from the dashboard. `featured` rows drive the
 * home-page strip.
 */
import "dotenv/config";
import { prisma } from "../lib/db";

type Row = {
  author: string;
  context?: string;
  rating: number;
  text: string;
  excerpt?: string;
  sourceDate: string;
  featured?: boolean;
  published: boolean;
};

const REVIEWS: Row[] = [
  {
    author: "Shaila Vivek",
    context: "Private residence",
    rating: 5,
    sourceDate: "June 2026",
    featured: true,
    published: true,
    text: "Our architects, DMA Architects & Designers (especially Ar.Kiran), have been a great pleasure to work with for the last two years. Unlike other architects, he is willing to listen to our ideas and is also willing to work within our budget (avoiding unnecessary spending). His coordination with all the liasoning agents, structural engineers, and civil contractor is excellent and ensured quick actions. He is very quick to respond to our concerns/queries, and in more than a couple of instances, he has given us excellent advice to come out of major roadblocks. Overall, it was a great experience with DMA in building our dream home. Thanks to you and your team.",
    excerpt:
      "Unlike other architects, he is willing to listen to our ideas and is also willing to work within our budget. Overall, it was a great experience with DMA in building our dream home.",
  },
  {
    author: "Sona Nagendran",
    rating: 5,
    sourceDate: "May 2026",
    featured: true,
    published: true,
    text: "We had a great experience with Kiran and the team. Service was prompt, and the team is efficient, knowledgeable, and extremely supportive. They collaborate well with contractors and tackle site issues with quick, practical solutions. Kiran is responsive and reliable on both communication and delivery. Highly recommend for a smooth project execution.",
  },
  {
    author: "RamaPrasad AR",
    context: "Private residence",
    rating: 5,
    sourceDate: "December 2025",
    featured: true,
    published: true,
    text: "As the Kannada saying (gaade) goes, “ಮನೆ ಕಟ್ಟಿ ನೋಡು; ಮದುವೆ ಮಾಡಿ ನೋಡು” — building a house is truly a big feat. Looking back today, I can confidently say that partnering with Design Matters made the entire journey much lighter and more enjoyable. We moved into our home in February 2025, and after about nine months of living here, the satisfaction remains strong. Our journey began in early 2023. With very little background in construction — apart from the dream of owning a home and the willingness to put in the hard work — we explored a few architects. But none of those partnerships progressed beyond a couple of meetings. While searching, we stumbled upon the Design Matters website, and the wide array of thoughtfully designed plans immediately gave us the confidence boost we needed. We reached out and soon had our first meeting scheduled at their Indiranagar office. Right from that first meeting, Kiran understood our pulse. He captured exactly what we were looking for and, within about a month, presented a strong initial layout. Each subsequent meeting built smoothly on the previous one — balancing cost, aspirations, practical constraints, and future possibilities. What we appreciated most about Design Matters was their clarity, the way they explained every option, and how they shaped our ideas without ever forcing their own. At the same time, Kiran offered meaningful advice whenever needed. Their BOQ-based cost estimation method was extremely helpful — it gave us transparency at every stage and helped us choose the right civil contractor. Throughout the project, Design Matters and the construction team worked together seamlessly, ensuring quality was never compromised. A special mention to Kiran’s team for guiding us through selecting the right flooring options — without their support, it would certainly have been overwhelming. Overall, we are very happy, content, and satisfied with our new home. We highly recommend Design Matters to anyone thinking about building their dream home.",
    excerpt:
      "Right from that first meeting, Kiran understood our pulse. What we appreciated most about Design Matters was their clarity, the way they explained every option, and how they shaped our ideas without ever forcing their own.",
  },
  {
    author: "Deepak Balasubramanian",
    context: "Villa interiors, Sarjapur Road",
    rating: 5,
    sourceDate: "September 2025",
    featured: true,
    published: true,
    text: "Design Matters did the interior & facade designing for our new villa in Sarjapur Road. Mr Kiran & team are impeccable & thoroughly professional. They are super easy to communicate with, understands clients taste and mind-set and it comes out in their design. Mr Kiran is also well connected to some great execution teams and a lot of vendors (to procure high quality materials). Engaging with Design Matters is the best thing which happened for our house. Special shout out to our architect Ms Mrudula as well!",
    excerpt:
      "They are super easy to communicate with, understands clients taste and mind-set and it comes out in their design. Engaging with Design Matters is the best thing which happened for our house.",
  },
  {
    author: "M J Yanjarappa",
    context: "Private residence",
    rating: 5,
    sourceDate: "May 2026",
    published: true,
    text: "We approached Kiran from Design Matters for our dream house project. It was a pleasant experience to work with Kiran. He is a truly knowledgeable person with the latest developments in design and accommodated all our requirements within the given space. He never forced his ideas, but was suggestive of various options, which made us really comfortable to work with him. I should also appreciate his knowledge on the quality of raw materials and available suppliers in the market, which ensured the right quality is achieved starting from bricks, concrete, windows, tiles etc. I wouldn’t have expected better than this as a customer without any prior experience of house construction. Subsequently we also decided to go ahead with him for our interior design part. He and his team acted quickly and provided various options within the stipulated time. Overall, we could finish our dream project because of Kiran and the team’s support. Thank you for making our dream real. I would highly recommend him for his integrity, quality and commitment.",
    excerpt:
      "He never forced his ideas, but was suggestive of various options, which made us really comfortable to work with him. I would highly recommend him for his integrity, quality and commitment.",
  },
  {
    author: "Kamal Maheshwari",
    rating: 5,
    sourceDate: "2020",
    published: true,
    text: "Simply exceptional experience working with Design Matters and Kiran. Always quick responsive, cool and calm. Special skill is to find sufficient time for face to face discussions with no hurry burry. Always honest, non biased in his feedbacks without any commercial hidden agenda behind.",
  },
  {
    author: "Anitha K Somasundar",
    context: "Private residence",
    rating: 5,
    sourceDate: "2023",
    published: true,
    text: "We have worked with Kiran for close to two and a half years, right from the conceptualization of our project through to execution and we couldn't have selected a better architect and interior designer. After having met with several other architects to design our forever earth friendly and minimal home, we instantly clicked with Kiran. His enthusiasm to understand our ideas and requirements, his calm and positive demeanor immediately appealed to us. Unlike other architects who are quite insistent on certain design concepts, we were optimistic he will be patient and listen to our views on how \"we\" see \"our\" home. As we started working with him, we were happy to note that our design sensibilities also matched well. Kiran and his team have been hands on, responsive, available and fully committed throughout the duration of our project. Over the course of the project, where some parts of the original design evolved and needed changes, he was able to seamlessly integrate our ideas into his concept for the structure. He was able to communicate effectively with the contractor and various vendors, get his ideas across, and ensure it was executed to the best of the construction team's ability. He was able to troubleshoot issues that arose and come up with feasible alternatives. The 3D renderings provided at every stage of the project helped us visualise each element in the house and made the decision making process easy. We also took Kiran's support in the contractor tender process, bill verification and payment calculation, QC of building materials and building progress. Overall, my husband and I highly recommend Kiran and his team for anyone looking for an architect who is able to cater to both traditional and contemporary design requirements, who is well connected and is able to guide home owners to all the relevant vendors needed at every stage of building and designing a home. Thank you Kiran and to your team for helping build our dream home. It is more beautiful in real life than we had imagined.",
    excerpt:
      "Kiran and his team have been hands on, responsive, available and fully committed throughout the duration of our project. It is more beautiful in real life than we had imagined.",
  },
  {
    author: "Anup Rani",
    context: "Private residence",
    rating: 5,
    sourceDate: "2025",
    published: true,
    text: "Very professional work. Kiran and team are very collaborative and deliver on time. We had very seamless interactions with them. They have designed a beautiful dream house for us which is a reality now.",
  },
  {
    author: "Venkatesh Elappan",
    context: "Residence & interiors",
    rating: 5,
    sourceDate: "2025",
    published: true,
    text: "We had a fantastic experience with Mr. Kiran and the architectural and interior design team at Design Matters. Right from the requirement gathering phase through to the finalisation of the floor plan and 3D elevation, everything was thoughtfully designed to suit our needs and preference. Their creativity, attention to detail, and deep understanding of aesthetic made the entire process smooth and professional. Mr. Kiran and his team were very collaborative, highly responsive, and consistently provided valuable input from the initial concept to the finishing touches. They also guided us in selecting the right vendors and materials at every stage of construction, which was a huge support throughout the project. The result is a beautifully designed space that reflects our personal style while being practical and comfortable. We are incredibly grateful to Mr. Kiran and his team for helping us build our dream home, and we highly recommend their services to anyone seeking exceptional architectural and interior design expertise.",
    excerpt:
      "Their creativity, attention to detail, and deep understanding of aesthetic made the entire process smooth and professional.",
  },
  {
    author: "Chetan Basavaraj",
    context: "Private residence",
    rating: 5,
    sourceDate: "2024",
    published: true,
    text: "Design Matters designed and oversaw the construction of our beautiful home. We are very pleased with the team, they always went above and beyond. I wholeheartedly recommend Design Matters.",
  },
  {
    author: "Soumya Basavaraj",
    context: "Private residence",
    rating: 5,
    sourceDate: "2024",
    published: true,
    text: "We got our dream house designed and built through Architect Kiran Hanumaiah from Design Matters. The entire process was extremely professional and smooth. Ar. Kiran is one of the best architects in Bangalore and the DMA team of young architects and interior designers are very talented. Right from the requirement gathering stage, the floor plan and elevation design finalization stage, everything was meticulously and beautifully designed for us. The 3D visualizations that we always received from DMA were brilliant and helped us make quick and sure decisions. Kiran also helped us narrow down and select the contractor to build our building. A lot of time, effort and support is extended by the architect and his team in choosing the right vendors and materials at every stage of the construction until completion. Thanks to Kiran and Design Matters Architects, we now have a rather distinctive, comfortable and beautifully designed home. Our tip would be, to always trust the design direction given by the architect for the best outcome. Thank you to Kiran and the DMA team.",
    excerpt:
      "Right from the requirement gathering stage, the floor plan and elevation design finalization stage, everything was meticulously and beautifully designed for us.",
  },
  {
    author: "Thogaivani Balaji",
    context: "Residence design",
    rating: 5,
    sourceDate: "2020",
    published: true,
    text: "I am completely satisfied with the elegant design Kiran has done for our house. He is extremely knowledgeable about every aspect of design. He is very professional and also punctual in answering queries. He has understood our requirements very well. In fact the number of sittings with him were also less. Even carpenters were happy with the details he has shared with them. I will definitely recommend him.",
  },
  {
    author: "Venkatesh Manvikar P",
    context: "Private residence",
    rating: 5,
    sourceDate: "October 2025",
    published: true,
    text: "We had a dream of building a home with earthen concepts but couldn't know where to start and how to go ahead. Our meeting with Ar. Kiran gave us more clarity to visualise and take it forward. They gave designs to make it a reality! Grateful for their conceptualized outlook of our home. Thanks a lot to the team. Ar. Pallavi was forthcoming with all updates. Today we have our dream fulfilled.",
  },
  {
    author: "Balaji Venugopal",
    context: "Interior design",
    rating: 5,
    sourceDate: "2020",
    published: true,
    text: "Kiran is a well known architect and interior designer. In the first visit itself we got impressed with his past work as well as the approach he took to gather our requirements. He is a systematic person as well as suggests designs that are functional, maintainable rather than just visually impressive. My carpenter was highly impressed with the level of details he had provided in the drawings. He gave good references to anything related to interiors and great ideas. Everyone who visits our home appreciates the clean design and how it was executed. He is my go-to person for all interior stuff and I recommend him to my friends and neighbors who are in the lookout for designers.",
  },
  {
    author: "Apparao Paidi",
    context: "Interiors & elevation",
    rating: 5,
    sourceDate: "2024",
    published: true,
    text: "I have taken interior services from Kiran sir. He is extremely talented in architecture and interiors — even though I have taken interior services only from him, he helped me a lot in architecture, especially the front elevation. He is having a very good team, all are down to earth, highly professional and talented. I was extremely happy with the designs provided by him; his response to any query is super fast, and due to that the execution team does the work without any delay. The good thing is, he has provided plumbing and electrical drawings in the early phase so that rework was mostly avoided during tiling and carpentry work. His ideas in interiors are superb — the interior designs provided in living, kitchen, bedrooms, bathrooms and pergola are too good. My central courtyard design was a masterpiece. He has guided me very well in selection of tiles, wall colors, textures, wall papers, electrical fittings, wardrobe handles, furniture, etc. During the execution phase, he referred me many vendors, all trusted and professional — he will not refer any vendor unless he is happy with their previous work. Finally, if anyone wants to build a dream home and take services from him, blindly you can consider both architecture and interior services. I am sure you will see a beautiful dream home at the end.",
    excerpt:
      "His response to any query is super fast. My central courtyard design was a masterpiece.",
  },
  {
    author: "Vignesh Sivarajan",
    context: "Interiors",
    rating: 5,
    sourceDate: "2021",
    published: true,
    text: "Kiran is an amazing designer who immediately understands what we need. It’s always good to go with the best designer and we have been lucky to have selected Kiran and his team. He helped not just in the 3D design of the interiors but on all aspects of interiors such as curtains, etc. One word to summarise all this is — ‘professionalism’!",
  },
  {
    author: "Parul Sonawane",
    context: "Home interiors",
    rating: 5,
    sourceDate: "2020",
    published: true,
    text: "When we initially started looking for interiors we had a tough time to choose one — most importantly a trusted person who can deliver on time. I would like to thank Kiran (Design Matters) for his excellent customer service and quality of work right from our day 1 discussions till the finish. He suggests clients the latest designs keeping in mind the customer requirement. I would like to highlight his commitment towards agreed timelines, transparency with clients and suggestions. Kiran is the best interior designer on board who has looked into every aspect of my requirement and has a great eye for detail. Design Matters are truly among the best interior designers in Bangalore. Would definitely recommend them for interiors! Thank you for giving us the beautiful home of our dreams.",
  },
  {
    author: "Roopa Nagaraj",
    context: "Villa interiors",
    rating: 5,
    sourceDate: "2022",
    published: true,
    text: "We worked with Kiran to design interiors for our villa. He is very responsive, thoughtful and showed willingness to work with our requirements. It was a pleasure working with Kiran. Overall we are very satisfied and would be happy to recommend.",
  },
  {
    author: "Ramprasad Vempati",
    context: "Private residence",
    rating: 5,
    sourceDate: "2022",
    published: true,
    text: "Kiran was the architect for my home, which I recently built, 2020–2021. I've had interaction with him for almost 1.5 years. What I can say are the top qualities of Kiran — his experience, professionalism and patience. He has handled various types of projects over a vast number of years, thus he carries a lot of practical knowledge rather than imaginary. And I should say he is a client's architect — he will get you a house that's according to your taste, instead of imposing his own thoughts, though he cautions us with pros and cons. During my initial search I met all different types: either people who are completely on the client's side and just do what clients say, or their own style — but I see Kiran in between, managing overall aesthetics, practicality and the client's aspirations. And now coming to his patience — trust me, I've had almost 10+ revisions of my floor plan, 7+ revisions of my elevation, and he never hesitated to accommodate my new thoughts. I've also heard concern from friends and colleagues that architects, once a project is committed, will show different reasons for avoiding site visits — but to the contrary, Kiran always accommodated my requests for site visits. He provided all required drawings in reasonable time, without much delay. Thanks Kiran for designing and being there till the end of my project.",
    excerpt:
      "I've had almost 10+ revisions of my floor plan, 7+ revisions of my elevation, and he never hesitated to accommodate my new thoughts.",
  },
  {
    author: "Sruthi Dadi",
    rating: 5,
    sourceDate: "2023",
    published: true,
    text: "Design Matters is a very good firm. Kiran sir is very thoughtful, a good listener and very experienced in this field. The work is of high quality, detail oriented, with clear communications and open to adjustments during the project.",
  },
  {
    author: "A Ramachandran",
    rating: 5,
    sourceDate: "2020",
    published: true,
    text: "A wonderful set of people to associate.",
  },
  {
    author: "Karthik Kulkarni",
    rating: 5,
    sourceDate: "2024",
    published: true,
    text: "Kiran is very empathetic with lots of patience. Strongly recommend talking to them.",
  },
  {
    author: "Chetana S",
    rating: 5,
    sourceDate: "2020",
    published: true,
    text: "Excellent aesthetic sense in designing.",
  },
  {
    author: "Arjun H.K",
    rating: 5,
    sourceDate: "2020",
    published: true,
    text: "Perfect practical & beautiful designs according to the requirements. Good place to get the designs for dream homes with hassle-free solutions.",
  },

  /* ---- imported hidden: interns, stubs and drive-bys — the studio
     can publish any of these from the dashboard if it wants them. ---- */
  {
    author: "Kripa Sriram",
    rating: 5,
    sourceDate: "2022",
    published: false,
    text: "Design Matters architects are very dedicated in the work they do — they analyse and come up with functional and aesthetical designs. Design Matters is a firm with immense ideas which accommodate perfectly with the client. The work environment in Design Matters is very professional, efficient, friendly and welcoming. Kiran sir is a very knowledgeable and skilled architect who is very approachable to learn from.",
  },
  {
    author: "Liyana Thasnim",
    rating: 5,
    sourceDate: "2022",
    published: false,
    text: "Kiran sir is a very patient and calm teacher. He tries to explain all the mistakes that I make very clearly and makes sure that I got it. He tries to make a very comfortable and positive atmosphere for everyone in the office to work. He has got a friendly team of architects with him. I had a really great time interning in Design Matters.",
  },
  {
    author: "Parwaz Mohammed",
    rating: 4,
    sourceDate: "2023",
    published: false,
    text: "Good experience for architecture students.",
  },
  {
    author: "Bala Krishna Thunuguntla",
    rating: 5,
    sourceDate: "2021",
    published: false,
    text: "Had good conversation. Yet to decide though.",
  },
  {
    author: "Gopinath Hs",
    rating: 3,
    sourceDate: "2019",
    published: false,
    text: "Architect's office.",
  },
  {
    author: "Garima Kacholya",
    rating: 5,
    sourceDate: "2020",
    published: false,
    text: "Thank you.",
  },
  {
    author: "Manju Manju",
    rating: 5,
    sourceDate: "2021",
    published: false,
    text: "Manjunath E.",
  },
];

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function main() {
  let created = 0;
  let updated = 0;
  for (const [i, r] of REVIEWS.entries()) {
    const googleId = `seed-${slug(r.author)}`;
    const data = {
      author: r.author,
      context: r.context ?? null,
      rating: r.rating,
      text: r.text,
      excerpt: r.excerpt ?? null,
      source: "google",
      sourceDate: r.sourceDate,
      featured: r.featured ?? false,
      published: r.published,
      order: i,
    };
    const existing = await prisma.testimonial.findUnique({ where: { googleId } });
    if (existing) {
      await prisma.testimonial.update({ where: { googleId }, data });
      updated++;
    } else {
      await prisma.testimonial.create({ data: { ...data, googleId } });
      created++;
    }
  }
  const live = REVIEWS.filter((r) => r.published).length;
  console.log(
    `Testimonials: ${created} created, ${updated} updated — ${live} published, ${REVIEWS.length - live} hidden.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
