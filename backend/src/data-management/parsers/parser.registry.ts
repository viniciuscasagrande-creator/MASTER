import { CsvParser, ParsedSheet } from './csv.parser';
import { XlsxParser } from './xlsx.parser';

export class ParserRegistry {
  public static parseFile(content: Buffer | string, fileFormat: 'CSV' | 'XLSX' | string): ParsedSheet {
    const format = fileFormat.toUpperCase();
    if (format === 'XLSX' || format === 'XLS') {
      return XlsxParser.parse(content);
    }
    if (typeof content === 'string') {
      return CsvParser.parse(content);
    }
    return CsvParser.parse(content.toString('utf-8'));
  }
}
