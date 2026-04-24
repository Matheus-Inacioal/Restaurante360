/**
 * Hook useAreas — busca áreas e funções da empresa via API
 */
import { useState, useEffect, useCallback } from 'react';
import { fetchJSON } from '@/lib/http/fetch-json';
import type { Area, Funcao } from '@/lib/tipos/identidade';

type AreaComFuncoes = Area & { funcoes: Funcao[] };

export function useAreas() {
  const [areas, setAreas] = useState<AreaComFuncoes[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<Error | null>(null);

  const carregarAreas = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetchJSON<AreaComFuncoes[]>('/api/empresa/areas');
      if (!res.ok) throw new Error('message' in res ? res.message : 'Erro ao carregar áreas.');
      setAreas(res.data);
    } catch (err: any) {
      setErro(err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarAreas();
  }, [carregarAreas]);

  const criarArea = async (dados: { nome: string; descricao?: string }) => {
    const res = await fetchJSON<Area>('/api/empresa/areas', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
    if (!res.ok) throw new Error('message' in res ? res.message : 'Erro ao criar área.');
    await carregarAreas();
    return res.data;
  };

  const criarFuncao = async (dados: { areaId: string; nome: string; descricao?: string }) => {
    const res = await fetchJSON<Funcao>('/api/empresa/funcoes', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
    if (!res.ok) throw new Error('message' in res ? res.message : 'Erro ao criar função.');
    await carregarAreas();
    return res.data;
  };

  return { areas, carregando, erro, criarArea, criarFuncao, recarregar: carregarAreas };
}
