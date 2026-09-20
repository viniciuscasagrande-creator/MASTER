import crypto from 'crypto';

export class TicketTokenService {
  private static readonly SECRET = process.env.QR_TOKEN_SECRET || 'disk-ingresso-qr-secret-key-2026';

  /**
   * Generates a tamper-proof opaque token for a ticket.
   * Encodes payload using base64url to safely support IDs with underscores or hyphens.
   */
  public static generateOpaqueToken(ticketId: string, eventId: string): string {
    const timestamp = Date.now().toString(36);
    const payload = `${ticketId}:${eventId}:${timestamp}`;
    const signature = crypto.createHmac('sha256', this.SECRET).update(payload).digest('hex').substring(0, 16);
    const combined = `${ticketId}|${eventId}|${timestamp}|${signature}`;
    const encoded = Buffer.from(combined, 'utf8').toString('base64url');
    return `opq_${encoded}`;
  }

  /**
   * Parses token or barcode and extracts potential ticket identifier or lookup key.
   */
  public static parseTokenOrCode(tokenOrCode: string): { ticketId?: string; isOpaque: boolean; rawCode: string } {
    const rawCode = tokenOrCode.trim();

    if (rawCode.startsWith('opq_')) {
      try {
        const encoded = rawCode.substring(4);
        const decoded = Buffer.from(encoded, 'base64url').toString('utf8');
        const [ticketId, eventId, timestamp, signature] = decoded.split('|');

        if (ticketId && eventId && timestamp && signature) {
          const payload = `${ticketId}:${eventId}:${timestamp}`;
          const expectedSig = crypto.createHmac('sha256', this.SECRET).update(payload).digest('hex').substring(0, 16);

          if (signature === expectedSig) {
            return { ticketId, isOpaque: true, rawCode };
          }
        }
      } catch {
        // If decoding fails, fallback to rawCode
      }
    }

    return { isOpaque: false, rawCode };
  }

  /**
   * Computes deterministic SHA-256 hash for offline bundle indexing.
   */
  public static computeHash(code: string): string {
    return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
  }
}
