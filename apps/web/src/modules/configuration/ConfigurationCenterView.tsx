import React, { useState, useEffect } from 'react';
import {
  ConfigurationTab,
  EffectiveConfigResult,
  PolicyItem,
  PolicyConflictItem,
  FeatureFlagItem,
  ConfigAuditItem,
  ConfigurationSummaryStats,
  ConfigScopeType
} from './configuration.types';
import { ParametersView } from './ParametersView';
import { PoliciesView } from './PoliciesView';
import { PolicyDetailsModal } from './PolicyDetailsModal';
import { PolicySimulatorView } from './PolicySimulatorView';
import { InheritanceTreeView } from './InheritanceTreeView';
import { FeatureFlagsView } from './FeatureFlagsView';
import { ConfigurationHistoryView } from './ConfigurationHistoryView';
import { NewPolicyModal } from './NewPolicyModal';
import { useAuth } from '../../core/auth/AuthContext';
import {
  Sliders,
  Shield,
  FileCheck,
  AlertTriangle,
  Radio,
  History,
  GitFork,
  Sparkles,
  Zap,
  Activity,
  Layers,
  AlertOctagon,
  CheckCircle2,
  Plus
} from 'lucide-react';

interface ConfigurationCenterViewProps {
  initialSubItem?: string;
  onNavigate?: (moduleId: string, subItemId?: string) => void;
}

