# Restaurante360 — Auditoria Técnica e Documentação de Estado Atual

Esta documentação fornece uma análise completa e aprofundada da arquitetura, banco de dados, fluxos de negócio, permissões e estado de desenvolvimento do **Restaurante360**.

---

## 1. Visão Geral

### Nome do Projeto
**Restaurante360** (referenciado internamente no `package.json` como `nextn` e historicamente planejado no blueprint como `GourmetFlow`).

### Objetivo Principal
Centralizar, padronizar e automatizar a gestão operacional diária e a governança de conformidade em estabelecimentos do setor de alimentos e bebidas (A&B), convertendo checklists físicos em fluxos digitais auditáveis e gerando dados acionáveis sobre a performance das equipes.

### Público-Alvo
*   **Gestão Corporativa (Tenants/Franquias)**: Administradores e diretores de redes de restaurantes.
*   **Gestores Locais**: Gerentes de unidades específicas.
*   **Equipe Operacional**: Colaboradores da cozinha, salão, bar, limpeza, recepção, etc.
*   **Administradores da Plataforma (SaaS)**: Operadores da infraestrutura SaaS.

### Problemas que o Sistema Resolve
*   **Falta de Padronização**: Substitui checklists físicos de papel por processos estruturados na nuvem, garantindo conformidade.
*   **Inconsistência de Evidências**: Exige fotos reais capturadas na hora para a conclusão de tarefas críticas, reduzindo fraudes.
*   **Controle de Horas Ineficiente**: Substitui pontos manuais por um ponto geolocalizado com bloqueio por raio geográfico.
*   **Falta de Visibilidade Gerencial**: Oferece fechamento de banco de horas e relatórios consolidados em tempo real.
*   **Risco Regulatório**: Registra logs detalhados de transações e auditoria para fins trabalhistas e sanitários (LGPD).

### Fluxo Operacional
```
[Gestor Corporativo] ──> Cria Processos e Rotinas ──> [Sistema] Gera Tarefas Diárias
                                                             │
[Gestor Local] <── Acompanha Dashboard e Trata Ocorrências  <─┤
                                                             ▼
[Colaborador] ──> Faz Check-in (Ponto GPS) ──> Executa Tarefas (com Foto) ──> Conclui Checklist
```

---

## 2. Stack Tecnológica

### Frontend
*   **Framework**: Next.js v15.5.12 (utilizando App Router e Route Groups para portais).
*   **Linguagem**: TypeScript.
*   **Visualização**: Recharts v2.15.1 (gráficos de dashboard).
*   **Estilização**: Tailwind CSS v3.4.1 + Vanilla CSS (`src/app/globals.css`).
*   **UI Componentes**: Shadcn/ui (Radix UI Popover, Dialog, Tabs, Command, etc.).
*   **Validação & Forms**: React Hook Form v7.54.2 + Zod v3.24.2.

### Backend & Banco de Dados
*   **Banco de Dados**: PostgreSQL, acessado via Prisma Client v7.8.0.
*   **Driver Adapter**: `@prisma/adapter-pg` com pooler `pg` v8.20.0 para conexões robustas em dev/prod.
*   **Autenticação**: Própria da aplicação (Local Auth) baseada em hash Bcrypt (`bcryptjs` v2.4.3) e tokens JWT gerados via biblioteca `jose` v5.2.3 em cookies do tipo `httpOnly` (`r360_sessao`).
*   **Firebase (Remanescentes/Transição)**: O projeto iniciou com Firebase Spark (Firestore + Auth + Storage), mas migrou para PostgreSQL. Hoje, os scripts de migração (`/scripts`) utilizam `firebase-admin` v12/13 para extrair dados legados do Firestore para o PostgreSQL. Existe o arquivo `src/server/firebase/admin.ts` para suporte administrativo.

### Bibliotecas de Terceiros Importantes
*   `xlsx` (v0.18.5) e `jspdf`/`jspdf-autotable` (v4.2.0): Para exportações em Excel e geração de relatórios PDF.
*   `date-fns` (v3.6.0): Tratamento e formatação de datas.
*   `embla-carousel-react` (v8.6.0): Componentes de carrossel de mídias.
*   `genkit` e `@genkit-ai/google-genai`: Integrações de Inteligência Artificial Google GenAI / Genkit preparadas no diretório `src/ai`.

---

## 3. Arquitetura

O projeto adota uma arquitetura modular de Next.js com foco em **Repository Pattern** no backend para isolar a infraestrutura (Prisma) e garantir blindagem de Tenants (`empresaId`).

