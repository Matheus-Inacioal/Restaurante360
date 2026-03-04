"use client";

import Link from "next/link";
import { LogOut, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

export default function PerfilNaoProvisionado() {
    const { logout } = useAuth();
    const router = useRouter();

    const handleSair = async () => {
        try {
            await logout();
            router.replace("/login");
        } catch (error) {
            toast({ title: "Erro ao sair", variant: "destructive" });
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
            <div className="max-w-md w-full bg-background border rounded-lg shadow-sm p-6 text-center">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <UserX className="h-6 w-6 text-muted-foreground" />
                </div>

                <h1 className="text-xl font-bold mb-2">Acesso Restrito</h1>
                <p className="text-muted-foreground mb-6">
                    Seu acesso ainda não foi provisionado. Fale com o administrador do sistema para liberar seu perfil.
                </p>

                <div className="flex flex-col gap-3">
                    <Button onClick={handleSair} variant="default" className="w-full">
                        Sair desta conta
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                        <Link href="/login">Voltar para Login</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
