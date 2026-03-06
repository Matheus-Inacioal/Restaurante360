"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, ShieldExclamation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { fetchJSON } from "@/lib/http/fetch-json";

export default function AlterarSenhaPage() {
    const router = useRouter();
    const { usuarioAuth, carregandoAuth } = useAuth();

    const [novasSenhas, setNovasSenhas] = useState({ senha: "", confirmaSenha: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Redireciona se não houver um usuário parcialmente autenticado
        if (!carregandoAuth && !usuarioAuth) {
            router.replace("/login");
        }
    }, [usuarioAuth, carregandoAuth, router]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (novasSenhas.senha.length < 8) {
            toast({ title: "Senha Curta", description: "A senha precisa de pelo menos 8 caracteres.", variant: "destructive" });
            return;
        }

        if (novasSenhas.senha !== novasSenhas.confirmaSenha) {
            toast({ title: "Senhas Diferentes", description: "A confirmação não coincide com a nova senha digitada.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetchJSON('/api/auth/alterar-senha', {
                method: "POST",
                body: JSON.stringify({
                    novaSenha: novasSenhas.senha
                })
            });

            if (res.ok) {
                toast({
                    title: "Senha Alterada",
                    description: "Sua senha foi atualizada com sucesso. Você será redirecionado para a plataforma."
                });

                // Força um pequeno atraso do NextRouter
                setTimeout(() => {
                    // Após a remoção do flag `mustResetPassword` no server, o front pode pedir o refresh da role ou ir pro dashboard
                    // Redirecionando pro painel raiz do gateway - ele o jogará pra home pertinente (.replace("/") repete cálculo de rotas no layout se houver)
                    window.location.href = "/";
                }, 1500);
            }
        } catch (error: any) {
            toast({ title: "Falha na Alteração", description: error.message || "Não foi possível alterar sua senha provisória.", variant: "destructive" });
            setIsSubmitting(false);
        }
    };

    if (carregandoAuth) {
        return <div className="min-h-screen flex items-center justify-center bg-muted/20"><Loader2 className="animate-spin text-primary" /></div>;
    }

    if (!usuarioAuth) return null; // Será interceptado pelo useEffect

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-lg border-muted">
                <CardHeader className="space-y-1 text-center pb-6">
                    <div className="mx-auto bg-warning/10 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-warning">
                        <ShieldExclamation className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight">Redefinição Obrigatória</CardTitle>
                    <CardDescription className="px-2">
                        Por motivos de segurança, sua senha temporária precisa ser substituída antes de prosseguir.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleChangePassword}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="novaSenha">Nova Senha Definitiva</Label>
                            <Input
                                id="novaSenha"
                                type="password"
                                placeholder="••••••••"
                                value={novasSenhas.senha}
                                onChange={(e) => setNovasSenhas({ ...novasSenhas, senha: e.target.value })}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirme sua Nova Senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={novasSenhas.confirmaSenha}
                                onChange={(e) => setNovasSenhas({ ...novasSenhas, confirmaSenha: e.target.value })}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                        <Button
                            type="submit"
                            className="w-full font-semibold"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Atualizando Cofre...
                                </>
                            ) : (
                                "Salvar Nova Senha e Acessar"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
