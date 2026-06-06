/**
 * Serviço de Registro de Ponto — Restaurante360
 *
 * Implementa a máquina de estados da jornada e orquestra:
 * validação → geolocalização → registro → auditoria
 *
 * server-only
 */
import "server-only";
import { repositorioPontoPg } from "@/server/repositorios/repositorio-ponto-pg";
import { repositorioAuditoriaPontoPg } from "@/server/repositorios/repositorio-auditoria-ponto-pg";
import { validarLocalizacaoPonto } from "@/lib/utils/geolocalizacao";
import type {
  TipoRegistroPonto,
  OrigemRegistroPonto,
  StatusRegistroPonto,
} from "@prisma/client";

// ─── Tipos ───────────────────────────────────────────────────

type EstadoJornada =
  | "sem_registro"
  | "trabalhando"
  | "em_pausa"
  | "retornou_pausa"
  | "jornada_finalizada";

interface DadosRegistro {
  empresaId: string;
  unidadeId: string;
  colaboradorId: string;
  tipoRegistro: TipoRegistroPonto;
  latitude?: number;
  longitude?: number;
  origemRegistro?: OrigemRegistroPonto;
  observacao?: string;
  ip?: string;
  userAgent?: string;
}

interface ResultadoRegistro {
  sucesso: boolean;
  mensagem: string;
  registro?: Awaited<ReturnType<typeof repositorioPontoPg.criarRegistro>>;
  estadoAtual?: EstadoJornada;
}

// ─── Mapeamento de transições válidas ────────────────────────

/**
 * Máquina de estados:
 *   sem_registro     → entrada
 *   trabalhando      → inicio_pausa | saida
 *   em_pausa         → fim_pausa
 *   retornou_pausa   → inicio_pausa | saida
 *   jornada_finalizada → (nenhuma)
 */
const TRANSICOES_VALIDAS: Record<EstadoJornada, TipoRegistroPonto[]> = {
  sem_registro: ["entrada"],
  trabalhando: ["inicio_pausa", "saida"],
  em_pausa: ["fim_pausa"],
  retornou_pausa: ["inicio_pausa", "saida"],
  jornada_finalizada: [],
};

const MENSAGENS_BLOQUEIO: Record<string, string> = {
  "sem_registro:saida": "Não é possível registrar saída sem ter registrado entrada.",
  "sem_registro:inicio_pausa": "Não é possível iniciar pausa sem ter registrado entrada.",
  "sem_registro:fim_pausa": "Não é possível finalizar pausa sem ter iniciado uma.",
  "trabalhando:entrada": "Você já registrou entrada hoje.",
  "trabalhando:fim_pausa": "Não há pausa aberta para finalizar.",
  "em_pausa:entrada": "Você já registrou entrada hoje.",
  "em_pausa:saida": "Finalize sua pausa antes de registrar saída.",
  "em_pausa:inicio_pausa": "Você já está em pausa.",
  "retornou_pausa:entrada": "Você já registrou entrada hoje.",
  "retornou_pausa:fim_pausa": "Não há pausa aberta para finalizar.",
  "jornada_finalizada:entrada": "Jornada já finalizada para hoje.",
  "jornada_finalizada:saida": "Jornada já finalizada para hoje.",
  "jornada_finalizada:inicio_pausa": "Jornada já finalizada para hoje.",
  "jornada_finalizada:fim_pausa": "Jornada já finalizada para hoje.",
};

// ─── Funções auxiliares ──────────────────────────────────────

