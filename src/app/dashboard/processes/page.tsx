"use client";

import { useState } from "react";
import { useProcessos } from "@/hooks/use-processos";
import { CabecalhoProcessos } from "@/components/processos/cabecalho-processos";
import { ListaProcessos } from "@/components/processos/lista-processos";
import { PainelDetalhesProcesso } from "@/components/processos/painel-detalhes-processo";
import { ModalCriarProcesso } from "@/components/processos/modal-criar-processo";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Processo } from "@/lib/types/processos";

export default function ProcessosPage() {
    const { processos, processoSelecionadoId, setProcessoSelecionadoId, isCarregando, excluirProcesso } = useProcessos();

    const [modalCriacaoAberto, setModalCriacaoAberto] = useState(false);
    const [processoParaEdicao, setProcessoParaEdicao] = useState<Processo | null>(null);

    const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
    const [processoParaExclusao, setProcessoParaExclusao] = useState<Processo | null>(null);

    const handlePrepararEdicao = (processo: Processo) => {
        setProcessoParaEdicao(processo);
        setModalCriacaoAberto(true);
    };

    const handleFecharModalCriacaoEdicao = (abrir: boolean) => {
        setModalCriacaoAberto(abrir);
        if (!abrir) {
            // Tempo do dismiss animation
            setTimeout(() => setProcessoParaEdicao(null), 300);
        }
    };

    const handlePrepararExclusao = (processo: Processo) => {
        setProcessoParaExclusao(processo);
        setModalExclusaoAberto(true);
    };

    const handleConfirmarExclusao = async () => {
        if (!processoParaExclusao) return;

        await excluirProcesso(processoParaExclusao.id);

        // Se excluiu o que estava lendo, limpa ou mostra o próximo e prioriza a usabilidade.
        if (processoSelecionadoId === processoParaExclusao.id) {
            const index = processos.findIndex(p => p.id === processoParaExclusao.id);
            if (processos.length > 1) {
                // Tenta selecionar o proximo, senao o anterior
                const nextId = processos[index + 1]?.id || processos[index - 1]?.id;
                setProcessoSelecionadoId(nextId);
            } else {
                setProcessoSelecionadoId(null);
            }
        }

        setModalExclusaoAberto(false);
        setTimeout(() => setProcessoParaExclusao(null), 300);
    };

    if (isCarregando) {
        return (
            <div className="flex-1 p-4 md:p-8 pt-6 flex flex-col items-center justify-center opacity-50 space-y-4">
                <div className="w-8 h-8 rounded-full border-b-2 border-primary animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse">Recuperando procedimentos operacionais...</p>
            </div>
        );
    }

    const processoAtivo = processos.find(p => p.id === processoSelecionadoId) || null;

    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] p-4 md:p-8 pt-6">
            <CabecalhoProcessos
                totalProcessos={processos.length}
                aoCriarNovo={() => { setProcessoParaEdicao(null); setModalCriacaoAberto(true); }}
            />

            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 pb-4">
                <div className="md:col-span-5 lg:col-span-4 h-[400px] md:h-full relative">
                    <ListaProcessos
                        processos={processos}
                        processoSelecionadoId={processoSelecionadoId}
                        aoSelecionar={setProcessoSelecionadoId}
                        aoEditar={handlePrepararEdicao}
                        aoExcluir={handlePrepararExclusao}
                    />
                </div>

                <div className="md:col-span-7 lg:col-span-8 h-[600px] md:h-full relative">
                    <PainelDetalhesProcesso
                        processo={processoAtivo}
                        aoEditar={handlePrepararEdicao}
                        aoExcluir={handlePrepararExclusao}
                    />
                </div>
            </div>

            {/* Modais Anexos */}
            <ModalCriarProcesso
                aberto={modalCriacaoAberto}
                aoMudarEstado={handleFecharModalCriacaoEdicao}
                aoSucesso={setProcessoSelecionadoId}
                processoInicial={processoParaEdicao}
            />

            <AlertDialog open={modalExclusaoAberto} onOpenChange={setModalExclusaoAberto}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Processo Padrão?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover o processo <strong>"{processoParaExclusao?.titulo}"</strong> e todo o seu catálogo de passos da biblioteca?
                            <br className="mb-2" />
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmarExclusao}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir da Base
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
