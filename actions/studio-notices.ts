"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/require-auth";

/**
 * Dismissing a notice records its key; it does not touch the thing the
 * notice was about. Clearing "New enquiry from Ananya" must not mark the
 * enquiry as contacted — that is a pipeline decision and it belongs to
 * the stage control, not to tidying up a list.
 */
const keySchema = z.string().trim().min(1).max(200);

export async function dismissNotice(key: string) {
  await requireUser();
  const parsed = keySchema.parse(key);
  // Upsert rather than create: two clicks on the same X, or two tabs open
  // on the same dashboard, must not raise a unique-constraint error at
  // somebody trying to tidy their screen.
  await prisma.noticeDismissal.upsert({
    where: { key: parsed },
    create: { key: parsed },
    update: {},
  });
  revalidatePath("/studio", "layout");
}

export async function dismissNotices(keys: string[]) {
  await requireUser();
  const parsed = z.array(keySchema).max(200).parse(keys);
  if (parsed.length === 0) return;
  await prisma.noticeDismissal.createMany({
    data: parsed.map((key) => ({ key })),
    skipDuplicates: true,
  });
  revalidatePath("/studio", "layout");
}
