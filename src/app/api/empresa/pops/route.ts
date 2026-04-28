import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        const pops = await prisma.popOperacional.findMany({
            where: { empresaId: acesso.empresaId },
            orderBy: { atualizadoEm: 'desc' }
        });
        return NextResponse.json({ ok: true, data: pops });
    } catch (error: any) {
        console.error('[GET /api/empresa/pops] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao listar POPs.' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        const body = await req.json();
        const novo = await prisma.popOperacional.create({
            data: {
                ...body,
                empresaId: acesso.empresaId,
                criadoPor: acesso.usuarioId
            }
        });
        return NextResponse.json({ ok: true, data: novo });
    } catch (error: any) {
        console.error('[POST /api/empresa/pops] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao criar POP.' }, { status: 500 });
    }
}
