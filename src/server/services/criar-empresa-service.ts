/**
 * Serviço de Criação de Empresa — Restaurante360
 *
 * Orquestra o provisionamento de um novo tenant:
 * 1. Persiste empresa, unidade padrão e usuário no PostgreSQL (transação atômica)
 * 2. Gera link de primeiro acesso via TokenResetSenha
 *
 * Fonte de verdade = PostgreSQL. Sem Firebase.
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/server/servicos/servico-auditoria";
import { servicoLinksAutenticacao } from "@/server/servicos/servico-links-autenticacao";

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

// ─── Serviço ──────────────────────────────────────────────────

export async function criarEmpresaService(
  data: CriarEmpresaInput
): Promise<CriarEmpresaResult> {
  console.log(`[CRIAR_EMPRESA] Iniciando provisionamento: ${data.nomeEmpresa} (${data.cnpj})`);

  try {
    // 1. Verificar CNPJ e E-mail duplicados
    const [cnpjExistente, emailExistente] = await Promise.all([
      prisma.empresa.findUnique({ where: { cnpj: data.cnpj } }),
      prisma.usuario.findUnique({ where: { email: data.emailResponsavel } })
    ]);

    if (cnpjExistente) {
      return { ok: false, code: "CNPJ_JA_EXISTE", message: "Já existe uma empresa cadastrada com este CNPJ." };
    }
    if (emailExistente) {
      return { ok: false, code: "EMAIL_JA_EXISTE", message: "Já existe um usuário com este e-mail." };
    }

    // 2. Transação atômica no PostgreSQL
    console.log("[CRIAR_EMPRESA] 1. Criando empresa e usuário no PostgreSQL...");

    const statusEmpresa = (data.diasTrial ?? 0) > 0 ? "TRIAL_ATIVO" : "ATIVO";
    const diasTrial = data.diasTrial ?? 14;

    const { empresa, usuario } = await prisma.$transaction(async (tx) => {
      // 2.1 Criar empresa
      const novaEmpresa = await tx.empresa.create({
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
          empresaId: novaEmpresa.id,
          nome: "Sede Principal",
          status: "ativo",
        },
      });

      // 2.3 Criar usuário gestor corporativo
      const novoUsuario = await tx.usuario.create({
        data: {
          email: data.emailResponsavel,
          nome: data.nomeResponsavel,
          papel: "gestorCorporativo",
          status: "ativo",
          empresaId: novaEmpresa.id,
          mustResetPassword: true, // Força troca de senha no primeiro acesso
          senhaHash: null, // Convite pendente, sem senha
        },
      });

      return { empresa: novaEmpresa, usuario: novoUsuario };
    });

    console.log(`[CRIAR_EMPRESA]    → Empresa ID: ${empresa.id}`);
    console.log(`[CRIAR_EMPRESA]    → Usuário ID: ${usuario.id}`);

    // 3. Registrar auditoria (não-bloqueante)
    registrarAuditoria({
      usuarioId: usuario.id,
      acao: "empresa.criada",
      entidade: "empresa",
      entidadeId: empresa.id,
      empresaId: empresa.id,
      detalhe: { nome: empresa.nome, cnpj: empresa.cnpj },
    }).catch(() => null);

    // 4. Gerar link de primeiro acesso
    console.log("[CRIAR_EMPRESA] 2. Gerando link de primeiro acesso...");
    let linkPrimeiroAcesso: string | undefined;
    try {
      const res = await servicoLinksAutenticacao.gerarLinkPrimeiroAcesso(data.emailResponsavel);
      if (res.ok) {
        linkPrimeiroAcesso = res.link;
        console.log("[CRIAR_EMPRESA]    → Link gerado.");
      } else {
        console.warn("[CRIAR_EMPRESA]    ⚠️ Falha ao gerar link:", res.error);
      }
    } catch (linkError) {
      console.warn("[CRIAR_EMPRESA]    ⚠️ Erro inesperado ao gerar link:", linkError);
    }

    console.log(`[CRIAR_EMPRESA] ✅ Provisionamento concluído: ${data.nomeEmpresa}`);

    return {
      ok: true,
      empresaId: empresa.id,
      usuarioId: usuario.id,
      emailResponsavel: data.emailResponsavel,
      statusEmpresa,
      linkPrimeiroAcesso,
    };
  } catch (error: any) {
    console.error("[CRIAR_EMPRESA] ❌ Falha:", error);

    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Falha ao criar a empresa. Tente novamente.",
    };
  }
}
