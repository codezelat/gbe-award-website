import type { APIRoute } from "astro";
import { noStoreJson, requireAdmin } from "../../../../lib/admin/auth";
import { deleteWinner, updateWinner, winnerInputSchema } from "../../../../lib/admin/content";

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  const id = context.params.id;
  if (!id) return noStoreJson({ error: "Missing winner id" }, { status: 400 });

  const parsed = winnerInputSchema.safeParse(await context.request.json());
  if (!parsed.success) {
    return noStoreJson({ error: "Invalid winner data", issues: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const row = await updateWinner(id, parsed.data);
    if (!row) return noStoreJson({ error: "Winner not found" }, { status: 404 });
    return noStoreJson({ row });
  } catch {
    return noStoreJson({ error: "Could not update winner. Check that the slug is unique." }, { status: 409 });
  }
};

export const DELETE: APIRoute = async (context) => {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  const id = context.params.id;
  if (!id) return noStoreJson({ error: "Missing winner id" }, { status: 400 });

  await deleteWinner(id);
  return noStoreJson({ ok: true });
};
