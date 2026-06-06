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

  // ── 7. Permissões ─────────────────────────────────────────────
  console.log("🔑 Criando Permissões...");
  const permissoesObj = [
    // Dashboard
    { nome: "dashboard:visualizar_geral", modulo: "DASHBOARD" as const, descricao: "visualizar dashboard geral" },
    { nome: "dashboard:visualizar_unidade", modulo: "DASHBOARD" as const, descricao: "visualizar indicadores da unidade" },
    { nome: "dashboard:visualizar_pendencias", modulo: "DASHBOARD" as const, descricao: "visualizar pendências do dia" },
    // Tarefas
    { nome: "tarefas:visualizar", modulo: "TAREFAS" as const, descricao: "visualizar tarefas" },
    { nome: "tarefas:criar", modulo: "TAREFAS" as const, descricao: "criar tarefas" },
    { nome: "tarefas:editar", modulo: "TAREFAS" as const, descricao: "editar tarefas" },
    { nome: "tarefas:excluir", modulo: "TAREFAS" as const, descricao: "excluir tarefas" },
    { nome: "tarefas:atribuir", modulo: "TAREFAS" as const, descricao: "atribuir tarefas" },
    { nome: "tarefas:concluir", modulo: "TAREFAS" as const, descricao: "concluir tarefas" },
    { nome: "tarefas:validar", modulo: "TAREFAS" as const, descricao: "validar tarefas concluídas" },
    { nome: "tarefas:reabrir", modulo: "TAREFAS" as const, descricao: "reabrir tarefas" },
    // Checklists
    { nome: "checklists:visualizar", modulo: "CHECKLISTS" as const, descricao: "visualizar checklists" },
    { nome: "checklists:criar", modulo: "CHECKLISTS" as const, descricao: "criar modelos de checklist" },
    { nome: "checklists:editar", modulo: "CHECKLISTS" as const, descricao: "editar modelos de checklist" },
    { nome: "checklists:excluir", modulo: "CHECKLISTS" as const, descricao: "excluir modelos de checklist" },
    { nome: "checklists:executar", modulo: "CHECKLISTS" as const, descricao: "executar checklist" },
    { nome: "checklists:acompanhar", modulo: "CHECKLISTS" as const, descricao: "acompanhar execução" },
    { nome: "checklists:validar", modulo: "CHECKLISTS" as const, descricao: "validar checklist concluído" },
    // Rotinas
    { nome: "rotinas:visualizar", modulo: "ROTINAS" as const, descricao: "visualizar rotinas" },
    { nome: "rotinas:criar", modulo: "ROTINAS" as const, descricao: "criar rotinas recorrentes" },
    { nome: "rotinas:editar", modulo: "ROTINAS" as const, descricao: "editar rotinas" },
    { nome: "rotinas:excluir", modulo: "ROTINAS" as const, descricao: "excluir rotinas" },
    { nome: "rotinas:atribuir", modulo: "ROTINAS" as const, descricao: "atribuir rotina" },
    { nome: "rotinas:acompanhar", modulo: "ROTINAS" as const, descricao: "acompanhar rotina" },
    { nome: "rotinas:validar", modulo: "ROTINAS" as const, descricao: "validar rotina" },
    // Receitas e POPs
    { nome: "receitas:visualizar", modulo: "RECEITAS_POPS" as const, descricao: "visualizar receitas" },
    { nome: "receitas:criar", modulo: "RECEITAS_POPS" as const, descricao: "criar receitas" },
    { nome: "receitas:editar", modulo: "RECEITAS_POPS" as const, descricao: "editar receitas" },
    { nome: "receitas:excluir", modulo: "RECEITAS_POPS" as const, descricao: "excluir receitas" },
    { nome: "pops:visualizar", modulo: "RECEITAS_POPS" as const, descricao: "visualizar POPs" },
    { nome: "pops:criar", modulo: "RECEITAS_POPS" as const, descricao: "criar POPs" },
    { nome: "pops:editar", modulo: "RECEITAS_POPS" as const, descricao: "editar POPs" },
    { nome: "pops:excluir", modulo: "RECEITAS_POPS" as const, descricao: "excluir POPs" },
    // Ocorrências
    { nome: "ocorrencias:registrar", modulo: "OCORRENCIAS" as const, descricao: "registrar ocorrência" },
    { nome: "ocorrencias:visualizar", modulo: "OCORRENCIAS" as const, descricao: "visualizar ocorrências" },
    { nome: "ocorrencias:editar", modulo: "OCORRENCIAS" as const, descricao: "editar ocorrência" },
    { nome: "ocorrencias:tratar", modulo: "OCORRENCIAS" as const, descricao: "tratar ocorrência" },
    { nome: "ocorrencias:concluir", modulo: "OCORRENCIAS" as const, descricao: "concluir ocorrência" },
    { nome: "ocorrencias:historico", modulo: "OCORRENCIAS" as const, descricao: "visualizar histórico de ocorrências" },
    // Ponto e Escala
    { nome: "ponto:bater", modulo: "PONTO_ESCALA" as const, descricao: "bater próprio ponto" },
    { nome: "ponto:visualizar_proprio", modulo: "PONTO_ESCALA" as const, descricao: "visualizar próprio ponto" },
    { nome: "ponto:visualizar_saldo_proprio", modulo: "PONTO_ESCALA" as const, descricao: "visualizar saldo próprio" },
    { nome: "ponto:visualizar_equipe", modulo: "PONTO_ESCALA" as const, descricao: "visualizar ponto da equipe" },
    { nome: "ponto:visualizar_banco_equipe", modulo: "PONTO_ESCALA" as const, descricao: "visualizar banco de horas da equipe" },
    { nome: "ponto:justificar", modulo: "PONTO_ESCALA" as const, descricao: "justificar ponto" },
    { nome: "ponto:corrigir", modulo: "PONTO_ESCALA" as const, descricao: "corrigir ponto" },
    { nome: "ponto:aprovar_ajuste", modulo: "PONTO_ESCALA" as const, descricao: "aprovar ajuste de ponto" },
    { nome: "ponto:configurar_escala", modulo: "PONTO_ESCALA" as const, descricao: "configurar escala" },
    { nome: "ponto:relatorio", modulo: "PONTO_ESCALA" as const, descricao: "gerar relatório de ponto" },
    // Usuários e Permissões
    { nome: "usuarios:visualizar", modulo: "USUARIOS_PERMISSOES" as const, descricao: "visualizar usuários" },
    { nome: "usuarios:criar", modulo: "USUARIOS_PERMISSOES" as const, descricao: "criar usuários" },
    { nome: "usuarios:editar", modulo: "USUARIOS_PERMISSOES" as const, descricao: "editar usuários" },
    { nome: "usuarios:desativar", modulo: "USUARIOS_PERMISSOES" as const, descricao: "desativar usuários" },
    { nome: "usuarios:vincular_unidade", modulo: "USUARIOS_PERMISSOES" as const, descricao: "vincular usuário à unidade" },
    { nome: "usuarios:vincular_area", modulo: "USUARIOS_PERMISSOES" as const, descricao: "vincular usuário à área" },
    { nome: "usuarios:definir_cargo", modulo: "USUARIOS_PERMISSOES" as const, descricao: "definir cargo/função" },
    { nome: "usuarios:alterar_permissoes", modulo: "USUARIOS_PERMISSOES" as const, descricao: "alterar permissões" },
    { nome: "usuarios:alterar_hierarquia", modulo: "USUARIOS_PERMISSOES" as const, descricao: "alterar hierarquia" },
    // Relatórios
    { nome: "relatorios:visualizar_operacionais", modulo: "RELATORIOS" as const, descricao: "visualizar relatórios operacionais" },
    { nome: "relatorios:visualizar_tarefas", modulo: "RELATORIOS" as const, descricao: "visualizar relatórios de tarefas" },
    { nome: "relatorios:visualizar_checklists", modulo: "RELATORIOS" as const, descricao: "visualizar relatórios de checklists" },
    { nome: "relatorios:visualizar_rotinas", modulo: "RELATORIOS" as const, descricao: "visualizar relatórios de rotinas" },
    { nome: "relatorios:visualizar_ocorrencias", modulo: "RELATORIOS" as const, descricao: "visualizar relatórios de ocorrências" },
    { nome: "relatorios:visualizar_ponto", modulo: "RELATORIOS" as const, descricao: "visualizar relatórios de ponto" },
    { nome: "relatorios:exportar_pdf", modulo: "RELATORIOS" as const, descricao: "exportar PDF" },
    { nome: "relatorios:exportar_excel", modulo: "RELATORIOS" as const, descricao: "exportar Excel" },
    { nome: "relatorios:exportar_csv", modulo: "RELATORIOS" as const, descricao: "exportar CSV" },
    // Configurações
    { nome: "configuracoes:editar_unidade", modulo: "CONFIGURACOES_UNIDADE" as const, descricao: "editar dados da unidade" },
    { nome: "configuracoes:areas", modulo: "CONFIGURACOES_UNIDADE" as const, descricao: "configurar áreas" },
    { nome: "configuracoes:cargos", modulo: "CONFIGURACOES_UNIDADE" as const, descricao: "configurar cargos" },
    { nome: "configuracoes:horarios", modulo: "CONFIGURACOES_UNIDADE" as const, descricao: "configurar horários" },
    { nome: "configuracoes:geolocalizacao_ponto", modulo: "CONFIGURACOES_UNIDADE" as const, descricao: "configurar geolocalização do ponto" },
    { nome: "configuracoes:permissoes_padrao", modulo: "CONFIGURACOES_UNIDADE" as const, descricao: "configurar permissões padrão" },
    { nome: "configuracoes:modulos_ativos", modulo: "CONFIGURACOES_UNIDADE" as const, descricao: "configurar módulos ativos" }
  ];

  for (const perm of permissoesObj) {
    await prisma.permissao.upsert({
      where: { nome: perm.nome },
      update: {
        modulo: perm.modulo,
        descricao: perm.descricao
      },
      create: {
        nome: perm.nome,
        modulo: perm.modulo,
        descricao: perm.descricao
      }
    });
  }
  console.log(`  ✅ ${permissoesObj.length} permissões populadas!\n`);

  // ── 8. Usuários ──────────────────────────────────────────────
  console.log("👤 Criando Usuários (PostgreSQL + Bcrypt)...");

  // Criar um PerfilAcesso padrão para colaboradores operacionais
  const perfilOperador = await prisma.perfilAcesso.upsert({
    where: { id: "seed-perfil-operador" },
    update: {},
    create: {
      id: "seed-perfil-operador",
      empresaId: IDS.empresa,
      nome: "Colaborador Operacional Padrão",
      descricao: "Perfil de acesso inicial para colaboradores operacionais",
      nivel: "COLABORADOR",
    }
  });

  // Vincular permissões básicas ao perfil do operador
  const permissoesOperador = [
    "ponto:bater", "ponto:visualizar_proprio", "ponto:visualizar_saldo_proprio",
    "tarefas:visualizar", "tarefas:concluir",
    "checklists:visualizar", "checklists:executar",
    "rotinas:visualizar"
  ];

  for (const permNome of permissoesOperador) {
    const perm = await prisma.permissao.findUnique({ where: { nome: permNome } });
    if (perm) {
      await prisma.permissaoPerfil.upsert({
        where: {
          perfilId_permissaoId: {
            perfilId: perfilOperador.id,
            permissaoId: perm.id
          }
        },
        update: {},
        create: {
          perfilId: perfilOperador.id,
          permissaoId: perm.id
        }
      });
    }
  }

  const usuariosSeed = [
    {
      uid: IDS.uidAdmin,
      email: "admin@r360.com",
      nome: "Admin SaaS",
      papel: "saasAdmin" as const,
      nivelHierarquia: null,
      empresaId: null,
      unidadeId: null,
      areaId: null,
      funcaoId: null,
      perfilAcessoId: null,
    },
    {
      uid: IDS.uidGestor,
      email: "gestor@demo.com",
      nome: "Gestor Demo",
      papel: "gestorCorporativo" as const,
      nivelHierarquia: "MASTER_LOJA" as const,
      empresaId: IDS.empresa,
      unidadeId: null,
      areaId: null,
      funcaoId: null,
      perfilAcessoId: null,
    },
    {
      uid: "seed-uid-administrador",
      email: "admin_empresa@demo.com",
      nome: "Administrador Demo",
      papel: "gestorCorporativo" as const,
      nivelHierarquia: "ADMINISTRADOR" as const,
      empresaId: IDS.empresa,
      unidadeId: null,
      areaId: null,
      funcaoId: null,
      perfilAcessoId: null,
    },
    {
      uid: "seed-uid-administrativo",
      email: "administrativo@demo.com",
      nome: "Carlos Administrativo",
      papel: "gestorLocal" as const,
      nivelHierarquia: "ADMINISTRATIVO" as const,
      empresaId: IDS.empresa,
      unidadeId: IDS.unidade,
      areaId: null,
      funcaoId: null,
      perfilAcessoId: null,
    },
    {
      uid: IDS.uidLocal,
      email: "local@demo.com",
      nome: "Gestor Local",
      papel: "gestorLocal" as const,
      nivelHierarquia: "GESTOR_LOCAL" as const,
      empresaId: IDS.empresa,
      unidadeId: IDS.unidade,
      areaId: null,
      funcaoId: null,
      perfilAcessoId: null,
    },
    {
      uid: IDS.uidOperador,
      email: "operador@demo.com",
      nome: "Operador Demo",
      papel: "operacional" as const,
      nivelHierarquia: "COLABORADOR" as const,
      empresaId: IDS.empresa,
      unidadeId: IDS.unidade,
      areaId: IDS.areaCozinha,
      funcaoId: IDS.funcaoChef,
      perfilAcessoId: perfilOperador.id,
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
        nivelHierarquia: u.nivelHierarquia,
        status: "ativo",
        empresaId: u.empresaId,
        unidadeId: u.unidadeId,
        areaId: u.areaId,
        funcaoId: u.funcaoId,
        perfilAcessoId: u.perfilAcessoId,
        senhaHash: hash,
        mustResetPassword: false,
      },
      create: {
        id: u.uid,
        email: u.email,
        nome: u.nome,
        papel: u.papel,
        nivelHierarquia: u.nivelHierarquia,
        status: "ativo",
        empresaId: u.empresaId,
        unidadeId: u.unidadeId,
        areaId: u.areaId,
        funcaoId: u.funcaoId,
        perfilAcessoId: u.perfilAcessoId,
        senhaHash: hash,
        mustResetPassword: false,
      },
    });

    if (u.unidadeId) {
      await prisma.usuarioUnidade.upsert({
        where: {
          usuarioId_unidadeId: {
            usuarioId: u.uid,
            unidadeId: u.unidadeId
          }
        },
        update: {},
        create: {
          usuarioId: u.uid,
          unidadeId: u.unidadeId
        }
      });
    }

    console.log(`  ✅ ${String(u.nivelHierarquia || u.papel).padEnd(20)} → ${u.email}`);
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
