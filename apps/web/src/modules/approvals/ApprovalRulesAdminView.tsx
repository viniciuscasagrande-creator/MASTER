import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  Clock,
  Lock,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { ApprovalRuleItem } from './approval.types';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { useDiskContext } from '../../core/context/DiskContext';
import { formatCurrency } from '../../shared/utils/formatters';

export const ApprovalRulesAdminView: React.FC = () => {
  const { apiFetch, availableProducers, availableEvents } = useDiskContext();

  const [rules, setRules] = useState<ApprovalRuleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Simulator State
  const [simOp, setSimOp] = useState('FINANCE_TRANSFER');
  const [simAmount, setSimAmount] = useState<number | ''>(25000);
  const [simProducerId, setSimProducerId] = useState('');
  const [simEventId, setSimEventId] = useState('');
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/v1/admin/approval-rules');
      if (res.ok) {
        const json = await res.json();
        setRules(json.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar regras de aprovação:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await apiFetch('/api/v1/admin/approval-rules/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: simOp,
          amount: typeof simAmount === 'number' ? simAmount : null,
          producerId: simProducerId || null,
          eventId: simEventId || null
        })
      });
      if (res.ok) {
        const json = await res.json();
        setSimResult(json.data);
      }
    } catch (err) {
      console.error('Erro ao simular regra:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredRules = rules.filter(r => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchCode = r.code.toLowerCase().includes(term);
      const matchName = r.name.toLowerCase().includes(term);
      const matchOp = r.operation.toLowerCase().includes(term);
      if (!matchCode && !matchName && !matchOp) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Regras de Aprovação & Governança</h1>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-800 text-gray-300 border border-gray-700">
              {rules.length} regras ativas
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Motor de regras multinível (Evento &gt; Produtor &gt; Global) com definição de passos, prazos SLA e Step-Up 2FA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchRules}
            isLoading={isLoading}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" /> Atualizar
          </Button>
        </div>
      </div>

      {/* Interactive Simulator Card */}
      <div className="p-6 bg-gradient-to-br from-[#1e222d] to-gray-900/80 rounded-2xl border border-purple-500/30 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Simulador Dinâmico de Regras de Aprovação</h2>
          </div>
          <span className="text-xs text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
            Hierarquia: Evento → Produtor → Global
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Informe os parâmetros da operação prospectiva para testar qual regra será resolvida e quais exigências serão acionadas.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Operação</label>
            <select
              value={simOp}
              onChange={e => setSimOp(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white"
            >
              <option value="FINANCE_TRANSFER">Transferência Financeira</option>
              <option value="REFUND_REQUEST">Estorno de Ingresso</option>
              <option value="FINANCE_ADVANCE">Antecipação Financeira</option>
              <option value="FINANCE_PAYOUT">Repasse de Bilheteria</option>
              <option value="ADMIN_PERMISSION_CHANGE">Permissões Críticas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={simAmount}
              onChange={e => setSimAmount(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Produtor</label>
            <select
              value={simProducerId}
              onChange={e => setSimProducerId(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white"
            >
              <option value="">(Global / Nenhum)</option>
              {availableProducers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Evento</label>
            <select
              value={simEventId}
              onChange={e => setSimEventId(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white"
            >
              <option value="">(Todos os Eventos)</option>
              {availableEvents.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title || ev.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            variant="primary"
            onClick={handleSimulate}
            isLoading={isSimulating}
            className="bg-purple-600 hover:bg-purple-500 text-white"
          >
            <Sparkles className="h-4 w-4 mr-1.5" /> Executar Simulação
          </Button>
        </div>

        {simResult && (
          <div className="p-4 bg-gray-950/80 rounded-xl border border-purple-500/30 text-xs space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-300 text-sm">
                Resultado da Simulação: {simResult.matchedRule ? simResult.matchedRule.name : 'Governança Padrão'}
              </span>
              {simResult.matchedRule && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Escopo: {simResult.matchedRule.scopeLevel}
                </span>
              )}
            </div>
            <p className="text-gray-300">{simResult.summary}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-gray-400">
              <div>Aprovações: <strong className="text-white">{simResult.stepsRequired}</strong></div>
              <div>Modo: <strong className="text-white">{simResult.isSequential ? 'Sequencial' : 'Paralelo'}</strong></div>
              <div>Perfis: <strong className="text-white">{simResult.eligibleRoles?.join(', ')}</strong></div>
              <div>Step-Up 2FA: <strong className={simResult.requireStepUp ? 'text-amber-400' : 'text-gray-400'}>{simResult.requireStepUp ? 'Sim' : 'Não'}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Rules Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Catálogo Geral de Regras Ativas</h2>
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar regras por código ou nome..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="bg-[#1e222d] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/60 text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-800">
                <tr>
                  <th className="p-4">Código / Nome</th>
                  <th className="p-4">Operação</th>
                  <th className="p-4">Nível de Escopo</th>
                  <th className="p-4">Faixa de Valor</th>
                  <th className="p-4">Aprovações</th>
                  <th className="p-4">Step-Up</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-300">
                {filteredRules.map(rule => {
                  const scope = rule.eventId ? 'EVENTO' : rule.producerId ? 'PRODUTOR' : 'GLOBAL';
                  const minStr = rule.minAmount !== null && rule.minAmount !== undefined ? formatCurrency(rule.minAmount) : 'R$ 0';
                  const maxStr = rule.maxAmount !== null && rule.maxAmount !== undefined ? formatCurrency(rule.maxAmount) : 'Sem teto';

                  return (
                    <tr key={rule.id} className="hover:bg-gray-800/40 transition">
                      <td className="p-4">
                        <div className="font-bold text-white text-sm">{rule.name}</div>
                        <div className="font-mono text-[11px] text-gray-400">{rule.code}</div>
                      </td>
                      <td className="p-4 font-mono font-medium text-orange-400">{rule.operation}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            scope === 'EVENTO'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : scope === 'PRODUTOR'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-gray-700/30 text-gray-300 border-gray-700'
                          }`}
                        >
                          {scope}
                        </span>
                      </td>
                      <td className="p-4 font-mono">
                        {minStr} até {maxStr}
                      </td>
                      <td className="p-4 font-semibold text-white">
                        {rule.approvalsRequired} {rule.isSequential ? '(Seq)' : '(Par)'}
                      </td>
                      <td className="p-4">
                        {rule.requireStepUp ? (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Sim
                          </span>
                        ) : (
                          <span className="text-gray-500">Não</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant={rule.isActive ? 'success' : 'neutral'}>
                          {rule.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
