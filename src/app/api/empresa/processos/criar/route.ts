import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/server/firebase/admin';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';

const taskSchemaInput = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    requiresPhoto: z.boolean(),
});

const processoEmpresaSchema = z.object({
    name: z.string().trim().min(3, "O nome da rotina/processo deve ter pelo menos 3 caracteres."),
    categoryId: z.string().min(1, 'Selecione uma categoria.'),
    description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
    tasks: z.array(taskSchemaInput).min(1, "É preciso enviar as tarefas."),
});

export async function POST(req: Request) {
    try {
        const authResult = await garantirAcessoEmpresa(req);
        if (authResult instanceof Response) return authResult;

        const body = await req.json();
        const parseResult = processoEmpresaSchema.safeParse(body);

        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const data = parseResult.data;
        const empresaId = authResult.sessao.empresaId!;
        const uid = authResult.sessao.uid;

        if (typeof adminDb.collection !== 'function') {
            return jsonErro("Admin DB indisponível no ambiente abstrato.", "FIREBASE_ADMIN_ERROR", 500);
        }

        const batch = adminDb.batch();

        // Criar as tasks associadas (ActivityTemplates) no escopo da empresa
        const activityIds: string[] = [];
        const createdActivities: any[] = [];

        for (const task of data.tasks) {
            const activityRef = adminDb.collection("empresas").doc(empresaId).collection("activityTemplates").doc();

            const newActivity = {
                title: task.title,
                description: task.description || '',
                category: 'Outro',
                frequency: 'on-demand',
                isRecurring: true,
                requiresPhoto: task.requiresPhoto,
                status: 'active',
                createdBy: uid,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            };

            batch.set(activityRef, newActivity);
            activityIds.push(activityRef.id);
            createdActivities.push({ ...newActivity, id: activityRef.id });
        }

        // Criar o processo
        const processRef = adminDb.collection("empresas").doc(empresaId).collection("processes").doc();

        batch.set(processRef, {
            name: data.name,
            categoryId: data.categoryId,
            description: data.description,
            activityIds,
            isActive: true,
            createdBy: uid,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        const auditoriaRef = adminDb.collection("auditoria").doc();
        batch.set(auditoriaRef, {
            empresaId: empresaId,
            entidade: "PROCESSO_ROTINA",
            acao: "CRIAR",
            entidadeId: processRef.id,
            criadoPor: uid,
            detalhes: `Rotina/Processo '${data.name}' criado com ${data.tasks.length} tarefas.`,
            criadoEm: FieldValue.serverTimestamp()
        });

        await batch.commit();

        return jsonOk({
            processId: processRef.id,
            name: data.name,
            categoryId: data.categoryId,
            description: data.description,
            activityIds,
            createdActivities
        }, 201);

    } catch (error: any) {
        console.error("[CRIAR_PROCESSO_EMPRESA] Erro:", error);
        return jsonErro("Falha interna ao criar rotina.", "INTERNAL_ERROR", 500);
    }
}
