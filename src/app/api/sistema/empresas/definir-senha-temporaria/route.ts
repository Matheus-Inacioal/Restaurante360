import { NextResponse } from 'next/server';
import { garantirAcessoSistema } from '@/server/auth/garantirAcessoSistema';
import { z } from 'zod';
import { definirSenhaTemporariaService } from '@/server/services/definir-senha-temporaria-service';

const senhaSchema = z.object({
    empresaId: z.string().min(1, "ID da empresa é obrigatório"),
    novaSenha: z.string().min(8, "A senha temporária deve ter no mínimo 8 caracteres"),
    forcarTrocaSenha: z.boolean().default(true)
});

export async function POST(req: Request) {
    try {
        const authResult = await garantirAcessoSistema(req);
        if (authResult instanceof Response) return authResult;

        const body = await req.json();

        const parseResult = senhaSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json({
                ok: false,
                code: "VALIDATION_ERROR",
                message: "Dados de payload inválidos.",
                issues: parseResult.error.flatten().fieldErrors
            }, { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const data = parseResult.data;

        // Repassar ao serviço, injetando o UID de quem praticou a ação
        const serviceResult = await definirSenhaTemporariaService({
            empresaId: data.empresaId,
            novaSenha: data.novaSenha,
            forcarTrocaSenha: data.forcarTrocaSenha,
            executadoPorUid: authResult.sessao.uid
        });

        if (!serviceResult.ok) {
            const statusCode = serviceResult.code === "NOT_FOUND" ? 404 : 500;
            return NextResponse.json({
                ok: false,
                code: serviceResult.code,
                message: serviceResult.message
            }, { status: statusCode, headers: { "Content-Type": "application/json" } });
        }

        return NextResponse.json({
            ok: true,
            message: serviceResult.message
        }, { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (error: any) {
        console.error("[CRIAR_SENHA_TEMPORARIA_ROUTE] Fatal Error:", error);

        return NextResponse.json({
            ok: false,
            code: "INTERNAL_ERROR",
            message: "Erro no processamento da solicitação.",
            details: process.env.NODE_ENV === "development" ? {
                name: error?.name,
                message: error?.message,
                stack: error?.stack
            } : undefined
        }, { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
