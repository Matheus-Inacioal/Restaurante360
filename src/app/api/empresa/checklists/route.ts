import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        const checklists = await prisma.checklistOperacional.findMany({
            where: { empresaId: acesso.empresaId },
            orderBy: { atualizadoEm: 'desc' }
        });
        return NextResponse.json({ ok: true, data: checklists });
    } catch (error: any) {
        console.error('[GET /api/empresa/checklists] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao listar checklists.' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        const body = await req.json();
        const novo = await prisma.checklistOperacional.create({
            data: {
                ...body,
                empresaId: acesso.empresaId,
                criadoPor: acesso.usuarioId
            }
        });
        return NextResponse.json({ ok: true, data: novo });
    } catch (error: any) {
        console.error('[POST /api/empresa/checklists] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao criar checklist.' }, { status: 500 });
    }
}
