import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { telefone, valor, dueDate, pixPayload, boletoUrl } = await request.json();

        // Placeholder Logger
        console.log(`[WHATSAPP COBRANCA] -> Enviando boleto e PIX da fatura vnc: ${dueDate} a ${telefone}`);
        console.log(`Valor: R$ ${valor} | Pix Copia/Cola: ${pixPayload} | PDF: ${boletoUrl}`);

        return NextResponse.json({ sucesso: true, canal: 'WHATSAPP_BILLING' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ erro: 'Falha no dispatcher de cobranca', msg: error.message }, { status: 500 });
    }
}