### Estrutura de Pastas
```
/Restaurante360
├── prisma/                       # Schema Prisma e seeds de banco de dados
├── scripts/                      # Scripts TS para migrações do Firestore
├── src/
│   ├── ai/                       # Desenvolvimento de recursos de IA (Genkit)
│   ├── app/                      # Next.js App Router (Rotas e APIs)
│   │   ├── (public)/             # Rotas públicas (/login)
│   │   ├── (sistema)/            # Rota /sistema (Portal SaaS Admin)
│   │   ├── (empresa)/            # Rota /empresa (Portal Gestor Corporativo)
│   │   ├── (unidade)/            # Rota /unidade (Portal Gestor Local)
│   │   ├── (operacional)/        # Rota /operacional (Portal Colaborador)
│   │   └── api/                  # Endpoints REST (com subpastas equivalentes)
│   ├── components/               # UI Components por domínio de negócio
│   ├── hooks/                    # Custom hooks cliente (REST API wrappers)
│   ├── lib/                      # Utilitários, tipos compartilhados e Prisma Client
│   │   ├── repositories/         # Repositórios client-side (chamadas HTTP API)
│   │   └── tipos/                # Tipos centrais do domínio da aplicação
│   └── server/                   # Lógica server-only (blindada contra vazamentos)
│       ├── auth/                 # Guards de segurança das APIs (garantirAcesso*)
│       ├── repositorios/         # Repositórios server-side PostgreSQL/Prisma
│       ├── servicos/             # Regras de negócio e transações de BD
│       └── http/                 # Respostas HTTP padrão e tratamentos de erro
```

### Fluxo de Dados

```
[UI Component] ──> [Custom Hook] ──> [Client Repository] ──> [Fetch HTTP REST]
                                                                    │
[BD PostgreSQL] <── [Prisma 7] <── [Server Service] <── [Server Guard / API Route]
```

1.  **Interface**: O componente UI intercepta a ação e consome um custom hook (ex: `useMeuPonto`).
2.  **Hook**: O Hook dispara uma chamada assíncrona ao repositório cliente (`repositorioPonto`).
3.  **Client Repository**: O repositório realiza um `fetch` na rota da API (ex: `/api/empresa/ponto/registrar`).
4.  **API Route / Guard**: A API recebe a requisição, valida o JWT através do helper de segurança (`garantirAcessoPonto`), e invoca o serviço do backend correspondente (`registrarPonto`).
5.  **Server Service**: O serviço roda regras de negócio (ex: cálculo de geolocalização e transição de jornada) e aciona o repositório server-side (`repositorioPontoPg`).
6.  **Server Repository / DB**: O repositório executa comandos via `prisma` escrevendo no PostgreSQL. A resposta retorna fazendo o caminho inverso, e o hook atualiza o estado local da UI.

---

## 4. Sistema de Autenticação e Autorização

### Funcionamento da Autenticação
*   **Login**: O usuário insere e-mail e senha no formulário (`src/app/(public)/login/page.tsx`). O Hook `useAuth` envia os dados para `/api/auth/login`. O backend valida a senha com o hash Bcrypt armazenado no PostgreSQL, gera um token JWT contendo os escopos (`uid`, `email`, `papel`, `empresaId`, `unidadeId`) e o armazena em um cookie seguro `r360_sessao` do tipo `httpOnly`.
*   **Sessão**: No carregamento, a aplicação chama `/api/auth/perfil` que decodifica o JWT usando a biblioteca `jose` e reconstrói o perfil do usuário logado na UI.
*   **Logout**: `/api/auth/logout` limpa o cookie `r360_sessao`.
*   **Redirecionamento**: Feito via `calcularRotaInicial` baseado no papel do usuário.

### Proteção de Rotas (Autorização)
*   **Frontend**: As rotas são divididas por Route Groups (`(sistema)`, `(empresa)`, etc.). Cada grupo possui um `layout.tsx` envelopado pelo componente `<GuardPortal portal="...">` (`src/components/guards/guard-portal.tsx`). Esse componente verifica se a role do usuário no JWT tem permissão para acessar aquele portal.
*   **Backend**: As rotas de API importam guards específicos como `garantirAcessoEmpresa` ou `garantirAcessoPonto`. Eles verificam o JWT, buscam o usuário no banco, certificam-se de que a empresa vinculada está ativa e garantem que o usuário não está acessando dados de outra empresa (isolamento multi-tenant).

