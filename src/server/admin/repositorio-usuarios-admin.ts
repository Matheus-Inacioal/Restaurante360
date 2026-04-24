import "server-only";
import { prisma } from "@/lib/prisma";

export const repositorioUsuariosAdmin = {
    async obterTotalSistema(): Promise<number> {
        return prisma.usuario.count({
            where: {
                papel: "saasAdmin"
            }
        });
    },
};
