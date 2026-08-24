import { PrismaClient } from "../node_modules/@prisma/client-pg";
import { ensureAghTables } from "./ensure-agh-tables";

async function main() {
  const p = new PrismaClient();
  try {
    await ensureAghTables(p);
    console.log("OK: tablas agh_usuarios y agh_soporte");
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
