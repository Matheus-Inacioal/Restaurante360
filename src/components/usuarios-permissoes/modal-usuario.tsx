/**
 * Modal de Colaborador — Restaurante360
 * use-client safe
 */
"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Sparkles } from "lucide-react";
import type { PerfilUsuario, Cargo, NivelHierarquia } from "@/lib/tipos/identidade";

interface ModalUsuarioProps {
  aberto: boolean;
  aoFechar: () => void;
  usuarioEdicao: PerfilUsuario | null;
  cargos: Cargo[];
  unidades: { id: string; nome: string }[];
  niveisHierarquiaPermitidos: NivelHierarquia[];
  aoSalvar: (payload: any) => Promise<void>;
}

export function ModalUsuario({
  aberto,
  aoFechar,
  usuarioEdicao,
  cargos,
  unidades,
  niveisHierarquiaPermitidos,
  aoSalvar,
}: ModalUsuarioProps) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Estados dos inputs
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [nivelHierarquia, setNivelHierarquia] = useState<NivelHierarquia | "">("");
  const [unidadeId, setUnidadeId] = useState<string>("");
  const [cargoId, setCargoId] = useState<string>("");
  const [unidadeIds, setUnidadeIds] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("ativo");

  // Novo cargo temporário
  const [exibirCriarCargo, setExibirCriarCargo] = useState(false);
  const [novoCargoNome, setNovoCargoNome] = useState("");

  // Sincronizar inputs ao abrir para edição ou limpeza
  useEffect(() => {
    if (aberto) {
      setErro(null);
      setExibirCriarCargo(false);
      setNovoCargoNome("");

      if (usuarioEdicao) {
        setNome(usuarioEdicao.nome);
        setEmail(usuarioEdicao.email);
        setNivelHierarquia(usuarioEdicao.nivelHierarquia || "");
        setUnidadeId(usuarioEdicao.unidadeId || "todas");
        setCargoId(usuarioEdicao.cargoId || "nenhum");
        setStatus(usuarioEdicao.status || "ativo");
        
        // Unidades vinculadas
        const vinculos = (usuarioEdicao as any).unidadesVinculadas || [];
        setUnidadeIds(vinculos.map((v: any) => v.unidadeId));
      } else {
        setNome("");
        setEmail("");
        setNivelHierarquia("");
        setUnidadeId("todas");
        setCargoId("nenhum");
        setUnidadeIds([]);
        setStatus("ativo");
      }
    }
  }, [aberto, usuarioEdicao]);

  const toggleUnidadeVinculada = (id: string, checked: boolean) => {
    setUnidadeIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  const handleCriarCargoRapido = async () => {
    if (!novoCargoNome.trim()) return;
    try {
      const res = await fetch("/api/sistema/cargos", {
        method: "POST",
        body: JSON.stringify({ nome: novoCargoNome })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok) {
          // Adiciona e seleciona o novo cargo
          cargos.push(json.data);
          setCargoId(json.data.id);
          setNovoCargoNome("");
          setExibirCriarCargo(false);
        }
      }
    } catch (err) {
      console.error("Erro ao criar cargo rápido:", err);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !nivelHierarquia) {
      setErro("Preencha todos os campos obrigatórios (*).");
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      // Mapeamento automático de papel baseado na hierarquia para compatibilidade com o sistema
      let papel = "operacional";
      if (nivelHierarquia === "MASTER_LOJA" || nivelHierarquia === "ADMINISTRADOR") {
        papel = "gestorCorporativo";
      } else if (nivelHierarquia === "ADMINISTRATIVO" || nivelHierarquia === "GESTOR_LOCAL") {
        papel = "gestorLocal";
      }

      const payload = {
        nome,
        email,
        nivelHierarquia,
        papel,
        unidadeId: unidadeId === "todas" ? null : unidadeId,
        cargoId: cargoId === "nenhum" ? null : cargoId,
        status,
        unidadeIds
      };

      await aoSalvar(payload);
      aoFechar();
    } catch (err: any) {
      console.error("Erro no modal ao salvar usuário:", err);
      setErro(err.message || "Falha ao salvar colaborador.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && aoFechar()}>
      <DialogContent className="sm:max-w-[550px] rounded-2xl border-none shadow-xl bg-white animate-in zoom-in duration-300">
        <DialogHeader className="pb-2 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">
            {usuarioEdicao ? "Editar Colaborador" : "Adicionar Novo Colaborador"}
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Configure dados, nível hierárquico e áreas do colaborador na empresa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSalvar} className="space-y-4 pt-4">
          {erro && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold leading-relaxed">
              {erro}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Nome */}
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <Label className="text-xs font-bold text-slate-600">Nome Completo *</Label>
              <Input
                placeholder="Ex: João Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="border-slate-200 focus:border-indigo-500 rounded-xl py-5"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <Label className="text-xs font-bold text-slate-600">E-mail Corporativo *</Label>
              <Input
                type="email"
                placeholder="Ex: joao@restaurante.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!usuarioEdicao}
                required
                className="border-slate-200 focus:border-indigo-500 rounded-xl py-5"
              />
            </div>

            {/* Hierarquia */}
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <Label className="text-xs font-bold text-slate-600">Nível Hierárquico *</Label>
              <Select
                value={nivelHierarquia}
                onValueChange={(val) => setNivelHierarquia(val as NivelHierarquia)}
              >
                <SelectTrigger className="border-slate-200 rounded-xl py-5 focus:ring-indigo-500 text-slate-700">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  {niveisHierarquiaPermitidos.map((n) => {
                    const rotulo =
                      n === "MASTER_LOJA"
                        ? "Master da Loja"
                        : n === "ADMINISTRADOR"
                        ? "Administrador"
                        : n === "ADMINISTRATIVO"
                        ? "Administrativo"
                        : n === "GESTOR_LOCAL"
                        ? "Gestor Local"
                        : "Colaborador";
                    return (
                      <SelectItem key={n} value={n} className="rounded-lg">
                        {rotulo}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Unidade Principal */}
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <Label className="text-xs font-bold text-slate-600">Unidade Principal *</Label>
              <Select value={unidadeId} onValueChange={setUnidadeId}>
                <SelectTrigger className="border-slate-200 rounded-xl py-5 focus:ring-indigo-500 text-slate-700">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  <SelectItem value="todas" className="rounded-lg">Todas as Unidades</SelectItem>
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="rounded-lg">
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cargo / Função */}
            <div className="flex flex-col gap-1.5 col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-600">Cargo / Função</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 rounded-lg p-1 font-semibold"
                  onClick={() => setExibirCriarCargo(!exibirCriarCargo)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Novo cargo rápido
                </Button>
              </div>

              {exibirCriarCargo ? (
                <div className="flex items-center gap-2 p-2 bg-slate-50 border rounded-xl animate-in slide-in-from-top-1 duration-200">
                  <Input
                    placeholder="Nome do novo cargo..."
                    value={novoCargoNome}
                    onChange={(e) => setNovoCargoNome(e.target.value)}
                    className="border-slate-200 rounded-lg py-4 flex-1 h-9 text-xs sm:text-sm bg-white"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg h-9 text-xs"
                    onClick={handleCriarCargoRapido}
                  >
                    Adicionar
                  </Button>
                </div>
              ) : (
                <Select value={cargoId} onValueChange={setCargoId}>
                  <SelectTrigger className="border-slate-200 rounded-xl py-5 focus:ring-indigo-500 text-slate-700">
                    <SelectValue placeholder="Selecione o Cargo..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100">
                    <SelectItem value="nenhum" className="rounded-lg">Sem Cargo Específico</SelectItem>
                    {cargos.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="rounded-lg">
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Status (Exibido apenas em edições) */}
            {usuarioEdicao && (
              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <Label className="text-xs font-bold text-slate-600">Status da Conta</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="border-slate-200 rounded-xl py-5 focus:ring-indigo-500 text-slate-700">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100">
                    <SelectItem value="ativo" className="rounded-lg">Ativo (Acesso Liberado)</SelectItem>
                    <SelectItem value="inativo" className="rounded-lg">Inativo (Acesso Bloqueado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Unidades Vinculadas (Multi-tenant multiunidade) */}
            <div className="flex flex-col gap-2 col-span-2 mt-2">
              <Label className="text-xs font-bold text-slate-600">
                Acesso Adicional a Unidades
              </Label>
              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/30">
                <ScrollArea className="h-24 pr-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {unidades.map((u) => {
                      const checked = unidadeIds.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          className="flex items-center gap-2 select-none cursor-pointer"
                          onClick={() => toggleUnidadeVinculada(u.id, !checked)}
                        >
                          <Checkbox
                            id={`vinculo-${u.id}`}
                            checked={checked}
                            onCheckedChange={(c) => toggleUnidadeVinculada(u.id, !!c)}
                            className="rounded-md border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Label 
                            className="text-xs font-bold text-slate-600 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {u.nome}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          {!usuarioEdicao && (
            <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex items-start gap-2.5 mt-2">
              <Sparkles className="h-4.5 w-4.5 text-amber-600 mt-0.5" />
              <p className="text-[10px] text-amber-700 leading-normal font-medium">
                O colaborador cadastrado receberá um convite por e-mail para configurar sua senha temporária e acessar o Restaurante360 de forma totalmente integrada.
              </p>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={aoFechar}
              disabled={salvando}
              className="border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={salvando}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all"
            >
              {salvando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Colaborador"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