---

## 5. Perfis, Níveis de Hierarquia e Permissões

O sistema possui duas camadas de controle de acesso: **Papel de Acesso Global (SaaS)** e **Níveis de Hierarquia de Unidade (RBAC)**.

### Papéis de Acesso Global (`PapelUsuario` Enum)
1.  **`saasAdmin`**: Acesso completo ao portal `/sistema` para gerenciar planos e empresas.
2.  **`gestorCorporativo`**: Administrador da empresa locatária. Acessa `/empresa`.
3.  **`gestorLocal`**: Gerente ou administrador local de uma unidade específica. Acessa `/unidade`.
4.  **`operacional`**: Funcionário operacional que realiza checklists e marca ponto. Acessa `/operacional`.

### Níveis de Hierarquia (`NivelHierarquia` Enum)
Os níveis de hierarquia possuem pesos numéricos para validação de superioridade:
*   `MASTER_LOJA` (Peso 5)
*   `ADMINISTRADOR` (Peso 4)
*   `ADMINISTRATIVO` (Peso 3)
*   `GESTOR_LOCAL` (Peso 2)
*   `COLABORADOR` (Peso 1)

*Regra de Governança*: Um usuário só pode criar, atualizar ou alterar permissões de outro usuário que possua um nível de hierarquia menor ou igual ao seu (excluindo colaboradores que não podem gerenciar ninguém, e Master da loja que tem permissão irrestrita).

### Matriz de Permissões
O Restaurante360 possui um catálogo extenso de permissões divididas em módulos (cadastradas na tabela `Permissao` e populadas no `prisma/seed.ts`):

| Módulo | Nome da Permissão | `saasAdmin` | `MASTER_LOJA` | `GESTOR_LOCAL` | `COLABORADOR` |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **DASHBOARD** | `dashboard:visualizar_geral` | Sim | Sim | Sim | Não |
| | `dashboard:visualizar_unidade` | Sim | Sim | Sim | Não |
| | `dashboard:visualizar_pendencias` | Sim | Sim | Sim | Não |
| **TAREFAS** | `tarefas:visualizar` | Sim | Sim | Sim | Sim |
| | `tarefas:criar` | Sim | Sim | Sim | Não |
| | `tarefas:concluir` | Sim | Sim | Sim | Sim |
| | `tarefas:validar` | Sim | Sim | Sim | Não |
| **CHECKLISTS** | `checklists:visualizar` | Sim | Sim | Sim | Sim |
| | `checklists:criar` / `checklists:editar` | Sim | Sim | Sim | Não |
| | `checklists:executar` | Sim | Sim | Sim | Sim |
| | `checklists:validar` | Sim | Sim | Sim | Não |
| **ROTINAS** | `rotinas:visualizar` | Sim | Sim | Sim | Sim |
| | `rotinas:criar` / `rotinas:editar` | Sim | Sim | Sim | Não |
| **OCORRÊNCIAS** | `ocorrencias:registrar` | Sim | Sim | Sim | Sim |
| | `ocorrencias:tratar` / `ocorrencias:concluir`| Sim | Sim | Sim | Não |
| **PONTO_ESCALA**| `ponto:bater` / `ponto:visualizar_proprio`| Não | Sim | Sim | Sim |
| | `ponto:visualizar_equipe` / `ponto:corrigir`| Não | Sim | Sim | Não |
| | `ponto:aprovar_ajuste` / `configurar_escala`| Não | Sim | Sim | Não |
| **USUÁRIOS** | `usuarios:criar` / `usuarios:editar` | Sim | Sim | Sim | Não |
| | `usuarios:alterar_permissoes` | Sim | Sim | Sim | Não |
| **RELATÓRIOS** | `relatorios:visualizar_ponto` / `exportar_pdf` | Sim | Sim | Sim | Não |

---

## 6. Módulos Implementados

### Dashboard
*   **Visão Geral**: Dashboard corporativo com visualização de pendências, progresso de checklists por setor e conformidade.
*   **Componentes**: `dashboard-charts.tsx` (gráficos de Recharts), `dashboard-cards.tsx` (KPIs de conformidade e ativos).
*   **Fontes de dados**: Endpoints `/api/empresa/dashboard` e `/api/sistema/dashboard`.

