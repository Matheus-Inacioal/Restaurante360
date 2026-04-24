/**
 * Script de Migração — Onda 1: Firestore → PostgreSQL
 * 
 * Migra: empresas, usuarios (global + subcoleção), auditoria
 * 
 * COMO EXECUTAR:
 *   npm run migrar:onda1
 * 
 * PRÉ-REQUISITOS:
 *   - PostgreSQL rodando com DATABASE_URL configurado no .env
 *   - Firebase Admin SDK configurado (FIREBASE_* no .env.local)
 *   - Schema Prisma migrado (npx prisma migrate dev)
 * 
 * CARACTERÍSTICAS:
 *   - Idempotente (usa upsert, pode re-rodar sem duplicar)
 *   - Não altera dados no Firestore (somente leitura)
 *   - Loga inconsistências para revisão manual
 */

// Carregar env ANTES de tudo
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { prisma } from "./prisma-helper";

// ─── Configuração do Firebase Admin ───────────────────────────
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Variáveis FIREBASE_* não configuradas. Configure no .env ou .env.local");
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

const firestore = admin.firestore();

// ─── Tipos auxiliares ─────────────────────────────────────────

type PapelPg = "saasAdmin" | "gestorCorporativo" | "gestorLocal" | "operacional";

interface RelatorioMigracao {
  entidade: string;
  totalFirestore: number;
  totalMigrados: number;
  totalErros: number;
  inconsistencias: string[];
}

const relatorio: RelatorioMigracao[] = [];

// ─── Utilitários ──────────────────────────────────────────────

function converterData(valor: any): Date {
  if (!valor) return new Date("2025-01-01T00:00:00Z");
  if (valor.toDate) return valor.toDate(); // Firestore Timestamp
  if (typeof valor === "string") return new Date(valor);
  if (valor instanceof Date) return valor;
  return new Date("2025-01-01T00:00:00Z");
}

function normalizarStatusEmpresa(status: any): "TRIAL_ATIVO" | "ATIVO" | "GRACE" | "SUSPENSO" | "CANCELADO" {
  if (!status) return "TRIAL_ATIVO";
  const s = String(status).toUpperCase().trim();
  const mapa: Record<string, any> = {
    "TRIAL_ATIVO": "TRIAL_ATIVO",
    "ATIVO": "ATIVO",
    "ATIVA": "ATIVO",
    "GRACE": "GRACE",
    "SUSPENSO": "SUSPENSO",
    "SUSPENSA": "SUSPENSO",
    "CANCELADO": "CANCELADO",
    "CANCELADA": "CANCELADO",
  };
  return mapa[s] || "TRIAL_ATIVO";
}

function inferirPapel(papelPortal?: string, papelEmpresa?: string): PapelPg {
  const portal = String(papelPortal || "").toUpperCase();
  const empresa = String(papelEmpresa || "").toUpperCase();

  if (portal === "SISTEMA") return "saasAdmin";
  if (portal === "EMPRESA") {
    if (empresa === "GESTOR" || empresa === "ADMIN") return "gestorCorporativo";
    return "operacional";
  }
  if (portal === "OPERACIONAL") return "operacional";

  // Fallback pelo campo empresa
  if (empresa === "GESTOR" || empresa === "ADMIN") return "gestorCorporativo";

  return "operacional";
}

// ─── Migração de Empresas ─────────────────────────────────────

