/**
 * Rotas de Áreas — /api/empresa/areas
 *
 * GET  → Lista áreas com funções da empresa
 * POST → Cria nova área (gestorCorporativo apenas)
 */
import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { repositorioAreasPg } from '@/server/repositorios/repositorio-areas-pg';

export async function GET(req: NextRequest) {
  const acesso = await garantirAcessoEmpresa(req);
  if (acesso instanceof Response) return acesso;

  try {
    const areas = await repositorioAreasPg.listarPorEmpresa(acesso.empresaId);
    return NextResponse.json({ ok: true, data: areas });
  } catch (error: any) {
    console.error('[GET /api/empresa/areas] Erro:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao listar áreas.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const acesso = await garantirAcessoEmpresa(req);
  if (acesso instanceof Response) return acesso;

  if (acesso.sessao.papel !== 'gestorCorporativo') {
    return NextResponse.json(
      { ok: false, code: 'FORBIDDEN', message: 'Apenas gestores corporativos podem criar áreas.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { nome, descricao } = body;

    if (!nome) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION_ERROR', message: 'Nome da área é obrigatório.' },
        { status: 400 }
      );
    }

    const area = await repositorioAreasPg.criar({
      empresaId: acesso.empresaId,
      nome,
      descricao,
    });

    return NextResponse.json({ ok: true, data: area }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/empresa/areas] Erro:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao criar área.' },
      { status: 500 }
    );
  }
}
