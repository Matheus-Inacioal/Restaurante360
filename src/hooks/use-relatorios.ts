import { useMemo, useState } from 'react';
import { useTarefas } from './use-tarefas';
import { useRotinas } from './use-rotinas';
import { useProcessos } from './use-processos';
import { subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';

export type PeriodoRelatorio = 'hoje' | '7dias' | '30dias' | 'personalizado';

export interface FiltrosRelatorio {
    periodo: PeriodoRelatorio;
    dataInicial?: Date;
    dataFinal?: Date;
    responsavelId?: string;
}

export function useRelatorios() {
    const [filtros, setFiltros] = useState<FiltrosRelatorio>({
        periodo: '30dias',
    });

    const { tarefas, isCarregando: loadingTarefas } = useTarefas();
    const { rotinas, isCarregando: loadingRotinas } = useRotinas();
    const { processos, isCarregando: loadingProcessos } = useProcessos();

    const isLoading = loadingTarefas || loadingRotinas || loadingProcessos;

    // 1. Resolver as datas do filtro
    const { dataCorteInicial, dataCorteFinal } = useMemo(() => {
        const hoje = new Date();
        let inicial = startOfDay(hoje);
        let final = endOfDay(hoje);

        if (filtros.periodo === 'hoje') {
            inicial = startOfDay(hoje);
        } else if (filtros.periodo === '7dias') {
            inicial = startOfDay(subDays(hoje, 7));
        } else if (filtros.periodo === '30dias') {
            inicial = startOfDay(subDays(hoje, 30));
        } else if (filtros.periodo === 'personalizado' && filtros.dataInicial && filtros.dataFinal) {
            inicial = startOfDay(filtros.dataInicial);
            final = endOfDay(filtros.dataFinal);
        }

        return { dataCorteInicial: inicial, dataCorteFinal: final };
    }, [filtros]);

    // Função helper para checar se data está no intervalo
    const isDateInRange = (dateInput: any) => {
        if (!dateInput) return false;
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return false;
        return isWithinInterval(date, { start: dataCorteInicial, end: dataCorteFinal });
    };

    // 2. Processar Dados (Tarefas)
    const tarefasFiltradas = useMemo(() => {
        return tarefas.filter(t => {
            // Filtrar por data (usando criadoEm ou dataPrazo, dependendo da regra de negócio, usaremos criadoEm como proxy de atividade)
            const dataFiltro = t.criadoEm ? new Date(t.criadoEm) : new Date();
            if (!isDateInRange(dataFiltro)) return false;

            // Filtrar por responsável
            if (filtros.responsavelId && t.responsavel !== filtros.responsavelId) return false;

            return true;
        });
    }, [tarefas, isDateInRange, filtros.responsavelId]);

    // 3. Processar KPI e Gráficos
    const kpis = useMemo(() => {
        const totalTarefas = tarefasFiltradas.length;
        const concluidas = tarefasFiltradas.filter(t => t.status === 'concluida').length;
        const atrasadas = tarefasFiltradas.filter(t => {
            if (t.status === 'concluida') return false;
            if (!t.prazo) return false;
            return new Date(t.prazo) < new Date();
        }).length;

        const taxaConclusao = totalTarefas > 0 ? (concluidas / totalTarefas) * 100 : 0;

        // Aderência rotinas (simplificada para o painel com base no que está filtrado/visível) // FIXME: Ajustar cálculo real
        const totalInstancias = 0; // rotinasInstancias?.length || 0;
        const instanciasConcluidas = 0; // rotinasInstancias?.filter(i => i.status === 'concluida').length || 0;
        const aderenciaRotinas = totalInstancias > 0 ? (instanciasConcluidas / totalInstancias) * 100 : 0;

        return {
            totalTarefas,
            concluidas,
            atrasadas,
            taxaConclusao,
            aderenciaRotinas
        };
    }, [tarefasFiltradas, rotinas]);

    const serieDiaria = useMemo(() => {
        // Agrupa tarefas por dia
        const agrupado = tarefasFiltradas.reduce((acc, t) => {
            const dataStr = t.criadoEm ? format(new Date(t.criadoEm), 'dd/MM/yyyy') : 'Sem data';
            if (!acc[dataStr]) {
                acc[dataStr] = { Data: dataStr, Concluídas: 0, Atrasadas: 0, Pendentes: 0, 'Em Progresso': 0 };
            }

            if (t.status === 'concluida') acc[dataStr].Concluídas++;
            else if (t.status === 'em_progresso') acc[dataStr]['Em Progresso']++;
            else acc[dataStr].Pendentes++; // TODO adicionar verificação de "Atrasadas" se precisar na série diária

            return acc;
        }, {} as Record<string, any>);

        return Object.values(agrupado).sort((a, b) => {
            // Orderm cronologica simples pelo formato DD/MM/YYYY. Como `format` exporta DD/MM/YYYY, o sort iterando string vai falhar.
            // Para robustez seria ideal ordenar as CHAVES como Date e depois mapear.
            return 0; // WIP
        });
    }, [tarefasFiltradas]);


    // 4. Exportadores
    const gerarLinhasVisaoGeral = () => {
        return [
            { Métrica: 'Total de Tarefas', Valor: kpis.totalTarefas },
            { Métrica: 'Concluídas', Valor: kpis.concluidas },
            { Métrica: 'Atrasadas', Valor: kpis.atrasadas },
            { Métrica: 'Taxa de Conclusão', Valor: `${kpis.taxaConclusao.toFixed(1)}%` },
            { Métrica: 'Aderência de Rotinas', Valor: `${kpis.aderenciaRotinas.toFixed(1)}%` },
        ];
    };

    const obterDatasetParaExportacaoAba = (abaAtual: 'Visão Geral' | 'Tarefas' | 'Rotinas' | 'Processos') => {
        let linhas: any[] = [];

        if (abaAtual === 'Visão Geral') {
            linhas = gerarLinhasVisaoGeral();
        } else if (abaAtual === 'Tarefas') {
            linhas = tarefasFiltradas.map(t => ({
                'Título': t.titulo,
                'Status': t.status,
                'Prioridade': t.prioridade || '-',
                'Prazo': t.prazo ? format(new Date(t.prazo), 'dd/MM/yyyy HH:mm') : '-',
                'Criado em': t.criadoEm ? format(new Date(t.criadoEm), 'dd/MM/yyyy HH:mm') : '-',
            }));
        } else if (abaAtual === 'Rotinas') {
            // Placeholder
            linhas = [{ Mensagem: 'Exportação de rotinas em construção...' }];
        } else if (abaAtual === 'Processos') {
            // Placeholder
            linhas = [{ Mensagem: 'Exportação de processos em construção...' }];
        }

        return {
            nomeAba: abaAtual,
            linhas,
            metadados: {
                'Gerado em': format(new Date(), "dd/MM/yyyy 'às' HH:mm"),
                'Filtro: Período': filtros.periodo,
                'Filtro: Responsável': filtros.responsavelId || 'Todos'
            }
        };
    };

    const obterPacoteCompletoParaExportacao = () => {
        const metadados = {
            'Visão Geral': 'Dashboard Principal de Relatórios',
            'Data de Geração': format(new Date(), "dd/MM/yyyy 'às' HH:mm"),
            'Período Avaliado': `${format(dataCorteInicial, 'dd/MM/yyyy')} a ${format(dataCorteFinal, 'dd/MM/yyyy')}`,
            'Filtro Responsável': filtros.responsavelId || 'Todos',
            'Versão': '1.0'
        };

        return {
            metadados,
            abas: [
                { nomeAba: 'Visão Geral', linhas: gerarLinhasVisaoGeral() },
                { nomeAba: 'Série Diária', linhas: serieDiaria }, // Adicionando série diária aqui também
                { nomeAba: 'Tarefas', linhas: obterDatasetParaExportacaoAba('Tarefas').linhas },
                { nomeAba: 'Rotinas', linhas: obterDatasetParaExportacaoAba('Rotinas').linhas },
                { nomeAba: 'Processos', linhas: obterDatasetParaExportacaoAba('Processos').linhas },
            ]
        };
    };


    return {
        filtros,
        setFiltros,
        isLoading,
        kpis,
        serieDiaria,
        tarefasFiltradas,
        obterDatasetParaExportacaoAba,
        obterPacoteCompletoParaExportacao,
        dataCorteInicial,
        dataCorteFinal,
    };
}
