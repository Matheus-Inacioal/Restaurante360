import { fetchJSON } from "../http/fetch-json";
import type { UsuarioSistema } from "../types/usuarios";

export interface RepositorioUsuarios {
    listarUsuarios(empresaId: string): Promise<UsuarioSistema[]>;
    criarUsuario(dados: Omit<UsuarioSistema, "id" | "criadoEm" | "atualizadoEm">): Promise<UsuarioSistema>;
    atualizarUsuario(id: string, empresaId: string, atualizacoes: Partial<UsuarioSistema>): Promise<UsuarioSistema>;
    inativarUsuario(id: string, empresaId: string): Promise<void>;
    reativarUsuario(id: string, empresaId: string): Promise<void>;
    enviarLinkRedefinicaoSenha(emailColaborador: string): Promise<{ sucesso: boolean; linkRedefinicao?: string }>;
}

class RepositorioUsuariosRest implements RepositorioUsuarios {
    async listarUsuarios(empresaId: string): Promise<UsuarioSistema[]> {
        const res = await fetchJSON<UsuarioSistema[]>(`/api/empresa/usuarios?empresaId=${empresaId}`);
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async criarUsuario(dados: Omit<UsuarioSistema, "id" | "criadoEm" | "atualizadoEm">): Promise<UsuarioSistema> {
        if (!dados.empresaId) throw new Error("empresaId obrigatório");

        const res = await fetchJSON<UsuarioSistema>(`/api/empresa/usuarios/criar`, {
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

    async inativarUsuario(uid: string, _empresaId: string): Promise<void> {
        const res = await fetchJSON<any>(`/api/empresa/usuarios/alterar-status`, {
            method: 'POST',
            body: JSON.stringify({ uid, novoStatus: "inativo" })
        });
        if (!res.ok) throw new Error(res.message);
    }

    async reativarUsuario(uid: string, _empresaId: string): Promise<void> {
        const res = await fetchJSON<any>(`/api/empresa/usuarios/alterar-status`, {
            method: 'POST',
            body: JSON.stringify({ uid, novoStatus: "ativo" })
        });
        if (!res.ok) throw new Error(res.message);
    }

    async enviarLinkRedefinicaoSenha(emailColaborador: string): Promise<{ sucesso: boolean; linkRedefinicao?: string }> {
        const res = await fetchJSON<{ sucesso: boolean; linkRedefinicao?: string }>(`/api/empresa/usuarios/redefinir-senha`, {
            method: 'POST',
            body: JSON.stringify({ emailColaborador })
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }
}

export const repositorioUsuarios = new RepositorioUsuariosRest();
