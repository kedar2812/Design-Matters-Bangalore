/**
 * Guard: every editable content section must survive a round trip
 * through the dashboard unchanged.
 *
 * Run: npx tsx scripts/check-content-schemas.ts
 *
 * The bug this exists to catch is silent by construction. Saving a
 * section posts the whole merged object to `saveSection`, zod strips any
 * key its schema does not name, and `getSection` then merges what was
 * stored back over the built-in defaults. So a field that exists in the
 * shape but not in the schema is dropped on save and restored from the
 * default on read: the studio edits it, the form says "Saved", the page
 * does not change, and no error is raised anywhere. The reverse — a
 * required key the shape no longer has — is louder but stranger, because
 * the save fails naming a control that is not on the screen.
 *
 * Three things are checked for each section:
 *
 *   1. the defaults parse (so the form can save an untouched section),
 *   2. nothing is lost in doing so (no silently stripped field),
 *   3. every field the dashboard renders is a field the schema accepts.
 *
 * (3) is what stops a control being added to `content-schema.ts` that
 * looks editable and is not.
 */
import "dotenv/config";
import { z } from "zod";
import { DEFAULTS, SECTION_KEYS, type SectionKey } from "@/lib/content-defaults";
import { SECTION_SCHEMAS } from "@/lib/content-validation";
import { SECTIONS } from "@/lib/content-schema";

const problems: string[] = [];
const note = (section: string, message: string) =>
  problems.push(`${section}: ${message}`);

/** Field names the dashboard actually renders for a section. */
function renderedFields(key: SectionKey): string[] {
  const meta = SECTIONS.find((s) => s.key === key);
  if (!meta) return [];
  return meta.groups.flatMap((g) => g.fields.map((f) => f.name));
}

for (const key of SECTION_KEYS) {
  const schema = SECTION_SCHEMAS[key];
  if (!schema) {
    note(key, "has no validation schema in lib/content-validation.ts");
    continue;
  }

  const defaults = DEFAULTS[key] as Record<string, unknown>;
  const parsed = schema.safeParse(defaults);

  if (!parsed.success) {
    const fields = z.flattenError(parsed.error).fieldErrors as Record<string, string[]>;
    for (const [field, errors] of Object.entries(fields)) {
      note(key, `cannot save its own defaults — "${field}": ${errors?.[0]}`);
    }
    continue;
  }

  const saved = parsed.data as Record<string, unknown>;
  for (const field of Object.keys(defaults)) {
    if (!(field in saved)) {
      note(key, `"${field}" is dropped on save — the schema does not name it`);
    }
  }

  for (const field of renderedFields(key)) {
    if (!(field in saved)) {
      note(key, `the dashboard renders "${field}", but saving discards it`);
    }
  }
}

if (problems.length > 0) {
  console.error(`\n${problems.length} content-schema problem(s):\n`);
  for (const p of problems) console.error("  " + p);
  console.error("");
  process.exit(1);
}

console.log(`Content schemas are in step across ${SECTION_KEYS.length} sections.`);