### Usuários (CRUD & Governança)
*   **Visão Geral**: Gestão completa de usuários corporativos com controle RBAC por perfil de acesso e hierarquia.
*   **Campos**: `id`, `email`, `nome`, `papel`, `status` (ativo/inativo), `nivelHierarquia`, `empresaId`, `unidadeId`, `areaId`, `funcaoId`, `perfilAcessoId`, `cargoId`.
*   **Governança**: `servico-hierarquia.ts` impede a criação de usuários superiores e valida permissões.
*   **Auditoria**: `AuditoriaPermissao` e `Auditoria` salvam alterações de privilégios com o autor e timestamps.

### Processos
*   **Visão Geral**: Modelagem de processos operacionais sequenciais (ex: abertura de restaurante, limpeza da cozinha).
*   **Campos**: `id`, `titulo`, `descricao`, `categoriaId`, `passos` (JSON contendo `[{id, titulo, descricao, exigeFoto}]`).
*   **Componentes**: `lista-processos.tsx`, `modal-criar-processo.tsx`, `painel-detalhes-processo.tsx`.

### Rotinas
*   **Visão Geral**: Modelagem de recorrência para tarefas e checklists diários, semanais ou mensais.
*   **Campos**: `id`, `titulo`, `frequencia` (diaria, semanal, mensal), `diasSemana` (array `[0..6]`), `diaDoMes`, `horarioPreferencial`, `responsavelPadraoId`, `checklistModelo` (JSON).
*   **Componentes**: `lista-rotinas.tsx`, `modal-criar-rotina.tsx`, `painel-detalhes-rotina.tsx`.

### Checklists
*   **Visão Geral**: Acompanhamento e execução de listas de tarefas operacionais.
*   **Estrutura Relacional (Firestore)**: Representado via coleções e subcoleções.
*   **Estrutura Relacional (PostgreSQL)**: Cadastrado na tabela `checklists_operacionais` contendo `etapas` como um JSON (`[{ ordem, texto, concluido, fotoUrl }]`).
*   *Nota*: Existe uma grande inconsistência entre a modelagem de checklist nos endpoints operacionais (ver seção 11 - Débitos Técnicos).

### Relatórios
*   **Visão Geral**: Tela com gráficos de conformidade, exportação multiformato de banco de ponto e performance de tarefas.
*   **Recursos**: Exportação XLSX avançada compilando planilhas, calendários popover customizados.
*   **Componentes**: `seletor-periodo-relatorios.tsx`.

### Check-in e Ponto Eletrônico
*   **Visão Geral**: Registro de jornada (entrada, intervalos e saídas) do colaborador com captura de geolocalização.
*   **Banco de Dados**: Tabelas `registros_ponto`, `pausas_ponto`, `justificativas_ponto`, `ajustes_ponto` e `banco_horas`.
*   **Geofencing**: O serviço `servico-registro-ponto.ts` compara o raio do colaborador com as coordenadas geográficas da Unidade (`unidade.latitude` e `unidade.longitude`) e bloqueia registros realizados fora da tolerância permitida.

### Tarefas
*   **Visão Geral**: Listagem e conclusão de atividades diárias pontuais ou recorrentes.
*   **Estrutura**: `itensVerificacao` (JSON `[{id, texto, concluido}]`).
*   **Componentes**: `lista-tarefas.tsx`, `painel-detalhes-tarefa.tsx`, `drawer-detalhes-tarefa.tsx`.

---

## 7. Mapeamento de Componentes (Tabela)