async function migrarEmpresas(): Promise<void> {
  console.log("\n🏢 Migrando EMPRESAS...");
  const snapshot = await firestore.collection("empresas").get();
  const total = snapshot.size;
  let migrados = 0;
  let erros = 0;
  const inconsistencias: string[] = [];

  for (const doc of snapshot.docs) {
    const d = doc.data();
    try {
      await prisma.empresa.upsert({
        where: { id: doc.id },
        update: {
          nome: d.nome || d.nomeEmpresa || "Sem nome",
          cnpj: d.cnpj || `MIGRADO_${doc.id}`,
          responsavelNome: d.responsavelNome || d.nomeResponsavel || "N/A",
          responsavelEmail: d.responsavelEmail || d.emailResponsavel || "nao@informado.com",
          whatsappResponsavel: d.whatsappResponsavel || null,
          status: normalizarStatusEmpresa(d.status),
          planoId: d.planoId || null,
          planoNome: d.planoNome || d.planoId || null,
          diasTrial: typeof d.diasTrial === "number" ? d.diasTrial : 14,
          trialInicio: d.trialInicio ? converterData(d.trialInicio) : null,
          trialFim: d.trialFim ? converterData(d.trialFim) : null,
          atualizadoEm: converterData(d.atualizadoEm),
        },
        create: {
          id: doc.id,
          nome: d.nome || d.nomeEmpresa || "Sem nome",
          cnpj: d.cnpj || `MIGRADO_${doc.id}`,
          responsavelNome: d.responsavelNome || d.nomeResponsavel || "N/A",
          responsavelEmail: d.responsavelEmail || d.emailResponsavel || "nao@informado.com",
          whatsappResponsavel: d.whatsappResponsavel || null,
          status: normalizarStatusEmpresa(d.status),
          planoId: d.planoId || null,
          planoNome: d.planoNome || d.planoId || null,
          diasTrial: typeof d.diasTrial === "number" ? d.diasTrial : 14,
          trialInicio: d.trialInicio ? converterData(d.trialInicio) : null,
          trialFim: d.trialFim ? converterData(d.trialFim) : null,
          criadoEm: converterData(d.criadoEm),
          atualizadoEm: converterData(d.atualizadoEm),
        },
      });
      migrados++;
    } catch (err: any) {
      erros++;
      const msg = `Empresa ${doc.id}: ${err.message}`;
      inconsistencias.push(msg);
      console.error(`  ❌ ${msg}`);
    }
  }

  console.log(`  ✅ ${migrados}/${total} migradas (${erros} erros)`);
  relatorio.push({ entidade: "empresas", totalFirestore: total, totalMigrados: migrados, totalErros: erros, inconsistencias });
}

// ─── Migração de Usuários ─────────────────────────────────────

async function migrarUsuarios(): Promise<void> {
  console.log("\n👤 Migrando USUÁRIOS (global)...");

  const empresasExistentes = new Set(
    (await prisma.empresa.findMany({ select: { id: true } })).map((e) => e.id)
  );

  const snapshot = await firestore.collection("usuarios").get();
  const total = snapshot.size;
  let migrados = 0;
  let erros = 0;
  const inconsistencias: string[] = [];

  for (const doc of snapshot.docs) {
    const d = doc.data();
    const uid = d.uid || doc.id;
    const email = d.email;

    if (!email) {
      inconsistencias.push(`Usuário ${uid}: sem e-mail, ignorado`);
      erros++;
      continue;
    }

    let empresaId: string | null = d.empresaId || null;
    if (empresaId && !empresasExistentes.has(empresaId)) {
      inconsistencias.push(`Usuário ${uid}: empresaId '${empresaId}' não existe no PostgreSQL (órfão)`);
      empresaId = null;
    }

    const papel = inferirPapel(d.papelPortal, d.papelEmpresa);
    const statusAtivo = d.ativo === false ? "inativo" : "ativo";

    try {
      await prisma.usuario.upsert({
        where: { id: uid },
        update: {
          nome: d.nome || "Sem nome",
          papel,
          status: statusAtivo,
          empresaId,
          mustResetPassword: d.mustResetPassword === true,
          atualizadoEm: converterData(d.atualizadoEm),
        },
        create: {
          id: uid,
          email,
          nome: d.nome || "Sem nome",
          papel,
          status: statusAtivo,
          empresaId,
          mustResetPassword: d.mustResetPassword === true,
          criadoEm: converterData(d.criadoEm),
          atualizadoEm: converterData(d.atualizadoEm),
        },
      });
      migrados++;
    } catch (err: any) {
      erros++;
      const msg = `Usuário ${uid} (${email}): ${err.message}`;
      inconsistencias.push(msg);
      console.error(`  ❌ ${msg}`);
    }
  }

  console.log(`  ✅ ${migrados}/${total} migrados (${erros} erros)`);
  relatorio.push({ entidade: "usuarios", totalFirestore: total, totalMigrados: migrados, totalErros: erros, inconsistencias });

  await migrarUsuariosSubcolecao(empresasExistentes);
}

