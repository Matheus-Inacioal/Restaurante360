import { fetchJSON } from "../http/fetch-json";
import type { DashboardEmpresaData } from "../types/dashboard-empresa";

export interface RepositorioDashboardEmpresa {
    obterConsolidado(): Promise<DashboardEmpresaData>;
}

export class RepositorioDashboardEmpresaRest implements RepositorioDashboardEmpresa {
    async obterConsolidado(): Promise<DashboardEmpresaData> {
        // A API extrai o empresaId da sessão (cookie), não precisa passar na query
        const res = await fetchJSON<DashboardEmpresaData>(`/api/empresa/dashboard`);
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }
}

export const repositorioDashboardEmpresa = new RepositorioDashboardEmpresaRest();
