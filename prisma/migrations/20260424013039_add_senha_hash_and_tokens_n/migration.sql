-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "senhaHash" TEXT;

-- CreateTable
CREATE TABLE "tokens_reset_senha" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_reset_senha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_reset_senha_token_key" ON "tokens_reset_senha"("token");

-- AddForeignKey
ALTER TABLE "tokens_reset_senha" ADD CONSTRAINT "tokens_reset_senha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