async function migrarUsuariosSubcolecao(empresasExistentes: Set<string>): Promise<void> {
  console.log("\n👥 Verificando subcoleções empresas/*/usuarios...");
  let encontrados = 0;
  let novos = 0;
  const inconsistencias: string[] = [];

  for (const empresaId of empresasExistentes) {
    const subSnap = await firestore
      .collection("empresas")
      .doc(empresaId)
      .collection("usuarios")
      .get();

    for (const subDoc of subSnap.docs) {
      encontrados++;
      const uid = subDoc.id;
      const d = subDoc.data();

      const existente = await prisma.usuario.findUnique({ where: { id: uid } });

      if (existente) {
        if (!existente.empresaId && empresaId) {
          await prisma.usuario.update({
            where: { id: uid },
            data: { empresaId },
          });
          inconsistencias.push(`Usuário ${uid}: empresaId atualizado via subcoleção para '${empresaId}'`);
        }
      } else {
        if (!d.email) {
          inconsistencias.push(`Subcoleção ${empresaId}/usuarios/${uid}: sem e-mail, ignorado`);
          continue;
        }

        const papel = inferirPapel(undefined, d.papel);

        try {
          await prisma.usuario.create({
            data: {
              id: uid,
              email: d.email,
              nome: d.nome || "Sem nome",
              papel,
              status: d.ativo === false ? "inativo" : "ativo",
              empresaId,
              criadoEm: converterData(d.criadoEm),
              atualizadoEm: converterData(d.atualizadoEm),
            },
          });
          novos++;
        } catch (err: any) {
          inconsistencias.push(`Subcoleção ${empresaId}/usuarios/${uid}: ${err.message}`);
        }
      }
    }
  }

  console.log(`  ✅ ${encontrados} encontrados em subcoleções, ${novos} novos inseridos`);
  relatorio.push({
    entidade: "usuarios_subcolecao",
    totalFirestore: encontrados,
    totalMigrados: novos,
    totalErros: inconsistencias.length,
    inconsistencias,
  });
}

// ─── Migração de Auditoria ────────────────────────────────────

async function migrarAuditoria(): Promise<void> {
  console.log("\n📋 Migrando AUDITORIA...");
  const snapshot = await firestore.collection("auditoria").get();
  const total = snapshot.size;
  let migrados = 0;
  let erros = 0;
  const inconsistencias: string[] = [];

  const usuariosExistentes = new Set(
    (await prisma.usuario.findMany({ select: { id: true } })).map((u) => u.id)
  );

  for (const doc of snapshot.docs) {
    const d = doc.data();
    const usuarioId = d.criadoPor || d.usuarioId;

    if (!usuarioId || !usuariosExistentes.has(usuarioId)) {
      inconsistencias.push(`Auditoria ${doc.id}: usuarioId '${usuarioId}' não existe, ignorado`);
      erros++;
      continue;
    }

    try {
      await prisma.auditoria.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          empresaId: d.empresaId || null,
          usuarioId,
          acao: d.acao || d.tipo || "migrado",
          entidade: d.entidade || "sistema",
          entidadeId: d.entidadeId || doc.id,
          detalhe: d.detalhes || d.descricao ? { texto: d.detalhes || d.descricao } : null,
          criadoEm: converterData(d.criadoEm),
        },
      });
      migrados++;
    } catch (err: any) {
      erros++;
      inconsistencias.push(`Auditoria ${doc.id}: ${err.message}`);
    }
  }

  console.log(`  ✅ ${migrados}/${total} migrados (${erros} erros)`);
  relatorio.push({ entidade: "auditoria", totalFirestore: total, totalMigrados: migrados, totalErros: erros, inconsistencias });
}

