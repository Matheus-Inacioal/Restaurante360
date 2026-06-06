/**
 * Utilitários de Geolocalização — Restaurante360
 *
 * Implementa a fórmula de Haversine para cálculo de distância entre coordenadas
 * e validação de raio permitido para registro de ponto.
 */

/** Raio médio da Terra em metros */
const RAIO_TERRA_METROS = 6_371_000;

/**
 * Converte graus para radianos.
 */
function grausParaRadianos(graus: number): number {
  return graus * (Math.PI / 180);
}

/**
 * Calcula a distância em metros entre duas coordenadas geográficas
 * usando a fórmula de Haversine.
 *
 * @param lat1 Latitude do ponto 1 (graus decimais)
 * @param lon1 Longitude do ponto 1 (graus decimais)
 * @param lat2 Latitude do ponto 2 (graus decimais)
 * @param lon2 Longitude do ponto 2 (graus decimais)
 * @returns Distância em metros (arredondada para 2 casas)
 */
export function calcularDistanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = grausParaRadianos(lat2 - lat1);
  const dLon = grausParaRadianos(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(grausParaRadianos(lat1)) *
      Math.cos(grausParaRadianos(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = RAIO_TERRA_METROS * c;

  return Math.round(distancia * 100) / 100;
}

/**
 * Resultado da validação de localização para registro de ponto.
 */
export interface ResultadoValidacaoGeo {
  dentroRaio: boolean;
  distanciaMetros: number;
}

/**
 * Valida se o usuário está dentro do raio permitido da unidade
 * para registrar ponto.
 *
 * @param latUsuario Latitude do usuário
 * @param lonUsuario Longitude do usuário
 * @param latUnidade Latitude da unidade
 * @param lonUnidade Longitude da unidade
 * @param raioMetros Raio permitido em metros
 * @returns Objeto com resultado da validação
 */
export function validarLocalizacaoPonto(
  latUsuario: number,
  lonUsuario: number,
  latUnidade: number,
  lonUnidade: number,
  raioMetros: number
): ResultadoValidacaoGeo {
  const distanciaMetros = calcularDistanciaMetros(
    latUsuario,
    lonUsuario,
    latUnidade,
    lonUnidade
  );

  return {
    dentroRaio: distanciaMetros <= raioMetros,
    distanciaMetros,
  };
}
