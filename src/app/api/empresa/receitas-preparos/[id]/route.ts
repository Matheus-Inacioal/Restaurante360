import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        const receita = await prisma.receitaPreparo.findFirst({
            where: { id: params.id, empresaId: acesso.empresaId }
        });
        if (!receita) return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Receita não encontrada.' }, { status: 404 });
        return NextResponse.json({ ok: true, data: receita });
    } catch (error: any) {
        console.error('[GET /api/empresa/receitas-preparos/[id]] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao carregar receita.' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        const body = await req.json();
        const atualizada = await prisma.receitaPreparo.update({
            where: { id: params.id, empresaId: acesso.empresaId },
            data: body
        });
        return NextResponse.json({ ok: true, data: atualizada });
    } catch (error: any) {
        console.error('[PATCH /api/empresa/receitas-preparos/[id]] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao atualizar receita.' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        await prisma.receitaPreparo.delete({
            where: { id: params.id, empresaId: acesso.empresaId }
        });
        return NextResponse.json({ ok: true, data: { success: true } });
    } catch (error: any) {
        console.error('[DELETE /api/empresa/receitas-preparos/[id]] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao excluir receita.' }, { status: 500 });
    }
}
