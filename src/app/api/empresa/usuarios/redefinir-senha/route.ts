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
import { adminAuth } from '@/server/firebase/admin';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { repositorioUsuariosPg } from '@/server/repositorios/repositorio-usuarios-pg';
import { servicoLinksAutenticacao } from '@/server/servicos/servico-links-autenticacao';
import { servicoEmail } from '@/server/servicos/servico-email';
import { prisma } from '@/lib/prisma';

const redefinirSenhaSchema = z.object({
  emailColaborador: z.string().trim().toLowerCase().email('E-mail inválido.'),
});

export async function POST(req: Request) {
  try {
    const authResult = await garantirAcessoEmpresa(req);
    if (authResult instanceof Response) return authResult;

    const { sessao, empresaId } = authResult;

    // Apenas gestores podem redefinir senhas
    const papelPermitido =
      sessao.papel === 'gestorCorporativo' || sessao.papel === 'gestorLocal';
    if (!papelPermitido) {
      return jsonErro('Apenas gestores podem redefinir senhas de colaboradores.', 'FORBIDDEN', 403);
    }

    const body = await req.json();
    const parseResult = redefinirSenhaSchema.safeParse(body);
    if (!parseResult.success) return mapearZodError(parseResult.error);

    const { emailColaborador } = parseResult.data;

    // Verificar que o usuário existe no Firebase Auth
    let colaboradorUid: string;
    try {
      const userRecord = await adminAuth.getUserByEmail(emailColaborador);
      colaboradorUid = userRecord.uid;
    } catch {
      return jsonErro('Nenhum usuário encontrado com este e-mail.', 'NOT_FOUND', 404);
    }

    // Verificar que o colaborador pertence à mesma empresa (PostgreSQL)
    const colaborador = await repositorioUsuariosPg.obterPorId(colaboradorUid);
    if (!colaborador || colaborador.empresaId !== empresaId) {
      return jsonErro('Este colaborador não pertence à sua empresa.', 'FORBIDDEN', 403);
    }

    // Buscar nome da empresa para o template de e-mail
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { nome: true },
    });

    // Gerar link de redefinição
    const resultadoLink = await servicoLinksAutenticacao.gerarLinkRedefinicaoSenha(emailColaborador);
    if (!resultadoLink.ok || !resultadoLink.link) {
      return jsonErro(
        resultadoLink.erro || 'Não foi possível gerar o link de redefinição.',
        'INTERNAL_ERROR',
        500
      );
    }

    // Enviar e-mail
    const resultadoEmail = await servicoEmail.enviarEmailResetSenha({
      emailDestinatario: emailColaborador,
      linkReset: resultadoLink.link,
      nomeUsuario: colaborador.nome,
      nomeEmpresa: empresa?.nome,
    });

    if (!resultadoEmail.ok) {
      console.warn(`[REDEFINIR_SENHA] Falha ao enviar e-mail para ${emailColaborador}`);
    }

    // Registrar auditoria no PostgreSQL
    await prisma.auditoria.create({
      data: {
        empresaId,
        usuarioId: sessao.uid,
        acao: 'usuario.redefinir_senha',
        entidade: 'usuario',
        entidadeId: colaboradorUid,
        detalhe: { emailColaborador, emailEnviado: resultadoEmail.ok },
      },
    });

    const resposta: Record<string, any> = { sucesso: true };
    if (process.env.NODE_ENV !== 'production') {
      resposta.linkRedefinicao = resultadoLink.link;
    }

    return jsonOk(resposta);
  } catch (error: any) {
    console.error('[REDEFINIR_SENHA] Erro:', error);
    return jsonErro('Falha interna ao gerar redefinição de senha.', 'INTERNAL_ERROR', 500);
  }
}
