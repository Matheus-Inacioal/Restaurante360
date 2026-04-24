/**
 * GET /api/sistema/dashboard/resumo
 *
 * Retorna métricas agregadas do sistema para o dashboard do saasAdmin.
 * Migrado de Firestore Admin → PostgreSQL (Prisma)
 */
import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoSistema } from '@/server/auth/garantirAcessoSistema';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const acesso = await garantirAcessoSistema(req);
  if (acesso instanceof Response) return acesso;

  try {
    // Contagens paralelas para performance
    const [
      totalEmpresas,
      totalUsuariosSistema,
      empresasSuspensas,
    ] = await Promise.all([
      prisma.empresa.count(),
      prisma.usuario.count({ where: { papel: 'saasAdmin' } }),
      prisma.empresa.count({
        where: { status: { in: ['SUSPENSO', 'CANCELADO'] } },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        totalEmpresas,
        totalUsuariosSistema,
        totalAssinaturasAtivas: totalEmpresas, // simplificado — expandir depois
        pendencias: empresasSuspensas,
      },
    });
  } catch (error: any) {
    console.error('[GET /api/sistema/dashboard/resumo] Erro:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao buscar resumo do sistema.' },
      { status: 500 }
    );
  }
}
