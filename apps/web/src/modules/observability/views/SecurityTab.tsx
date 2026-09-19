import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  UserX,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Hash,
  Eye,
  KeyRound,
  FileText
} from 'lucide-react';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { SecurityEventItem } from '../observability.types';
import { formatDateTime } from '../../../shared/utils/formatters';

interface SecurityTabProps {
  events: SecurityEventItem[];
  onNavigateToAudit?: (userId: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  events,
  onNavigateToAudit,
  onRefresh,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="rose" dot>Crítico</Badge>;
      case 'HIGH':
        return <Badge variant="orange" dot>Alto</Badge>;
      case 'MEDIUM':
        return <Badge variant="amber" dot>Médio</Badge>;
      default:
        return <Badge variant="slate">Informativo</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'LOGIN_FAILURE':
        return <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-xs text-rose-400 font-semibold border border-rose-500/20"><Lock className="h-3 w-3" /> Falha de Login</span>;
      case 'BLOCKED_ACCOUNT':
        return <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-xs text-rose-400 font-semibold border border-rose-500/20"><UserX className="h-3 w-3" /> Conta Bloqueada</span>;
      case '2FA_FAILURE':
        return <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400 font-semibold border border-amber-500/20"><KeyRound className="h-3 w-3" /> Falha de 2FA</span>;
      case 'RATE_LIMIT':
        return <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400 font-semibold border border-amber-500/20"><AlertTriangle className="h-3 w-3" /> Rate Limit</span>;
      case 'ACCESS_DENIED':
        return <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-2 py-0.5 text-xs text-purple-400 font-semibold border border-purple-500/20"><ShieldAlert className="h-3 w-3" /> Acesso Negado</span>;
      default:
        return <Badge variant="slate">{type}</Badge>;
    }
  };

  const filteredEvents = events.filter(e => {
    if (selectedType !== 'ALL' && e.type !== selectedType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        (e.userEmail && e.userEmail.toLowerCase().includes(q)) ||
        (e.userId && e.userId.toLowerCase().includes(q)) ||
        e.reason.toLowerCase().includes(q) ||
        e.ipHash.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-rose-400" />
            Observabilidade de Segurança & Detecção de Ameaças
          </h2>
          <p className="text-sm text-slate-400">
            Monitoramento em tempo real de tentativas de invasão, falhas de 2FA, rate-limiting e violações de controle de acesso (RBAC/ABAC).
          </p>
        </div>

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            isLoading={isLoading}
            className="border-slate-700 bg-slate-800 text-slate-200"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Atualizar Incidentes
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por e-mail, motivo ou hash de IP..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Tipo de Evento:</span>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
            >
              <option value="ALL">Todos os Tipos</option>
              <option value="LOGIN_FAILURE">Falhas de Login</option>
              <option value="BLOCKED_ACCOUNT">Contas Bloqueadas</option>
              <option value="2FA_FAILURE">Falhas de 2FA</option>
              <option value="RATE_LIMIT">Rate Limiting</option>
              <option value="ACCESS_DENIED">Acesso Negado (RBAC)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security Events Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Tipo do Alerta</th>
                <th className="px-4 py-3">Usuário Alvo</th>
                <th className="px-4 py-3">Hash IP (LGPD)</th>
                <th className="px-4 py-3">Motivo / Violação</th>
                <th className="px-4 py-3">Severidade</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal">
              {filteredEvents.map(ev => (
                <tr key={ev.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400 font-mono">
                    {formatDateTime(ev.occurredAt)}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {getTypeBadge(ev.type)}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs font-semibold text-white">
                      {ev.userEmail || 'Anônimo'}
                    </div>
                    {ev.userId && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        {ev.userId}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-400">
                    <span className="truncate max-w-[140px] block" title={ev.ipHash}>
                      {ev.ipHash.slice(0, 16)}...
                    </span>
                  </td>

                  <td className="px-4 py-3 text-xs text-slate-200 max-w-xs">
                    {ev.reason}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {getSeverityBadge(ev.severity)}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {ev.userId && onNavigateToAudit ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigateToAudit(ev.userId!)}
                        className="h-7 text-xs border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Ver Auditoria
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    Nenhum incidente de segurança registrado no período.
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
