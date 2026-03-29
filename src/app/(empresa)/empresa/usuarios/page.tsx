"use client";

import { useState } from "react";
import { Plus, UserPlus, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        erro,
        vazio,
        adicionarUsuario,
        editarUsuario,
        redefinirSenha,
        inativar,
        reativar,
        recarregarUsuarios,
    } = useUsuarios();

    // Estado do Modal
    const [modalAberto, setModalAberto] = useState(false);
    const [usuarioEdicao, setUsuarioEdicao] = useState<UsuarioSistema | null>(null);

    // MOCK: Usuário logado atualmente simulado para a trava de Auto-Inativação
    // TODO: Substituir pelo uid real do useAuth()
    const USUARIO_LOGADO_ID = "usr_admin_001";

    const handleSalvar = async (payload: any) => {
        if (usuarioEdicao) {
            await editarUsuario(usuarioEdicao.id, payload);
        } else {
            await adicionarUsuario(payload);
        }
    };

    const abrirModalNovo = () => {
        setUsuarioEdicao(null);
        setModalAberto(true);
    };

    const abrirModalEdicao = (usuario: UsuarioSistema) => {
        setUsuarioEdicao(usuario);
        setModalAberto(true);
    };

    const handleRedefinirSenha = async (email: string, nome: string) => {
        await redefinirSenha(email, nome);
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
                        <Button onClick={abrirModalNovo}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo colaborador
                        </Button>
                    </div>
                </div>

                {/* ESTADO: Carregando */}
                {isCarregando && usuarios.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-16 text-muted-foreground">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
                        <p>Carregando base de usuários...</p>
                    </div>
                )}

                {/* ESTADO: Erro */}
                {!isCarregando && erro && (
                    <div className="flex flex-col items-center justify-center p-16 bg-card rounded-xl border shadow-sm">
                        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Erro ao carregar</h3>
                        <p className="text-muted-foreground text-center mb-4 max-w-md">
                            {erro}
                        </p>
                        <Button variant="outline" onClick={recarregarUsuarios}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Tentar novamente
                        </Button>
                    </div>
                )}

                {/* ESTADO: Vazio */}
                {!isCarregando && !erro && vazio && (
                    <div className="flex flex-col items-center justify-center p-16 bg-card rounded-xl border shadow-sm">
                        <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum colaborador cadastrado</h3>
                        <p className="text-muted-foreground text-center mb-6 max-w-md">
                            Comece adicionando seu primeiro colaborador à equipe. Ele receberá um link para definir sua própria senha.
                        </p>
                        <Button onClick={abrirModalNovo}>
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar primeiro colaborador
                        </Button>
                    </div>
                )}

                {/* ESTADO: Sucesso (com dados) */}
                {!isCarregando && !erro && !vazio && (
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
                                onRedefinirSenha={handleRedefinirSenha}
                            />
                        </div>
                    </>
                )}

                {/* MODAL GLOBAL DA TELA */}
                <ModalUsuario
                    aberto={modalAberto}
                    aoFechar={() => setModalAberto(false)}
                    usuarioEdicao={usuarioEdicao}
                    aoSalvar={handleSalvar}
                />
            </div>
        </div>
    );
}
