import type { UsuarioSistema, PapelUsuario, StatusUsuario } from "../types/usuarios";

export interface RepositorioUsuarios {
    listarUsuarios(): Promise<UsuarioSistema[]>;
    criarUsuario(dados: Omit<UsuarioSistema, "id" | "criadoEm" | "atualizadoEm">): Promise<UsuarioSistema>;
    atualizarUsuario(id: string, atualizacoes: Partial<UsuarioSistema>): Promise<UsuarioSistema>;
    inativarUsuario(id: string): Promise<void>;
    reativarUsuario(id: string): Promise<void>;
}

const STORAGE_KEY = "@r360:usuarios";

const SEED_USUARIOS: UsuarioSistema[] = [
    {
        id: "usr_admin_001",
        nome: "Gestor Master",
        email: "gestor@exemplo.com",
        papel: "admin",
        status: "ativo",
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
    },
    {
        id: "usr_operador_001",
        nome: "Operador Exemplo",
        email: "operador@exemplo.com",
        papel: "operacional",
        status: "ativo",
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
    }
];

class RepositorioUsuariosLocal implements RepositorioUsuarios {
    private getUsuarios(): UsuarioSistema[] {
        if (typeof window === "undefined") return []; // Evitar problema no SSR

        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            // Aplicar o Seed
            this.saveUsuarios(SEED_USUARIOS);
            return SEED_USUARIOS;
        }

        try {
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    private saveUsuarios(usuarios: UsuarioSistema[]) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
    }

    async listarUsuarios(): Promise<UsuarioSistema[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.getUsuarios());
            }, 500); // Simulando delay de rede
        });
    }

    async criarUsuario(dados: Omit<UsuarioSistema, "id" | "criadoEm" | "atualizadoEm">): Promise<UsuarioSistema> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const usuarios = this.getUsuarios();

                // Validar e-mail único
                const emailJaExiste = usuarios.some(u => u.email.toLowerCase() === dados.email.toLowerCase());
                if (emailJaExiste) {
                    reject(new Error("Já existe um usuário cadastrado com este e-mail."));
                    return;
                }

                const novoUsuario: UsuarioSistema = {
                    ...dados,
                    id: `usr_${Date.now()}`,
                    criadoEm: new Date().toISOString(),
                    atualizadoEm: new Date().toISOString()
                };

                usuarios.push(novoUsuario);
                this.saveUsuarios(usuarios);
                resolve(novoUsuario);
            }, 600);
        });
    }

    async atualizarUsuario(id: string, atualizacoes: Partial<UsuarioSistema>): Promise<UsuarioSistema> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const usuarios = this.getUsuarios();
                const index = usuarios.findIndex(u => u.id === id);

                if (index === -1) {
                    reject(new Error("Usuário não encontrado."));
                    return;
                }

                // Se estiver atualizando e-mail, checar se não conflita com outro existente
                if (atualizacoes.email) {
                    const emailJaExisteNoutro = usuarios.some(u =>
                        u.id !== id && u.email.toLowerCase() === atualizacoes.email?.toLowerCase()
                    );
                    if (emailJaExisteNoutro) {
                        reject(new Error("Este e-mail já está sendo utilizado por outro usuário."));
                        return;
                    }
                }

                const usuarioAtualizado = {
                    ...usuarios[index],
                    ...atualizacoes,
                    atualizadoEm: new Date().toISOString()
                };

                usuarios[index] = usuarioAtualizado;
                this.saveUsuarios(usuarios);
                resolve(usuarioAtualizado);
            }, 500);
        });
    }

    async inativarUsuario(id: string): Promise<void> {
        await this.atualizarUsuario(id, { status: "inativo" });
    }

    async reativarUsuario(id: string): Promise<void> {
        await this.atualizarUsuario(id, { status: "ativo" });
    }
}

export const repositorioUsuarios = new RepositorioUsuariosLocal();
