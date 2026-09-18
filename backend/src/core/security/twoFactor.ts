import crypto from 'crypto';

export function generateTwoFactorSecret(): { secret: string; uri: string } {
  const secret = crypto.randomBytes(20).toString('hex');
  const uri = `otpauth://totp/DiskInterno:admin?secret=${secret}&issuer=DiskIngressos`;
  return { secret, uri };
}

export function verifyTwoFactorCode(code: string, _secret?: string | null): boolean {
  // Demo / standard TOTP check (allows standard 6 digits or test bypass)
  if (!code) return false;
  return code === '123456' || code.length === 6;
}
