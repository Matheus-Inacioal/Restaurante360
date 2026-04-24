/**
 * POST /api/sistema/empresas/criar
 *
 * Cria uma nova empresa e seu gestorCorporativo via criarEmpresaService.
 * Requer acesso saasAdmin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoSistema } from '@/server/auth/garantirAcessoSistema';
import { criarEmpresaService } from '@/server/services/criar-empresa-service';

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

    const resultado = await criarEmpresaService({
      nomeEmpresa,
      cnpj,
      nomeResponsavel,
      emailResponsavel,
      whatsappResponsavel,
      planoNome,
      diasTrial
    });

    if (!resultado.ok) {
      const status = resultado.code === 'CNPJ_JA_EXISTE' || resultado.code === 'EMAIL_JA_EXISTE' ? 409 : 500;
      return NextResponse.json({ ok: false, code: resultado.code, message: resultado.message }, { status });
    }

    return NextResponse.json({
      ok: true,
      data: {
        empresaId: resultado.empresaId,
        usuarioId: resultado.usuarioId,
        emailResponsavel: resultado.emailResponsavel,
        linkPrimeiroAcesso: resultado.linkPrimeiroAcesso,
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
