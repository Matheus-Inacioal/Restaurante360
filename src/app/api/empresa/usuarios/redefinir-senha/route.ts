/**
 * POST /api/empresa/usuarios/redefinir-senha
 *
 * Gera link de redefinição de senha para um colaborador da mesma empresa.
 * Migrado de Firestore → PostgreSQL (Prisma)
 *
 * Validações:
 * - Chamador autenticado + empresa ativa
 * - Chamador é gestorCorporativo ou gestorLocal
 * - E-mail pertence a um colaborador da mesma empresa
 */
import { z } from 'zod';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { obterSessao } from '@/server/auth/obterSessao';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const redefinirSenhaSchema = z.object({
  emailColaborador: z.string().trim().toLowerCase().email('E-mail inválido.'),
});

export async function POST(req: Request) {
  try {
    const authResult = await obterSessao();
    if (!authResult) {
      return jsonErro("Não autorizado.", "UNAUTHORIZED", 401);
    }

    const { uid, papel, empresaId } = authResult;

    // Apenas gestores podem redefinir senhas
    const papelPermitido =
      papel === 'gestorCorporativo' || papel === 'gestorLocal';
    if (!papelPermitido) {
      return jsonErro('Apenas gestores podem redefinir senhas de colaboradores.', 'FORBIDDEN', 403);
    }

    const body = await req.json();
    const parseResult = redefinirSenhaSchema.safeParse(body);
    if (!parseResult.success) return mapearZodError(parseResult.error);

    const { emailColaborador } = parseResult.data;

    const colaborador = await prisma.usuario.findUnique({
      where: { email: emailColaborador }
    });

    if (!colaborador || colaborador.empresaId !== empresaId) {
      return jsonErro('Este colaborador não pertence à sua empresa ou não existe.', 'FORBIDDEN', 403);
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId! },
      select: { nome: true },
    });

    // Gerar token próprio
    const tokenStr = crypto.randomUUID();
    await prisma.tokenResetSenha.create({
        data: {
            id: tokenStr,
            usuarioId: colaborador.id,
            expiraEm: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
        }
    });

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const linkReset = `${appUrl}/login/redefinir-senha?token=${tokenStr}`;

    // Em ambiente de produção, chamaríamos serviço de email aqui
    // Ex: await servicoEmail.enviarEmailResetSenha({ emailDestinatario: emailColaborador, linkReset ... });

    // Registrar auditoria no PostgreSQL
    await prisma.auditoria.create({
      data: {
        empresaId: empresaId!,
        usuarioId: uid,
        acao: 'usuario.redefinir_senha',
        entidade: 'usuario',
        entidadeId: colaborador.id,
        detalhe: { emailColaborador, gerouToken: true },
      },
    });

    const resposta: Record<string, any> = { sucesso: true };
    if (process.env.NODE_ENV !== 'production') {
      resposta.linkRedefinicao = linkReset;
    }

    return jsonOk(resposta);
  } catch (error: any) {
    console.error('[REDEFINIR_SENHA] Erro:', error);
    return jsonErro('Falha interna ao gerar redefinição de senha.', 'INTERNAL_ERROR', 500);
  }
}
