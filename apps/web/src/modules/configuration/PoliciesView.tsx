import React, { useState } from 'react';
import { PolicyItem, PolicyStatus } from './configuration.types';
import {
  ShieldAlert,
  Search,
  Plus,
  Play,
  Calendar,
  Layers,
  Sparkles,
  GitCommit,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Sliders,
  Eye,
  FileCheck
} from 'lucide-react';

interface PoliciesViewProps {
  policies: PolicyItem[];
  onSelectPolicy: (policy: PolicyItem) => void;
  onOpenNewPolicyModal: () => void;
  onActivatePolicy: (policyId: string) => Promise<void>;
  isSuperAdmin: boolean;
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({
  policies,
  onSelectPolicy,
  onOpenNewPolicyModal,
  onActivatePolicy,
  isSuperAdmin
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');

  const domains = ['ALL', 'FINANCE', 'REFUNDS', 'SAC', 'SECURITY', 'TASKS', 'DOCUMENTS'];
  const statuses = ['ALL', 'ACTIVE', 'DRAFT', 'SCHEDULED', 'SUPERSEDED', 'ARCHIVED'];

  const filteredPolicies = policies.filter(p => {
    const matchesSearch =
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    const matchesDomain = selectedDomain === 'ALL' || p.domain === selectedDomain;

    return matchesSearch && matchesStatus && matchesDomain;
  });

  const getStatusPill = (status: PolicyStatus | string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">ATIVO</span>;
      case 'DRAFT':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">RASCUNHO</span>;
      case 'SCHEDULED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">AGENDADO</span>;
      case 'SUPERSEDED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-700/50 text-slate-400 border border-slate-600">SUBSTITUÍDO</span>;
      case 'ARCHIVED':
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">ARQUIVADO</span>;
    }
  };

  const getScopeBadge = (scopeType: string) => {
    switch (scopeType) {
      case 'EVENT':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">Evento</span>;
      case 'PRODUCER':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">Produtor</span>;
      case 'GLOBAL':
      default:
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Global</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código (ex: POL-FIN), título ou descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-md pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            {statuses.map(s => (
              <option key={s} value={s}>
                Status: {s === 'ALL' ? 'Todos' : s}
              </option>
            ))}
          </select>

          {/* Domain filter */}
          <select
            value={selectedDomain}
            onChange={e => setSelectedDomain(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            {domains.map(d => (
              <option key={d} value={d}>
                Domínio: {d === 'ALL' ? 'Todos' : d}
              </option>
            ))}
          </select>

          {isSuperAdmin && (
            <button
              onClick={onOpenNewPolicyModal}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-purple-600 text-white hover:bg-purple-500 transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4" />
              Nova Política
            </button>
          )}
        </div>
      </div>

      {/* Policy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPolicies.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-slate-900/30 rounded-lg border border-slate-800">
            <FileCheck className="h-8 w-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm text-slate-400">Nenhuma política encontrada com os filtros atuais.</p>
          </div>
        ) : (
          filteredPolicies.map(pol => {
            const rulesCount = pol.rules?.length || 0;
            return (
              <div
                key={pol.id}
                className="p-5 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                        {pol.code}
                      </span>
                      {getScopeBadge(pol.scopeType)}
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {pol.domain}
                      </span>
                    </div>
                    {getStatusPill(pol.status)}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 hover:text-purple-300 transition-colors cursor-pointer" onClick={() => onSelectPolicy(pol)}>
                    {pol.name}
                  </h3>

                  {pol.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{pol.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Sliders className="h-3.5 w-3.5 text-purple-400" />
                      <strong>{rulesCount}</strong> {rulesCount === 1 ? 'regra' : 'regras'}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <GitCommit className="h-3.5 w-3.5 text-slate-500" />
                      v{pol.currentVersion}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Prioridade: <strong>{pol.priority}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {pol.status !== 'ACTIVE' && isSuperAdmin && (
                      <button
                        onClick={() => {
                          if (confirm(`Ativar imediatamente a política "${pol.name}"?`)) {
                            onActivatePolicy(pol.id);
                          }
                        }}
                        title="Ativar Política"
                        className="px-2 py-1 text-[11px] font-semibold rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 transition-colors"
                      >
                        Ativar
                      </button>
                    )}

                    <button
                      onClick={() => onSelectPolicy(pol)}
                      className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 text-slate-300 hover:bg-purple-600 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Detalhes
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
