import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Search,
  Plus,
  RefreshCw,
  User,
  Shield,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { ApprovalThresholdItem } from './approval.types';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { useDiskContext } from '../../core/context/DiskContext';
import { formatCurrency, formatDateTime } from '../../shared/utils/formatters';

export const ApprovalThresholdsAdminView: React.FC = () => {
  const { apiFetch, availableProducers } = useDiskContext();

  const [thresholds, setThresholds] = useState<ApprovalThresholdItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [newTargetType, setNewTargetType] = useState<'USER' | 'ROLE'>('ROLE');
  const [targetIdOrCode, setTargetIdOrCode] = useState('FINANCEIRO');
  const [operation, setOperation] = useState('FINANCE_TRANSFER');
  const [maxAmount, setMaxAmount] = useState<number | ''>(50000);
  const [producerId, setProducerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchThresholds = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/v1/admin/approval-thresholds');
      if (res.ok) {
        const json = await res.json();
        setThresholds(json.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar alçadas:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchThresholds();
  }, [fetchThresholds]);

  const handleCreateThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maxAmount) return;

    setIsSubmitting(true);
    setMsg(null);
    try {
      const data: any = {
        operation,
        maxApprovalAmount: maxAmount,
        producerId: producerId || null
      };
      if (newTargetType === 'USER') {
        data.userId = targetIdOrCode;
      } else {
        data.roleCode = targetIdOrCode;
      }

      const res = await apiFetch('/api/v1/admin/approval-thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        throw new Error('Falha ao salvar alçada.');
      }

      setMsg({ text: 'Alçada configurada com sucesso!', type: 'success' });
      await fetchThresholds();
    } catch (err: any) {
      setMsg({ text: err.message || 'Erro ao salvar alçada.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredThresholds = thresholds.filter(t => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchUser = t.userId?.toLowerCase().includes(term);
      const matchRole = t.roleCode?.toLowerCase().includes(term);
      const matchOp = t.operation.toLowerCase().includes(term);
      if (!matchUser && !matchRole && !matchOp) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Matriz de Alçadas de Aprovação</h1>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-800 text-gray-300 border border-gray-700">
              {thresholds.length} limites configurados
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Controle de valor máximo de autorização por perfil funcional ou por usuário nominal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchThresholds}
            isLoading={isLoading}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" /> Atualizar
          </Button>
        </div>
      </div>

      {/* Quick Configuration Form */}
      <div className="p-6 bg-[#1e222d] rounded-2xl border border-gray-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Plus className="h-4 w-4 text-orange-400" /> Definir Nova Alçada de Aprovação
        </h2>

        {msg && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              msg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleCreateThreshold} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Destinatário</label>
            <select
              value={newTargetType}
              onChange={e => setNewTargetType(e.target.value as any)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white"
            >
              <option value="ROLE">Perfil Funcional</option>
              <option value="USER">Usuário Específico</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Código do Perfil / ID Usuário</label>
            <input
              type="text"
              placeholder={newTargetType === 'ROLE' ? 'Ex: FINANCEIRO' : 'Ex: usr_fin_maria'}
              value={targetIdOrCode}
              onChange={e => setTargetIdOrCode(e.target.value)}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Operação</label>
            <select
              value={operation}
              onChange={e => setOperation(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white"
            >
              <option value="FINANCE_TRANSFER">Transferência Financeira</option>
              <option value="REFUND_REQUEST">Estorno de Ingresso</option>
              <option value="FINANCE_ADVANCE">Antecipação Financeira</option>
              <option value="FINANCE_PAYOUT">Repasse</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Limite Máximo (R$)</label>
            <input
              type="number"
              step="0.01"
              value={maxAmount}
              onChange={e => setMaxAmount(e.target.value ? parseFloat(e.target.value) : '')}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              Salvar Alçada
            </Button>
          </div>
        </form>
      </div>

      {/* Thresholds Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Alçadas Vigentes</h2>
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por usuário, perfil ou operação..."
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
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Identificador</th>
                  <th className="p-4">Operação</th>
                  <th className="p-4">Limite Máximo de Aprovação</th>
                  <th className="p-4">Escopo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-300">
                {filteredThresholds.map(thresh => {
                  const isUser = !!thresh.userId;

                  return (
                    <tr key={thresh.id} className="hover:bg-gray-800/40 transition">
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isUser
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          }`}
                        >
                          {isUser ? 'USUÁRIO' : 'PERFIL'}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-white font-mono">
                        {thresh.userId || thresh.roleCode}
                      </td>
                      <td className="p-4 font-mono text-orange-400">{thresh.operation}</td>
                      <td className="p-4 font-mono font-bold text-emerald-400 text-sm">
                        {formatCurrency(thresh.maxApprovalAmount)}
                      </td>
                      <td className="p-4 text-gray-400">
                        {thresh.producerId ? `Produtor ${thresh.producerId}` : 'Universal / Global'}
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
