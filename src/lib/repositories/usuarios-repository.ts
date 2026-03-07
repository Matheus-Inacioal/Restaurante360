import { fetchJSON } from "../http/fetch-json";
import type { UsuarioSistema } from "../types/usuarios";

export interface RepositorioUsuarios {
    listarUsuarios(empresaId: string): Promise<UsuarioSistema[]>;
    criarUsuario(dados: Omit<UsuarioSistema, "id" | "criadoEm" | "atualizadoEm">): Promise<UsuarioSistema>;
    atualizarUsuario(id: string, empresaId: string, atualizacoes: Partial<UsuarioSistema>): Promise<UsuarioSistema>;
    inativarUsuario(id: string, empresaId: string): Promise<void>;
    reativarUsuario(id: string, empresaId: string): Promise<void>;
}

class RepositorioUsuariosRest implements RepositorioUsuarios {
    async listarUsuarios(empresaId: string): Promise<UsuarioSistema[]> {
        const res = await fetchJSON<UsuarioSistema[]>(`/api/empresa/usuarios?empresaId=${empresaId}`);
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async criarUsuario(dados: Omit<UsuarioSistema, "id" | "criadoEm" | "atualizadoEm">): Promise<UsuarioSistema> {
        if (!dados.empresaId) throw new Error("empresaId obrigatório");

        // Em um sistema real, aqui chamaríamos a API que também cria no Firebase Auth
        const res = await fetchJSON<UsuarioSistema & { senhaProvisoria?: string }>(`/api/empresa/usuarios/criar`, {
            method: 'POST',
            body: JSON.stringify(dados)
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async atualizarUsuario(id: string, empresaId: string, atualizacoes: Partial<UsuarioSistema>): Promise<UsuarioSistema> {
        const res = await fetchJSON<UsuarioSistema>(`/api/empresa/usuarios/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ empresaId, ...atualizacoes })
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async inativarUsuario(id: string, empresaId: string): Promise<void> {
        await this.atualizarUsuario(id, empresaId, { status: "inativo" });
    }

    async reativarUsuario(id: string, empresaId: string): Promise<void> {
        await this.atualizarUsuario(id, empresaId, { status: "ativo" });
    }
}

export const repositorioUsuarios = new RepositorioUsuariosRest();
