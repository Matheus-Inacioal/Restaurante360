import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';

/**
 * POST /api/operacional/tarefas/concluir
 * Conclui UM item (taskId) dentro de uma Tarefa (checklistId).
 *   checklistId -> Tarefa.id
 *   taskId      -> id do item dentro de itensVerificacao
 */

const concluirTarefaSchema = z.object({
  checklistId: z.string().min(1, 'Tarefa ID é obrigatório.'),
  taskId: z.string().min(1, 'Item ID é obrigatório.'),
  photoUrls: z.array(z.string()).optional(),
});

interface ItemVerificacao {
  id: string;
  texto: string;
  concluido: boolean;
  exigeFoto?: boolean;
  fotos?: string[];
  concluidoEm?: string | null;
}

const PAPEIS_GESTORES = ['gestorCorporativo', 'gestorLocal'];

export async function POST(req: Request) {
  const acesso = await garantirAcessoEmpresa(req);
  if (acesso instanceof Response) return acesso;

  try {
    const uid = acesso.sessao.uid;
    const papel = acesso.sessao.papel;

    const body = await req.json();
    const parse = concluirTarefaSchema.safeParse(body);
    if (!parse.success) {
      return mapearZodError(parse.error);
    }
    const { checklistId, taskId, photoUrls } = parse.data;

    const tarefa = await prisma.tarefa.findFirst({
      where: { id: checklistId, empresaId: acesso.empresaId },
    });
    if (!tarefa) {
      return jsonErro('Tarefa não encontrada.', 'NOT_FOUND', 404);
    }

    const ehResponsavel = tarefa.responsavelId === uid;
    const ehGestor = papel ? PAPEIS_GESTORES.includes(papel) : false;
    if (!ehResponsavel && !ehGestor) {
      return jsonErro(
        'Você não tem permissão para concluir itens desta tarefa.',
        'FORBIDDEN',
        403
      );
    }

    const itens = (Array.isArray(tarefa.itensVerificacao)
      ? tarefa.itensVerificacao
      : []) as unknown as ItemVerificacao[];

    const idx = itens.findIndex((i) => i.id === taskId);
    if (idx === -1) {
      return jsonErro('Item não encontrado na tarefa.', 'NOT_FOUND', 404);
    }

    itens[idx] = {
      ...itens[idx],
      concluido: true,
      concluidoEm: new Date().toISOString(),
      fotos:
        photoUrls && photoUrls.length > 0
          ? photoUrls
          : itens[idx].fotos ?? [],
    };

    const todosConcluidos = itens.length > 0 && itens.every((i) => i.concluido);

    await prisma.$transaction(async (tx) => {
      await tx.tarefa.update({
        where: { id: tarefa.id },
        data: {
          itensVerificacao: itens as any,
          status: todosConcluidos ? 'concluida' : 'em_progresso',
        },
      });

      if (todosConcluidos) {
        await tx.auditoria.create({
          data: {
            empresaId: acesso.empresaId,
            usuarioId: uid,
            acao: 'TAREFA_CONCLUIR',
            entidade: 'tarefa',
            entidadeId: tarefa.id,
            detalhe: { titulo: tarefa.titulo },
          },
        });
      }
    });

    return jsonOk({
      mensagem: todosConcluidos
        ? 'Tarefa finalizada! Parabéns!'
        : 'Item concluído!',
      allTasksCompleted: todosConcluidos,
    });
  } catch (error: any) {
    console.error('[POST /api/operacional/tarefas/concluir] Erro:', error);
    return jsonErro('Falha interna ao concluir item.', 'INTERNAL_ERROR', 500);
  }
}
