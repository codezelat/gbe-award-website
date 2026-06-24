import type { APIRoute } from "astro";
import { noStoreJson, requireAdmin } from "../../../../lib/admin/auth";
import { createWinner, listWinners, winnerInputSchema } from "../../../../lib/admin/content";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  return noStoreJson(await listWinners(new URL(context.request.url)));
};

export const POST: APIRoute = async (context) => {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  const parsed = winnerInputSchema.safeParse(await context.request.json());
  if (!parsed.success) {
    return noStoreJson({ error: "Invalid winner data", issues: parsed.error.flatten() }, { status: 422 });
  }

  try {
    return noStoreJson({ row: await createWinner(parsed.data) }, { status: 201 });
  } catch {
    return noStoreJson({ error: "Could not save winner. Check that the slug is unique." }, { status: 409 });
  }
};
