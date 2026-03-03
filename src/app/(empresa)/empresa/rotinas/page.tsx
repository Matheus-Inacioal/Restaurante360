"use client";

import { useState, useEffect } from "react";
import { CabecalhoRotinas } from "@/components/rotinas/cabecalho-rotinas";
import { ListaRotinas } from "@/components/rotinas/lista-rotinas";
import { PainelDetalhesRotina } from "@/components/rotinas/painel-detalhes-rotina";
import { ModalRotina } from "@/components/rotinas/modal-criar-rotina";

import { useRotinas } from "@/hooks/use-rotinas";
import type { Rotina, GeracaoRotinaDiaria } from "@/lib/types/rotinas";
import { useToast } from "@/hooks/use-toast";

export default function PaginaDeRotinas() {
    const {
        rotinas, isCarregando, erro, vazio,
        adicionarRotina, atualizarRotina, excluirRotina, gerarTarefasDoDia, obterHistoricoGeracoes
    } = useRotinas();

    const { toast } = useToast();

    const [idRotinaSelecionada, setIdRotinaSelecionada] = useState<string | null>(null);
    const [isModalAberto, setIsModalAberto] = useState(false);
    const [rotinaEdicao, setRotinaEdicao] = useState<Rotina | null>(null);
    const [isGerandoManual, setIsGerandoManual] = useState(false);
    const [historico, setHistorico] = useState<GeracaoRotinaDiaria[]>([]);



    useEffect(() => {
        if (idRotinaSelecionada) {
            obterHistoricoGeracoes(idRotinaSelecionada).then(setHistorico);
        } else {
            setHistorico([]);
        }
    }, [idRotinaSelecionada, obterHistoricoGeracoes]);

    const abrirModalNovaRotina = () => {
        setRotinaEdicao(null);
        setIsModalAberto(true);
    };

    const abrirModalEdicao = (rotina: Rotina) => {
        setRotinaEdicao(rotina);
        setIsModalAberto(true);
    };

    const handleSalvarRotina = async (dadosDaRotina: Omit<Rotina, "id" | "criadoEm" | "atualizadoEm" | "empresaId" | "criadoPor">) => {
        if (rotinaEdicao) {
            await atualizarRotina(rotinaEdicao.id, dadosDaRotina);
            // Se o titulo ou algo mudar, a lista re-renderiza pelo state local
        } else {
            const rotinaCriada = await adicionarRotina(dadosDaRotina);
            setIdRotinaSelecionada(rotinaCriada.id);
        }
    };

    const handleAlternarStatus = async (rotina: Rotina) => {
        await atualizarRotina(rotina.id, { ativa: !rotina.ativa });
        toast({
            title: rotina.ativa ? "Rotina Desativada" : "Rotina Ativada",
            description: `A execução automática foi ${rotina.ativa ? "interrompida" : "retomada"}.`,
        });
    };

    const handleDuplicarRotina = async (rotina: Rotina) => {
        const { id, criadoEm, atualizadoEm, criadoPor, empresaId, ...restoPropsBase } = rotina;
        const rotinaClone = await adicionarRotina({
            ...restoPropsBase,
            titulo: `${restoPropsBase.titulo} (Clonada)`,
            ativa: false, // Clones nascem inativos por segurança
        });
        setIdRotinaSelecionada(rotinaClone.id);
    };

    const handleExcluirRotina = async (id: string) => {
        await excluirRotina(id);
        if (idRotinaSelecionada === id) {
            setIdRotinaSelecionada(null);
        }
    };

    const handleGerarTarefasManual = async () => {
        setIsGerandoManual(true);
        await gerarTarefasDoDia();
        setIsGerandoManual(false);
    };

    // KPIs Header
    const metricas = {
        ativas: rotinas.filter((r) => r.ativa).length,
        inativas: rotinas.filter((r) => !r.ativa).length,
        geradasHoje: 0, // Mock visual por enquanto, até buscarmos o historico de geracoes real
    };

    const rotinaSelecionadaObj = rotinas.find((r) => r.id === idRotinaSelecionada) || null;

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full bg-background overflow-hidden relative">
            <div className="flex-none p-4 md:p-6 pb-0 z-10">
                <CabecalhoRotinas
                    metricas={metricas}
                    aoClicarNovaRotina={abrirModalNovaRotina}
                    aoClicarGerarTarefas={handleGerarTarefasManual}
                />
            </div>

            <div className="flex-1 flex flex-col min-h-0 p-4 md:p-6">
                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Lista (Lado Esquerdo Split-View) */}
                    <div className={`
                        flex-1 w-full overflow-y-auto pb-12 pr-2 custom-scrollbar
                        ${idRotinaSelecionada ? "hidden md:block lg:w-[60%]" : "block w-full"}
                    `}>
                        <ListaRotinas
                            rotinas={rotinas}
                            rotinaSelecionadaId={idRotinaSelecionada}
                            isCarregando={isCarregando}
                            erro={erro}
                            vazio={vazio}
                            aoSelecionarRotina={setIdRotinaSelecionada}
                            aoAlternarStatus={handleAlternarStatus}
                            aoDuplicarRotina={handleDuplicarRotina}
                            aoExcluirRotina={handleExcluirRotina}
                            aoEditarRotina={abrirModalEdicao}
                        />
                    </div>

                    {/* Detalhes (Lado Direito Split-View) */}
                    <div className={`
                        flex-none w-full md:w-[45%] lg:w-[40%] xl:w-[35%]
                        ${idRotinaSelecionada ? "block animate-in slide-in-from-right-8 duration-300 h-full" : "hidden"}
                    `}>
                        <PainelDetalhesRotina
                            rotina={rotinaSelecionadaObj}
                            aoFechar={() => setIdRotinaSelecionada(null)}
                            aoGerarTarefaManual={() => { }} // Hook global já gera as tarefas de todas, a ação manual força a mesma rotina se não gerada
                            isGerando={false}
                            historico={historico}
                        />
                    </div>
                </div>
            </div>

            <ModalRotina
                aberto={isModalAberto}
                aoMudarEstado={setIsModalAberto}
                rotinaEdicao={rotinaEdicao}
                aoGravar={handleSalvarRotina}
            />
        </div>
    );
}
