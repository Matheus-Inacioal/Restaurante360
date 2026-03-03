export interface PerfilUsuario {
    uid: string;
    nome: string;
    email: string;
    status: "ativo" | "inativo";
    papelGlobal: "superadmin" | null;
    empresaAtualId: string | null;
    papelEmpresa: "admin" | "gestor" | "operacional" | null;
}
\n    }\n    \n    export interface Empresa {\n      id: string;\n      nome: string;\n      cnpj?: string;\n      responsavel: string;\n      emailResponsavel: string;\n      plano: 'Starter' | 'Pro' | 'Enterprise';\n      status: 'Ativa' | 'Suspensa';\n      criadoEm: string;\n    }\n
