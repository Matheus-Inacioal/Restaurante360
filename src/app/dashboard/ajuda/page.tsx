'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function HelpPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Ajuda & Sobre</h2>
            </div>

            <Tabs defaultValue="user" className="space-y-4">
                <TabsList className="flex flex-wrap h-auto w-full justify-start gap-2">
                    <TabsTrigger value="user">Usuário</TabsTrigger>
                    <TabsTrigger value="manager">Gestor</TabsTrigger>
                    <TabsTrigger value="privacy">LGPD / Privacidade</TabsTrigger>
                    <TabsTrigger value="support">Contato e Suporte</TabsTrigger>
                </TabsList>

                {/* Tab 1: Usuário */}
                <TabsContent value="user" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Guia Rápido do Usuário</CardTitle>
                            <CardDescription>
                                Tire suas dúvidas operacionais de como utilizar o Restaurante360 no seu dia a dia.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>Como concluir tarefas e rotinas?</AccordionTrigger>
                                    <AccordionContent>
                                        Para concluir uma tarefa, acesse a aba lateral "Tarefas" e clique sobre o item pendente. Preencha o checklist (se houver) e clique no botão final de "Concluir" para salvar o estado e avisar os gestores.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                    <AccordionTrigger>Como anexar foto ou observação?</AccordionTrigger>
                                    <AccordionContent>
                                        Dentro dos detalhes da tarefa que você estiver executando, localize o ícone de clipe ou câmera fotográfica. Clique nele ou utilize a caixa de texto "Observações Adicionais" antes de salvar a tarefa finalizada para anexar evidências.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                    <AccordionTrigger>Como filtrar tarefas?</AccordionTrigger>
                                    <AccordionContent>
                                        No cabeçalho da seção de Tarefas, você encontrará os botões de filtro. Você pode filtrar por Status (pendentes, concluídas) ou até por etiqueta.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-4">
                                    <AccordionTrigger>Boas práticas do dia a dia</AccordionTrigger>
                                    <AccordionContent>
                                        <ul className="list-disc pl-5 mt-2 space-y-1">
                                            <li>Sempre registre fotos quando houver discrepâncias no estoque de suprimentos.</li>
                                            <li>Observe e cumpra o horário da rotina do sistema. Atrasos também são logados.</li>
                                            <li>Avise imediatamente um Gestor caso não tenha permissão para fechar uma rotina crítica.</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 2: Gestor */}
                <TabsContent value="manager" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Painel do Gestor</CardTitle>
                            <CardDescription>
                                Materiais de apoio e manuais sobre criação de rotinas, processos e estruturação das lojas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>Como criar e editar Processos (POP/SOP)?</AccordionTrigger>
                                    <AccordionContent>
                                        Vá em <strong>Processos</strong> na barra lateral esquerda e clique em "Novo Processo". Defina o título, anexe guias e adicione os passos obrigatórios do POP. Você pode editá-los a qualquer momento preservando a versão mais recente em log.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                    <AccordionTrigger>Como criar Rotinas recorrentes e atribuir responsáveis?</AccordionTrigger>
                                    <AccordionContent>
                                        No menu <strong>Rotinas</strong>, selecione a aba de Agendamentos. Escolha a frequência (Diária, Semanal, Mensal), defina a janela de horário de execução, selecione o Template desejado e escolha o cargo/usuário responsável pela aba.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                    <AccordionTrigger>Como criar Tarefas e Templates de Checklist?</AccordionTrigger>
                                    <AccordionContent>
                                        No painel de Tarefas, há um ícone "Nova Tarefa" no canto superior direito para despachos emergenciais (Tarefas Pontuais). Já para configurações de checklists que se repetem, os próprios POPs (Processos) servem de base estrutural, na qual você pode linkar com as rotinas.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-4">
                                    <AccordionTrigger>Uso de Relatórios e Exportação</AccordionTrigger>
                                    <AccordionContent>
                                        Navegue até o menu de Relatórios, limite a data desejada nos filtros do topo e utilize o botão "Exportar" na direita das tabelas gerenciais para baixar os resultados (formato CSV admitido para cruzamento avançado em planilhas externas).
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 3: Política, LGPD */}
                <TabsContent value="privacy" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Termos e Privacidade (LGPD)</CardTitle>
                            <CardDescription>
                                Informações de como os seus dados são manipulados perante à legislação em vigor e a nossa atuação transparente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <h4 className="font-semibold mb-1 text-base">Os Dados que o sistema coleta</h4>
                                <p className="text-muted-foreground">O acesso base requer a captura provisória ou permamente de alguns dados (Nome, e-mail para acesso, função/cargo). Ao longo do uso, também gravamos logs de execução de tarefas, geolocalização do app nativo logado (conforme autorização prévia) e arquivos de imagem associados como evidência.</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1 text-base">Utilização de Dados (Tratamento)</h4>
                                <p className="text-muted-foreground">Todos os dados e logs são manipulados única e exclusivamente para controle estatístico e avaliação operacional das unidades do restaurante. Não repassamos logs nominais dos colaboradores a parceiros que não sejam franqueadores da própria rotina atrelada ao contrato.</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1 text-base">Retenção de Arquivo Digital</h4>
                                <p className="text-muted-foreground">Fotos (anexos) de evidência são mantidas até 12 meses na galeria encriptada online. Documentos de Processos Operacionais são armazenados num modelo de versionamento ativo (nunca deletados enquanto o locatário assinar o sistema).</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1 text-base">Direitos dos Titulares de Dados</h4>
                                <p className="text-muted-foreground">Caso entenda ser necessário solicitar um Relatório de Tratamento ou correção documental sobre o seu perfil base de Colaborador (e exclusão), a comunicação legal deverá anteceder para <strong>lgpd-dpo@restaurante360-exemplo.com.br</strong> sob os termos da Lei 13.709/18.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 4: Suporte e Contato */}
                <TabsContent value="support" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Dúvidas em comum</CardTitle>
                                <CardDescription>Nossos canais oficiais de SLA para seu restaurante.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-muted px-4 py-3 rounded-md text-sm">
                                    <div className="font-medium text-foreground">E-mail:</div>
                                    <div className="text-muted-foreground">suporte@restaurante360-exemplo.com</div>
                                </div>
                                <div className="bg-muted px-4 py-3 rounded-md text-sm">
                                    <div className="font-medium text-foreground">WhatsApp - Urgências Nível Crítico:</div>
                                    <div className="text-muted-foreground">+55 (61) 9999-0000 <em>(Somente Gestores)</em></div>
                                </div>
                                <div className="bg-muted px-4 py-3 rounded-md text-sm">
                                    <div className="font-medium text-foreground">Horários de Operação:</div>
                                    <div className="text-muted-foreground">Segunda à Sexta, das 09:00h às 21:00h</div>
                                </div>

                                <div className="mt-8 pt-4 border-t border-border flex flex-col sm:flex-row justify-between text-xs text-muted-foreground items-center gap-2">
                                    <span>Plataforma Restaurante360</span>
                                    <span className="font-mono bg-muted/50 px-2 py-1 rounded">Versão Base 0.1.0</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Reportar problema</CardTitle>
                                <CardDescription>Achou um bug visível na interface ou algo parou de funcionar? Avise a nossa engenharia a qualquer momento enviando o caso detalhado.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                    <div className="grid gap-2">
                                        <Label htmlFor="nome">Nome ou Razão do Contrato</Label>
                                        <Input id="nome" placeholder="John Doe" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">E-mail de Retorno</Label>
                                        <Input id="email" type="email" placeholder="m@example.com" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="desc">Resumo do Problema (Passo a passo se possível)</Label>
                                        <Textarea
                                            id="desc"
                                            placeholder="Ao tentar criar a rotina x com a loja Y selecionada o botão..."
                                            className="min-h-[120px]"
                                        />
                                    </div>
                                    <Button type="button" className="w-full">
                                        Garantir Envio do Reporte!
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    );
}
