interface BoasVindasProps {
    nomeEmpresa: string;
    nomeResponsavel: string;
    emailResponsavel: string;
    senhaTemporaria: string;
}

export async function enviarEmailBoasVindas({
    nomeEmpresa,
    nomeResponsavel,
    emailResponsavel,
    senhaTemporaria
}: BoasVindasProps) {
    try {
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        const urlSistema = `${baseUrl}/login`;

        // Simulando a construção do template HTML
        const templateHtml = `
            <div>
                <p>Olá ${nomeResponsavel} 👋</p>
                <br />
                <p>Seu restaurante <strong>${nomeEmpresa}</strong> foi cadastrado com sucesso no <strong>Restaurante360</strong>.</p>
                <p>Seu acesso ao sistema já está disponível.</p>
                <br />
                <p>━━━━━━━━━━━━━━━━━━━━━━</p>
                <p><strong>ACESSO AO SISTEMA</strong></p>
                <p>Link de acesso: <a href="${urlSistema}">${urlSistema}</a></p>
                <p>Login</p>
                <p>Email: ${emailResponsavel}</p>
                <p>Senha temporária: ${senhaTemporaria}</p>
                <p><em>Por segurança recomendamos alterar a senha após o primeiro login.</em></p>
                <br />
                <p>━━━━━━━━━━━━━━━━━━━━━━</p>
                <p><strong>PRÓXIMOS PASSOS</strong></p>
                <p>Dentro do Restaurante360 você poderá:</p>
                <ul>
                    <li>Criar processos operacionais (POPs)</li>
                    <li>Organizar rotinas da equipe</li>
                    <li>Delegar tarefas</li>
                    <li>Monitorar execução</li>
                    <li>Padronizar operação do restaurante</li>
                </ul>
                <br />
                <p>━━━━━━━━━━━━━━━━━━━━━━</p>
                <p><strong>SUPORTE</strong></p>
                <p>Se precisar de ajuda:</p>
                <p><a href="mailto:suporte@restaurante360.com">suporte@restaurante360.com</a></p>
                <p>Equipe Restaurante360</p>
            </div>
        `;

        // Aqui o HTML seria enviado para o provider (Nodemailer, Resend, Sendgrid, etc)
        // Como ainda não há um provider configurado no projeto, vamos simular o envio com sucesso no console

        console.log(`[EMAIL_SENDER] Simulando envio de E-mail de Boas Vindas para: ${emailResponsavel}`);
        /* Console log do HTML omitido para não poluir os logs, mas em ambiente dev pode ser útil
        console.log("--- CONTEÚDO DO EMAIL ---");
        console.log(templateHtml);
        console.log("-------------------------");
        */

        // (PLACEHOLDER FUTURO)
        // Suporte a link de ativação de conta:
        // const linkAtivacao = `${baseUrl}/ativar-conta?token=...`

        return true;
    } catch (error) {
        // Disparos de e-mail não devem bloquear o fluxo principal em caso de falhas
        console.error("[EMAIL_SENDER_ERROR] Falha ao enviar e-mail de boas vindas:", error);
        return false;
    }
}
