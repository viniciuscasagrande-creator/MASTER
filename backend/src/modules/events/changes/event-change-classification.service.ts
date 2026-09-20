import { EventStatus, EventChangeType, EventChangeClassification } from '@shared/types/index';

export class EventChangeClassificationService {
  /**
   * Classifica a severidade de uma alteração com base no tipo de mudança e no status do evento
   */
  static classify(
    changeType: EventChangeType,
    eventStatus: EventStatus
  ): EventChangeClassification {
    const postSalesStatuses: EventStatus[] = ['ON_SALE', 'SALES_PAUSED', 'SOLD_OUT', 'IN_PROGRESS'];
    const isPostSales = postSalesStatuses.includes(eventStatus);

    // Se o evento já iniciou vendas, qualquer alteração estrutural é POST_SALES_CRITICAL
    if (isPostSales) {
      switch (changeType) {
        case 'EVENT_DATE':
        case 'EVENT_VENUE':
        case 'SESSION_DATE':
        case 'SESSION_STATUS':
        case 'SECTION_CAPACITY':
        case 'BATCH_PRICE':
        case 'BATCH_QUANTITY':
        case 'CHANNEL_STATUS':
          return 'POST_SALES_CRITICAL';
        case 'SECTION_NAME':
        case 'EVENT_INFO':
        case 'POLICY_UPDATE':
          return 'PUBLICATION_CRITICAL';
        case 'COMPLIMENTARY_QUOTA':
        case 'INTERNAL_NOTE':
        default:
          return 'NON_CRITICAL';
      }
    }

    // Se o evento está em APPROVAL_PENDING ou SCHEDULED
    if (eventStatus === 'APPROVAL_PENDING' || eventStatus === 'SCHEDULED') {
      switch (changeType) {
        case 'EVENT_DATE':
        case 'EVENT_VENUE':
        case 'SESSION_DATE':
        case 'SECTION_CAPACITY':
        case 'BATCH_PRICE':
          return 'PUBLICATION_CRITICAL';
        case 'SECTION_NAME':
        case 'SESSION_STATUS':
        case 'BATCH_QUANTITY':
        case 'CHANNEL_STATUS':
        case 'COMPLIMENTARY_QUOTA':
          return 'REVIEW_INVALIDATING';
        default:
          return 'NON_CRITICAL';
      }
    }

    // Se o evento está em REVIEW
    if (eventStatus === 'REVIEW') {
      switch (changeType) {
        case 'EVENT_DATE':
        case 'EVENT_VENUE':
        case 'SESSION_DATE':
        case 'SECTION_CAPACITY':
        case 'BATCH_PRICE':
        case 'BATCH_QUANTITY':
          return 'REVIEW_INVALIDATING';
        default:
          return 'NON_CRITICAL';
      }
    }

    // Em DRAFT ou CONFIGURING
    return 'NON_CRITICAL';
  }
}
