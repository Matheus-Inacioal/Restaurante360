import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        const checklist = await prisma.checklistOperacional.findFirst({
            where: { id: params.id, empresaId: acesso.empresaId }
        });
        if (!checklist) return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Checklist não encontrado.' }, { status: 404 });
        return NextResponse.json({ ok: true, data: checklist });
    } catch (error: any) {
        console.error('[GET /api/empresa/checklists/[id]] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao carregar checklist.' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        const body = await req.json();
        const atualizado = await prisma.checklistOperacional.update({
            where: { id: params.id, empresaId: acesso.empresaId },
            data: body
        });
        return NextResponse.json({ ok: true, data: atualizado });
    } catch (error: any) {
        console.error('[PATCH /api/empresa/checklists/[id]] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao atualizar checklist.' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        await prisma.checklistOperacional.delete({
            where: { id: params.id, empresaId: acesso.empresaId }
        });
        return NextResponse.json({ ok: true, data: { success: true } });
    } catch (error: any) {
        console.error('[DELETE /api/empresa/checklists/[id]] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao excluir checklist.' }, { status: 500 });
    }
}
