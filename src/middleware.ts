import { defineMiddleware } from "astro:middleware";
import { getAdminSession } from "./lib/admin/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  if (!url.pathname.startsWith("/gbe-admin-safe")) {
    return next();
  }

  const session = await getAdminSession(context.request.headers);

  if (url.pathname === "/gbe-admin-safe/") {
    if (session) {
      return context.redirect("/gbe-admin-safe/overview");
    }
    return next();
  }

  if (!session) {
    return context.redirect("/gbe-admin-safe/");
  }

  return next();
});
