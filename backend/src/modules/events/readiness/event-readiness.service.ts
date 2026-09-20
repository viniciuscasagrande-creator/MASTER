import { prisma } from '../../../core/database/prisma';
import {
  EventReadinessDTO,
  ReadinessIssueDTO,
  ReadinessStatus,
  ReadinessTarget
} from '@shared/types/index';
import { EventDocumentService } from '../documents/event-document.service';

export class EventReadinessService {
  /**
   * Avalia a prontidão do evento inspecionando todos os modelos de domínio
   */
  static async evaluateEventReadiness(eventId: string): Promise<EventReadinessDTO> {
    const issues: ReadinessIssueDTO[] = [];
    let totalChecks = 0;
    let readyCount = 0;
    let warningCount = 0;
    let blockingCount = 0;
    let pendingCount = 0;
    let criticalCount = 0;

    const recordCheck = (
      passed: boolean,
      issueIfFailed?: {
        code: string;
        category: 'INFO' | 'VENUE' | 'SESSIONS' | 'CAPACITY' | 'INVENTORY' | 'PRICING' | 'CHANNELS' | 'DOCUMENTS' | 'TEAM' | 'COMPLIANCE';
        categoryLabel: string;
        severity: 'INFO' | 'WARNING' | 'BLOCKING' | 'CRITICAL';
        title: string;
        description: string;
        target: ReadinessTarget;
        actionLabel?: string;
        actionRoute?: string;
        actionCode?: string;
      }
    ) => {
      totalChecks++;
      if (passed) {
        readyCount++;
      } else if (issueIfFailed) {
        if (issueIfFailed.severity === 'CRITICAL') criticalCount++;
        else if (issueIfFailed.severity === 'BLOCKING') blockingCount++;
        else if (issueIfFailed.severity === 'WARNING') warningCount++;
        else pendingCount++;

        issues.push({
          code: issueIfFailed.code,
          category: issueIfFailed.category,
          categoryLabel: issueIfFailed.categoryLabel,
          status: issueIfFailed.severity === 'WARNING' ? 'WARNING' : 'BLOCKED',
          severity: issueIfFailed.severity,
          title: issueIfFailed.title,
          description: issueIfFailed.description,
          target: issueIfFailed.target,
          actionLabel: issueIfFailed.actionLabel,
          actionRoute: issueIfFailed.actionRoute,
          actionCode: issueIfFailed.actionCode,
          detectedAt: new Date().toISOString()
        });
      }
    };

    // 1. CARREGA DADOS DO EVENTO
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new Error('Evento não encontrado para avaliação de prontidão');
    }

    // DIMENSÃO 1: Informações Básicas
    recordCheck(Boolean(event.name && event.name.trim().length > 3), {
      code: 'INFO_NAME_MISSING',
      category: 'INFO',
      categoryLabel: 'Informações Básicas',
      severity: 'CRITICAL',
      title: 'Nome do evento incompleto',
      description: 'O evento precisa de um nome descritivo com mais de 3 caracteres.',
      target: 'REVIEW',
      actionLabel: 'Editar Informações',
      actionRoute: `/events/${eventId}/edit`
    });

    recordCheck(Boolean(event.slug && event.slug.length > 2), {
      code: 'INFO_SLUG_MISSING',
      category: 'INFO',
      categoryLabel: 'Informações Básicas',
      severity: 'BLOCKING',
      title: 'Slug da URL amigável não definido',
      description: 'O slug é necessário para os links comerciais de venda e compartilhamento.',
      target: 'PUBLICATION',
      actionLabel: 'Configurar Slug',
      actionRoute: `/events/${eventId}/edit`
    });

    // DIMENSÃO 2: Local & Estrutura Física
    const eventVenues = await prisma.eventVenue.findMany({ where: { eventId } });
    const hasVenue = eventVenues.length > 0;
    recordCheck(hasVenue, {
      code: 'VENUE_NOT_LINKED',
      category: 'VENUE',
      categoryLabel: 'Local do Evento',
      severity: 'CRITICAL',
      title: 'Nenhum local vinculado ao evento',
      description: 'É necessário associar uma praça/arena/teatro ao evento.',
      target: 'REVIEW',
      actionLabel: 'Vincular Local',
      actionRoute: `/events/${eventId}/venues`
    });