| Nome do Componente | Localização do Arquivo | Responsabilidade | Onde é Utilizado | Principais Dependências |
| :--- | :--- | :--- | :--- | :--- |
| `GuardPortal` | `src/components/guards/guard-portal.tsx` | Protege portais por papel de usuário na navegação cliente. | Layouts de portais (`(empresa)`, `(sistema)`, `(operacional)`) | `useAuth`, `usePerfil`, `podeAcessarPortal` |
| `CollaboratorDashboard` | `src/components/collaborator/collaborator-dashboard.tsx` | Exibe resumo do dia e atalhos para tarefas operacionais. | `/operacional/page.tsx` | `usePerfil`, `useTarefas`, `useToast` |
| `Header` | `src/components/header.tsx` | Cabeçalho comum do dashboard com Command Palette e Central de Notificações. | Layouts dos portais | `busca-global.tsx`, `notificacoes.tsx` |
| `BuscaGlobal` | `src/components/topbar/busca-global.tsx` | Caixa de busca global Cmd+K com classificação rápida. | `header.tsx` | `@/components/ui/command`, `cmdk`, `use-busca-global` |
| `NotificacoesDropdown` | `src/components/topbar/notificacoes.tsx` | Dropdown de alertas em tempo real. | `header.tsx` | `use-notificacoes`, `lucide-react` |
| `PainelPermissoes` | `src/components/usuarios-permissoes/painel-permissoes.tsx` | Matriz visual de ativação/customização de permissões por usuário. | `/sistema/usuarios-permissoes/page.tsx` | `use-usuarios-permissoes`, `useToast` |
| `TabelaUsuarios` | `src/components/usuarios-permissoes/tabela-usuarios.tsx` | Lista colaboradores mostrando status, papel e cargo. | `/sistema/usuarios-permissoes/page.tsx` | `Tabela Radix`, `lucide-react` |
| `HistoricoAuditoria` | `src/components/usuarios-permissoes/historico-auditoria.tsx` | Exibe histórico detalhado de concessões e revogações. | `/sistema/usuarios-permissoes/page.tsx` | `date-fns` |
| `ModalUsuario` | `src/components/usuarios-permissoes/modal-usuario.tsx` | Criar/editar usuários corporativos. | `/sistema/usuarios-permissoes/page.tsx` | `react-hook-form`, `zod` |
| `DashboardCharts` | `src/components/manager/dashboard-charts.tsx` | Renderiza gráficos de barras/linhas de conformidade. | `/empresa/page.tsx` | `recharts` |
| `DashboardCards` | `src/components/manager/dashboard-cards.tsx` | Grade com os KPIs principais (tarefas, checklists, equipe). | `/empresa/page.tsx` | `lucide-react` |
| `ModalCriarRotina` | `src/components/rotinas/modal-criar-rotina.tsx` | Formulário para criar rotinas recorrentes. | `/empresa/rotinas/page.tsx` | `react-hook-form`, `zod`, `use-rotinas` |
| `ModalCriarProcesso` | `src/components/processos/modal-criar-processo.tsx` | Cria processos e define passos e evidências fotográficas. | `/empresa/processos/page.tsx` | `react-hook-form`, `zod` |
| `SeletorPeriodoRelatorios`| `src/components/relatorios/seletor-periodo-relatorios.tsx` | Date range picker customizado para relatórios. | `/empresa/relatorios/page.tsx` | `react-day-picker`, `date-fns` |

---

## 8. Custom Hooks

| Nome do Hook | Localização do Arquivo | Responsabilidade | Onde é Utilizado | Melhorias Recomendadas |
| :--- | :--- | :--- | :--- | :--- |
| `useAuth` | `src/hooks/use-auth.ts` | Gerencia login, logout e validação de sessão contra cookies locais JWT. | LoginPage, guards, layouts | Adicionar interceptador HTTP de expiração automática de sessão (401). |
| `usePerfil` | `src/hooks/use-perfil.ts` | Carrega o perfil detalhado do usuário atualizado. | Guards, Sidebars, Header | Cachear no Context para evitar chamadas de revalidação redundantes. |
| `usePermissoes` | `src/hooks/use-permissoes.ts` | Checa permissões do usuário em cache de memória local. | Componentes de interface | Inserir revalidação de privilégios via Event Emitter em tempo real. |
| `useMeuPonto` | `src/hooks/use-meu-ponto.ts` | Controla geolocalização e envia batidas de ponto à API. | **Não utilizado no frontend** (Ignorado) | **Crítico**: Integrar urgentemente com a tela de check-in operacional. |
| `useRelatorios` | `src/hooks/use-relatorios.ts` | Compila dados e gera exportações XLSX multiformato. | `/empresa/relatorios/page.tsx` | Paginar consultas no backend para evitar quebra de memória do navegador. |
| `useTarefas` | `src/hooks/use-tarefas.ts` | Consome a API de CRUD de tarefas do Gestor. | Lista de tarefas do Gestor | Unificar estados com as tarefas geradas por rotinas. |
| `useChecklists` | `src/hooks/empresa/use-checklists.ts`| Consome a API REST de checklists operacionais. | Gestor checklists | Corrigir tratamento de erros e paginação. |

---

## 9. Banco de Dados: PostgreSQL (Mapeamento de Tabelas)

O banco de dados do Restaurante360 está modelado no PostgreSQL via Prisma. Abaixo, o diagrama textual simplificado das tabelas operacionais e de identidade:

