"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { UsuarioSistema, PapelUsuario } from "@/lib/types/usuarios";

interface ModalUsuarioProps {
    aberto: boolean;
    aoFechar: () => void;
    usuarioEdicao: UsuarioSistema | null;
    aoSalvar: (dados: any) => Promise<void>;
}

export function ModalUsuario({
    aberto,
    aoFechar,
    usuarioEdicao,
    aoSalvar,
}: ModalUsuarioProps) {
    const isEdicao = !!usuarioEdicao;

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [papel, setPapel] = useState<PapelUsuario | "">("");
    const [telefone, setTelefone] = useState("");
    const [criando, setCriando] = useState(false);

    // Preencher form
    useEffect(() => {
        if (aberto) {
            if (usuarioEdicao) {
                setNome(usuarioEdicao.nome);
                setEmail(usuarioEdicao.email);
                setPapel(usuarioEdicao.papel);
                setTelefone(usuarioEdicao.telefone || "");
            } else {
                setNome("");
                setEmail("");
                setPapel("");
                setTelefone("");
            }
        }
    }, [aberto, usuarioEdicao]);

    const validarForm = () => {
        if (!nome.trim() || !email.trim() || !papel) return false;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;

        return true;
    };

    const handleSalvar = async () => {
        if (!validarForm()) return;

        setCriando(true);
        try {
            const payload: any = {
                nome: nome.trim(),
                email: email.trim(),
                papel: papel as PapelUsuario,
                telefone: telefone.trim() || undefined,
            };

            if (!isEdicao) {
                payload.status = "ativo";
            }

            await aoSalvar(payload);
            aoFechar();
        } catch (error) {
            // Toast do hook já trata o feedback.
        } finally {
            setCriando(false);
        }
    };

    return (
        <Dialog open={aberto} onOpenChange={(open) => !open && aoFechar()}>
            <DialogContent className="sm:max-w-[460px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdicao ? "Editar usuário" : "Novo usuário"}</DialogTitle>
                    <DialogDescription>
                        {isEdicao
                            ? "Atualize os dados e o papel de acesso do colaborador."
                            : "Cadastre um novo colaborador de sistema."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Dados Básicos */}
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nome">
                                Nome completo <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="nome"
                                placeholder="Ex.: Maria Albuquerque"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                disabled={criando}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">
                                E-mail <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="maria@exemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={criando}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="papel">
                                    Papel <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={papel}
                                    onValueChange={(val) => setPapel(val as PapelUsuario)}
                                    disabled={criando}
                                >
                                    <SelectTrigger id="papel">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                        <SelectItem value="gestor">Gestor</SelectItem>
                                        <SelectItem value="operacional">Operacional</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="telefone">Telefone</Label>
                                <Input
                                    id="telefone"
                                    placeholder="(00) 00000-0000"
                                    value={telefone}
                                    onChange={(e) => setTelefone(e.target.value)}
                                    disabled={criando}
                                />
                            </div>
                        </div>
                    </div>

                </div>

                {!isEdicao && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg border text-sm text-muted-foreground text-center">
                        <p className="font-medium text-foreground mb-1">Sobre o acesso:</p>
                        <p>Uma senha temporária será gerada automaticamente. O colaborador receberá um link por e-mail para definir sua própria senha.</p>
                    </div>
                )}
                <DialogFooter className="mt-2 text-right">
                    <Button variant="outline" onClick={aoFechar} disabled={criando}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSalvar} disabled={!validarForm() || criando}>
                        {criando ? "Salvando..." : "Salvar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
