import { NextResponse } from 'next/server';
import { repositorioEmpresasAdmin } from '@/server/financeiro/repositorios/repositorio-empresas-admin';
import { repositorioFinanceiroPlanos } from '@/server/financeiro/repositorios/repositorio-financeiro-planos';
import { repositorioFinanceiroCobrancas } from '@/server/financeiro/repositorios/repositorio-financeiro-cobrancas';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const empresaId = searchParams.get('empresaId');

        if (!empresaId) {
            return NextResponse.json({ ok: false, code: "VALIDATION_ERROR", message: 'ID da Empresa é obrigatório.' }, { status: 400 });
        }

        // Simulação de check de Roles no Admin. O interceptor fará o middleware real no futuro.

        const empresa = await repositorioEmpresasAdmin.obterEmpresaPorId(empresaId);

        if (!empresa) {
            return NextResponse.json({ ok: false, code: "NOT_FOUND", message: 'Empresa não encontrada.' }, { status: 404 });
        }

        let planoNomeDisplay = empresa.planoNome || 'Plano Base';

        if (empresa.planoId) {
            const detalhePlano = await repositorioFinanceiroPlanos.obterPlanoPorId(empresa.planoId);
            if (detalhePlano) {
                planoNomeDisplay = detalhePlano.nome;
            }
        }

        // Busca a última cobrança para saber se tem flags (Ex: Tem pix?)
        const cobrancas = await repositorioFinanceiroCobrancas.listarCobrancasPorEmpresa(empresaId, 1);
        const ultimaCobranca = cobrancas.length > 0 ? cobrancas[0] : null;

        return NextResponse.json({
            ok: true,
            data: {
                status: empresa.status,
                planoAtual: {
                    id: empresa.planoId,
                    nome: planoNomeDisplay
                },
                ciclo: empresa.cicloPagamento,
                valorAtual: empresa.valorAtual || 0,
                proximoVencimentoEm: ultimaCobranca && ultimaCobranca.status === 'PENDING' ? ultimaCobranca.vencimento : null,
                flags: {
                    temBoletoPdf: ultimaCobranca && !!ultimaCobranca.bankSlipUrl,
                    temPixCopiaECola: ultimaCobranca && !!ultimaCobranca.pixPayload
                },
                trialFim: empresa.trialFim,
                asaasCustomerId: empresa.asaasCustomerId
            }
        });
    } catch (error: any) {
        console.error("Erro fetch resumo assinatura:", error);
        return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", message: 'Falha interna' }, { status: 500 });
    }
}
