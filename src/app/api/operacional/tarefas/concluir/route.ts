import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/server/firebase/admin';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';

const concluirTarefaSchema = z.object({
    checklistId: z.string().min(1, 'Checklist ID é obrigatório.'),
    taskId: z.string().min(1, 'Task ID é obrigatório.'),
    photoUrls: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
    try {
        const authResult = await garantirAcessoEmpresa(req);
        if (authResult instanceof Response) return authResult;

        const body = await req.json();
        const parseResult = concluirTarefaSchema.safeParse(body);

        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const data = parseResult.data;
        const empresaId = authResult.sessao.empresaId!;
        const uid = authResult.sessao.uid;

        const checklistRef = adminDb
            .collection("empresas")
            .doc(empresaId)
            .collection("checklists")
            .doc(data.checklistId);

        const checklistDoc = await checklistRef.get();

        if (!checklistDoc.exists) {
            return jsonErro("Checklist não encontrado.", "NOT_FOUND", 404);
        }

        const checklistData = checklistDoc.data()!;

        // Verifica se o usuário logado é o atribuído (opcional, mas recomendado)
        if (checklistData.assignedTo !== uid && authResult.sessao.papelPortal !== 'SISTEMA') {
            return jsonErro("Você não tem permissão para concluir tarefas deste checklist.", "FORBIDDEN", 403);
        }

        const tasks = checklistData.tasks || [];
        let taskEncontrada = false;

        const updatedTasks = tasks.map((t: any) => {
            if (t.id === data.taskId) {
                taskEncontrada = true;
                return {
                    ...t,
                    status: 'done',
                    completedAt: new Date().toISOString(),
                    completedBy: uid,
                    photoUrls: data.photoUrls || [],
                };
            }
            return t;
        });

        if (!taskEncontrada) {
            return jsonErro("Tarefa não encontrada no checklist.", "NOT_FOUND", 404);
        }

        const allTasksCompleted = updatedTasks.every((t: any) => t.status === 'done');
        let newStatus = checklistData.status;

        if (allTasksCompleted) {
            newStatus = 'completed';
        } else if (updatedTasks.some((t: any) => t.status === 'done')) {
            newStatus = 'in_progress';
        }

        await checklistRef.update({
            tasks: updatedTasks,
            status: newStatus,
            updatedAt: FieldValue.serverTimestamp()
        });

        // Registrar auditoria se finalizou tudo
        if (allTasksCompleted && checklistData.status !== 'completed') {
            const auditoriaRef = adminDb.collection("auditoria").doc();
            await auditoriaRef.set({
                empresaId: empresaId,
                entidade: "CHECKLIST",
                acao: "CONCLUIR",
                entidadeId: checklistRef.id,
                criadoPor: uid,
                detalhes: `Checklist '${checklistData.processName}' finalizado por completo.`,
                criadoEm: FieldValue.serverTimestamp()
            });
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
