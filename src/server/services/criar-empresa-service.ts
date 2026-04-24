/**
 * Serviço de Criação de Empresa — Restaurante360
 *
 * Orquestra o provisionamento de um novo tenant:
 * 1. Cria usuário no Firebase Auth
 * 2. Persiste empresa e usuário no PostgreSQL (via Prisma — transação atômica)
 * 3. Gera link de primeiro acesso via Firebase Auth
 *
 * Firestore NÃO é mais utilizado. Fonte de verdade = PostgreSQL.
 */
import "server-only";
import { adminAuth } from "@/server/firebase/admin";
import { repositorioEmpresasPg } from "@/server/repositorios/repositorio-empresas-pg";
import { repositorioUsuariosPg } from "@/server/repositorios/repositorio-usuarios-pg";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/server/servicos/servico-auditoria";

// ─── Tipos ────────────────────────────────────────────────────

export interface CriarEmpresaInput {
  nomeEmpresa: string;
  cnpj: string;
  nomeResponsavel: string;
  emailResponsavel: string;
  whatsappResponsavel: string;
  planoId?: string;
  planoNome?: string;
  diasTrial?: number;
}

export interface CriarEmpresaResult {
  ok: boolean;
  empresaId?: string;
  usuarioId?: string;
  emailResponsavel?: string;
  linkPrimeiroAcesso?: string;
  statusEmpresa?: string;
  message?: string;
  code?: string;
}

const APP_URL = process.env.APP_URL || "http://localhost:9002";

// ─── Serviço ──────────────────────────────────────────────────

export async function criarEmpresaService(
  data: CriarEmpresaInput
): Promise<CriarEmpresaResult> {
  console.log(`[CRIAR_EMPRESA] Iniciando provisionamento: ${data.nomeEmpresa} (${data.cnpj})`);

  let uid: string | null = null;

  try {
    // Verificar CNPJ duplicado
    const cnpjExistente = await repositorioEmpresasPg.obterPorCnpj(data.cnpj);
    if (cnpjExistente) {
      return {
        ok: false,
        code: "CNPJ_JA_EXISTE",
        message: "Já existe uma empresa cadastrada com este CNPJ.",
      };
    }

    // ── 1. Criar usuário no Firebase Auth ─────────────────────
    console.log("[CRIAR_EMPRESA] 1. Criando usuário no Firebase Auth...");
    try {
      const userRecord = await adminAuth.createUser({
        email: data.emailResponsavel,
        displayName: data.nomeResponsavel,
        emailVerified: false,
      });
      uid = userRecord.uid;
      console.log(`[CRIAR_EMPRESA]    → UID: ${uid}`);
    } catch (authError: any) {
      if (authError.code === "auth/email-already-exists") {
        return {
          ok: false,
          code: "EMAIL_JA_EXISTE",
          message: "Já existe um usuário com este e-mail.",
        };
      }
      throw authError;
    }

    // ── 2. Transação atômica no PostgreSQL ────────────────────
    console.log("[CRIAR_EMPRESA] 2. Criando empresa e usuário no PostgreSQL...");

    const statusEmpresa = (data.diasTrial ?? 0) > 0 ? "TRIAL_ATIVO" : "ATIVO";
    const diasTrial = data.diasTrial ?? 14;

    const { empresa, usuario } = await prisma.$transaction(async (tx) => {
      // 2.1 Criar empresa
      const empresa = await tx.empresa.create({
        data: {
          nome: data.nomeEmpresa,
          cnpj: data.cnpj,
          responsavelNome: data.nomeResponsavel,
          responsavelEmail: data.emailResponsavel,
          whatsappResponsavel: data.whatsappResponsavel || null,
          status: statusEmpresa as any,
          planoId: data.planoId || null,
          planoNome: data.planoNome || null,
          diasTrial,
          trialInicio: diasTrial > 0 ? new Date() : null,
          trialFim: diasTrial > 0
            ? new Date(Date.now() + diasTrial * 24 * 60 * 60 * 1000)
            : null,
        },
      });

      // 2.2 Criar unidade padrão
      await tx.unidade.create({
        data: {
          empresaId: empresa.id,
          nome: "Sede Principal",
          status: "ativo",
        },
      });

      // 2.3 Criar usuário gestor corporativo
      const usuario = await tx.usuario.create({
        data: {
          id: uid!,
          email: data.emailResponsavel,
          nome: data.nomeResponsavel,
          papel: "gestorCorporativo",
          status: "ativo",
          empresaId: empresa.id,
          mustResetPassword: true, // Força troca de senha no primeiro acesso
        },
      });

      return { empresa, usuario };
    });

    console.log(`[CRIAR_EMPRESA]    → Empresa ID: ${empresa.id}`);
    console.log(`[CRIAR_EMPRESA]    → Usuário ID: ${usuario.id}`);

    // ── 3. Registrar auditoria ────────────────────────────────
    await registrarAuditoria({
      usuarioId: uid!,
      acao: "empresa.criada",
      entidade: "empresa",
      entidadeId: empresa.id,
      empresaId: empresa.id,
      detalhe: { nome: empresa.nome, cnpj: empresa.cnpj },
    }).catch(() => null); // Não-bloqueante

    // ── 4. Gerar link de primeiro acesso ──────────────────────
    console.log("[CRIAR_EMPRESA] 3. Gerando link de primeiro acesso...");
    let linkPrimeiroAcesso: string | undefined;
    try {
      linkPrimeiroAcesso = await adminAuth.generatePasswordResetLink(
        data.emailResponsavel,
        { url: `${APP_URL}/login` }
      );
      console.log("[CRIAR_EMPRESA]    → Link gerado.");
    } catch (linkError) {
      console.warn("[CRIAR_EMPRESA]    ⚠️ Falha ao gerar link (não-fatal):", linkError);
    }

    console.log(`[CRIAR_EMPRESA] ✅ Provisionamento concluído: ${data.nomeEmpresa}`);

    return {
      ok: true,
      empresaId: empresa.id,
      usuarioId: uid!,
      emailResponsavel: data.emailResponsavel,
      statusEmpresa,
      linkPrimeiroAcesso,
    };
  } catch (error: any) {
    console.error("[CRIAR_EMPRESA] ❌ Falha:", error);

    // Rollback: remover usuário do Firebase Auth se foi criado mas o PG falhou
    if (uid) {
      try {
        await adminAuth.deleteUser(uid);
        console.log(`[CRIAR_EMPRESA]    → Usuário ${uid} removido do Auth (rollback).`);
      } catch (cleanupError) {
        console.warn("[CRIAR_EMPRESA]    ⚠️ Falha no rollback do Auth:", cleanupError);
      }
    }

    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Falha ao criar a empresa. Tente novamente.",
    };
  }
}