/** Obtém a data de referência (apenas a data, sem horário) */
function obterDataReferencia(): Date {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

/** Determina o estado atual da jornada com base nos registros do dia */
export function determinarEstadoJornada(
  registros: Array<{ tipoRegistro: TipoRegistroPonto; deletadoEm: Date | null }>,
  pausasAbertas: Array<{ fim: Date | null }>
): EstadoJornada {
  // Filtrar apenas registros ativos (não deletados)
  const ativos = registros.filter((r) => !r.deletadoEm);

  if (ativos.length === 0) return "sem_registro";

  // Verificar se já tem saída
  const temSaida = ativos.some((r) => r.tipoRegistro === "saida");
  if (temSaida) return "jornada_finalizada";

  // Verificar pausas
  const temPausaAberta = pausasAbertas.length > 0;
  if (temPausaAberta) return "em_pausa";

  // Verificar se já retornou de pausa
  const temFimPausa = ativos.some((r) => r.tipoRegistro === "fim_pausa");
  if (temFimPausa) return "retornou_pausa";

  // Verificar se iniciou pausa (mas fim_pausa não existe, e não há pausa aberta)
  // Isso pode ser um estado inconsistente, tratar como trabalhando
  const temEntrada = ativos.some((r) => r.tipoRegistro === "entrada");
  if (temEntrada) return "trabalhando";

  return "sem_registro";
}

/** Obtém a próxima ação permitida para o estado atual */
export function obterAcaoPermitida(estado: EstadoJornada): TipoRegistroPonto | null {
  const acoes = TRANSICOES_VALIDAS[estado];
  return acoes.length > 0 ? acoes[0] : null;
}

// ─── Serviço principal ───────────────────────────────────────

/**
 * Registra uma batida de ponto com todas as validações.
 */
export async function registrarPonto(dados: DadosRegistro): Promise<ResultadoRegistro> {
  const dataReferencia = obterDataReferencia();
  const agora = new Date();

  // 1. Obter registros do dia
  const registrosDoDia = await repositorioPontoPg.obterRegistrosDia(
    dados.empresaId,
    dados.colaboradorId,
    dataReferencia
  );

  // 2. Obter pausas abertas
  const pausasAbertas = await repositorioPontoPg.obterPausasAbertas(
    dados.empresaId,
    dados.colaboradorId,
    dataReferencia
  );

  // 3. Determinar estado atual
  const estadoAtual = determinarEstadoJornada(registrosDoDia, pausasAbertas);

  // 4. Validar transição
  const transicoesPermitidas = TRANSICOES_VALIDAS[estadoAtual];
  if (!transicoesPermitidas.includes(dados.tipoRegistro)) {
    const chave = `${estadoAtual}:${dados.tipoRegistro}`;
    const mensagem = MENSAGENS_BLOQUEIO[chave] ?? "Ação não permitida no estado atual da jornada.";

    // Registrar tentativa recusada em auditoria
    await repositorioAuditoriaPontoPg.registrar({
      empresaId: dados.empresaId,
      tipoAlteracao: "criacao",
      valorNovo: {
        tipoRegistro: dados.tipoRegistro,
        estadoAtual,
        motivo: mensagem,
      },
      responsavelId: dados.colaboradorId,
      ip: dados.ip,
      userAgent: dados.userAgent,
    });

    return { sucesso: false, mensagem, estadoAtual };
  }

  // 5. Validar geolocalização (se coordenadas fornecidas)
  let dentroRaio = true;
  let distanciaMetros: number | null = null;
  let statusRegistro: StatusRegistroPonto = "valido";

  if (dados.latitude !== undefined && dados.longitude !== undefined) {
    const unidade = await repositorioPontoPg.obterUnidadeComGeo(dados.unidadeId);

    if (unidade?.latitude && unidade?.longitude && unidade?.raioPermitidoMetros) {
      const resultadoGeo = validarLocalizacaoPonto(
        dados.latitude,
        dados.longitude,
        unidade.latitude,
        unidade.longitude,
        unidade.raioPermitidoMetros
      );

      dentroRaio = resultadoGeo.dentroRaio;
      distanciaMetros = resultadoGeo.distanciaMetros;

      if (!dentroRaio) {
        statusRegistro = "recusado";

        // Registrar tentativa recusada
        await repositorioAuditoriaPontoPg.registrar({
          empresaId: dados.empresaId,
          tipoAlteracao: "criacao",
          valorNovo: {
            tipoRegistro: dados.tipoRegistro,
            latitude: dados.latitude,
            longitude: dados.longitude,
            distanciaMetros,
            raioPermitido: unidade.raioPermitidoMetros,
            motivo: `Fora do raio permitido (${distanciaMetros?.toFixed(0)}m de ${unidade.raioPermitidoMetros}m)`,
          },
          responsavelId: dados.colaboradorId,
          ip: dados.ip,
          userAgent: dados.userAgent,
        });

        return {
          sucesso: false,
          mensagem: `Você está a ${distanciaMetros?.toFixed(0)}m da unidade. O raio permitido é de ${unidade.raioPermitidoMetros}m. Aproxime-se para registrar o ponto.`,
          estadoAtual,
        };
      }
    }
  }

  // 6. Criar registro de ponto
  const registro = await repositorioPontoPg.criarRegistro({
    empresaId: dados.empresaId,
    unidadeId: dados.unidadeId,
    colaboradorId: dados.colaboradorId,
    tipoRegistro: dados.tipoRegistro,
    dataReferencia,
    horarioRegistro: agora,
    latitude: dados.latitude ?? null,
    longitude: dados.longitude ?? null,
    dentroRaioPermitido: dentroRaio,
    distanciaMetros,
    origemRegistro: dados.origemRegistro ?? "app_web",
    statusRegistro,
    observacao: dados.observacao ?? null,
    criadoPor: dados.colaboradorId,
  });

  // 7. Gerenciar pausas
  if (dados.tipoRegistro === "inicio_pausa") {
    // Encontrar o registro de entrada do dia para vincular a pausa
    const registroEntrada = registrosDoDia.find(
      (r) => r.tipoRegistro === "entrada" && !r.deletadoEm
    );

    await repositorioPontoPg.criarPausa({
      empresaId: dados.empresaId,
      registroPontoId: registroEntrada?.id ?? registro.id,
      colaboradorId: dados.colaboradorId,
      inicio: agora,
    });
  }

  if (dados.tipoRegistro === "fim_pausa" && pausasAbertas.length > 0) {
    await repositorioPontoPg.finalizarPausa(pausasAbertas[0].id, agora);
  }

  // 8. Registrar em auditoria
  await repositorioAuditoriaPontoPg.registrar({
    empresaId: dados.empresaId,
    registroOriginalId: registro.id,
    tipoAlteracao: "criacao",
    valorNovo: {
      tipoRegistro: dados.tipoRegistro,
      horarioRegistro: agora.toISOString(),
      latitude: dados.latitude,
      longitude: dados.longitude,
      dentroRaioPermitido: dentroRaio,
      distanciaMetros,
    },
    responsavelId: dados.colaboradorId,
    ip: dados.ip,
    userAgent: dados.userAgent,
  });

  // 9. Determinar novo estado
  const novosRegistros = [...registrosDoDia, registro];
  const novasPausas = dados.tipoRegistro === "fim_pausa" ? [] : pausasAbertas;
  const novoEstado = determinarEstadoJornada(
    novosRegistros as any,
    dados.tipoRegistro === "inicio_pausa"
      ? [{ fim: null }]
      : novasPausas
  );

  const mensagensConfirmacao: Record<TipoRegistroPonto, string> = {
    entrada: "Entrada registrada com sucesso! Bom trabalho!",
    inicio_pausa: "Pausa iniciada. Aproveite o descanso!",
    fim_pausa: "Pausa finalizada. De volta ao trabalho!",
    saida: "Saída registrada. Até logo!",
  };

  return {
    sucesso: true,
    mensagem: mensagensConfirmacao[dados.tipoRegistro],
    registro,
    estadoAtual: novoEstado,
  };
}

/**
 * Obtém o estado atual da jornada de um colaborador.
 */
export async function obterEstadoJornadaAtual(
  empresaId: string,
  colaboradorId: string
) {
  const dataReferencia = obterDataReferencia();

  const registrosDoDia = await repositorioPontoPg.obterRegistrosDia(
    empresaId,
    colaboradorId,
    dataReferencia
  );

  const pausasAbertas = await repositorioPontoPg.obterPausasAbertas(
    empresaId,
    colaboradorId,
    dataReferencia
  );

  const estado = determinarEstadoJornada(registrosDoDia, pausasAbertas);
  const acaoPermitida = obterAcaoPermitida(estado);

  // Calcular horas trabalhadas até agora
  let horasTrabalhadasMinutos = 0;
  const registrosAtivos = registrosDoDia.filter((r) => !r.deletadoEm);
  const entrada = registrosAtivos.find((r) => r.tipoRegistro === "entrada");

  if (entrada) {
    const saida = registrosAtivos.find((r) => r.tipoRegistro === "saida");
    const fimPeriodo = saida ? new Date(saida.horarioRegistro) : new Date();
    horasTrabalhadasMinutos = Math.round(
      (fimPeriodo.getTime() - new Date(entrada.horarioRegistro).getTime()) / 60000
    );

    // Descontar pausas finalizadas
    for (const reg of registrosDoDia) {
      if (reg.pausas) {
        for (const pausa of reg.pausas) {
          if (pausa.duracaoMinutos) {
            horasTrabalhadasMinutos -= pausa.duracaoMinutos;
          } else if (pausa.fim) {
            horasTrabalhadasMinutos -= Math.round(
              (new Date(pausa.fim).getTime() - new Date(pausa.inicio).getTime()) / 60000
            );
          }
        }
      }
    }
  }

  return {
    estado,
    acaoPermitida,
    registrosDoDia,
    pausaAberta: pausasAbertas[0] ?? null,
    horasTrabalhadasAteAgora: Math.max(0, horasTrabalhadasMinutos),
  };
}
