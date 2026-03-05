import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/server/firebase/admin';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoSistema } from '@/server/auth/garantirAcessoSistema';

const planoSchema = z.object({
    nome: z.string().trim().min(2, "Nome é obrigatório").max(80),
    descricao: z.string().trim().max(255).optional(),
    precoMensal: z.number().int().min(0, "Preço inválido (centavos)"),
    maxUsuarios: z.number().int().min(1, "Máximo de usuários mínimo é 1").default(10),
    ativo: z.boolean().default(true),
});

export async function POST(req: Request) {
    try {
        const authResult = await garantirAcessoSistema(req);
        if (authResult instanceof Response) return authResult;

        const body = await req.json();

        const parseResult = planoSchema.safeParse(body);
        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const data = parseResult.data;

        if (typeof adminDb.collection !== 'function') {
            return jsonErro("Admin DB indisponível no ambiente abstrato.", "FIREBASE_ADMIN_ERROR", 500);
        }

        const planoRef = adminDb.collection("planos").doc();

        await planoRef.set({
            nome: data.nome,
            descricao: data.descricao || "",
            precoMensal: data.precoMensal,
            maxUsuarios: data.maxUsuarios,
            ativo: data.ativo,
            criadoEm: FieldValue.serverTimestamp(),
            atualizadoEm: FieldValue.serverTimestamp()
        });

        const auditoriaRef = adminDb.collection("auditoria").doc();
        await auditoriaRef.set({
            entidade: "PLANO",
            acao: "CRIAR",
            entidadeId: planoRef.id,
            criadoPor: authResult.sessao.uid,
            detalhes: `Plano ${data.nome} criado com preço ${data.precoMensal}`,
            criadoEm: FieldValue.serverTimestamp()
        });

        return jsonOk({
            id: planoRef.id,
            nome: data.nome
        }, 201);

    } catch (error: any) {
        console.error("[CRIAR_PLANO] Erro:", error);
        return jsonErro("Falha interna ao criar plano.", "INTERNAL_ERROR", 500);
    }
}
