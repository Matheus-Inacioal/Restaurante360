/**
 * Serviço de Geolocalização para Ponto — Restaurante360
 *
 * Valida se o colaborador está dentro do raio permitido da unidade.
 * server-only
 */
import "server-only";
import { repositorioPontoPg } from "@/server/repositorios/repositorio-ponto-pg";
import { validarLocalizacaoPonto } from "@/lib/utils/geolocalizacao";

export interface ResultadoValidacaoGeoPonto {
  valido: boolean;
  dentroRaio: boolean;
  distanciaMetros: number | null;
  raioPermitidoMetros: number | null;
  mensagem: string;
  unidadeTemGeo: boolean;
}

/**
 * Valida a geolocalização do ponto de um colaborador.
 *
 * Se a unidade não tem coordenadas configuradas, permite o registro.
 * Se o colaborador não enviou coordenadas, permite o registro com aviso.
 */
export async function validarGeoPonto(
  unidadeId: string,
  latitude?: number,
  longitude?: number
): Promise<ResultadoValidacaoGeoPonto> {
  // Obter dados da unidade
  const unidade = await repositorioPontoPg.obterUnidadeComGeo(unidadeId);

  if (!unidade) {
    return {
      valido: false,
      dentroRaio: false,
      distanciaMetros: null,
      raioPermitidoMetros: null,
      mensagem: "Unidade não encontrada.",
      unidadeTemGeo: false,
    };
  }

  // Se a unidade não tem geolocalização configurada, permitir
  if (!unidade.latitude || !unidade.longitude || !unidade.raioPermitidoMetros) {
    return {
      valido: true,
      dentroRaio: true,
      distanciaMetros: null,
      raioPermitidoMetros: null,
      mensagem: "Unidade sem restrição geográfica configurada.",
      unidadeTemGeo: false,
    };
  }

  // Se o colaborador não enviou coordenadas
  if (latitude === undefined || longitude === undefined) {
    return {
      valido: false,
      dentroRaio: false,
      distanciaMetros: null,
      raioPermitidoMetros: unidade.raioPermitidoMetros,
      mensagem: "Localização não detectada. Ative o GPS do dispositivo e tente novamente.",
      unidadeTemGeo: true,
    };
  }

  // Validar distância
  const resultado = validarLocalizacaoPonto(
    latitude,
    longitude,
    unidade.latitude,
    unidade.longitude,
    unidade.raioPermitidoMetros
  );

  if (!resultado.dentroRaio) {
    return {
      valido: false,
      dentroRaio: false,
      distanciaMetros: resultado.distanciaMetros,
      raioPermitidoMetros: unidade.raioPermitidoMetros,
      mensagem: `Você está a ${resultado.distanciaMetros.toFixed(0)}m da unidade "${unidade.nome}". O raio permitido é de ${unidade.raioPermitidoMetros}m.`,
      unidadeTemGeo: true,
    };
  }

  return {
    valido: true,
    dentroRaio: true,
    distanciaMetros: resultado.distanciaMetros,
    raioPermitidoMetros: unidade.raioPermitidoMetros,
    mensagem: `Localização validada (${resultado.distanciaMetros.toFixed(0)}m da unidade).`,
    unidadeTemGeo: true,
  };
}
