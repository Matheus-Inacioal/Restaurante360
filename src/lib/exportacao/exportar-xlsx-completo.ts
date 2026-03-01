import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface ExportacaoAbaDataset {
    nomeAba: string;
    linhas: Record<string, any>[];
}

export interface ExportacaoXLSXPacote {
    nomeArquivo: string;
    metadados: Record<string, string>;
    abas: ExportacaoAbaDataset[];
}

/**
 * Utilitário para exportar múltiplas abas usando SheetJS (xlsx).
 */
export function exportarXLSXPacoteCompleto({
    nomeArquivo,
    metadados,
    abas,
}: ExportacaoXLSXPacote) {
    // Executar assíncrono para não travar a UI em painéis grandes
    setTimeout(() => {
        try {
            const workbook = XLSX.utils.book_new();

            // 1. Aba Metadados
            const metadadosFiltrados = Object.entries(metadados).map(([Chave, Valor]) => ({
                Chave,
                Valor,
            }));
            const abaMetadados = XLSX.utils.json_to_sheet(metadadosFiltrados);
            // Ajustar largura metadados (30 pra chave, 50 pro valor)
            abaMetadados['!cols'] = [{ wch: 30 }, { wch: 50 }];
            XLSX.utils.book_append_sheet(workbook, abaMetadados, 'Metadados');

            // 2. Outras Abas
            abas.forEach(({ nomeAba, linhas }) => {
                // Limitar nome da aba para <= 31 caracteres (regra do Excel)
                const tituloAba = nomeAba.substring(0, 31).trim();

                let worksheet: XLSX.WorkSheet;

                if (linhas.length === 0) {
                    // Aba sem dados
                    worksheet = XLSX.utils.json_to_sheet([
                        { Mensagem: 'Sem dados no período selecionado' },
                    ]);
                    worksheet['!cols'] = [{ wch: 50 }];
                } else {
                    // Aba com dados
                    worksheet = XLSX.utils.json_to_sheet(linhas);

                    // Tentar otimizar a largura das colunas dinamicamente (baseado nos cabeçalhos)
                    const keys = Object.keys(linhas[0] || {});
                    worksheet['!cols'] = keys.map((key) => {
                        let maxCharLength = key.length;
                        // Pegar amostra de até 100 linhas para medir a largura
                        const amostras = linhas.slice(0, 100);
                        for (const row of amostras) {
                            const val = row[key];
                            if (val) {
                                const len = String(val).length;
                                if (len > maxCharLength) maxCharLength = len;
                            }
                        }
                        // Limitar comprimento máx 50 e mín 10
                        return { wch: Math.min(Math.max(maxCharLength + 2, 10), 50) };
                    });
                }

                XLSX.utils.book_append_sheet(workbook, worksheet, tituloAba);
            });

            // 3. Gerar arquivo (.xlsx)
            XLSX.writeFile(workbook, `${nomeArquivo}.xlsx`, { compression: true });
        } catch (error) {
            console.error('Erro ao gerar exportação XLSX:', error);
            // Opcional: Aqui poderíamos disparar algum evento global de falha se necessário
        }
    }, 0);
}