```text
empresas (Locatário)
 ├── id (cuid) [PK]
 ├── nome (String)
 ├── cnpj (String) [UQ]
 └── status (StatusEmpresa: TRIAL_ATIVO, ATIVO, GRACE, SUSPENSO, CANCELADO)

unidades (Locais físicos)
 ├── id (cuid) [PK]
 ├── empresaId (cuid) [FK -> empresas.id]
 ├── nome (String)
 └── latitude, longitude, raioPermitidoMetros (Para Geolocalização do Ponto)

usuarios (Colaboradores e Credenciais)
 ├── id (cuid) [PK]
 ├── email (String) [UQ]
 ├── nome (String)
 ├── papel (PapelUsuario: saasAdmin, gestorCorporativo, gestorLocal, operacional)
 ├── nivelHierarquia (NivelHierarquia: MASTER_LOJA, ADMINISTRADOR, ADMINISTRATIVO, GESTOR_LOCAL, COLABORADOR)
 ├── status (StatusAtivo: ativo, inativo)
 ├── senhaHash (String) (Bcrypt local, sem dependência do Firebase Auth)
 ├── empresaId (cuid) [FK -> empresas.id]
 └── unidadeId (cuid) [FK -> unidades.id]

registros_ponto (Batidas de Ponto)
 ├── id (cuid) [PK]
 ├── empresaId (cuid) [FK -> empresas.id]
 ├── colaboradorId (cuid) [FK -> usuarios.id]
 ├── tipoRegistro (TipoRegistroPonto: entrada, inicio_pausa, fim_pausa, saida)
 ├── dataReferencia (Date)
 ├── horarioRegistro (DateTime)
 └── latitude, longitude, dentroRaioPermitido (Dados de GPS)

checklists_operacionais (Modelos e Instâncias executadas)
 ├── id (cuid) [PK]
 ├── empresaId (cuid) [FK -> empresas.id]
 ├── nome (String)
 ├── etapas (Json) (Contém [{ordem, texto, concluido, fotoUrl}])
 └── status (StatusAtivo: ativo, inativo)

tarefas (Atividades Pontuais e Geradas)
 ├── id (cuid) [PK]
 ├── empresaId (cuid) [FK -> empresas.id]
 ├── titulo (String)
 ├── status (StatusTarefa: pendente, em_progresso, concluida, atrasada)
 └── itensVerificacao (Json) (Contém [{id, texto, concluido}])
```

---

## 10. Mapeamento de Rotas

### Rotas Públicas
*   `/login` — Página de autenticação local (`src/app/(public)/login/page.tsx`).
*   `/login/alterar-senha` — Forçar alteração de senha provisória (`src/app/(public)/login/alterar-senha/page.tsx`).
*   `/login/redefinir-senha` — Redefinição via token de e-mail (`src/app/(public)/login/redefinir-senha/page.tsx`).

### Portal do Gestor Corporativo (Acesso: `gestorCorporativo`)
*   `/empresa` — Dashboard geral de performance operacional (`src/app/(empresa)/empresa/page.tsx`).
*   `/empresa/configuracoes` — Configuração da conta, unidade e controle de geofencing de ponto.
*   `/empresa/usuarios` — Gerenciamento e vinculação de colaboradores da empresa.
*   `/empresa/processos` — Cadastro de processos operacionais e checklist de passos.
*   `/empresa/rotinas` — Configuração de recorrências e checklists automáticos.
*   `/empresa/tarefas` — Criação, exclusão e monitoramento de tarefas diárias.
*   `/empresa/relatorios` — Exportação de dados operacionais e de banco de horas (XLSX/PDF).
*   `/empresa/assinatura` — Acompanhamento do plano e cobranças contratadas (integração Asaas).

### Portal do Gestor Local (Acesso: `gestorLocal`)
*   `/unidade` — Dashboard simplificado e monitoramento da unidade sob jurisdição (`src/app/(unidade)/unidade/page.tsx`).

### Portal Operacional (Acesso: `operacional`)
*   `/operacional` — Painel do colaborador com atalhos para tarefas (`src/app/(operacional)/operacional/page.tsx`).
*   `/operacional/check-in` — Interface simplificada de registro de ponto.
*   `/operacional/tarefas` (ou `/operacional/tasks`) — Lista de tarefas ativas do colaborador com upload de foto.
*   `/operacional/processos` — Consulta a processos vigentes.
*   `/operacional/rotinas` — Visualização de rotinas designadas.

