import { AnalyticsResult } from '@shared/types/index';

export class PdfExporter {
  public static exportToPdf(
    result: AnalyticsResult,
    options?: { title?: string; watermark?: string; user?: any; exportId?: string }
  ): { content: string; mimeType: string; fileName: string } {
    const title = options?.title || 'Relatório Gerencial Analítico';
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `relatorio_disk_${dateStr}.pdf`;

    const watermarkText = options?.watermark ||
      `Gerado por Disk Interno | Operador: ${options?.user?.name || 'Sistema'} | Emissão: ${new Date().toLocaleString('pt-BR')} | ID: ${options?.exportId || 'EXP-AUTO'}`;

    // Structure printable PDF layout representation
    const htmlPdf = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #0f172a; font-size: 11px; }
    .header { border-bottom: 2px solid #ea580c; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 18px; font-weight: bold; color: #ea580c; }
    .meta { font-size: 9px; color: #64748b; text-align: right; }
    .title { font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #1e293b; }
    .watermark { font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 30px; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background-color: #1e293b; color: #ffffff; font-weight: 600; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .number { text-align: right; font-family: 'Courier New', monospace; font-weight: 600; }
    .total-row { font-weight: bold; background-color: #f1f5f9; border-top: 2px solid #cbd5e1; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">DISK INGRESSOS &bull; ANALYTICS CORE</div>
    <div class="meta">
      Emitido em: ${new Date().toLocaleString('pt-BR')}<br />
      Status: ${result.freshness.status}
    </div>
  </div>

  <div class="title">${escapeHtml(title)}</div>
  <div style="color: #64748b; font-size: 10px;">
    Registros consolidados: ${result.rows.length} &bull; Tempo de processamento: ${result.executionTimeMs}ms
  </div>

  <table>
    <thead>
      <tr>
        ${result.dimensions.map(d => `<th>${escapeHtml(d.toUpperCase())}</th>`).join('')}
        ${result.metrics.map(m => `<th class="number">${escapeHtml(m.name)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${result.rows.map(row => `
        <tr>
          ${result.dimensions.map(d => `<td>${escapeHtml(String(row[`${d}Label`] || row[`${d}Name`] || row[d] || ''))}</td>`).join('')}
          ${result.metrics.map(m => `<td class="number">${escapeHtml(String(row[`${m.code}_formatted`] !== undefined ? row[`${m.code}_formatted`] : (row[m.code] ?? '')))}</td>`).join('')}
        </tr>
      `).join('')}
      <tr class="total-row">
        ${result.dimensions.map((_, i) => `<td>${i === 0 ? 'TOTAL GERAL' : ''}</td>`).join('')}
        ${result.metrics.map(m => `<td class="number">${escapeHtml(m.formattedTotal || String(m.total || ''))}</td>`).join('')}
      </tr>
    </tbody>
  </table>

  <div class="watermark">
    ${escapeHtml(watermarkText)}
  </div>
</body>
</html>`;

    return {
      content: htmlPdf,
      mimeType: 'application/pdf',
      fileName
    };
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