// ─── Verificação Pós-Migração ─────────────────────────────────

async function verificarMigracao(): Promise<void> {
  console.log("\n🔍 VERIFICAÇÃO PÓS-MIGRAÇÃO");
  console.log("─".repeat(60));

  const pgEmpresas = await prisma.empresa.count();
  const pgUsuarios = await prisma.usuario.count();
  const pgAuditoria = await prisma.auditoria.count();

  const fsEmpresas = (await firestore.collection("empresas").count().get()).data().count;
  const fsUsuarios = (await firestore.collection("usuarios").count().get()).data().count;
  const fsAuditoria = (await firestore.collection("auditoria").count().get()).data().count;

  console.log(`\n  Empresas:   Firestore=${fsEmpresas}  →  PostgreSQL=${pgEmpresas}`);
  console.log(`  Usuários:   Firestore=${fsUsuarios}  →  PostgreSQL=${pgUsuarios}`);
  console.log(`  Auditoria:  Firestore=${fsAuditoria}  →  PostgreSQL=${pgAuditoria}`);

  // Amostra de dados
  console.log("\n  📊 Amostra (3 primeiras empresas):");
  const amostra = await prisma.empresa.findMany({ take: 3, orderBy: { criadoEm: "desc" } });
  for (const emp of amostra) {
    console.log(`    - ${emp.nome} (${emp.status}) | CNPJ: ${emp.cnpj}`);
  }

  // Distribuição de papéis
  const porPapel = await prisma.$queryRaw`
    SELECT papel, COUNT(*) as total FROM usuarios GROUP BY papel
  ` as any[];
  console.log("\n  📊 Distribuição de papéis:");
  for (const r of porPapel) {
    console.log(`    - ${r.papel}: ${r.total}`);
  }
}

// ─── Relatório Final ──────────────────────────────────────────

function imprimirRelatorio(): void {
  console.log("\n" + "═".repeat(60));
  console.log("📊 RELATÓRIO FINAL DA MIGRAÇÃO (Onda 1)");
  console.log("═".repeat(60));

  for (const r of relatorio) {
    const status = r.totalErros === 0 ? "✅" : "⚠️";
    console.log(`\n${status} ${r.entidade.toUpperCase()}`);
    console.log(`   Firestore: ${r.totalFirestore} | Migrados: ${r.totalMigrados} | Erros: ${r.totalErros}`);

    if (r.inconsistencias.length > 0) {
      console.log(`   Inconsistências (${r.inconsistencias.length}):`);
      for (const inc of r.inconsistencias.slice(0, 10)) {
        console.log(`     ⚠ ${inc}`);
      }
      if (r.inconsistencias.length > 10) {
        console.log(`     ... e mais ${r.inconsistencias.length - 10}`);
      }
    }
  }
}

// ─── Execução Principal ───────────────────────────────────────

async function main(): Promise<void> {
  console.log("═".repeat(60));
  console.log("🚀 MIGRAÇÃO ONDA 1: Firestore → PostgreSQL");
  console.log("   Restaurante360");
  console.log("   " + new Date().toLocaleString("pt-BR"));
  console.log("═".repeat(60));

  try {
    await migrarEmpresas();
    await migrarUsuarios();
    await migrarAuditoria();
    await verificarMigracao();
    imprimirRelatorio();

    console.log("\n🎉 Migração Onda 1 concluída!");
  } catch (error) {
    console.error("\n💥 ERRO FATAL NA MIGRAÇÃO:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
