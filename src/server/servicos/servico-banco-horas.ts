/**
 * Serviço de Banco de Horas — Restaurante360
 *
 * Processa saldos diários, acumulados e fechamento mensal.
 * server-only
 */
import "server-only";
import { repositorioPontoPg } from "@/server/repositorios/repositorio-ponto-pg";
import { repositorioBancoHorasPg } from "@/server/repositorios/repositorio-banco-horas-pg";
import { repositorioRelatoriosPontoPg } from "@/server/repositorios/repositorio-relatorios-ponto-pg";
import { calcularJornadaDia } from "./servico-calculo-horas";

// ─── Mapeamento dia da semana ────────────────────────────────

const DIAS_SEMANA = [
  "domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado",
] as const;

// ─── Funções do serviço ──────────────────────────────────────

/**
 * Processa o saldo de banco de horas de um dia específico.
 * Calcula com base nos registros de ponto e na jornada prevista.
 */
export async function processarDia(
  empresaId: string,
  colaboradorId: string,
  dataReferencia: Date
) {
  // Obter registros do dia
  const registros = await repositorioPontoPg.obterRegistrosDia(
    empresaId,
    colaboradorId,
    dataReferencia
  );

  // Obter jornada prevista para o dia da semana
  const diaSemana = DIAS_SEMANA[dataReferencia.getDay()];
  const jornadaPrevista = await repositorioPontoPg.obterJornadaPrevista(
    colaboradorId,
    diaSemana
  );

  // Montar dados da jornada para o motor de cálculo
  const jornadaCalculo = jornadaPrevista
    ? {
        horarioEntrada: jornadaPrevista.horarioEntrada,
        horarioSaida: jornadaPrevista.horarioSaida,
        jornadaDiariaMinutos: jornadaPrevista.escala?.jornadaDiariaMinutos ?? 480,
        toleranciaAtrasoMinutos: jornadaPrevista.escala?.toleranciaAtrasoMinutos ?? 10,
        toleranciaSaidaMinutos: jornadaPrevista.escala?.toleranciaSaidaMinutos ?? 10,
        intervaloAlmocoMinutos: jornadaPrevista.escala?.intervaloAlmocoMinutos ?? 60,
        folga: jornadaPrevista.folga,
      }
    : null;

  // Calcular
  const resultado = calcularJornadaDia(registros, jornadaCalculo, dataReferencia);

  // Persistir no banco de horas
  await repositorioBancoHorasPg.criarOuAtualizar({
    empresaId,
    colaboradorId,
    dataReferencia,
    ...resultado,
  });

  return resultado;
}

/**
 * Obtém o saldo acumulado de banco de horas de um colaborador.
 */
export async function obterSaldoAcumulado(empresaId: string, colaboradorId: string) {
  return repositorioBancoHorasPg.obterSaldoAcumulado(empresaId, colaboradorId);
}

/**
 * Fecha o ponto de um mês para um colaborador.
 * Calcula totais e gera o registro de fechamento.
 */
export async function fecharMes(
  empresaId: string,
  colaboradorId: string,
  mes: number,
  ano: number,
  fechadoPor: string,
  observacao?: string
) {
  // Obter resumo mensal
  const resumo = await repositorioBancoHorasPg.obterSaldoMensal(
    empresaId,
    colaboradorId,
    mes,
    ano
  );

  // Contar faltas (dias sem registro que não são folga)
  // Simplificação: considerar dias úteis do mês - dias trabalhados
  const dataInicio = new Date(ano, mes - 1, 1);
  const dataFim = new Date(ano, mes, 0);
  let diasUteis = 0;

  for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
    const dia = d.getDay();
    if (dia !== 0 && dia !== 6) diasUteis++; // Excluir sábado e domingo
  }

  const totalFaltas = Math.max(0, diasUteis - resumo.diasTrabalhados);

  // Criar/atualizar fechamento
  await repositorioRelatoriosPontoPg.criarOuAtualizarFechamento({
    empresaId,
    colaboradorId,
    mes,
    ano,
    totalTrabalhadoMinutos: resumo.totalTrabalhadoMinutos,
    totalHoraExtraMinutos: resumo.totalHoraExtraMinutos,
    totalAtrasoMinutos: resumo.totalAtrasoMinutos,
    totalFaltas,
    saldoBancoMinutos: resumo.saldoMensalMinutos,
    diasTrabalhados: resumo.diasTrabalhados,
    fechadoPor,
    observacao,
  });

  return {
    ...resumo,
    totalFaltas,
    diasUteis,
  };
}
