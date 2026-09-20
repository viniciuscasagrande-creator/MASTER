import { prisma } from '../../../../core/database/prisma';
import { OperationReadinessDTO, OperationReadinessItemDTO, OperationReadinessStatus } from '@shared/types/index';

interface OverrideRecord {
  code: string;
  reason: string;
  overriddenBy: string;
  overriddenAt: string;
}

export class OperationReadinessService {
  private static overrides: Record<string, Record<string, OverrideRecord>> = {}; // operationId -> { code -> OverrideRecord }

  public static setOverride(operationId: string, code: string, reason: string, overriddenBy: string): void {
    if (!this.overrides[operationId]) {
      this.overrides[operationId] = {};
    }
    this.overrides[operationId][code] = {
      code,
      reason,
      overriddenBy,
      overriddenAt: new Date().toISOString()
    };
  }

  public static getOverrides(operationId: string): Record<string, OverrideRecord> {
    return this.overrides[operationId] || {};
  }

  public static async evaluateReadiness(eventId: string, sessionId: string, operationId: string): Promise<OperationReadinessDTO> {
    const items: OperationReadinessItemDTO[] = [];
    const operationOverrides = this.getOverrides(operationId);

    // 1. Session check
    const session = await prisma.eventSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      items.push({
        code: 'SESSION_EXISTS',
        label: 'Sessão do Evento',
        category: 'SESSION',
        status: 'BLOCKED',
        message: 'Sessão não encontrada ou não configurada.',
        isOverridable: false
      });
    } else {
      items.push({
        code: 'SESSION_CONFIG',
        label: 'Configuração da Sessão',
        category: 'SESSION',
        status: 'READY',
        message: `Sessão ativa agendada para ${new Date(session.startDate || session.scheduledDate || Date.now()).toLocaleDateString('pt-BR')}.`,
        isOverridable: false
      });
    }

    // 2. Team readiness check
    const teamMembers = await prisma.eventTeamMember.findMany({ where: { eventId } });
    const shifts = await prisma.operationShift.findMany({ where: { operationId } });
    const presentStaff = shifts.filter((s: any) => s.status === 'PRESENT');

    if (teamMembers.length === 0 && shifts.length === 0) {
      items.push({
        code: 'TEAM_MINIMUM',
        label: 'Escala de Equipe',
        category: 'TEAM',
        status: 'WARNING',
        message: 'Nenhum membro da equipe escalado para a operação.',
        details: 'Recomenda-se alocar ao menos os líderes de Acessos e Check-in.',
        isOverridable: true
      });
    } else {
      items.push({
        code: 'TEAM_MINIMUM',
        label: 'Escala de Equipe',
        category: 'TEAM',
        status: 'READY',
        message: `Equipe presente: ${presentStaff.length} de ${shifts.length || teamMembers.length} escalados.`,
        isOverridable: true
      });
    }

    // 3. Access points check
    const accessPoints = await prisma.sessionAccessPoint.findMany({ where: { sessionId } });
    if (accessPoints.length === 0) {
      items.push({
        code: 'ACCESS_POINTS_READY',
        label: 'Portões e Catracas',
        category: 'ACCESS',
        status: 'WARNING',
        message: 'Nenhum ponto de acesso alocado especificamente para esta sessão.',
        details: 'Pontos de acesso padrão serão provisionados na abertura.',
        isOverridable: true
      });
    } else {
      items.push({
        code: 'ACCESS_POINTS_READY',
        label: 'Portões e Catracas',
        category: 'ACCESS',
        status: 'READY',
        message: `${accessPoints.length} pontos de acesso cadastrados.`,
        isOverridable: true
      });
    }

    // 4. Tasks check (from 1.2.8)
    const openCriticalTasks = await prisma.eventTask.findMany({
      where: { eventId, status: 'OPEN', priority: 'CRITICAL' }
    });
    if (openCriticalTasks.length > 0) {
      items.push({
        code: 'PRE_OPS_TASKS',
        label: 'Tarefas Críticas Pré-Operação',
        category: 'TASKS',
        status: 'BLOCKED',
        message: `Existem ${openCriticalTasks.length} tarefas críticas pendentes antes da abertura.`,
        details: openCriticalTasks.map((t: any) => t.title).join(', '),
        isOverridable: true
      });
    } else {
      items.push({
        code: 'PRE_OPS_TASKS',
        label: 'Tarefas Pré-Operação',
        category: 'TASKS',
        status: 'READY',
        message: 'Nenhuma tarefa crítica impeditiva pendente.',
        isOverridable: false
      });
    }

    // 5. Document requirements check (from 1.2.8)
    const pendingMandatoryDocs = await prisma.eventDocumentRequirement.findMany({
      where: { eventId, isMandatory: true, status: 'PENDING' }
    });
    if (pendingMandatoryDocs.length > 0) {
      items.push({
        code: 'LEGAL_DOCUMENTS',
        label: 'Documentos Obrigatórios e Alvarás',
        category: 'DOCS',
        status: 'BLOCKED',
        message: `${pendingMandatoryDocs.length} alvarás/documentos legais obrigatórios estão pendentes.`,
        details: pendingMandatoryDocs.map((d: any) => d.title).join(', '),
        isOverridable: true
      });
    } else {
      items.push({
        code: 'LEGAL_DOCUMENTS',
        label: 'Conformidade de Documentos',
        category: 'DOCS',
        status: 'READY',
        message: 'Documentação legal obrigatória conforme.',
        isOverridable: false
      });
    }

    // 6. Check-in readiness
    items.push({
      code: 'CHECKIN_SYSTEM',
      label: 'Sistema de Check-in e Validação',
      category: 'CHECKIN',
      status: 'READY',
      message: 'Módulos de leitura QR/código de barras prontos.',
      isOverridable: false
    });

    // 7. Infra network readiness
    items.push({
      code: 'INFRA_NETWORK',
      label: 'Infraestrutura e Conectividade',
      category: 'INFRA',
      status: 'READY',
      message: 'Conexão estável com gateway central.',
      isOverridable: false
    });

    // Apply overrides
    for (const item of items) {
      if (operationOverrides[item.code]) {
        item.isOverridden = true;
        item.overrideReason = operationOverrides[item.code].reason;
        item.overriddenBy = operationOverrides[item.code].overriddenBy;
      }
    }

    // Calculate overall status
    let blockingCount = 0;
    let warningCount = 0;

    for (const item of items) {
      if (item.status === 'BLOCKED' && !item.isOverridden) {
        blockingCount++;
      } else if (item.status === 'WARNING' && !item.isOverridden) {
        warningCount++;
      }
    }

    let overallStatus: OperationReadinessStatus = 'READY';
    if (blockingCount > 0) {
      overallStatus = 'BLOCKED';
    } else if (warningCount > 0) {
      overallStatus = 'WARNING';
    }

    return {
      status: overallStatus,
      canOpen: blockingCount === 0,
      items,
      blockingCount,
      warningCount,
      lastCheckedAt: new Date().toISOString()
    };
  }

  public static clearAll(): void {
    this.overrides = {};
  }
}
