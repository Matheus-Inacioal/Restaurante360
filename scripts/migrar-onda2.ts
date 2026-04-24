/**
 * Script de Migração — Onda 2: Entidades Operacionais
 * Firestore → PostgreSQL
 * 
 * Migra: categorias, tarefas, rotinas, execucoes_rotina (gerações), processos, notificações
 * 
 * PRÉ-REQUISITO: A Onda 1 já deve ter rodado (empresas e usuários já existem no PG)
 * 
 * COMO EXECUTAR:
 *   npm run migrar:onda2
 */

// Carregar env ANTES de tudo
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { prisma } from "./prisma-helper";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Variáveis FIREBASE_* não configuradas.");
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

const firestore = admin.firestore();

interface Relatorio {
  entidade: string;
  total: number;
  migrados: number;
  erros: number;
  inconsistencias: string[];
}

const relatorio: Relatorio[] = [];

function converterData(valor: any): Date {
  if (!valor) return new Date("2025-01-01T00:00:00Z");
  if (valor.toDate) return valor.toDate();
  if (typeof valor === "string") return new Date(valor);
  if (valor instanceof Date) return valor;
  return new Date("2025-01-01T00:00:00Z");
}

// ─── Categorias ───────────────────────────────────────────────

async function migrarCategorias(): Promise<void> {
  console.log("\n🏷️  Migrando CATEGORIAS...");
  const snapshot = await firestore.collection("categorias_processo").get();
  const total = snapshot.size;
  let migrados = 0;
  let erros = 0;
  const inconsistencias: string[] = [];

  const empresasIds = new Set(
    (await prisma.empresa.findMany({ select: { id: true } })).map((e) => e.id)
  );

  for (const doc of snapshot.docs) {
    const d = doc.data();
    const empresaId = d.empresaId;

    if (!empresaId || !empresasIds.has(empresaId)) {
      inconsistencias.push(`Categoria ${doc.id}: empresaId '${empresaId}' inválido, ignorada`);
      erros++;
      continue;
    }

    try {
      await prisma.categoria.upsert({
        where: { id: doc.id },
        update: {
          nome: d.nome || "Sem nome",
          tipo: d.tipo || "geral",
          ativa: d.ativa !== false,
          ordem: typeof d.ordem === "number" ? d.ordem : null,
          atualizadoEm: converterData(d.atualizadoEm),
        },
        create: {
          id: doc.id,
          empresaId,
          nome: d.nome || "Sem nome",
          tipo: d.tipo || "geral",
          ativa: d.ativa !== false,
          ordem: typeof d.ordem === "number" ? d.ordem : null,
          criadoEm: converterData(d.criadoEm),
          atualizadoEm: converterData(d.atualizadoEm),
        },
      });
      migrados++;
    } catch (err: any) {
      erros++;
      inconsistencias.push(`Categoria ${doc.id}: ${err.message}`);
    }
  }

  console.log(`  ✅ ${migrados}/${total} migradas (${erros} erros)`);
  relatorio.push({ entidade: "categorias", total, migrados, erros, inconsistencias });
}

// ─── Tarefas ──────────────────────────────────────────────────

