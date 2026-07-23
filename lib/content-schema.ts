/**
 * How each editable section is presented in the dashboard.
 * The shapes themselves live in `lib/settings`; this is purely the
 * form layout, so copy edits never need a code change.
 */
import type { FieldGroup } from "@/components/studio/ContentForm";
import type { SectionKey } from "@/lib/settings";
import { CATEGORIES, type Category } from "@/lib/categories";

export type SectionMeta = {
  key: SectionKey;
  title: string;
  blurb: string;
  /** Public page this section drives — used for the "View page" link. */
  preview: string;
  groups: FieldGroup[];
};

/**
 * One form group per practice area. The stored keys are flat and
 * prefixed with the category slug (`residentialHeading`, …) — see the
 * note on `ProjectsContent` in `lib/content-defaults` for why.
 */
function categoryGroup({ slug, label }: Category): FieldGroup {
  return {
    title: `${label} page`,
    fields: [
      {
        kind: "text",
        name: `${slug}Tagline`,
        label: "Tagline",
        hint: "One line, shown on the practice-area card and in the site menu",
      },
      { kind: "text", name: `${slug}Eyebrow`, label: "Small line above the headline" },
      { kind: "textarea", name: `${slug}Heading`, label: "Headline", rows: 2 },
      { kind: "textarea", name: `${slug}Intro`, label: "Introduction", rows: 4 },
      {
        kind: "group",
        name: `${slug}Highlights`,
        label: "",
        itemLabel: "Selling point",
        fields: [
          { name: "title", label: "Title" },
          { name: "body", label: "Description", multiline: true },
        ],
      },
    ],
  };
}

