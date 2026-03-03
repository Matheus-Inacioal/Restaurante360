"use client";

import { useState } from "react";
import { Plus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUsuarios } from "@/hooks/use-usuarios";
import type { UsuarioSistema } from "@/lib/types/usuarios";

// Sub-componentes
import { KpisUsuarios } from "@/components/usuarios/kpis-usuarios";
import { TabelaUsuarios } from "@/components/usuarios/tabela-usuarios";
import { ModalUsuario } from "@/components/usuarios/modal-usuario";

export default function UsuariosPage() {
    const {
        usuarios,
        isCarregando,
        adicionarUsuario,
        editarUsuario,
        alterarSenha,
        inativar,
        reativar
    } = useUsuarios();

    // MOCK: Usuário logado atualmente simulado para a trava de Auto-Inativação
    const USUARIO_LOGADO_ID = "usr_admin_001";

    // Estado do Modal
    const [modalAberto, setModalAberto] = useState(false);
    const [usuarioEdicao, setUsuarioEdicao] = useState<UsuarioSistema | null>(null);

    const handleSalvar = async (payload: any) => {
        if (usuarioEdicao) {
            const { novaSenha, ...rest } = payload;

            // Só edita dados se sobrou algo ou se alterou algo de fato
            if (Object.keys(rest).length > 0) {
                await editarUsuario(usuarioEdicao.id, rest);
            }

            // Se veio solicitação de nova senha, chama alterador (que gera hash/salt novo)
            if (novaSenha) {
                await alterarSenha(usuarioEdicao.id, novaSenha);
            }
        } else {
            const { senha, ...rest } = payload;
            await adicionarUsuario(rest, senha);
        }
        // Fechamento e Toast são resolvidos pelo próprio modal/hook
    };

    const abrirModalNovo = () => {
        setUsuarioEdicao(null);
        setModalAberto(true);
    };

    const abrirModalEdicao = (usuario: UsuarioSistema) => {
        setUsuarioEdicao(usuario);
        setModalAberto(true);
    };

    return (
        <div className="w-full px-4 sm:px-8 py-8">
            <div className="max-w-[1200px] mx-auto space-y-8 flex flex-col animate-in fade-in duration-500">
                {/* 1. TOPO: Título, Subtítulo e Botões de Ação */}
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
                        <p className="text-muted-foreground mt-1">
                            Gerencie acessos, papéis e permissões da equipe.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="hidden sm:inline-block">
                                        <Button
                                            variant="outline"
                                            disabled
                                            className="w-full"
                                        >
                                            <Mail className="mr-2 h-4 w-4" />
                                            Convidar por e-mail
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Em breve: convites com link seguro e expiração</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <Button onClick={abrirModalNovo}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo usuário
                        </Button>
                    </div>
                </div>

                {isCarregando && usuarios.length === 0 ? (
                    <div className="flex justify-center p-12 text-muted-foreground">
                        Carregando base de usuários...
                    </div>
                ) : (
                    <>
                        {/* 2. KPIs (Grid de Resumo) */}
                        <div className="mb-8">
                            <KpisUsuarios usuarios={usuarios} />
                        </div>

                        {/* 3. LISTAGEM */}
                        <div className="bg-card rounded-xl border shadow-sm p-4 sm:p-6 mb-8">
                            <TabelaUsuarios
                                usuarios={usuarios}
                                usuarioLogadoId={USUARIO_LOGADO_ID}
                                onEditar={abrirModalEdicao}
                                onInativar={inativar}
                                onReativar={reativar}
                            />
                        </div>

                        {/* MODAL GLOBAL DA TELA */}
                        <ModalUsuario
                            aberto={modalAberto}
                            aoFechar={() => setModalAberto(false)}
                            usuarioEdicao={usuarioEdicao}
                            aoSalvar={handleSalvar}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
