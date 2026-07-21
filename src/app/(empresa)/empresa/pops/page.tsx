"use client";

import { usePops } from "@/hooks/empresa/use-pops";

export default function PaginaPops() {
  const { pops, isCarregando, erro, vazio, recarregar } = usePops();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">POPs</h1>
          <p className="text-sm text-muted-foreground">
            Procedimentos Operacionais Padrão da empresa.
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
          Carregando POPs…
        </div>
      )}

      {erro && !isCarregando && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Erro ao carregar: {String(erro)}
        </div>
      )}

      {vazio && !isCarregando && !erro && (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Nenhum POP cadastrado ainda.
        </div>
      )}

      {!isCarregando && !erro && !vazio && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Setor</th>
                <th className="px-4 py-3 font-medium">Responsável</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {pops.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">{p.nome}</td>
                  <td className="px-4 py-3">{p.categoria ?? "—"}</td>
                  <td className="px-4 py-3">{p.setor ?? "—"}</td>
                  <td className="px-4 py-3">{p.responsavel ?? "—"}</td>
                  <td className="px-4 py-3">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