### Portal do SaaS Admin (Acesso: `saasAdmin`)
*   `/sistema` — Dashboard administrativo de faturamento e taxas SaaS (`src/app/(sistema)/sistema/page.tsx`).
*   `/sistema/empresas` — CRUD de locatários e trial control.
*   `/sistema/planos` — Gerenciamento dos planos SaaS (Starter, Pro, etc.).
*   `/sistema/usuarios-permissoes` — Customização direta de matriz de permissões RBAC de qualquer usuário.

---

## 11. Análise de Qualidade e Débitos Técnicos

### Pontos Fortes
*   **Arquitetura Sólida no Backend**: Repository Pattern separa perfeitamente a infraestrutura de banco de dados do Next.js.
*   **Isolamento Multi-Tenant**: Blindagem obrigatória com `empresaId` nos repositórios PostgreSQL do backend.
*   **Segurança Avançada**: Cookies `httpOnly` para guardar o JWT evitam ataques XSS comuns.
*   **Controle de Geolocalização Funcional**: O Geofencing com cálculo de fórmula de Haversine no backend impede fraudes de check-in.

### Débitos Técnicos Críticos (Bugs e Gaps)

1.  **Check-in Operacional Mocado e Inconsistente**
    *   **Inconsistência**: A interface principal do colaborador (`CollaboratorDashboard` em `src/components/collaborator/collaborator-dashboard.tsx`) moca o check-in inteiramente em Client State (`useState(false)`). Ao clicar, o botão só altera o estado visual local, ignorando toda a infraestrutura e o banco de dados de ponto.
    *   **Inconsistência 2**: A tela dedicada de check-in (`src/app/(operacional)/operacional/check-in/page.tsx`) chama a API `/api/operacional/check-in` (POST). No entanto, esse endpoint **apenas cria um log genérico na tabela `Auditoria`** (salvando `{ turno: shift }`), sem registrar dados na tabela `RegistroPonto`.
    *   **Resultado**: O sistema de ponto eletrônico (com escalas, pausas, banco de horas e correções) está **completamente mocado ou inacessível para o colaborador** no portal operacional, apesar de as APIs de ponto existirem em `/api/empresa/ponto/...` e o hook `useMeuPonto` estar implementado.

2.  **API Operacional de Tarefas / Checklists Quebrada (Crash de Runtime)**
    *   **Problema**: O arquivo `/api/operacional/tarefas/route.ts` (linha 26) tenta consultar `prisma.checklist.findMany()`. O arquivo `/api/operacional/tarefas/concluir/route.ts` (linha 57) tenta consultar `prisma.tarefaChecklist.update()`.
    *   **Erro**: **Os modelos `Checklist` e `TarefaChecklist` NÃO existem no PostgreSQL** (`prisma/schema.prisma` define `ChecklistOperacional` e `Tarefa` com passos JSON).
    *   **Resultado**: Ao acessar a página de tarefas do colaborador (`/operacional/tarefas` or `/operacional/tasks`), a requisição de busca de tarefas falha imediatamente com status 500 no servidor, tornando a página inoperante.

3.  **Duplicação Física de Diretórios (Resíduos de Tradução/Refatoração)**
    *   Na estrutura do backend (`src/server`), existem pastas duplicadas e concorrentes:
        *   `src/server/repositories` (antigos arquivos do Firestore Admin) vs. `src/server/repositorios` (novos arquivos do PostgreSQL/Prisma).
        *   `src/server/services` vs. `src/server/servicos`.
        *   `src/lib/repositories` vs. `src/lib/repositorios`.
    *   *Risco*: Facilita importações erradas por novos desenvolvedores, mantendo arquivos Firebase Admin inativos no projeto.

4.  **Upload de Foto para Evidências Incompleto**
    *   Na conclusão de tarefas do colaborador (`src/app/(operacional)/operacional/tasks/page.tsx` na linha 183), o código possui o comentário: `// In a real app, you would upload attachedImages to Firebase Storage`. Ele simplesmente envia os URLs blob/data temporários locais para o banco, os quais expiram no ciclo de vida da página.

5.  **Acesso à Propriedade Inexistente em APIs de Checklist**
    *   No arquivo `src/app/api/empresa/checklists/route.ts` (linha 31), o código tenta definir `criadoPor: acesso.usuarioId`. A interface `ResultadoAcessoEmpresa` retornada por `garantirAcessoEmpresa` **não possui a propriedade `usuarioId`** (o correto é `acesso.sessao.uid`). Isso gerará um erro de compilação/execução.

---

## 12. Roadmap Real do Projeto

