/**
 * POST /api/empresa/rotinas/salvar — Cria uma nova rotina
 * PUT  /api/empresa/rotinas/salvar — Atualiza rotina existente
 *
 * Requer: gestorCorporativo ou gestorLocal
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { repositorioRotinasPg } from '@/server/repositorios/repositorio-rotinas-pg';
import { registrarAuditoria } from '@/server/servicos/servico-auditoria';

const esquemaRotina = z.object({
  id: z.string().optional(),
  titulo: z.string().min(1, 'Título é obrigatório.'),
  descricao: z.string().optional(),
  frequencia: z.enum(['diaria', 'semanal', 'mensal']).default('diaria'),
  diasSemana: z.array(z.number().min(0).max(6)).optional(),
  diaDoMes: z.number().min(1).max(31).optional(),
  horarioPreferencial: z.string().optional(),
  responsavelPadraoId: z.string().optional(),
  tipoTarefaGerada: z.enum(['tarefa', 'checklist']).default('tarefa'),
  checklistModelo: z.any().optional(),
  tags: z.array(z.string()).optional(),
  ativa: z.boolean().default(true),
});

export async function POST(req: Request) {
  return handleSalvar(req, false);
}

export async function PUT(req: Request) {
  return handleSalvar(req, true);
}

async function handleSalvar(req: Request, isUpdate: boolean) {
  const acesso = await garantirAcessoEmpresa(req);
  if (acesso instanceof Response) return acesso;

  try {
    const body = await req.json();
    const parse = esquemaRotina.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION_ERROR', errors: parse.error.flatten() },
        { status: 400 }
      );
    }

    const dados = parse.data;
    const empresaId = acesso.empresaId;
    const uid = acesso.sessao.uid;

    if (isUpdate && !dados.id) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION_ERROR', message: 'ID é obrigatório para atualização.' },
        { status: 400 }
      );
    }

    let rotina;

    if (isUpdate) {
      rotina = await repositorioRotinasPg.atualizar(dados.id!, {
        titulo: dados.titulo,
        descricao: dados.descricao,
        ativa: dados.ativa,
        frequencia: dados.frequencia,
        diasSemana: dados.diasSemana,
        diaDoMes: dados.diaDoMes,
        horarioPreferencial: dados.horarioPreferencial,
        responsavelPadraoId: dados.responsavelPadraoId,
        checklistModelo: dados.checklistModelo,
        tags: dados.tags,
      });
    } else {
      rotina = await repositorioRotinasPg.criar({
        empresaId,
        titulo: dados.titulo,
        descricao: dados.descricao,
        frequencia: dados.frequencia,
        diasSemana: dados.diasSemana,
        diaDoMes: dados.diaDoMes,
        horarioPreferencial: dados.horarioPreferencial,
        responsavelPadraoId: dados.responsavelPadraoId,
        tipoTarefaGerada: dados.tipoTarefaGerada,
        checklistModelo: dados.checklistModelo,
        tags: dados.tags,
        criadoPor: uid,
      });
    }

    registrarAuditoria({
      usuarioId: uid,
      acao: isUpdate ? 'rotina.atualizada' : 'rotina.criada',
      entidade: 'rotina',
      entidadeId: rotina.id,
      empresaId,
      detalhe: { titulo: rotina.titulo },
    }).catch(() => null);

    return NextResponse.json(
      { ok: true, data: rotina },
      { status: isUpdate ? 200 : 201 }
    );
  } catch (error: any) {
    console.error('[/api/empresa/rotinas/salvar] Erro:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao salvar rotina.' },
      { status: 500 }
    );
  }
}
