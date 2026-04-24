/**
 * Rotas de Unidades — /api/empresa/unidades
 *
 * GET  → Lista unidades da empresa do usuário logado
 * POST → Cria nova unidade (gestorCorporativo apenas)
 */
import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { repositorioUnidadesPg } from '@/server/repositorios/repositorio-unidades-pg';

export async function GET(req: NextRequest) {
  const acesso = await garantirAcessoEmpresa(req);
  if (acesso instanceof Response) return acesso;

  try {
    const unidades = await repositorioUnidadesPg.listarPorEmpresa(acesso.empresaId);
    return NextResponse.json({ ok: true, data: unidades });
  } catch (error: any) {
    console.error('[GET /api/empresa/unidades] Erro:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao listar unidades.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const acesso = await garantirAcessoEmpresa(req);
  if (acesso instanceof Response) return acesso;

  // Apenas gestorCorporativo pode criar unidades
  if (acesso.sessao.papel !== 'gestorCorporativo') {
    return NextResponse.json(
      { ok: false, code: 'FORBIDDEN', message: 'Apenas gestores corporativos podem criar unidades.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { nome, endereco, cidade, estado } = body;

    if (!nome) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION_ERROR', message: 'Nome da unidade é obrigatório.' },
        { status: 400 }
      );
    }

    const unidade = await repositorioUnidadesPg.criar({
      empresaId: acesso.empresaId,
      nome,
      endereco,
      cidade,
      estado,
    });

    return NextResponse.json({ ok: true, data: unidade }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/empresa/unidades] Erro:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao criar unidade.' },
      { status: 500 }
    );
  }
}
