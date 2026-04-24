"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { fetchJSON } from "@/lib/http/fetch-json";
import Link from "next/link";

function RedefinirSenhaForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [novasSenhas, setNovasSenhas] = useState({ senha: "", confirmaSenha: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    if (!token) {
        return (
            <Card className="w-full max-w-md shadow-lg border-muted">
                <CardHeader className="space-y-1 text-center pb-6">
                    <div className="mx-auto bg-destructive/10 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-destructive">
                        <ShieldAlert className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight">Link Inválido</CardTitle>
                    <CardDescription className="px-2">
                        O link de redefinição de senha está incompleto ou inválido. Verifique o link recebido por e-mail.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="pt-2">
                    <Button asChild className="w-full">
                        <Link href="/login">Voltar para Login</Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (sucesso) {
        return (
            <Card className="w-full max-w-md shadow-lg border-muted">
                <CardHeader className="space-y-1 text-center pb-6">
                    <div className="mx-auto bg-success/10 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-success">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight">Senha Atualizada</CardTitle>
                    <CardDescription className="px-2">
                        Sua senha foi redefinida com sucesso. Você já pode acessar sua conta.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="pt-2">
                    <Button asChild className="w-full">
                        <Link href="/login">Ir para Login</Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    const handleRedefinir = async (e: React.FormEvent) => {
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
            const res = await fetchJSON('/api/auth/redefinir-senha', {
                method: "POST",
                autenticar: false, // Rota pública
                body: JSON.stringify({
                    token,
                    novaSenha: novasSenhas.senha
                })
            });

            if (res.ok) {
                setSucesso(true);
            }
        } catch (error: any) {
            toast({ 
                title: "Falha na Redefinição", 
                description: error.message || "Não foi possível redefinir sua senha. O link pode estar expirado.", 
                variant: "destructive" 
            });
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-lg border-muted">
            <CardHeader className="space-y-1 text-center pb-6">
                <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-primary">
                    <KeyRound className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold tracking-tight">Criar Nova Senha</CardTitle>
                <CardDescription className="px-2">
                    Defina uma nova senha para acessar sua conta.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleRedefinir}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="novaSenha">Nova Senha</Label>
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
                                Redefinindo...
                            </>
                        ) : (
                            "Redefinir Senha"
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function RedefinirSenhaPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
            <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>}>
                <RedefinirSenhaForm />
            </Suspense>
        </div>
    );
}
