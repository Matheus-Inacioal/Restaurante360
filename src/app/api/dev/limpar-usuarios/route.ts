import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Obter usuários para limpar baseado nos emails listados anteriormente
        const emailsParaLimpar = ["lucasnarciso", "cozinha", "financeirorebu"];
        
        const usuarios = await prisma.usuario.findMany({
            where: {
                OR: emailsParaLimpar.map(t => ({ email: { contains: t } }))
            }
        });

        const apagados: string[] = [];

        for (const user of usuarios) {
            console.log(`[LIMPEZA] Apagando no PG: ${user.email} (${user.id})`);
            await prisma.usuario.delete({
                where: { id: user.id }
            });

            apagados.push(user.email);
        }

        return NextResponse.json({ ok: true, apagados });
    } catch (error: any) {
        console.error("Erro na limpeza:", error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
