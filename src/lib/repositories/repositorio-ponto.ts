/**
 * Repositório de Ponto — Client-Side (REST)
 *
 * Encapsula chamadas à API de ponto via fetchJSON.
 * use-client safe.
 */
import { fetchJSON } from "@/lib/http/fetch-json";
import type {
  RegistroPonto,
  EstadoJornadaAtual,
  DadosRegistroPonto,
  BancoHoras,
  RelatoriosPonto,
  AuditoriaPonto,
  LinhaPontoGestor,
  FiltrosPontoGestor,
  JustificativaPonto,
} from "@/lib/tipos/ponto";

// ─── Repositório ─────────────────────────────────────────────

export const repositorioPonto = {

  /** Registra uma batida de ponto */
  async registrarBatida(dados: DadosRegistroPonto) {
    const res = await fetchJSON<{
      mensagem: string;
      registro: RegistroPonto;
      estadoAtual: string;
    }>("/api/empresa/ponto/registrar", {
      method: "POST",
      body: JSON.stringify(dados),
    });
    if (!res.ok) throw new Error(res.message);
    return res.data;
  },

  /** Obtém o estado atual da jornada */
  async obterEstadoJornada() {
    const res = await fetchJSON<EstadoJornadaAtual>("/api/empresa/ponto/estado");
    if (!res.ok) throw new Error(res.message);
    return res.data;
  },

  /** Obtém o histórico de registros */
  async obterHistorico(dataInicio?: string, dataFim?: string) {
    const params = new URLSearchParams();
    if (dataInicio) params.set("dataInicio", dataInicio);
    if (dataFim) params.set("dataFim", dataFim);

    const res = await fetchJSON<RegistroPonto[]>(
      `/api/empresa/ponto/historico?${params.toString()}`
    );
    if (!res.ok) throw new Error(res.message);
    return res.data;
  },

  /** Obtém o saldo de banco de horas */
  async obterSaldo(mes?: number, ano?: number) {
    const params = new URLSearchParams();
    if (mes) params.set("mes", String(mes));
    if (ano) params.set("ano", String(ano));

    const res = await fetchJSON<{
      acumulado: {
        saldoAcumuladoMinutos: number;
        totalTrabalhadoMinutos: number;
        totalHoraExtraMinutos: number;
        totalAtrasoMinutos: number;
        bancoPositivoMinutos: number;
        bancoNegativoMinutos: number;
        diasRegistrados: number;
      };
      mensal: {
        saldoMensalMinutos: number;
        totalTrabalhadoMinutos: number;
        totalHoraExtraMinutos: number;
        totalAtrasoMinutos: number;
        diasTrabalhados: number;
      } | null;
    }>(`/api/empresa/ponto/saldo?${params.toString()}`);
    if (!res.ok) throw new Error(res.message);
    return res.data;
  },

  /** Obtém a planilha de ponto do gestor */
  async obterPlanilhaGestor(filtros: FiltrosPontoGestor) {
    const params = new URLSearchParams();
    if (filtros.data) params.set("data", filtros.data);
    if (filtros.unidadeId) params.set("unidadeId", filtros.unidadeId);
    if (filtros.colaboradorId) params.set("colaboradorId", filtros.colaboradorId);
    if (filtros.status) params.set("status", filtros.status);

    const res = await fetchJSON<RelatoriosPonto>(
      `/api/empresa/ponto/gestao?${params.toString()}`
    );
    if (!res.ok) throw new Error(res.message);
    return res.data;
  },

  /** Registra um ajuste de ponto (gestor) */
  async registrarAjuste(dados: {
    registroPontoId: string;
    horarioAjustado: string;
    motivo: string;
  }) {
    const res = await fetchJSON<{ mensagem: string }>("/api/empresa/ponto/ajustes", {
      method: "POST",
      body: JSON.stringify(dados),
    });
    if (!res.ok) throw new Error(res.message);
    return res.data;
  },

  /** Registra uma justificativa */
  async registrarJustificativa(dados: {
    registroPontoId?: string;
    colaboradorId?: string;
    dataReferencia: string;
    motivo: string;
    observacao?: string;
    anexoUrl?: string;
  }) {
    const res = await fetchJSON<{ mensagem: string; justificativa: JustificativaPonto }>(
      "/api/empresa/ponto/justificativas",
      {
        method: "POST",
        body: JSON.stringify(dados),
      }
    );
    if (!res.ok) throw new Error(res.message);
    return res.data;
  },

  /** Obtém relatório de ponto */
  async obterRelatorio(filtros: {
    tipo: "diario" | "semanal" | "mensal";
    data?: string;
    mes?: number;
    ano?: number;
    unidadeId?: string;
    colaboradorId?: string;
  }) {
    const params = new URLSearchParams();
    params.set("tipo", filtros.tipo);
    if (filtros.data) params.set("data", filtros.data);
    if (filtros.mes) params.set("mes", String(filtros.mes));
    if (filtros.ano) params.set("ano", String(filtros.ano));
    if (filtros.unidadeId) params.set("unidadeId", filtros.unidadeId);
    if (filtros.colaboradorId) params.set("colaboradorId", filtros.colaboradorId);

    const res = await fetchJSON<RelatoriosPonto>(
      `/api/empresa/ponto/relatorios?${params.toString()}`
    );
    if (!res.ok) throw new Error(res.message);
    return res.data;
  },

  /** Obtém logs de auditoria */
  async obterAuditoria(filtros?: {
    registroId?: string;
    dataInicio?: string;
    dataFim?: string;
  }) {
    const params = new URLSearchParams();
    if (filtros?.registroId) params.set("registroId", filtros.registroId);
    if (filtros?.dataInicio) params.set("dataInicio", filtros.dataInicio);
    if (filtros?.dataFim) params.set("dataFim", filtros.dataFim);

    const res = await fetchJSON<AuditoriaPonto[]>(
      `/api/empresa/ponto/auditoria?${params.toString()}`
    );
    if (!res.ok) throw new Error(res.message);
    return res.data;
  },
};
