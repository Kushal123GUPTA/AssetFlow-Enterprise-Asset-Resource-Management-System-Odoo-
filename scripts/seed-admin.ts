/**
 * Seed (or promote) the first Admin for an organization.
 * Signup never creates Admin — run this once per org.
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts
 *
 * Reads from .env:
 *   SEED_ORG_NAME, SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import bcrypt from "bcryptjs";
import { eq, ilike, and, isNull } from "drizzle-orm";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL missing in .env");
    process.exit(1);
  }

  const orgName = (process.env.SEED_ORG_NAME || "AssetFlow Demo").trim();
  const adminName = (process.env.SEED_ADMIN_NAME || "System Admin").trim();
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@gmail.com")
    .toLowerCase()
    .trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";

  if (adminPassword.length < 8) {
    console.error("SEED_ADMIN_PASSWORD must be at least 8 characters");
    process.exit(1);
  }

  const { db } = await import("../src/db");
  const { employees, organizations } = await import("../src/db/schema");

  let [org] = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(ilike(organizations.name, orgName))
    .limit(1);

  if (!org) {
    [org] = await db
      .insert(organizations)
      .values({ name: orgName })
      .returning({ id: organizations.id, name: organizations.name });
    console.log(`Created organization: ${org.name}`);
  } else {
    console.log(`Using organization: ${org.name}`);
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const [existing] = await db
    .select({ id: employees.id, role: employees.role })
    .from(employees)
    .where(and(eq(employees.email, adminEmail), isNull(employees.deletedAt)))
    .limit(1);

  if (existing) {
    await db
      .update(employees)
      .set({
        role: "admin",
        name: adminName,
        passwordHash,
        organizationId: org.id,
        status: "active",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(employees.id, existing.id));
    console.log(`Updated existing user → admin: ${adminEmail}`);
  } else {
    await db.insert(employees).values({
      name: adminName,
      email: adminEmail,
      passwordHash,
      organizationId: org.id,
      role: "admin",
      status: "active",
    });
    console.log(`Created admin: ${adminEmail}`);
  }

  console.log("\nDone. Sign in with:");
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: (SEED_ADMIN_PASSWORD from .env)`);
  console.log("Then promote other users from Employee Directory.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
