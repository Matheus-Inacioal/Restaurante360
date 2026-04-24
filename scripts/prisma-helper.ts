/**
 * Helper de conexão Prisma 7 para scripts de migração.
 *
 * Exporta uma instância do PrismaClient configurada com o adapter pg,
 * compatível com o Prisma 7 (que exige driver adapter).
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL não configurada. Defina no .env ou .env.local");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
export { pool };
