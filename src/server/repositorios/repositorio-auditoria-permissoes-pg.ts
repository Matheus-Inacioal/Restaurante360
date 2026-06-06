/**
 * Repositório de Auditoria de Permissões — PostgreSQL/Prisma
 * Acesso exclusivo do servidor (server-only)
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import type { ModuloPermissao } from "@/lib/tipos/identidade";

export interface DadosAuditoriaPermissao {
  empresaId: string;
  usuarioId: string; // Usuário que teve a permissão alterada
  autorId: string;   // Usuário que realizou a alteração
  modulo: ModuloPermissao;
  permissao: string; // Nome da permissão
  acao: string;      // 'CONCEDIDA' | 'REVOGADA' | 'ALTERADA_PERFIL'
  antes?: string | null;
  depois?: string | null;
}

export const repositorioAuditoriaPermissoesPg = {

  /**
   * Registra uma alteração de permissão na tabela de auditoria
   */
  async registrarAuditoria(dados: DadosAuditoriaPermissao) {
    return prisma.auditoriaPermissao.create({
      data: {
        empresaId: dados.empresaId,
        usuarioId: dados.usuarioId,
        autorId: dados.autorId,
        modulo: dados.modulo,
        permissao: dados.permissao,
        acao: dados.acao,
        antes: dados.antes ?? null,
        depois: dados.depois ?? null
      }
    });
  },

  /**
   * Obtém o histórico de logs de auditoria da empresa
   * Permite filtrar por um usuário específico.
   */
  async obterHistorico(empresaId: string, usuarioId?: string) {
    return prisma.auditoriaPermissao.findMany({
      where: {
        empresaId,
        ...(usuarioId ? { usuarioId } : {})
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        autor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      },
      orderBy: {
        criadoEm: "desc"
      },
      take: 100 // Limita aos últimos 100 registros para desempenho
    });
  }
};
