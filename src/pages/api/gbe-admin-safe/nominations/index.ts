import type { APIRoute } from "astro";
import { noStoreJson, requireAdmin } from "../../../../lib/admin/auth";
import { createNomination, listNominations, nominationInputSchema } from "../../../../lib/admin/content";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  return noStoreJson(await listNominations(new URL(context.request.url)));
};

export const POST: APIRoute = async (context) => {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  const parsed = nominationInputSchema.safeParse(await context.request.json());
  if (!parsed.success) {
    return noStoreJson({ error: "Invalid nomination data", issues: parsed.error.flatten() }, { status: 422 });
  }

  try {
    return noStoreJson({ row: await createNomination(parsed.data) }, { status: 201 });
  } catch {
    return noStoreJson({ error: "Could not save nomination. Check that the slug is unique." }, { status: 409 });
  }
};
