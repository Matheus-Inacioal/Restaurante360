import { NextResponse } from 'next/server';
import { adminDb } from '@/server/firebase/admin';
import { garantirAcessoSistema } from '@/server/auth/garantirAcessoSistema';
import { z } from 'zod';

const statusSchema = z.object({
    status: z.enum(["ATIVO", "SUSPENSO", "CANCELADO", "TRIAL_ATIVO"])
});

export async function PATCH(req: Request, { params }: { params: Promise<{ empresaId: string }> }) {
    try {
        const authResult = await garantirAcessoSistema(req);
        if (authResult instanceof Response) return authResult;

        const { empresaId } = await params;
        const body = await req.json();

        const parseResult = statusSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json({
                ok: false,
                code: "VALIDATION_ERROR",
                message: 'Status inválido.',
                issues: parseResult.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const empresaRef = adminDb.collection("empresas").doc(empresaId);
        const docSnap = await empresaRef.get();
        if (!docSnap.exists) {
            return NextResponse.json({ ok: false, code: "NOT_FOUND", message: "Empresa não encontrada" }, { status: 404 });
        }

        // Se estiver alterando para CANCELADO, podemos querer suspender a assinatura etc.
        // Aqui atualizaremos os logs e a entidade mestre
        const batch = adminDb.batch();
        batch.update(empresaRef, {
            status: parseResult.data.status,
            atualizadoEm: new Date()
        });

        const auditoriaRef = adminDb.collection("auditoria").doc();
        batch.set(auditoriaRef, {
            empresaId: empresaId,
            entidade: "EMPRESA",
            entidadeId: empresaId,
            acao: `STATUS_ALTERADO_PARA_${parseResult.data.status}`,
            criadoPor: authResult.sessao.uid,
            criadoEm: new Date()
        });

        await batch.commit();

        return NextResponse.json({ ok: true, data: { status: parseResult.data.status } }, { status: 200 });

    } catch (error: any) {
        console.error("[PATCH_EMPRESA_STATUS] Erro:", error);
        return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", message: "Erro interno ao alterar status." }, { status: 500 });
    }
}
