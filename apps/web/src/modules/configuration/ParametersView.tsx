import React, { useState } from 'react';
import {
  ConfigurationDefinitionItem,
  EffectiveConfigResult,
  ConfigSensitivity,
  ConfigScopeType
} from './configuration.types';
import {
  Search,
  Filter,
  Sliders,
  Shield,
  Lock,
  Layers,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';

interface ParametersViewProps {
  parameters: EffectiveConfigResult[];
  onSetOverride: (key: string, data: { scopeType: ConfigScopeType; producerId?: string; eventId?: string; value: any; changeReason: string }) => Promise<void>;
  onRemoveOverride: (key: string, data: { scopeType: ConfigScopeType; producerId?: string; eventId?: string; changeReason?: string }) => Promise<void>;
  currentScope: { type: ConfigScopeType; producerId?: string; eventId?: string; name: string };
  isSuperAdmin: boolean;
}

export const ParametersView: React.FC<ParametersViewProps> = ({
  parameters,
  onSetOverride,
  onRemoveOverride,
  currentScope,
  isSuperAdmin
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedParam, setSelectedParam] = useState<EffectiveConfigResult | null>(null);
  const [overrideValue, setOverrideValue] = useState<any>('');
  const [changeReason, setChangeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Available domains
  const domains = ['ALL', 'FINANCE', 'REFUNDS', 'SAC', 'SECURITY', 'TASKS', 'DOCUMENTS', 'INTEGRATIONS'];

  const filteredParams = parameters.filter(param => {
    const matchesSearch =
      param.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (param.explanation && param.explanation.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (selectedDomain === 'ALL') return matchesSearch;
    return matchesSearch && param.key.toUpperCase().startsWith(selectedDomain);
  });

  const handleOpenOverrideModal = (param: EffectiveConfigResult) => {
    setSelectedParam(param);
    setOverrideValue(param.value !== null && param.value !== undefined ? String(param.value) : '');
    setChangeReason('');
    setModalOpen(true);
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParam || !changeReason.trim()) return;

    setIsSubmitting(true);
    try {
      let parsedVal: any = overrideValue;
      if (selectedParam.type === 'BOOLEAN') {
        parsedVal = overrideValue === 'true' || overrideValue === true;
      } else if (selectedParam.type === 'INTEGER') {
        parsedVal = parseInt(overrideValue, 10);
      } else if (['DECIMAL', 'CURRENCY', 'PERCENTAGE', 'DURATION'].includes(selectedParam.type)) {
        parsedVal = parseFloat(overrideValue);
      }

      await onSetOverride(selectedParam.key, {
        scopeType: currentScope.type,
        producerId: currentScope.producerId,
        eventId: currentScope.eventId,
        value: parsedVal,
        changeReason: changeReason.trim()
      });

      setModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar override de configuração');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'EVENT':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">Evento (Override)</span>;
      case 'PRODUCER':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">Produtor (Override)</span>;
      case 'GLOBAL':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Global DiskIngressos</span>;
      case 'DEFAULT':
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-700/50 text-slate-300 border border-slate-600">Padrão do Sistema</span>;
    }
  };

  const renderValueDisplay = (param: EffectiveConfigResult) => {
    if (param.type === 'BOOLEAN') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${param.value ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}`}>
          {param.value ? 'Habilitado (true)' : 'Desabilitado (false)'}
        </span>
      );
    }
    if (param.type === 'CURRENCY') {
      return (
        <span className="text-sm font-mono font-bold text-amber-300">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: param.unit || 'BRL' }).format(param.value || 0)}
        </span>
      );
    }
    if (param.type === 'PERCENTAGE') {
      return <span className="text-sm font-mono font-bold text-cyan-300">{param.value}%</span>;
    }
    if (param.type === 'DURATION') {
      return (
        <span className="text-sm font-mono text-indigo-300">
          {param.value} {param.unit?.toLowerCase() || 'minutos'}
        </span>
      );
    }
    return <span className="text-sm font-mono text-slate-200">{String(param.value ?? '-')}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Search and Domain Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar parâmetros por chave ou descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-md pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Domain Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          {domains.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDomain(d)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedDomain === d
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {d === 'ALL' ? 'Todos os Domínios' : d}
            </button>
          ))}
        </div>
      </div>

      {/* Scope Banner Info */}
      <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/80 px-4 py-2.5 rounded-lg text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-purple-400" />
          <span>
            Contexto de Resolução Atual: <strong className="text-slate-200">{currentScope.name}</strong> ({currentScope.type})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-slate-500" />
          <span>Ordem de precedência: Evento &gt; Produtor &gt; Global &gt; Padrão</span>
        </div>
      </div>

      {/* Parameters Cards / List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredParams.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/30 rounded-lg border border-slate-800">
            <Sliders className="h-8 w-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm text-slate-400">Nenhum parâmetro encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          filteredParams.map(param => {
            const isDirectOverride = param.source === currentScope.type;
            return (
              <div
                key={param.key}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-lg bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all shadow-sm"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-purple-300">{param.key}</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {param.type}
                    </span>
                    {getSourceBadge(param.source)}
                  </div>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    {param.explanation || 'Resolução calculada com sucesso pela árvore de herança.'}
                  </p>

                  {param.policyVersion && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>Versão: v{param.policyVersion}</span>
                      {param.effectiveFrom && <span>Início: {new Date(param.effectiveFrom).toLocaleDateString('pt-BR')}</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-0.5">Valor Efetivo</div>
                    {renderValueDisplay(param)}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenOverrideModal(param)}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 transition-colors flex items-center gap-1.5"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      {isDirectOverride ? 'Editar Override' : 'Sobrescrever'}
                    </button>

                    {isDirectOverride && (
                      <button
                        onClick={() => {
                          if (confirm(`Deseja remover a sobreposição para "${param.key}" e restaurar o valor herdado?`)) {
                            onRemoveOverride(param.key, {
                              scopeType: currentScope.type,
                              producerId: currentScope.producerId,
                              eventId: currentScope.eventId,
                              changeReason: 'Restauração de valor herdado padrão'
                            });
                          }
                        }}
                        title="Remover sobreposição e restaurar valor herdado"
                        className="p-1.5 text-xs rounded-md bg-slate-800 text-rose-400 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Override Modal */}
      {modalOpen && selectedParam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Definir Override de Parâmetro
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveOverride} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Chave do Parâmetro</label>
                <input
                  type="text"
                  disabled
                  value={selectedParam.key}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs font-mono text-purple-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Escopo do Override</label>
                  <input
                    type="text"
                    disabled
                    value={`${currentScope.name} (${currentScope.type})`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Dado</label>
                  <input
                    type="text"
                    disabled
                    value={selectedParam.type}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs font-mono text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Novo Valor {selectedParam.unit ? `(${selectedParam.unit})` : ''} *
                </label>
                {selectedParam.type === 'BOOLEAN' ? (
                  <select
                    value={String(overrideValue)}
                    onChange={e => setOverrideValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="true">Habilitado (true)</option>
                    <option value="false">Desabilitado (false)</option>
                  </select>
                ) : (
                  <input
                    type={['INTEGER', 'DECIMAL', 'CURRENCY', 'PERCENTAGE', 'DURATION'].includes(selectedParam.type) ? 'number' : 'text'}
                    step={selectedParam.type === 'INTEGER' ? '1' : '0.01'}
                    value={overrideValue}
                    onChange={e => setOverrideValue(e.target.value)}
                    required
                    placeholder="Digite o novo valor..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Justificativa da Alteração (Obrigatório para Auditoria) *
                </label>
                <textarea
                  rows={3}
                  value={changeReason}
                  onChange={e => setChangeReason(e.target.value)}
                  required
                  placeholder="Explique o motivo do ajuste ou demanda operacional..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  Alterações em parâmetros sensíveis geram automaticamente uma solicitação no <strong>Motor de Aprovações</strong> e só entram em vigor após validação de gestores autorizados.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !changeReason.trim()}
                  className="px-4 py-2 text-xs font-medium rounded-md bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
