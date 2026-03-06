export type ApiErrorCode =
    | "VALIDATION_ERROR"
    | "UNAUTHORIZED"
    | "NOT_FOUND"
    | "NON_JSON_RESPONSE"
    | "INTERNAL_ERROR";

export type ApiResponse<T = unknown> =
    | { ok: true; data: T }
    | {
        ok: false;
        code: ApiErrorCode;
        message: string;
        issues?: Record<string, string[]>;
    };

export class FetchJsonError extends Error {
    public code: ApiErrorCode;
    public status: number;
    public issues?: Record<string, string[]>;

    constructor(
        message: string,
        code: ApiErrorCode = "INTERNAL_ERROR",
        status: number = 500,
        issues?: Record<string, string[]>
    ) {
        super(message);
        this.name = "FetchJsonError";
        this.code = code;
        this.status = status;
        this.issues = issues;
    }
}

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

function mapStatusToCode(status: number): ApiErrorCode {
    if (status === 400 || status === 422) return "VALIDATION_ERROR";
    if (status === 401 || status === 403) return "UNAUTHORIZED";
    if (status === 404) return "NOT_FOUND";
    return "INTERNAL_ERROR";
}

/**
 * Utilitário para realizar chamadas API garantindo o padrão de respostas.
 * Se a resposta for JSON e contiver `{ ok: ... }`, ele retorna o objeto parseado.
 * Se a requisição falhar (4xx, 5xx), ele lança um `FetchJsonError` mapeado ou retorna o erro formatado se optarmos por não lançar catch (atualmente lança erro para manter compatibilidade retroativa onde é esperado try/catch).
 */
export async function fetchJSON<T>(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<ApiResponse<T>> {
    const res = await fetch(input, init);

    if (res.status === 204) {
        // Para rotas sem conteúdo, assumimos sucesso genérico sem data
        return { ok: true, data: undefined as any };
    }

    const isJson = isJsonResponse(res);

    if (!isJson) {
        const raw = await safeReadText(res);
        throw new FetchJsonError(
            "Resposta inválida do servidor (não é JSON).",
            "NON_JSON_RESPONSE",
            res.status
        );
    }

    let data: any;
    try {
        data = await res.json();
    } catch {
        throw new FetchJsonError(
            "Falha ao ler JSON da API.",
            "NON_JSON_RESPONSE",
            res.status
        );
    }

    if (!res.ok) {
        const code = data?.code || mapStatusToCode(res.status);
        const message = data?.message || "Erro ao processar requisição.";
        const issues = data?.issues;

        throw new FetchJsonError(message, code, res.status, issues);
    }

    // Se a API já reponde no formato { ok: true, data: ... }, apenas retorna
    if (data && typeof data === "object" && "ok" in data) {
        return data as ApiResponse<T>;
    }

    // Caso retorne apenas os dados puros (legado), envelopamos no padrão
    return { ok: true, data: data as T };
}
