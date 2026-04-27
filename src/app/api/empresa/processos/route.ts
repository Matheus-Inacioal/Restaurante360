import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obterSessao } from '@/server/auth/obterSessao';

export async function GET(request: NextRequest) {
    try {
        const auth = await obterSessao();
        if (!auth) {
            return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
        }

        const empresaId = auth.empresaId;
        if (!empresaId) {
            return NextResponse.json({ erro: 'Usuário sem empresa vinculada' }, { status: 403 });
        }

        const processos = await prisma.processo.findMany({
            where: { empresaId },
            orderBy: { criadoEm: 'desc' }
        });

        // Adaptação para o formato antigo: activityIds é agora os passos do processo
        const processosAdaptados = processos.map(p => {
            const passosJson = p.passos as any[];
            return {
                id: p.id,
                name: p.titulo,
                description: p.descricao,
                categoryId: p.categoriaId,
                isActive: p.ativo,
                activityIds: passosJson ? passosJson.map(pas => pas.id) : []
            };
        });

        return NextResponse.json({ sucesso: true, processos: processosAdaptados });
    } catch (error: any) {
        return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
    }
}
