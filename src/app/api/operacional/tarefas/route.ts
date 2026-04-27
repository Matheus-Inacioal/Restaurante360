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
        const uid = auth.uid;

        if (!empresaId) {
            return NextResponse.json({ erro: 'Usuário sem empresa vinculada' }, { status: 403 });
        }

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        // Busca checklists atribuídos ao usuário logado na data de hoje
        const checklists = await prisma.checklist.findMany({
            where: {
                empresaId,
                responsavelId: uid,
                data: {
                    gte: hoje,
                    lt: amanha
                }
            },
            include: {
                tarefas: true
            }
        });

        // Adapta para o formato esperado pelo frontend
        const checklistsAdaptados = checklists.map(c => ({
            id: c.id,
            processId: c.processoId,
            processName: c.nome,
            assignedTo: c.responsavelId,
            shift: c.turno,
            date: c.data.toISOString().split('T')[0],
            status: 'active', // mock
            tasks: c.tarefas.map(t => ({
                id: t.id,
                title: t.titulo,
                description: t.descricao,
                requiresPhoto: t.exigeFoto,
                status: t.status === "concluida" ? "done" : "pending",
                completedAt: t.concluidaEm ? t.concluidaEm.toISOString() : null,
                photoUrls: t.fotos || []
            }))
        }));

        return NextResponse.json({ sucesso: true, checklists: checklistsAdaptados });
    } catch (error: any) {
        return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
    }
}
