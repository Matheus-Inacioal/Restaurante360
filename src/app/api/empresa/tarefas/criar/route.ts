import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/server/firebase/admin';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';

const formSchema = z.object({
    title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
    description: z.string().optional(),
    assignedTo: z.string().min(1, 'Você deve selecionar um colaborador.'),
    shift: z.enum(['Manhã', 'Tarde', 'Noite']),
    dateStr: z.string(), // date string yyyy-MM-dd
    requiresPhoto: z.boolean(),
});

export async function POST(req: Request) {
    try {
        const authResult = await garantirAcessoEmpresa(req);
        if (authResult instanceof Response) return authResult;

        const body = await req.json();
        const parseResult = formSchema.safeParse(body);

        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const data = parseResult.data;
        const empresaId = authResult.sessao.empresaId!;
        const uid = authResult.sessao.uid;

        const collectionRef = adminDb.collection("empresas").doc(empresaId).collection("checklists");
        const docRef = collectionRef.doc();

        const singleTask = {
            id: adminDb.collection("empresas").doc().id, // Random id for the sub-task
            activityTemplateId: 'one-off',
            title: data.title,
            description: data.description || '',
            requiresPhoto: data.requiresPhoto,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const checklistData = {
            date: data.dateStr,
            shift: data.shift,
            assignedTo: data.assignedTo,
            processName: `Tarefa Pontual: ${data.title}`,
            status: 'open',
            tasks: [singleTask],
            createdBy: uid,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        await docRef.set(checklistData);

        const auditoriaRef = adminDb.collection("auditoria").doc();
        await auditoriaRef.set({
            empresaId: empresaId,
            entidade: "TAREFA_AVULSA",
            acao: "CRIAR",
            entidadeId: docRef.id,
            criadoPor: uid,
            detalhes: `Tarefa pontual '${data.title}' atribuída ao colaborador ${data.assignedTo}`,
            criadoEm: FieldValue.serverTimestamp()
        });

        return jsonOk({
            id: docRef.id,
            mensagem: `Tarefa pontual atribuída com sucesso.`
        }, 201);

    } catch (error: any) {
        console.error("[CRIAR_TAREFA_AVULSA] Erro:", error);
        return jsonErro("Falha interna ao criar tarefa pontual.", "INTERNAL_ERROR", 500);
    }
}
