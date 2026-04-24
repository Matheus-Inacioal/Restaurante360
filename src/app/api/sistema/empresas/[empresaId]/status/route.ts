import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { garantirAcessoSistema } from '@/server/auth/garantirAcessoSistema';
import { registrarAuditoria } from '@/server/servicos/servico-auditoria';
import { z } from 'zod';

const statusSchema = z.object({
    status: z.enum(["ATIVO", "SUSPENSO", "CANCELADO", "TRIAL_ATIVO", "GRACE"])
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

        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaId }
        });

        if (!empresa) {
            return NextResponse.json({ ok: false, code: "NOT_FOUND", message: "Empresa não encontrada" }, { status: 404 });
        }

        await prisma.empresa.update({
            where: { id: empresaId },
            data: {
                status: parseResult.data.status,
            }
        });

        await registrarAuditoria({
            empresaId: empresaId,
            entidade: "empresa",
            entidadeId: empresaId,
            acao: "empresa.status.alterado",
            usuarioId: authResult.sessao.uid,
            detalhe: { novoStatus: parseResult.data.status },
        }).catch(() => null);

        return NextResponse.json({ ok: true, data: { status: parseResult.data.status } }, { status: 200 });

    } catch (error: any) {
        console.error("[PATCH_EMPRESA_STATUS] Erro:", error);
        return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", message: "Erro interno ao alterar status." }, { status: 500 });
    }
}
