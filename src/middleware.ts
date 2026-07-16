import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const noIndexHeader = "noindex, nofollow, noarchive, nosnippet";
  const isProtectedSurface =
    url.pathname.startsWith("/gbe-admin-safe") ||
    url.pathname.startsWith("/api/gbe-admin-safe") ||
    url.pathname.startsWith("/api/auth");

  if (!url.pathname.startsWith("/gbe-admin-safe")) {
    const response = await next();
    if (isProtectedSurface) {
      response.headers.set("X-Robots-Tag", noIndexHeader);
      response.headers.set("Cache-Control", "no-store");
    }
    return response;
  }

  // Keep Better Auth, Drizzle, and Neon out of every public-page execution.
  // This branch only runs for the protected admin HTML surface.
  const { getAdminSession } = await import("./lib/admin/auth");
  const session = await getAdminSession(context.request.headers);

  if (url.pathname === "/gbe-admin-safe/") {
    if (session) {
      const response = context.redirect("/gbe-admin-safe/overview");
      response.headers.set("X-Robots-Tag", noIndexHeader);
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    const response = await next();
    response.headers.set("X-Robots-Tag", noIndexHeader);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (!session) {
    const response = context.redirect("/gbe-admin-safe/");
    response.headers.set("X-Robots-Tag", noIndexHeader);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const response = await next();
  response.headers.set("X-Robots-Tag", noIndexHeader);
  response.headers.set("Cache-Control", "no-store");
  return response;
});
