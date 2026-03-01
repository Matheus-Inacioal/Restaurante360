# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2026-03-01

### Adicionado
- **Busca Global**: Implementação do Command Palette (Cmd+K) categorizando resultados de tarefas, rotinas, processos e usuários, com navegação rápida.
- **Notificações**: Central de notificações funcional no cabeçalho com contador em tempo real, dropdown interativo e ações de leitura usando persistência local.
- **Configurações de Usuário**: Nova tela de gerenciamento (`/dashboard/configuracoes`) subdividida analiticamente nas guias Conta, Preferências, Segurança e Privacidade LGPD.
- **Seletor de Período Customizado**: Componente interativo de calendário (date range popover) adicionado na tela de relatórios para filtragem.
- **Exportação Multiformato Avançada**: Nova capacidade de exportar relatórios gerenciais combinando todas as abas ativas em um único pacote `.xlsx`.

### Alterado
- **Cabeçalho Principal (Topbar)**: Refatoração substituindo barras de pesquisa passivas e ícones estáticos pela montagem dos novos widgets funcionais acoplados.

### Técnico
- `deps`: Inclusão das primitivas de acessibilidade do Radix UI (Popover, Command, Tabs) via shadcn/ui.
- `deps`: Bibliotecas base (`cmdk`, `date-fns`, `xlsx`, `uuid`).
- Correções de tipagem e padronização da importação do core UI em páginas relativas.


## [0.4.0] - 2026-02-25

### Arquitetura e Engenharia (Padrão SaaS)
- Tradução integral do Domínio de Tarefas para Português-BR (Componentes Visuais, Tipagens TS, Hooks e Chaves de Persistência).
- Implementação ativa do Multi-Tenant no repositório local, isolando e blindando consultas sob o escopo obrigatório de `empresaId`.

### Governança
- Obrigatoriedade de autoria da transação inserida nativamente (`criadoPor` e timestamps locais `criadoEm`/`atualizadoEm` nas gravações de banco).

### UI/UX
- Refatoração da Lista para aderência aos "4 Estados de Interface": inserção de Loading Skeletons/Spinners dinâmicos, Tratativas de Erro Customizadas e CTAs Otimizados para Estados Vazios.

## [0.3.0] - 2026-02-25

### Arquitetura
- Consolidação oficial do Repository Pattern.
- Formalização do fluxo UI → Hook → Repositório.
- Estruturação por domínio modular.
- Proibição de acesso direto ao backend na camada de UI.

### Estrutura de Dados
- Unificação da entidade Task (Tarefa + Checklist).
- Introdução de checklistItems como diferenciador estrutural.
- Preparação para multi-tenant com empresaId obrigatório.
- Padronização do sistema de tipos.

### Governança
- Incorporação das diretrizes de LGPD ao manual de engenharia.
- Preparação para RBAC (controle por papel).
- Base para auditoria e logs estruturados.

### Preparação para Escala
- Dashboard evoluído para modelo Command Center.
- Arquitetura Split-View na gestão de tarefas.
- Central de Ajuda estruturada.
- Preparação para futura integração com Firebase.
