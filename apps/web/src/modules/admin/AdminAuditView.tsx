import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { useCoreData } from '../../core/context/CoreDataContext';

export const AdminAuditView: React.FC = () => {
  const { auditLogs } = useCoreData();

  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  const modules = Array.from(new Set(auditLogs.map(a => a.module)));

  const filteredLogs = auditLogs.filter(log => {
    if (selectedModule !== 'all' && log.module !== selectedModule) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.userName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.ipAddress.includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Data/Hora', 'Usuário', 'Ação', 'Módulo', 'IP', 'Detalhes'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      `"${l.userName}"`,
      l.action,
      l.module,
      l.ipAddress,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_disk_interno_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              CENTRAL DE AUDITORIA & CONFORMIDADE
            </h1>
            <Badge variant="purple" size="sm">Trilha Imutável</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Registro detalhado e à prova de adulteração de todas as operações críticas do Disk Interno
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            icon={<Download className="h-3.5 w-3.5" />}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuário, ação, detalhes ou IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-orange-500"
          />
        </div>

        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none"
        >
          <option value="all">Todos os Módulos</option>
          {modules.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3">Data & Hora</th>
                <th className="pb-3">Colaborador</th>
                <th className="pb-3">Ação Executada</th>
                <th className="pb-3">Módulo</th>
                <th className="pb-3">Detalhes do Evento</th>
                <th className="pb-3">IP de Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </td>

                  <td className="py-3.5 font-semibold text-white">
                    {log.userName}
                  </td>

                  <td className="py-3.5">
                    <span className="rounded bg-orange-500/10 px-2 py-0.5 text-[11px] font-bold text-orange-400 border border-orange-500/20">
                      {log.action}
                    </span>
                  </td>

                  <td className="py-3.5">
                    <Badge variant="slate" size="sm">{log.module}</Badge>
                  </td>

                  <td className="py-3.5 text-slate-300 max-w-md">
                    {log.details}
                  </td>

                  <td className="py-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
