/**
 * GET /api/auth/perfil
 *
 * Retorna o perfil completo do usuário autenticado (do PostgreSQL).
 * Utilizado pelo hook usePerfil no front-end após o login.
 *
 * Autenticação: Bearer Token do Firebase Auth
 */
import { NextRequest, NextResponse } from 'next/server';
import { obterSessao } from '@/server/auth/obterSessao';
import { repositorioUsuariosPg } from '@/server/repositorios/repositorio-usuarios-pg';

export async function GET(req: NextRequest) {
  try {
    const sessao = await obterSessao(req);
    if (!sessao) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Token inválido ou ausente.' },
        { status: 401 }
      );
    }

    const perfil = await repositorioUsuariosPg.obterPorId(sessao.uid);
    if (!perfil) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Perfil não encontrado.' },
        { status: 404 }
      );
    }

    // Formata para o tipo PerfilUsuario do front-end
    const perfilFormatado = {
      id: perfil.id,
      email: perfil.email,
      nome: perfil.nome,
      papel: perfil.papel,
      status: perfil.status,
      empresaId: perfil.empresaId,
      unidadeId: perfil.unidadeId,
      areaId: perfil.areaId,
      funcaoId: perfil.funcaoId,
      mustResetPassword: perfil.mustResetPassword,
      criadoEm: perfil.criadoEm.toISOString(),
      atualizadoEm: perfil.atualizadoEm.toISOString(),
      // Dados extras
      empresa: perfil.empresa ? { id: perfil.empresa.id, nome: perfil.empresa.nome } : null,
      unidade: perfil.unidade ? { id: perfil.unidade.id, nome: perfil.unidade.nome } : null,
    };

    // Registra último acesso de forma não-bloqueante
    repositorioUsuariosPg.registrarUltimoAcesso(sessao.uid).catch(() => null);

    return NextResponse.json({ ok: true, data: perfilFormatado });
  } catch (error: any) {
    console.error('[GET /api/auth/perfil] Erro:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno ao buscar perfil.' },
      { status: 500 }
    );
  }
}
