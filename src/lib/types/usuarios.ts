export type PapelUsuario = "admin" | "gestor" | "operacional";
export type StatusUsuario = "ativo" | "inativo";

export interface CredenciaisUsuarioLocal {
    senhaHash: string;
    salt: string;
    algoritmo: "SHA-256";
    atualizadoEm: string; // ISO
}

export interface UsuarioSistema {
    id: string;
    nome: string;
    email: string;
    papel: PapelUsuario;
    status: StatusUsuario;
    telefone?: string; // opcional
    empresaId?: string; // preparar multi-tenant (por enquanto opcional)
    credenciaisLocal?: CredenciaisUsuarioLocal; // senhas persistidas no ambiente local antes da migração Firebase Auth
    criadoEm: string; // ISO
    atualizadoEm: string; // ISO
    ultimoAcessoEm?: string; // opcional (mock)
}
