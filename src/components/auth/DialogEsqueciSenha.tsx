"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useToast } from "@/hooks/use-toast";
import { fetchJSON } from "@/lib/http/fetch-json";

const esqueciSenhaSchema = z.object({
    email: z.string().email("E-mail inválido."),
});

type EsqueciSenhaData = z.infer<typeof esqueciSenhaSchema>;

interface DialogEsqueciSenhaProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    emailInicial?: string;
}

export function DialogEsqueciSenha({ open, onOpenChange, emailInicial = "" }: DialogEsqueciSenhaProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        reset,
    } = useForm<EsqueciSenhaData>({
        resolver: zodResolver(esqueciSenhaSchema),
        defaultValues: { email: "" },
    });

    useEffect(() => {
        if (open) {
            reset();
            if (emailInicial) {
                setValue("email", emailInicial);
            }
        }
    }, [open, emailInicial, setValue, reset]);

    const onSubmit = async (data: EsqueciSenhaData) => {
        setIsSubmitting(true);
        try {
            // Chamada server-side — segurança: não usa Firebase client-side diretamente
            const res = await fetchJSON<{ debugLink?: string }>("/api/auth/enviar-reset", {
                method: "POST",
                body: JSON.stringify({ email: data.email }),
            });

            if (!res.ok) {
                const erro = res as any;
                const code = erro.code || "";
                let mensagem = "Não foi possível enviar o e-mail agora. Tente novamente.";
                if (code === "VALIDATION_ERROR") mensagem = "E-mail inválido.";

                toast({
                    title: "Não foi possível enviar",
                    description: mensagem,
                    variant: "destructive",
                });
                return;
            }

            // DEV: exibir link de debug se vier no JSON
            const debugLink = (res as any).debugLink;
            if (debugLink) {
                toast({
                    title: "DEV — Link de redefinição",
                    description: "Nenhum provedor de e-mail configurado. Link gerado abaixo.",
                    action: (
                        <button
                            className="text-xs underline whitespace-nowrap"
                            onClick={() => navigator.clipboard.writeText(debugLink)}
                        >
                            Copiar link
                        </button>
                    ) as any,
                    duration: 30000,
                });
                console.log(`[DEV LINK DE RESET] ${debugLink}`);
            } else {
                toast({
                    title: "E-mail enviado",
                    description: "Se o e-mail existir, você receberá um link para redefinir a senha.",
                });
            }

            onOpenChange(false);
        } catch (error) {
            toast({
                title: "Não foi possível enviar",
                description: "Não foi possível enviar o e-mail agora. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Redefinir senha</DialogTitle>
                        <DialogDescription>
                            Digite o e-mail da sua conta. Se ele estiver cadastrado, enviaremos instruções de redefinição.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="reset-email">E-mail</Label>
                            <Input
                                id="reset-email"
                                placeholder="nome@exemplo.com"
                                {...register("email")}
                                disabled={isSubmitting}
                                autoComplete="email"
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Enviando..." : "Enviar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
