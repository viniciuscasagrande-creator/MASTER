import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Filter,
  Search,
  Check,
  XCircle,
  HelpCircle,
  Clock,
  Layers,
  RefreshCw
} from 'lucide-react';
import {
  DataQualityRule,
  DataQualityIssue,
  DataQualityStats,
  DataQualityDimension
} from '../data-management.types';

interface QualityTabProps {
  onTriggerScan: () => void;
}

export const QualityTab: React.FC<QualityTabProps> = ({ onTriggerScan }) => {
  const [rules, setRules] = useState<DataQualityRule[]>([]);
  const [issues, setIssues] = useState<DataQualityIssue[]>([]);
  const [stats, setStats] = useState<DataQualityStats | null>(null);
  const [activeDimension, setActiveDimension] = useState<string>('ALL');
  const [activeStatus, setActiveStatus] = useState<string>('OPEN');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchQualityData();
  }, []);

  const fetchQualityData = async () => {
    setIsLoading(true);
    try {
      const [rulesRes, issuesRes, statsRes] = await Promise.all([
        fetch('/api/data-quality/rules', { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } }),
        fetch('/api/data-quality/issues', { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } }),
        fetch('/api/data-quality/stats', { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } })
      ]);

      const [rData, iData, sData] = await Promise.all([
        rulesRes.json(),
        issuesRes.json(),
        statsRes.json()
      ]);

      if (rData.success) setRules(rData.items || []);
      if (iData.success) setIssues(iData.items || []);
      if (sData.success) setStats(sData.stats || null);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveIssue = async (id: string) => {
    try {
      const res = await fetch(`/api/data-quality/issues/${id}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const data = await res.json();
      if (data.success) {
        setIssues(prev => prev.map(i => i.id === id ? { ...i, status: 'RESOLVED', resolvedAt: new Date().toISOString() } : i));
      }
    } catch {
      // Ignore
    }
  };

  const handleDismissIssue = async (id: string) => {
    try {
      const res = await fetch(`/api/data-quality/issues/${id}/dismiss`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const data = await res.json();
      if (data.success) {
        setIssues(prev => prev.map(i => i.id === id ? { ...i, status: 'IGNORED' } : i));
      }
    } catch {
      // Ignore
    }
  };

  const filteredIssues = issues.filter((iss) => {
    const matchDim = activeDimension === 'ALL' || iss.dimension === activeDimension;
    const matchStatus = activeStatus === 'ALL' || iss.status === activeStatus;
    return matchDim && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header with Scan Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">Central de Qualidade de Dados & Governança</h3>
          <p className="text-xs text-slate-400">
            Monitoramento proativo nas 6 dimensões com geração automática de tarefas operacionais (TSK).
          </p>
        </div>
        <button
          type="button"
          onClick={onTriggerScan}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950/40"
        >
          <Zap className="h-4 w-4 text-yellow-300" />
          Disparar Varredura de Qualidade
        </button>
      </div>

      {/* 6 Dimensions Breakdown */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { key: 'COMPLETENESS' as DataQualityDimension, label: 'Completude', desc: 'Dados faltantes' },
          { key: 'VALIDITY' as DataQualityDimension, label: 'Validade', desc: 'Dígito Mod11 e formato' },
          { key: 'UNIQUENESS' as DataQualityDimension, label: 'Unicidade', desc: 'Duplicidades' },
          { key: 'CONSISTENCY' as DataQualityDimension, label: 'Consistência', desc: 'Regras de negócio' },
          { key: 'TIMELINESS' as DataQualityDimension, label: 'Tempestividade', desc: 'Anomalias de data' },
          { key: 'REFERENTIAL_INTEGRITY' as DataQualityDimension, label: 'Ref. Integridade', desc: 'Chaves estrangeiras' }
        ].map((dim) => {
          const count = stats?.issuesByDimension ? (stats.issuesByDimension[dim.key] || 0) : 0;
          const isSelected = activeDimension === dim.key;


          return (
            <div
              key={dim.key}
              onClick={() => setActiveDimension(isSelected ? 'ALL' : dim.key)}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-bold text-white">{dim.label}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">{dim.desc}</p>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs font-mono font-bold text-emerald-400">{count} falhas</span>
                {count === 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Issues Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-yellow-400" />
            <h4 className="font-bold text-white text-xs uppercase font-mono tracking-wider">
              Não Conformidades Auditadas ({filteredIssues.length})
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={activeStatus}
              onChange={(e) => setActiveStatus(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">Todos os Status</option>
              <option value="OPEN">Abertos</option>
              <option value="RESOLVED">Resolvidos</option>
              <option value="IGNORED">Ignorados</option>
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono uppercase">
              <tr>
                <th className="p-3">Dimensão</th>
                <th className="p-3">Regra</th>
                <th className="p-3">Entidade / ID</th>
                <th className="p-3">Severidade</th>
                <th className="p-3">Ação Sugerida</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredIssues.length > 0 ? (
                filteredIssues.map((iss) => (
                  <tr key={iss.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-semibold text-emerald-400">{iss.dimension}</td>
                    <td className="p-3 font-medium text-white">{iss.ruleCode}</td>
                    <td className="p-3 font-mono text-slate-400">
                      {iss.entity}: <span className="text-slate-200">{iss.entityId}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          iss.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400'
                            : iss.severity === 'ERROR'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {iss.severity}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 max-w-xs">{iss.suggestedAction}</td>
                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          iss.status === 'RESOLVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : iss.status === 'IGNORED'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}
                      >
                        {iss.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {iss.status === 'OPEN' && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleResolveIssue(iss.id)}
                            title="Resolver Não Conformidade"
                            className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20"
                          >
                            Resolver
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismissIssue(iss.id)}
                            title="Ignorar"
                            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-700"
                          >
                            Ignorar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhuma não conformidade de qualidade encontrada para o filtro selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
