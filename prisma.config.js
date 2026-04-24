/**
 * Configuração do Prisma 7 — Restaurante360
 * Usando require() para garantir compatibilidade com o loader do Prisma CLI
 */
require("dotenv/config");

/** @type {import('prisma/config').PrismaConfig} */
module.exports = {
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "npx ts-node --transpile-only --project tsconfig.scripts.json prisma/seed.ts",
  },

  datasource: {
    url: process.env.DATABASE_URL,
  },
};