async function migrarTarefas(): Promise<void> {
  console.log("\n📋 Migrando TAREFAS...");
  const snapshot = await firestore.collection("tarefas").get();
  const total = snapshot.size;
  let migrados = 0;
  let erros = 0;
  const inconsistencias: string[] = [];

  const empresasIds = new Set(
    (await prisma.empresa.findMany({ select: { id: true } })).map((e) => e.id)
  );
  const usuariosIds = new Set(
    (await prisma.usuario.findMany({ select: { id: true } })).map((u) => u.id)
  );

  for (const doc of snapshot.docs) {
    const d = doc.data();
    const empresaId = d.empresaId;

    if (!empresaId || !empresasIds.has(empresaId)) {
      inconsistencias.push(`Tarefa ${doc.id}: empresaId '${empresaId}' inválido, ignorada`);
      erros++;
      continue;
    }

    let criadoPor = d.criadoPor;
    if (!criadoPor || !usuariosIds.has(criadoPor)) {
      const gestor = await prisma.usuario.findFirst({
        where: { empresaId, papel: "gestorCorporativo" },
        select: { id: true },
      });
      if (gestor) {
        criadoPor = gestor.id;
        inconsistencias.push(`Tarefa ${doc.id}: criadoPor substituído por gestor ${gestor.id}`);
      } else {
        inconsistencias.push(`Tarefa ${doc.id}: sem criadoPor válido, ignorada`);
        erros++;
        continue;
      }
    }

    const responsavelId = d.responsavel && usuariosIds.has(d.responsavel) ? d.responsavel : null;

    const prioridadeMap: Record<string, string> = {
      alta: "Alta", média: "Media", media: "Media", baixa: "Baixa",
      Alta: "Alta", Média: "Media", Media: "Media", Baixa: "Baixa",
    };
    const prioridade = prioridadeMap[d.prioridade] || "Media";

    try {
      await prisma.tarefa.upsert({
        where: { id: doc.id },
        update: {
          titulo: d.titulo || "Sem título",
          descricao: d.descricao || null,
          tipo: d.tipo === "checklist" ? "checklist" : "tarefa",
          status: d.status || "pendente",
          prioridade: prioridade as any,
          responsavelId,
          prazo: d.prazo ? converterData(d.prazo) : null,
          tags: Array.isArray(d.tags) ? d.tags : [],
          itensVerificacao: d.itensVerificacao || null,
          origemTipo: d.origem?.tipo || null,
          origemRotinaId: d.origem?.rotinaId || null,
          origemDataRef: d.origem?.dataReferencia || null,
          atualizadoEm: converterData(d.atualizadoEm),
        },
        create: {
          id: doc.id,
          empresaId,
          titulo: d.titulo || "Sem título",
          descricao: d.descricao || null,
          tipo: d.tipo === "checklist" ? "checklist" : "tarefa",
          status: d.status || "pendente",
          prioridade: prioridade as any,
          responsavelId,
          prazo: d.prazo ? converterData(d.prazo) : null,
          tags: Array.isArray(d.tags) ? d.tags : [],
          itensVerificacao: d.itensVerificacao || null,
          origemTipo: d.origem?.tipo || null,
          origemRotinaId: d.origem?.rotinaId || null,
          origemDataRef: d.origem?.dataReferencia || null,
          criadoPor,
          criadoEm: converterData(d.criadoEm),
          atualizadoEm: converterData(d.atualizadoEm),
        },
      });
      migrados++;
    } catch (err: any) {
      erros++;
      inconsistencias.push(`Tarefa ${doc.id}: ${err.message}`);
    }
  }

  console.log(`  ✅ ${migrados}/${total} migradas (${erros} erros)`);
  relatorio.push({ entidade: "tarefas", total, migrados, erros, inconsistencias });
}

// ─── Rotinas ──────────────────────────────────────────────────

async function migrarRotinas(): Promise<void> {
  console.log("\n🔄 Migrando ROTINAS...");
  const snapshot = await firestore.collection("rotinas").get();
  const total = snapshot.size;
  let migrados = 0;
  let erros = 0;
  const inconsistencias: string[] = [];

  const empresasIds = new Set(
    (await prisma.empresa.findMany({ select: { id: true } })).map((e) => e.id)
  );
  const usuariosIds = new Set(
    (await prisma.usuario.findMany({ select: { id: true } })).map((u) => u.id)
  );

  for (const doc of snapshot.docs) {
    const d = doc.data();
    const empresaId = d.empresaId;

    if (!empresaId || !empresasIds.has(empresaId)) {
      inconsistencias.push(`Rotina ${doc.id}: empresaId inválido, ignorada`);
      erros++;
      continue;
    }

    let criadoPor = d.criadoPor;
    if (!criadoPor || !usuariosIds.has(criadoPor)) {
      const gestor = await prisma.usuario.findFirst({
        where: { empresaId, papel: "gestorCorporativo" },
        select: { id: true },
      });
      if (gestor) criadoPor = gestor.id;
      else {
        inconsistencias.push(`Rotina ${doc.id}: sem criadoPor válido, ignorada`);
        erros++;
        continue;
      }
    }

    try {
      await prisma.rotina.upsert({
        where: { id: doc.id },
        update: {
          titulo: d.titulo || "Sem título",
          descricao: d.descricao || null,
          ativa: d.ativa !== false,
          frequencia: d.frequencia || "diaria",
          diasSemana: Array.isArray(d.diasSemana) ? d.diasSemana : [],
          diaDoMes: typeof d.diaDoMes === "number" ? d.diaDoMes : null,
          horarioPreferencial: d.horarioPreferencial || null,
          responsavelPadraoId: d.responsavelPadraoId && usuariosIds.has(d.responsavelPadraoId) ? d.responsavelPadraoId : null,
          tipoTarefaGerada: d.tipoTarefaGerada === "checklist" ? "checklist" : "tarefa",
          checklistModelo: d.checklistModelo || null,
          tags: Array.isArray(d.tags) ? d.tags : [],
          atualizadoEm: converterData(d.atualizadoEm),
        },
        create: {
          id: doc.id,
          empresaId,
          titulo: d.titulo || "Sem título",
          descricao: d.descricao || null,
          ativa: d.ativa !== false,
          frequencia: d.frequencia || "diaria",
          diasSemana: Array.isArray(d.diasSemana) ? d.diasSemana : [],
          diaDoMes: typeof d.diaDoMes === "number" ? d.diaDoMes : null,
          horarioPreferencial: d.horarioPreferencial || null,
          responsavelPadraoId: d.responsavelPadraoId && usuariosIds.has(d.responsavelPadraoId) ? d.responsavelPadraoId : null,
          tipoTarefaGerada: d.tipoTarefaGerada === "checklist" ? "checklist" : "tarefa",
          checklistModelo: d.checklistModelo || null,
          tags: Array.isArray(d.tags) ? d.tags : [],
          criadoPor,
          criadoEm: converterData(d.criadoEm),
          atualizadoEm: converterData(d.atualizadoEm),
        },
      });
      migrados++;
    } catch (err: any) {
      erros++;
      inconsistencias.push(`Rotina ${doc.id}: ${err.message}`);
    }
  }

  console.log(`  ✅ ${migrados}/${total} migradas (${erros} erros)`);
  relatorio.push({ entidade: "rotinas", total, migrados, erros, inconsistencias });
}

