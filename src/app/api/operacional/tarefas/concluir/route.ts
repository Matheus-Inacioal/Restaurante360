import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { obterSessao } from '@/server/auth/obterSessao';

const concluirTarefaSchema = z.object({
    checklistId: z.string().min(1, 'Checklist ID é obrigatório.'),
    taskId: z.string().min(1, 'Task ID é obrigatório.'),
    photoUrls: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
    try {
        const authResult = await obterSessao();
        if (!authResult) {
            return jsonErro("Não autorizado.", "UNAUTHORIZED", 401);
        }

        const body = await req.json();
        const parseResult = concluirTarefaSchema.safeParse(body);

        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const data = parseResult.data;
        const empresaId = authResult.empresaId;
        const uid = authResult.uid;

        if (!empresaId) {
            return jsonErro("Usuário sem empresa vinculada.", "FORBIDDEN", 403);
        }

        const checklist = await prisma.checklist.findFirst({
            where: {
                id: data.checklistId,
                empresaId: empresaId
            },
            include: { tarefas: true }
        });

        if (!checklist) {
            return jsonErro("Checklist não encontrado.", "NOT_FOUND", 404);
        }

        // Verifica permissão
        if (checklist.responsavelId !== uid && authResult.papel !== 'SISTEMA') {
            return jsonErro("Você não tem permissão para concluir tarefas deste checklist.", "FORBIDDEN", 403);
        }

        const tarefa = checklist.tarefas.find(t => t.id === data.taskId);
        if (!tarefa) {
            return jsonErro("Tarefa não encontrada no checklist.", "NOT_FOUND", 404);
        }

        const novaTarefa = await prisma.tarefaChecklist.update({
            where: { id: data.taskId },
            data: {
                status: "concluida",
                concluidaEm: new Date(),
                fotos: data.photoUrls || []
            }
        });

        const todasTarefasAgora = checklist.tarefas.map(t => t.id === data.taskId ? novaTarefa : t);
        const allTasksCompleted = todasTarefasAgora.every(t => t.status === "concluida");

        if (allTasksCompleted) {
            await prisma.$transaction([
                prisma.checklist.update({
                    where: { id: checklist.id },
                    data: { status: "concluida" }
                }),
                prisma.auditoria.create({
                    data: {
                        empresaId: empresaId,
                        usuarioId: uid,
                        acao: "CHECKLIST_CONCLUIR",
                        entidade: "checklist",
                        entidadeId: checklist.id,
                        detalhe: { nome: checklist.nome }
                    }
                })
            ]);
        }

        return jsonOk({
            mensagem: allTasksCompleted ? "Checklist finalizado! Parabéns!" : "Tarefa concluída!",
            allTasksCompleted
        });

    } catch (error: any) {
        console.error("[CONCLUIR_TAREFA_OPERACIONAL] Erro:", error);
        return jsonErro("Falha interna ao concluir tarefa.", "INTERNAL_ERROR", 500);
    }
}
