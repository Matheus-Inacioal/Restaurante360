/**
 * Painel de Permissões — Restaurante360
 * use-client safe
 */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ShieldCheck, 
  Search, 
  CheckSquare, 
  Square, 
  Loader2, 
  Sparkles, 
  FileText 
} from "lucide-react";
import type { PerfilUsuario } from "@/lib/tipos/identidade";
import type { ItemMatrizPermissao } from "@/lib/repositories/repositorio-permissoes";

interface PainelPermissoesProps {
  usuario: PerfilUsuario;
  permissaoLogadoPodeAlterar: (perm: string) => boolean;
  matriz: ItemMatrizPermissao[];
  carregando: boolean;
  salvando: boolean;
  onSalvar: (permissoes: { permissaoId: string; concedido: boolean }[]) => Promise<any>;
}

export function PainelPermissoes({
  usuario,
  permissaoLogadoPodeAlterar,
  matriz,
  carregando,
  salvando,
  onSalvar,
}: PainelPermissoesProps) {
  const [busca, setBusca] = useState("");
  const [estadoPermissoes, setEstadoPermissoes] = useState<Record<string, boolean>>({});

  // Sincronizar o estado interno quando a matriz de permissões for carregada do backend
  useEffect(() => {
    const mapa: Record<string, boolean> = {};
    for (const p of matriz) {
      mapa[p.id] = p.concedida;
    }
    setEstadoPermissoes(mapa);
  }, [matriz]);

  // Agrupa as permissões por módulo
  const modulosMapeados: Record<string, string> = {
    DASHBOARD: "Dashboard",
    TAREFAS: "Tarefas",
    CHECKLISTS: "Checklists",
    ROTINAS: "Rotinas",
    RECEITAS_POPS: "Receitas e POPs",
    OCORRENCIAS: "Ocorrências",
    PONTO_ESCALA: "Ponto e Escala",
    USUARIOS_PERMISSOES: "Usuários e Permissões",
    RELATORIOS: "Relatórios",
    CONFIGURACOES_UNIDADE: "Configurações da Unidade",
  };

  const alternarPermissao = (id: string, concedido: boolean) => {
    // Busca a permissão na matriz para validar alçada do autor
    const permObj = matriz.find(p => p.id === id);
    if (permObj && !permissaoLogadoPodeAlterar(permObj.nome)) {
      // Se o autor não possui a permissão, ele não pode alterá-la para os outros
      return;
    }
    
    setEstadoPermissoes((prev) => ({
      ...prev,
      [id]: concedido,
    }));
  };

  const alternarModuloCompleto = (modulo: string, conceder: boolean) => {
    const permsDoModulo = matriz.filter((p) => p.modulo === modulo);
    const atualizacao: Record<string, boolean> = {};

    for (const p of permsDoModulo) {
      // Apenas altera se o autor logado possuir a permissão na sua própria alçada
      if (permissaoLogadoPodeAlterar(p.nome)) {
        atualizacao[p.id] = conceder;
      }
    }

    setEstadoPermissoes((prev) => ({
      ...prev,
      ...atualizacao,
    }));
  };

  const handleSalvar = async () => {
    const payload = Object.entries(estadoPermissoes).map(([permissaoId, concedido]) => ({
      permissaoId,
      concedido,
    }));
    await onSalvar(payload);
  };

  // Filtra permissões pela busca
  const permissoesFiltradas = matriz.filter((p) => {
    const termo = busca.toLowerCase();
    return (
      p.nome.toLowerCase().includes(termo) ||
      p.descricao.toLowerCase().includes(termo) ||
      modulosMapeados[p.modulo]?.toLowerCase().includes(termo)
    );
  });

  // Agrupa as filtradas para exibição
  const grupos: Record<string, typeof matriz> = {};
  for (const p of permissoesFiltradas) {
    if (!grupos[p.modulo]) grupos[p.modulo] = [];
    grupos[p.modulo].push(p);
  }

  // Verifica se o usuário é Master da loja (tem acesso total e não pode ser editado)
  const isMaster = usuario.nivelHierarquia === "MASTER_LOJA";

  return (
    <Card className="border border-slate-100 rounded-2xl shadow-sm overflow-hidden bg-white h-full flex flex-col min-h-[500px]">
      <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              Painel de Permissões
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Gerencie os acessos do colaborador <span className="font-semibold text-slate-700">{usuario.nome}</span>
            </CardDescription>
          </div>
          {!isMaster && (
            <Button 
              onClick={handleSalvar} 
              disabled={salvando || carregando} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all self-end sm:self-auto"
            >
              {salvando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Permissões"
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Trava Master */}
        {isMaster && (
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <h4 className="font-bold text-indigo-800 text-sm">Usuário Master</h4>
              <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed font-medium">
                Este colaborador possui privilégios de Master da Loja. O acesso é irrestrito e total para todos os módulos e áreas de negócio do sistema por padrão.
              </p>
            </div>
          </div>
        )}

        {/* Busca rápida */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar permissão no catálogo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            disabled={carregando}
            className="pl-10 pr-4 py-5 border-slate-200 focus:border-indigo-500 rounded-xl transition-all"
          />
        </div>

        {/* Listagem em Rolagem */}
        <div className="flex-1 overflow-hidden">
          {carregando ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm font-semibold">Carregando permissões do colaborador...</p>
            </div>
          ) : permissoesFiltradas.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-slate-50 border border-dashed rounded-2xl">
              <FileText className="h-10 w-10 text-slate-400 mb-2" />
              <p className="text-sm font-semibold">Nenhuma permissão corresponde à busca.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] sm:h-[450px] pr-2">
              <div className="space-y-6">
                {Object.entries(grupos).map(([modulo, perms]) => {
                  const moduloNome = modulosMapeados[modulo] || modulo;
                  
                  // Verifica se todas do módulo estão ativas na alçada do autor
                  const permsPermitidas = perms.filter(p => permissaoLogadoPodeAlterar(p.nome));
                  const todasAtivas = permsPermitidas.length > 0 && permsPermitidas.every((p) => estadoPermissoes[p.id]);

                  return (
                    <div key={modulo} className="border border-slate-100 rounded-2xl p-4 shadow-sm bg-slate-50/20">
                      {/* Cabeçalho do Módulo */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <div className="flex flex-col">
                          <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                            {moduloNome}
                          </h4>
                          <span className="text-xs text-muted-foreground font-medium">
                            {perms.length} capacidades
                          </span>
                        </div>
                        {!isMaster && permsPermitidas.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs hover:bg-slate-100 hover:text-indigo-600 transition-all font-semibold"
                              onClick={() => alternarModuloCompleto(modulo, !todasAtivas)}
                            >
                              {todasAtivas ? "Desmarcar todos" : "Selecionar todos"}
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Lista de checkboxes das Permissões */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {perms.map((p) => {
                          const ativa = estadoPermissoes[p.id] ?? false;
                          const podeAlterar = permissaoLogadoPodeAlterar(p.nome);
                          
                          return (
                            <div 
                              key={p.id} 
                              className={`flex items-start gap-3 p-3 border rounded-xl bg-white transition-all select-none ${
                                ativa 
                                  ? "border-indigo-100 bg-indigo-50/10 shadow-sm" 
                                  : "border-slate-100 hover:border-slate-200"
                              } ${(!podeAlterar || isMaster) ? "opacity-75" : "cursor-pointer"}`}
                              onClick={() => {
                                if (podeAlterar && !isMaster) {
                                  alternarPermissao(p.id, !ativa);
                                }
                              }}
                            >
                              <Checkbox
                                id={p.id}
                                checked={ativa}
                                disabled={!podeAlterar || isMaster}
                                onCheckedChange={(checked) => {
                                  alternarPermissao(p.id, !!checked);
                                }}
                                className="mt-0.5 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded-md h-4.5 w-4.5 border-slate-300"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex flex-col gap-0.5">
                                <Label 
                                  className={`text-xs sm:text-sm font-bold text-slate-700 cursor-pointer ${
                                    (!podeAlterar || isMaster) ? "pointer-events-none" : ""
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {p.descricao}
                                </Label>
                                <span className="text-[10px] text-muted-foreground font-mono font-medium">
                                  {p.nome}
                                </span>
                                {!podeAlterar && (
                                  <span className="text-[9px] text-amber-600 font-semibold mt-1">
                                    Sem permissão própria para gerenciar
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
