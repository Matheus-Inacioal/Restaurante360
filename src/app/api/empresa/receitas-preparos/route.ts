import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        const receitas = await prisma.receitaPreparo.findMany({
            where: { empresaId: acesso.empresaId },
            orderBy: { atualizadoEm: 'desc' }
        });
        return NextResponse.json({ ok: true, data: receitas });
    } catch (error: any) {
        console.error('[GET /api/empresa/receitas-preparos] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao listar receitas.' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        const body = await req.json();
        const nova = await prisma.receitaPreparo.create({
            data: {
                ...body,
                empresaId: acesso.empresaId,
                criadoPor: acesso.usuarioId
            }
        });
        return NextResponse.json({ ok: true, data: nova });
    } catch (error: any) {
        console.error('[POST /api/empresa/receitas-preparos] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao criar receita.' }, { status: 500 });
    }
}
