import { AnalyticsResult } from '@shared/types/index';

export class CsvExporter {
  public static exportToCsv(result: AnalyticsResult, options?: { title?: string; delimiter?: string }): { content: string; mimeType: string; fileName: string } {
    const delimiter = options?.delimiter || ';'; // Padrão brasileiro Excel (ponto-e-vírgula)
    const bom = '\uFEFF'; // UTF-8 BOM para garantir acentuação correta no Excel brasileiro

    const headers: string[] = [];

    // 1. Headers for Dimensions
    for (const dim of result.dimensions) {
      headers.push(`"${dim.toUpperCase()}"`);
    }

    // 2. Headers for Metrics
    for (const m of result.metrics) {
      headers.push(`"${m.name} (${m.code})"`);
    }

    const lines: string[] = [];
    lines.push(headers.join(delimiter));

    // 3. Data Rows
    for (const row of result.rows) {
      const lineCells: string[] = [];

      // Dimensions values
      for (const dim of result.dimensions) {
        const val = row[`${dim}Label`] || row[`${dim}Name`] || row[dim] || '';
        lineCells.push(`"${String(val).replace(/"/g, '""')}"`);
      }

      // Metrics values (prioritize formatted Brazilian display)
      for (const m of result.metrics) {
        const val = row[`${m.code}_formatted`] !== undefined ? row[`${m.code}_formatted`] : (row[m.code] ?? '');
        lineCells.push(`"${String(val).replace(/"/g, '""')}"`);
      }

      lines.push(lineCells.join(delimiter));
    }

    // 4. Totals Row
    if (result.metrics.some(m => m.total !== undefined)) {
      const totalCells: string[] = [];
      for (let i = 0; i < result.dimensions.length; i++) {
        totalCells.push(i === 0 ? '"TOTAL GERAL"' : '""');
      }
      for (const m of result.metrics) {
        totalCells.push(`"${m.formattedTotal || m.total || ''}"`);
      }
      lines.push(totalCells.join(delimiter));
    }

    const csvBody = bom + lines.join('\r\n');
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `relatorio_disk_${dateStr}.csv`;

    return {
      content: csvBody,
      mimeType: 'text/csv; charset=utf-8',
      fileName
    };
  }
}
