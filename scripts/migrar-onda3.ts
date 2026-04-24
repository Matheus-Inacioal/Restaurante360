/**
 * Script de Migração — Onda 3: Entidades Financeiras
 * Firestore → PostgreSQL
 * 
 * Migra: planos, assinaturas, cobranças, aceites, webhook_eventos
 * 
 * PRÉ-REQUISITO: Ondas 1 e 2 já devem ter rodado
 * 
 * COMO EXECUTAR:
 *   npm run migrar:onda3
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

// ─── Planos ───────────────────────────────────────────────────

async function migrarPlanos(): Promise<void> {
  console.log("\n💎 Migrando PLANOS...");
  const snapshot = await firestore.collection("financeiro_planos").get();
  const total = snapshot.size;
  let migrados = 0;
  let erros = 0;
  const inconsistencias: string[] = [];

  for (const doc of snapshot.docs) {
    const d = doc.data();

    try {
      await prisma.plano.upsert({
        where: { id: doc.id },
        update: {
          nome: d.nome || "Sem nome",
          descricao: d.descricao || null,
          valorMensal: d.valorMensal || 0,
          valorAnual: d.valorAnual || 0,
          features: Array.isArray(d.features) ? d.features : [],
          ativo: d.ativo !== false,
          atualizadoEm: converterData(d.atualizadoEm),
        },
        create: {
          id: doc.id,
          nome: d.nome || `Plano_${doc.id}`,
          descricao: d.descricao || null,
          valorMensal: d.valorMensal || 0,
          valorAnual: d.valorAnual || 0,
          features: Array.isArray(d.features) ? d.features : [],
          ativo: d.ativo !== false,
          criadoEm: converterData(d.criadoEm),
          atualizadoEm: converterData(d.atualizadoEm),
        },
      });
      migrados++;
    } catch (err: any) {
      erros++;
      inconsistencias.push(`Plano ${doc.id}: ${err.message}`);
    }
  }

  console.log(`  ✅ ${migrados}/${total} migrados (${erros} erros)`);
  relatorio.push({ entidade: "planos", total, migrados, erros, inconsistencias });
}

// ─── Assinaturas ──────────────────────────────────────────────

async function migrarAssinaturas(): Promise<void> {
  console.log("\n📄 Migrando ASSINATURAS...");
  const snapshot = await firestore.collection("financeiro_assinaturas").get();
  const total = snapshot.size;
  let migrados = 0;
  let erros = 0;
  const inconsistencias: string[] = [];

  const empresasIds = new Set(
    (await prisma.empresa.findMany({ select: { id: true } })).map((e) => e.id)
  );
  const planosIds = new Set(
    (await prisma.plano.findMany({ select: { id: true } })).map((p) => p.id)
  );

  for (const doc of snapshot.docs) {
    const d = doc.data();

    if (!d.empresaId || !empresasIds.has(d.empresaId)) {
      inconsistencias.push(`Assinatura ${doc.id}: empresaId inválido, ignorada`);
      erros++;
      continue;
    }

    let planoId = d.planoId;
    if (!planoId || !planosIds.has(planoId)) {
      const planoGenerico = await prisma.plano.findFirst({ where: { nome: "Starter" } });
      if (planoGenerico) {
        planoId = planoGenerico.id;
      } else {
        inconsistencias.push(`Assinatura ${doc.id}: sem planoId válido, ignorada`);
        erros++;
        continue;
      }
    }

    try {
      await prisma.assinatura.upsert({
        where: { id: doc.id },
        update: {
          status: d.status || "ACTIVE",
          valor: d.valor || 0,
          ciclo: d.ciclo || "MENSAL",
          formaPagamento: d.formaPagamento || "UNDEFINED",
          atualizadaEm: converterData(d.atualizadaEm),
        },
        create: {
          id: doc.id,
          empresaId: d.empresaId,
          planoId,
          asaasSubscriptionId: d.asaasSubscriptionId || null,
          status: d.status || "ACTIVE",
          valor: d.valor || 0,
          ciclo: d.ciclo || "MENSAL",
          formaPagamento: d.formaPagamento || "UNDEFINED",
          proximoVencimento: d.proximoVencimento ? converterData(d.proximoVencimento) : null,
          inicioAssinatura: converterData(d.inicioAssinatura || d.criadaEm),
          criadaEm: converterData(d.criadaEm),
          atualizadaEm: converterData(d.atualizadaEm),
        },
      });
      migrados++;
    } catch (err: any) {
      erros++;
      inconsistencias.push(`Assinatura ${doc.id}: ${err.message}`);
    }
  }

  console.log(`  ✅ ${migrados}/${total} migradas (${erros} erros)`);
  relatorio.push({ entidade: "assinaturas", total, migrados, erros, inconsistencias });
}

// ─── Cobranças ────────────────────────────────────────────────

async function migrarCobrancas(): Promise<void> {
  console.log("\n💰 Migrando COBRANÇAS...");
  const snapshot = await firestore.collection("financeiro_cobrancas").get();
  const total = snapshot.size;
  let migrados = 0;
  let erros = 0;
  const inconsistencias: string[] = [];

  const empresasIds = new Set(
    (await prisma.empresa.findMany({ select: { id: true } })).map((e) => e.id)
  );

  for (const doc of snapshot.docs) {
    const d = doc.data();

    if (!d.empresaId || !empresasIds.has(d.empresaId)) {
      inconsistencias.push(`Cobrança ${doc.id}: empresaId inválido, ignorada`);
      erros++;
      continue;
    }

    try {
      await prisma.cobranca.upsert({
        where: { id: doc.id },
        update: {
          status: d.status || "PENDING",
          atualizadaEm: converterData(d.atualizadaEm),
        },
        create: {
          id: doc.id,
          empresaId: d.empresaId,
          assinaturaId: d.assinaturaId || null,
          asaasPaymentId: d.asaasPaymentId || null,
          asaasSubscriptionId: d.asaasSubscriptionId || null,
          valor: d.valor || 0,
          valorLiquido: d.valorLiquido || null,
          vencimento: converterData(d.vencimento),
          status: d.status || "PENDING",
          formaPagamento: d.formaPagamento || "UNDEFINED",
          invoiceUrl: d.invoiceUrl || null,
          bankSlipUrl: d.bankSlipUrl || null,
          pixPayload: d.pixPayload || null,
          pagaEm: d.pagaEm ? converterData(d.pagaEm) : null,
          criadaEm: converterData(d.criadaEm),
          atualizadaEm: converterData(d.atualizadaEm),
        },
      });
      migrados++;
    } catch (err: any) {
      erros++;
      inconsistencias.push(`Cobrança ${doc.id}: ${err.message}`);
    }
  }

  console.log(`  ✅ ${migrados}/${total} migradas (${erros} erros)`);
  relatorio.push({ entidade: "cobrancas", total, migrados, erros, inconsistencias });
}

// ─── Aceites ──────────────────────────────────────────────────

async function migrarAceites(): Promise<void> {
  console.log("\n🤝 Migrando ACEITES...");
  const snapshot = await firestore.collection("financeiro_aceites").get();
  const total = snapshot.size;
  let migrados = 0;
  let erros = 0;
  const inconsistencias: string[] = [];

  const empresasIds = new Set(
    (await prisma.empresa.findMany({ select: { id: true } })).map((e) => e.id)
  );
  const planosIds = new Set(
    (await prisma.plano.findMany({ select: { id: true } })).map((p) => p.id)
  );

  for (const doc of snapshot.docs) {
    const d = doc.data();

    if (!d.empresaId || !empresasIds.has(d.empresaId)) {
      inconsistencias.push(`Aceite ${doc.id}: empresaId inválido, ignorado`);
      erros++;
      continue;
    }

    let planoId = d.planoId;
    if (!planoId || !planosIds.has(planoId)) {
      const fallback = await prisma.plano.findFirst();
      if (fallback) planoId = fallback.id;
      else {
        inconsistencias.push(`Aceite ${doc.id}: sem planoId válido, ignorado`);
        erros++;
        continue;
      }
    }

    try {
      await prisma.aceiteAssinatura.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          empresaId: d.empresaId,
          planoId,
          ciclo: d.ciclo || "MENSAL",
          valor: d.valor || 0,
          status: d.status || "PENDENTE",
          expiraEm: converterData(d.expiraEm),
          diasTrial: d.diasTrial || null,
          vencimentoPrimeiraCobrancaEm: d.vencimentoPrimeiraCobrancaEm ? converterData(d.vencimentoPrimeiraCobrancaEm) : null,
          responsavelNome: d.responsavelNome || null,
          responsavelEmail: d.responsavelEmail || null,
          whatsappResponsavel: d.whatsappResponsavel || null,
          cnpj: d.cnpj || null,
          aceitoEm: d.aceitoEm ? converterData(d.aceitoEm) : null,
          aceitoPorCanal: d.aceitoPorCanal || null,
          formaPagamentoEscolhida: d.formaPagamentoEscolhida || null,
          asaasCustomerId: d.asaasCustomerId || null,
          asaasSubscriptionId: d.asaasSubscriptionId || null,
          criadoEm: converterData(d.criadoEm),
        },
      });
      migrados++;
    } catch (err: any) {
      erros++;
      inconsistencias.push(`Aceite ${doc.id}: ${err.message}`);
    }
  }

  console.log(`  ✅ ${migrados}/${total} migrados (${erros} erros)`);
  relatorio.push({ entidade: "aceites", total, migrados, erros, inconsistencias });
}

// ─── Webhook Eventos ──────────────────────────────────────────

async function migrarWebhookEventos(): Promise<void> {
  console.log("\n🔗 Migrando WEBHOOK EVENTOS...");
  const snapshot = await firestore.collection("financeiro_webhook_eventos").get();
  const total = snapshot.size;
  let migrados = 0;
  let erros = 0;
  const inconsistencias: string[] = [];

  for (const doc of snapshot.docs) {
    const d = doc.data();

    try {
      await prisma.webhookEvento.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          tipo: d.tipo || d.event || "desconhecido",
          processado: d.processado === true,
          payload: d.payload || d,
          processadoEm: d.processadoEm ? converterData(d.processadoEm) : null,
          criadoEm: converterData(d.criadoEm),
        },
      });
      migrados++;
    } catch (err: any) {
      erros++;
      inconsistencias.push(`Webhook ${doc.id}: ${err.message}`);
    }
  }

  console.log(`  ✅ ${migrados}/${total} migrados (${erros} erros)`);
  relatorio.push({ entidade: "webhook_eventos", total, migrados, erros, inconsistencias });
}

// ─── Verificação e Relatório ──────────────────────────────────

async function verificar(): Promise<void> {
  console.log("\n🔍 VERIFICAÇÃO PÓS-MIGRAÇÃO (Onda 3)");
  console.log("─".repeat(60));

  const contagens = {
    planos: await prisma.plano.count(),
    assinaturas: await prisma.assinatura.count(),
    cobrancas: await prisma.cobranca.count(),
    aceites: await prisma.aceiteAssinatura.count(),
    webhookEventos: await prisma.webhookEvento.count(),
  };

  for (const [entidade, total] of Object.entries(contagens)) {
    console.log(`  ${entidade}: ${total} registros`);
  }
}

function imprimirRelatorio(): void {
  console.log("\n" + "═".repeat(60));
  console.log("📊 RELATÓRIO FINAL — ONDA 3 (Financeiro)");
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
  console.log("🚀 MIGRAÇÃO ONDA 3: Entidades Financeiras");
  console.log("   Restaurante360");
  console.log("   " + new Date().toLocaleString("pt-BR"));
  console.log("═".repeat(60));

  try {
    await migrarPlanos();
    await migrarAssinaturas();
    await migrarCobrancas();
    await migrarAceites();
    await migrarWebhookEventos();
    await verificar();
    imprimirRelatorio();

    console.log("\n🎉 Migração Onda 3 concluída!");
  } catch (error) {
    console.error("\n💥 ERRO FATAL:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