export const ConfigurationCenterView: React.FC<ConfigurationCenterViewProps> = ({
  initialSubItem,
  onNavigate
}) => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.roleSlug === 'admin_geral';

  // Tab mapping
  const resolveTabFromSubItem = (sub?: string): ConfigurationTab => {
    switch (sub) {
      case 'config-parameters':
        return 'parameters';
      case 'config-policies':
        return 'policies';
      case 'config-simulator':
        return 'simulator';
      case 'config-tree':
        return 'inheritance';
      case 'config-features':
        return 'features';
      case 'config-audit':
        return 'audit';
      default:
        return 'parameters';
    }
  };

  const [activeTab, setActiveTab] = useState<ConfigurationTab>(resolveTabFromSubItem(initialSubItem));

  useEffect(() => {
    if (initialSubItem) {
      setActiveTab(resolveTabFromSubItem(initialSubItem));
    }
  }, [initialSubItem]);

  // Current scope state
  const [currentScope, setCurrentScope] = useState<{
    type: ConfigScopeType;
    producerId?: string;
    eventId?: string;
    name: string;
  }>({
    type: 'GLOBAL',
    name: 'DiskIngressos Padrão'
  });

  // State collections
  const [parameters, setParameters] = useState<EffectiveConfigResult[]>([
    {
      key: 'finance.transfer.minimum_balance',
      value: 5000,
      type: 'CURRENCY',
      unit: 'BRL',
      source: 'GLOBAL',
      policyVersion: 1,
      explanation: 'Valor padrão global retido para segurança de liquidação.'
    },
    {
      key: 'finance.transfer.approval.threshold',
      value: 50000,
      type: 'CURRENCY',
      unit: 'BRL',
      source: 'GLOBAL',
      policyVersion: 1,
      explanation: 'Transferências acima deste montante exigem dupla aprovação.'
    },
    {
      key: 'refund.max_days_allowed',
      value: 7,
      type: 'INTEGER',
      unit: 'DIAS',
      source: 'GLOBAL',
      policyVersion: 1,
      explanation: 'Prazo legal padrão do Código de Defesa do Consumidor.'
    },
    {
      key: 'sac.first_response.sla',
      value: 60,
      type: 'DURATION',
      unit: 'MINUTOS',
      source: 'DEFAULT',
      policyVersion: 1,
      explanation: 'SLA padrão da central de atendimento SAC.'
    },
    {
      key: 'task.auto_assignment.strategy',
      value: 'WORKLOAD',
      type: 'ENUM',
      source: 'DEFAULT',
      policyVersion: 1,
      explanation: 'Distribuição inteligente baseada na carga horária de operadores.'
    },
    {
      key: 'document.storage.provider',
      value: 'S3',
      type: 'ENUM',
      source: 'GLOBAL',
      policyVersion: 1,
      explanation: 'Provedor de armazenamento em nuvem com criptografia em repouso.'
    }
  ]);

  const [policies, setPolicies] = useState<PolicyItem[]>([
    {
      id: 'pol_fin_transfer',
      code: 'POL-FIN-TRANSFER',
      name: 'Política Global de Transferências Financeiras',
      domain: 'FINANCE',
      description: 'Controla alçadas e aprovações para movimentações financeiras',
      scopeType: 'GLOBAL',
      status: 'ACTIVE',
      currentVersion: 1,
      priority: 100,
      requiresApproval: false,
      createdBy: 'usr_superadmin',
      rules: [
        {
          id: 'rule_1',
          policyId: 'pol_fin_transfer',
          version: 1,
          name: 'Transferência Elevada (> R$ 50k)',
          priority: 80,
          orderIndex: 1,
          isActive: true,
          conditions: [{ field: 'amount', operator: 'GREATER_THAN', value: 50000 }],
          action: { decision: true, approvalsRequired: 2, stepUpRequired: true },
          createdAt: '2026-01-01T00:00:00.000Z'
        },
        {
          id: 'rule_2',
          policyId: 'pol_fin_transfer',
          version: 1,
          name: 'Transferência Padrão (<= R$ 50k)',
          priority: 50,
          orderIndex: 2,
          isActive: true,
          conditions: [{ field: 'amount', operator: 'LESS_OR_EQUAL', value: 50000 }],
          action: { decision: true, approvalsRequired: 1, stepUpRequired: false },
          createdAt: '2026-01-01T00:00:00.000Z'
        }
      ],
      versions: [
        {
          id: 'ver_1',
          policyId: 'pol_fin_transfer',
          versionNumber: 1,
          status: 'ACTIVE',
          rulesSnapshot: [],
          changeReason: 'Criação inicial das regras financeiras da plataforma',
          createdBy: 'usr_superadmin',
          creatorName: 'Vinicius Casagrande',
          createdAt: '2026-01-01T00:00:00.000Z'
        }
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'pol_refund_opus',
      code: 'POL-REFUND-OPUS',
      name: 'Regras de Estorno Produtora Opus',
      domain: 'REFUNDS',
      description: 'Condições específicas para estorno de festivais da produtora',
      scopeType: 'PRODUCER',
      producerId: 'prd_100',
      status: 'ACTIVE',
      currentVersion: 1,
      priority: 120,
      requiresApproval: false,
      createdBy: 'usr_superadmin',
      rules: [
        {
          id: 'rule_ref_1',
          policyId: 'pol_refund_opus',
          version: 1,
          name: 'Estorno Imediato VIP',
          priority: 90,
          orderIndex: 1,
          isActive: true,
          conditions: [{ field: 'customerTier', operator: 'EQUAL', value: 'VIP' }],
          action: { decision: true, approvalsRequired: 1, slaMinutes: 30 },
          createdAt: '2026-01-01T00:00:00.000Z'
        }
      ],
      versions: [
        {
          id: 'ver_ref_1',
          policyId: 'pol_refund_opus',
          versionNumber: 1,
          status: 'ACTIVE',
          rulesSnapshot: [],
          changeReason: 'Adequação comercial Produtora Opus',
          createdBy: 'usr_superadmin',
          creatorName: 'Vinicius Casagrande',
          createdAt: '2026-01-01T00:00:00.000Z'
        }
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
  ]);

  const [conflicts, setConflicts] = useState<PolicyConflictItem[]>([]);

  const [featureFlags, setFeatureFlags] = useState<FeatureFlagItem[]>([
    {
      id: 'ff_1',
      key: 'feature.new_reconciliation',
      name: 'Novo Motor de Conciliação Automática',
      description: 'Executa conciliação bancária contínua com IA',
      isEnabled: true,
      rolloutPercentage: 50,
      isKillSwitch: false,
      allowedProducers: ['prd_100'],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'ff_kill_1',
      key: 'killswitch.automatic_transfers',
      name: 'Interruptor de Emergência: Transferências Automáticas',
      description: 'Suspende de forma emergencial transferências bancárias em tempo real',
      isEnabled: false,
      rolloutPercentage: 0,
      isKillSwitch: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
  ]);

  const [auditLogs, setAuditLogs] = useState<ConfigAuditItem[]>([
    {
      id: 'cfg_adt_1',
      entityType: 'CONFIGURATION',
      entityId: 'cfg_val_glob_2',
      entityKey: 'finance.transfer.minimum_balance',
      action: 'UPDATE',
      scopeType: 'GLOBAL',
      previousValue: { value: 3000 },
      newValue: { value: 5000 },
      changeReason: 'Aumento da margem de garantia operacional',
      userId: 'usr_superadmin',
      userName: 'Vinicius Casagrande',
      createdAt: '2026-01-02T00:00:00.000Z'
    },
    {
      id: 'cfg_adt_2',
      entityType: 'POLICY',
      entityId: 'pol_fin_transfer',
      entityKey: 'POL-FIN-TRANSFER',
      action: 'ACTIVATE',
      scopeType: 'GLOBAL',
      changeReason: 'Ativação da política financeira unificada',
      userId: 'usr_superadmin',
      userName: 'Vinicius Casagrande',
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ]);

  // Selected policy for modal
  const [selectedPolicyModal, setSelectedPolicyModal] = useState<PolicyItem | null>(null);
  const [isNewPolicyModalOpen, setIsNewPolicyModalOpen] = useState(false);

  // Quick stats calculation
  const stats: ConfigurationSummaryStats = {
    totalDefinitions: parameters.length,
    activePolicies: policies.filter(p => p.status === 'ACTIVE').length,
    totalOverrides: parameters.filter(p => p.source === 'EVENT' || p.source === 'PRODUCER').length,
    detectedConflicts: conflicts.filter(c => c.status === 'DETECTED').length,
    activeKillSwitches: featureFlags.filter(f => f.isKillSwitch && f.isEnabled).length,
    featureFlagsCount: featureFlags.filter(f => !f.isKillSwitch).length,
    cacheHitRatio: 0.94
  };

  // Handlers
  const handleSetOverride = async (key: string, data: any) => {
    setParameters(prev =>
      prev.map(p => {
        if (p.key === key) {
          return {
            ...p,
            value: data.value,
            source: data.scopeType,
            explanation: `Override aplicado manualmente: ${data.changeReason}`
          };
        }
        return p;
      })
    );

    setAuditLogs(prev => [
      {
        id: `cfg_adt_${Date.now()}`,
        entityType: 'CONFIGURATION',
        entityId: key,
        entityKey: key,
        action: 'OVERRIDE',
        scopeType: data.scopeType,
        producerId: data.producerId,
        eventId: data.eventId,
        newValue: { value: data.value },
        changeReason: data.changeReason,
        userId: currentUser.id,
        userName: currentUser.name,
        createdAt: new Date().toISOString()
      },
      ...prev
    ]);
  };

  const handleRemoveOverride = async (key: string, data: any) => {
    setParameters(prev =>
      prev.map(p => {
        if (p.key === key) {
          return {
            ...p,
            source: 'DEFAULT',
            explanation: 'Sobreposição removida. Parâmetro restaurado para o padrão herdado.'
          };
        }
        return p;
      })
    );

    setAuditLogs(prev => [
      {
        id: `cfg_adt_${Date.now()}`,
        entityType: 'CONFIGURATION',
        entityId: key,
        entityKey: key,
        action: 'REMOVE_OVERRIDE',
        scopeType: data.scopeType,
        changeReason: data.changeReason,
        userId: currentUser.id,
        userName: currentUser.name,
        createdAt: new Date().toISOString()
      },
      ...prev
    ]);
  };

  const handleActivatePolicy = async (policyId: string) => {
    setPolicies(prev =>
      prev.map(p => {
        if (p.id === policyId) return { ...p, status: 'ACTIVE' };
        if (p.status === 'ACTIVE' && p.scopeType === 'GLOBAL') return { ...p, status: 'SUPERSEDED' };
        return p;
      })
    );
  };

  const handleRollbackPolicy = async (policyId: string, targetVersion: number, reason: string) => {
    setPolicies(prev =>
      prev.map(p => {
        if (p.id === policyId) {
          const newVerNum = (p.currentVersion || 1) + 1;
          const targetVer = p.versions?.find(v => v.versionNumber === targetVersion);
          return {
            ...p,
            currentVersion: newVerNum,
            rules: targetVer?.rulesSnapshot || p.rules,
            versions: [
              {
                id: `ver_${newVerNum}`,
                policyId: p.id,
                versionNumber: newVerNum,
                status: p.status,
                rulesSnapshot: targetVer?.rulesSnapshot || p.rules || [],
                changeReason: `Rollback para v${targetVersion}: ${reason}`,
                createdBy: currentUser.id,
                creatorName: currentUser.name,
                createdAt: new Date().toISOString()
              },
              ...(p.versions || [])
            ]
          };
        }
        return p;
      })
    );

    setAuditLogs(prev => [
      {
        id: `cfg_adt_${Date.now()}`,
        entityType: 'POLICY',
        entityId: policyId,
        entityKey: policies.find(x => x.id === policyId)?.code || policyId,
        action: 'ROLLBACK',
        scopeType: 'GLOBAL',
        newValue: { rolledBackTo: targetVersion },
        changeReason: reason,
        userId: currentUser.id,
        userName: currentUser.name,
        createdAt: new Date().toISOString()
      },
      ...prev
    ]);
  };

  const handleCompareVersions = async (policyId: string, v1: number, v2: number) => {
    const diffs: import('./configuration.types').VersionDiffItem[] = [
      {
        ruleId: 'r1',
        ruleName: 'Transferência Elevada (> R$ 50k)',
        changeType: 'MODIFIED',
        fieldDiffs: [{ field: 'priority', oldValue: 80, newValue: 95 }]
      }
    ];
    return {
      v1,
      v2,
      diffs
    };
  };

  const handleTriggerKillSwitch = async (key: string, reason: string) => {
    setFeatureFlags(prev =>
      prev.map(f => {
        if (f.key === key) {
          return {
            ...f,
            isEnabled: true,
            killSwitchReason: reason,
            killSwitchTriggeredAt: new Date().toISOString(),
            killSwitchTriggeredBy: currentUser.id
          };
        }
        return f;
      })
    );
  };

  const handleResetKillSwitch = async (key: string, _reason: string) => {
    setFeatureFlags(prev =>
      prev.map(f => {
        if (f.key === key) {
          return {
            ...f,
            isEnabled: false,
            killSwitchReason: undefined,
            killSwitchTriggeredAt: undefined,
            killSwitchTriggeredBy: undefined
          };
        }
        return f;
      })
    );
  };

  const handleSimulate = async (input: any) => {
    const isHigh = (input.input?.amount || 0) > 50000;
    return {
      decision: true,
      effectivePolicy: {
        id: 'pol_fin_transfer',
        code: 'POL-FIN-TRANSFER',
        name: 'Política Global de Transferências',
        version: 1,
        ruleName: isHigh ? 'Transferência Elevada (> R$ 50k)' : 'Transferência Padrão (<= R$ 50k)'
      },
      scope: 'GLOBAL' as any,
      requirements: {
        approvalsRequired: isHigh ? 2 : 1,
        stepUpRequired: isHigh,
        requiredDocuments: isHigh ? ['COMPROVANTE_FISCAL'] : []
      },
      explanation: isHigh
        ? 'Operação de valor elevado aprovada com exigência de dupla validação e 2FA.'
        : 'Operação comum autorizada pela política financeira padrão.',
      trace: [
        {
          level: 'EVENT' as any,
          targetName: input.eventId || 'Sem Evento',
          policyFound: false,
          notes: 'Nenhum override específico para este evento.'
        },
        {
          level: 'PRODUCER' as any,
          targetName: input.producerId || 'Sem Produtor',
          policyFound: false,
          notes: 'Nenhum override para este produtor. Prosseguindo para nível global.'
        },
        {
          level: 'GLOBAL' as any,
          targetName: 'DiskIngressos Padrão',
          policyFound: true,
          policyCode: 'POL-FIN-TRANSFER',
          ruleMatched: isHigh ? 'Transferência Elevada (> R$ 50k)' : 'Transferência Padrão (<= R$ 50k)',
          notes: 'Regra global disparada com sucesso.'
        }
      ]
    };
  };

  const handleCreatePolicy = async (data: any) => {
    const newPolId = `pol_${Date.now()}`;
    const newPol: PolicyItem = {
      id: newPolId,
      code: data.code,
      name: data.name,
      domain: data.domain,
      description: data.description,
      scopeType: data.scopeType,
      status: 'DRAFT',
      currentVersion: 1,
      priority: data.priority,
      requiresApproval: false,
      createdBy: currentUser.id,
      creatorName: currentUser.name,
      rules: (data.rules || []).map((r: any, idx: number) => ({
        ...r,
        id: r.id || `rule_${Date.now()}_${idx}`,
        policyId: newPolId,
        version: 1,
        createdAt: new Date().toISOString()
      })),
      versions: [
        {
          id: `ver_draft_1`,
          policyId: newPolId,
          versionNumber: 1,
          status: 'DRAFT',
          rulesSnapshot: [],
          changeReason: 'Criação inicial da política em rascunho',
          createdBy: currentUser.id,
          creatorName: currentUser.name,
          createdAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setPolicies(prev => [newPol, ...prev]);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950 text-slate-100 scrollbar-thin">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Motor Central de Regras, Configurações e Políticas
              </h1>
              <p className="text-xs text-slate-400">
                Governança hierárquica unificada: Global &gt; Produtor &gt; Evento com versionamento, simulação e rollback seguro
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('simulator')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            Simulador de Regras
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setIsNewPolicyModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-purple-600 hover:bg-purple-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nova Política
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">Parâmetros</span>
          <div className="text-xl font-bold text-white">{stats.totalDefinitions}</div>
          <span className="text-[10px] text-purple-400">{stats.totalOverrides} sobreposições</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">Políticas Ativas</span>
          <div className="text-xl font-bold text-emerald-400">{stats.activePolicies}</div>
          <span className="text-[10px] text-slate-500">em produção</span>
        </div>

        <div className={`p-4 rounded-xl border space-y-1 ${stats.detectedConflicts > 0 ? 'bg-amber-950/30 border-amber-500/40 text-amber-300' : 'bg-slate-900/80 border-slate-800'}`}>
          <span className="text-[11px] font-medium opacity-80">Conflitos</span>
          <div className={`text-xl font-bold ${stats.detectedConflicts > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
            {stats.detectedConflicts}
          </div>
          <span className="text-[10px] opacity-70">ambiguidades</span>
        </div>

        <div className={`p-4 rounded-xl border space-y-1 ${stats.activeKillSwitches > 0 ? 'bg-rose-950/40 border-rose-500/50' : 'bg-slate-900/80 border-slate-800'}`}>
          <span className="text-[11px] font-medium text-slate-400">Kill Switches</span>
          <div className={`text-xl font-bold ${stats.activeKillSwitches > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
            {stats.activeKillSwitches}
          </div>
          <span className="text-[10px] text-slate-500">armados</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">Feature Flags</span>
          <div className="text-xl font-bold text-indigo-400">{stats.featureFlagsCount}</div>
          <span className="text-[10px] text-slate-500">rollout gradativo</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">Taxa de Cache</span>
          <div className="text-xl font-bold text-cyan-400">{(stats.cacheHitRatio * 100).toFixed(0)}%</div>
          <span className="text-[10px] text-emerald-400">alta performance</span>
        </div>
      </div>

      {/* Emergency Active Kill Switch Banner */}
      {stats.activeKillSwitches > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500 text-rose-200 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertOctagon className="h-6 w-6 text-rose-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">ATENÇÃO: INTERRUPTOR DE EMERGÊNCIA ATIVADO</h4>
              <p className="text-xs text-rose-300">
                Um ou mais Kill Switches estão bloqueando operações críticas do sistema. Verifique a aba Feature Flags & Kill Switches.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('features')}
            className="px-3 py-1.5 text-xs font-bold rounded-md bg-rose-600 hover:bg-rose-500 text-white transition-colors shrink-0"
          >
            Acessar Painel
          </button>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab('parameters')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 ${
            activeTab === 'parameters'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          Parâmetros do Sistema
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 ${
            activeTab === 'policies'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileCheck className="h-3.5 w-3.5" />
          Políticas de Negócio
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 ${
            activeTab === 'simulator'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Simulador de Regras
        </button>

        <button
          onClick={() => setActiveTab('inheritance')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 ${
            activeTab === 'inheritance'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <GitFork className="h-3.5 w-3.5" />
          Árvore de Herança
        </button>

        <button
          onClick={() => setActiveTab('features')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 ${
            activeTab === 'features'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          Feature Flags & Kill Switches
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          Histórico & Auditoria
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'parameters' && (
        <ParametersView
          parameters={parameters}
          onSetOverride={handleSetOverride}
          onRemoveOverride={handleRemoveOverride}
          currentScope={currentScope}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {activeTab === 'policies' && (
        <PoliciesView
          policies={policies}
          onSelectPolicy={pol => setSelectedPolicyModal(pol)}
          onOpenNewPolicyModal={() => setIsNewPolicyModalOpen(true)}
          onActivatePolicy={handleActivatePolicy}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {activeTab === 'simulator' && (
        <PolicySimulatorView onSimulate={handleSimulate} />
      )}

      {activeTab === 'inheritance' && (
        <InheritanceTreeView
          parameters={parameters}
          onSelectNodeScope={scope => setCurrentScope(scope as any)}
          currentScope={currentScope as any}
        />
      )}

      {activeTab === 'features' && (
        <FeatureFlagsView
          featureFlags={featureFlags}
          onTriggerKillSwitch={handleTriggerKillSwitch}
          onResetKillSwitch={handleResetKillSwitch}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {activeTab === 'audit' && (
        <ConfigurationHistoryView auditLogs={auditLogs} />
      )}

      {/* Policy Details / Diff / Rollback Modal */}
      {selectedPolicyModal && (
        <PolicyDetailsModal
          policy={selectedPolicyModal}
          onClose={() => setSelectedPolicyModal(null)}
          onActivate={handleActivatePolicy}
          onSchedule={async () => {}}
          onRollback={handleRollbackPolicy}
          onCompareVersions={handleCompareVersions}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* New Policy Modal */}
      <NewPolicyModal
        isOpen={isNewPolicyModalOpen}
        onClose={() => setIsNewPolicyModalOpen(false)}
        onSubmit={handleCreatePolicy}
      />
    </div>
  );
};
