/**
 * GET /api/sistema/empresas — Lista todas as empresas (saasAdmin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoSistema } from '@/server/auth/garantirAcessoSistema';
import { repositorioEmpresasPg } from '@/server/repositorios/repositorio-empresas-pg';

export async function GET(req: NextRequest) {
  const acesso = await garantirAcessoSistema(req);
  if (acesso instanceof Response) return acesso;

  try {
    const empresas = await repositorioEmpresasPg.listarTodas();
    return NextResponse.json({ ok: true, data: empresas });
  } catch (error: any) {
    console.error('[GET /api/sistema/empresas] Erro:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao listar empresas.' },
      { status: 500 }
    );
  }
}
