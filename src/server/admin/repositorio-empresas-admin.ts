import "server-only";
import { prisma } from "@/lib/prisma";
import { EmpresaAtualizada } from "@/lib/types/financeiro";

export const repositorioEmpresasAdmin = {
    async obterTotal(): Promise<number> {
        return prisma.empresa.count();
    },

    async listar(limit: number = 10): Promise<any[]> {
        const empresas = await prisma.empresa.findMany({
            orderBy: { criadoEm: "desc" },
            take: limit,
        });
        
        return empresas.map(e => ({
            id: e.id,
            nomeEmpresa: e.nome,
            cnpj: e.cnpj,
            nomeResponsavel: e.responsavelNome,
            emailResponsavel: e.responsavelEmail,
            whatsappResponsavel: e.whatsappResponsavel,
            status: e.status,
            planoNome: e.planoNome,
            diasTrial: e.diasTrial,
            asaasCustomerId: e.asaasCustomerId,
            criadoEm: e.criadoEm.toISOString(),
            atualizadoEm: e.atualizadoEm.toISOString(),
        }));
    },

    async obterPorId(id: string): Promise<any | null> {
        const e = await prisma.empresa.findUnique({ where: { id } });
        if (!e) return null;
        
        return {
            id: e.id,
            nomeEmpresa: e.nome,
            cnpj: e.cnpj,
            nomeResponsavel: e.responsavelNome,
            emailResponsavel: e.responsavelEmail,
            whatsappResponsavel: e.whatsappResponsavel,
            status: e.status,
            planoNome: e.planoNome,
            diasTrial: e.diasTrial,
            asaasCustomerId: e.asaasCustomerId,
            criadoEm: e.criadoEm.toISOString(),
            atualizadoEm: e.atualizadoEm.toISOString(),
        };
    },

    async atualizar(id: string, dados: Partial<any>): Promise<void> {
        await prisma.empresa.update({
            where: { id },
            data: {
                nome: dados.nomeEmpresa,
                responsavelNome: dados.nomeResponsavel,
                responsavelEmail: dados.emailResponsavel,
                whatsappResponsavel: dados.whatsappResponsavel,
                status: dados.status,
                // outos campos mapeados caso existam
            }
        });
    },

    async excluir(id: string): Promise<void> {
        // Soft-delete
        await prisma.empresa.update({
            where: { id },
            data: {
                status: "CANCELADO",
            }
        });
    },

    async listarPendencias(): Promise<number> {
        return prisma.empresa.count({
            where: {
                status: {
                    in: ["SUSPENSO", "GRACE"]
                }
            }
        });
    },
};
