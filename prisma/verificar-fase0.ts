/**
 * VERIFICAÇÃO FASE 0 — Confere se a UsuarioEmpresa reflete os vínculos atuais.
 *
 * Somente LEITURA. Não altera nada. Roda depois da migração para você
 * confirmar, com os próprios olhos, que cada usuário foi vinculado certo
 * ANTES de seguir para as próximas fases.
 *
 * O que checa:
 *   1. Todo usuário com empresaId tem um vínculo correspondente em UsuarioEmpresa.
 *   2. Nenhum vínculo tem papel/nível divergente do usuário de origem.
 *   3. Mostra um resumo e aponta qualquer inconsistência.
 *
 * COMO RODAR:
 *   npx ts-node --transpile-only --project tsconfig.scripts.json prisma/verificar-fase0.ts
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
  console.log("🔍 Verificação Fase 0 — UsuarioEmpresa vs. empresaId atual\n");

  const usuariosComEmpresa = await prisma.usuario.findMany({
    where: { empresaId: { not: null } },
    select: { id: true, email: true, empresaId: true, papel: true, nivelHierarquia: true },
  });

  const totalVinculos = await prisma.usuarioEmpresa.count();

  console.log(`Usuários com empresaId:      ${usuariosComEmpresa.length}`);
  console.log(`Linhas em UsuarioEmpresa:    ${totalVinculos}\n`);

  let faltando = 0;
  let divergentes = 0;

  for (const u of usuariosComEmpresa) {
    if (!u.empresaId) continue;

    const vinculo = await prisma.usuarioEmpresa.findUnique({
      where: {
        usuarioId_empresaId: { usuarioId: u.id, empresaId: u.empresaId },
      },
    });

    if (!vinculo) {
      console.log(`  ❌ FALTANDO: ${u.email} não tem vínculo com ${u.empresaId}`);
      faltando++;
      continue;
    }

    if (vinculo.papel !== u.papel || vinculo.nivelHierarquia !== u.nivelHierarquia) {
      console.log(
        `  ⚠️  DIVERGENTE: ${u.email} — usuário(${u.papel}/${u.nivelHierarquia}) vs vínculo(${vinculo.papel}/${vinculo.nivelHierarquia})`
      );
      divergentes++;
    }
  }

  // saasAdmin não deve ter vínculo — confirma isso
  const saasAdmins = await prisma.usuario.findMany({
    where: { papel: "saasAdmin" },
    select: { id: true, email: true },
  });
  for (const admin of saasAdmins) {
    const temVinculo = await prisma.usuarioEmpresa.count({ where: { usuarioId: admin.id } });
    if (temVinculo > 0) {
      console.log(`  ⚠️  saasAdmin ${admin.email} NÃO deveria ter vínculo de empresa, mas tem ${temVinculo}.`);
      divergentes++;
    }
  }

  console.log("\n─────────────────────────────────────");
  if (faltando === 0 && divergentes === 0) {
    console.log("✅ TUDO CERTO. Todos os vínculos batem. Fase 0 concluída com sucesso.");
  } else {
    console.log(`❗ ATENÇÃO: ${faltando} faltando, ${divergentes} divergentes. Revise antes de seguir.`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Erro na verificação:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
