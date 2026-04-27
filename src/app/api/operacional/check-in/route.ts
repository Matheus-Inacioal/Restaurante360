import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obterSessao } from '@/server/auth/obterSessao';

export async function POST(request: NextRequest) {
    try {
        const auth = await obterSessao();
        if (!auth) {
            return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
        }

        const empresaId = auth.empresaId;
        if (!empresaId) {
            return NextResponse.json({ erro: 'Usuário sem empresa vinculada' }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));

        // Salvar na tabela de Auditoria
        await prisma.auditoria.create({
            data: {
                empresaId,
                usuarioId: auth.uid,
                acao: "CHECKIN",
                entidade: "usuario",
                entidadeId: auth.uid,
                detalhe: { turno: body.shift || "Indefinido" }
            }
        });

        return NextResponse.json({ sucesso: true, mensagem: "Check-in realizado" });
    } catch (error: any) {
        return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
    }
}
