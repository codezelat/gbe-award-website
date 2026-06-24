import type { APIContext } from "astro";
import { auth } from "../auth";

export async function getAdminSession(headers: Headers) {
  const session = await auth.api.getSession({
    headers,
    query: { disableCookieCache: true },
  });

  if (!session?.user) {
    return null;
  }

  const allowedEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (allowedEmail && session.user.email.toLowerCase() !== allowedEmail) {
    return null;
  }

  return session;
}

export async function requireAdmin(context: APIContext) {
  const session = await getAdminSession(context.request.headers);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  }

  return null;
}

export function noStoreJson(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...(init.headers ?? {}),
    },
  });
}
