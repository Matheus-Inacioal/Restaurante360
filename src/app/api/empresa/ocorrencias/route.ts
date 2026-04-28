import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        const ocorrencias = await prisma.ocorrenciaOperacional.findMany({
            where: { empresaId: acesso.empresaId },
            orderBy: { atualizadoEm: 'desc' }
        });
        return NextResponse.json({ ok: true, data: ocorrencias });
    } catch (error: any) {
        console.error('[GET /api/empresa/ocorrencias] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao listar ocorrências.' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    try {
        const body = await req.json();
        const nova = await prisma.ocorrenciaOperacional.create({
            data: {
                ...body,
                empresaId: acesso.empresaId,
                criadoPor: acesso.usuarioId
            }
        });
        return NextResponse.json({ ok: true, data: nova });
    } catch (error: any) {
        console.error('[POST /api/empresa/ocorrencias] Erro:', error);
        return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao criar ocorrência.' }, { status: 500 });
    }
}
