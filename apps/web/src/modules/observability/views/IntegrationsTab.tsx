import React, { useState } from 'react';
import {
  Cpu,
  CreditCard,
  Building,
  Megaphone,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Search
} from 'lucide-react';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { IntegrationStatusItem } from '../observability.types';

interface IntegrationsTabProps {
  integrations: IntegrationStatusItem[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({
  integrations,
  onRefresh,
  isLoading = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PAYMENT':
        return <CreditCard className="h-4 w-4 text-emerald-400" />;
      case 'BANK':
        return <Building className="h-4 w-4 text-cyan-400" />;
      case 'MARKETING':
        return <Megaphone className="h-4 w-4 text-purple-400" />;
      case 'MESSAGING':
        return <MessageSquare className="h-4 w-4 text-amber-400" />;
      default:
        return <Cpu className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return <Badge variant="emerald" dot>Operacional</Badge>;
      case 'DEGRADED':
        return <Badge variant="amber" dot>Instabilidade</Badge>;
      case 'DOWN':
        return <Badge variant="rose" dot>Fora do Ar</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const filteredIntegrations = integrations.filter(item => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.provider.toLowerCase().includes(q) ||
        item.endpoint.toLowerCase().includes(q)
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
            <Cpu className="h-6 w-6 text-cyan-400" />
            Saúde & Latência de Integrações Externas
          </h2>
          <p className="text-sm text-slate-400">
            Monitoramento de ponta a ponta dos adquirentes de cartão, PIX, bancos, pixels de conversão e gateways de SMS/WhatsApp.
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
            Checar Conexões
          </Button>
        )}
      </div>

      {/* Filter and Category Tabs */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'Todas as Integrações' },
              { id: 'PAYMENT', label: 'Pagamentos & PIX' },
              { id: 'BANK', label: 'Bancos & CNAB' },
              { id: 'MARKETING', label: 'Marketing & Pixels' },
              { id: 'MESSAGING', label: 'Comunicação & Mensageria' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-600 text-white shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar integrador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map(integ => (
          <div
            key={integ.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-4 hover:border-slate-700 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
                  {getCategoryIcon(integ.category)}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{integ.name}</h4>
                  <div className="text-xs text-slate-400">{integ.provider}</div>
                </div>
              </div>
              {getStatusBadge(integ.status)}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-center">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Uptime 90d</div>
                <div className="text-xs font-bold font-mono text-emerald-400">{integ.uptime90d}%</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Latência</div>
                <div className="text-xs font-bold font-mono text-slate-200">{integ.latencyAvgMs}ms</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Sucesso</div>
                <div className="text-xs font-bold font-mono text-cyan-400">{integ.successRate}%</div>
              </div>
            </div>

            {/* Endpoint */}
            <div className="text-xs font-mono text-slate-400 truncate bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-500">Host: </span>
              {integ.endpoint}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60">
              <span>Última checagem: {new Date(integ.lastCheckedAt).toLocaleTimeString('pt-BR')}</span>
              <span className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer">
                Docs <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
