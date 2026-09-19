import { ParsedQuery, DetectedQueryType } from './search.types';

export class QueryParserService {
  /**
   * Parse raw query string and automatically detect intent and normalized representation
   */
  public static parse(rawQuery: string): ParsedQuery {
    const raw = (rawQuery || '').trim();
    if (!raw) {
      return {
        raw: '',
        normalized: '',
        detectedType: 'TEXT',
        confidence: 0
      };
    }

    const cleanDigits = raw.replace(/\D/g, '');
    const cleanLower = raw.toLowerCase();

    // 1. Check for Phone number formatted first (e.g. (41) 99871-4422)
    const isPhoneFormatted = /^\(?\d{2}\)?\s*9?\d{4}-?\d{4}$/.test(raw) || (raw.includes('(') && cleanDigits.length >= 10);
    if (isPhoneFormatted) {
      return {
        raw,
        normalized: cleanDigits,
        detectedType: 'PHONE',
        confidence: 0.95,
        extractedDigits: cleanDigits
      };
    }

    // 2. Check for CPF (Formatted 000.000.000-00 or 11 digits raw without phone parens)
    const isFormattedCpf = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(raw);
    const isRawCpf = cleanDigits.length === 11 && !/[a-zA-Z]/.test(raw) && !raw.includes('(');
    if (isFormattedCpf || isRawCpf) {
      return {
        raw,
        normalized: cleanDigits,
        detectedType: 'CPF',
        confidence: isFormattedCpf ? 1.0 : 0.95,
        extractedDigits: cleanDigits
      };
    }

    // 3. Check for Email
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
    if (isEmail) {
      return {
        raw,
        normalized: cleanLower,
        detectedType: 'EMAIL',
        confidence: 1.0
      };
    }

    // 4. Check for Ticket Code (ING-..., TKT-...)
    if (/^(ING-|TKT-|#ING-|#TKT-)/i.test(raw)) {
      const code = raw.replace(/^(#)/, '').toUpperCase();
      const digitsOnly = code.replace(/\D/g, '');
      return {
        raw,
        normalized: cleanLower,
        detectedType: 'TICKET_CODE',
        confidence: 0.95,
        extractedCode: code,
        extractedDigits: digitsOnly
      };
    }

    // 5. Check for Payment / Transaction (TRX-..., PAY-...)
    if (/^(TRX-|PAY-|CIE-)/i.test(raw)) {
      const code = raw.replace(/^(#)/, '').toUpperCase();
      const digitsOnly = code.replace(/\D/g, '');
      return {
        raw,
        normalized: cleanLower,
        detectedType: 'PAYMENT_CODE',
        confidence: 0.95,
        extractedCode: code,
        extractedDigits: digitsOnly
      };
    }

    // 6. Check for Refund (EST-..., REF-...)
    if (/^(EST-|REF-)/i.test(raw)) {
      const code = raw.replace(/^(#)/, '').toUpperCase();
      const digitsOnly = code.replace(/\D/g, '');
      return {
        raw,
        normalized: cleanLower,
        detectedType: 'REFUND_CODE',
        confidence: 0.95,
        extractedCode: code,
        extractedDigits: digitsOnly
      };
    }

    // 7. Check for Support Ticket (ATD-..., SAC-...)
    if (/^(ATD-|SAC-|TKT-SAC-|#ATD-)/i.test(raw)) {
      const code = raw.replace(/^(#)/, '').toUpperCase();
      const digitsOnly = code.replace(/\D/g, '');
      return {
        raw,
        normalized: cleanLower,
        detectedType: 'SUPPORT_CODE',
        confidence: 0.95,
        extractedCode: code,
        extractedDigits: digitsOnly
      };
    }

    // 8. Check for Order Code (PED-..., DK-..., or 5 to 8 numeric digits)
    const isPrefixedOrder = /^(PED-|DK-|#PED-|#DK-)\d+/i.test(raw);
    const isNumericOrder = /^\d{5,8}$/.test(raw);
    if (isPrefixedOrder || isNumericOrder) {
      const code = raw.replace(/^(#)/, '').toUpperCase();
      return {
        raw,
        normalized: cleanDigits,
        detectedType: 'ORDER_CODE',
        confidence: isPrefixedOrder ? 0.95 : 0.85,
        extractedCode: code,
        extractedDigits: cleanDigits
      };
    }

    // 9. Check for Task Code (TSK-..., TAR-...)
    if (/^(TSK-|TAR-|#TSK-)/i.test(raw)) {
      const code = raw.replace(/^(#)/, '').toUpperCase();
      const digitsOnly = code.replace(/\D/g, '');
      return {
        raw,
        normalized: cleanLower,
        detectedType: 'TASK_CODE',
        confidence: 0.95,
        extractedCode: code,
        extractedDigits: digitsOnly
      };
    }

    // 10. Check for Policy Code (POL-...)
    if (/^(POL-|#POL-)/i.test(raw)) {
      const code = raw.replace(/^(#)/, '').toUpperCase();
      return {
        raw,
        normalized: cleanLower,
        detectedType: 'POLICY_CODE',
        confidence: 1.0,
        extractedCode: code
      };
    }

    // 11. Default: Keyword / Text query
    return {
      raw,
      normalized: cleanLower,
      detectedType: 'TEXT',
      confidence: 0.5
    };
  }

  /**
   * Helper to normalize string for comparison (accent insensitive, lowercase)
   */
  public static normalizeText(val: string): string {
    return (val || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
