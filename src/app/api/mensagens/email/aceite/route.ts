import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { email, tokenAceite, empresaId } = await request.json();

        // Placeholder Logger (Ex: SendGrid/Resend implementation goes here)
        console.log(`[EMAIL DISPATCHER] -> Enviando link de aceite para: ${email}`);
        console.log(`[LINK GERADO] -> https://app.restaurante360.com.br/aceite/${tokenAceite}`);

        if (empresaId) {
            await prisma.auditoria.create({
                data: {
                    empresaId: empresaId,
                    usuarioId: "sistema",
                    acao: "EMAIL_ENVIADO",
                    entidade: "empresa",
                    entidadeId: empresaId,
                    detalhe: { tipo: 'ACEITE_ENVIADO', mensagem: `Link de Trial e Aceite despachado via Email corporativo para ${email}.` }
                }
            });
        }

        return NextResponse.json({ sucesso: true, canal: 'EMAIL' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ erro: 'Falha no despacho de Email', msg: error.message }, { status: 500 });
    }
}
