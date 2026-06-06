/**
 * Histórico de Auditoria de Permissões — Restaurante360
 * use-client safe
 */
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  Search, 
  User, 
  ArrowRight, 
  CalendarClock, 
  ShieldAlert 
} from "lucide-react";
import type { AuditoriaPermissao } from "@/lib/tipos/identidade";

interface HistoricoAuditoriaProps {
  historico: AuditoriaPermissao[];
  carregando: boolean;
}

export function HistoricoAuditoria({ historico, carregando }: HistoricoAuditoriaProps) {
  const [busca, setBusca] = useState("");

  const logsFiltrados = historico.filter((log) => {
    const termo = busca.toLowerCase();
    return (
      log.permissao.toLowerCase().includes(termo) ||
      (log.usuario?.nome || "").toLowerCase().includes(termo) ||
      (log.autor?.nome || "").toLowerCase().includes(termo) ||
      log.modulo.toLowerCase().includes(termo)
    );
  });

  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr);
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const renderBadgeAcao = (acao: string) => {
    switch (acao) {
      case "CONCEDIDA":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold py-0.5 text-[10px]">
            Concedida
          </Badge>
        );
      case "REVOGADA":
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-100 font-semibold py-0.5 text-[10px]">
            Revogada
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-100 font-semibold py-0.5 text-[10px]">
            {acao}
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-[400px]">
      {/* Topo do Histórico */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-600 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-800">
            Registro de Auditoria
          </h3>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar nos logs..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            disabled={carregando}
            className="pl-9 pr-3 py-4 border-slate-200 focus:border-indigo-500 rounded-xl text-xs sm:text-sm h-9"
          />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-hidden">
        {carregando ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            <p className="text-xs font-semibold">Carregando logs de alteração...</p>
          </div>
        ) : logsFiltrados.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-slate-50 border border-dashed rounded-2xl">
            <ShieldAlert className="h-10 w-10 text-slate-400 mb-2" />
            <p className="text-xs font-semibold">Nenhum log de auditoria encontrado.</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px] sm:h-[400px] pr-2">
            <div className="space-y-3.5">
              {logsFiltrados.map((log) => (
                <div 
                  key={log.id} 
                  className="flex flex-col gap-2 p-3.5 border border-slate-100 rounded-2xl bg-white hover:shadow-sm transition-all"
                >
                  {/* Linha 1: Autor e Ação */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-indigo-500" />
                      <span className="font-bold text-slate-700">{log.autor?.nome || "Sistema"}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">({log.autor?.email})</span>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-auto text-[10px]">
                      <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatarData(log.criadoEm)}</span>
                    </div>
                  </div>

                  {/* Linha 2: O que aconteceu */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-50 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Concedeu</span>
                    <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold border-none text-[10px]">
                      {log.permissao}
                    </Badge>
                    <span className="text-slate-500 font-medium">para</span>
                    <span className="font-bold text-slate-700">{log.usuario?.nome || "Ex-colaborador"}</span>
                    
                    <div className="ml-auto flex items-center gap-2">
                      {renderBadgeAcao(log.acao)}
                    </div>
                  </div>

                  {/* Linha 3: Módulo */}
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
                    <span>Módulo:</span>
                    <span className="text-indigo-600 font-bold">{log.modulo}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
