/**
 * POST /api/empresa/usuarios/criar
 *
 * Cria um novo usuário operacional ou gestorLocal vinculado à empresa.
 * Requer: gestorCorporativo ou gestorLocal (com restrição de papel)
 */
import { NextRequest, NextResponse } from 'next/server';
import { obterSessao } from '@/server/auth/obterSessao';
import { prisma } from '@/lib/prisma';
import type { PapelUsuario } from '@/lib/tipos/identidade';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Papéis que podem ser criados por cada gestor
const PAPEIS_CRIATIVEIS_POR_GESTOR_CORPORATIVO: PapelUsuario[] = [
  'gestorLocal',
  'operacional',
];
const PAPEIS_CRIATIVEIS_POR_GESTOR_LOCAL: PapelUsuario[] = ['operacional'];

export async function POST(req: NextRequest) {
  const authResult = await obterSessao();
  if (!authResult) {
    return NextResponse.json(
      { ok: false, code: 'UNAUTHORIZED', message: 'Não autorizado.' },
      { status: 401 }
    );
  }

  const papel = authResult.papel;
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

    const unidadeIdFinal =
      papel === 'gestorLocal'
        ? authResult.unidadeId
        : unidadeId;

    // Verificar se o email já existe
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
        return NextResponse.json(
          { ok: false, code: 'EMAIL_JA_EXISTE', message: 'Já existe um usuário com este e-mail.' },
          { status: 409 }
        );
    }

    const senhaTemporaria = crypto.randomBytes(8).toString('hex');
    const hash = await bcrypt.hash(senhaTemporaria, 10);

    const usuario = await prisma.usuario.create({
        data: {
            id: crypto.randomUUID(),
            email,
            nome,
            papel: papelNovo,
            empresaId: authResult.empresaId!,
            unidadeId: unidadeIdFinal,
            senhaHash: hash,
            status: "ativo"
        }
    });

    const token = crypto.randomUUID();
    await prisma.tokenResetSenha.create({
        data: {
            id: token,
            usuarioId: usuario.id,
            expiraEm: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
        }
    });

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const linkPrimeiroAcesso = `${appUrl}/login/redefinir-senha?token=${token}`;

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
