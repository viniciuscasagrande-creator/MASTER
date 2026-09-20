import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Users,
  Percent,
  Clock,
  Trash2,
  Edit2,
  Sparkles,
  Search,
  Filter,
  Info,
  Layers,
  FileCheck
} from 'lucide-react';
import {
  SalesRuleDTO,
  SalesRuleType,
  SalesRuleScope,
  CreateSalesRuleInput,
  UpdateSalesRuleInput
} from '@shared/types/index';
import {
  fetchSalesRules,
  createSalesRule,
  updateSalesRule,
  deleteSalesRule
} from '../api/sales-rules.api';
import { Badge } from '../../../shared/components/Badge';

interface EventSalesRulesPageProps {
  eventId: string;
  eventName?: string;
  onBackToDashboard?: () => void;
  onNavigateToBatches?: () => void;
  onNavigateToPricing?: () => void;
}

const RULE_TYPE_METADATA: Record<SalesRuleType, { label: string; icon: any; color: 'emerald' | 'cyan' | 'purple' | 'amber' | 'orange' | 'slate'; desc: string }> = {
  MAX_PER_ORDER: {
    label: 'Limite por Pedido',
    icon: Users,
    color: 'emerald',
    desc: 'Quantidade máxima de ingressos permitida em uma única transação no checkout.'
  },
  MIN_PER_ORDER: {
    label: 'Mínimo por Pedido',
    icon: Users,
    color: 'cyan',
    desc: 'Quantidade mínima de ingressos exigida para concluir o pedido.'
  },
  MAX_PER_CUSTOMER: {
    label: 'Limite por CPF / Cliente',
    icon: ShieldAlert,
    color: 'cyan',
    desc: 'Quantidade máxima de ingressos que o mesmo CPF pode adquirir em todo o evento (anti-cambismo).'
  },
  HALF_PRICE_LIMIT: {
    label: 'Cota de Meia-Entrada (40%)',
    icon: Percent,
    color: 'purple',
    desc: 'Cota estatutária de 40% (Lei Federal nº 12.933/2013) sobre a capacidade vendável.'
  },
  SALES_WINDOW: {
    label: 'Janela de Vendas',
    icon: Clock,
    color: 'orange',
    desc: 'Venda liberada exclusivamente entre uma data/horário de abertura e encerramento.'
  },
  REQUIRES_DOCUMENT: {
    label: 'Exigência de Documento',
    icon: FileCheck,
    color: 'amber',
    desc: 'Exige comprovação documental vinculada ao ingresso no momento da compra ou check-in.'
  },
  REQUIRES_CODE: {
    label: 'Código Promocional / Acesso',
    icon: Layers,
    color: 'slate',
    desc: 'Permite compra restrita mediante validação de código de pré-venda ou convite.'
  }
};

