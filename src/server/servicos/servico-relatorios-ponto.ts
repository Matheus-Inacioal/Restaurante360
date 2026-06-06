/**
 * Serviço de Relatórios de Ponto — Restaurante360
 *
 * Gera relatórios diários, semanais e mensais.
 * server-only
 */
import "server-only";
import { repositorioPontoPg } from "@/server/repositorios/repositorio-ponto-pg";
import { repositorioBancoHorasPg } from "@/server/repositorios/repositorio-banco-horas-pg";
import { repositorioRelatoriosPontoPg } from "@/server/repositorios/repositorio-relatorios-ponto-pg";
import type { LinhaPontoGestor } from "@/lib/tipos/ponto";

// ─── Tipos locais ────────────────────────────────────────────

interface FiltrosRelatorio {
  empresaId: string;
  unidadeId?: string;
  colaboradorId?: string;
}

interface ResultadoRelatorio {
  periodo: { inicio: string; fim: string };
  tipo: "diario" | "semanal" | "mensal";
  totalHorasMinutos: number;
  totalHorasExtrasMinutos: number;
  totalFaltas: number;
  totalAtrasos: number;
  bancoPositivoMinutos: number;
  bancoNegativoMinutos: number;
  saldoFinalMinutos: number;
  linhas: LinhaPontoGestor[];
}

// ─── Funções auxiliares ──────────────────────────────────────

function formatarHorario(data: Date | string | null): string | null {
  if (!data) return null;
  const d = new Date(data);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Relatórios ──────────────────────────────────────────────

/**
 * Gera relatório diário com planilha de ponto dos colaboradores.
 */
export async function gerarRelatorioDiario(
  filtros: FiltrosRelatorio & { data: string }
): Promise<ResultadoRelatorio> {
  const dataRef = new Date(filtros.data + "T00:00:00");

  // Obter colaboradores
  const colaboradores = filtros.unidadeId
    ? await repositorioPontoPg.obterColaboradoresUnidade(filtros.empresaId, filtros.unidadeId)
    : [];

  const linhas: LinhaPontoGestor[] = [];
  let totalHorasMinutos = 0;
  let totalHorasExtrasMinutos = 0;
  let totalAtrasos = 0;
  let bancoPositivoMinutos = 0;
  let bancoNegativoMinutos = 0;

  const colaboradoresAlvo = filtros.colaboradorId
    ? colaboradores.filter((c) => c.id === filtros.colaboradorId)
    : colaboradores;

  for (const col of colaboradoresAlvo) {
    // Obter registros do dia
    const registros = await repositorioPontoPg.obterRegistrosDia(
      filtros.empresaId,
      col.id,
      dataRef
    );

    // Obter saldo do dia
    const saldoDia = await repositorioBancoHorasPg.obterSaldoDia(
      filtros.empresaId,
      col.id,
      dataRef
    );

    // Extrair horários
    const entrada = registros.find((r) => r.tipoRegistro === "entrada" && !r.deletadoEm);
    const saida = registros.find((r) => r.tipoRegistro === "saida" && !r.deletadoEm);
    const inicPausa = registros.find((r) => r.tipoRegistro === "inicio_pausa" && !r.deletadoEm);
    const fimPausa = registros.find((r) => r.tipoRegistro === "fim_pausa" && !r.deletadoEm);

    // Obter jornada prevista
    const DIAS = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"] as const;
    const diaSemana = DIAS[dataRef.getDay()];
    const jornada = await repositorioPontoPg.obterJornadaPrevista(col.id, diaSemana);

    // Determinar status
    let status: LinhaPontoGestor["status"] = "valido";
    if (jornada?.folga) {
      status = "folga";
    } else if (!entrada && !saida) {
      status = "falta";
    } else {
      const statusRegistro = entrada?.statusRegistro ?? saida?.statusRegistro;
      if (statusRegistro) status = statusRegistro as any;
    }

    const linha: LinhaPontoGestor = {
      colaboradorId: col.id,
      colaboradorNome: col.nome,
      entradaPrevista: jornada?.horarioEntrada ?? null,
      entradaRealizada: formatarHorario(entrada?.horarioRegistro ?? null),
      pausaInicio: formatarHorario(inicPausa?.horarioRegistro ?? null),
      pausaFim: formatarHorario(fimPausa?.horarioRegistro ?? null),
      saidaPrevista: jornada?.horarioSaida ?? null,
      saidaRealizada: formatarHorario(saida?.horarioRegistro ?? null),
      atrasoMinutos: saldoDia?.atrasoMinutos ?? 0,
      horaExtraMinutos: saldoDia?.horaExtraMinutos ?? 0,
      bancoHorasMinutos: saldoDia?.saldoFinalMinutos ?? 0,
      saldoFinalMinutos: saldoDia?.saldoFinalMinutos ?? 0,
      status,
      justificativa: null,
    };

    linhas.push(linha);
    totalHorasMinutos += saldoDia?.totalTrabalhadoMinutos ?? 0;
    totalHorasExtrasMinutos += saldoDia?.horaExtraMinutos ?? 0;
    if (saldoDia?.atrasoMinutos && saldoDia.atrasoMinutos > 0) totalAtrasos++;
    bancoPositivoMinutos += saldoDia?.bancoPositivoMinutos ?? 0;
    bancoNegativoMinutos += saldoDia?.bancoNegativoMinutos ?? 0;
  }

  const totalFaltas = linhas.filter((l) => l.status === "falta").length;

  return {
    periodo: { inicio: filtros.data, fim: filtros.data },
    tipo: "diario",
    totalHorasMinutos,
    totalHorasExtrasMinutos,
    totalFaltas,
    totalAtrasos,
    bancoPositivoMinutos,
    bancoNegativoMinutos,
    saldoFinalMinutos: bancoPositivoMinutos - bancoNegativoMinutos,
    linhas,
  };
}

/**
 * Gera relatório semanal.
 */
export async function gerarRelatorioSemanal(
  filtros: FiltrosRelatorio & { data: string }
): Promise<ResultadoRelatorio> {
  const dataRef = new Date(filtros.data + "T00:00:00");
  // Calcular início e fim da semana (segunda a domingo)
  const diaSemana = dataRef.getDay();
  const diffSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
  const inicio = new Date(dataRef);
  inicio.setDate(dataRef.getDate() + diffSegunda);
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);

  // Usar relatório mensal simplificado para o período da semana
  return gerarRelatorioMensal({
    ...filtros,
    mes: inicio.getMonth() + 1,
    ano: inicio.getFullYear(),
  });
}

