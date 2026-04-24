/**
 * POST /api/empresa/tarefas/criar
 *
 * Cria uma nova tarefa para a empresa autenticada.
 * Requer: gestorCorporativo ou gestorLocal
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { repositorioTarefasPg } from '@/server/repositorios/repositorio-tarefas-pg';
import { registrarAuditoria } from '@/server/servicos/servico-auditoria';

const esquemaTarefa = z.object({
  titulo: z.string().min(1, 'Título é obrigatório.'),
  descricao: z.string().optional(),
  tipo: z.enum(['tarefa', 'checklist']).default('tarefa'),
  prioridade: z.enum(['Alta', 'Media', 'Baixa']).default('Media'),
  responsavelId: z.string().optional(),
  prazo: z.string().optional(), // ISO date string
  tags: z.array(z.string()).optional(),
  itensVerificacao: z.any().optional(),
});

export async function POST(req: Request) {
  const acesso = await garantirAcessoEmpresa(req);
  if (acesso instanceof Response) return acesso;

  try {
    const body = await req.json();
    const parse = esquemaTarefa.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION_ERROR', errors: parse.error.flatten() },
        { status: 400 }
      );
    }

    const dados = parse.data;
    const empresaId = acesso.empresaId;
    const uid = acesso.sessao.uid;

    const tarefa = await repositorioTarefasPg.criar({
      empresaId,
      titulo: dados.titulo,
      descricao: dados.descricao,
      tipo: dados.tipo,
      prioridade: dados.prioridade,
      responsavelId: dados.responsavelId,
      prazo: dados.prazo ? new Date(dados.prazo) : null,
      tags: dados.tags,
      itensVerificacao: dados.itensVerificacao,
      criadoPor: uid,
    });

    // Auditoria não-bloqueante
    registrarAuditoria({
      usuarioId: uid,
      acao: 'tarefa.criada',
      entidade: 'tarefa',
      entidadeId: tarefa.id,
      empresaId,
      detalhe: { titulo: tarefa.titulo },
    }).catch(() => null);

    return NextResponse.json({ ok: true, data: tarefa }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/empresa/tarefas/criar] Erro:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao criar tarefa.' },
      { status: 500 }
    );
  }
}
