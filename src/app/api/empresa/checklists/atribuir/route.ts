import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { obterSessao } from '@/server/auth/obterSessao';

const atribuirChecklistSchema = z.object({
    processId: z.string().min(1),
    processName: z.string().min(1),
    assignedTo: z.string().min(1),
    shift: z.enum(['Manhã', 'Tarde', 'Noite']),
    dateStr: z.string().min(1), // format YYYY-MM-DD
    tasks: z.array(z.object({
        activityTemplateId: z.string().optional(),
        title: z.string(),
        description: z.string().optional(),
        requiresPhoto: z.boolean()
    })).min(1),
});

export async function POST(req: Request) {
    try {
        const authResult = await obterSessao();
        if (!authResult) {
            return jsonErro("Não autorizado.", "UNAUTHORIZED", 401);
        }

        const body = await req.json();
        const parseResult = atribuirChecklistSchema.safeParse(body);

        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const data = parseResult.data;
        const empresaId = authResult.empresaId;
        const uid = authResult.uid;

        if (!empresaId) {
            return jsonErro("Usuário sem empresa vinculada.", "FORBIDDEN", 403);
        }

        const dateObj = new Date(data.dateStr + "T00:00:00.000Z"); // Força meia noite UTC ou local

        const resultado = await prisma.$transaction(async (tx) => {
            const checklist = await tx.checklist.create({
                data: {
                    empresaId,
                    nome: data.processName,
                    processoId: data.processId,
                    responsavelId: data.assignedTo,
                    turno: data.shift,
                    data: dateObj,
                    status: 'pendente',
                    tarefas: {
                        create: data.tasks.map(t => ({
                            titulo: t.title,
                            descricao: t.description,
                            exigeFoto: t.requiresPhoto,
                            status: 'pendente'
                        }))
                    }
                }
            });

            await tx.auditoria.create({
                data: {
                    empresaId,
                    usuarioId: uid,
                    acao: "CHECKLIST_ATRIBUIR",
                    entidade: "checklist",
                    entidadeId: checklist.id,
                    detalhe: { nome: data.processName, responsavelId: data.assignedTo }
                }
            });

            return checklist;
        });

        return jsonOk({
            checklistId: resultado.id
        }, 201);

    } catch (error: any) {
        console.error("[ATRIBUIR_CHECKLIST_EMPRESA] Erro:", error);
        return jsonErro("Falha interna ao atribuir checklist.", "INTERNAL_ERROR", 500);
    }
}
