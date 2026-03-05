import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/server/firebase/admin';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';

const atribuirChecklistSchema = z.object({
    processId: z.string().min(1),
    processName: z.string().min(1),
    assignedTo: z.string().min(1),
    shift: z.enum(['Manhã', 'Tarde', 'Noite']),
    dateStr: z.string().min(1), // format YYYY-MM-DD
    tasks: z.array(z.object({
        activityTemplateId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        requiresPhoto: z.boolean()
    })).min(1),
});

export async function POST(req: Request) {
    try {
        const authResult = await garantirAcessoEmpresa(req);
        if (authResult instanceof Response) return authResult;

        const body = await req.json();
        const parseResult = atribuirChecklistSchema.safeParse(body);

        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const data = parseResult.data;
        const empresaId = authResult.sessao.empresaId!;
        const uid = authResult.sessao.uid;

        // Criar o checklist associado à empresa
        const checklistRef = adminDb.collection("empresas").doc(empresaId).collection("checklists").doc();

        const tasksComId = data.tasks.map(t => ({
            id: adminDb.collection("empresas").doc(empresaId).collection("checklists").doc().id, // gera um id falso
            activityTemplateId: t.activityTemplateId,
            title: t.title,
            description: t.description || '',
            requiresPhoto: t.requiresPhoto,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }));

        await checklistRef.set({
            date: data.dateStr,
            shift: data.shift,
            assignedTo: data.assignedTo,
            processName: data.processName,
            processId: data.processId,
            status: 'open',
            tasks: tasksComId,
            createdBy: uid,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        // Registrar auditoria
        const auditoriaRef = adminDb.collection("auditoria").doc();
        await auditoriaRef.set({
            empresaId: empresaId,
            entidade: "CHECKLIST",
            acao: "ATRIBUIR",
            entidadeId: checklistRef.id,
            criadoPor: uid,
            detalhes: `Rotina '${data.processName}' atribuída ao colaborador ${data.assignedTo}`,
            criadoEm: FieldValue.serverTimestamp()
        });

        return jsonOk({
            checklistId: checklistRef.id
        }, 201);

    } catch (error: any) {
        console.error("[ATRIBUIR_CHECKLIST_EMPRESA] Erro:", error);
        return jsonErro("Falha interna ao atribuir checklist.", "INTERNAL_ERROR", 500);
    }
}
