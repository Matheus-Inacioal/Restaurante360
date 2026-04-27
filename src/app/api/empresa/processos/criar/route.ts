import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { obterSessao } from '@/server/auth/obterSessao';
import crypto from 'crypto';

const taskSchemaInput = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    requiresPhoto: z.boolean(),
});

const processoEmpresaSchema = z.object({
    name: z.string().trim().min(3, "O nome da rotina/processo deve ter pelo menos 3 caracteres."),
    categoryId: z.string().min(1, 'Selecione uma categoria.'),
    description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
    tasks: z.array(taskSchemaInput).min(1, "É preciso enviar as tarefas."),
});

export async function POST(req: Request) {
    try {
        const authResult = await obterSessao();
        if (!authResult) {
            return jsonErro("Não autorizado.", "UNAUTHORIZED", 401);
        }

        const body = await req.json();
        const parseResult = processoEmpresaSchema.safeParse(body);

        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const data = parseResult.data;
        const empresaId = authResult.empresaId;
        const uid = authResult.uid;

        if (!empresaId) {
            return jsonErro("Usuário sem empresa vinculada.", "FORBIDDEN", 403);
        }

        const passos = data.tasks.map(t => ({
            id: crypto.randomUUID(),
            titulo: t.title,
            descricao: t.description || '',
            exigeFoto: t.requiresPhoto
        }));

        const novoProcesso = await prisma.$transaction(async (tx) => {
            const proc = await tx.processo.create({
                data: {
                    empresaId,
                    titulo: data.name,
                    descricao: data.description,
                    categoriaId: data.categoryId,
                    passos: passos,
                    ativo: true
                }
            });

            await tx.auditoria.create({
                data: {
                    empresaId,
                    usuarioId: uid,
                    acao: "PROCESSO_CRIAR",
                    entidade: "processo",
                    entidadeId: proc.id,
                    detalhe: { nome: data.name, quantidadePassos: passos.length }
                }
            });

            return proc;
        });

        return jsonOk({
            processId: novoProcesso.id,
            name: novoProcesso.titulo,
            categoryId: novoProcesso.categoriaId,
            description: novoProcesso.descricao,
            createdActivities: passos.map(p => ({
                id: p.id,
                title: p.titulo,
                description: p.descricao,
                requiresPhoto: p.exigeFoto
            }))
        }, 201);

    } catch (error: any) {
        console.error("[CRIAR_PROCESSO_EMPRESA] Erro:", error);
        return jsonErro("Falha interna ao criar rotina.", "INTERNAL_ERROR", 500);
    }
}
