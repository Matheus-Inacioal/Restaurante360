# restaurante360 - Sistema de Gestão Operacional

## Visão Geral

O **restaurante360** é um sistema de gestão operacional completo, projetado especificamente para as necessidades de restaurantes, bares e outros estabelecimentos do setor de alimentos e bebidas. A plataforma centraliza e otimiza as rotinas diárias, garantindo a padronização dos processos, o acompanhamento da equipe e a análise de performance em tempo real.

O objetivo principal é transformar a complexidade da gestão diária em um fluxo de trabalho simples, digital e eficiente, permitindo que os gestores se concentrem na qualidade do serviço e na satisfação do cliente.

---

## Funcionalidades Principais

O sistema é dividido em dois painéis principais, cada um com funcionalidades específicas para o perfil do usuário:

### 1. Painel do Gestor (`Manager`)

O gestor tem acesso total às ferramentas de configuração, acompanhamento e análise.

*   **Dashboard Geral:** Uma visão panorâmica do status operacional do dia, incluindo o progresso dos checklists, tarefas pendentes e check-ins da equipe.
*   **Gestão de Atividades:** Permite criar e gerenciar "modelos de atividade", que são as tarefas individuais que compõem os processos (ex: "Limpar chapa", "Verificar estoque de bebidas").
*   **Gestão de Processos:** Agrupa atividades em sequências lógicas, como "Rotina de Abertura", "Limpeza de Encerramento", etc.
*   **Gestão de Checklists:** Acompanha em tempo real o status de todos os checklists gerados, visualizando o progresso, quem está responsável e o turno.
*   **Gestão de Usuários:** Cadastra novos membros da equipe, atribuindo funções específicas (gestor, bar, pia, cozinha, produção, garçom) que determinam seus acessos e permissões.
*   **Relatórios de Performance:** Ferramentas visuais com gráficos para analisar a conformidade das tarefas por colaborador e a distribuição do status dos checklists ao longo do tempo.

### 2. Painel do Colaborador (`Collaborator`)

O colaborador tem uma interface focada na execução de suas responsabilidades diárias.

*   **Meu Painel:** Um resumo rápido do status do seu turno e acesso rápido às tarefas pendentes.
*   **Check-in:** Funcionalidade para registrar o início do turno de trabalho.
*   **Minhas Tarefas:** Lista de todas as tarefas atribuídas para o dia. O colaborador pode marcar as tarefas como concluídas e, se necessário, anexar uma foto como evidência da execução.

---

## Tecnologia Utilizada

O projeto foi construído com uma stack moderna e robusta, focada em performance, escalabilidade e uma excelente experiência de desenvolvimento.

*   **Framework:** **Next.js (com App Router)** - Para renderização otimizada no servidor (SSR), alta performance e uma estrutura de projeto organizada.
*   **Linguagem:** **TypeScript** - Para garantir a segurança dos tipos e a manutenibilidade do código.
*   **Backend e Banco de Dados:** **Firebase**
    *   **Firestore:** Como banco de dados NoSQL em tempo real para armazenar todos os dados da aplicação (usuários, tarefas, checklists, etc.).
    *   **Firebase Authentication:** Para gerenciar o login, cadastro e a segurança de acesso dos usuários.
*   **UI (Interface do Usuário):**
    *   **ShadCN UI:** Biblioteca de componentes acessíveis e customizáveis.
    *   **Tailwind CSS:** Para estilização rápida e consistente, utilizando um sistema de design baseado em utilitários.
*   **Gerenciamento de Estado:** Hooks nativos do React (`useState`, `useEffect`, `useContext`) combinados com a reatividade em tempo real do Firebase.
*   **Formulários:** `react-hook-form` para gerenciamento eficiente e performático de formulários, com validação através do `zod`.
*   **Visualização de Dados:** `Recharts` para a criação dos gráficos interativos na página de relatórios.
