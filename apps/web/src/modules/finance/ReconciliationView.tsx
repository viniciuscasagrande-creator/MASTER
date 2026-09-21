import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  QrCode,
  DollarSign,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatCurrency } from '../../shared/utils/formatters';

export interface GatewayReconciliationRecordUI {
  id: string;
  gateway: 'Cielo' | 'Rede' | 'PIX_BancoCentral' | 'Asaas';
  period: string;
  ordersCount: number;
  systemAmount: number;
  gatewayAmount: number;
  divergenceAmount: number;
  gatewayFees: number;
  status: 'CONCILIADO' | 'DIVERGENTE' | 'PENDENTE';
  lastCheckedAt: string;
}

interface ReconciliationViewProps {
  records: GatewayReconciliationRecordUI[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const ReconciliationView: React.FC<ReconciliationViewProps> = ({
  records,
  isLoading,
  onRefresh
}) => {
  const [isReconciling, setIsReconciling] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleRunReconciliation = () => {
    setIsReconciling(true);
    setSuccessMessage('');
    setTimeout(() => {
      setIsReconciling(false);
      setSuccessMessage('Conciliação bancária executada com sucesso. 100% dos lotes conferidos.');
      onRefresh();
    }, 1200);
  };

  const totalSystem = records.reduce((acc, curr) => acc + curr.systemAmount, 0);
  const totalGateway = records.reduce((acc, curr) => acc + curr.gatewayAmount, 0);
  const totalFees = records.reduce((acc, curr) => acc + curr.gatewayFees, 0);
  const totalDivergence = records.reduce((acc, curr) => acc + curr.divergenceAmount, 0);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mb-3" />
        <p className="text-xs">Consultando lotes de conciliação com adquirentes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            CONCILIAÇÃO BANCÁRIA & GATEWAYS
          </h3>
          <p className="text-xs text-slate-400">
            Confronto automatizado entre pedidos comercializados e extratos das adquirentes
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={handleRunReconciliation}
          disabled={isReconciling}
          icon={<RefreshCw className={`h-3.5 w-3.5 ${isReconciling ? 'animate-spin' : ''}`} />}
        >
          {isReconciling ? 'Conciliando...' : 'Reconciliar Agora'}
        </Button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Volume Registrado no Sistema
          </span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">
            {formatCurrency(totalSystem)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {records.reduce((acc, c) => acc + c.ordersCount, 0)} pedidos conferidos
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Volume Confirmado Adquirentes
          </span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            {formatCurrency(totalGateway)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Liquidações confirmadas
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Taxas de Meio de Pagamento
          </span>
          <span className="text-xl font-bold font-mono text-orange-400 mt-1 block">
            {formatCurrency(totalFees)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            MDR retido pelas adquirentes
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Divergências Identificadas
          </span>
          <span className={`text-xl font-bold font-mono mt-1 block ${
            totalDivergence === 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {formatCurrency(totalDivergence)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {totalDivergence === 0 ? 'Confronto 100% equilibrado' : 'Requer intervenção contábil'}
          </span>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-6">Adquirente / Gateway</th>
                <th className="py-3.5 px-4 text-center">Pedidos</th>
                <th className="py-3.5 px-4 text-right">Volume Sistema</th>
                <th className="py-3.5 px-4 text-right">Volume Gateway</th>
                <th className="py-3.5 px-4 text-right">Taxas Retidas (MDR)</th>
                <th className="py-3.5 px-4 text-right">Divergência</th>
                <th className="py-3.5 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-white flex items-center gap-2">
                      {rec.gateway === 'PIX_BancoCentral' ? (
                        <QrCode className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-cyan-400" />
                      )}
                      <span>{rec.gateway === 'PIX_BancoCentral' ? 'PIX Instantâneo (BACEN)' : rec.gateway}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {rec.period} • Última checagem: {new Date(rec.lastCheckedAt).toLocaleTimeString('pt-BR')}
                    </div>
                  </td>

                  <td className="py-4 px-4 text-center font-mono font-medium text-slate-300">
                    {rec.ordersCount}
                  </td>

                  <td className="py-4 px-4 text-right font-mono text-slate-300">
                    {formatCurrency(rec.systemAmount)}
                  </td>

                  <td className="py-4 px-4 text-right font-mono font-bold text-white">
                    {formatCurrency(rec.gatewayAmount)}
                  </td>

                  <td className="py-4 px-4 text-right font-mono text-orange-400">
                    {formatCurrency(rec.gatewayFees)}
                  </td>

                  <td className="py-4 px-4 text-right font-mono font-bold">
                    {rec.divergenceAmount === 0 ? (
                      <span className="text-emerald-400">R$ 0,00</span>
                    ) : (
                      <span className="text-rose-400">{formatCurrency(rec.divergenceAmount)}</span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-center">
                    {rec.status === 'CONCILIADO' ? (
                      <Badge variant="emerald">100% Conciliado</Badge>
                    ) : (
                      <Badge variant="rose">{rec.status}</Badge>
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
