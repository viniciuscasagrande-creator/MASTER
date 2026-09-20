export interface CsvParseOptions {
  delimiter?: string;
  hasHeader?: boolean;
  maxRows?: number;
  skipEmptyLines?: boolean;
}

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export class CsvParser {
  /**
   * Detects delimiter: semi-colon ';' (Brazilian Excel default) vs comma ','
   */
  public static detectDelimiter(content: string): string {
    const firstLine = content.split(/\r?\n/)[0] || '';
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;

    if (semicolonCount >= commaCount && semicolonCount >= tabCount) return ';';
    if (tabCount > commaCount) return '\t';
    return ',';
  }

  /**
   * Neutralizes formula injection attack vectors in spreadsheet cells (=, +, -, @, etc.)
   */
  public static sanitizeFormulaInjection(value: string): string {
    if (!value || typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (/^[=+\-@\t\r]/.test(trimmed)) {
      // Prepend a single quote or strip the leading operator to neutralize executable formulas
      return `'${trimmed}`;
    }
    return value;
  }

  /**
   * Strips UTF-8 BOM if present
   */
  public static stripBom(content: string): string {
    if (content.charCodeAt(0) === 0xFEFF) {
      return content.slice(1);
    }
    return content;
  }

  /**
   * Parses CSV string content into headers and row objects
   */
  public static parse(content: string, options: CsvParseOptions = {}): ParsedSheet {
    const cleanContent = this.stripBom(content);
    const delimiter = options.delimiter || this.detectDelimiter(cleanContent);
    const lines = cleanContent.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length === 0) {
      return { headers: [], rows: [], totalRows: 0 };
    }

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rawHeaders = parseLine(lines[0]);
    const headers = rawHeaders.map(h => h.replace(/^["']|["']$/g, '').trim());

    const rows: Record<string, any>[] = [];
    const max = options.maxRows ? Math.min(lines.length, options.maxRows + 1) : lines.length;

    for (let i = 1; i < max; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = parseLine(line);
      const row: Record<string, any> = { _rowNumber: i + 1 };

      headers.forEach((header, idx) => {
        let val = values[idx] !== undefined ? values[idx].replace(/^"|"$/g, '').trim() : '';
        val = this.sanitizeFormulaInjection(val);
        row[header] = val;
      });

      rows.push(row);
    }

    return {
      headers,
      rows,
      totalRows: lines.length - 1
    };
  }
}
