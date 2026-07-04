"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/require-auth";

const statusSchema = z.enum(["NEW", "CONTACTED", "DISCUSSION", "WON", "LOST"]);

export async function updateLeadStatus(id: string, status: string) {
  await requireUser();
  const parsed = statusSchema.parse(status);
  await prisma.lead.update({ where: { id }, data: { status: parsed } });
  revalidatePath("/studio/leads");
  revalidatePath("/studio/dashboard");
}

export async function saveLeadNotes(id: string, notes: string) {
  await requireUser();
  await prisma.lead.update({
    where: { id },
    data: { notes: notes.slice(0, 10_000) },
  });
  revalidatePath("/studio/leads");
}

export async function deleteLead(id: string) {
  await requireUser();
  await prisma.lead.delete({ where: { id } });
  revalidatePath("/studio/leads");
  revalidatePath("/studio/dashboard");
}
