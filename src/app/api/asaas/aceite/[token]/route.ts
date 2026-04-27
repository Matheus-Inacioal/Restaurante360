import { NextRequest, NextResponse } from 'next/server';
import { repositorioFinanceiroAceites } from '@/server/financeiro/repositorios/repositorio-financeiro-aceites';
import { repositorioEmpresasAdmin } from '@/server/financeiro/repositorios/repositorio-empresas-admin';

export async function GET(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const aceite = await repositorioFinanceiroAceites.obterAceitePorToken(params.token);
        if (!aceite) {
            return NextResponse.json({ sucesso: false, erro: 'Token não encontrado ou inválido' }, { status: 404 });
        }

        let empresa = null;
        if (aceite.status === 'PENDENTE') {
            empresa = await repositorioEmpresasAdmin.obterEmpresaPorId(aceite.empresaId);
        }

        return NextResponse.json({
            sucesso: true,
            aceite,
            empresa
        });
    } catch (error: any) {
        return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
    }
}
