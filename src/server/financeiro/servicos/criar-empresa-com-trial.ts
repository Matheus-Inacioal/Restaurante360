import "server-only";

import { repositorioEmpresasAdmin } from '../repositorios/repositorio-empresas-admin';
import { repositorioFinanceiroAceites } from '../repositorios/repositorio-financeiro-aceites';
import { repositorioFinanceiroAuditoria } from '../repositorios/repositorio-financeiro-auditoria';
import { EmpresaAtualizada, AceiteAssinatura } from '@/lib/types/financeiro';

interface CriarEmpresaDTO {
    empresa: {
        nome: string;
        cnpj: string;
    };
    responsavel: {
        nome: string;
        email: string;
        whatsappResponsavel: string;
    };
    planoId: string;
    ciclo: 'MENSAL' | 'ANUAL';
    diasTrial: number;
    vencimentoPrimeiraCobrancaEm: string;
}

export async function criarEmpresaComTrial(dto: CriarEmpresaDTO) {
    const dataAtual = new Date();
    const trialFim = new Date();
    trialFim.setDate(dataAtual.getDate() + dto.diasTrial);

    const idEmpresa = crypto.randomUUID();
    const idAceite = crypto.randomUUID();

    const novaEmpresa: EmpresaAtualizada = {
        id: idEmpresa,
        nome: dto.empresa.nome,
        cnpj: dto.empresa.cnpj,
        responsavelNome: dto.responsavel.nome,
        responsavelEmail: dto.responsavel.email,
        whatsappResponsavel: dto.responsavel.whatsappResponsavel,
        planoId: dto.planoId,
        planoNome: dto.planoId, // lookup fake
        cicloPagamento: dto.ciclo,
        valorAtual: dto.planoId === 'Starter' ? 97 : (dto.planoId === 'Pro' ? 197 : 497),
        status: 'TRIAL_ATIVO',
        diasTrial: dto.diasTrial,
        vencimentoPrimeiraCobrancaEm: dto.vencimentoPrimeiraCobrancaEm,
        trialInicio: dataAtual.toISOString(),
        trialFim: trialFim.toISOString(),
        criadoEm: dataAtual.toISOString(),
        atualizadoEm: dataAtual.toISOString()
    };

    const novoAceite: AceiteAssinatura = {
        id: idAceite,
        empresaId: idEmpresa,
        planoId: novaEmpresa.planoId || 'BASE',
        ciclo: dto.ciclo,
        valor: novaEmpresa.valorAtual || 0,
        status: 'PENDENTE',
        diasTrial: dto.diasTrial,
        vencimentoPrimeiraCobrancaEm: dto.vencimentoPrimeiraCobrancaEm,
        responsavelNome: dto.responsavel.nome,
        responsavelEmail: dto.responsavel.email,
        whatsappResponsavel: dto.responsavel.whatsappResponsavel,
        cnpj: dto.empresa.cnpj,
        expiraEm: trialFim.toISOString(),
        criadoEm: dataAtual.toISOString()
    };

    // Salvar Base
    await repositorioEmpresasAdmin.criarEmpresa(novaEmpresa);
    await repositorioFinanceiroAceites.criarAceite(novoAceite);

    // Auditoria
    await repositorioFinanceiroAuditoria.registrarEvento({
        empresaId: idEmpresa,
        tipo: 'EMPRESA_CRIADA',
        descricao: `Empresa ${novaEmpresa.nome} criada com sucesso em modo de avaliação via Painel.`,
    });

    await repositorioFinanceiroAuditoria.registrarEvento({
        empresaId: idEmpresa,
        tipo: 'ACEITE_ENVIADO',
        descricao: `Token de aceite gerado para a empresa recém nascida e em vias de envio de Notificação.`,
    });

    return {
        empresaId: idEmpresa,
        aceiteToken: idAceite,
        novaEmpresa
    };
}
