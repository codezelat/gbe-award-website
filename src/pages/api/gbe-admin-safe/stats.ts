import type { APIRoute } from "astro";
import { requireAdmin, noStoreJson } from "../../../lib/admin/auth";
import { getDashboardStats } from "../../../lib/admin/content";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  return noStoreJson(await getDashboardStats());
};
