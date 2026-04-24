"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { fetchJSON } from "@/lib/http/fetch-json";
import { calcularRotaInicial } from "@/lib/redirecionamento";
import type { PerfilUsuario } from "@/lib/tipos/identidade";
import { DialogEsqueciSenha } from "@/components/auth/DialogEsqueciSenha";

export default function LoginPage() {
    const router = useRouter();
    const { entrarComEmailSenha, logout } = useAuth();

    const [credenciais, setCredenciais] = useState({ email: "", senha: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!credenciais.email || !credenciais.senha) {
            toast({ title: "Preencha todos os campos", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);

        const result = await entrarComEmailSenha(credenciais.email, credenciais.senha);

        if (!result.ok) {
            toast({ title: "Falha de Login", description: result.message, variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

        const uid = result.uid;

        try {
            // Busca perfil do PostgreSQL via API (autenticado com Bearer Token Firebase)
            const resPostal = await fetchJSON<PerfilUsuario>('/api/auth/perfil');

            if (!resPostal.ok) {
                await logout();
                const msg = 'message' in resPostal ? resPostal.message : 'Perfil não encontrado.';
                toast({ title: "Acesso Restrito", description: msg, variant: "destructive" });
                setIsSubmitting(false);
                return;
            }

            const perfil = resPostal.data;

            if (perfil.status === 'inativo') {
                await logout();
                toast({ title: "Acesso Negado", description: "Usuário desativado. Contate o administrador.", variant: "destructive" });
                setIsSubmitting(false);
                return;
            }

            if (perfil.mustResetPassword === true) {
                console.info("LOGIN_SUCCESS: Usuário forçado a redefinir a senha provisória.");
                router.replace("/login/alterar-senha");
                return;
            }

            // Redireciona para o portal correto baseado no papel
            const url = calcularRotaInicial(perfil);
            console.info(`LOGIN_SUCCESS: Redirecionando para ${url} (papel: ${perfil.papel})`);
            router.replace(url);

        } catch (error: any) {
            console.error("Erro interno ao validar Perfil:", error);
            await logout();
            toast({ title: "Erro Inesperado", description: "Falha ao validar permissões de usuário.", variant: "destructive" });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-lg border-muted">
                <CardHeader className="space-y-1 text-center pb-6">
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <LogIn className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Restaurante360</CardTitle>
                    <CardDescription>
                        Insira suas credenciais para acessar seu painel.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nome@exemplo.com"
                                value={credenciais.email}
                                onChange={(e) => setCredenciais({ ...credenciais, email: e.target.value })}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Senha</Label>
                                <button
                                    type="button"
                                    className="text-sm text-primary hover:underline"
                                    onClick={() => setIsForgotPasswordOpen(true)}
                                    disabled={isSubmitting}
                                >
                                    Esqueceu sua senha?
                                </button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={credenciais.senha}
                                onChange={(e) => setCredenciais({ ...credenciais, senha: e.target.value })}
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
                                    Entrando...
                                </>
                            ) : (
                                "Entrar"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <DialogEsqueciSenha
                open={isForgotPasswordOpen}
                onOpenChange={setIsForgotPasswordOpen}
                emailInicial={credenciais.email}
            />
        </div>
    );
}
