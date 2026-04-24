/**
 * Repositório de Notificações — PostgreSQL/Prisma
 * server-only
 */
import "server-only";
import { prisma } from "@/lib/prisma";

export const repositorioNotificacoesPg = {

  async criar(dados: {
    usuarioId: string;
    empresaId?: string;
    titulo: string;
    descricao: string;
    tipo?: "tarefa_atrasada" | "tarefa_atribuida" | "sistema" | "rotina_alerta";
    origem?: string;
    entidadeId?: string;
  }) {
    return prisma.notificacao.create({
      data: {
        usuarioId: dados.usuarioId,
        empresaId: dados.empresaId ?? null,
        titulo: dados.titulo,
        descricao: dados.descricao,
        tipo: dados.tipo ?? "sistema",
        origem: dados.origem ?? null,
        entidadeId: dados.entidadeId ?? null,
      },
    });
  },

  async listarPorUsuario(usuarioId: string, apenasNaoLidas = false) {
    return prisma.notificacao.findMany({
      where: {
        usuarioId,
        ...(apenasNaoLidas ? { lida: false } : {}),
      },
      orderBy: { criadoEm: "desc" },
      take: 50,
    });
  },

  async marcarComoLida(id: string) {
    return prisma.notificacao.update({
      where: { id },
      data: { lida: true },
    });
  },

  async marcarTodasComoLidas(usuarioId: string) {
    return prisma.notificacao.updateMany({
      where: { usuarioId, lida: false },
      data: { lida: true },
    });
  },

  async contarNaoLidas(usuarioId: string): Promise<number> {
    return prisma.notificacao.count({
      where: { usuarioId, lida: false },
    });
  },
};
