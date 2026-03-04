import { PerfilUsuario } from "./types/identidade";

export function calcularRotaInicial(perfil: PerfilUsuario): string {
    if (!perfil.ativo) {
        return "/acesso-negado";
    }

    switch (perfil.papelPortal) {
        case "SISTEMA":
            return "/sistema";
        case "EMPRESA":
            return "/empresa";
        case "OPERACIONAL":
            return "/operacional";
        default:
            return "/acesso-negado";
    }
}
