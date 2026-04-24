/**
 * Cliente Prisma 7 — Singleton para evitar múltiplas instâncias em dev (hot reload)
 *
 * No Prisma 7, é obrigatório usar um driver adapter (pg + @prisma/adapter-pg).
 * A URL do banco vem de process.env.DATABASE_URL.
 *
 * Uso em qualquer arquivo server-only:
 *   import { prisma } from "@/lib/prisma";
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

// Pool de conexões PostgreSQL (gerenciado pelo driver nativo pg)
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Adapter do Prisma para usar o pool do pg
const adapter = new PrismaPg(pool);

// Variável global para dev (evita instâncias duplicadas no hot-reload do Next.js)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
