import { NextResponse } from 'next/server';
import { repositorioFinanceiroCobrancas } from '@/server/financeiro/repositorios/repositorio-financeiro-cobrancas';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const empresaId = searchParams.get('empresaId');
        const limitParam = searchParams.get('limite');

        if (!empresaId) {
            return NextResponse.json({ erro: 'ID da Empresa é obrigatório.' }, { status: 400 });
        }

        const limite = limitParam ? parseInt(limitParam, 10) : 10;
        const cobrancasBrutas = await repositorioFinanceiroCobrancas.listarCobrancasPorEmpresa(empresaId, limite);

        // Map para limpar payload enviando excessos desnecessários pra UI client
        const history = cobrancasBrutas.map(cob => ({
            id: cob.id,
            status: cob.status,
            valor: cob.valor,
            vencimentoEm: cob.vencimento || cob.criadaEm,
            pagoEm: cob.pagaEm || null,
            forma: cob.formaPagamento,
            asaasPaymentId: cob.asaasPaymentId,
            links: {
                boletoPdfUrl: cob.bankSlipUrl || null,
                invoiceUrl: cob.invoiceUrl || null,
                pixCopiaECola: cob.pixPayload || null
            }
        }));

        return NextResponse.json({
            cobrancas: history
        });
    } catch (error: any) {
        console.error("Erro fetch cobrancas:", error);
        return NextResponse.json({ erro: 'Falha interna' }, { status: 500 });
    }
}
