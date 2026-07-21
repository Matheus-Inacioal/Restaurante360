"use client";

import { useOcorrencias } from "@/hooks/empresa/use-ocorrencias";

export default function PaginaOcorrencias() {
  const { ocorrencias, isCarregando, erro, vazio, recarregar } = useOcorrencias();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ocorrências</h1>
          <p className="text-sm text-muted-foreground">
            Registros de quebras, perdas e manutenções da operação.
          </p>
        </div>
        <button
          onClick={() => recarregar()}
          className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Atualizar
        </button>
      </div>

      {isCarregando && (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Carregando ocorrências…
        </div>
      )}

      {erro && !isCarregando && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Erro ao carregar: {String(erro)}
        </div>
      )}

      {vazio && !isCarregando && !erro && (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Nenhuma ocorrência registrada ainda.
        </div>
      )}

      {!isCarregando && !erro && !vazio && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Qtd.</th>
                <th className="px-4 py-3 font-medium">Gravidade</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {ocorrencias.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-3">{o.item}</td>
                  <td className="px-4 py-3">{o.tipo}</td>
                  <td className="px-4 py-3">{o.quantidade ?? "—"}</td>
                  <td className="px-4 py-3">{o.gravidade ?? "—"}</td>
                  <td className="px-4 py-3">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