export const EventSalesRulesPage: React.FC<EventSalesRulesPageProps> = ({
  eventId,
  eventName,
  onBackToDashboard,
  onNavigateToBatches,
  onNavigateToPricing
}) => {
  const [rules, setRules] = useState<SalesRuleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SalesRuleDTO | null>(null);
  const [formData, setFormData] = useState<{
    type: SalesRuleType;
    scope: SalesRuleScope;
    name: string;
    description: string;
    maxQuantity: number;
    percentage: number;
    active: boolean;
    errorMessage: string;
  }>({
    type: 'MAX_PER_ORDER',
    scope: 'EVENT',
    name: '',
    description: '',
    maxQuantity: 6,
    percentage: 40,
    active: true,
    errorMessage: 'Limite de compra atingido para esta modalidade.'
  });

  const loadRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSalesRules(eventId);
      setRules(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar regras de venda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, [eventId]);

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setFormData({
      type: 'MAX_PER_ORDER',
      scope: 'EVENT',
      name: 'Limite Máximo por Pedido',
      description: 'Restringe compras acumuladas no mesmo carrinho para evitar cambismo.',
      maxQuantity: 6,
      percentage: 40,
      active: true,
      errorMessage: 'Você atingiu a quantidade máxima permitida de ingressos para este pedido.'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: SalesRuleDTO) => {
    setEditingRule(rule);
    setFormData({
      type: rule.type,
      scope: rule.scope,
      name: rule.name,
      description: rule.description || '',
      maxQuantity: rule.ruleConfig?.maxQuantity || 6,
      percentage: rule.ruleConfig?.percentage || 40,
      active: rule.active,
      errorMessage: rule.ruleConfig?.errorMessage || 'Regra de venda violada.'
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (rule: SalesRuleDTO) => {
    try {
      await updateSalesRule(eventId, rule.id, { active: !rule.active });
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r));
      setSuccessMessage(`Regra "${rule.name}" ${!rule.active ? 'ativada' : 'desativada'} com sucesso.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Falha ao alterar status da regra.');
    }
  };

  const handleDeleteRule = async (rule: SalesRuleDTO) => {
    if (!window.confirm(`Tem certeza de que deseja excluir a regra "${rule.name}"?`)) return;

    try {
      await deleteSalesRule(eventId, rule.id);
      setRules(prev => prev.filter(r => r.id !== rule.id));
      setSuccessMessage('Regra de venda excluída com sucesso.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Falha ao excluir regra de venda.');
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const config: Record<string, any> = {
        errorMessage: formData.errorMessage
      };

      if (formData.type === 'MAX_PER_ORDER' || formData.type === 'MAX_PER_CUSTOMER' || formData.type === 'MIN_PER_ORDER') {
        config.maxQuantity = Number(formData.maxQuantity);
      } else if (formData.type === 'HALF_PRICE_LIMIT') {
        config.percentage = Number(formData.percentage);
        config.statutoryQuota = true;
      }

      if (editingRule) {
        const input: UpdateSalesRuleInput = {
          name: formData.name,
          description: formData.description,
          ruleConfig: config,
          active: formData.active
        };
        const updated = await updateSalesRule(eventId, editingRule.id, input);
        setRules(prev => prev.map(r => r.id === updated.id ? updated : r));
        setSuccessMessage('Regra atualizada com sucesso!');
      } else {
        const input: CreateSalesRuleInput = {
          type: formData.type,
          scope: formData.scope,
          name: formData.name,
          description: formData.description,
          ruleConfig: config,
          active: formData.active
        };
        const created = await createSalesRule(eventId, input);
        setRules(prev => [created, ...prev]);
        setSuccessMessage('Nova regra de venda criada com sucesso!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar regra de venda.');
    }
  };

  // Pre-seed default Brazilian rules helper
  const handleApplyBrazilianDefaults = async () => {
    try {
      setError(null);
      const defaultRules: CreateSalesRuleInput[] = [
        {
          type: 'HALF_PRICE_LIMIT',
          scope: 'EVENT',
          name: 'Cota Legal de Meia-Entrada (Lei Federal 12.933/2013)',
          description: 'Garante que os ingressos de meia-entrada correspondam no máximo a 40% da capacidade comercializada.',
          ruleConfig: { percentage: 40, statutoryQuota: true, errorMessage: 'A cota legal de 40% de ingressos de meia-entrada para este setor foi esgotada.' },
          active: true
        },
        {
          type: 'MAX_PER_CUSTOMER',
          scope: 'EVENT',
          name: 'Trava Anti-Cambismo por CPF',
          description: 'Impede aquisição de mais de 6 ingressos por CPF no evento para garantir equidade de acesso.',
          ruleConfig: { maxQuantity: 6, errorMessage: 'Limite de 6 ingressos por CPF atingido para este evento.' },
          active: true
        },
        {
          type: 'MAX_PER_ORDER',
          scope: 'EVENT',
          name: 'Limite Máximo por Pedido',
          description: 'Máximo de 4 ingressos por checkout no site ou app.',
          ruleConfig: { maxQuantity: 4, errorMessage: 'Você pode selecionar no máximo 4 ingressos por transação.' },
          active: true
        }
      ];

      for (const r of defaultRules) {
        if (!rules.some(existing => existing.type === r.type)) {
          await createSalesRule(eventId, r);
        }
      }
      await loadRules();
      setSuccessMessage('Conjunto padrão de regras brasileiras aplicado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Erro ao aplicar regras padrão.');
    }
  };

  const filteredRules = rules.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const activeCount = rules.filter(r => r.active).length;
  const halfPriceRule = rules.find(r => r.type === 'HALF_PRICE_LIMIT');
  const maxCpfRule = rules.find(r => r.type === 'MAX_PER_CUSTOMER');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Voltar ao Painel"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-400" />
              Regras Comerciais & Restrições de Venda
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            {eventName ? `${eventName} — ` : ''}Controle de limites por pedido e CPF, trava de cota estatutária de meia-entrada (40%) e políticas de venda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToBatches && (
            <button
              onClick={onNavigateToBatches}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Lotes Comerciais
            </button>
          )}

          {rules.length === 0 && (
            <button
              onClick={handleApplyBrazilianDefaults}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold transition-colors"
            >
              <Sparkles className="h-4 w-4 text-purple-400" />
              Aplicar Padrão Nacional (Lei 12.933 + Anti-Cambismo)
            </button>
          )}

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            Nova Regra
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">REGRAS ATIVAS</span>
            <ShieldAlert className="h-4 w-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1.5">
            {activeCount} <span className="text-xs text-slate-500 font-normal">/ {rules.length} total</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Garantindo compliance e segurança</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">COTA DE MEIA-ENTRADA</span>
            <Percent className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 mt-1.5">
            {halfPriceRule && halfPriceRule.active
              ? `${halfPriceRule.ruleConfig?.percentage || 40}%`
              : 'Não configurada'}
          </div>
          <p className="text-[11px] text-purple-400/80 mt-1">
            {halfPriceRule && halfPriceRule.active ? 'Em conformidade com Lei Federal 12.933' : 'Risco de não conformidade legal'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">LIMITE POR CPF</span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 mt-1.5">
            {maxCpfRule && maxCpfRule.active
              ? `${maxCpfRule.ruleConfig?.maxQuantity} un.`
              : 'Sem limite'}
          </div>
          <p className="text-[11px] text-cyan-400/80 mt-1">
            {maxCpfRule && maxCpfRule.active ? 'Proteção anti-cambismo ativa' : 'Vendas ilimitadas por comprador'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">MOTOR DE CONFERÊNCIA</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-1.5">
            Automático
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Validado no hold temporário e na emissão
          </p>
        </div>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3">
        <Info className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-300 leading-relaxed">
          As regras de venda são avaliadas pelo motor de bilheteria em tempo de reserva temporária (<code className="text-orange-300">holdInventory</code>). Compradores que violarem os limites configurados recebem imediatamente a mensagem de erro parametrizada, sem consumo indevido de inventário físico.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou descrição da regra..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="MAX_PER_ORDER">Limite por Pedido</option>
            <option value="MAX_PER_CUSTOMER">Limite por CPF</option>
            <option value="HALF_PRICE_LIMIT">Cota de Meia-Entrada</option>
            <option value="SALES_WINDOW">Janela Temporal</option>
            <option value="REQUIRES_DOCUMENT">Exigência de Documento</option>
          </select>
        </div>
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Carregando regras de venda do evento...
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/30 p-8 space-y-3">
          <ShieldAlert className="h-10 w-10 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-300">Nenhuma regra de venda cadastrada</div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Defina regras de limitação por CPF ou aplique as travas recomendadas pela legislação brasileira (40% de meia-entrada e limites anti-cambismo).
          </p>
          <button
            onClick={handleApplyBrazilianDefaults}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md transition-all"
          >
            Aplicar Regras Padrão Brasileiras
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRules.map((rule) => {
            const meta = RULE_TYPE_METADATA[rule.type] || {
              label: rule.type,
              icon: ShieldAlert,
              color: 'slate' as const,
              desc: ''
            };
            const IconComponent = meta.icon;

            return (
              <div
                key={rule.id}
                className={`p-4 rounded-xl border transition-all ${
                  rule.active
                    ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    : 'border-slate-800/50 bg-slate-950/40 opacity-60'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-orange-400 shrink-0 mt-0.5">
                      <IconComponent className="h-4 w-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">{rule.name}</span>
                        <Badge variant={meta.color} size="sm">
                          {meta.label}
                        </Badge>
                        <Badge variant={rule.active ? 'emerald' : 'slate'} size="sm">
                          {rule.active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>

                      {rule.description && (
                        <p className="text-xs text-slate-400">{rule.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                        <span>
                          <strong className="text-slate-300">Parâmetro:</strong>{' '}
                          {rule.type === 'HALF_PRICE_LIMIT' && `${rule.ruleConfig?.percentage || 40}% da capacidade`}
                          {(rule.type === 'MAX_PER_ORDER' || rule.type === 'MAX_PER_CUSTOMER' || rule.type === 'MIN_PER_ORDER') &&
                            `Máximo de ${rule.ruleConfig?.maxQuantity} ingressos`}
                        </span>

                        <span>
                          <strong className="text-slate-300">Escopo:</strong> {rule.scope}
                        </span>

                        {rule.ruleConfig?.errorMessage && (
                          <span className="italic text-slate-400">
                            " {rule.ruleConfig.errorMessage} "
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleToggleActive(rule)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        rule.active
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {rule.active ? 'Desativar' : 'Ativar'}
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(rule)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Editar Regra"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteRule(rule)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-colors"
                      title="Excluir Regra"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nova / Editar Regra */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-orange-400" />
                {editingRule ? 'Editar Regra de Venda' : 'Nova Regra de Venda'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo de Regra
                </label>
                <select
                  value={formData.type}
                  disabled={!!editingRule}
                  onChange={(e) => {
                    const nextType = e.target.value as SalesRuleType;
                    setFormData(prev => ({
                      ...prev,
                      type: nextType,
                      name: nextType === 'HALF_PRICE_LIMIT'
                        ? 'Cota Legal de Meia-Entrada (40%)'
                        : nextType === 'MAX_PER_CUSTOMER'
                        ? 'Limite Máximo por CPF'
                        : nextType === 'MIN_PER_ORDER'
                        ? 'Mínimo por Pedido'
                        : 'Limite por Pedido'
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 disabled:opacity-60"
                >
                  <option value="MAX_PER_ORDER">Limite por Pedido (Checkout)</option>
                  <option value="MAX_PER_CUSTOMER">Limite por CPF / Cliente</option>
                  <option value="HALF_PRICE_LIMIT">Cota Legal de Meia-Entrada (40%)</option>
                  <option value="MIN_PER_ORDER">Mínimo por Pedido</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {RULE_TYPE_METADATA[formData.type]?.desc}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Regra
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Cota Legal de Meia-Entrada"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição Explicativa
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Justificativa ou detalhamento operacional da regra..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Parâmetros Específicos */}
              {(formData.type === 'MAX_PER_ORDER' || formData.type === 'MAX_PER_CUSTOMER' || formData.type === 'MIN_PER_ORDER') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Quantidade Permitida (unidades)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={formData.maxQuantity}
                    onChange={(e) => setFormData({ ...formData, maxQuantity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              {formData.type === 'HALF_PRICE_LIMIT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Percentual Máximo de Meia-Entrada (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={formData.percentage}
                    onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-[10px] text-purple-400 mt-1 block">
                    Por lei federal, o padrão nacional obrigatório é 40%.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mensagem de Erro Apresentada ao Cliente
                </label>
                <input
                  type="text"
                  required
                  value={formData.errorMessage}
                  onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
                  placeholder="Ex: A cota legal de ingressos de meia-entrada foi atingida."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-slate-300">Regra Ativa Imediatamente</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition-all"
                >
                  {editingRule ? 'Salvar Alterações' : 'Criar Regra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventSalesRulesPage;