// ─── Gerações de Rotina ───────────────────────────────────────

async function migrarGeracoes(): Promise<void> {
  console.log("\n📅 Migrando GERAÇÕES DE ROTINA...");
  const snapshot = await firestore.collection("execucoes_rotina").get();
  const total = snapshot.size;
  let migrados = 0;
  let erros = 0;
  const inconsistencias: string[] = [];

  const rotinasIds = new Set(
    (await prisma.rotina.findMany({ select: { id: true } })).map((r) => r.id)
  );
  const tarefasIds = new Set(
    (await prisma.tarefa.findMany({ select: { id: true } })).map((t) => t.id)
  );

  for (const doc of snapshot.docs) {
    const d = doc.data();

    if (!d.rotinaId || !rotinasIds.has(d.rotinaId)) {
      inconsistencias.push(`Geração ${doc.id}: rotinaId '${d.rotinaId}' não existe, ignorada`);
      erros++;
      continue;
    }

    const tarefaGeradaId = d.taskIdGerada || d.tarefaGeradaId;
    if (!tarefaGeradaId || !tarefasIds.has(tarefaGeradaId)) {
      inconsistencias.push(`Geração ${doc.id}: tarefaGeradaId '${tarefaGeradaId}' não existe, ignorada`);
      erros++;
      continue;
    }

    try {
      await prisma.geracaoRotina.upsert({
        where: {
          rotinaId_dataReferencia: {
            rotinaId: d.rotinaId,
            dataReferencia: d.dataReferencia || "1970-01-01",
          },
        },
        update: {},
        create: {
          id: doc.id,
          empresaId: d.empresaId,
          rotinaId: d.rotinaId,
          tarefaGeradaId,
          dataReferencia: d.dataReferencia || "1970-01-01",
          criadoEm: converterData(d.criadoEm),
        },
      });
      migrados++;
    } catch (err: any) {
      erros++;
      inconsistencias.push(`Geração ${doc.id}: ${err.message}`);
    }
  }

  console.log(`  ✅ ${migrados}/${total} migradas (${erros} erros)`);
  relatorio.push({ entidade: "geracoes_rotina", total, migrados, erros, inconsistencias });
}

// ─── Processos ────────────────────────────────────────────────

async function migrarProcessos(): Promise<void> {
  console.log("\n📖 Migrando PROCESSOS...");
  const snapshot = await firestore.collection("processos").get();
  const total = snapshot.size;
  let migrados = 0;
  let erros = 0;
  const inconsistencias: string[] = [];

  const empresasIds = new Set(
    (await prisma.empresa.findMany({ select: { id: true } })).map((e) => e.id)
  );

  for (const doc of snapshot.docs) {
    const d = doc.data();
    const empresaId = d.empresaId;

    if (!empresaId || !empresasIds.has(empresaId)) {
      inconsistencias.push(`Processo ${doc.id}: empresaId inválido, ignorado`);
      erros++;
      continue;
    }

    let categoriaId: string | null = d.categoriaId || null;
    if (categoriaId) {
      const catExiste = await prisma.categoria.findUnique({ where: { id: categoriaId } });
      if (!catExiste) {
        inconsistencias.push(`Processo ${doc.id}: categoriaId '${categoriaId}' não migrada, definido null`);
        categoriaId = null;
      }
    }

    try {
      await prisma.processo.upsert({
        where: { id: doc.id },
        update: {
          titulo: d.titulo || "Sem título",
          descricao: d.descricao || null,
          categoriaId,
          ativo: d.ativo !== false,
          versao: typeof d.versao === "number" ? d.versao : 1,
          passos: Array.isArray(d.passos) ? d.passos : null,
          atualizadoEm: converterData(d.atualizadoEm),
        },
        create: {
          id: doc.id,
          empresaId,
          titulo: d.titulo || "Sem título",
          descricao: d.descricao || null,
          categoriaId,
          ativo: d.ativo !== false,
          versao: typeof d.versao === "number" ? d.versao : 1,
          passos: Array.isArray(d.passos) ? d.passos : null,
          criadoEm: converterData(d.criadoEm),
          atualizadoEm: converterData(d.atualizadoEm),
        },
      });
      migrados++;
    } catch (err: any) {
      erros++;
      inconsistencias.push(`Processo ${doc.id}: ${err.message}`);
    }
  }

  console.log(`  ✅ ${migrados}/${total} migrados (${erros} erros)`);
  relatorio.push({ entidade: "processos", total, migrados, erros, inconsistencias });
}

