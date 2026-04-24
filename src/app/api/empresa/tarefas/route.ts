/**
 * GET /api/empresa/tarefas
 * 
 * Lista todas as tarefas da empresa autenticada.
 * Suporta filtros opcionais via query string: ?status=pendente&responsavelId=xxx
 */
import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { repositorioTarefasPg } from '@/server/repositorios/repositorio-tarefas-pg';

export async function GET(req: NextRequest) {
  const acesso = await garantirAcessoEmpresa(req);
  if (acesso instanceof Response) return acesso;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? undefined;
    const responsavelId = searchParams.get('responsavelId') ?? undefined;

    const tarefas = await repositorioTarefasPg.listarPorEmpresa(
      acesso.empresaId,
      { status, responsavelId }
    );

    return NextResponse.json({ ok: true, data: tarefas });
  } catch (error: any) {
    console.error('[GET /api/empresa/tarefas] Erro:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao listar tarefas.' },
      { status: 500 }
    );
  }
}