    const eventSections = await prisma.eventSection.findMany({ where: { eventId, active: true } });
    recordCheck(eventSections.length > 0, {
      code: 'SECTIONS_NOT_DEFINED',
      category: 'VENUE',
      categoryLabel: 'Setores Operacionais',
      severity: 'BLOCKING',
      title: 'Nenhum setor operacional ativo configurado',
      description: 'Defina os setores físicos (ex: Pista, Camarote) onde os ingressos serão alocados.',
      target: 'PUBLICATION',
      actionLabel: 'Configurar Setores',
      actionRoute: `/events/${eventId}/venues`
    });

    // DIMENSÃO 3: Sessões e Datas
    const sessions = await prisma.eventSession.findMany({ where: { eventId, active: true } });
    recordCheck(sessions.length > 0, {
      code: 'SESSIONS_EMPTY',
      category: 'SESSIONS',
      categoryLabel: 'Datas e Sessões',
      severity: 'CRITICAL',
      title: 'Nenhuma sessão cadastrada para o evento',
      description: 'Cadastre ao menos uma sessão com data de início e término.',
      target: 'REVIEW',
      actionLabel: 'Criar Sessão',
      actionRoute: `/events/${eventId}/sessions`
    });

    let totalCapacity = 0;
    for (const ses of sessions) {
      totalCapacity += ses.totalCapacity || 0;
    }
    recordCheck(totalCapacity > 0, {
      code: 'CAPACITY_ZERO',
      category: 'CAPACITY',
      categoryLabel: 'Capacidade Operacional',
      severity: 'BLOCKING',
      title: 'Capacidade do evento zerada',
      description: 'A capacidade operacional das sessões deve ser maior que zero.',
      target: 'PUBLICATION',
      actionLabel: 'Ajustar Capacidade',
      actionRoute: `/events/${eventId}/sessions`
    });

    // DIMENSÃO 4: Tipos de Ingresso
    const ticketTypes = await prisma.eventTicketType.findMany({ where: { eventId, active: true } });
    recordCheck(ticketTypes.length > 0, {
      code: 'TICKET_TYPES_MISSING',
      category: 'INVENTORY',
      categoryLabel: 'Tipos de Ingresso',
      severity: 'BLOCKING',
      title: 'Nenhum tipo de ingresso configurado',
      description: 'Cadastre modalidades como Inteira, Meia-Entrada ou VIP.',
      target: 'PUBLICATION',
      actionLabel: 'Configurar Ingressos',
      actionRoute: `/events/${eventId}/ticket-types`
    });

    // DIMENSÃO 5: Inventário Vendável
    const pools = await prisma.inventoryPool.findMany();
    const eventPools = pools.filter((p: any) => sessions.some(s => s.id === p.sessionId));
    recordCheck(eventPools.length > 0, {
      code: 'INVENTORY_POOLS_MISSING',
      category: 'INVENTORY',
      categoryLabel: 'Inventário Vendável',
      severity: 'BLOCKING',
      title: 'Pools de inventário não inicializados',
      description: 'Os pools de capacidade entre sessões e setores precisam ser gerados.',
      target: 'PUBLICATION',
      actionLabel: 'Gerar Pools',
      actionRoute: `/events/${eventId}/inventory`
    });

    let totalAvailablePool = 0;
    for (const p of eventPools) {
      totalAvailablePool += Math.max(0, p.capacity - (p.reserved + p.blocked + p.sold + p.held));
    }
    recordCheck(totalAvailablePool > 0, {
      code: 'INVENTORY_UNAVAILABLE',
      category: 'INVENTORY',
      categoryLabel: 'Inventário Vendável',
      severity: 'WARNING',
      title: 'Disponibilidade comercial de ingressos zerada',
      description: 'Não há ingressos livres para venda em nenhum setor do evento.',
      target: 'SALES',
      actionLabel: 'Verificar Inventário',
      actionRoute: `/events/${eventId}/inventory`
    });

