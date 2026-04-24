/**
 * Hook useUnidades — busca unidades da empresa via API
 */
import { useState, useEffect, useCallback } from 'react';
import { fetchJSON } from '@/lib/http/fetch-json';
import type { Unidade } from '@/lib/tipos/identidade';

export function useUnidades() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<Error | null>(null);

  const carregarUnidades = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetchJSON<Unidade[]>('/api/empresa/unidades');
      if (!res.ok) {
        const msg = 'message' in res ? res.message : 'Erro ao carregar unidades.';
        throw new Error(msg);
      }
      setUnidades(res.data);
    } catch (err: any) {
      setErro(err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarUnidades();
  }, [carregarUnidades]);

  const criarUnidade = async (dados: { nome: string; cidade?: string; estado?: string; endereco?: string }) => {
    const res = await fetchJSON<Unidade>('/api/empresa/unidades', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
    if (!res.ok) throw new Error('message' in res ? res.message : 'Erro ao criar unidade.');
    await carregarUnidades();
    return res.data;
  };

  return { unidades, carregando, erro, criarUnidade, recarregar: carregarUnidades };
}
