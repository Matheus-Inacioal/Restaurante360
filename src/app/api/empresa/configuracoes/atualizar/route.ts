import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/server/firebase/admin';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';

const perfilSchema = z.object({
    nome: z.string().trim().min(2, "Nome é obrigatório").max(80),
});

export async function PUT(req: Request) {
    try {
        const authResult = await garantirAcessoEmpresa(req);
        if (authResult instanceof Response) return authResult;

        const body = await req.json();

        const parseResult = perfilSchema.safeParse(body);
        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const data = parseResult.data;
        const uid = authResult.sessao.uid;

        if (typeof adminDb.collection !== 'function') {
            return jsonErro("Admin DB indisponível no ambiente abstrato.", "FIREBASE_ADMIN_ERROR", 500);
        }

        // Atualiza perfil global
        const usuarioGlobalRef = adminDb.collection("usuarios").doc(uid);
        await usuarioGlobalRef.update({
            nome: data.nome,
            atualizadoEm: FieldValue.serverTimestamp()
        });

        // Se houver empresaId vinculada, atualiza no tenant também
        const empresaId = authResult.sessao.empresaId;
        if (empresaId) {
            const usuarioTenantRef = adminDb
                .collection("empresas")
                .doc(empresaId)
                .collection("usuarios")
                .doc(uid);

            // Como pode não existir se foi criado por outro fluxo, fazemos um set merge
            await usuarioTenantRef.set({
                nome: data.nome,
                atualizadoEm: FieldValue.serverTimestamp()
            }, { merge: true });

            const auditoriaRef = adminDb.collection("auditoria").doc();
            await auditoriaRef.set({
                empresaId: empresaId,
                entidade: "PERFIL_USUARIO",
                acao: "ATUALIZAR",
                entidadeId: uid,
                criadoPor: uid,
                detalhes: `Usuário atualizou o próprio perfil`,
                criadoEm: FieldValue.serverTimestamp()
            });
        }

        return jsonOk({
            mensagem: "Perfil atualizado com sucesso."
        });

    } catch (error: any) {
        console.error("[ATUALIZAR_PERFIL] Erro:", error);
        return jsonErro("Falha interna ao atualizar perfil.", "INTERNAL_ERROR", 500);
    }
}
