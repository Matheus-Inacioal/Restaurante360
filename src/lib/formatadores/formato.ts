export function somenteDigitos(valor: string) {
    return (valor ?? "").replace(/\D/g, "");
}

/** Máscara: 00.000.000/0000-00 */
export function formatarCNPJ(valor: string) {
    const v = somenteDigitos(valor).slice(0, 14);
    return v
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
}

/** Máscara telefone BR com ou sem DDI */
export function formatarTelefoneBR(valor: string) {
    let v = somenteDigitos(valor).slice(0, 13);

    const temDDI = v.startsWith("55") && v.length > 11;
    const ddi = temDDI ? v.slice(0, 2) : "";
    const resto = temDDI ? v.slice(2) : v;

    const ddd = resto.slice(0, 2);
    const numero = resto.slice(2);

    if (!ddd) return temDDI ? `+${ddi}` : "";

    const isCelular = numero.length >= 9;
    const corte = isCelular ? 5 : 4;

    const parte1 = numero.length > 0 ? numero.slice(0, Math.min(corte, numero.length)) : "";
    const parte2 = numero.length > corte ? numero.slice(corte) : "";

    const prefixo = temDDI ? `+${ddi} ` : "";
    return `${prefixo}(${ddd}) ${parte1}${parte2 ? "-" + parte2 : ""}`.trim();
}

export function normalizarCNPJ(valor: string) {
    return somenteDigitos(valor).slice(0, 14);
}

export function normalizarWhatsApp(valor: string) {
    const v = somenteDigitos(valor).slice(0, 13);
    if (!v.startsWith("55") && (v.length === 10 || v.length === 11)) return `55${v}`;
    return v;
}