export const SECTIONS: SectionMeta[] = [
  {
    key: "identity",
    title: "Studio details",
    blurb: "Name, address, phone, email and social links — used across every page, the footer and Google.",
    preview: "/contact",
    groups: [
      {
        title: "Identity",
        fields: [
          { kind: "text", name: "name", label: "Full studio name" },
          { kind: "text", name: "shortName", label: "Short name", hint: "Shown in the site header" },
          { kind: "text", name: "tagline", label: "Tagline" },
          { kind: "number", name: "founded", label: "Founded" },
          { kind: "text", name: "principal", label: "Principal architect" },
          { kind: "text", name: "principalTitle", label: "Principal's title" },
        ],
      },
      {
        title: "Contact",
        fields: [
          { kind: "text", name: "phone", label: "Phone" },
          { kind: "text", name: "phoneAlt", label: "Second phone", hint: "Leave blank to hide" },
          { kind: "text", name: "email", label: "Email" },
          {
            kind: "text",
            name: "whatsapp",
            label: "WhatsApp number",
            hint: "Digits only, with country code — e.g. 919886016711",
          },
        ],
      },
      {
        title: "Studio address",
        fields: [
          { kind: "text", name: "addressLine1", label: "Address line 1" },
          { kind: "text", name: "addressLine2", label: "Address line 2" },
          { kind: "text", name: "city", label: "City" },
          { kind: "text", name: "state", label: "State" },
          { kind: "text", name: "pin", label: "PIN code" },
          {
            kind: "text",
            name: "mapQuery",
            label: "Map search text",
            hint: "What the contact-page map searches for",
          },
        ],
      },
      {
        title: "Social links",
        fields: [
          { kind: "text", name: "instagram", label: "Instagram URL", hint: "Leave blank to hide" },
          { kind: "text", name: "linkedin", label: "LinkedIn URL", hint: "Leave blank to hide" },
          { kind: "text", name: "houzz", label: "Houzz URL", hint: "Leave blank to hide" },
        ],
      },
    ],
  },

  {
    key: "home",
    title: "Home page",
    blurb: "The hero headline, the studio statement, and the three services shown on the front page.",
    preview: "/",
    groups: [
      {
        title: "Hero",
        fields: [
          { kind: "text", name: "heroEyebrow", label: "Small line above the headline" },
          { kind: "text", name: "heroLine", label: "Headline — first line", hint: "e.g. Buildings that" },
          {
            kind: "list",
            name: "heroWords",
            label: "Headline — cycling words",
            itemLabel: "word",
            hint: "These rotate one after another under the first line",
          },
        ],
      },
      {
        title: "The studio",
        fields: [
          { kind: "text", name: "studioEyebrow", label: "Section label" },
          { kind: "textarea", name: "studioStatement", label: "Statement", rows: 4 },
          { kind: "text", name: "studioLinkLabel", label: "Link to the About page" },
        ],
      },
      {
        title: "Section headings",
        fields: [
          { kind: "text", name: "workHeading", label: "Projects section heading" },
          { kind: "text", name: "servicesHeading", label: "Services section heading" },
        ],
      },
      {
        title: "Services shown on the home page",
        fields: [
          {
            kind: "group",
            name: "services",
            label: "",
            itemLabel: "Service",
            fields: [
              { name: "title", label: "Title" },
              { name: "body", label: "Description", multiline: true },
            ],
          },
        ],
      },
    ],
  },

  {
    key: "about",
    title: "About page",
    blurb: "The studio story, the philosophy quote, the principal's bio, the team list and how you work.",
    preview: "/about",
    groups: [
      {
        title: "Opening",
        fields: [
          { kind: "text", name: "eyebrow", label: "Small line above the headline" },
          { kind: "textarea", name: "heading", label: "Headline", rows: 2 },
          {
            kind: "list",
            name: "story",
            label: "Studio story",
            itemLabel: "paragraph",
            multiline: true,
          },
        ],
      },
      {
        title: "Philosophy",
        fields: [
          { kind: "text", name: "philosophyEyebrow", label: "Section label" },
          {
            kind: "textarea",
            name: "philosophyQuote",
            label: "The quote",
            rows: 4,
            hint: "Quotation marks are added automatically",
          },
        ],
      },
      {
        title: "Principal architect",
        fields: [
          { kind: "text", name: "principalEyebrow", label: "Section label" },
          {
            kind: "list",
            name: "principalBio",
            label: "Biography",
            itemLabel: "paragraph",
            multiline: true,
            hint: "The name and title come from Studio details",
          },
        ],
      },
      {
        title: "The team",
        fields: [
          { kind: "text", name: "teamHeading", label: "Section heading" },
          { kind: "list", name: "team", label: "Team members", itemLabel: "person" },
        ],
      },
      {
        title: "How you work",
        fields: [
          { kind: "text", name: "approachHeading", label: "Section heading" },
          {
            kind: "group",
            name: "approach",
            label: "",
            itemLabel: "Principle",
            fields: [
              { name: "title", label: "Title" },
              { name: "body", label: "Description", multiline: true },
            ],
          },
        ],
      },
    ],
  },

  {
    key: "services",
    title: "Services page",
    blurb: "What the studio offers, and the brief-to-handover process.",
    preview: "/services",
    groups: [
      {
        title: "Opening",
        fields: [
          { kind: "text", name: "eyebrow", label: "Small line above the headline" },
          { kind: "textarea", name: "heading", label: "Headline", rows: 2 },
        ],
      },
      {
        title: "Services",
        fields: [
          {
            kind: "group",
            name: "services",
            label: "",
            itemLabel: "Service",
            fields: [
              { name: "title", label: "Title" },
              { name: "body", label: "Description", multiline: true },
              { name: "scope", label: "Scope line", multiline: false },
            ],
          },
        ],
      },
      {
        title: "The process",
        fields: [
          { kind: "text", name: "processEyebrow", label: "Small line above the heading" },
          { kind: "text", name: "processHeading", label: "Section heading" },
          {
            kind: "group",
            name: "process",
            label: "",
            itemLabel: "Step",
            fields: [
              { name: "title", label: "Step name" },
              { name: "body", label: "Description", multiline: true },
            ],
          },
        ],
      },
    ],
  },

  {
    key: "projects",
    title: "Projects & practice areas",
    blurb:
      "The portfolio index, plus the headline, introduction and three selling points on each of the Residential, Interiors and Institutional pages.",
    preview: "/projects",
    groups: [
      {
        title: "Portfolio index",
        fields: [
          { kind: "text", name: "eyebrow", label: "Small line above the headline" },
          { kind: "textarea", name: "heading", label: "Headline", rows: 2 },
          { kind: "textarea", name: "intro", label: "Introduction", rows: 3 },
          {
            kind: "text",
            name: "portalEyebrow",
            label: "Label above the three practice areas",
          },
          { kind: "text", name: "indexEyebrow", label: "Label above the full list" },
          { kind: "text", name: "indexHeading", label: "Full-list heading" },
          {
            kind: "text",
            name: "emptyNote",
            label: "Shown when a category has no projects yet",
          },
        ],
      },
      ...CATEGORIES.map(categoryGroup),
    ],
  },

  {
    key: "testimonials",
    title: "Testimonials page",
    blurb:
      "The headline and pull-quote on the testimonials page, plus the Google rating badge. The reviews themselves are managed under Testimonials.",
    preview: "/testimonials",
    groups: [
      {
        title: "Opening",
        fields: [
          { kind: "text", name: "eyebrow", label: "Small line above the headline" },
          { kind: "textarea", name: "heading", label: "Headline", rows: 2 },
          { kind: "textarea", name: "intro", label: "Introduction", rows: 3 },
        ],
      },
      {
        title: "Google rating badge",
        fields: [
          {
            kind: "text",
            name: "ratingValue",
            label: "Rating",
            hint: "Refreshed automatically when reviews are synced from Google",
          },
          { kind: "text", name: "reviewCount", label: "Number of Google reviews" },
          {
            kind: "text",
            name: "googleUrl",
            label: "Google listing URL",
            hint: "Where the badge links to",
          },
        ],
      },
      {
        title: "Pull-quote",
        fields: [
          {
            kind: "textarea",
            name: "pullQuote",
            label: "The oversized quote",
            rows: 2,
            hint: "Quotation marks are added automatically",
          },
          { kind: "text", name: "pullQuoteAuthor", label: "Who said it" },
        ],
      },
      {
        title: "Home page strip",
        fields: [
          { kind: "text", name: "homeEyebrow", label: "Small line above the heading" },
          { kind: "text", name: "homeHeading", label: "Section heading" },
          { kind: "text", name: "homeLinkLabel", label: "Link to the testimonials page" },
        ],
      },
    ],
  },

  {
    key: "contact",
    title: "Contact page",
    blurb: "The contact headline and the WhatsApp message visitors start with.",
    preview: "/contact",
    groups: [
      {
        title: "Opening",
        fields: [
          { kind: "text", name: "eyebrow", label: "Small line above the headline" },
          { kind: "textarea", name: "heading", label: "Headline", rows: 2 },
        ],
      },
      {
        title: "WhatsApp",
        fields: [
          { kind: "text", name: "whatsappLabel", label: "Link text" },
          {
            kind: "textarea",
            name: "whatsappMessage",
            label: "Pre-filled message",
            rows: 2,
            hint: "What the visitor's WhatsApp opens with",
          },
        ],
      },
    ],
  },
];

export const sectionMeta = (key: SectionKey) => SECTIONS.find((s) => s.key === key)!;
