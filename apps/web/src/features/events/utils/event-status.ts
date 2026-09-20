import { EventStatus } from '../types/event.types';
import { BadgeVariant } from '../../../shared/components/Badge';

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: 'Rascunho',
  CONFIGURING: 'Em configuração',
  REVIEW: 'Em revisão',
  APPROVAL_PENDING: 'Aguardando aprovação',
  SCHEDULED: 'Programado',
  ON_SALE: 'Em venda',
  SALES_PAUSED: 'Vendas pausadas',
  SOLD_OUT: 'Esgotado',
  IN_PROGRESS: 'Em andamento',
  FINISHED: 'Finalizado',
  CANCELLED: 'Cancelado',
  ARCHIVED: 'Arquivado'
};

export const EVENT_STATUS_VARIANTS: Record<EventStatus, BadgeVariant> = {
  DRAFT: 'slate',
  CONFIGURING: 'cyan',
  REVIEW: 'purple',
  APPROVAL_PENDING: 'amber',
  SCHEDULED: 'cyan',
  ON_SALE: 'emerald',
  SALES_PAUSED: 'amber',
  SOLD_OUT: 'rose',
  IN_PROGRESS: 'orange',
  FINISHED: 'slate',
  CANCELLED: 'rose',
  ARCHIVED: 'neutral'
};

export const EVENT_STATUS_DESCRIPTIONS: Record<EventStatus, string> = {
  DRAFT: 'Evento recém-criado, dados básicos ainda em preenchimento.',
  CONFIGURING: 'Definição de setores, lotes, preços e regras de venda em andamento.',
  REVIEW: 'Em conferência e validação técnica interna antes do envio para aprovação.',
  APPROVAL_PENDING: 'Aguardando parecer de alçada executiva ou gerencial para publicação.',
  SCHEDULED: 'Aprovado e agendado. Início automático das vendas na data programada.',
  ON_SALE: 'Vendas abertas ao público geral e canais autorizados.',
  SALES_PAUSED: 'Vendas temporariamente suspensas pela produção ou operação.',
  SOLD_OUT: 'Carga total de ingressos esgotada em todos os setores disponíveis.',
  IN_PROGRESS: 'Evento em realização hoje. Portaria e check-in ativos em tempo real.',
  FINISHED: 'Evento concluído. Sessões finalizadas, aguardando fechamento e borderô.',
  CANCELLED: 'Evento cancelado. Vendas encerradas e fluxo de estorno acionado.',
  ARCHIVED: 'Encerrado, conciliado financeiramente e arquivado para histórico permanente.'
};

export function getEventStatusLabel(status: EventStatus): string {
  return EVENT_STATUS_LABELS[status] || status;
}

export function getEventStatusVariant(status: EventStatus): BadgeVariant {
  return EVENT_STATUS_VARIANTS[status] || 'slate';
}

export function getEventStatusDescription(status: EventStatus): string {
  return EVENT_STATUS_DESCRIPTIONS[status] || '';
}

export function isEventActive(status: EventStatus): boolean {
  return status === 'ON_SALE' || status === 'IN_PROGRESS';
}
