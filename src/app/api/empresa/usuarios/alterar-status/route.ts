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
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { obterSessao } from '@/server/auth/obterSessao';
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
    const authResult = await obterSessao();
    if (!authResult) {
      return jsonErro("Não autorizado.", "UNAUTHORIZED", 401);
    }

    const { uid: myUid, papel, empresaId } = authResult;

    // Apenas gestores podem alterar status
    const papelPermitido =
      papel === 'gestorCorporativo' || papel === 'gestorLocal';
    if (!papelPermitido) {
      return jsonErro('Apenas gestores podem alterar o status de colaboradores.', 'FORBIDDEN', 403);
    }

    const body = await req.json();
    const parseResult = alterarStatusSchema.safeParse(body);
    if (!parseResult.success) return mapearZodError(parseResult.error);

    const { uid, novoStatus } = parseResult.data;
    const ativo = novoStatus === 'ativo';

    // Impedir auto-inativação
    if (uid === myUid && !ativo) {
      return jsonErro('Você não pode inativar a si mesmo.', 'FORBIDDEN', 403);
    }

    // Verificar que o colaborador pertence à mesma empresa
    const colaborador = await repositorioUsuariosPg.obterPorId(uid);
    if (!colaborador || colaborador.empresaId !== empresaId) {
      return jsonErro('Colaborador não encontrado nesta empresa.', 'NOT_FOUND', 404);
    }

    // Atualizar PostgreSQL
    const usuarioAtualizado = await repositorioUsuariosPg.atualizar(uid, { status: novoStatus });

    // Registrar auditoria
    await prisma.auditoria.create({
      data: {
        empresaId: empresaId!,
        usuarioId: myUid,
        acao: ativo ? 'usuario.reativado' : 'usuario.inativado',
        entidade: 'usuario',
        entidadeId: uid,
        detalhe: { novoStatus, realizadoPor: myUid },
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
