import { TransformationType } from '@shared/types/index';

export class TransformationService {
  /**
   * Applies controlled, non-arbitrary transformations to cell values.
   * NEVER executes eval() or dynamic code.
   */
  public static transform(value: any, type?: TransformationType, arg?: string): any {
    if (value === undefined || value === null) {
      if (type === 'DEFAULT_VALUE') return arg;
      return null;
    }

    const strValue = String(value).trim();

    switch (type) {
      case 'TRIM':
        return strValue.replace(/\s+/g, ' ');

      case 'NORMALIZE_PHONE': {
        const digits = strValue.replace(/\D/g, '');
        if (!digits) return '';
        if (digits.length === 10 || digits.length === 11) {
          return `55${digits}`;
        }
        return digits;
      }

      case 'NORMALIZE_DOCUMENT':
        // Strips punctuation from CPF or CNPJ
        return strValue.replace(/\D/g, '');

      case 'PARSE_DATE': {
        if (!strValue) return null;
        // Check Brazilian format DD/MM/YYYY or DD/MM/YYYY HH:mm(:ss)
        const brMatch = strValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
        if (brMatch) {
          const day = parseInt(brMatch[1], 10);
          const month = parseInt(brMatch[2], 10) - 1;
          const year = parseInt(brMatch[3], 10);
          const hour = parseInt(brMatch[4] || '0', 10);
          const min = parseInt(brMatch[5] || '0', 10);
          const sec = parseInt(brMatch[6] || '0', 10);
          const date = new Date(Date.UTC(year, month, day, hour, min, sec));
          return date.toISOString();
        }
        // Try standard ISO
        const d = new Date(strValue);
        return !isNaN(d.getTime()) ? d.toISOString() : strValue;
      }

      case 'PARSE_CURRENCY': {
        if (!strValue) return 0;
        // Handle "R$ 1.250,50" -> 1250.50
        let cleaned = strValue.replace(/[R$\s]/g, '');
        if (cleaned.includes(',') && cleaned.includes('.')) {
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else if (cleaned.includes(',')) {
          cleaned = cleaned.replace(',', '.');
        }
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      }

      case 'UPPERCASE':
        return strValue.toUpperCase();

      case 'LOWERCASE':
        return strValue.toLowerCase();

      case 'DEFAULT_VALUE':
        return strValue ? strValue : arg;

      case 'MAP_ENUM': {
        if (!arg) return strValue;
        try {
          const mapping = typeof arg === 'string' ? JSON.parse(arg) : arg;
          return mapping[strValue] !== undefined ? mapping[strValue] : strValue;
        } catch {
          return strValue;
        }
      }

      default:
        return strValue;
    }
  }
}
