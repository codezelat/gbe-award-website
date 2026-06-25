import type { APIRoute } from "astro";
import { noStoreJson, requireAdmin } from "../../../lib/admin/auth";
import { uploadImageToR2 } from "../../../lib/admin/r2";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  try {
    const result = await uploadImageToR2(await context.request.formData());
    if (!result.ok) {
      return noStoreJson({ error: result.error }, { status: result.status });
    }

    return noStoreJson({ key: result.key, url: result.url }, { status: 201 });
  } catch {
    return noStoreJson({ error: "Image upload failed. Check R2 configuration and try again." }, { status: 500 });
  }
};
