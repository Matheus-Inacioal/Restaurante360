import { PapelPortal, PerfilUsuario } from "./types/identidade";

export function podeAcessarPortal(perfil: PerfilUsuario | null | undefined, portalRequerido: PapelPortal): boolean {
    if (!perfil || !perfil.ativo) {
        return false;
    }

    if (perfil.papelPortal !== portalRequerido) {
        return false;
    }

    // Para Enterprise e Operacional, empresaId e mandatório em modelo multi-tenant isolado
    if (portalRequerido === "EMPRESA" || portalRequerido === "OPERACIONAL") {
        if (!perfil.empresaId || perfil.empresaId.trim().length === 0) {
            return false;
        }
    }

    return true;
}
