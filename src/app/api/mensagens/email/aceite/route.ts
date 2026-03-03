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
        const { email, tokenAceite, empresaId } = await request.json();

        // Placeholder Logger (Ex: SendGrid/Resend implementation goes here)
        console.log(`[EMAIL DISPATCHER] -> Enviando link de aceite para: ${email}`);
        console.log(`[LINK GERADO] -> https://app.restaurante360.com.br/aceite/${tokenAceite}`);

        await repositorioAuditoriaFirestore.registrar(db as any, {
            id: `log_${Date.now()}`,
            empresaId: empresaId,
            tipo: 'ACEITE_ENVIADO',
            descricao: `Link de Trial e Aceite despachado via Email corporativo.`,
            criadoEm: new Date().toISOString()
        } as LogAuditoria);

        return NextResponse.json({ sucesso: true, canal: 'EMAIL', logId: `log_${Date.now()}` }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ erro: 'Falha no despacho de Email', msg: error.message }, { status: 500 });
    }
}
