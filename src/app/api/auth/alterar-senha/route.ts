import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/server/firebase/admin';
import { obterSessao } from '@/server/auth/obterSessao';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';

const alterarSenhaSchema = z.object({
    novaSenha: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres")
});

export async function POST(req: Request) {
    try {
        const sessao = await obterSessao(req);

        if (!sessao) {
            return NextResponse.json({
                ok: false,
                code: "UNAUTHORIZED",
                message: "Não autorizado. Sessão inválida ou expirada."
            }, { status: 401, headers: { "Content-Type": "application/json" } });
        }

        const body = await req.json();
        const parseResult = alterarSenhaSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json({
                ok: false,
                code: "VALIDATION_ERROR",
                message: "Senha inválida.",
                issues: parseResult.error.flatten().fieldErrors
            }, { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const { novaSenha } = parseResult.data;

        // 1. Atualizar a senha no Firebase Auth
        await adminAuth.updateUser(sessao.uid, {
            password: novaSenha
        });

        // 2. Zerar a flag de obrigatoriedade no Firestore (Global Profile)
        await adminDb.collection("usuarios").doc(sessao.uid).update({
            mustResetPassword: false,
            atualizadoEm: FieldValue.serverTimestamp()
        });

        // 3. Opcional - Forçar auditoria dessa mudança (Apesar de não ser SaaS Admin Core)
        const auditoriaRef = adminDb.collection("auditoria").doc();
        await auditoriaRef.set({
            tipo: "USUARIO_REDEFINIU_SENHA_OBRIGATORIA",
            empresaId: sessao.empresaId || "N/A",
            usuarioAlvoUid: sessao.uid,
            executadoPorUid: sessao.uid,
            descricao: `O usuário redefiniu sua senha provisória durante o login.`,
            criadoEm: FieldValue.serverTimestamp()
        });

        return NextResponse.json({
            ok: true,
            message: "Senha atualizada com sucesso."
        }, { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (error: any) {
        console.error("[ALTERAR_SENHA_ROUTE] Erro interno:", error);

        return NextResponse.json({
            ok: false,
            code: "INTERNAL_ERROR",
            message: "Falha na solicitação. Tente novamente."
        }, { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
