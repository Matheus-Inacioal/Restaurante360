/**
 * Rotas de Funções — /api/empresa/funcoes
 *
 * GET  → Lista todas as funções da empresa (com área)
 * POST → Cria nova função vinculada a uma área (gestorCorporativo)
 */
import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { repositorioFuncoesPg } from '@/server/repositorios/repositorio-funcoes-pg';

export async function GET(req: NextRequest) {
  const acesso = await garantirAcessoEmpresa(req);
  if (acesso instanceof Response) return acesso;

  try {
    const funcoes = await repositorioFuncoesPg.listarPorEmpresa(acesso.empresaId);
    return NextResponse.json({ ok: true, data: funcoes });
  } catch (error: any) {
    console.error('[GET /api/empresa/funcoes] Erro:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao listar funções.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const acesso = await garantirAcessoEmpresa(req);
  if (acesso instanceof Response) return acesso;

  if (acesso.sessao.papel !== 'gestorCorporativo') {
    return NextResponse.json(
      { ok: false, code: 'FORBIDDEN', message: 'Apenas gestores corporativos podem criar funções.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { areaId, nome, descricao } = body;

    if (!areaId || !nome) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION_ERROR', message: 'areaId e nome são obrigatórios.' },
        { status: 400 }
      );
    }

    const funcao = await repositorioFuncoesPg.criar({ areaId, nome, descricao });
    return NextResponse.json({ ok: true, data: funcao }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/empresa/funcoes] Erro:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao criar função.' },
      { status: 500 }
    );
  }
}
