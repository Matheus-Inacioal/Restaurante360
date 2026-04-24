import "server-only";
import { prisma } from "@/lib/prisma";

// Mapeamento básico de nomes de rotas para models do Prisma
// Isso evita expor a API do prisma inteira e garante segurança
const mapeamentoColecoes: Record<string, keyof typeof prisma> = {
    tarefas: "tarefa",
    rotinas: "rotina",
    processos: "processo",
    categorias: "categoria",
    unidades: "unidade",
    areas: "area",
    funcoes: "funcao",
    usuarios: "usuario"
};

function getModel(colecao: string) {
    const modelName = mapeamentoColecoes[colecao];
    if (!modelName) {
        throw new Error(`Coleção ${colecao} não suportada ou não mapeada.`);
    }
    return (prisma as any)[modelName] as any;
}

export const repositorioGenericoAdmin = {
    async listar(colecao: string, empresaId: string) {
        const model = getModel(colecao);
        const docs = await model.findMany({
            where: { empresaId },
            orderBy: { criadoEm: "desc" }
        });
        
        // Mapear datas para string ISO, como no Firebase
        return docs.map((doc: any) => ({
            ...doc,
            criadoEm: doc.criadoEm ? doc.criadoEm.toISOString() : undefined,
            atualizadoEm: doc.atualizadoEm ? doc.atualizadoEm.toISOString() : undefined,
        }));
    },

    async obterPorId(colecao: string, empresaId: string, id: string) {
        const model = getModel(colecao);
        const doc = await model.findUnique({
            where: { id }
        });

        if (!doc) return null;
        if (doc.empresaId !== empresaId) return null; // Trava de tenant

        return {
            ...doc,
            criadoEm: doc.criadoEm ? doc.criadoEm.toISOString() : undefined,
            atualizadoEm: doc.atualizadoEm ? doc.atualizadoEm.toISOString() : undefined,
        };
    },

    async criar(colecao: string, empresaId: string, data: any) {
        const model = getModel(colecao);
        
        // Remover campos que o Prisma não aceita no create (como undefined id)
        const { id, criadoEm, atualizadoEm, ...payload } = data;
        
        const docCriado = await model.create({
            data: {
                ...(id ? { id } : {}),
                ...payload,
                empresaId,
            }
        });

        return {
            ...docCriado,
            criadoEm: docCriado.criadoEm.toISOString(),
            atualizadoEm: docCriado.atualizadoEm.toISOString(),
        };
    },

    async atualizar(colecao: string, empresaId: string, id: string, atualizacoes: any) {
        const model = getModel(colecao);
        
        // Verificar tenant antes
        const existe = await model.findUnique({ where: { id } });
        if (!existe) throw new Error(`Item com ID ${id} não encontrado na coleção ${colecao}.`);
        if (existe.empresaId !== empresaId) throw new Error("Acesso negado: Tentativa de atualizar dado de outro tenant.");

        // Remover campos não atualizáveis
        const { id: _id, empresaId: _emp, criadoEm, atualizadoEm, ...payload } = atualizacoes;

        const docAtualizado = await model.update({
            where: { id },
            data: payload
        });

        return {
            ...docAtualizado,
            criadoEm: docAtualizado.criadoEm.toISOString(),
            atualizadoEm: docAtualizado.atualizadoEm.toISOString(),
        };
    },

    async excluir(colecao: string, empresaId: string, id: string) {
        const model = getModel(colecao);
        
        const existe = await model.findUnique({ where: { id } });
        if (!existe) return true; // Já excluido
        if (existe.empresaId !== empresaId) throw new Error("Acesso negado: Tentativa de excluir dado de outro tenant.");

        await model.delete({ where: { id } });
        return true;
    }
};
