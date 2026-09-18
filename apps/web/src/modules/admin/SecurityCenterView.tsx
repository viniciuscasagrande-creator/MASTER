import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';

interface SecurityIncident {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  ipAddress: string;
  timestamp: string;
}

export const SecurityCenterView: React.FC = () => {
  const [blockedIps, setBlockedIps] = useState<string[]>([
    '198.51.100.44',
    '203.0.113.89'
  ]);
  const [newIpToBlock, setNewIpToBlock] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  const [incidents, setIncidents] = useState<SecurityIncident[]>([
    {
      id: 'sec_1',
      type: 'BRUTE_FORCE_SUSPECT',
      severity: 'HIGH',
      details: '5 tentativas consecutivas de senha incorreta para admin@diskingressos.com.br',
      ipAddress: '198.51.100.44',
      timestamp: '2026-09-18T17:20:00Z'
    },
    {
      id: 'sec_2',
      type: 'CONTEXT_TAMPERING',
      severity: 'CRITICAL',
      details: 'Tentativa de forçar header X-Producer-Id concorrente por Roberto Opus bloqueada pelo Node com 403',
      ipAddress: '200.180.44.12',
      timestamp: '2026-09-18T16:55:00Z'
    },
    {
      id: 'sec_3',
      type: 'STEP_UP_REAUTH',
      severity: 'LOW',
      details: 'Reautenticação step-up aprovada com sucesso para aprovação de transferência de R$ 75.000',
      ipAddress: '177.102.18.4',
      timestamp: '2026-09-18T16:10:00Z'
    }
  ]);

  const handleBlockIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpToBlock.trim()) return;

    setBlockedIps(prev => [...prev, newIpToBlock.trim()]);
    setIncidents(prev => [
      {
        id: `sec_${Date.now()}`,
        type: 'IP_BLOCKED',
        severity: 'CRITICAL',
        details: `IP bloqueado manualmente: ${blockReason || 'Ameaça detectada'}`,
        ipAddress: newIpToBlock.trim(),
        timestamp: new Date().toISOString()
      },
      ...prev
    ]);

    setNewIpToBlock('');
    setBlockReason('');
    setIsBlockModalOpen(false);
  };

  const handleUnblockIp = (ip: string) => {
    setBlockedIps(prev => prev.filter(item => item !== ip));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              CENTRAL DE SEGURANÇA & OPERAÇÕES (SOC)
            </h1>
            <Badge variant="rose" size="sm">Fase 1.1.5.4</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitoramento de ataques de força bruta, telemetria de intrusão, políticas de Step-Up e bloqueio de IPs hostis
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsBlockModalOpen(true)}
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          Bloquear IP Hostil
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="IPS BLOQUEADOS"
          value={blockedIps.length.toString()}
          subtitle="Tráfego rejeitado no firewall"
          icon={<ShieldAlert className="h-4 w-4 text-rose-400" />}
          badge="Proteção Ativa"
          badgeVariant="rose"
        />

        <StatCard
          title="TENTATIVAS BARRADAS"
          value="14 bloqueios"
          subtitle="Rate limiting e força bruta"
          icon={<Lock className="h-4 w-4 text-amber-400" />}
          badge="Argon2id Shield"
          badgeVariant="amber"
        />

        <StatCard
          title="STEP-UP EXECUTADOS"
          value="8 aprovações"
          subtitle="Reautenticações de alto valor"
          icon={<KeyRound className="h-4 w-4 text-emerald-400" />}
          badge="Segundo Fator"
          badgeVariant="emerald"
        />

        <StatCard
          title="STATUS DO FIREWALL"
          value="100% OPERACIONAL"
          subtitle="Inspeção profunda de headers"
          icon={<ShieldCheck className="h-4 w-4 text-cyan-400" />}
          badge="Online"
          badgeVariant="cyan"
        />
      </div>

      {/* Blocked IPs & Threat Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blocked IPs Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-bold text-sm text-white">Lista Negra de IPs</span>
            <Badge variant="rose">{blockedIps.length} IPs</Badge>
          </div>

          <div className="space-y-2">
            {blockedIps.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">Nenhum IP bloqueado no momento.</div>
            ) : (
              blockedIps.map(ip => (
                <div key={ip} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-rose-400">
                  <span>{ip}</span>
                  <button
                    onClick={() => handleUnblockIp(ip)}
                    title="Desbloquear IP"
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security Incident Stream */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="font-bold text-sm text-white">Feed de Anomalias & Incidentes de Segurança</span>
              <span className="text-xs text-slate-400 block mt-0.5">Captura automática de anomalias no backend Node</span>
            </div>
            <Activity className="h-4 w-4 text-orange-400" />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {incidents.map(inc => (
              <div key={inc.id} className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={inc.severity === 'CRITICAL' ? 'rose' : inc.severity === 'HIGH' ? 'orange' : 'slate'} size="sm">
                      {inc.type}
                    </Badge>
                    <span className="font-mono text-[11px] text-slate-400">IP: {inc.ipAddress}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">{new Date(inc.timestamp).toLocaleTimeString('pt-BR')}</span>
                </div>
                <p className="text-slate-300 text-[11px] mt-1">{inc.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual IP Block Modal */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/40 bg-slate-950 p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Bloquear Endereço IP</h3>
            <p className="text-xs text-slate-400">
              O IP informado será imediatamente impedido de enviar qualquer requisição aos endpoints do Disk Interno.
            </p>

            <form onSubmit={handleBlockIp} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Endereço IP (IPv4 ou IPv6)</label>
                <input
                  type="text"
                  placeholder="Ex: 198.51.100.50"
                  value={newIpToBlock}
                  onChange={(e) => setNewIpToBlock(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-xs text-white outline-none focus:border-rose-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Motivo do Bloqueio</label>
                <input
                  type="text"
                  placeholder="Ex: Ataque de força bruta ao endpoint /login"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsBlockModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={!newIpToBlock.trim()}>
                  Confirmar Bloqueio
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
