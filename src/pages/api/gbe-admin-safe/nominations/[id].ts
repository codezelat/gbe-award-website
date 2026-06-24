import type { APIRoute } from "astro";
import { noStoreJson, requireAdmin } from "../../../../lib/admin/auth";
import { deleteNomination, nominationInputSchema, updateNomination } from "../../../../lib/admin/content";

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  const id = context.params.id;
  if (!id) return noStoreJson({ error: "Missing nomination id" }, { status: 400 });

  const parsed = nominationInputSchema.safeParse(await context.request.json());
  if (!parsed.success) {
    return noStoreJson({ error: "Invalid nomination data", issues: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const row = await updateNomination(id, parsed.data);
    if (!row) return noStoreJson({ error: "Nomination not found" }, { status: 404 });
    return noStoreJson({ row });
  } catch {
    return noStoreJson({ error: "Could not update nomination. Check that the slug is unique." }, { status: 409 });
  }
};

export const DELETE: APIRoute = async (context) => {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  const id = context.params.id;
  if (!id) return noStoreJson({ error: "Missing nomination id" }, { status: 400 });

  await deleteNomination(id);
  return noStoreJson({ ok: true });
};
