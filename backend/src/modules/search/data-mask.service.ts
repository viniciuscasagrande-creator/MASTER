import { AuthenticatedUser } from '../../core/middleware/authenticate';

export class DataMaskService {
  /**
   * Check if user has permission to view unmasked CPF/Document
   */
  public static canViewFullDocument(user: AuthenticatedUser): boolean {
    if (user.isSuperAdmin) return true;
    return user.permissions?.includes('cliente.documento.visualizar_completo') || false;
  }

  /**
   * Check if user has permission to view unmasked Email
   */
  public static canViewFullEmail(user: AuthenticatedUser): boolean {
    if (user.isSuperAdmin) return true;
    return user.permissions?.includes('cliente.email.visualizar_completo') || false;
  }

  /**
   * Check if user has permission to view unmasked Phone
   */
  public static canViewFullPhone(user: AuthenticatedUser): boolean {
    if (user.isSuperAdmin) return true;
    return user.permissions?.includes('cliente.telefone.visualizar_completo') || false;
  }

  /**
   * Mask CPF string (e.g., '123.456.789-00' -> '***.***.***-00')
   */
  public static maskCpf(rawCpf: string, allowFull: boolean): string {
    if (!rawCpf) return '';
    if (allowFull) return rawCpf;

    const digits = rawCpf.replace(/\D/g, '');
    if (digits.length < 2) return '***.***.***-**';

    const last2 = digits.slice(-2);
    return `***.***.***-${last2}`;
  }

  /**
   * Mask Email string (e.g., 'maria.oliveira@email.com' -> 'ma••••@email.com')
   */
  public static maskEmail(rawEmail: string, allowFull: boolean): string {
    if (!rawEmail) return '';
    if (allowFull) return rawEmail;

    const parts = rawEmail.split('@');
    if (parts.length !== 2) return '••••••@••••';

    const user = parts[0];
    const domain = parts[1];

    const visibleChars = Math.min(2, user.length);
    const maskedUser = user.slice(0, visibleChars) + '••••';
    return `${maskedUser}@${domain}`;
  }

  /**
   * Mask Phone string (e.g., '(41) 99999-9999' -> '(**) *****-9999')
   */
  public static maskPhone(rawPhone: string, allowFull: boolean): string {
    if (!rawPhone) return '';
    if (allowFull) return rawPhone;

    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length < 4) return '(**) *****-****';

    const last4 = digits.slice(-4);
    return `(**) *****-${last4}`;
  }

  /**
   * Apply data masking to a customer entity based on user permissions
   */
  public static maskCustomerData(customer: any, user: AuthenticatedUser): any {
    if (!customer) return null;

    const allowDoc = this.canViewFullDocument(user);
    const allowEmail = this.canViewFullEmail(user);
    const allowPhone = this.canViewFullPhone(user);

    return {
      ...customer,
      cpf: this.maskCpf(customer.cpf, allowDoc),
      email: this.maskEmail(customer.email, allowEmail),
      phone: this.maskPhone(customer.phone, allowPhone),
      _isDocumentMasked: !allowDoc,
      _isEmailMasked: !allowEmail,
      _isPhoneMasked: !allowPhone
    };
  }
}
