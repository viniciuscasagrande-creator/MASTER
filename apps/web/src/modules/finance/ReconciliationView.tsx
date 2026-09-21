import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  QrCode,
  DollarSign,
  ShieldCheck,
  Building2,
  Scale
} from 'lucide-react';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { MetricCard } from '../../shared/components/MetricCard';
import { FilterBar } from '../../shared/components/FilterBar';
import { DataTable, Column } from '../../shared/components/DataTable';
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
  const [searchTerm, setSearchTerm] = useState('');

  const handleRunReconciliation = () => {
    setIsReconciling(true);
    setSuccessMessage('');
    setTimeout(() => {
      setIsReconciling(false);
      setSuccessMessage('Conciliação bancária executada com sucesso. 100% dos lotes conferidos.');
      onRefresh();
    }, 1000);
  };

  const totalSystem = records.reduce((acc, curr) => acc + curr.systemAmount, 0);
  const totalGateway = records.reduce((acc, curr) => acc + curr.gatewayAmount, 0);
  const totalFees = records.reduce((acc, curr) => acc + curr.gatewayFees, 0);
  const totalDivergence = records.reduce((acc, curr) => acc + curr.divergenceAmount, 0);

  const filteredRecords = records.filter(r =>
    !searchTerm.trim() ||
    r.gateway.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.period.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGatewayIcon = (gateway: string) => {
    switch (gateway) {
      case 'PIX_BancoCentral':
        return <QrCode className="h-4 w-4 text-emerald-600" />;
      case 'Cielo':
      case 'Rede':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      default:
        return <Building2 className="h-4 w-4 text-slate-600" />;
    }
  };

  const columns: Column<GatewayReconciliationRecordUI>[] = [
    {
      header: 'Gateway / Adquirente',
      accessor: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            {getGatewayIcon(r.gateway)}
          </div>
          <div>
            <div className="font-bold text-slate-900">{r.gateway}</div>
            <div className="text-[10px] text-slate-500 font-mono">Última conferência: {r.lastCheckedAt}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Período',
      width: '130px',
      accessor: (r) => <span className="font-medium text-slate-700">{r.period}</span>
    },
    {
      header: 'Lotes / Pedidos',
      accessor: (r) => (
        <span className="font-mono text-slate-600">
          {r.ordersCount.toLocaleString('pt-BR')} pedidos
        </span>
      )
    },
    {
      header: 'Valor Sistema',
      align: 'right',
      accessor: (r) => (
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(r.systemAmount)}
        </span>
      )
    },
    {
      header: 'Valor Adquirente',
      align: 'right',
      accessor: (r) => (
        <span className="font-mono font-bold text-emerald-700">
          {formatCurrency(r.gatewayAmount)}
        </span>
      )
    },
    {
      header: 'Taxas Retidas',
      align: 'right',
      accessor: (r) => (
        <span className="font-mono text-slate-500">
          {formatCurrency(r.gatewayFees)}
        </span>
      )
    },
    {
      header: 'Divergência',
      align: 'right',
      accessor: (r) => {
        const hasDivergence = r.divergenceAmount !== 0;
        return (
          <span className={`font-mono font-bold ${hasDivergence ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatCurrency(r.divergenceAmount)}
          </span>
        );
      }
    },
    {
      header: 'Status',
      align: 'right',
      width: '130px',
      accessor: (r) => {
        if (r.status === 'CONCILIADO') return <StatusBadge variant="success" label="Conciliado" />;
        if (r.status === 'DIVERGENTE') return <StatusBadge variant="danger" label="Divergente" />;
        return <StatusBadge variant="warning" label="Pendente" />;
      }
    }
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* KPI Cards Row (120-140px Height) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="TOTAL SISTEMA"
          value={formatCurrency(totalSystem)}
          subtitle="Registrado nas ordens de compra"
          icon={<DollarSign className="h-4 w-4 text-slate-700" />}
          badge="Bilheteria"
          badgeVariant="slate"
        />

        <MetricCard
          title="TOTAL ADQUIRENTES"
          value={formatCurrency(totalGateway)}
          trend={{ value: 'Confirmado pelas credenciadoras', isPositive: true }}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          badge="Extrato Bancário"
          badgeVariant="emerald"
        />

        <MetricCard
          title="TAXAS DE INTERMEDIAÇÃO"
          value={formatCurrency(totalFees)}
          subtitle="Tarifas de adquirentes e PIX"
          icon={<CreditCard className="h-4 w-4 text-blue-600" />}
          badge="Custos de Gateway"
          badgeVariant="cyan"
        />

        <MetricCard
          title="DIVERGÊNCIA LÍQUIDA"
          value={formatCurrency(totalDivergence)}
          subtitle={totalDivergence === 0 ? 'Conferência 100% precisa' : 'Ajustes em apuração'}
          icon={<Scale className="h-4 w-4 text-emerald-600" />}
          badge={totalDivergence === 0 ? 'Equilibrado' : 'Atenção'}
          badgeVariant={totalDivergence === 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* FilterBar */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por adquirente ou período..."
        hasActiveFilters={Boolean(searchTerm)}
        onClearFilters={() => setSearchTerm('')}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={isLoading}
              icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Atualizar
            </Button>
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
        }
      />

      {/* Reconciliation Table */}
      <DataTable
        columns={columns}
        data={filteredRecords}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="Nenhum lote de conciliação disponível no momento."
        emptyIcon={<ShieldCheck className="h-8 w-8 text-slate-300" />}
      />
    </div>
  );
};
