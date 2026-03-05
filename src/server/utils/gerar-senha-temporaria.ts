export function gerarSenhaTemporaria(): string {
    const charsAlphaNum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomPart = '';

    // Generate 6 random alphanumeric characters
    for (let i = 0; i < 6; i++) {
        randomPart += charsAlphaNum.charAt(Math.floor(Math.random() * charsAlphaNum.length));
    }

    // Ensure format like Temp#4832 by prefixing Temp#
    return `Temp#${randomPart}`;
}
