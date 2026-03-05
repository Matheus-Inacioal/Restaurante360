import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/server/firebase/admin';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';

const formSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
    description: z.string().optional(),
    category: z.enum(['Higiene', 'Cozinha', 'Atendimento', 'Segurança', 'Outro']),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'on-demand']),
    assignedRole: z.enum(['manager', 'collaborator', 'gestor', 'bar', 'pia', 'cozinha', 'producao', 'garcon']).optional(),
    requiresPhoto: z.boolean(),
    status: z.enum(['active', 'inactive']),
});

export async function POST(req: Request) {
    return handleSalvar(req, false);
}

export async function PUT(req: Request) {
    return handleSalvar(req, true);
}

async function handleSalvar(req: Request, isUpdate: boolean) {
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

        const collectionRef = adminDb.collection("empresas").doc(empresaId).collection("activityTemplates");

        let docId = data.id;

        if (isUpdate && !docId) {
            return jsonErro("ID é obrigatório para atualização.", "VALIDATION_ERROR", 400);
        }

        const payload = {
            title: data.title,
            description: data.description || '',
            category: data.category,
            frequency: data.frequency,
            assignedRole: data.assignedRole || null,
            requiresPhoto: data.requiresPhoto,
            status: data.status,
            updatedAt: FieldValue.serverTimestamp(),
        } as any;

        if (isUpdate) {
            const docRef = collectionRef.doc(docId!);
            await docRef.update(payload);
        } else {
            payload.createdBy = uid;
            payload.createdAt = FieldValue.serverTimestamp();
            const result = await collectionRef.add(payload);
            docId = result.id;
        }

        const auditoriaRef = adminDb.collection("auditoria").doc();
        await auditoriaRef.set({
            empresaId: empresaId,
            entidade: "MODELO_TAREFA",
            acao: isUpdate ? "ATUALIZAR" : "CRIAR",
            entidadeId: docId,
            criadoPor: uid,
            detalhes: `Modelo/Rotina '${data.title}' ${isUpdate ? 'atualizado' : 'criado'}`,
            criadoEm: FieldValue.serverTimestamp()
        });

        return jsonOk({
            id: docId,
            mensagem: `Tarefa ${isUpdate ? 'atualizada' : 'criada'} com sucesso.`
        }, isUpdate ? 200 : 201);

    } catch (error: any) {
        console.error("[SALVAR_ATIVIDADE] Erro:", error);
        return jsonErro("Falha interna ao salvar tarefa.", "INTERNAL_ERROR", 500);
    }
}
