import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "../src/lib/auth";
import { db, schema } from "../src/lib/db";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
}

if (password.length < 10) {
  throw new Error("ADMIN_PASSWORD must be at least 10 characters.");
}

const existing = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, email)).limit(1);

if (existing[0]) {
  await db.update(schema.user).set({ role: "admin", updatedAt: new Date() }).where(eq(schema.user.id, existing[0].id));
  console.log("Admin user already exists; role checked.");
  process.exit(0);
}

const response = await auth.handler(
  new Request(`${process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:4321"}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "GBE Administrator",
      email,
      password,
      rememberMe: false,
    }),
  }),
);

if (!response.ok) {
  const body = await response.text();
  throw new Error(`Admin user could not be created: ${response.status} ${body}`);
}

const created = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, email)).limit(1);
if (created[0]) {
  await db.update(schema.user).set({ role: "admin", updatedAt: new Date() }).where(eq(schema.user.id, created[0].id));
}

console.log("Admin user created.");
