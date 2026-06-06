/**
 * Serviço de Cálculo de Horas — Restaurante360
 *
 * Motor de cálculo de jornada diária.
 * Calcula horas trabalhadas, pausas, atrasos, horas extras e saldo.
 *
 * server-only
 */
import "server-only";

// ─── Tipos ───────────────────────────────────────────────────

interface RegistroParaCalculo {
  tipoRegistro: string;
  horarioRegistro: Date | string;
  deletadoEm: Date | string | null;
  pausas?: Array<{
    inicio: Date | string;
    fim: Date | string | null;
    duracaoMinutos: number | null;
  }>;
}

interface JornadaPrevistaParaCalculo {
  horarioEntrada: string;  // "HH:MM"
  horarioSaida: string;    // "HH:MM"
  jornadaDiariaMinutos: number;
  toleranciaAtrasoMinutos: number;
  toleranciaSaidaMinutos: number;
  intervaloAlmocoMinutos: number;
  folga: boolean;
}

export interface ResultadoCalculo {
  totalTrabalhadoMinutos: number;
  totalPausasMinutos: number;
  atrasoMinutos: number;
  saidaAntecipadaMinutos: number;
  horaExtraMinutos: number;
  bancoPositivoMinutos: number;
  bancoNegativoMinutos: number;
  saldoFinalMinutos: number;
  jornadaPrevistaMinutos: number;
}

// ─── Valores padrão ──────────────────────────────────────────

const JORNADA_PADRAO: JornadaPrevistaParaCalculo = {
  horarioEntrada: "08:00",
  horarioSaida: "17:00",
  jornadaDiariaMinutos: 480, // 8 horas
  toleranciaAtrasoMinutos: 10,
  toleranciaSaidaMinutos: 10,
  intervaloAlmocoMinutos: 60,
  folga: false,
};

// ─── Funções auxiliares ──────────────────────────────────────

