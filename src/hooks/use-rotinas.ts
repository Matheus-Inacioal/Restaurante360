"use client";

import { useState, useEffect, useCallback } from "react";
import type { Rotina } from "../lib/types/rotinas";
import { repositorioRotinas } from "../lib/repositories/repositorio-rotinas";
import { repositorioTarefas } from "../lib/repositories/repositorio-tarefas";
import { useToast } from "@/hooks/use-toast";
import type { Tarefa } from "../lib/types/tarefas";

// MOCK: ID fixo de empresa e usuario para simular ambiente logado até o auth estar fundido
const MOCK_EMPRESA_ID = "empresa_demo_123";
const MOCK_USUARIO_ID = "user_matheus_99";

export function useRotinas() {
    const [rotinas, setRotinas] = useState<Rotina[]>([]);

    // OS 4 ESTADOS UI EXIGIDOS
    const [isCarregando, setIsCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const { toast } = useToast();

    const carregarRotinas = useCallback(async () => {
        setIsCarregando(true);
        setErro(null);
        try {
            const data = await repositorioRotinas.obterTodas(MOCK_EMPRESA_ID);
            setRotinas(data);
        } catch (error) {
            console.error("Falha ao carregar rotinas:", error);
            setErro("Não foi possível carregar suas rotinas.");
            toast({
                title: "Erro de Comunicação",
                description: "Suas rotinas não puderam ser carregadas no momento.",
                variant: "destructive",
            });
        } finally {
            setIsCarregando(false);
        }
    }, [toast]);

    useEffect(() => {
        carregarRotinas();
    }, [carregarRotinas]);

    const adicionarRotina = async (dadosDaRotina: Omit<Rotina, "id" | "criadoEm" | "atualizadoEm" | "empresaId" | "criadoPor">) => {
        try {
            const nova = await repositorioRotinas.criar({
                ...dadosDaRotina,
                empresaId: MOCK_EMPRESA_ID,
                criadoPor: MOCK_USUARIO_ID
            });

            setRotinas((prev) => [...prev, nova]);

            toast({
                title: "Sucesso!",
                description: `Rotina "${nova.titulo}" criada com sucesso.`,
            });
            return nova;
        } catch (error) {
            toast({
                title: "Operação Bloqueada",
                description: "Falha ao gravar rotina.",
                variant: "destructive",
            });
            throw error;
        }
    };

    const atualizarRotina = async (id: string, atualizacoes: Partial<Rotina>) => {
        try {
            const rotinaAtualizada = await repositorioRotinas.atualizar(id, MOCK_EMPRESA_ID, atualizacoes);
            setRotinas((prev) => prev.map((r) => (r.id === id ? rotinaAtualizada : r)));
            return rotinaAtualizada;
        } catch (error) {
            toast({
                title: "Erro de Persistência",
                description: "Falha ao atualizar rotina.",
                variant: "destructive",
            });
            throw error;
        }
    };

    const excluirRotina = async (id: string) => {
        try {
            await repositorioRotinas.excluir(id, MOCK_EMPRESA_ID);
            setRotinas((prev) => prev.filter((r) => r.id !== id));
            toast({
                title: "Rotina Apagada",
                description: "A rotina foi removida com sucesso.",
            });
        } catch (error) {
            toast({
                title: "Falha Geral",
                description: "Não foi possível excluir a rotina.",
                variant: "destructive",
            });
            throw error;
        }
    };

    const gerarTarefasDoDia = useCallback(async () => {
        try {
            // Pega a data de hoje formatada (YYYY-MM-DD local)
            const hoje = new Date();
            const dataReferencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

            const ativas = await repositorioRotinas.obterAtivas(MOCK_EMPRESA_ID);
            let geradas = 0;

            for (const rotina of ativas) {
                // Verificar recorrência (semanal / mensal)
                if (rotina.frequencia === "semanal") {
                    const diaDaSemanaHoje = hoje.getDay(); // 0 (Dom) a 6 (Sab)
                    if (!rotina.diasSemana?.includes(diaDaSemanaHoje)) {
                        continue; // Não é dia de gerar
                    }
                } else if (rotina.frequencia === "mensal") {
                    const diaDoMesHoje = hoje.getDate(); // 1 a 31
                    if (rotina.diaDoMes !== diaDoMesHoje) {
                        continue; // Não é dia de gerar
                    }
                }

                const jaGerou = await repositorioRotinas.verificarGeracaoExistente(rotina.id, dataReferencia, MOCK_EMPRESA_ID);
                if (jaGerou) continue;

                // Definir prazo se houver horário preferencial
                let prazo: string | undefined = undefined;
                if (rotina.horarioPreferencial) {
                    const [horas, minutos] = rotina.horarioPreferencial.split(':');
                    const dataPrazo = new Date(hoje);
                    dataPrazo.setHours(parseInt(horas, 10), parseInt(minutos, 10), 0, 0);
                    prazo = dataPrazo.toISOString();
                }

                // Criar a Tarefa a partir da Rotina
                const novaTarefa: Omit<Tarefa, "id" | "criadoEm" | "atualizadoEm"> = {
                    empresaId: MOCK_EMPRESA_ID,
                    titulo: rotina.titulo,
                    descricao: rotina.descricao,
                    tipo: rotina.tipoTarefaGerada,
                    status: "pendente",
                    prioridade: "Média",
                    responsavel: rotina.responsavelPadraoId,
                    prazo,
                    tags: rotina.tags,
                    itensVerificacao: rotina.tipoTarefaGerada === "checklist" && rotina.checklistModelo
                        ? rotina.checklistModelo.map(item => ({ id: crypto.randomUUID(), texto: item.texto, concluido: false }))
                        : undefined,
                    origem: {
                        tipo: "rotina",
                        rotinaId: rotina.id,
                        dataReferencia
                    },
                    criadoPor: MOCK_USUARIO_ID
                };

                const tarefaCriada = await repositorioTarefas.criar(novaTarefa);

                // Registrar o histórico de geração
                await repositorioRotinas.registrarGeracao({
                    empresaId: MOCK_EMPRESA_ID,
                    rotinaId: rotina.id,
                    dataReferencia,
                    taskIdGerada: tarefaCriada.id
                });

                geradas++;
            }

            if (geradas > 0) {
                toast({
                    title: "Rotinas Geradas",
                    description: `${geradas} tarefas foram criadas com sucesso para hoje.`,
                });
            }

            return geradas;
        } catch (error) {
            console.error("Falha ao gerar tarefas do dia:", error);
            toast({
                title: "Falha na Geração",
                description: "Ocorreu um erro ao gerar as tarefas de rotina de hoje.",
                variant: "destructive",
            });
            return 0;
        }
    }, [toast]);

    const obterHistoricoGeracoes = useCallback(async (rotinaId: string) => {
        try {
            return await repositorioRotinas.obterHistoricoRecente(rotinaId, MOCK_EMPRESA_ID);
        } catch (error) {
            console.error("Falha ao carregar histórico:", error);
            return [];
        }
    }, []);

    return {
        rotinas,
        isCarregando,
        erro,
        vazio: !isCarregando && rotinas.length === 0,
        adicionarRotina,
        atualizarRotina,
        excluirRotina,
        recarregarRotinas: carregarRotinas,
        gerarTarefasDoDia,
        obterHistoricoGeracoes
    };
}

