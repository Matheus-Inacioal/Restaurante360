/**
 * MIGRAÇÃO FASE 0 — Popular UsuarioEmpresa a partir dos vínculos atuais.
 *
 * O QUE FAZ:
 *   Para cada usuário que hoje tem um empresaId (vínculo 1:1 antigo),
 *   cria a linha correspondente em UsuarioEmpresa, copiando o papel e o
 *   nivelHierarquia atuais do usuário.
 *
 * O QUE NÃO FAZ (de propósito):
 *   - NÃO apaga o empresaId antigo do Usuario (fica como fallback).
 *   - NÃO toca em saasAdmin (esse não pertence a empresa nenhuma).
 *   - NÃO altera login, guards ou permissões.
 *
 * É IDEMPOTENTE: pode rodar várias vezes sem duplicar (usa upsert na PK
 * composta). Se rodar de novo, só atualiza papel/nível se tiverem mudado.
 *
 * COMO RODAR:
 *   npx ts-node --transpile-only --project tsconfig.scripts.json prisma/migracao-fase0-usuario-empresa.ts
 *   (ajuste o caminho/projeto conforme seu tsconfig de scripts; é o mesmo
 *    padrão que o seed usa no prisma.config.js)
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  max: 1,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔁 Migração Fase 0 — populando UsuarioEmpresa...\n");

  // Busca todos os usuários que têm empresaId (exclui saasAdmin, que é null)
  const usuarios = await prisma.usuario.findMany({
    where: {
      empresaId: { not: null },
    },
    select: {
      id: true,
      email: true,
      empresaId: true,
      papel: true,
      nivelHierarquia: true,
    },
  });

  console.log(`Encontrados ${usuarios.length} usuários com empresa vinculada.\n`);

  let criados = 0;
  let atualizados = 0;

  for (const u of usuarios) {
    // Type guard: empresaId não é null aqui por causa do filtro acima
    if (!u.empresaId) continue;

    const existente = await prisma.usuarioEmpresa.findUnique({
      where: {
        usuarioId_empresaId: {
          usuarioId: u.id,
          empresaId: u.empresaId,
        },
      },
    });

    await prisma.usuarioEmpresa.upsert({
      where: {
        usuarioId_empresaId: {
          usuarioId: u.id,
          empresaId: u.empresaId,
        },
      },
      update: {
        papel: u.papel,
        nivelHierarquia: u.nivelHierarquia,
      },
      create: {
        usuarioId: u.id,
        empresaId: u.empresaId,
        papel: u.papel,
        nivelHierarquia: u.nivelHierarquia,
      },
    });

    if (existente) {
      atualizados++;
    } else {
      criados++;
      console.log(
        `  ✅ ${u.email.padEnd(30)} → empresa ${u.empresaId} (${u.nivelHierarquia ?? u.papel})`
      );
    }
  }

  console.log(`\n✔️  Concluído. ${criados} vínculos criados, ${atualizados} já existiam (atualizados).`);
}

main()
  .catch((e) => {
    console.error("❌ Erro na migração Fase 0:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
