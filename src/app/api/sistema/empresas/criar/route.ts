/**
 * POST /api/sistema/empresas/criar
 *
 * Cria uma nova empresa e seu gestorCorporativo no Firebase Auth + PostgreSQL.
 * Requer: saasAdmin
 */
import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoSistema } from '@/server/auth/garantirAcessoSistema';
import { repositorioEmpresasPg } from '@/server/repositorios/repositorio-empresas-pg';
import { repositorioUsuariosPg } from '@/server/repositorios/repositorio-usuarios-pg';
import { adminAuth } from '@/server/firebase/admin';

export async function POST(req: NextRequest) {
  const acesso = await garantirAcessoSistema(req);
  if (acesso instanceof Response) return acesso;

  try {
    const body = await req.json();
    const {
      nomeEmpresa,
      cnpj,
      nomeResponsavel,
      emailResponsavel,
      whatsappResponsavel,
      planoNome,
      diasTrial = 14,
    } = body;

    if (!nomeEmpresa || !cnpj || !nomeResponsavel || !emailResponsavel) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION_ERROR', message: 'Campos obrigatórios: nomeEmpresa, cnpj, nomeResponsavel, emailResponsavel.' },
        { status: 400 }
      );
    }

    // 1. Criar empresa no PostgreSQL
    const empresa = await repositorioEmpresasPg.criar({
      nome: nomeEmpresa,
      cnpj,
      responsavelNome: nomeResponsavel,
      responsavelEmail: emailResponsavel,
      whatsappResponsavel,
      planoNome,
      diasTrial,
      status: diasTrial > 0 ? 'TRIAL_ATIVO' : 'ATIVO',
    });

    // 2. Criar usuário gestorCorporativo no Firebase Auth
    let uid: string;
    let linkPrimeiroAcesso: string | undefined;

    try {
      const userRecord = await adminAuth.createUser({
        email: emailResponsavel,
        displayName: nomeResponsavel,
      });
      uid = userRecord.uid;

      // 3. Criar perfil no PostgreSQL
      await repositorioUsuariosPg.criar({
        id: uid,
        email: emailResponsavel,
        nome: nomeResponsavel,
        papel: 'gestorCorporativo',
        empresaId: empresa.id,
        mustResetPassword: true,
      });

      // 4. Setar claims no Firebase para acelerar o próximo login
      await adminAuth.setCustomUserClaims(uid, {
        papel: 'gestorCorporativo',
        empresaId: empresa.id,
      });

      // 5. Gerar link de primeiro acesso
      try {
        const appUrl = process.env.APP_URL || 'http://localhost:9002';
        linkPrimeiroAcesso = await adminAuth.generatePasswordResetLink(emailResponsavel, {
          url: `${appUrl}/login`,
        });
      } catch (linkErr) {
        console.warn('[criar-empresa] Não foi possível gerar link de convite:', linkErr);
      }
    } catch (authErr: any) {
      // Rollback: apagar empresa criada
      console.error('[criar-empresa] Erro ao criar usuário Auth:', authErr);
      // Não excluímos a empresa por ora — sinalizar para o admin
      if (authErr.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { ok: false, code: 'EMAIL_JA_EXISTE', message: 'Já existe um usuário com este e-mail.' },
          { status: 409 }
        );
      }
      throw authErr;
    }

    return NextResponse.json({
      ok: true,
      data: {
        empresaId: empresa.id,
        usuarioId: uid,
        emailResponsavel,
        linkPrimeiroAcesso,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('[POST /api/sistema/empresas/criar] Erro:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno ao criar empresa.' },
      { status: 500 }
    );
  }
}
