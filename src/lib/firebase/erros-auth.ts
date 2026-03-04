export function traduzErroFirebase(code?: string): string {
    switch (code) {
        case "auth/invalid-credential":
            return "E-mail ou senha inválidos.";
        case "auth/user-not-found":
            return "Usuário não encontrado.";
        case "auth/wrong-password":
            return "Senha incorreta.";
        case "auth/operation-not-allowed":
            return "Login por e-mail/senha não está habilitado no Firebase.";
        case "auth/unauthorized-domain":
            return "Domínio não autorizado no Firebase Auth.";
        case "auth/invalid-api-key":
            return "API key inválida. Verifique o .env.local.";
        case "auth/network-request-failed":
            return "Falha de rede ao conectar no Firebase.";
        case "auth/too-many-requests":
            return "O acesso a esta conta foi temporariamente desativado devido a muitas tentativas de login malsucedidas. Você pode restaurá-lo redefinindo sua senha ou tentando novamente mais tarde.";
        case "auth/user-disabled":
            return "Sua conta de usuário foi desativada por um administrador.";
        default:
            return `Erro ao fazer login. (${code ?? "desconhecido"})`;
    }
}
