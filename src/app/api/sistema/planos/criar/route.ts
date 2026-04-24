import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoSistema } from '@/server/auth/garantirAcessoSistema';
import { registrarAuditoria } from '@/server/servicos/servico-auditoria';

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

        // Prisma armazena features como Array e tem valorMensal/valorAnual como Float.
        // O payload antigo usava precoMensal(int) e maxUsuarios(int).
        // Vamos mapear de forma segura para o schema do Prisma:
        const plano = await prisma.plano.create({
            data: {
                nome: data.nome,
                descricao: data.descricao || "",
                valorMensal: data.precoMensal / 100, // Ajuste caso venha em centavos
                valorAnual: (data.precoMensal / 100) * 12,
                ativo: data.ativo,
                features: [`Até ${data.maxUsuarios} usuários`], // feature basica baseada no payload legado
            }
        });

        await registrarAuditoria({
            acao: "plano.criado",
            entidade: "plano",
            entidadeId: plano.id,
            usuarioId: authResult.sessao.uid,
            detalhe: { nome: data.nome, valorMensal: plano.valorMensal },
        }).catch(() => null);

        return jsonOk({
            id: plano.id,
            nome: data.nome
        }, 201);

    } catch (error: any) {
        console.error("[CRIAR_PLANO] Erro:", error);
        return jsonErro("Falha interna ao criar plano.", "INTERNAL_ERROR", 500);
    }
}