/** Converte "HH:MM" + data referência para um Date */
function horarioParaDate(horarioStr: string, dataReferencia: Date): Date {
  const [h, m] = horarioStr.split(":").map(Number);
  const d = new Date(dataReferencia);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Diferença em minutos entre duas datas */
function diferencaMinutos(inicio: Date, fim: Date): number {
  return Math.round((fim.getTime() - inicio.getTime()) / 60000);
}

// ─── Motor de cálculo ────────────────────────────────────────

/**
 * Calcula a jornada de um dia com base nos registros e na jornada prevista.
 *
 * @param registros Lista de registros de ponto do dia (já filtrados por colaborador)
 * @param jornada Jornada prevista para o dia (ou null para usar padrão)
 * @param dataReferencia Data do dia sendo calculado
 */
export function calcularJornadaDia(
  registros: RegistroParaCalculo[],
  jornada: JornadaPrevistaParaCalculo | null,
  dataReferencia: Date
): ResultadoCalculo {
  const jor = jornada ?? JORNADA_PADRAO;

  // Se é folga, retornar zerado (qualquer hora trabalhada é extra)
  const jornadaPrevistaMinutos = jor.folga ? 0 : jor.jornadaDiariaMinutos;

  // Filtrar registros ativos
  const ativos = registros.filter((r) => !r.deletadoEm);
  if (ativos.length === 0) {
    // Dia sem registro — falta ou folga
    return {
      totalTrabalhadoMinutos: 0,
      totalPausasMinutos: 0,
      atrasoMinutos: 0,
      saidaAntecipadaMinutos: 0,
      horaExtraMinutos: 0,
      bancoPositivoMinutos: 0,
      bancoNegativoMinutos: jor.folga ? 0 : jornadaPrevistaMinutos,
      saldoFinalMinutos: jor.folga ? 0 : -jornadaPrevistaMinutos,
      jornadaPrevistaMinutos,
    };
  }

  // Extrair horários dos registros
  const entrada = ativos.find((r) => r.tipoRegistro === "entrada");
  const saida = ativos.find((r) => r.tipoRegistro === "saida");

  if (!entrada) {
    // Sem entrada, não é possível calcular
    return {
      totalTrabalhadoMinutos: 0,
      totalPausasMinutos: 0,
      atrasoMinutos: 0,
      saidaAntecipadaMinutos: 0,
      horaExtraMinutos: 0,
      bancoPositivoMinutos: 0,
      bancoNegativoMinutos: jornadaPrevistaMinutos,
      saldoFinalMinutos: -jornadaPrevistaMinutos,
      jornadaPrevistaMinutos,
    };
  }

  const horarioEntrada = new Date(entrada.horarioRegistro);
  const horarioSaida = saida ? new Date(saida.horarioRegistro) : null;
  const entradaPrevista = horarioParaDate(jor.horarioEntrada, dataReferencia);
  const saidaPrevista = horarioParaDate(jor.horarioSaida, dataReferencia);

  // Calcular total trabalhado bruto
  const fimPeriodo = horarioSaida ?? new Date(); // Se não saiu, calcula até agora
  let totalTrabalhadoMinutos = diferencaMinutos(horarioEntrada, fimPeriodo);

  // Calcular pausas
  let totalPausasMinutos = 0;
  for (const reg of ativos) {
    if (reg.pausas) {
      for (const pausa of reg.pausas) {
        if (pausa.duracaoMinutos) {
          totalPausasMinutos += pausa.duracaoMinutos;
        } else if (pausa.fim) {
          totalPausasMinutos += diferencaMinutos(
            new Date(pausa.inicio),
            new Date(pausa.fim)
          );
        }
        // Pausa aberta (sem fim) — calcular até agora
        else if (!pausa.fim) {
          totalPausasMinutos += diferencaMinutos(new Date(pausa.inicio), new Date());
        }
      }
    }
  }

  // Descontar pausas do total trabalhado
  totalTrabalhadoMinutos = Math.max(0, totalTrabalhadoMinutos - totalPausasMinutos);

  // Calcular atraso (com tolerância)
  let atrasoMinutos = 0;
  if (!jor.folga) {
    const diferencaEntrada = diferencaMinutos(entradaPrevista, horarioEntrada);
    if (diferencaEntrada > jor.toleranciaAtrasoMinutos) {
      atrasoMinutos = diferencaEntrada;
    }
  }

  // Calcular saída antecipada (com tolerância)
  let saidaAntecipadaMinutos = 0;
  if (!jor.folga && horarioSaida) {
    const diferencaSaida = diferencaMinutos(horarioSaida, saidaPrevista);
    if (diferencaSaida > jor.toleranciaSaidaMinutos) {
      saidaAntecipadaMinutos = diferencaSaida;
    }
  }

  // Calcular hora extra
  let horaExtraMinutos = 0;
  if (totalTrabalhadoMinutos > jornadaPrevistaMinutos) {
    horaExtraMinutos = totalTrabalhadoMinutos - jornadaPrevistaMinutos;
  }

  // Calcular banco de horas
  const saldoBruto = totalTrabalhadoMinutos - jornadaPrevistaMinutos;
  const bancoPositivoMinutos = saldoBruto > 0 ? saldoBruto : 0;
  const bancoNegativoMinutos = saldoBruto < 0 ? Math.abs(saldoBruto) : 0;
  const saldoFinalMinutos = saldoBruto;

  return {
    totalTrabalhadoMinutos,
    totalPausasMinutos,
    atrasoMinutos,
    saidaAntecipadaMinutos,
    horaExtraMinutos,
    bancoPositivoMinutos,
    bancoNegativoMinutos,
    saldoFinalMinutos,
    jornadaPrevistaMinutos,
  };
}

/**
 * Calcula a jornada para múltiplos dias (resumo de período).
 */
export function calcularJornadaPeriodo(
  registrosPorDia: Map<
    string, // "YYYY-MM-DD"
    {
      registros: RegistroParaCalculo[];
      jornada: JornadaPrevistaParaCalculo | null;
    }
  >
): ResultadoCalculo {
  const totais: ResultadoCalculo = {
    totalTrabalhadoMinutos: 0,
    totalPausasMinutos: 0,
    atrasoMinutos: 0,
    saidaAntecipadaMinutos: 0,
    horaExtraMinutos: 0,
    bancoPositivoMinutos: 0,
    bancoNegativoMinutos: 0,
    saldoFinalMinutos: 0,
    jornadaPrevistaMinutos: 0,
  };

  for (const [dataStr, { registros, jornada }] of registrosPorDia) {
    const dataRef = new Date(dataStr + "T00:00:00");
    const resultado = calcularJornadaDia(registros, jornada, dataRef);

    totais.totalTrabalhadoMinutos += resultado.totalTrabalhadoMinutos;
    totais.totalPausasMinutos += resultado.totalPausasMinutos;
    totais.atrasoMinutos += resultado.atrasoMinutos;
    totais.saidaAntecipadaMinutos += resultado.saidaAntecipadaMinutos;
    totais.horaExtraMinutos += resultado.horaExtraMinutos;
    totais.bancoPositivoMinutos += resultado.bancoPositivoMinutos;
    totais.bancoNegativoMinutos += resultado.bancoNegativoMinutos;
    totais.saldoFinalMinutos += resultado.saldoFinalMinutos;
    totais.jornadaPrevistaMinutos += resultado.jornadaPrevistaMinutos;
  }

  return totais;
}
