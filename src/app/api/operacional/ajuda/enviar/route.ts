import { NextResponse } from 'next/server';
import { z } from 'zod';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';

const ajudaSchema = z.object({
    nome: z.string().min(2, 'Nome é obrigatório.'),
    email: z.string().email('E-mail inválido.'),
    descricao: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
});

export async function POST(req: Request) {
    try {
        const authResult = await garantirAcessoEmpresa(req);
        if (authResult instanceof Response) return authResult;

        const body = await req.json();
        const parseResult = ajudaSchema.safeParse(body);

        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const data = parseResult.data;

        // TODO: Enviar email para o suporte (ex: Resend)
        console.log("[AJUDA] Chamado recebido:", data);

        return jsonOk({
            mensagem: "Seu chamado foi registrado com sucesso. Entraremos em contato em breve.",
            id: "suporte-" + Date.now()
        }, 201);

    } catch (error: any) {
        console.error("[CRIAR_CHAMADO] Erro:", error);
        return jsonErro("Falha interna ao registrar chamado.", "INTERNAL_ERROR", 500);
    }
}
