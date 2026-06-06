/**
 * Tabela de Usuários — Restaurante360
 * use-client safe
 */
"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  UserMinus, 
  Search, 
  Briefcase, 
  MapPin 
} from "lucide-react";
import type { PerfilUsuario } from "@/lib/tipos/identidade";

interface TabelaUsuariosProps {
  usuarios: PerfilUsuario[];
  usuarioLogadoId?: string;
  usuarioSelecionadoId?: string;
  onSelecionarUsuario: (usuario: PerfilUsuario) => void;
  onEditarUsuario: (usuario: PerfilUsuario) => void;
  onDesativarUsuario: (id: string) => void;
}

export function TabelaUsuarios({
  usuarios,
  usuarioLogadoId,
  usuarioSelecionadoId,
  onSelecionarUsuario,
  onEditarUsuario,
  onDesativarUsuario,
}: TabelaUsuariosProps) {
  const [busca, setBusca] = useState("");

  const usuariosFiltrados = usuarios.filter((u) => {
    const termo = busca.toLowerCase();
    return (
      u.nome.toLowerCase().includes(termo) ||
      u.email.toLowerCase().includes(termo) ||
      (u.nivelHierarquia && u.nivelHierarquia.toLowerCase().includes(termo))
    );
  });

  const renderBadgeHierarquia = (nivel: string | null) => {
    if (!nivel) return <Badge variant="outline">Sem nível</Badge>;

    switch (nivel) {
      case "MASTER_LOJA":
        return (
          <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold border-none shadow-sm py-1">
            Master da Loja
          </Badge>
        );
      case "ADMINISTRADOR":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 py-1 font-medium">
            Administrador
          </Badge>
        );
      case "ADMINISTRATIVO":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 py-1 font-medium">
            Administrativo
          </Badge>
        );
      case "GESTOR_LOCAL":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 py-1 font-medium">
            Gestor Local
          </Badge>
        );
      case "COLABORADOR":
        return (
          <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20 py-1 font-medium">
            Colaborador
          </Badge>
        );
      default:
        return <Badge variant="outline">{nivel}</Badge>;
    }
  };

  const obterIniciais = (nome: string) => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtro e Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar colaborador por nome, e-mail ou cargo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10 pr-4 py-6 border-slate-200 focus:border-indigo-500 rounded-xl transition-all"
        />
      </div>

      {/* Tabela de Usuários */}
      <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-semibold text-slate-600">Colaborador</TableHead>
              <TableHead className="font-semibold text-slate-600">Hierarquia</TableHead>
              <TableHead className="font-semibold text-slate-600">Unidade</TableHead>
              <TableHead className="font-semibold text-slate-600 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuariosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  Nenhum colaborador encontrado para a busca.
                </TableCell>
              </TableRow>
            ) : (
              usuariosFiltrados.map((u) => {
                const isSelecionado = u.id === usuarioSelecionadoId;
                const isAtivo = u.status === "ativo";

                return (
                  <TableRow 
                    key={u.id} 
                    className={`hover:bg-slate-50/60 transition-colors cursor-pointer group ${
                      isSelecionado ? "bg-indigo-50/40 hover:bg-indigo-50/60" : ""
                    }`}
                    onClick={() => onSelecionarUsuario(u)}
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 font-semibold">
                            {obterIniciais(u.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className={`font-semibold text-slate-800 ${!isAtivo ? "line-through text-slate-400" : ""}`}>
                            {u.nome}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      {renderBadgeHierarquia(u.nivelHierarquia)}
                    </TableCell>
                    
                    <TableCell className="py-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{(u as any).unidade?.nome || "Todas unidades"}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded-lg transition-all"
                          onClick={() => onSelecionarUsuario(u)}
                          title="Gerenciar Permissões"
                        >
                          <ShieldCheck className="h-4.5 w-4.5" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-slate-100 text-slate-500 rounded-lg transition-all"
                          onClick={() => onEditarUsuario(u)}
                          title="Editar Dados"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>

                        {isAtivo && u.id !== usuarioLogadoId && u.nivelHierarquia !== "MASTER_LOJA" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-rose-50 text-rose-500 rounded-lg transition-all"
                            onClick={() => onDesativarUsuario(u.id)}
                            title="Desativar Colaborador"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