    // DIMENSÃO 6: Lotes Comerciais & Preços
    const batches = await prisma.ticketBatch.findMany({ where: { eventId } });
    const hasActiveOrScheduledBatch = batches.some((b: any) => b.status === 'ACTIVE' || b.status === 'SCHEDULED' || b.status === 'PUBLISHED');
    recordCheck(batches.length > 0, {
      code: 'BATCHES_NONE',
      category: 'PRICING',
      categoryLabel: 'Lotes Comerciais',
      severity: 'BLOCKING',
      title: 'Nenhum lote de venda cadastrado',
      description: 'Cadastre ao menos um lote comercial para permitir a precificação.',
      target: 'PUBLICATION',
      actionLabel: 'Criar Lote',
      actionRoute: `/events/${eventId}/batches`
    });

    recordCheck(hasActiveOrScheduledBatch, {
      code: 'BATCHES_NO_ACTIVE',
      category: 'PRICING',
      categoryLabel: 'Lotes Comerciais',
      severity: 'WARNING',
      title: 'Nenhum lote ativo ou agendado no momento',
      description: 'Ative um lote comercial para que os ingressos fiquem abertos para compra.',
      target: 'SALES',
      actionLabel: 'Ativar Lote',
      actionRoute: `/events/${eventId}/batches`
    });

    const prices = await prisma.priceConfiguration.findMany({ where: { eventId } });
    const hasValidPrices = prices.some((p: any) => p.faceValue > 0);
    recordCheck(hasValidPrices, {
      code: 'PRICING_INCOMPLETE',
      category: 'PRICING',
      categoryLabel: 'Matriz de Preços',
      severity: 'BLOCKING',
      title: 'Matriz de preços não configurada',
      description: 'Configure os valores nominais e taxas dos ingressos para os lotes.',
      target: 'SALES',
      actionLabel: 'Configurar Preços',
      actionRoute: `/events/${eventId}/pricing`
    });

    // DIMENSÃO 7: Canais de Venda
    const eventChannels = await prisma.eventSalesChannel.findMany({ where: { eventId, enabled: true } });
    recordCheck(eventChannels.length > 0, {
      code: 'CHANNELS_NONE_ENABLED',
      category: 'CHANNELS',
      categoryLabel: 'Canais de Distribuição',
      severity: 'BLOCKING',
      title: 'Nenhum canal de venda habilitado',
      description: 'Habilite o site da Disk Ingressos, bilheterias físicas ou parceiros.',
      target: 'SALES',
      actionLabel: 'Habilitar Canais',
      actionRoute: `/events/${eventId}/sales-channels`
    });

    // DIMENSÃO 8: Documentos & Conformidade Legal
    const docRequirements = await EventDocumentService.listRequirements(eventId);
    const blockingMissingDocs = docRequirements.filter(d => d.blocking && d.status !== 'VALID');
    const expiringDocs = docRequirements.filter(d => d.status === 'EXPIRING');

    for (const doc of blockingMissingDocs) {
      recordCheck(false, {
        code: `DOC_BLOCKING_${doc.categoryCode}`,
        category: 'DOCUMENTS',
        categoryLabel: 'Documentação Legal',
        severity: 'CRITICAL',
        title: `Documento Obrigatório Pendente: ${doc.categoryName}`,
        description: `O documento "${doc.categoryName}" é obrigatório para abertura de vendas e realização da operação.`,
        target: 'OPERATION',
        actionLabel: 'Anexar Documento',
        actionRoute: `/events/${eventId}/documents`
      });
    }

    for (const doc of expiringDocs) {
      recordCheck(false, {
        code: `DOC_EXPIRING_${doc.categoryCode}`,
        category: 'DOCUMENTS',
        categoryLabel: 'Documentação Legal',
        severity: 'WARNING',
        title: `Documento Próximo do Vencimento: ${doc.categoryName}`,
        description: `O documento expira nos próximos 15 dias. Providencie a renovação.`,
        target: 'OPERATION',
        actionLabel: 'Renovar Documento',
        actionRoute: `/events/${eventId}/documents`
      });
    }

