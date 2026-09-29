import { prisma } from "./client.js";
import { hashPassword } from "../utils/security.js";

async function main() {
  const passwordHash = hashPassword("admin123");
  await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: { passwordHash },
    create: {
      username: "admin",
      passwordHash,
      fullName: "Super Admin",
      role: "SUPER_ADMIN",
    },
  });
  console.log("Admin password updated successfully with current JWT_SECRET!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
