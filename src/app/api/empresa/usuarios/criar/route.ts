import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/server/firebase/admin';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';

const usuarioEmpresaSchema = z.object({
    nome: z.string().trim().min(3, "O nome deve ter pelo menos 3 caracteres.").max(80),
    email: z.string().trim().toLowerCase().email("Por favor, insira um email válido."),
    papel: z.enum(['gestor', 'bar', 'pia', 'cozinha', 'producao', 'garcon']),
});

export async function POST(req: Request) {
    try {
        const authResult = await garantirAcessoEmpresa(req);
        if (authResult instanceof Response) return authResult;

        const body = await req.json();

        const parseResult = usuarioEmpresaSchema.safeParse(body);
        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const data = parseResult.data;
        const empresaId = authResult.sessao.empresaId!;

        if (typeof adminDb.collection !== 'function') {
            return jsonErro("Admin DB indisponível no ambiente abstrato.", "FIREBASE_ADMIN_ERROR", 500);
        }

        // Tenta criar o usuário no auth global
        const emailLimpo = data.email;
        const senhaGerada = Math.random().toString(36).slice(-8) + "A1@";

        let uid = "";
        let isNewUser = false;

        try {
            const userRecord = await adminAuth.createUser({
                email: emailLimpo,
                password: senhaGerada,
                displayName: data.nome,
            });
            uid = userRecord.uid;
            isNewUser = true;
        } catch (authError: any) {
            if (authError.code === "auth/email-already-exists") {
                // Se já existe, pega o UID desse usuário
                const existingUser = await adminAuth.getUserByEmail(emailLimpo);
                uid = existingUser.uid;
                isNewUser = false;
            } else {
                throw authError;
            }
        }

        const batch = adminDb.batch();

        if (isNewUser) {
            // Se for novo perfil, cria um registro em /usuarios
            const usuarioGlobalRef = adminDb.collection("usuarios").doc(uid);
            batch.set(usuarioGlobalRef, {
                uid: uid,
                email: emailLimpo,
                nome: data.nome,
                papelPortal: "OPERACIONAL",
                empresaId: empresaId,
                ativo: true,
                criadoEm: FieldValue.serverTimestamp(),
                atualizadoEm: FieldValue.serverTimestamp()
            });
        }

        // Criar registro na /empresas/{id}/usuarios (Tenant isolation)
        const usuarioTenantRef = adminDb
            .collection("empresas")
            .doc(empresaId)
            .collection("usuarios")
            .doc(uid);

        const tenantDoc = await usuarioTenantRef.get();
        if (tenantDoc.exists) {
            return jsonErro("Usuário já faz parte da sua equipe.", "USUARIO_EXISTENTE", 400);
        }

        batch.set(usuarioTenantRef, {
            uid: uid,
            nome: data.nome,
            email: emailLimpo,
            papel: data.papel,
            ativo: true,
            criadoEm: FieldValue.serverTimestamp()
        });

        // Registrar auditoria
        const auditoriaRef = adminDb.collection("auditoria").doc();
        batch.set(auditoriaRef, {
            empresaId: empresaId,
            entidade: "USUARIO_EMPRESA",
            acao: "CRIAR",
            entidadeId: uid,
            criadoPor: authResult.sessao.uid,
            detalhes: `Usuário '${data.nome}' adicionado à equipe como '${data.papel}'`,
            criadoEm: FieldValue.serverTimestamp()
        });

        await batch.commit();

        // TODO: Enviar email convidando com `senhaGerada` (para `isNewUser = true`)

        return jsonOk({
            uid,
            isNewUser
        }, 201);

    } catch (error: any) {
        console.error("[CRIAR_USUARIO_EMPRESA] Erro:", error);
        return jsonErro("Falha interna ao criar usuário da empresa.", "INTERNAL_ERROR", 500);
    }
}
