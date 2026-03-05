import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/server/firebase/admin';
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
        const empresaId = authResult.sessao.empresaId!;
        const uid = authResult.sessao.uid;

        const ticketRef = adminDb
            .collection("empresas")
            .doc(empresaId)
            .collection("chamados")
            .doc();

        await ticketRef.set({
            nome: data.nome,
            email: data.email,
            descricao: data.descricao,
            status: 'aberto',
            criadoPor: uid,
            criadoEm: FieldValue.serverTimestamp(),
            atualizadoEm: FieldValue.serverTimestamp()
        });

        // Audit log
        const auditoriaRef = adminDb.collection("auditoria").doc();
        await auditoriaRef.set({
            empresaId: empresaId,
            entidade: "CHAMADO_SUPORTE",
            acao: "CRIAR",
            entidadeId: ticketRef.id,
            criadoPor: uid,
            detalhes: `Novo chamado aberto por ${data.nome} (${data.email})`,
            criadoEm: FieldValue.serverTimestamp()
        });

        return jsonOk({
            mensagem: "Seu chamado foi registrado com sucesso. Entraremos em contato em breve.",
            id: ticketRef.id
        }, 201);

    } catch (error: any) {
        console.error("[CRIAR_CHAMADO] Erro:", error);
        return jsonErro("Falha interna ao registrar chamado.", "INTERNAL_ERROR", 500);
    }
}
