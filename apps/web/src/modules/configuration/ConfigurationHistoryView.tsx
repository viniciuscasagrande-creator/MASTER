import React, { useState } from 'react';
import { ConfigAuditItem } from './configuration.types';
import {
  History,
  Search,
  Filter,
  User,
  Clock,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertOctagon,
  RotateCcw,
  Sliders,
  Layers
} from 'lucide-react';

interface ConfigurationHistoryViewProps {
  auditLogs: ConfigAuditItem[];
}

export const ConfigurationHistoryView: React.FC<ConfigurationHistoryViewProps> = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const actions = [
    'ALL',
    'CREATE',
    'UPDATE',
    'OVERRIDE',
    'REMOVE_OVERRIDE',
    'ACTIVATE',
    'SCHEDULE',
    'ROLLBACK',
    'KILL_SWITCH_TRIGGER',
    'KILL_SWITCH_RESET'
  ];

  const filteredLogs = auditLogs.filter(log => {
    const identifier = log.entityKey || log.entityId || '';
    const operator = log.userName || log.userId || '';
    const matchesSearch =
      identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.changeReason && log.changeReason.toLowerCase().includes(searchTerm.toLowerCase())) ||
      operator.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'OVERRIDE':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">OVERRIDE</span>;
      case 'REMOVE_OVERRIDE':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-400 border border-slate-700">RESTAURADO</span>;
      case 'ACTIVATE':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ATIVADO</span>;
      case 'ROLLBACK':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">ROLLBACK</span>;
      case 'KILL_SWITCH_TRIGGER':
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-600 text-white animate-pulse">KILL SWITCH ATIVADO</span>;
      case 'KILL_SWITCH_RESET':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-600 text-white">KILL SWITCH DESARMADO</span>;
      case 'CREATE':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">CRIADO</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300">{action}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar histórico por chave, operador ou justificativa..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-md pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={selectedAction}
          onChange={e => setSelectedAction(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
        >
          {actions.map(a => (
            <option key={a} value={a}>
              Ação: {a === 'ALL' ? 'Todas as Ações' : a}
            </option>
          ))}
        </select>
      </div>

      {/* Logs Table / List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/30 rounded-lg border border-slate-800">
            <History className="h-8 w-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm text-slate-400">Nenhum registro de auditoria encontrado.</p>
          </div>
        ) : (
          filteredLogs.map(log => {
            const isExpanded = expandedLogId === log.id;
            const identifier = log.entityKey || log.entityId;
            const operator = log.userName || log.userId;

            return (
              <div
                key={log.id}
                className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-sm"
              >
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/90 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(log.action)}
                      <span className="font-mono text-xs font-bold text-slate-200">{identifier}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase">
                        {log.scopeType}
                      </span>
                    </div>

                    {log.changeReason && (
                      <p className="text-xs text-slate-300">
                        <strong>Motivo:</strong> {log.changeReason}
                      </p>
                    )}

                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {operator}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-purple-400">
                    <span>{isExpanded ? 'Recolher Diff' : 'Ver Detalhes'}</span>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </div>

                {/* Expanded Diff Viewer */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-3 animate-in fade-in duration-150">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Snapshot de Alteração (Antes vs Depois)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1">
                        <div className="text-rose-400 font-bold">Valor Anterior</div>
                        <pre className="text-slate-300 text-[11px] whitespace-pre-wrap overflow-x-auto">
                          {log.previousValue !== undefined ? JSON.stringify(typeof log.previousValue === 'string' ? JSON.parse(log.previousValue) : log.previousValue, null, 2) : 'null'}
                        </pre>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1">
                        <div className="text-emerald-400 font-bold">Novo Valor</div>
                        <pre className="text-slate-300 text-[11px] whitespace-pre-wrap overflow-x-auto">
                          {log.newValue !== undefined ? JSON.stringify(typeof log.newValue === 'string' ? JSON.parse(log.newValue) : log.newValue, null, 2) : 'null'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