    if (blockingMissingDocs.length === 0 && expiringDocs.length === 0) {
      recordCheck(true);
    }

    // DIMENSÃO 9: Equipe e Responsabilidades
    const responsibilities = await prisma.eventResponsibility.findMany({ where: { eventId, active: true } });
    const hasCoreResponsibilities = responsibilities.length > 0;
    recordCheck(hasCoreResponsibilities, {
      code: 'TEAM_RESPONSIBILITY_MISSING',
      category: 'TEAM',
      categoryLabel: 'Equipe e Coordenação',
      severity: 'WARNING',
      title: 'Coordenação operacional não atribuída',
      description: 'Defina os líderes de bilheteria, acesso ou coordenação geral do evento.',
      target: 'OPERATION',
      actionLabel: 'Atribuir Responsáveis',
      actionRoute: `/events/${eventId}/team`
    });

    // CÁLCULO DE TARGETS
    const targets: Record<ReadinessTarget, ReadinessStatus> = {
      REVIEW: 'READY',
      PUBLICATION: 'READY',
      SALES: 'READY',
      OPERATION: 'READY',
      CLOSURE: 'READY'
    };

    for (const issue of issues) {
      if (issue.severity === 'CRITICAL' || issue.severity === 'BLOCKING') {
        targets[issue.target] = 'BLOCKED';
      } else if (issue.severity === 'WARNING' && targets[issue.target] !== 'BLOCKED') {
        targets[issue.target] = 'WARNING';
      }
    }

    // Se REVIEW está bloqueado, bloqueia PUBLICATION e posteriores
    if (targets.REVIEW === 'BLOCKED') {
      targets.PUBLICATION = 'BLOCKED';
      targets.SALES = 'BLOCKED';
      targets.OPERATION = 'BLOCKED';
    } else if (targets.PUBLICATION === 'BLOCKED') {
      targets.SALES = 'BLOCKED';
      targets.OPERATION = 'BLOCKED';
    } else if (targets.SALES === 'BLOCKED') {
      targets.OPERATION = 'BLOCKED';
    }

    // Status global
    let overallStatus: ReadinessStatus = 'READY';
    if (criticalCount > 0 || blockingCount > 0) {
      overallStatus = 'BLOCKED';
    } else if (warningCount > 0) {
      overallStatus = 'WARNING';
    }

    const scorePercentage = totalChecks > 0 ? Math.round((readyCount / totalChecks) * 100) : 100;

    // Categorias agregadas
    const categoryMap = new Map<string, { label: string; issues: number; blocked: boolean; warning: boolean }>();
    for (const issue of issues) {
      const cur = categoryMap.get(issue.category) || { label: issue.categoryLabel, issues: 0, blocked: false, warning: false };
      cur.issues++;
      if (issue.severity === 'BLOCKING' || issue.severity === 'CRITICAL') cur.blocked = true;
      if (issue.severity === 'WARNING') cur.warning = true;
      categoryMap.set(issue.category, cur);
    }

    const categoriesList = Array.from(categoryMap.entries()).map(([k, v]) => ({
      category: k,
      label: v.label,
      status: (v.blocked ? 'BLOCKED' : v.warning ? 'WARNING' : 'READY') as ReadinessStatus,
      issuesCount: v.issues
    }));

    const result: EventReadinessDTO = {
      eventId,
      status: overallStatus,
      scorePercentage,
      targets,
      summary: {
        totalChecks,
        readyCount,
        warningCount,
        blockingCount,
        pendingCount,
        criticalCount
      },
      categories: categoriesList,
      issues,
      evaluatedAt: new Date().toISOString()
    };

    // Salva snapshot no banco
    await prisma.readinessSnapshot.upsert({
      where: { eventId },
      create: {
        scorePercentage,
        status: overallStatus,
        issuesJson: JSON.stringify(issues),
        evaluatedAt: new Date()
      },
      update: {
        scorePercentage,
        status: overallStatus,
        issuesJson: JSON.stringify(issues),
        evaluatedAt: new Date()
      }
    });

    return result;
  }
}
