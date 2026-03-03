import type { PerfilUsuario } from '../types/perfil-usuario';

export function obterRotaInicialDoUsuario(perfil: PerfilUsuario | null): string {
    if (!perfil) {
        return '/login'; // Fallback se não logado ou sem perfil
    }

    if (perfil.status === 'inativo') {
        return '/acesso-negado';
    }

    // Se superadmin sistema base "master"
    if (perfil.papelGlobal === 'superadmin') {
        return '/sistema';
    }

    // Falha na checagem corporativa local
    if (!perfil.empresaAtualId && !perfil.papelGlobal) {
        return '/acesso-negado';
    }

    // Gestão Master/Gestão -> Portal Empresa
    if (perfil.papelEmpresa === 'admin' || perfil.papelEmpresa === 'gestor') {
        return '/empresa';
    }

    // Operacional staff limitados -> Portal Operacional
    if (perfil.papelEmpresa === 'operacional') {
        return '/operacional';
    }

    // Sem papel designado que possamos identificar
    return '/acesso-negado';
}
