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

// ─── Sessão do usuário (extraída do JWT) ──────────

/**
 * Dados da sessão extraídos do token JWT assinado (PostgreSQL)
 */
export interface SessaoUsuario {
  uid: string;
  email?: string;
  papel?: PapelUsuario;
  empresaId?: string;
  unidadeId?: string;
}

export type NivelHierarquia =
  | "MASTER_LOJA"
  | "ADMINISTRADOR"
  | "ADMINISTRATIVO"
  | "GESTOR_LOCAL"
  | "COLABORADOR";

export type ModuloPermissao =
  | "DASHBOARD"
  | "TAREFAS"
  | "CHECKLISTS"
  | "ROTINAS"
  | "RECEITAS_POPS"
  | "OCORRENCIAS"
  | "PONTO_ESCALA"
  | "USUARIOS_PERMISSOES"
  | "RELATORIOS"
  | "CONFIGURACOES_UNIDADE";

export interface PerfilUsuario {
  id: string;              // UUID gerado pelo Prisma (cuid)
  email: string;
  nome: string;
  papel: PapelUsuario;
  status: StatusAtivo;
  empresaId: string | null;
  unidadeId: string | null;
  areaId: string | null;
  funcaoId: string | null;
  mustResetPassword: boolean;
  nivelHierarquia: NivelHierarquia | null;
  perfilAcessoId: string | null;
  cargoId: string | null;
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

// ─── Interfaces de Hierarquia e Permissões ─────────────────────

export interface Cargo {
  id: string;
  empresaId: string;
  nome: string;
  descricao?: string | null;
  status: StatusAtivo;
  criadoEm: string;
  atualizadoEm: string;
}

export interface PerfilAcesso {
  id: string;
  empresaId: string;
  nome: string;
  descricao?: string | null;
  nivel: NivelHierarquia;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Permissao {
  id: string;
  nome: string; // Ex: tarefas:criar
  modulo: ModuloPermissao;
  descricao: string;
  criadoEm: string;
}

export interface PermissaoUsuario {
  usuarioId: string;
  permissaoId: string;
  concedido: boolean;
  permissao?: Permissao;
}

export interface UsuarioUnidade {
  usuarioId: string;
  unidadeId: string;
}

export interface AuditoriaPermissao {
  id: string;
  empresaId: string;
  usuarioId: string;
  autorId: string;
  modulo: ModuloPermissao;
  permissao: string;
  acao: string;
  antes?: string | null;
  depois?: string | null;
  criadoEm: string;
  usuario?: { nome: string; email: string };
  autor?: { nome: string; email: string };
}

// Helpers de Hierarquia
export function ehMaster(nivel: NivelHierarquia | null | undefined): boolean {
  return nivel === "MASTER_LOJA";
}

export function ehAdministradorHierarquia(nivel: NivelHierarquia | null | undefined): boolean {
  return nivel === "ADMINISTRADOR";
}

export function ehAdministrativoHierarquia(nivel: NivelHierarquia | null | undefined): boolean {
  return nivel === "ADMINISTRATIVO";
}

export function ehGestorLocalHierarquia(nivel: NivelHierarquia | null | undefined): boolean {
  return nivel === "GESTOR_LOCAL";
}

export function ehColaboradorHierarquia(nivel: NivelHierarquia | null | undefined): boolean {
  return nivel === "COLABORADOR";
}

