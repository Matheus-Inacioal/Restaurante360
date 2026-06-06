/**
 * Página de Gestão de Usuários e Permissões — Restaurante360
 * use-client safe
 */
"use client";

import { useState } from "react";
import { useUsuariosPermissoes } from "@/hooks/use-usuarios-permissoes";
import { usePermissoes } from "@/hooks/use-permissoes";
import { useUnidades } from "@/hooks/use-unidades";
import { TabelaUsuarios } from "@/components/usuarios-permissoes/tabela-usuarios";
import { PainelPermissoes } from "@/components/usuarios-permissoes/painel-permissoes";
import { HistoricoAuditoria } from "@/components/usuarios-permissoes/historico-auditoria";
import { ModalUsuario } from "@/components/usuarios-permissoes/modal-usuario";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  ShieldCheck, 
  History, 
  Plus, 
  Fingerprint, 
  AlertTriangle, 
  Sparkles 
} from "lucide-react";
import type { PerfilUsuario, NivelHierarquia } from "@/lib/tipos/identidade";

export default function UsuariosPermissoesPage() {
  const { toast } = useToast();
  const { pode, nivel: nivelLogado } = usePermissoes();
  const { unidades, carregando: carregandoUnidades } = useUnidades();
  
  const {
    usuarios,
    cargos,
    carregando,
    erro,
    vazio,
    usuarioSelecionado,
    matrizPermissoes,
    carregandoPermissoes,
    historicoAuditoria,
    carregandoAuditoria,
    selecionarUsuario,
    salvarPermissoes,
    adicionarUsuario,
    editarUsuario,
    inativarColaborador,
  } = useUsuariosPermissoes();

  // Estados locais da página
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEdicao, setUsuarioEdicao] = useState<PerfilUsuario | null>(null);
  const [salvandoPermissoes, setSalvandoPermissoes] = useState(false);

  const handleSalvarPermissoes = async (payload: { permissaoId: string; concedido: boolean }[]) => {
    if (!usuarioSelecionado) return;
    try {
      setSalvandoPermissoes(true);
      await salvarPermissoes(usuarioSelecionado.id, payload);
      toast({
        title: "Permissões atualizadas!",
        description: `As capacidades de ${usuarioSelecionado.nome} foram salvas com sucesso.`,
      });
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description: err.message || "Falha ao gravar permissões no servidor.",
        variant: "destructive",
      });
    } finally {
      setSalvandoPermissoes(false);
    }
  };

  const handleSalvarUsuario = async (payload: any) => {
    try {
      if (usuarioEdicao) {
        await editarUsuario(usuarioEdicao.id, payload);
        toast({
          title: "Colaborador atualizado!",
          description: "Os dados foram gravados com sucesso.",
        });
      } else {
        await adicionarUsuario(payload);
        toast({
          title: "Colaborador adicionado!",
          description: "Um e-mail de ativação foi enviado.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Falha na operação",
        description: err.message || "Não foi possível gravar os dados.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleDesativar = async (id: string) => {
    if (confirm("Tem certeza de que deseja desativar este colaborador? Ele perderá acesso imediatamente.")) {
      try {
        await inativarColaborador(id);
        toast({
          title: "Colaborador desativado!",
          description: "O acesso foi bloqueado com sucesso.",
        });
      } catch (err: any) {
        toast({
          title: "Erro ao desativar",
          description: err.message || "Não foi possível desativar.",
          variant: "destructive",
        });
      }
    }
  };

  const abrirModalNovo = () => {
    setUsuarioEdicao(null);
    setModalAberto(true);
  };

  const abrirModalEdicao = (usuario: PerfilUsuario) => {
    setUsuarioEdicao(usuario);
    setModalAberto(true);
  };

  // Define os níveis hierárquicos que o logado pode gerenciar/criar
  const obterNiveisPermitidos = (nivel: NivelHierarquia | null): NivelHierarquia[] => {
    if (!nivel) return [];
    const niveis: NivelHierarquia[] = [
      "MASTER_LOJA",
      "ADMINISTRADOR",
      "ADMINISTRATIVO",
      "GESTOR_LOCAL",
      "COLABORADOR",
    ];
    const index = niveis.indexOf(nivel);
    if (index === -1) return [];
    return niveis.slice(index); // Retorna ele mesmo e todos os inferiores
  };

  const niveisPermitidos = obterNiveisPermitidos(nivelLogado);

  const podeGerenciarUsuarios = pode("usuarios:criar") || pode("usuarios:editar");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Topo da página */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
            <Fingerprint className="h-8 w-8 text-indigo-600 animate-pulse" />
            Hierarquia e Acessos
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Defina cargos, controle níveis hierárquicos e refine as permissões de acesso da sua equipe.
          </p>
        </div>
        
        {podeGerenciarUsuarios && (
          <Button 
            onClick={abrirModalNovo}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md py-6 transition-all"
          >
            <Plus className="mr-2 h-5 w-5" />
            Novo Colaborador
          </Button>
        )}
      </div>

      {/* Grid Duas Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna Esquerda (Abas de Tabela e Auditoria) */}
        <div className="lg:col-span-7 space-y-6">
          <Tabs defaultValue="colaboradores" className="w-full">
            <TabsList className="bg-slate-100 rounded-xl p-1 w-full sm:w-auto mb-4 border border-slate-200/55">
              <TabsTrigger 
                value="colaboradores" 
                className="rounded-lg font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm px-4 py-2"
              >
                <Users className="h-4 w-4 mr-2" />
                Colaboradores
              </TabsTrigger>
              <TabsTrigger 
                value="auditoria"
                className="rounded-lg font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm px-4 py-2"
              >
                <History className="h-4 w-4 mr-2" />
                Logs de Auditoria
              </TabsTrigger>
            </TabsList>

            {/* Conteúdo: Tabela de Usuários */}
            <TabsContent value="colaboradores" className="mt-0">
              {erro ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white border border-rose-100 rounded-2xl shadow-sm text-center">
                  <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
                  <h4 className="font-bold text-slate-800 text-lg">Erro ao carregar colaboradores</h4>
                  <p className="text-slate-500 text-sm mt-1 max-w-sm">
                    {erro}
                  </p>
                </div>
              ) : (
                <TabelaUsuarios
                  usuarios={usuarios}
                  usuarioLogadoId={usuarioSelecionado?.id}
                  usuarioSelecionadoId={usuarioSelecionado?.id}
                  onSelecionarUsuario={selecionarUsuario}
                  onEditarUsuario={abrirModalEdicao}
                  onDesativarUsuario={handleDesativar}
                />
              )}
            </TabsContent>

            {/* Conteúdo: Histórico de Auditoria */}
            <TabsContent value="auditoria" className="mt-0">
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <HistoricoAuditoria 
                  historico={historicoAuditoria}
                  carregando={carregandoAuditoria}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Coluna Direita (Painel de Permissões) */}
        <div className="lg:col-span-5 h-full">
          {usuarioSelecionado ? (
            <PainelPermissoes
              usuario={usuarioSelecionado}
              permissaoLogadoPodeAlterar={pode}
              matriz={matrizPermissoes}
              carregando={carregandoPermissoes}
              salvando={salvandoPermissoes}
              onSalvar={handleSalvarPermissoes}
            />
          ) : (
            <Card className="border border-dashed border-slate-200 rounded-2xl p-10 shadow-sm bg-slate-50/20 text-center h-[500px] flex flex-col items-center justify-center gap-4 select-none">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full animate-bounce">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  Gerenciamento de Acesso
                </h3>
                <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto font-medium">
                  Selecione um colaborador na lista da esquerda para gerenciar ou customizar suas permissões operacionais e de gestão.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal global */}
      <ModalUsuario
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        usuarioEdicao={usuarioEdicao}
        cargos={cargos}
        unidades={unidades}
        niveisHierarquiaPermitidos={niveisPermitidos}
        aoSalvar={handleSalvarUsuario}
      />
    </div>
  );
}
