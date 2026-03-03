import type { PerfilUsuario } from '../types/perfil-usuario';

export function podeAcessarSistema(perfil: PerfilUsuario | null): boolean {
    if (!perfil || perfil.status === 'inativo') return false;
    return perfil.papelGlobal === 'superadmin';
}

export function podeAcessarEmpresa(perfil: PerfilUsuario | null): boolean {
    if (!perfil || perfil.status === 'inativo') return false;

    if (perfil.papelGlobal === 'superadmin') return true; // Superadmin vê tudo por segurança

    return perfil.papelEmpresa === 'admin' || perfil.papelEmpresa === 'gestor';
}

export function podeAcessarOperacional(perfil: PerfilUsuario | null): boolean {
    if (!perfil || perfil.status === 'inativo') return false;

    // Qualquer um logado e ativo tem acesso à sua visão de baixo (operacional) se tiver algum papel assinalado.
    return !!perfil.papelEmpresa || perfil.papelGlobal === 'superadmin';
}
