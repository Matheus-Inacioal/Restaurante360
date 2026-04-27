import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obterSessao } from '@/server/auth/obterSessao';

export async function GET(request: NextRequest) {
    try {
        const auth = await obterSessao();
        if (!auth) {
            return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
        }

        const empresaId = auth.empresaId;
        if (!empresaId) {
            return NextResponse.json({ erro: 'Usuário sem empresa vinculada' }, { status: 403 });
        }

        const usuarios = await prisma.usuario.findMany({
            where: { empresaId },
            select: {
                id: true,
                nome: true,
                email: true,
                papel: true,
                status: true,
            }
        });

        // Adapta o 'papel' para 'role' que é esperado pelo frontend antigo, e 'nome' para 'name'
        const usuariosAdaptados = usuarios.map(u => ({
            id: u.id,
            name: u.nome,
            email: u.email,
            role: u.papel,
            status: u.status
        }));

        return NextResponse.json({ sucesso: true, usuarios: usuariosAdaptados });
    } catch (error: any) {
        return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
    }
}
