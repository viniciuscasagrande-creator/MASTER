import { EventStatus } from '@shared/types/index';

export interface TransitionRule {
  targetStatus: EventStatus;
  label: string;
  requiredGuards: string[];
  description: string;
}

export class EventStateMachine {
  /**
   * Mapa oficial de transições do ciclo de vida do evento
   */
  private static readonly RULES: Record<EventStatus, TransitionRule[]> = {
    DRAFT: [
      {
        targetStatus: 'CONFIGURING',
        label: 'Iniciar Configuração',
        requiredGuards: [],
        description: 'Transita o rascunho inicial para o modo de configuração detalhada.'
      },
      {
        targetStatus: 'CANCELLED',
        label: 'Cancelar Evento',
        requiredGuards: [],
        description: 'Descarta ou cancela o rascunho antes da configuração.'
      }
    ],
    CONFIGURING: [
      {
        targetStatus: 'REVIEW',
        label: 'Enviar para Revisão',
        requiredGuards: ['READINESS_REVIEW'],
        description: 'Submete o evento para conferência dos requisitos de dados, locais e setores.'
      },
      {
        targetStatus: 'CANCELLED',
        label: 'Cancelar Evento',
        requiredGuards: [],
        description: 'Cancela o evento em configuração.'
      }
    ],
    REVIEW: [
      {
        targetStatus: 'CONFIGURING',
        label: 'Retornar para Configuração',
        requiredGuards: [],
        description: 'Devolve o evento para ajustes técnicos ou comerciais identificados.'
      },
      {
        targetStatus: 'APPROVAL_PENDING',
        label: 'Solicitar Aprovação Executiva',
        requiredGuards: ['READINESS_PUBLICATION', 'REVIEW_SNAPSHOT_EXISTS'],
        description: 'Homologa a revisão e submete o evento ao motor de aprovações (Approval Engine).'
      },
      {
        targetStatus: 'CANCELLED',
        label: 'Cancelar Evento',
        requiredGuards: [],
        description: 'Cancela o evento durante a etapa de revisão.'
      }
    ],
    APPROVAL_PENDING: [
      {
        targetStatus: 'SCHEDULED',
        label: 'Aprovar e Programar',
        requiredGuards: ['APPROVAL_RESOLVED', 'SNAPSHOT_INTEGRITY', 'READINESS_PUBLICATION'],
        description: 'Evento aprovado pelas alçadas e programado para publicação.'
      },
      {
        targetStatus: 'REVIEW',
        label: 'Solicitar Ajustes (Aprovador)',
        requiredGuards: [],
        description: 'Devolve a solicitação de aprovação para revisão com justificativa.'
      },
      {
        targetStatus: 'CONFIGURING',
        label: 'Rejeitar para Configuração',
        requiredGuards: [],
        description: 'Rejeita a aprovação devolvendo o evento para configuração geral.'
      },
      {
        targetStatus: 'CANCELLED',
        label: 'Cancelar Evento',
        requiredGuards: [],
        description: 'Cancela o evento durante a esteira de aprovação.'
      }
    ],
    SCHEDULED: [
      {
        targetStatus: 'ON_SALE',
        label: 'Abrir Vendas',
        requiredGuards: ['READINESS_SALES', 'SALES_ACTIVE', 'SNAPSHOT_INTEGRITY'],
        description: 'Libera a comercialização oficial nos canais de venda habilitados.'
      },
      {
        targetStatus: 'CONFIGURING',
        label: 'Suspender Agendamento',
        requiredGuards: [],
        description: 'Remove do agendamento retornando para revisão/configuração.'
      },
      {
        targetStatus: 'CANCELLED',
        label: 'Cancelar Evento',
        requiredGuards: [],
        description: 'Cancela o evento antes da abertura de vendas.'
      }
    ],
    ON_SALE: [
      {
        targetStatus: 'SALES_PAUSED',
        label: 'Pausar Vendas',
        requiredGuards: [],
        description: 'Interrompe temporariamente a emissão de novos ingressos nos canais.'
      },
      {
        targetStatus: 'SOLD_OUT',
        label: 'Marcar como Esgotado',
        requiredGuards: ['INVENTORY_EMPTY'],
        description: 'Transição automática ou manual quando todo o inventário for consumido.'
      },
      {
        targetStatus: 'IN_PROGRESS',
        label: 'Iniciar Operação / Sessão',
        requiredGuards: ['READINESS_OPERATION'],
        description: 'O evento ou primeira sessão começou e portões foram abertos.'
      },
      {
        targetStatus: 'CANCELLED',
        label: 'Cancelar Evento com Vendas',
        requiredGuards: ['POST_SALES_CANCELLATION_POLICY'],
        description: 'Cancelamento crítico pós-vendas com plano de estorno e comunicação.'
      }
    ],
    SALES_PAUSED: [
      {
        targetStatus: 'ON_SALE',
        label: 'Retomar Vendas',
        requiredGuards: ['READINESS_SALES', 'SALES_ACTIVE'],
        description: 'Reativa os canais de venda e a disponibilidade de ingressos.'
      },
      {
        targetStatus: 'IN_PROGRESS',
        label: 'Iniciar Operação',
        requiredGuards: ['READINESS_OPERATION'],
        description: 'Inicia a operação no local mesmo com vendas comerciais pausadas.'
      },
      {
        targetStatus: 'CANCELLED',
        label: 'Cancelar Evento',
        requiredGuards: ['POST_SALES_CANCELLATION_POLICY'],
        description: 'Cancelamento do evento a partir do estado pausado.'
      }
    ],
    SOLD_OUT: [
      {
        targetStatus: 'ON_SALE',
        label: 'Reabrir Vendas (Novos Ingressos)',
        requiredGuards: ['READINESS_SALES', 'INVENTORY_AVAILABLE'],
        description: 'Reabre vendas caso haja cancelamentos, estornos ou expansão de cota.'
      },
      {
        targetStatus: 'IN_PROGRESS',
        label: 'Iniciar Operação',
        requiredGuards: ['READINESS_OPERATION'],
        description: 'Inicia o evento com ingressos 100% esgotados.'
      },
      {
        targetStatus: 'CANCELLED',
        label: 'Cancelar Evento',
        requiredGuards: ['POST_SALES_CANCELLATION_POLICY'],
        description: 'Cancelamento do evento esgotado.'
      }
    ],
    IN_PROGRESS: [
      {
        targetStatus: 'FINISHED',
        label: 'Encerrar Evento',
        requiredGuards: [],
        description: 'Todas as sessões foram finalizadas e o público deixou o local.'
      },
      {
        targetStatus: 'CANCELLED',
        label: 'Interromper Evento (Emergencial)',
        requiredGuards: ['EMERGENCY_INTERRUPTION_POLICY'],
        description: 'Interrupção emergencial por força maior ou segurança pública.'
      }
    ],
    FINISHED: [
      {
        targetStatus: 'ARCHIVED',
        label: 'Arquivar Evento',
        requiredGuards: ['READINESS_CLOSURE'],
        description: 'Arquivamento histórico após conciliação financeira e borderô final.'
      }
    ],
    CANCELLED: [
      {
        targetStatus: 'ARCHIVED',
        label: 'Arquivar Cancelamento',
        requiredGuards: [],
        description: 'Arquivamento histórico após conclusão das devoluções e cancelamentos.'
      }
    ],
    ARCHIVED: []
  };

  /**
   * Verifica se a transição entre dois status é estruturalmente permitida pela máquina de estados
   */
  public static isTransitionAllowed(from: EventStatus, to: EventStatus): boolean {
    const rules = this.RULES[from] || [];
    return rules.some(r => r.targetStatus === to);
  }

  /**
   * Retorna todas as regras de transição permitidas a partir de um estado
   */
  public static getAllowedTransitions(from: EventStatus): TransitionRule[] {
    return this.RULES[from] || [];
  }

  /**
   * Retorna os guard conditions requeridos para uma transição específica
   */
  public static getRequiredGuards(from: EventStatus, to: EventStatus): string[] {
    const rules = this.RULES[from] || [];
    const rule = rules.find(r => r.targetStatus === to);
    return rule ? rule.requiredGuards : [];
  }
}
