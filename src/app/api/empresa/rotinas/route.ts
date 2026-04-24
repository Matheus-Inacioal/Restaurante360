/**
 * GET /api/empresa/rotinas
 *
 * Lista todas as rotinas da empresa autenticada.
 * Suporta filtro: ?apenasAtivas=true
 */
import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { repositorioRotinasPg } from '@/server/repositorios/repositorio-rotinas-pg';

export async function GET(req: NextRequest) {
  const acesso = await garantirAcessoEmpresa(req);
  if (acesso instanceof Response) return acesso;

  try {
    const { searchParams } = new URL(req.url);
    const apenasAtivas = searchParams.get('apenasAtivas') === 'true';

    const rotinas = await repositorioRotinasPg.listarPorEmpresa(
      acesso.empresaId,
      apenasAtivas
    );

    return NextResponse.json({ ok: true, data: rotinas });
  } catch (error: any) {
    console.error('[GET /api/empresa/rotinas] Erro:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao listar rotinas.' },
      { status: 500 }
    );
  }
}
