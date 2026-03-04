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
import { repositorioUsuarios } from "@/lib/repositories/repositorio-usuarios";
import { calcularRotaInicial } from "@/lib/redirecionamento";

export default function LoginPage() {
    const router = useRouter();
    const { signInWithEmailAndPassword } = useAuth();

    const [credenciais, setCredenciais] = useState({ email: "", senha: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!credenciais.email || !credenciais.senha) {
            toast({ title: "Preencha todos os campos", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await signInWithEmailAndPassword(credenciais.email, credenciais.senha);
            const uid = result.user.uid;

            // Force block any fake-redirects. Fetch user RBAC strictly.
            const perfil = await repositorioUsuarios.obterPerfilPorUid(uid);

            if (perfil) {
                const url = calcularRotaInicial(perfil);
                router.replace(url);
            } else {
                router.replace("/perfil-nao-provisionado");
            }

        } catch (error: any) {
            console.error("Erro no login:", error);
            const message = error.code === "auth/invalid-credential"
                ? "E-mail ou senha incorretos."
                : "Erro ao autenticar. Tente novamente.";

            toast({ title: "Falha de Login", description: message, variant: "destructive" });
            setIsSubmitting(false); // Only free up if failed, keep loading UI if navigating success.
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
        </div>
    );
}
