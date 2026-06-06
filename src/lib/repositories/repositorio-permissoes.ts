/**
 * Repositório de Permissões e Usuários — Client-Side (REST)
 * use-client safe
 */
import { fetchJSON } from "../http/fetch-json";
import type { PerfilUsuario, AuditoriaPermissao, Cargo } from "../tipos/identidade";

export interface ItemMatrizPermissao {
  id: string;
  nome: string;
  modulo: string;
  descricao: string;
  concedida: boolean;
  customizada: boolean;
  valorCustomizado: boolean | null;
}

export class RepositorioPermissoesRest {
  
  /** Lista todos os usuários de acordo com a permissão do autor */
  async listarUsuarios(empresaId?: string): Promise<PerfilUsuario[]> {
    const url = empresaId 
      ? `/api/sistema/usuarios-permissoes?empresaId=${empresaId}`
      : `/api/sistema/usuarios-permissoes`;
    
    const res = await fetchJSON<PerfilUsuario[]>(url);
    if (!res.ok) throw new Error(res.message);
    return res.data;
  }

  /** Cria um novo colaborador com hierarquia */
  async criarUsuario(dados: {
    email: string;
    nome: string;
    papel: string;
    nivelHierarquia: string;
    unidadeId?: string | null;
    areaId?: string | null;
    funcaoId?: string | null;
    perfilAcessoId?: string | null;
    cargoId?: string | null;
    unidadeIds?: string[];
  }): Promise<PerfilUsuario> {
    const res = await fetchJSON<PerfilUsuario>(`/api/sistema/usuarios-permissoes`, {
      method: "POST",
      body: JSON.stringify(dados)
    });
    if (!res.ok) throw new Error(res.message);
    return res.data;
  }

  /** Atualiza dados e hierarquia de um colaborador */
  async atualizarUsuario(
    id: string,
    dados: {
      nome?: string;
      papel?: string;
      nivelHierarquia?: string;
      unidadeId?: string | null;
      areaId?: string | null;
      funcaoId?: string | null;
      perfilAcessoId?: string | null;
      cargoId?: string | null;
      status?: string;
      unidadeIds?: string[];
    }
  ): Promise<PerfilUsuario> {
    const res = await fetchJSON<PerfilUsuario>(`/api/sistema/usuarios-permissoes/${id}`, {
      method: "PUT",
      body: JSON.stringify(dados)
    });
    if (!res.ok) throw new Error(res.message);
    return res.data;
  }

  /** Desativa o colaborador */
  async desativarUsuario(id: string): Promise<void> {
    const res = await fetchJSON<{ sucesso: boolean }>(`/api/sistema/usuarios-permissoes/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error(res.message);
  }

  /** Obtém a matriz de permissões efetivas do colaborador */
  async obterPermissoesUsuario(id: string): Promise<ItemMatrizPermissao[]> {
    const res = await fetchJSON<ItemMatrizPermissao[]>(`/api/sistema/usuarios-permissoes/${id}/permissoes`);
    if (!res.ok) throw new Error(res.message);
    return res.data;
  }

  /** Salva a customização de permissões de um colaborador */
  async salvarPermissoesUsuario(
    id: string,
    permissoes: { permissaoId: string; concedido: boolean }[]
  ): Promise<{ sucesso: boolean }> {
    const res = await fetchJSON<{ sucesso: boolean }>(`/api/sistema/usuarios-permissoes/${id}/permissoes`, {
      method: "PUT",
      body: JSON.stringify({ permissoes })
    });
    if (!res.ok) throw new Error(res.message);
    return res.data;
  }

  /** Carrega o histórico de auditoria de permissões */
  async obterHistoricoAuditoria(empresaId?: string, usuarioId?: string): Promise<AuditoriaPermissao[]> {
    let url = `/api/sistema/usuarios-permissoes/historico`;
    const params = new URLSearchParams();
    if (empresaId) params.append("empresaId", empresaId);
    if (usuarioId) params.append("usuarioId", usuarioId);
    
    const queryStr = params.toString();
    if (queryStr) url += `?${queryStr}`;

    const res = await fetchJSON<AuditoriaPermissao[]>(url);
    if (!res.ok) throw new Error(res.message);
    return res.data;
  }
}

export const repositorioPermissoes = new RepositorioPermissoesRest();
