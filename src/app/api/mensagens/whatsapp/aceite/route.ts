import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { telefone, tokenAceite, empresaId } = await request.json();

        // Placeholder Logger (Ex: Twilio/Z-API implementation goes here)
        console.log(`[WHATSAPP DISPATCHER] -> Disparando WAPP de Welcome & Acceptance para: ${telefone}`);
        console.log(`[MENSAGEM] Olá! Finalize a ativação da sua loja no link: https://app.restaurante360.com.br/aceite/${tokenAceite}`);

        if (empresaId) {
            await prisma.auditoria.create({
                data: {
                    empresaId: empresaId,
                    usuarioId: "sistema",
                    acao: "WHATSAPP_ENVIADO",
                    entidade: "empresa",
                    entidadeId: empresaId,
                    detalhe: { tipo: 'ACEITE_ENVIADO', mensagem: `Link de Trial e Aceite despachado via WhatsApp para ${telefone}.` }
                }
            });
        }

        return NextResponse.json({ sucesso: true, canal: 'WHATSAPP' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ erro: 'Falha no despacho de WAPP', msg: error.message }, { status: 500 });
    }
}
