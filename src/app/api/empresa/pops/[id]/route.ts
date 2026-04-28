import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        const pop = await prisma.popOperacional.findFirst({
            where: { id: params.id, empresaId: acesso.empresaId }
        });
        if (!pop) return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'POP não encontrado.' }, { status: 404 });
        return NextResponse.json({ ok: true, data: pop });
    } catch (error: any) {
        console.error('[GET /api/empresa/pops/[id]] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao carregar POP.' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        const body = await req.json();
        const atualizado = await prisma.popOperacional.update({
            where: { id: params.id, empresaId: acesso.empresaId },
            data: body
        });
        return NextResponse.json({ ok: true, data: atualizado });
    } catch (error: any) {
        console.error('[PATCH /api/empresa/pops/[id]] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao atualizar POP.' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        await prisma.popOperacional.delete({
            where: { id: params.id, empresaId: acesso.empresaId }
        });
        return NextResponse.json({ ok: true, data: { success: true } });
    } catch (error: any) {
        console.error('[DELETE /api/empresa/pops/[id]] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao excluir POP.' }, { status: 500 });
    }
}
