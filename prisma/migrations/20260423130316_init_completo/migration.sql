-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('saasAdmin', 'gestorCorporativo', 'gestorLocal', 'operacional');

-- CreateEnum
CREATE TYPE "StatusAtivo" AS ENUM ('ativo', 'inativo');

-- CreateEnum
CREATE TYPE "StatusEmpresa" AS ENUM ('TRIAL_ATIVO', 'ATIVO', 'GRACE', 'SUSPENSO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusTarefa" AS ENUM ('pendente', 'em_progresso', 'concluida', 'atrasada');

-- CreateEnum
CREATE TYPE "TipoTarefa" AS ENUM ('tarefa', 'checklist');

-- CreateEnum
CREATE TYPE "PrioridadeTarefa" AS ENUM ('Alta', 'Media', 'Baixa');

-- CreateEnum
CREATE TYPE "FrequenciaRotina" AS ENUM ('diaria', 'semanal', 'mensal');

-- CreateEnum
CREATE TYPE "TipoCategoria" AS ENUM ('processos', 'rotinas', 'tarefas', 'geral');

-- CreateEnum
CREATE TYPE "CategoriaNotificacao" AS ENUM ('tarefa_atrasada', 'tarefa_atribuida', 'sistema', 'rotina_alerta');

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "responsavelNome" TEXT NOT NULL,
    "responsavelEmail" TEXT NOT NULL,
    "whatsappResponsavel" TEXT,
    "status" "StatusEmpresa" NOT NULL DEFAULT 'TRIAL_ATIVO',
    "planoId" TEXT,
    "planoNome" TEXT,
    "diasTrial" INTEGER NOT NULL DEFAULT 14,
    "trialInicio" TIMESTAMP(3),
    "trialFim" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "asaasCustomerId" TEXT,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "status" "StatusAtivo" NOT NULL DEFAULT 'ativo',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusAtivo" NOT NULL DEFAULT 'ativo',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcoes" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusAtivo" NOT NULL DEFAULT 'ativo',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funcoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL,
    "status" "StatusAtivo" NOT NULL DEFAULT 'ativo',
    "empresaId" TEXT,
    "unidadeId" TEXT,
    "areaId" TEXT,
    "funcaoId" TEXT,
    "mustResetPassword" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "ultimoAcessoEm" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoCategoria" NOT NULL DEFAULT 'geral',
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefas" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoTarefa" NOT NULL DEFAULT 'tarefa',
    "status" "StatusTarefa" NOT NULL DEFAULT 'pendente',
    "prioridade" "PrioridadeTarefa" NOT NULL DEFAULT 'Media',
    "responsavelId" TEXT,
    "prazo" TIMESTAMP(3),
    "tags" TEXT[],
    "criadoPor" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "itensVerificacao" JSONB,
    "origemTipo" TEXT,
    "origemRotinaId" TEXT,
    "origemDataRef" TEXT,

    CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotinas" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "frequencia" "FrequenciaRotina" NOT NULL,
    "diasSemana" INTEGER[],
    "diaDoMes" INTEGER,
    "horarioPreferencial" TEXT,
    "responsavelPadraoId" TEXT,
    "tipoTarefaGerada" "TipoTarefa" NOT NULL DEFAULT 'tarefa',
    "checklistModelo" JSONB,
    "tags" TEXT[],
    "criadoPor" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rotinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geracoes_rotina" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "rotinaId" TEXT NOT NULL,
    "tarefaGeradaId" TEXT NOT NULL,
    "dataReferencia" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geracoes_rotina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "categoriaId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "passos" JSONB,

    CONSTRAINT "processos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "CategoriaNotificacao" NOT NULL DEFAULT 'sistema',
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "origem" TEXT,
    "entidadeId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "detalhe" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "valorMensal" DOUBLE PRECISION NOT NULL,
    "valorAnual" DOUBLE PRECISION NOT NULL,
    "features" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinaturas" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "asaasSubscriptionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "valor" DOUBLE PRECISION NOT NULL,
    "ciclo" TEXT NOT NULL DEFAULT 'MENSAL',
    "formaPagamento" TEXT NOT NULL DEFAULT 'UNDEFINED',
    "proximoVencimento" TIMESTAMP(3),
    "inicioAssinatura" TIMESTAMP(3) NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cobrancas" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "assinaturaId" TEXT,
    "asaasPaymentId" TEXT,
    "asaasSubscriptionId" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "valorLiquido" DOUBLE PRECISION,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "formaPagamento" TEXT NOT NULL DEFAULT 'UNDEFINED',
    "invoiceUrl" TEXT,
    "bankSlipUrl" TEXT,
    "pixPayload" TEXT,
    "pagaEm" TIMESTAMP(3),
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cobrancas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aceites_assinatura" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "ciclo" TEXT NOT NULL DEFAULT 'MENSAL',
    "valor" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "diasTrial" INTEGER,
    "vencimentoPrimeiraCobrancaEm" TIMESTAMP(3),
    "responsavelNome" TEXT,
    "responsavelEmail" TEXT,
    "whatsappResponsavel" TEXT,
    "cnpj" TEXT,
    "aceitoEm" TIMESTAMP(3),
    "aceitoPorCanal" TEXT,
    "formaPagamentoEscolhida" TEXT,
    "asaasCustomerId" TEXT,
    "asaasSubscriptionId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aceites_assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_eventos" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "processado" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB,
    "processadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_asaasCustomerId_key" ON "empresas"("asaasCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "tarefas_empresaId_status_idx" ON "tarefas"("empresaId", "status");

-- CreateIndex
CREATE INDEX "tarefas_empresaId_criadoPor_idx" ON "tarefas"("empresaId", "criadoPor");

-- CreateIndex
CREATE INDEX "rotinas_empresaId_ativa_idx" ON "rotinas"("empresaId", "ativa");

-- CreateIndex
CREATE UNIQUE INDEX "geracoes_rotina_rotinaId_dataReferencia_key" ON "geracoes_rotina"("rotinaId", "dataReferencia");

-- CreateIndex
CREATE INDEX "processos_empresaId_ativo_idx" ON "processos"("empresaId", "ativo");

-- CreateIndex
CREATE INDEX "notificacoes_usuarioId_lida_idx" ON "notificacoes"("usuarioId", "lida");

-- CreateIndex
CREATE INDEX "auditoria_empresaId_idx" ON "auditoria"("empresaId");

-- CreateIndex
CREATE INDEX "auditoria_criadoEm_idx" ON "auditoria"("criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "planos_nome_key" ON "planos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "assinaturas_asaasSubscriptionId_key" ON "assinaturas"("asaasSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "cobrancas_asaasPaymentId_key" ON "cobrancas"("asaasPaymentId");

-- CreateIndex
CREATE INDEX "cobrancas_empresaId_status_idx" ON "cobrancas"("empresaId", "status");

-- AddForeignKey
ALTER TABLE "unidades" ADD CONSTRAINT "unidades_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funcoes" ADD CONSTRAINT "funcoes_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_funcaoId_fkey" FOREIGN KEY ("funcaoId") REFERENCES "funcoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotinas" ADD CONSTRAINT "rotinas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotinas" ADD CONSTRAINT "rotinas_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geracoes_rotina" ADD CONSTRAINT "geracoes_rotina_rotinaId_fkey" FOREIGN KEY ("rotinaId") REFERENCES "rotinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geracoes_rotina" ADD CONSTRAINT "geracoes_rotina_tarefaGeradaId_fkey" FOREIGN KEY ("tarefaGeradaId") REFERENCES "tarefas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "planos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobrancas" ADD CONSTRAINT "cobrancas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobrancas" ADD CONSTRAINT "cobrancas_assinaturaId_fkey" FOREIGN KEY ("assinaturaId") REFERENCES "assinaturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aceites_assinatura" ADD CONSTRAINT "aceites_assinatura_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aceites_assinatura" ADD CONSTRAINT "aceites_assinatura_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "planos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
