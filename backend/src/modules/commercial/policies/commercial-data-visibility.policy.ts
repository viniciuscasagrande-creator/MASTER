import { AuthenticatedUserContext } from './commercial-scope.policy';
import { OrderDTO, OrderItemDTO, OrderBuyerSnapshotDTO } from '@shared/types/index';

export class CommercialDataVisibilityPolicy {
  public static canViewFinancialValues(user: AuthenticatedUserContext): boolean {
    if (user.isSuperAdmin) return true;
    return user.permissions?.includes('comercial.vendas.valores.visualizar') ?? false;
  }

  public static canViewCustomerSensitiveData(user: AuthenticatedUserContext): boolean {
    if (user.isSuperAdmin) return true;
    return user.permissions?.includes('comercial.clientes.dados_sensiveis') ?? false;
  }

  public static maskDocument(document?: string): string | undefined {
    if (!document) return undefined;
    const clean = document.replace(/\D/g, '');
    if (clean.length === 11) {
      // CPF: 123.456.789-00 -> ***.456.789-**
      return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
    }
    if (clean.length === 14) {
      // CNPJ: 12.345.678/0001-90 -> **.345.678/****-90
      return `**.${clean.slice(2, 5)}.${clean.slice(5, 8)}/****-${clean.slice(12, 14)}`;
    }
    return '***';
  }

  public static maskEmail(email?: string): string | undefined {
    if (!email) return undefined;
    const parts = email.split('@');
    if (parts.length !== 2) return '***@***';
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
    return `${maskedName}@${domain}`;
  }

  public static maskPhone(phone?: string): string | undefined {
    if (!phone) return undefined;
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      const ddd = digits.slice(0, 2);
      const lastFour = digits.slice(-4);
      return `(${ddd}) *****-${lastFour}`;
    }
    return '(**) *****-****';
  }

  /**
   * Sanitizes buyer snapshot according to sensitive data permissions
   */
  public static sanitizeBuyerSnapshot(
    user: AuthenticatedUserContext,
    snapshot?: OrderBuyerSnapshotDTO
  ): OrderBuyerSnapshotDTO | undefined {
    if (!snapshot) return undefined;

    const canViewSensitive = this.canViewCustomerSensitiveData(user);
    const documentMasked = snapshot.documentMasked || (snapshot.document ? this.maskDocument(snapshot.document) : undefined) || '***';
    const emailMasked = snapshot.emailMasked || (snapshot.email ? this.maskEmail(snapshot.email) : undefined) || '***@***';
    const phoneMasked = snapshot.phoneMasked || (snapshot.phone ? this.maskPhone(snapshot.phone) : undefined);

    if (canViewSensitive) {
      return {
        ...snapshot,
        documentMasked,
        emailMasked,
        phoneMasked
      };
    }

    return {
      id: snapshot.id,
      orderId: snapshot.orderId,
      customerId: snapshot.customerId,
      name: snapshot.name,
      document: documentMasked,
      documentMasked,
      email: emailMasked,
      emailMasked,
      phone: phoneMasked,
      phoneMasked,
      createdAt: snapshot.createdAt
    };
  }

  /**
   * Sanitizes order according to financial and sensitive data permissions
   */
  public static sanitizeOrder(
    user: AuthenticatedUserContext,
    order: OrderDTO
  ): OrderDTO {
    const canViewValues = this.canViewFinancialValues(user);
    const buyerSnapshot = this.sanitizeBuyerSnapshot(user, order.buyerSnapshot);

    const items: OrderItemDTO[] | undefined = order.items?.map(item => {
      if (canViewValues) return item;
      return {
        ...item,
        unitBaseAmount: 0,
        unitDiscountAmount: 0,
        unitFeeAmount: 0,
        unitFinalAmount: 0,
        subtotalAmount: 0,
        discountAmount: 0,
        feeAmount: 0,
        totalAmount: 0
      };
    });

    return {
      ...order,
      subtotalAmount: canViewValues ? order.subtotalAmount : 0,
      discountAmount: canViewValues ? order.discountAmount : 0,
      feeAmount: canViewValues ? order.feeAmount : 0,
      totalAmount: canViewValues ? order.totalAmount : 0,
      buyerSnapshot,
      items
    };
  }
}
