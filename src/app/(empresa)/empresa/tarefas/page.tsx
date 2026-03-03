"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Importação dos Componentes customizados Traduzidos
import { CabecalhoTarefas } from "@/components/tarefas/cabecalho-tarefas";
import { FiltrosTarefas } from "@/components/tarefas/filtros-tarefas";
import { ListaTarefas } from "@/components/tarefas/lista-tarefas";
import { PainelDetalhesTarefa } from "@/components/tarefas/painel-detalhes-tarefa";
import { ModalCriarTarefa } from "@/components/tarefas/modal-criar-tarefa";

// Lógica de Estado Global Governança SaaS
import { useTarefas } from "@/hooks/use-tarefas";
import type { Tarefa, TipoTarefa } from "@/lib/types/tarefas";

export default function PaginaDeTarefas() {
  const {
    tarefas, isCarregando, erro, vazio,
    adicionarTarefa, atualizarStatusTarefa, excluirTarefa
  } = useTarefas();

  const [idTarefaSelecionada, setIdTarefaSelecionada] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<string>("todas");

  // Controle do Modal Global de Ação
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [tipoRenderizacaoModal, setTipoRenderizacaoModal] = useState<TipoTarefa>("tarefa");

  const abrirModalNovaTarefa = () => {
    setTipoRenderizacaoModal("tarefa");
    setIsModalAberto(true);
  };

  const abrirModalNovoChecklist = () => {
    setTipoRenderizacaoModal("checklist");
    setIsModalAberto(true);
  };

  /**
   * Handlers Operacionais da Split View
   */
  const handleAlternarItemChecklist = async (idTarefa: string, idItem: string, concluido: boolean) => {
    const tarefa = tarefas.find(t => t.id === idTarefa);
    if (!tarefa || !tarefa.itensVerificacao) return;

    // Altera no memory-state (P/ firebase faríamos o dispatch parcial da transação direta)
    const atualizacaoPreditiva = tarefa.itensVerificacao.map(item =>
      item.id === idItem ? { ...item, concluido } : item
    );
    // Aqui atualizarTarefa({itensVerificacao: atualizacaoPreditiva}) seria a rota de API exata
  };

  const handleConcluirTarefa = async (idTarefa: string) => {
    await atualizarStatusTarefa(idTarefa, "concluida");
  };

  const handleDuplicarTarefa = async (tarefa: Tarefa) => {
    const { id, criadoEm, atualizadoEm, criadoPor, empresaId, ...restoPropsBase } = tarefa;
    const geradaClone = await adicionarTarefa({
      ...restoPropsBase,
      titulo: `${restoPropsBase.titulo} (Clonada)`,
      status: "pendente",
      itensVerificacao: restoPropsBase.itensVerificacao?.map(item => ({ ...item, concluido: false }))
    });
    setIdTarefaSelecionada(geradaClone.id);
  };

  const handleExcluirTarefa = async (idTarefa: string) => {
    await excluirTarefa(idTarefa);
    if (idTarefaSelecionada === idTarefa) {
      setIdTarefaSelecionada(null);
    }
  };

  /**
   * Filtros e Viewports
   */
  const tarefasFiltradas = tarefas.filter(tarefa => {
    if (abaAtiva === "checklists") return tarefa.tipo === "checklist";
    if (abaAtiva === "pontuais") return tarefa.tipo === "tarefa";
    return true;
  });

  const tarefaAtualSendoDigerida = tarefas.find(t => t.id === idTarefaSelecionada) || null;

  // KPIs dinámicos Baseados no Hook
  const metricas = {
    atrasadas: tarefas.filter(t => t.status === "atrasada").length,
    hoje: tarefas.filter(t => t.prazo?.toLowerCase().includes("hoje")).length,
    pendentes: tarefas.filter(t => t.status === "pendente").length,
    concluidas: tarefas.filter(t => t.status === "concluida").length,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full bg-background">

      {/* Header Fixo de Comando */}
      <div className="flex-none p-4 md:p-6 pb-0">
        <CabecalhoTarefas
          metricas={metricas}
          aoClicarNovaTarefa={abrirModalNovaTarefa}
          aoClicarNovoChecklist={abrirModalNovoChecklist}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0 p-4 md:p-6 overflow-hidden">

        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="h-full flex flex-col">

          <div className="flex-none mb-4">
            <TabsList>
              <TabsTrigger value="todas">Portfólio (Todos)</TabsTrigger>
              <TabsTrigger value="checklists">Apenas Checklists</TabsTrigger>
              <TabsTrigger value="pontuais">Tarefas Rápidas</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-none mb-4">
            <FiltrosTarefas />
          </div>

          {/* SPLIT VIEW (Conteúdo Principal Bi-Colunar Dinâmico) */}
          <div className="flex-1 flex gap-6 overflow-hidden">

            {/* LADO ESQUERDO: Lista Rolável c/ Estados (Skeleton/Vazio) */}
            <div className={`
              flex-1 w-full overflow-y-auto pb-12 pr-2 custom-scrollbar
              ${idTarefaSelecionada ? "hidden md:block lg:w-[65%]" : "block w-full"}
            `}>
              <ListaTarefas
                tarefas={tarefasFiltradas}
                idTarefaSelecionada={idTarefaSelecionada}
                isCarregando={isCarregando}
                erro={erro}
                vazio={vazio}
                aoSelecionarTarefa={setIdTarefaSelecionada}
                aoDuplicarTarefa={handleDuplicarTarefa}
                aoConcluirTarefa={handleConcluirTarefa}
                aoExcluirTarefa={handleExcluirTarefa}
              />
            </div>

            {/* LADO DIREITO: Detalhamento Leitura Completa */}
            <div className={`
              h-[95%] flex-none overflow-y-auto w-full md:w-[45%] lg:w-[35%] xl:w-[40%] custom-scrollbar mt-2
              ${idTarefaSelecionada ? "block" : "hidden md:block"}
            `}>
              <PainelDetalhesTarefa
                tarefa={tarefaAtualSendoDigerida}
                aoFechar={() => setIdTarefaSelecionada(null)}
                aoAlternarItemChecklist={handleAlternarItemChecklist}
                aoConcluirTarefa={handleConcluirTarefa}
              />
            </div>

          </div>
        </Tabs>
      </div>

      <ModalCriarTarefa
        aberto={isModalAberto}
        aoMudarEstado={setIsModalAberto}
        tipoPadrao={tipoRenderizacaoModal}
        aoGravar={async (dadosSeguros) => {
          const criada = await adicionarTarefa(dadosSeguros);
          setIdTarefaSelecionada(criada.id); // Foca e abre automaticamente o modal direito.
        }}
      />
    </div>
  );
}
