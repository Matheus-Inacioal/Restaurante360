export type FetchJsonError = {
    status: number;
    message: string;
    raw?: string;
    details?: unknown;
};

function isJsonResponse(res: Response) {
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json");
}

async function safeReadText(res: Response) {
    try {
        return await res.text();
    } catch {
        return "";
    }
}

export async function fetchJSON<T>(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<T> {
    const res = await fetch(input, init);

    // 204 No Content
    if (res.status === 204) {
        // @ts-expect-error - permite undefined quando a rota não retorna body
        return undefined;
    }

    const json = isJsonResponse(res);

    if (!json) {
        const raw = await safeReadText(res);
        const err: FetchJsonError = {
            status: res.status,
            message: "Resposta inválida do servidor (não é JSON).",
            raw,
        };
        throw err;
    }

    let data: any;
    try {
        data = await res.json();
    } catch {
        const raw = await safeReadText(res);
        const err: FetchJsonError = {
            status: res.status,
            message: "Falha ao ler JSON da API.",
            raw,
        };
        throw err;
    }

    if (!res.ok) {
        const err: FetchJsonError = {
            status: res.status,
            message: data?.message || "Erro ao processar requisição.",
            details: data?.issues ?? data,
        };
        throw err;
    }

    return data as T;
}
