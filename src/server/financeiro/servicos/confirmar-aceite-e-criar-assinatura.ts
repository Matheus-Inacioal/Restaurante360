import "server-only";

import { repositorioFinanceiroAceites } from '../repositorios/repositorio-financeiro-aceites';
import { repositorioEmpresasAdmin } from '../repositorios/repositorio-empresas-admin';
import { repositorioFinanceiroAssinaturas } from '../repositorios/repositorio-financeiro-assinaturas';
import { repositorioFinanceiroAuditoria } from '../repositorios/repositorio-financeiro-auditoria';
import { clienteAsaas } from '../asaas/cliente-asaas';
import { FormaPagamento } from '@/lib/types/financeiro';

interface ConfirmarAceiteDTO {
    tokenAceite: string;
    formaPagamento: FormaPagamento;
}

export async function confirmarAceiteECriarAssinatura({ tokenAceite, formaPagamento }: ConfirmarAceiteDTO) {
    const aceite = await repositorioFinanceiroAceites.obterAceitePorToken(tokenAceite);

    if (!aceite) {
        throw new Error('Token de aceite inválido ou não encontrado.');
    }

    if (aceite.status !== 'PENDENTE') {
        throw new Error('Esse link já foi utilizado ou expirou.');
    }

    const empresa = await repositorioEmpresasAdmin.obterEmpresaPorId(aceite.empresaId);
    if (!empresa) {
        throw new Error('Empresa vinculada não encontrada.');
    }

    let customerId = empresa.asaasCustomerId || aceite.asaasCustomerId;

    if (!customerId) {
        const existing = await clienteAsaas.findCustomerByExternalRef(empresa.id).catch(() => null);
        if (existing) {
            customerId = existing.id;
        } else {
            const customer = await clienteAsaas.createCustomer({
                name: empresa.nome,
                email: empresa.responsavelEmail,
                cpfCnpj: empresa.cnpj,
                phone: empresa.whatsappResponsavel,
                externalReference: empresa.id
            });
            customerId = customer.id;
        }
    }

    if (empresa.asaasSubscriptionId) {
        throw new Error('Empresa já possui uma assinatura ativa.');
    }

    const dueDate = aceite.vencimentoPrimeiraCobrancaEm
        ? new Date(aceite.vencimentoPrimeiraCobrancaEm)
        : (aceite.expiraEm ? new Date(aceite.expiraEm) : new Date());

    const translatedBillingType = formaPagamento === 'CARTAO' ? 'CREDIT_CARD' : (formaPagamento as any);

    const subscription = await clienteAsaas.createSubscription({
        customer: customerId as string,
        billingType: translatedBillingType,
        value: aceite.valor,
        nextDueDate: dueDate.toISOString().split('T')[0],
        cycle: aceite.ciclo === 'MENSAL' ? 'MONTHLY' : (aceite.ciclo === 'ANUAL' ? 'YEARLY' : 'SEMIANNUALLY'),
        description: `Plano Restaurante360 - ${aceite.planoId}`,
        externalReference: aceite.id
    });

    // Fire Updates
    await repositorioFinanceiroAceites.marcarAceiteComoAceito(aceite.id, {
        formaPagamentoEscolhida: translatedBillingType,
        asaasCustomerId: customerId,
        asaasSubscriptionId: subscription.id
    });

    await repositorioEmpresasAdmin.atualizarEmpresa(empresa.id, {
        asaasCustomerId: customerId,
        asaasSubscriptionId: subscription.id,
        status: 'ATIVO',
        valorAtual: aceite.valor,
        planoId: aceite.planoId
    });

    await repositorioFinanceiroAssinaturas.criarOuAtualizarAssinatura(empresa.id, {
        id: subscription.id,
        planoId: aceite.planoId,
        ciclo: aceite.ciclo,
        status: 'ATIVA',
        proximoVencimentoEm: dueDate.toISOString(),
        asaasSubscriptionId: subscription.id
    });

    await repositorioFinanceiroAuditoria.registrarEvento({
        empresaId: empresa.id,
        tipo: 'ASSINATURA_CRIADA',
        descricao: `Assinatura confirmada (${formaPagamento}) e criada no ASAAS id: ${subscription.id}`,
    });

    return {
        sucesso: true,
        asaasCustomerId: customerId,
        asaasSubscriptionId: subscription.id
    };
}
