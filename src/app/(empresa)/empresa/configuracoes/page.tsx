'use client';

import { useState } from 'react';
import { usePerfil } from '@/hooks/use-perfil';
import {
    User,
    Settings,
    ShieldCheck,
    Lock,
    HelpCircle,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';


import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function ConfiguracoesPage() {
    const { perfilUsuario, carregandoPerfil } = usePerfil();
    const usuarioLogado = perfilUsuario;

    // Mock dados
    const nomeUsuario = usuarioLogado?.nome || 'Administrador do Sistema';
    const emailUsuario = usuarioLogado?.email || 'admin@restaurante360.com.br';
    const iniciais = nomeUsuario.split(' ').map((n) => n[0]).join('').substring(0, 2);

    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSalvarPerfil = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const form = new FormData(e.currentTarget);
        const novoNome = form.get('nome') as string;

        try {
            // Usa o auth.currentUser.getIdToken() na aplicação real do Firebase
            // Para efeitos de backend NextJS SSR local, enviamos os dados
            const res = await fetch('/api/empresa/configuracoes/atualizar', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: novoNome })
            });
            const data = await res.json();

            if (res.ok) {
                toast({ title: 'Perfil atualizado', description: data.mensagem });
            } else {
                toast({ title: 'Erro', description: data.message, variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: 'Erro', description: 'Ocorreu um problema.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
                    <p className="text-muted-foreground mt-1">
                        Gerencie as preferências da sua conta, segurança e privacidade do sistema.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="conta" className="w-full mt-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="conta" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline-block">Conta</span>
                    </TabsTrigger>
                    <TabsTrigger value="preferencias" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline-block">Preferências</span>
                    </TabsTrigger>
                    <TabsTrigger value="seguranca" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="hidden sm:inline-block">Segurança</span>
                    </TabsTrigger>
                    <TabsTrigger value="privacidade" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <span className="hidden sm:inline-block">Privacidade</span>
                    </TabsTrigger>
                </TabsList>

                {/* ================= ABA: CONTA ================= */}
                <TabsContent value="conta" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Perfil Público</CardTitle>
                            <CardDescription>
                                Assim que você aparece para os outros usuários na empresa.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-6">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={usuarioLogado?.photoURL || ''} alt={nomeUsuario} />
                                    <AvatarFallback className="text-2xl">{iniciais}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <Button variant="outline" size="sm">Trocar foto</Button>
                                    <p className="text-xs text-muted-foreground w-full max-w-[200px]">
                                        Recomendado: imagem quadrada (JPG, PNG ou GIF) com pelo menos 200x200px.
                                    </p>
                                </div>
                            </div>
                            <Separator />
                            <form onSubmit={handleSalvarPerfil} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nome">Nome Completo</Label>
                                    <Input id="nome" name="nome" defaultValue={nomeUsuario} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">E-mail Principal</Label>
                                    <Input id="email" defaultValue={emailUsuario} disabled />
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Para alterar o seu endereço de e-mail, entre em contato com nosso suporte.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cargo">Cargo / Papel</Label>
                                    <Input id="cargo" defaultValue="Gerente Geral" disabled />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>


                {/* ================= ABA: PREFERÊNCIAS ================= */}
                <TabsContent value="preferencias" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Aparência do Sistema</CardTitle>
                            <CardDescription>
                                Ajuste o visual e o idioma da plataforma.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Interface (Tema)</h4>
                                    <div className="grid grid-cols-3 gap-2 max-w-[400px]">
                                        <Button variant="outline" className="justify-start">Padrão do Sistema</Button>
                                        <Button variant="outline" className="justify-start">Claro</Button>
                                        <Button variant="outline" className="justify-start">Escuro</Button>
                                    </div>
                                    <p className="text-[0.8rem] text-muted-foreground mt-2">
                                        Funcionalidade de temas visuais em construção.
                                    </p>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Idioma</h4>
                                    <Input value="Português do Brasil (pt-BR)" disabled className="max-w-[400px]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ================= ABA: SEGURANÇA ================= */}
                <TabsContent value="seguranca" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Segurança de Acesso</CardTitle>
                            <CardDescription>
                                Mantenha as chaves de acesso atualizadas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-sm font-medium">Troca de Senha</h4>
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Iremos lhe enviar um e-mail contendo um link de verificação seguro para renovar a senha original de sua conta.
                                    </p>
                                    <Button variant="outline" className="w-fit mt-2">
                                        Solicitar Redefinição de Senha
                                    </Button>
                                </div>
                                <Separator />
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-sm font-medium">Sessões Ativas</h4>
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Gerencie os computadores e celulares que no momento estão conectados como você.
                                    </p>
                                    <div className="rounded-md border p-4 bg-muted/40 mt-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-sm">Mac OS - Safari (Esta sessão)</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Entrou hj às 08:32</p>
                                            </div>
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Ativa</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ================= ABA: PRIVACIDADE ================= */}
                <TabsContent value="privacidade" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>LGPD e Privacidade de Dados</CardTitle>
                            <CardDescription>
                                Suas informações respeitam a legislação nacional de dados.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-sm text-foreground/80 leading-relaxed">
                                O Restaurante360 atua apenas como operador dos dados gerados por sua empresa em nosso Software como Serviço (SaaS).
                                Isso significa que processamos as informações em conformidade estrita com a Lei Geral de Proteção de Dados (13.709/18).
                            </p>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-lg border p-4 flex flex-col justify-between">
                                    <div>
                                        <h5 className="font-medium text-sm mb-1">Exportação de Dados</h5>
                                        <p className="text-xs text-muted-foreground">
                                            Os proprietários do aplicativo podem solicitar a varredura completa, bem como o esquecimento definitivo de toda a conta num prazo de 15 dias corridos.
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-lg border p-4 flex flex-col justify-between">
                                    <div>
                                        <h5 className="font-medium text-sm mb-1">Acesso a Suporte</h5>
                                        <p className="text-xs text-muted-foreground">
                                            A nossa central de especialistas está disponível para te ajudar com relatórios da LGPD diários.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Link href="/operacional/ajuda" passHref>
                                    <Button variant="secondary" className="w-full sm:w-auto">
                                        <HelpCircle className="h-4 w-4 mr-2" />
                                        Abrir Central de Ajuda
                                    </Button>
                                </Link>
                                <a
                                    href="#"
                                    className="inline-flex items-center justify-center text-sm text-muted-foreground hover:text-primary transition-colors ml-0 sm:ml-4 mt-4 sm:mt-0"
                                >
                                    Ler os Termos de Uso Completos
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}

// Criando um fallback local para o component Badge
function Badge({ children, className, variant }: any) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
            {children}
        </span>
    );
}
