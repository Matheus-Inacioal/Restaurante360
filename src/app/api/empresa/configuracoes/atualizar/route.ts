import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { obterSessao } from '@/server/auth/obterSessao';

const perfilSchema = z.object({
    nome: z.string().trim().min(2, "Nome é obrigatório").max(80),
});

export async function PUT(req: Request) {
    try {
        const authResult = await obterSessao();
        if (!authResult) {
            return jsonErro("Não autorizado.", "UNAUTHORIZED", 401);
        }

        const body = await req.json();

        const parseResult = perfilSchema.safeParse(body);
        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const data = parseResult.data;
        const uid = authResult.uid;
        const empresaId = authResult.empresaId;

        await prisma.$transaction(async (tx) => {
            await tx.usuario.update({
                where: { id: uid },
                data: { nome: data.nome }
            });

            if (empresaId) {
                await tx.auditoria.create({
                    data: {
                        empresaId: empresaId,
                        usuarioId: uid,
                        acao: "PERFIL_ATUALIZAR",
                        entidade: "usuario",
                        entidadeId: uid,
                        detalhe: { alteradoPor: "self", campos: ["nome"] }
                    }
                });
            }
        });

        return jsonOk({
            mensagem: "Perfil atualizado com sucesso."
        });

    } catch (error: any) {
        console.error("[ATUALIZAR_PERFIL] Erro:", error);
        return jsonErro("Falha interna ao atualizar perfil.", "INTERNAL_ERROR", 500);
    }
}
