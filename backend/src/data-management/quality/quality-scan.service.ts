import { prisma } from '../../core/database/prisma';
import { EventBus } from '../../events/event-bus';
import { SchemaValidatorService } from '../validation/schema-validator.service';
import { QualityRuleRegistry } from './quality-rule.registry';
import { TaskService } from '../../modules/tasks/task.service';
import { AuthenticatedUser } from '../../core/middleware/authenticate';

export interface ScanResult {
  scannedRulesCount: number;
  scannedRecordsCount: number;
  issuesFoundCount: number;
  newIssuesCount: number;
  tasksCreatedCount: number;
  timestamp: string;
}

const SYSTEM_QUALITY_USER: AuthenticatedUser = {
  id: 'system-quality-engine',
  name: 'Data Quality Engine',
  email: 'quality@disk-core.internal',
  isSuperAdmin: true,
  status: 'ACTIVE',
  roles: ['ADMINISTRADOR_GERAL'],
  permissions: ['*'],
  scope: {
    isGlobal: true,
    producers: [],
    events: []
  },
  sessionId: 'sess_quality_sys'
};

export class QualityScanService {
  /**
   * Runs quality scan across all active rules or selected rule code
   */
  public static async runScan(ruleCodeFilter?: string): Promise<ScanResult> {
    const allRules = QualityRuleRegistry.getAll().filter(r => r.active);
    const rulesToRun = ruleCodeFilter ? allRules.filter(r => r.code === ruleCodeFilter) : allRules;

    let scannedRecords = 0;
    let issuesFound = 0;
    let newIssues = 0;
    let tasksCreated = 0;

    for (const rule of rulesToRun) {
      const issues = await this.scanForRule(rule);
      scannedRecords += issues.scannedCount;

      for (const item of issues.foundIssues) {
        issuesFound++;

        // Check if an open issue already exists for this rule and record
        const existing = await prisma.dataQualityIssueModel.findFirst({
          where: {
            ruleCode: rule.code,
            recordId: item.recordId,
            status: 'OPEN'
          }
        });

        if (!existing) {
          let createdTaskId: string | undefined = undefined;

          // If critical or warning, create a task in Task Engine
          if (rule.severity === 'CRITICAL' || rule.severity === 'ERROR') {
            try {
              const task = await TaskService.createTask({
                title: `[Qualidade] ${rule.name} - ${item.recordId}`,
                description: `${rule.description}\nEntidade: ${rule.entity}\nRegistro: ${item.recordId}\nCampo: ${item.fieldName || 'N/A'}\nValor: ${item.currentValue || 'N/A'}\nAção Sugerida: ${item.suggestedFix || rule.recommendedAction}`,
                module: 'DADOS' as any,
                priority: rule.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
                assignedTeamCode: 'ADMINISTRADOR_GERAL'
              }, SYSTEM_QUALITY_USER);
              createdTaskId = task.id;
              tasksCreated++;
            } catch {
              // Non-blocking task creation
            }
          }

          const savedIssue = await prisma.dataQualityIssueModel.create({
            data: {
              ruleCode: rule.code,
              ruleName: rule.name,
              dimension: rule.dimension,
              severity: rule.severity,
              targetEntity: rule.entity,
              recordId: item.recordId,
              fieldName: item.fieldName,
              currentValue: item.currentValue ? String(item.currentValue) : null,
              suggestedFix: item.suggestedFix || rule.recommendedAction,
              status: 'OPEN',
              taskId: createdTaskId,
              createdAt: new Date()
            }
          });
          newIssues++;

          // Emit event to EventBus
          await EventBus.publish({
            id: `evt-qual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'DATA_QUALITY_ISSUE_DETECTED',
            resourceType: 'DATA_QUALITY_ISSUE',
            resourceId: savedIssue.id,
            timestamp: new Date(),
            data: {
              issueId: savedIssue.id,
              ruleCode: rule.code,
              dimension: rule.dimension,
              severity: rule.severity,
              targetEntity: rule.entity,
              recordId: item.recordId,
              taskId: createdTaskId
            }
          });
        }
      }
    }

    return {
      scannedRulesCount: rulesToRun.length,
      scannedRecordsCount: scannedRecords,
      issuesFoundCount: issuesFound,
      newIssuesCount: newIssues,
      tasksCreatedCount: tasksCreated,
      timestamp: new Date().toISOString()
    };
  }

  private static async scanForRule(rule: any): Promise<{ scannedCount: number; foundIssues: any[] }> {
    const foundIssues: any[] = [];
    let scannedCount = 0;

    switch (rule.code) {
      case 'FORNECEDOR_SEM_CONTA_BANCARIA': {
        const suppliers = await prisma.supplier.findMany();
        scannedCount = suppliers.length;
        for (const s of suppliers) {
          if (!s.bankDetails || (!s.bankDetails.pixKey && !s.bankDetails.accountNumber)) {
            foundIssues.push({
              recordId: s.id,
              fieldName: 'bankDetails',
              currentValue: JSON.stringify(s.bankDetails || {}),
              suggestedFix: 'Preencher chave PIX ou dados de conta bancária para liquidação de pagamentos.'
            });
          }
        }
        break;
      }

      case 'CPF_CNPJ_INVALIDO': {
        const customers = await prisma.customer.findMany();
        scannedCount = customers.length;
        for (const c of customers) {
          if (c.document) {
            const clean = c.document.replace(/\D/g, '');
            const valid = clean.length === 11 
              ? SchemaValidatorService.isValidCpf(clean)
              : clean.length === 14 
                ? SchemaValidatorService.isValidCnpj(clean)
                : false;
            if (!valid) {
              foundIssues.push({
                recordId: c.id,
                fieldName: 'document',
                currentValue: c.document,
                suggestedFix: 'Revisar e corrigir os dígitos verificadores do CPF/CNPJ.'
              });
            }
          }
        }
        break;
      }

      case 'EMAIL_FORMATO_INVALIDO': {
        const customers = await prisma.customer.findMany();
        scannedCount = customers.length;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const c of customers) {
          if (c.email && !emailRegex.test(c.email)) {
            foundIssues.push({
              recordId: c.id,
              fieldName: 'email',
              currentValue: c.email,
              suggestedFix: 'Corrigir formato de e-mail (exemplo: usuario@dominio.com).'
            });
          }
        }
        break;
      }

      case 'CLIENTE_SEM_CONTATO': {
        const customers = await prisma.customer.findMany();
        scannedCount = customers.length;
        for (const c of customers) {
          if (!c.email && !c.phone) {
            foundIssues.push({
              recordId: c.id,
              fieldName: 'email/phone',
              currentValue: 'VAZIO',
              suggestedFix: 'Cadastrar pelo menos um canal de contato (e-mail ou telefone).'
            });
          }
        }
        break;
      }

      case 'CLIENTE_DUPLICADO_DOCUMENTO': {
        const customers = await prisma.customer.findMany();
        scannedCount = customers.length;
        const seen = new Map<string, string[]>();
        for (const c of customers) {
          if (c.document) {
            const clean = c.document.replace(/\D/g, '');
            if (clean) {
              const list = seen.get(clean) || [];
              list.push(c.id);
              seen.set(clean, list);
            }
          }
        }
        for (const [doc, ids] of seen.entries()) {
          if (ids.length > 1) {
            for (const id of ids.slice(1)) {
              foundIssues.push({
                recordId: id,
                fieldName: 'document',
                currentValue: doc,
                suggestedFix: `Cliente possui mesmo CPF/CNPJ de outros cadastros: [${ids.join(', ')}]. Sugerida mesclagem.`
              });
            }
          }
        }
        break;
      }

      case 'LANCAMENTO_VALOR_NEGATIVO': {
        const txs = await prisma.financialTransaction.findMany();
        scannedCount = txs.length;
        for (const tx of txs) {
          if (tx.amount <= 0) {
            foundIssues.push({
              recordId: tx.id,
              fieldName: 'amount',
              currentValue: tx.amount,
              suggestedFix: 'Corrigir valor da transação para montante estritamente positivo.'
            });
          }
        }
        break;
      }

      case 'TRANSACAO_DATA_FUTURA_ANOMALA': {
        const txs = await prisma.financialTransaction.findMany();
        scannedCount = txs.length;
        const now = new Date();
        for (const tx of txs) {
          const txDate = new Date(tx.createdAt || tx.date);
          if (txDate > now) {
            foundIssues.push({
              recordId: tx.id,
              fieldName: 'date',
              currentValue: txDate.toISOString(),
              suggestedFix: 'Auditar data da transação, registrada com timestamp no futuro.'
            });
          }
        }
        break;
      }

      case 'CONTATO_SEM_CONSENTIMENTO_LGPD': {
        const contacts = await prisma.customer.findMany();
        scannedCount = contacts.length;
        for (const c of contacts) {
          if (c.tags && c.tags.includes('MARKETING') && !(c as any).optInConsent) {
            foundIssues.push({
              recordId: c.id,
              fieldName: 'optInConsent',
              currentValue: 'AUSENTE',
              suggestedFix: 'Obter consentimento LGPD explícito antes de comunicações promocionais.'
            });
          }
        }
        break;
      }

      case 'INTEGRIDADE_EVENTO_INEXISTENTE': {
        const orders = await prisma.order.findMany();
        const events = await prisma.event.findMany();
        const validEventIds = new Set(events.map(e => e.id));
        scannedCount = orders.length;
        for (const ord of orders) {
          if (ord.eventId && !validEventIds.has(ord.eventId)) {
            foundIssues.push({
              recordId: ord.id,
              fieldName: 'eventId',
              currentValue: ord.eventId,
              suggestedFix: 'Vínculo quebrado: ID de evento não encontrado no catálogo do sistema.'
            });
          }
        }
        break;
      }

      default:
        scannedCount = 0;
        break;
    }

    return { scannedCount, foundIssues };
  }
}
