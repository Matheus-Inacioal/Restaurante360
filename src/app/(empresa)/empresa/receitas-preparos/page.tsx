"use client";

import { useReceitasPreparos } from "@/hooks/empresa/use-receitas-preparos";

export default function PaginaReceitasPreparos() {
  const { receitas, isCarregando, erro, vazio, recarregar } = useReceitasPreparos();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Receitas e Preparos</h1>
          <p className="text-sm text-muted-foreground">
            Fichas técnicas de receitas e preparos da operação.
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
          Carregando receitas…
        </div>
      )}

      {erro && !isCarregando && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Erro ao carregar: {String(erro)}
        </div>
      )}

      {vazio && !isCarregando && !erro && (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Nenhuma receita cadastrada ainda.
        </div>
      )}

      {!isCarregando && !erro && !vazio && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Rendimento</th>
                <th className="px-4 py-3 font-medium">Validade</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {receitas.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{r.nome}</td>
                  <td className="px-4 py-3">{r.categoria ?? "—"}</td>
                  <td className="px-4 py-3">{r.rendimento ?? "—"}</td>
                  <td className="px-4 py-3">{r.validade ?? "—"}</td>
                  <td className="px-4 py-3">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
