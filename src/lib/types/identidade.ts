export type PapelPortal = "SISTEMA" | "EMPRESA" | "OPERACIONAL";
export type PapelEmpresa = "GESTOR" | "ADMIN" | "OPERACIONAL";

export interface PerfilUsuario {
    uid: string;
    email: string;
    nome: string;
    papelPortal: PapelPortal;
    papelEmpresa?: PapelEmpresa; // Aplicável apenas quando atrelado a Tenant
    empresaId?: string;          // Aplicável apenas para papeis EMPRESA / OPERACIONAL
    ativo: boolean;
    criadoEm: string;            // ISO String
    atualizadoEm: string;        // ISO String
}
