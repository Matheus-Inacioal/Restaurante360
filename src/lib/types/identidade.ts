/**
 * @deprecated Este arquivo foi substituído por src/lib/tipos/identidade.ts
 * 
 * Mantido apenas para compatibilidade com código legado ainda não migrado.
 * NÃO USAR em novos arquivos — importe de @/lib/tipos/identidade
 */

// Re-exporta os novos tipos para compatibilidade gradual
export type { PapelUsuario as PapelPortal } from '../tipos/identidade';
export type { PerfilUsuario } from '../tipos/identidade';

// Tipos legados mantidos por compatibilidade
export type PapelEmpresa = "GESTOR" | "ADMIN" | "OPERACIONAL";
