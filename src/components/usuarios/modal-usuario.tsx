"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
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

    // Senhas UI
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [redefinirAtivo, setRedefinirAtivo] = useState(false);

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
            setSenha("");
            setConfirmarSenha("");
            setMostrarSenha(false);
            setRedefinirAtivo(false);
        }
    }, [aberto, usuarioEdicao]);

    const forca = (() => {
        if (!senha) return { label: "", color: "bg-transparent", score: 0 };
        let score = 0;
        if (senha.length >= 8) score++;
        if (/[A-Z]/.test(senha)) score++;
        if (/[0-9]/.test(senha)) score++;
        if (/[^A-Za-z0-9]/.test(senha)) score++;

        if (score < 2) return { label: "Fraca", color: "bg-red-500", score };
        if (score < 4) return { label: "Média", color: "bg-amber-500", score };
        return { label: "Forte", color: "bg-green-500", score };
    })();

    const gerarSenha = () => {
        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const special = "!@#$%^&*";
        const all = uppercase + lowercase + numbers + special;
        let p = "";
        p += uppercase[Math.floor(Math.random() * uppercase.length)];
        p += numbers[Math.floor(Math.random() * numbers.length)];
        p += special[Math.floor(Math.random() * special.length)];
        for (let i = 0; i < 9; i++) {
            p += all[Math.floor(Math.random() * all.length)];
        }
        // Shuffle (opcional mas bom)
        p = p.split('').sort(() => 0.5 - Math.random()).join('');
        setSenha(p);
        setConfirmarSenha(p);
        setMostrarSenha(true);
    };

    const validarForm = () => {
        if (!nome.trim() || !email.trim() || !papel) return false;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;

        const exigindoSenha = !isEdicao || redefinirAtivo;
        if (exigindoSenha) {
            if (senha.length < 8) return false;
            if (senha !== confirmarSenha) return false;
        }

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
                payload.senha = senha;
            } else if (redefinirAtivo) {
                payload.novaSenha = senha;
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

                    {/* Divisória Segurança */}
                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Segurança
                            </span>
                        </div>
                    </div>

                    {/* Seção Redefinir Senha (Se Edição) */}
                    {isEdicao && !redefinirAtivo && (
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => setRedefinirAtivo(true)}
                            type="button"
                        >
                            Nova Senha e Acessos
                        </Button>
                    )}

                    {(!isEdicao || redefinirAtivo) && (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            {isEdicao && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-amber-600">Redefinição de Senha Ativa</span>
                                    <Button variant="link" size="sm" onClick={() => setRedefinirAtivo(false)} className="h-auto p-0 text-muted-foreground">Cancelar</Button>
                                </div>
                            )}
                            <div className="grid gap-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="senha">
                                        {isEdicao ? "Nova Senha" : "Senha de Acesso"} <span className="text-red-500">*</span>
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={gerarSenha}
                                        className="text-xs flex items-center text-primary hover:underline"
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Gerar forte
                                    </button>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="senha"
                                        type={mostrarSenha ? "text" : "password"}
                                        placeholder="Mínimo de 8 caracteres"
                                        value={senha}
                                        onChange={(e) => setSenha(e.target.value)}
                                        disabled={criando}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMostrarSenha(!mostrarSenha)}
                                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                    >
                                        {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {/* Indicador Força */}
                                {senha.length > 0 && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 flex h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-300 ${forca.color}`} style={{ width: `${(forca.score / 4) * 100}%` }} />
                                        </div>
                                        <span className={`text-[10px] font-medium uppercase ${forca.color.replace('bg-', 'text-')}`}>
                                            {forca.label}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="confirmacao">
                                    Confirmar Senha <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="confirmacao"
                                    type={mostrarSenha ? "text" : "password"}
                                    placeholder="Repita a senha sugerida"
                                    value={confirmarSenha}
                                    onChange={(e) => setConfirmarSenha(e.target.value)}
                                    disabled={criando}
                                />
                                {confirmarSenha && senha !== confirmarSenha && (
                                    <span className="text-xs text-red-500 font-medium">As senhas não coincidem.</span>
                                )}
                            </div>

                            <p className="text-[11px] text-muted-foreground text-center">
                                As senhas são armazenadas com segurança através de hash criptográfico local (não texto-puro).
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-2 text-right">
                    <Button variant="outline" onClick={aoFechar} disabled={criando}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSalvar} disabled={!validarForm() || criando}>
                        {criando ? "Salvando..." : "Salvar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
