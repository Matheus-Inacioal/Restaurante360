/**
 * POST /api/empresa/usuarios/criar
 *
 * Cria um novo usuário operacional ou gestorLocal vinculado à empresa.
 * Requer: gestorCorporativo ou gestorLocal (com restrição de papel)
 */
import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { repositorioUsuariosPg } from '@/server/repositorios/repositorio-usuarios-pg';
import { adminAuth } from '@/server/firebase/admin';
import type { PapelUsuario } from '@/lib/tipos/identidade';

// Papéis que podem ser criados por cada gestor
const PAPEIS_CRIATIVEIS_POR_GESTOR_CORPORATIVO: PapelUsuario[] = [
  'gestorLocal',
  'operacional',
];
const PAPEIS_CRIATIVEIS_POR_GESTOR_LOCAL: PapelUsuario[] = ['operacional'];

export async function POST(req: NextRequest) {
  const acesso = await garantirAcessoEmpresa(req);
  if (acesso instanceof Response) return acesso;

  const papel = acesso.sessao.papel;
  if (papel !== 'gestorCorporativo' && papel !== 'gestorLocal') {
    return NextResponse.json(
      { ok: false, code: 'FORBIDDEN', message: 'Sem permissão para criar usuários.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      email,
      nome,
      papelNovo,
      unidadeId,
      areaId,
      funcaoId,
    }: {
      email: string;
      nome: string;
      papelNovo: PapelUsuario;
      unidadeId?: string;
      areaId?: string;
      funcaoId?: string;
    } = body;

    if (!email || !nome || !papelNovo) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION_ERROR', message: 'email, nome e papelNovo são obrigatórios.' },
        { status: 400 }
      );
    }

    // Validar se o papel pode ser criado pelo gestor atual
    const papeisPermitidos =
      papel === 'gestorCorporativo'
        ? PAPEIS_CRIATIVEIS_POR_GESTOR_CORPORATIVO
        : PAPEIS_CRIATIVEIS_POR_GESTOR_LOCAL;

    if (!papeisPermitidos.includes(papelNovo)) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: `Você não pode criar usuários com o papel "${papelNovo}".` },
        { status: 403 }
      );
    }

    // gestorLocal só pode criar na própria unidade
    const unidadeIdFinal =
      papel === 'gestorLocal'
        ? acesso.sessao.unidadeId
        : unidadeId;

    // 1. Criar no Firebase Auth
    let uid: string;
    let linkPrimeiroAcesso: string | undefined;

    try {
      const userRecord = await adminAuth.createUser({
        email,
        displayName: nome,
      });
      uid = userRecord.uid;
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { ok: false, code: 'EMAIL_JA_EXISTE', message: 'Já existe um usuário com este e-mail.' },
          { status: 409 }
        );
      }
      throw authErr;
    }

    // 2. Criar perfil no PostgreSQL
    const usuario = await repositorioUsuariosPg.criar({
      id: uid,
      email,
      nome,
      papel: papelNovo,
      empresaId: acesso.empresaId,
      unidadeId: unidadeIdFinal,
      areaId,
      funcaoId,
      mustResetPassword: true,
    });

    // 3. Setar claims Firebase
    await adminAuth.setCustomUserClaims(uid, {
      papel: papelNovo,
      empresaId: acesso.empresaId,
      unidadeId: unidadeIdFinal,
    });

    // 4. Gerar link de acesso
    try {
      const appUrl = process.env.APP_URL || 'http://localhost:9002';
      linkPrimeiroAcesso = await adminAuth.generatePasswordResetLink(email, {
        url: `${appUrl}/login`,
      });
    } catch {
      console.warn('[criar-usuario] Link de acesso não gerado');
    }

    return NextResponse.json(
      { ok: true, data: { usuario, linkPrimeiroAcesso } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST /api/empresa/usuarios/criar] Erro:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao criar usuário.' },
      { status: 500 }
    );
  }
}
