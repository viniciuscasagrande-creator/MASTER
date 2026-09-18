import React from 'react';
import { Settings, ShieldCheck, Database, Server, Key, Bell, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { useAuth } from '../../core/auth/AuthContext';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              CONFIGURAÇÕES DO SISTEMA
            </h1>
            <Badge variant="orange" size="sm">
              Core v1.1
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Parâmetros do Core central Disk Interno, gateways de pagamento, webhooks e credenciais
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Gateways Status */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Server className="h-4 w-4 text-orange-400" />
            <span>Gateways & Adquirentes</span>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { name: 'Cielo E-Commerce 3.0', status: 'Online', ping: '42ms', mode: 'Produção' },
              { name: 'Rede e-Rede Tokenization', status: 'Online', ping: '38ms', mode: 'Produção' },
              { name: 'Banco Santander PIX SPI', status: 'Online', ping: '19ms', mode: 'Produção' },
              { name: 'Stone Open Banking API', status: 'Online', ping: '45ms', mode: 'Homologação' },
            ].map((gw, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div>
                  <div className="font-semibold text-white">{gw.name}</div>
                  <div className="text-[10px] text-slate-500">{gw.mode} • Latência {gw.ping}</div>
                </div>
                <Badge variant="emerald" size="sm" dot>
                  {gw.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Core Architecture Information */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Database className="h-4 w-4 text-cyan-400" />
            <span>Topologia & Banco Relacional</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 text-xs">
            <div className="text-slate-300">
              <strong className="text-white">Cadeia de Integridade Referencial:</strong>
            </div>
            <div className="font-mono text-[11px] text-cyan-300 leading-relaxed bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              Produtor → Evento → Cliente → Pedido → Ingresso → Pagamento → Repasse
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Todos os módulos compartilham o mesmo grafo de entidades no PostgreSQL, eliminando discrepâncias entre financeiro, bilheteria e SAC.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
            <span>Usuário autenticado:</span>
            <span className="font-semibold text-white">{user.name} ({user.role})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
