import { usePerfil } from "./use-perfil";

export function useTenant() {
    const { perfilUsuario, carregandoPerfil, erroPerfil } = usePerfil();

    if (carregandoPerfil) {
        return { empresaId: null, carregandoTenant: true, erroTenant: null };
    }

    if (erroPerfil || !perfilUsuario) {
        return { empresaId: null, carregandoTenant: false, erroTenant: erroPerfil };
    }

    const papel = perfilUsuario.papelPortal;
    const isTenantBased = papel === "EMPRESA" || papel === "OPERACIONAL";

    if (isTenantBased && !perfilUsuario.empresaId) {
        return {
            empresaId: null,
            carregandoTenant: false,
            erroTenant: new Error("Ops! Você ainda não possui uma empresa vinculada.")
        };
    }

    return {
        empresaId: perfilUsuario.empresaId || null,
        carregandoTenant: false,
        erroTenant: null
    };
}
