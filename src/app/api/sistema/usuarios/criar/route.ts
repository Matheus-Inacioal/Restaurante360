import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/server/firebase/admin';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoSistema } from '@/server/auth/garantirAcessoSistema';

const usuarioSistemaSchema = z.object({
    nome: z.string().trim().min(2, "Nome é obrigatório").max(80),
    email: z.string().trim().toLowerCase().email("Email inválido"),
    papel: z.enum(["SUPERADMIN", "SUPORTE_N1", "SUPORTE_N2"], {
        errorMap: () => ({ message: "Papel inválido escolhido." })
    })
});

export async function POST(req: Request) {
    try {
        const authResult = await garantirAcessoSistema(req);
        if (authResult instanceof Response) return authResult;

        const body = await req.json();

        const parseResult = usuarioSistemaSchema.safeParse(body);
        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const data = parseResult.data;

        if (typeof adminDb.collection !== 'function') {
            return jsonErro("Admin DB indisponível no ambiente de Vercel/Node.", "FIREBASE_ADMIN_ERROR", 500);
        }

        const emailLimpo = data.email;

        // Criar usuário no Firebase Auth
        const senhaGerada = Math.random().toString(36).slice(-10) + "S@";
        let userRecord;
        try {
            userRecord = await adminAuth.createUser({
                email: emailLimpo,
                password: senhaGerada,
                displayName: data.nome,
            });
        } catch (authError: any) {
            if (authError.code === "auth/email-already-exists") {
                return jsonErro("Este e-mail já está em uso.", "EMAIL_JA_EXISTE", 400);
            }
            throw authError;
        }

        const uid = userRecord.uid;

        // Criar perfil global como SISTEMA
        const usuarioGlobalRef = adminDb.collection("usuarios").doc(uid);
        await usuarioGlobalRef.set({
            uid: uid,
            email: emailLimpo,
            nome: data.nome,
            papelPortal: "SISTEMA", // Importante para o root acesso
            papelSistema: data.papel,
            empresaId: null, // Usuários de sistema normalmente não têm tenant
            ativo: true,
            criadoEm: new Date(),
            atualizadoEm: new Date()
        });

        // Registrar auditoria
        const auditoriaRef = adminDb.collection("auditoria").doc();
        await auditoriaRef.set({
            entidade: "USUARIO_SISTEMA",
            acao: "CRIAR",
            entidadeId: uid,
            criadoPor: authResult.sessao.uid,
            detalhes: `Usuário ${data.nome} criado com papel ${data.papel}`,
            criadoEm: new Date()
        });

        // Aqui dispararíamos o envio de e-mail com a senha
        // const origin = req.headers.get("origin") ?? new URL(req.url).origin;
        // fetch(`${origin}/api/mensagens/email/boas-vindas-sistema` ...

        return jsonOk({
            uid,
            emailCriado: emailLimpo,
            senhaGerada
        }, 201);

    } catch (error: any) {
        console.error("[CRIAR_USUARIO_SISTEMA] Erro fatal:", error);
        return jsonErro("Falha interna ao criar usuário do sistema.", "INTERNAL_ERROR", 500);
    }
}