/**
 * Gera relatório mensal.
 */
export async function gerarRelatorioMensal(
  filtros: FiltrosRelatorio & { mes: number; ano: number }
): Promise<ResultadoRelatorio> {
  const resumoMensal = await repositorioRelatoriosPontoPg.obterResumoMensal(
    filtros.empresaId,
    filtros.mes,
    filtros.ano
  );

  const linhas: LinhaPontoGestor[] = resumoMensal
    .filter((r) => !filtros.colaboradorId || r.colaboradorId === filtros.colaboradorId)
    .map((r) => ({
      colaboradorId: r.colaboradorId,
      colaboradorNome: r.colaboradorNome,
      entradaPrevista: null,
      entradaRealizada: null,
      pausaInicio: null,
      pausaFim: null,
      saidaPrevista: null,
      saidaRealizada: null,
      atrasoMinutos: r.totalAtrasoMinutos,
      horaExtraMinutos: r.totalHoraExtraMinutos,
      bancoHorasMinutos: r.saldoFinalMinutos,
      saldoFinalMinutos: r.saldoFinalMinutos,
      status: "valido" as const,
      justificativa: null,
    }));

  const totais = linhas.reduce(
    (acc, l) => ({
      totalHoras: acc.totalHoras + (l.saldoFinalMinutos > 0 ? l.saldoFinalMinutos : 0),
      totalHE: acc.totalHE + l.horaExtraMinutos,
      totalAtrasos: acc.totalAtrasos + (l.atrasoMinutos > 0 ? 1 : 0),
      bancoPos: acc.bancoPos + (l.saldoFinalMinutos > 0 ? l.saldoFinalMinutos : 0),
      bancoNeg: acc.bancoNeg + (l.saldoFinalMinutos < 0 ? Math.abs(l.saldoFinalMinutos) : 0),
    }),
    { totalHoras: 0, totalHE: 0, totalAtrasos: 0, bancoPos: 0, bancoNeg: 0 }
  );

  const dataInicio = new Date(filtros.ano, filtros.mes - 1, 1);
  const dataFim = new Date(filtros.ano, filtros.mes, 0);

  return {
    periodo: {
      inicio: dataInicio.toISOString().split("T")[0],
      fim: dataFim.toISOString().split("T")[0],
    },
    tipo: "mensal",
    totalHorasMinutos: totais.totalHoras,
    totalHorasExtrasMinutos: totais.totalHE,
    totalFaltas: 0,
    totalAtrasos: totais.totalAtrasos,
    bancoPositivoMinutos: totais.bancoPos,
    bancoNegativoMinutos: totais.bancoNeg,
    saldoFinalMinutos: totais.bancoPos - totais.bancoNeg,
    linhas,
  };
}
