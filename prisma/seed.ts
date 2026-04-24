/**
 * Seed inicial do Restaurante360
 *
 * Cria os dados de demonstração para o sistema funcionar do zero:
 * - 1 Plano (Starter)
 * - 1 Empresa (Restaurante Demo)
 * - 1 Unidade (Unidade Centro)
 * - 2 Áreas (Cozinha, Salão)
 * - 2 Funções (Chef de Cozinha, Garçom)
 * - 4 Usuários (1 por papel)
 * - 1 Categoria (Geral)
 *
 * IMPORTANTE: Totalmente isolado no PostgreSQL com Bcrypt. Nenhuma dependência do Firebase.
 *
 * COMO EXECUTAR:
 *   npx prisma db seed
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import bcrypt from "bcryptjs";

// ─── Conexão com o banco ───────────────────────────────────────

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Hash de senha (bcrypt) ───────────────────────────────────
async function hashSenha(senhaBase: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(senhaBase, salt);
}

// ─── Dados do Seed ────────────────────────────────────────────

// IDs fixos para idempotência
const IDS = {
  plano:         "seed-plano-starter",
  empresa:       "seed-empresa-demo",
  unidade:       "seed-unidade-centro",
  areaCozinha:   "seed-area-cozinha",
  areaSalao:     "seed-area-salao",
  funcaoChef:    "seed-funcao-chef",
  funcaoGarcom:  "seed-funcao-garcom",
  categoria:     "seed-categoria-geral",
  // UIDs dos usuários
  uidAdmin:      "seed-uid-admin",
  uidGestor:     "seed-uid-gestor",
  uidLocal:      "seed-uid-local",
  uidOperador:   "seed-uid-operador",
};

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("\n═══════════════════════════════════════════════");
  console.log("🌱 SEED INICIAL — Restaurante360 (PostgreSQL Only)");
  console.log("═══════════════════════════════════════════════\n");

  // ── 1. Plano ─────────────────────────────────────────────────
  console.log("💎 Criando Plano...");
  const plano = await prisma.plano.upsert({
    where: { id: IDS.plano },
    update: {},
    create: {
      id: IDS.plano,
      nome: "Starter",
      descricao: "Plano inicial para pequenos restaurantes",
      valorMensal: 99.90,
      valorAnual: 999.00,
      features: ["Tarefas", "Rotinas", "Processos", "Até 10 usuários"],
      ativo: true,
    },
  });
  console.log(`  ✅ Plano: ${plano.nome}\n`);

  // ── 2. Empresa ───────────────────────────────────────────────
  console.log("🏢 Criando Empresa Demo...");
  const empresa = await prisma.empresa.upsert({
    where: { id: IDS.empresa },
    update: {},
    create: {
      id: IDS.empresa,
      nome: "Restaurante Demo",
      cnpj: "00.000.000/0001-00",
      responsavelNome: "Gestor Demo",
      responsavelEmail: "gestor@demo.com",
      whatsappResponsavel: "(11) 99999-9999",
      status: "ATIVO",
      planoId: IDS.plano,
      planoNome: "Starter",
      diasTrial: 0,
      trialInicio: null,
      trialFim: null,
    },
  });
  console.log(`  ✅ Empresa: ${empresa.nome} (${empresa.cnpj})\n`);

  // ── 3. Unidade ───────────────────────────────────────────────
  console.log("🏠 Criando Unidade...");
  const unidade = await prisma.unidade.upsert({
    where: { id: IDS.unidade },
    update: {},
    create: {
      id: IDS.unidade,
      empresaId: IDS.empresa,
      nome: "Unidade Centro",
      endereco: "Rua das Flores, 123",
      cidade: "São Paulo",
      estado: "SP",
      status: "ativo",
    },
  });
  console.log(`  ✅ Unidade: ${unidade.nome}\n`);

  // ── 4. Áreas ─────────────────────────────────────────────────
  console.log("🗂️  Criando Áreas...");
  const areaCozinha = await prisma.area.upsert({
    where: { id: IDS.areaCozinha },
    update: {},
    create: {
      id: IDS.areaCozinha,
      empresaId: IDS.empresa,
      nome: "Cozinha",
      descricao: "Área de produção de alimentos",
      status: "ativo",
    },
  });
  const areaSalao = await prisma.area.upsert({
    where: { id: IDS.areaSalao },
    update: {},
    create: {
      id: IDS.areaSalao,
      empresaId: IDS.empresa,
      nome: "Salão",
      descricao: "Área de atendimento ao cliente",
      status: "ativo",
    },
  });
  console.log(`  ✅ Áreas: ${areaCozinha.nome}, ${areaSalao.nome}\n`);

  // ── 5. Funções ───────────────────────────────────────────────
  console.log("👷 Criando Funções...");
  const funcaoChef = await prisma.funcao.upsert({
    where: { id: IDS.funcaoChef },
    update: {},
    create: {
      id: IDS.funcaoChef,
      areaId: IDS.areaCozinha,
      nome: "Chef de Cozinha",
      descricao: "Responsável pela produção e qualidade dos pratos",
      status: "ativo",
    },
  });
  const funcaoGarcom = await prisma.funcao.upsert({
    where: { id: IDS.funcaoGarcom },
    update: {},
    create: {
      id: IDS.funcaoGarcom,
      areaId: IDS.areaSalao,
      nome: "Garçom",
      descricao: "Responsável pelo atendimento das mesas",
      status: "ativo",
    },
  });
  console.log(`  ✅ Funções: ${funcaoChef.nome}, ${funcaoGarcom.nome}\n`);

  // ── 6. Categoria ─────────────────────────────────────────────
  console.log("🏷️  Criando Categoria...");
  await prisma.categoria.upsert({
    where: { id: IDS.categoria },
    update: {},
    create: {
      id: IDS.categoria,
      empresaId: IDS.empresa,
      nome: "Geral",
      tipo: "geral",
      ativa: true,
      ordem: 1,
    },
  });
  console.log(`  ✅ Categoria: Geral\n`);

  // ── 7. Usuários ──────────────────────────────────────────────
  console.log("👤 Criando Usuários (PostgreSQL + Bcrypt)...");

  const usuariosSeed = [
    {
      uid: IDS.uidAdmin,
      email: "admin@r360.com",
      nome: "Admin SaaS",
      papel: "saasAdmin" as const,
      empresaId: null,
      unidadeId: null,
      areaId: null,
      funcaoId: null,
    },
    {
      uid: IDS.uidGestor,
      email: "gestor@demo.com",
      nome: "Gestor Demo",
      papel: "gestorCorporativo" as const,
      empresaId: IDS.empresa,
      unidadeId: null,
      areaId: null,
      funcaoId: null,
    },
    {
      uid: IDS.uidLocal,
      email: "local@demo.com",
      nome: "Gestor Local",
      papel: "gestorLocal" as const,
      empresaId: IDS.empresa,
      unidadeId: IDS.unidade,
      areaId: null,
      funcaoId: null,
    },
    {
      uid: IDS.uidOperador,
      email: "operador@demo.com",
      nome: "Operador Demo",
      papel: "operacional" as const,
      empresaId: IDS.empresa,
      unidadeId: IDS.unidade,
      areaId: IDS.areaCozinha,
      funcaoId: IDS.funcaoChef,
    },
  ];

  const senhaPadrao = "Senha@123!";
  const hash = await hashSenha(senhaPadrao);

  for (const u of usuariosSeed) {
    await prisma.usuario.upsert({
      where: { id: u.uid },
      update: {
        nome: u.nome,
        papel: u.papel,
        status: "ativo",
        empresaId: u.empresaId,
        unidadeId: u.unidadeId,
        areaId: u.areaId,
        funcaoId: u.funcaoId,
        senhaHash: hash,
        mustResetPassword: false,
      },
      create: {
        id: u.uid,
        email: u.email,
        nome: u.nome,
        papel: u.papel,
        status: "ativo",
        empresaId: u.empresaId,
        unidadeId: u.unidadeId,
        areaId: u.areaId,
        funcaoId: u.funcaoId,
        senhaHash: hash,
        mustResetPassword: false,
      },
    });

    console.log(`  ✅ ${u.papel.padEnd(20)} → ${u.email}`);
  }

  // ── 8. Resumo ────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════");
  console.log("📊 RESUMO DO SEED");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Planos:     ${await prisma.plano.count()}`);
  console.log(`  Empresas:   ${await prisma.empresa.count()}`);
  console.log(`  Unidades:   ${await prisma.unidade.count()}`);
  console.log(`  Áreas:      ${await prisma.area.count()}`);
  console.log(`  Funções:    ${await prisma.funcao.count()}`);
  console.log(`  Usuários:   ${await prisma.usuario.count()}`);
  console.log(`  Categorias: ${await prisma.categoria.count()}`);

  console.log(`\n🔑 CREDENCIAIS DE ACESSO (senha: ${senhaPadrao})`);
  console.log("  admin@r360.com    → saasAdmin         → /sistema");
  console.log("  gestor@demo.com   → gestorCorporativo → /empresa");
  console.log("  local@demo.com    → gestorLocal       → /unidade");
  console.log("  operador@demo.com → operacional       → /operacional");
  console.log("\n🎉 Seed concluído com sucesso!");
}

main()
  .catch((err) => {
    console.error("💥 Erro no seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
