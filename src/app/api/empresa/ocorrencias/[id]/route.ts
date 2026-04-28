import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        const ocorrencia = await prisma.ocorrenciaOperacional.findFirst({
            where: { id: params.id, empresaId: acesso.empresaId }
        });
        if (!ocorrencia) return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Ocorrência não encontrada.' }, { status: 404 });
        return NextResponse.json({ ok: true, data: ocorrencia });
    } catch (error: any) {
        console.error('[GET /api/empresa/ocorrencias/[id]] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao carregar ocorrência.' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        const body = await req.json();
        const atualizada = await prisma.ocorrenciaOperacional.update({
            where: { id: params.id, empresaId: acesso.empresaId },
            data: body
        });
        return NextResponse.json({ ok: true, data: atualizada });
    } catch (error: any) {
        console.error('[PATCH /api/empresa/ocorrencias/[id]] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao atualizar ocorrência.' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        await prisma.ocorrenciaOperacional.delete({
            where: { id: params.id, empresaId: acesso.empresaId }
        });
        return NextResponse.json({ ok: true, data: { success: true } });
    } catch (error: any) {
        console.error('[DELETE /api/empresa/ocorrencias/[id]] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao excluir ocorrência.' }, { status: 500 });
    }
}
