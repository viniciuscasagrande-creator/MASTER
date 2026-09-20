import { DashboardAlertDTO } from '@shared/types/index';

export class EventAlertAggregator {
  /**
   * Consolida, deduplica e prioriza alertas operacionais e executivos do evento
   */
  static aggregateAlerts(params: {
    event: any;
    sections: any[];
    batches: any[];
    channels: any[];
    readinessIssues: any[];
    pendingChanges: any[];
    kpis: { occupancyPercentage: number; checkinPercentage: number };
  }): DashboardAlertDTO[] {
    const alerts: DashboardAlertDTO[] = [];
    const seenCodes = new Set<string>();

    const addAlert = (alert: DashboardAlertDTO) => {
      if (!seenCodes.has(alert.id)) {
        seenCodes.add(alert.id);
        alerts.push(alert);
      }
    };

    const now = new Date().toISOString();

    // 1. Alertas de Inventário & Ocupação
    if (params.kpis.occupancyPercentage >= 100) {
      addAlert({
        id: 'ALERT_EVENT_SOLD_OUT',
        source: 'INVENTORY',
        severity: 'INFO',
        title: 'Capacidade Total Esgotada (100%)',
        description: 'Todas as vagas e ingressos do evento foram comprometidos.',
        actionLabel: 'Ver Inventário',
        actionRoute: `/events/${params.event.id}/inventory`,
        detectedAt: now,
        isDismissible: false
      });
    } else if (params.kpis.occupancyPercentage >= 90) {
      addAlert({
        id: 'ALERT_HIGH_OCCUPANCY',
        source: 'INVENTORY',
        severity: 'WARNING',
        title: 'Alta Ocupação Geral (90%+)',
        description: `O evento atingiu ${params.kpis.occupancyPercentage}% de ocupação global. Avalie liberação de lotes extras.`,
        actionLabel: 'Gerenciar Lotes',
        actionRoute: `/events/${params.event.id}/batches`,
        detectedAt: now,
        isDismissible: true
      });
    }

    for (const section of params.sections) {
      const soldOrCommitted = (section.sold || section.committed || 0);
      const cap = section.capacity || 1;
      const pct = Math.round((soldOrCommitted / cap) * 100);
      if (pct >= 95 && cap > 0) {
        addAlert({
          id: `ALERT_SECTION_FULL_${section.sectionId}`,
          source: 'INVENTORY',
          severity: 'WARNING',
          title: `Setor ${section.sectionName} Próximo de Esgotar (${pct}%)`,
          description: `Restam poucos ingressos disponíveis no setor ${section.sectionName}.`,
          actionLabel: 'Ajustar Capacidade',
          actionRoute: `/events/${params.event.id}/venues`,
          detectedAt: now,
          isDismissible: true
        });
      }
    }

    // 2. Alertas de Canais de Venda
    const enabledChannels = (params.channels || []).filter((c: any) => c.enabled);
    if (enabledChannels.length === 0 && params.event.status === 'ON_SALE') {
      addAlert({
        id: 'ALERT_NO_ENABLED_CHANNELS',
        source: 'INVENTORY',
        severity: 'CRITICAL',
        title: 'Nenhum Canal de Vendas Habilitado!',
        description: 'O evento está com status ABERTO PARA VENDAS mas nenhum canal está ativo.',
        actionLabel: 'Habilitar Canais',
        actionRoute: `/events/${params.event.id}/channels`,
        detectedAt: now,
        isDismissible: false
      });
    }

    // 3. Alertas de Lotes de Ingresso
    const activeBatches = (params.batches || []).filter((b: any) => b.status === 'ACTIVE');
    if (activeBatches.length === 0 && params.event.status === 'ON_SALE') {
      addAlert({
        id: 'ALERT_NO_ACTIVE_BATCHES',
        source: 'INVENTORY',
        severity: 'CRITICAL',
        title: 'Nenhum Lote Ativo em Venda!',
        description: 'O evento está aberto para venda porém todos os lotes estão pausados, esgotados ou futuros.',
        actionLabel: 'Ativar Lote',
        actionRoute: `/events/${params.event.id}/batches`,
        detectedAt: now,
        isDismissible: false
      });
    }

    // 4. Alertas de Alterações Pendentes
    if (params.pendingChanges && params.pendingChanges.length > 0) {
      addAlert({
        id: 'ALERT_PENDING_CHANGES',
        source: 'CHANGES',
        severity: 'WARNING',
        title: `${params.pendingChanges.length} Alteração(ões) Crítica(s) Pendente(s)`,
        description: 'Existem solicitações de alteração aguardando análise de impacto ou aprovação.',
        actionLabel: 'Ver Central de Alterações',
        actionRoute: `/events/${params.event.id}/changes`,
        detectedAt: now,
        isDismissible: true
      });
    }

    // 5. Alertas de Prontidão (Readiness)
    const blockingReadiness = (params.readinessIssues || []).filter(
      (i: any) => i.severity === 'CRITICAL' || i.severity === 'BLOCKING'
    );
    if (blockingReadiness.length > 0 && params.event.status !== 'ON_SALE' && params.event.status !== 'FINISHED') {
      addAlert({
        id: 'ALERT_READINESS_BLOCKERS',
        source: 'READINESS',
        severity: 'CRITICAL',
        title: `${blockingReadiness.length} Pendência(s) Bloqueante(s) de Prontidão`,
        description: 'Requisitos técnicos e documentais impedem a homologação ou publicação do evento.',
        actionLabel: 'Central de Prontidão',
        actionRoute: `/events/${params.event.id}/readiness`,
        detectedAt: now,
        isDismissible: false
      });
    }

    // Ordena por severidade: CRITICAL > HIGH > WARNING > INFO
    const severityWeight: Record<string, number> = { CRITICAL: 4, HIGH: 3, WARNING: 2, INFO: 1 };
    return alerts.sort((a, b) => (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0));
  }
}
