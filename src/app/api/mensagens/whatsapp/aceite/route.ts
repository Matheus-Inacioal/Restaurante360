import { NextResponse } from 'next/server';
import { repositorioAuditoriaFirestore } from '@/lib/repositories/repositorio-auditoria-firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
import { LogAuditoria } from '@/lib/types/auditoria';

export async function POST(request: Request) {
    try {
        const { telefone, tokenAceite, empresaId } = await request.json();

        // Placeholder Logger (Ex: Twilio/Z-API implementation goes here)
        console.log(`[WHATSAPP DISPATCHER] -> Disparando WAPP de Welcome & Acceptance para: ${telefone}`);
        console.log(`[MENSAGEM] Olá! Finalize a ativação da sua loja no link: https://app.restaurante360.com.br/aceite/${tokenAceite}`);

        await repositorioAuditoriaFirestore.registrar(db as any, {
            id: `log_wapp_${Date.now()}`,
            empresaId: empresaId,
            tipo: 'ACEITE_ENVIADO',
            descricao: `Link de Trial e Aceite despachado via WhatsApp.`,
            criadoEm: new Date().toISOString()
        } as LogAuditoria);

        return NextResponse.json({ sucesso: true, canal: 'WHATSAPP' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ erro: 'Falha no despacho de WAPP', msg: error.message }, { status: 500 });
    }
}