// ─── Notificações ─────────────────────────────────────────────

async function migrarNotificacoes(): Promise<void> {
  console.log("\n🔔 Migrando NOTIFICAÇÕES...");
  const snapshot = await firestore.collection("notificacoes").get();
  const total = snapshot.size;
  let migrados = 0;
  let erros = 0;
  const inconsistencias: string[] = [];

  const usuariosIds = new Set(
    (await prisma.usuario.findMany({ select: { id: true } })).map((u) => u.id)
  );

  for (const doc of snapshot.docs) {
    const d = doc.data();
    const usuarioId = d.usuarioId || d.destinatarioId;

    if (!usuarioId || !usuariosIds.has(usuarioId)) {
      inconsistencias.push(`Notificação ${doc.id}: usuarioId '${usuarioId}' inválido, ignorada`);
      erros++;
      continue;
    }

    const tiposValidos = ["tarefa_atrasada", "tarefa_atribuida", "sistema", "rotina_alerta"];
    const tipo = tiposValidos.includes(d.tipo) ? d.tipo : "sistema";

    try {
      await prisma.notificacao.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          empresaId: d.empresaId || null,
          usuarioId,
          titulo: d.titulo || "Notificação",
          descricao: d.descricao || "",
          tipo: tipo as any,
          lida: d.lida === true,
          origem: d.origem || null,
          entidadeId: d.entidadeId || null,
          criadoEm: converterData(d.criadoEm),
        },
      });
      migrados++;
    } catch (err: any) {
      erros++;
      inconsistencias.push(`Notificação ${doc.id}: ${err.message}`);
    }
  }

  console.log(`  ✅ ${migrados}/${total} migradas (${erros} erros)`);
  relatorio.push({ entidade: "notificacoes", total, migrados, erros, inconsistencias });
}

// ─── Verificação e Relatório ──────────────────────────────────

async function verificar(): Promise<void> {
  console.log("\n🔍 VERIFICAÇÃO PÓS-MIGRAÇÃO (Onda 2)");
  console.log("─".repeat(60));

  const contagens = {
    categorias: await prisma.categoria.count(),
    tarefas: await prisma.tarefa.count(),
    rotinas: await prisma.rotina.count(),
    geracoes: await prisma.geracaoRotina.count(),
    processos: await prisma.processo.count(),
    notificacoes: await prisma.notificacao.count(),
  };

  for (const [entidade, total] of Object.entries(contagens)) {
    console.log(`  ${entidade}: ${total} registros`);
  }
}

function imprimirRelatorio(): void {
  console.log("\n" + "═".repeat(60));
  console.log("📊 RELATÓRIO FINAL — ONDA 2 (Operacional)");
  console.log("═".repeat(60));

  for (const r of relatorio) {
    const status = r.erros === 0 ? "✅" : "⚠️";
    console.log(`\n${status} ${r.entidade.toUpperCase()}`);
    console.log(`   Total: ${r.total} | Migrados: ${r.migrados} | Erros: ${r.erros}`);

    if (r.inconsistencias.length > 0) {
      for (const inc of r.inconsistencias.slice(0, 5)) {
        console.log(`     ⚠ ${inc}`);
      }
      if (r.inconsistencias.length > 5) {
        console.log(`     ... e mais ${r.inconsistencias.length - 5}`);
      }
    }
  }
}

async function main(): Promise<void> {
  console.log("═".repeat(60));
  console.log("🚀 MIGRAÇÃO ONDA 2: Entidades Operacionais");
  console.log("   Restaurante360");
  console.log("   " + new Date().toLocaleString("pt-BR"));
  console.log("═".repeat(60));

  try {
    await migrarCategorias();
    await migrarTarefas();
    await migrarRotinas();
    await migrarGeracoes();
    await migrarProcessos();
    await migrarNotificacoes();
    await verificar();
    imprimirRelatorio();

    console.log("\n🎉 Migração Onda 2 concluída!");
  } catch (error) {
    console.error("\n💥 ERRO FATAL:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
