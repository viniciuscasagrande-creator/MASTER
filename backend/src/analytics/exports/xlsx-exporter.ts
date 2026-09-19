import { AnalyticsResult } from '@shared/types/index';

export class XlsxExporter {
  public static exportToXlsx(
    result: AnalyticsResult,
    options?: { title?: string; watermark?: string }
  ): { content: string; mimeType: string; fileName: string } {
    const title = options?.title || 'Relatório Gerencial - Disk Interno';
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `relatorio_disk_${dateStr}.xlsx`;

    // Construct standard XML-based Spreadsheet (Excel XML 2003 / OpenXML compatible)
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="HeaderStyle">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:FontName="Calibri" ss:Size="11"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
   </Borders>
  </Style>
  <Style ss:ID="DataStyle">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0F172A"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="NumberStyle">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TotalStyle">
   <Font ss:Bold="1" ss:FontName="Calibri" ss:Size="10" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Relatorio">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(title)}</Data></Cell>
   </Row>
${options?.watermark ? `   <Row>
    <Cell><Data ss:Type="String">${escapeXml(options.watermark)}</Data></Cell>
   </Row>` : ''}
   <Row></Row>
   <Row ss:StyleID="HeaderStyle">
${result.dimensions.map(d => `    <Cell><Data ss:Type="String">${d.toUpperCase()}</Data></Cell>`).join('\n')}
${result.metrics.map(m => `    <Cell><Data ss:Type="String">${m.name} (${m.code})</Data></Cell>`).join('\n')}
   </Row>
${result.rows.map(row => `   <Row ss:StyleID="DataStyle">
${result.dimensions.map(dim => {
  const val = row[`${dim}Label`] || row[`${dim}Name`] || row[dim] || '';
  return `    <Cell><Data ss:Type="String">${escapeXml(String(val))}</Data></Cell>`;
}).join('\n')}
${result.metrics.map(m => {
  const formatted = row[`${m.code}_formatted`] !== undefined ? row[`${m.code}_formatted`] : (row[m.code] ?? '');
  return `    <Cell ss:StyleID="NumberStyle"><Data ss:Type="String">${escapeXml(String(formatted))}</Data></Cell>`;
}).join('\n')}
   </Row>`).join('\n')}
   <Row ss:StyleID="TotalStyle">
${result.dimensions.map((_, i) => `    <Cell><Data ss:Type="String">${i === 0 ? 'TOTAL GERAL' : ''}</Data></Cell>`).join('\n')}
${result.metrics.map(m => `    <Cell><Data ss:Type="String">${escapeXml(m.formattedTotal || String(m.total || ''))}</Data></Cell>`).join('\n')}
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

    return {
      content: xml,
      mimeType: 'application/vnd.ms-excel',
      fileName
    };
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
