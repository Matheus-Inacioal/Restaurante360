'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Lock, Fingerprint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ConfiguracoesSistemaPage() {
    const { toast } = useToast();

    const handleFeatureEmBreve = () => {
        toast({ title: "Em breve", description: "Estas configurações serão disponibilizadas na fase 1." });
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações do Produto</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Configurações globais, feature flags e parâmetros do SaaS.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-primary" />
                            Identidade do Produto
                        </CardTitle>
                        <CardDescription>Personalização de nome e logos do sistema base.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" onClick={handleFeatureEmBreve}>Configurar Identidade (Em breve)</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Fingerprint className="h-5 w-5 text-primary" />
                            Feature Flags
                        </CardTitle>
                        <CardDescription>Habilitação de recursos beta para as empresas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="secondary" onClick={handleFeatureEmBreve}>Gerenciar Features (Em breve)</Button>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-primary" />
                            Segurança & LGPD
                        </CardTitle>
                        <CardDescription>Termos e condições, política de privacidade global do serviço.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" asChild>
                                <Link href="/operacional/ajuda">Acessar base de ajuda legal</Link>
                            </Button>
                            <span className="text-sm text-muted-foreground">Termos definitivos sendo revisados (Em breve).</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
