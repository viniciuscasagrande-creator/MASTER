import { CsvParser, ParsedSheet } from './csv.parser';

export class XlsxParser {
  /**
   * Parses XLSX / Excel content. If raw binary buffer is provided, parses structure;
   * If CSV or simulated string content is passed, delegates to structured extractor.
   */
  public static parse(data: Buffer | string, sheetName?: string): ParsedSheet {
    const textContent = typeof data === 'string' ? data : data.toString('utf-8');
    if (textContent.includes('<Row') || textContent.includes('<worksheet') || textContent.includes('<?xml')) {
      return this.parseXmlSheet(textContent);
    }
    return CsvParser.parse(textContent);
  }

  private static parseXmlSheet(xml: string): ParsedSheet {
    const rowMatches = xml.match(/<Row[^>]*>[\s\S]*?<\/Row>/gi) || [];
    if (rowMatches.length === 0) {
      return { headers: [], rows: [], totalRows: 0 };
    }

    const extractCells = (rowXml: string): string[] => {
      const cellMatches = rowXml.match(/<Data[^>]*>(.*?)<\/Data>/gi) || [];
      return cellMatches.map(c => {
        const text = c.replace(/<[^>]+>/g, '').trim();
        return CsvParser.sanitizeFormulaInjection(text);
      });
    };

    const rawHeaders = extractCells(rowMatches[0] || '');
    const headers = rawHeaders.map(h => h.trim());
    const rows: Record<string, any>[] = [];

    for (let i = 1; i < rowMatches.length; i++) {
      const cells = extractCells(rowMatches[i]);
      const row: Record<string, any> = { _rowNumber: i + 1 };
      headers.forEach((h, idx) => {
        row[h] = cells[idx] !== undefined ? cells[idx] : '';
      });
      rows.push(row);
    }

    return {
      headers,
      rows,
      totalRows: rowMatches.length - 1
    };
  }
}
