import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/operacional/tarefas
 *
 * Lista as tarefas atribuídas ao colaborador logado (responsavelId = uid).
 * Cada Tarefa é adaptada para o formato "checklist" esperado pelo frontend,
 * onde cada item de `itensVerificacao` vira uma "task" interna.
 */

interface ItemVerificacao {
  id: string;
  texto: string;
  concluido: boolean;
  exigeFoto?: boolean;
  fotos?: string[];
  concluidoEm?: string | null;
}

export async function GET(req: NextRequest) {
  const acesso = await garantirAcessoEmpresa(req);
  if (acesso instanceof Response) return acesso;

  try {
    const uid = acesso.sessao.uid;

    const tarefas = await prisma.tarefa.findMany({
      where: {
        empresaId: acesso.empresaId,
        responsavelId: uid,
      },
      orderBy: { criadoEm: 'desc' },
    });

    const checklistsAdaptados = tarefas.map((t) => {
      const itens = (Array.isArray(t.itensVerificacao)
        ? t.itensVerificacao
        : []) as unknown as ItemVerificacao[];

      return {
        id: t.id,
        processName: t.titulo,
        description: t.descricao ?? null,
        assignedTo: t.responsavelId,
        status: t.status,
        prazo: t.prazo ? t.prazo.toISOString() : null,
        tasks: itens.map((item) => ({
          id: item.id,
          title: item.texto,
          requiresPhoto: item.exigeFoto ?? false,
          status: item.concluido ? 'done' : 'pending',
          completedAt: item.concluidoEm ?? null,
          photoUrls: item.fotos ?? [],
        })),
      };
    });

    return NextResponse.json({ sucesso: true, checklists: checklistsAdaptados });
  } catch (error: any) {
    console.error('[GET /api/operacional/tarefas] Erro:', error);
    return NextResponse.json(
      { sucesso: false, erro: 'Falha ao listar tarefas.' },
      { status: 500 }
    );
  }
}
