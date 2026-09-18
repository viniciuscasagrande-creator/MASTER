import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Search,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Users,
  LogOut,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { useAuth } from '../../core/auth/AuthContext';

interface ActiveSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  roleName: string;
  ipAddress: string;
  deviceType: 'desktop' | 'mobile';
  userAgent: string;
  startedAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

const INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: 'sess_1',
    userId: 'usr-admin-1',
    userName: 'Vinicius Casagrande',
    userEmail: 'vinicius.casagrande@diskingressos.com.br',
    roleName: 'Administrador Geral',
    ipAddress: '189.44.120.19',
    deviceType: 'desktop',
    userAgent: 'Chrome 128.0 (Windows 11 Enterprise)',
    startedAt: '2026-09-18T14:30:00Z',
    lastActiveAt: '2026-09-18T17:40:00Z',
    isCurrent: true
  },
  {
    id: 'sess_2',
    userId: 'usr-fin-maria',
    userName: 'Maria Oliveira',
    userEmail: 'maria.oliveira@diskingressos.com.br',
    roleName: 'Diretora Financeira',
    ipAddress: '177.102.18.4',
    deviceType: 'desktop',
    userAgent: 'Firefox 130.0 (macOS Sonoma)',
    startedAt: '2026-09-18T15:10:00Z',
    lastActiveAt: '2026-09-18T17:35:00Z',
    isCurrent: false
  },
  {
    id: 'sess_3',
    userId: 'usr-prod-opus',
    userName: 'Roberto Viana',
    userEmail: 'roberto@opusentretenimento.com.br',
    roleName: 'Produtor Opus',
    ipAddress: '200.180.44.12',
    deviceType: 'mobile',
    userAgent: 'Safari Mobile 18.0 (iOS 18 iPhone)',
    startedAt: '2026-09-18T11:20:00Z',
    lastActiveAt: '2026-09-18T16:50:00Z',
    isCurrent: false
  },
  {
    id: 'sess_4',
    userId: 'usr-sac-ana',
    userName: 'Ana Paula Santos',
    userEmail: 'ana.santos@diskingressos.com.br',
    roleName: 'Atendente SAC',
    ipAddress: '177.102.18.5',
    deviceType: 'desktop',
    userAgent: 'Chrome 128.0 (Windows 11)',
    startedAt: '2026-09-18T16:00:00Z',
    lastActiveAt: '2026-09-18T17:42:00Z',
    isCurrent: false
  }
];

export const AdminSessionsView: React.FC = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>(INITIAL_SESSIONS);
  const [search, setSearch] = useState('');

  const filteredSessions = sessions.filter(s =>
    s.userName.toLowerCase().includes(search.toLowerCase()) ||
    s.userEmail.toLowerCase().includes(search.toLowerCase()) ||
    s.ipAddress.includes(search) ||
    s.userAgent.toLowerCase().includes(search.toLowerCase())
  );

  const handleRevoke = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const handleRevokeAll = () => {
    setSessions(prev => prev.filter(s => s.isCurrent));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              SESSÕES ATIVAS & CONEXÕES EM TEMPO REAL
            </h1>
            <Badge variant="emerald" size="sm">{sessions.length} ativas</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Controle de sessões conectadas ao banco do Core com validação contínua de JWT e encerramento remoto
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por usuário, IP ou dispositivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-orange-500"
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleRevokeAll}
            icon={<LogOut className="h-3.5 w-3.5" />}
          >
            Encerrar Todas (Exceto Atual)
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3">Colaborador</th>
                <th className="pb-3">Dispositivo & Navegador</th>
                <th className="pb-3">Endereço IP</th>
                <th className="pb-3">Iniciada em</th>
                <th className="pb-3">Última Atividade</th>
                <th className="pb-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-orange-400 border border-slate-700">
                        {session.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {session.userName}
                          {session.isCurrent && (
                            <Badge variant="emerald" size="sm">Sua sessão</Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{session.userEmail}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5">
                    <div className="flex items-center gap-2 text-slate-300">
                      {session.deviceType === 'desktop' ? (
                        <Laptop className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Smartphone className="h-4 w-4 text-cyan-400" />
                      )}
                      <span>{session.userAgent}</span>
                    </div>
                  </td>

                  <td className="py-3.5 font-mono text-[11px] text-slate-400">
                    {session.ipAddress}
                  </td>

                  <td className="py-3.5 text-slate-400">
                    {new Date(session.startedAt).toLocaleString('pt-BR')}
                  </td>

                  <td className="py-3.5 text-slate-300 font-medium">
                    {new Date(session.lastActiveAt).toLocaleTimeString('pt-BR')}
                  </td>

                  <td className="py-3.5 text-right">
                    {!session.isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevoke(session.id)}
                      >
                        Revogar
                      </Button>
                    )}
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
