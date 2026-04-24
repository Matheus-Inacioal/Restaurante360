/**
 * POST /api/empresa/usuarios/alterar-status
 *
 * Ativa ou inativa um colaborador da mesma empresa.
 * Migrado de Firestore → PostgreSQL (Prisma)
 *
 * Validações:
 * - Chamador autenticado + empresa ativa
 * - Chamador é gestorCorporativo ou gestorLocal
 * - Colaborador pertence à mesma empresa
 * - Não permite auto-inativação
 */
import { z } from 'zod';
import { adminAuth } from '@/server/firebase/admin';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { repositorioUsuariosPg } from '@/server/repositorios/repositorio-usuarios-pg';
import { prisma } from '@/lib/prisma';

const alterarStatusSchema = z.object({
  uid: z.string().min(1, 'UID do colaborador é obrigatório.'),
  novoStatus: z.enum(['ativo', 'inativo'], {
    errorMap: () => ({ message: "Status deve ser 'ativo' ou 'inativo'." }),
  }),
});

export async function POST(req: Request) {
  try {
    const authResult = await garantirAcessoEmpresa(req);
    if (authResult instanceof Response) return authResult;

    const { sessao, empresaId } = authResult;

    // Apenas gestores podem alterar status
    const papelPermitido =
      sessao.papel === 'gestorCorporativo' ||
      sessao.papel === 'gestorLocal';
    if (!papelPermitido) {
      return jsonErro('Apenas gestores podem alterar o status de colaboradores.', 'FORBIDDEN', 403);
    }

    const body = await req.json();
    const parseResult = alterarStatusSchema.safeParse(body);
    if (!parseResult.success) return mapearZodError(parseResult.error);

    const { uid, novoStatus } = parseResult.data;
    const ativo = novoStatus === 'ativo';

    // Impedir auto-inativação
    if (uid === sessao.uid && !ativo) {
      return jsonErro('Você não pode inativar a si mesmo.', 'FORBIDDEN', 403);
    }

    // Verificar que o colaborador pertence à mesma empresa
    const colaborador = await repositorioUsuariosPg.obterPorId(uid);
    if (!colaborador || colaborador.empresaId !== empresaId) {
      return jsonErro('Colaborador não encontrado nesta empresa.', 'NOT_FOUND', 404);
    }

    // Atualizar Firebase Auth
    try {
      await adminAuth.updateUser(uid, { disabled: !ativo });
    } catch (authError: any) {
      console.error(`[ALTERAR_STATUS] Erro no Auth para UID ${uid}:`, authError);
      return jsonErro(`Falha ao ${ativo ? 'reativar' : 'inativar'} acesso no Auth.`, 'INTERNAL_ERROR', 500);
    }

    // Atualizar PostgreSQL
    const usuarioAtualizado = await repositorioUsuariosPg.atualizar(uid, { status: novoStatus });

    // Registrar auditoria
    await prisma.auditoria.create({
      data: {
        empresaId,
        usuarioId: sessao.uid,
        acao: ativo ? 'usuario.reativado' : 'usuario.inativado',
        entidade: 'usuario',
        entidadeId: uid,
        detalhe: { novoStatus, realizadoPor: sessao.uid },
      },
    });

    return jsonOk({
      uid,
      status: novoStatus,
      nome: usuarioAtualizado.nome,
      atualizadoEm: usuarioAtualizado.atualizadoEm.toISOString(),
    });
  } catch (error: any) {
    console.error('[ALTERAR_STATUS] Erro:', error);
    return jsonErro('Falha interna ao alterar status do colaborador.', 'INTERNAL_ERROR', 500);
  }
}
