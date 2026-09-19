import { AppError } from '../../../core/errors/AppError';

export interface SecurityScanResult {
  status: 'PASSED' | 'QUARANTINED' | 'REJECTED';
  scanResult: string;
  threatName?: string;
  detectedMimeType: string;
  size: number;
}

export class SecurityScanService {
  private static readonly FORBIDDEN_EXTENSIONS = new Set([
    'exe', 'bat', 'cmd', 'sh', 'vbs', 'msi', 'scr', 'jar', 'com', 'pif', 'dll', 'bin'
  ]);

  private static readonly EICAR_SIGNATURE = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

  /**
   * Comprehensive validation and security scan for uploaded files
   */
  public static scanFile(
    buffer: Buffer,
    fileName: string,
    declaredMimeType: string,
    category?: { maxSizeBytes?: number | null; allowedMimeTypes?: string | null }
  ): SecurityScanResult {
    const size = buffer.length;

    // 1. File Size Verification
    const maxSize = category?.maxSizeBytes || 52428800; // 50MB default
    if (size > maxSize) {
      throw new AppError(
        `O arquivo excede o limite máximo permitido de ${Math.round(maxSize / (1024 * 1024))}MB.`,
        400,
        { size, maxSize }
      );
    }

    if (size === 0) {
      throw new AppError('O arquivo enviado está vazio (0 bytes).', 400);
    }

    // 2. Extension Check
    const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : '';

    if (this.FORBIDDEN_EXTENSIONS.has(ext)) {
      throw new AppError(
        `Extensão de arquivo não permitida por política de segurança: .${ext}`,
        400,
        { extension: ext }
      );
    }

    // 3. Binary Magic Bytes / Signature Inspection
    const magicHeader = buffer.slice(0, 8);

    // Executable headers (MZ for DOS/PE EXE, \x7fELF for Linux)
    const isWindowsExe = magicHeader[0] === 0x4d && magicHeader[1] === 0x5a;
    const isElfExe = magicHeader[0] === 0x7f && magicHeader[1] === 0x45 && magicHeader[2] === 0x4c && magicHeader[3] === 0x46;

    if (isWindowsExe || isElfExe) {
      return {
        status: 'QUARANTINED',
        scanResult: 'Arquivo executável camuflado detectado na análise de assinatura binária.',
        threatName: 'Win32/ExecutableSpoofing',
        detectedMimeType: 'application/x-dosexec',
        size
      };
    }

    // Determine detected MIME
    let detectedMime = declaredMimeType;
    if (magicHeader.slice(0, 4).toString('ascii') === '%PDF') {
      detectedMime = 'application/pdf';
    } else if (magicHeader[0] === 0x89 && magicHeader.slice(1, 4).toString('ascii') === 'PNG') {
      detectedMime = 'image/png';
    } else if (magicHeader[0] === 0xff && magicHeader[1] === 0xd8 && magicHeader[2] === 0xff) {
      detectedMime = 'image/jpeg';
    } else if (magicHeader[0] === 0x50 && magicHeader[1] === 0x4b && magicHeader[2] === 0x03 && magicHeader[3] === 0x04) {
      detectedMime = declaredMimeType || 'application/zip';
    }

    // 4. Anti-Malware / Pattern Detection
    const contentString = buffer.toString('utf-8', 0, Math.min(buffer.length, 1048576)); // First 1MB for pattern scan

    if (contentString.includes(this.EICAR_SIGNATURE)) {
      return {
        status: 'QUARANTINED',
        scanResult: 'Ameaça de segurança identificada: Padrão EICAR Standard Antivirus Test.',
        threatName: 'Virus.Test.EICAR',
        detectedMimeType: detectedMime,
        size
      };
    }

    // Suspicious injection scripts or web shells inside text/documents
    if (
      contentString.includes('<script>malicious_payload()') ||
      contentString.includes('eval(base64_decode(') ||
      contentString.includes('WScript.Shell')
    ) {
      return {
        status: 'QUARANTINED',
        scanResult: 'Código potencialmente malicioso detectado no corpo do documento.',
        threatName: 'Trojan.Script.Generic',
        detectedMimeType: detectedMime,
        size
      };
    }

    // 5. Category Allowed MIME Types (if configured)
    if (category?.allowedMimeTypes) {
      const allowed = category.allowedMimeTypes.split(',').map(m => m.trim().toLowerCase());
      const isAllowed = allowed.some(m => m === '*' || detectedMime.toLowerCase().includes(m) || ext.includes(m));
      if (!isAllowed) {
        throw new AppError(
          `O tipo do arquivo (${detectedMime}) não é permitido para esta categoria documental.`,
          400,
          { allowedMimeTypes: category.allowedMimeTypes, detectedMime }
        );
      }
    }

    return {
      status: 'PASSED',
      scanResult: 'Verificação de integridade e segurança concluída com sucesso. Nenhum risco detectado.',
      detectedMimeType: detectedMime,
      size
    };
  }
}
