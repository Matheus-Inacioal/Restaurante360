import "server-only";
import { prisma } from '@/lib/prisma';
import { hashSenha } from '@/server/auth/senha';
import { registrarAuditoria } from '@/server/servicos/servico-auditoria';

export interface DefinirSenhaTemporariaInput {
    empresaId: string;
    novaSenha: string;
    forcarTrocaSenha?: boolean;
    executadoPorUid?: string; // UID do Superadmin para auditoria
}

export interface DefinirSenhaTemporariaResult {
    ok: boolean;
    code?: string;
    message?: string;
}

export async function definirSenhaTemporariaService(data: DefinirSenhaTemporariaInput): Promise<DefinirSenhaTemporariaResult> {
    try {
        const { empresaId, novaSenha, forcarTrocaSenha = true, executadoPorUid = "SISTEMA" } = data;

        // 1. Buscar a empresa para checar tenant
        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaId }
        });

        if (!empresa) {
            return {
                ok: false,
                code: "NOT_FOUND",
                message: "Empresa não encontrada."
            };
        }

        // 2. Descobrir usuário master (gestorCorporativo) desta empresa
        const gestor = await prisma.usuario.findFirst({
            where: {
                empresaId: empresaId,
                papel: 'gestorCorporativo',
                status: 'ativo'
            }
        });

        if (!gestor) {
            return {
                ok: false,
                code: "NOT_FOUND",
                message: "Usuário gestor não encontrado para esta empresa."
            };
        }

        // 3. Atualizar a senha (hash com bcrypt) no PostgreSQL
        const senhaHash = await hashSenha(novaSenha);

        await prisma.usuario.update({
            where: { id: gestor.id },
            data: {
                senhaHash,
                mustResetPassword: forcarTrocaSenha
            }
        });

        // 4. Auditar a ação crítica
        await registrarAuditoria({
            usuarioId: executadoPorUid,
            acao: "usuario.senha.redefinida_admin",
            entidade: "usuario",
            entidadeId: gestor.id,
            empresaId: empresaId,
            detalhe: { forcarTrocaSenha, observacao: "SISTEMA_DEFINIU_SENHA_TEMPORARIA" }
        }).catch(() => null);

        return {
            ok: true,
            message: "Senha temporária definida com sucesso."
        };

    } catch (error: any) {
        console.error("[DEFINIR_SENHA_TEMPORARIA_SERVICE] Erro:", error);
        return {
            ok: false,
            code: "INTERNAL_ERROR",
            message: "Falha interna ao tentar redefinir senha do usuário."
        };
    }
}