### O que já está pronto
*   Modelagem relacional completa no PostgreSQL (38 tabelas incluindo Ponto, Escalas, Assinaturas Asaas, Auditorias, RBAC).
*   Estrutura SaaS e portais de governança corporativa funcional (`/sistema` e `/empresa`).
*   Configuração e migração de dados do Firebase Firestore para PostgreSQL através dos scripts TS (`migrar-onda1`, `migrar-onda2`, `migrar-onda3`).
*   Autenticação local funcional com Bcrypt e JWT em cookie HttpOnly.
*   Central de Notificações, Command Palette de busca global e Date Range Popovers.
*   Exportador de relatórios multiformato (XLSX/PDF).
*   Serviço de geofencing de ponto (Haversine cálculo).

### Parcialmente Pronto (Necessita de ajustes)
*   **Fotos de Evidência**: O frontend possui captura via WebRTC câmera e input de arquivos, mas não há backend de armazenamento configurado para guardar arquivos físicos (falta migrar de Firebase Storage para S3 ou outro Storage Provider).
*   **Gestão de Checklists**: Cadastro de ChecklistOperacional e etapas JSON está operacional no portal gestor, mas quebrado no portal do colaborador devido a consultas em tabelas fantasmas.

### O que ainda não existe (Gaps)
*   **Escalas & Jornada na UI**: O banco possui tabelas de escala e rotina horária diária por colaborador, mas não existem telas nos portais para os gestores desenharem essas escalas visivelmente.
*   **Ponto Eletrônico integrado na UI**: O colaborador não consegue registrar suas batidas reais no banco por falta de integração entre a UI e o hook `useMeuPonto`.

---

## 13. Gap entre o Projeto Atual e a Visão Restaurante360

| Funcionalidade / Visão | Status no Código Atual | O que precisa ser Ajustado / Desenvolvido | Caminhos dos Arquivos Relacionados |
| :--- | :--- | :--- | :--- |
| **Master da Loja** | Pronto | Já existe o papel `gestorCorporativo` vinculado à hierarquia `MASTER_LOJA` com bypass de permissões. | `src/lib/permissoes.ts`, `src/server/servicos/servico-permissoes.ts` |
| **Administrador** | Pronto | Nível de acesso intermediário `ADMINISTRADOR` mapeado no RBAC e implementado. | `src/server/servicos/servico-hierarquia.ts` |
| **Administrativo** | Pronto | Nível de acesso intermediário `ADMINISTRATIVO` mapeado no RBAC e implementado. | `src/server/servicos/servico-hierarquia.ts` |
| **Gestão de Tarefas** | Pronto | CRUD de tarefas pelo gestor está funcional. | `src/components/tarefas/`, `src/hooks/use-tarefas.ts` |
| **Gestão de Processos** | Pronto | Modelagem e vinculação de passos JSON em processos estão prontos. | `src/components/processos/`, `src/hooks/use-processos.ts` |
| **Checklists** | **Ajuste Urgente** | O portal operacional está quebrado (runtime crash) devido a referências à tabela antiga NoSQL. É necessário refatorar os endpoints operacionais para consumirem `ChecklistOperacional`. | `src/app/api/operacional/tarefas/route.ts`, `src/app/api/operacional/tarefas/concluir/route.ts` |
| **Escalas** | **Não Desenvolvido** | Falta criar a interface gráfica (calendários, escalas de trabalho) para o gestor cadastrar e vincular colaboradores a turnos 5x2, 6x1, etc. | `prisma/schema.prisma` (tabela `escalas_trabalho` e `jornadas_previstas`) |
| **Ponto Eletrônico** | **Ajuste Urgente** | Conectar o componente de check-in operacional ao hook `useMeuPonto` (que chama as rotas de API `/api/empresa/ponto/registrar`) para permitir batidas reais com geofencing ativo. | `src/components/collaborator/collaborator-dashboard.tsx`, `src/hooks/use-meu-ponto.ts` |
| **Relatórios** | Pronto | Dashboard de performance e fechamento financeiro operacional (XLSX). | `src/components/relatorios/`, `src/hooks/use-relatorios.ts` |
| **Evidências Fotográficas**| **Ajuste Urgente** | Integrar um serviço de Storage (S3, Cloudinary ou Firebase Storage) nas APIs para fazer o upload das imagens enviadas no checklist de tarefas. | `src/app/(operacional)/operacional/tasks/page.tsx` (linha 183) |
| **Controle Operacional** | Pronto | Tratar ocorrências e registrar perdas operacionais estão funcionais no banco e hooks. | `src/hooks/empresa/use-ocorrencias.ts` |
