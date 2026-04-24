/**
 * Tipos centrais de identidade e acesso — Restaurante360
 * Alinhados ao schema Prisma (PostgreSQL)
 */

// ─── Perfis de acesso ─────────────────────────────────────────

/**
 * Perfil global do usuário no SaaS
 * 
 * saasAdmin:         acesso total à plataforma
 * gestorCorporativo: gestor de toda a empresa (todas as unidades)
 * gestorLocal:       gestor de uma unidade específica
 * operacional:       colaborador que executa tarefas
 */
export type PapelUsuario =
  | "saasAdmin"
  | "gestorCorporativo"
  | "gestorLocal"
  | "operacional";

export type StatusAtivo = "ativo" | "inativo";

// ─── Sessão do usuário (extraída do token Firebase) ──────────

/**
 * Dados da sessão extraídos do ID Token do Firebase Auth
 * O UID é a chave primária no PostgreSQL também.
 */
export interface SessaoUsuario {
  uid: string;
  email?: string;
  // Claims customizadas definidas via Firebase Admin
  papel?: PapelUsuario;
  empresaId?: string;
  unidadeId?: string;
}

// ─── Perfil completo (carregado do PostgreSQL) ───────────────

export interface PerfilUsuario {
  id: string;              // = UID Firebase
  email: string;
  nome: string;
  papel: PapelUsuario;
  status: StatusAtivo;
  empresaId: string | null;
  unidadeId: string | null;
  areaId: string | null;
  funcaoId: string | null;
  mustResetPassword: boolean;
  criadoEm: string;        // ISO string
  atualizadoEm: string;    // ISO string
}

// ─── Entidades de domínio ─────────────────────────────────────

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  responsavelNome: string;
  responsavelEmail: string;
  whatsappResponsavel?: string;
  status: string;
  planoId?: string;
  planoNome?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Unidade {
  id: string;
  empresaId: string;
  nome: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  status: StatusAtivo;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Area {
  id: string;
  empresaId: string;
  nome: string;
  descricao?: string;
  status: StatusAtivo;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Funcao {
  id: string;
  areaId: string;
  nome: string;
  descricao?: string;
  status: StatusAtivo;
  criadoEm: string;
  atualizadoEm: string;
}

// ─── Helpers de verificação de papel ─────────────────────────

export function ehSaasAdmin(papel: PapelUsuario): boolean {
  return papel === "saasAdmin";
}

export function ehGestorCorporativo(papel: PapelUsuario): boolean {
  return papel === "gestorCorporativo";
}

export function ehGestorLocal(papel: PapelUsuario): boolean {
  return papel === "gestorLocal";
}

export function ehOperacional(papel: PapelUsuario): boolean {
  return papel === "operacional";
}

export function ehGestor(papel: PapelUsuario): boolean {
  return papel === "gestorCorporativo" || papel === "gestorLocal";
}

export function ehVinculadoEmpresa(papel: PapelUsuario): boolean {
  return papel !== "saasAdmin";
}
