import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  MessageCircle,
  Mail,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  DollarSign,
  AlertCircle,
  Filter,
  RefreshCw,
  Zap,
  Sliders,
  Play
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { MetricCard } from '../../shared/components/MetricCard';
import { PageHeader } from '../../shared/components/PageHeader';
import { FilterBar } from '../../shared/components/FilterBar';
import { DataTable, Column } from '../../shared/components/DataTable';
import { SectionCard } from '../../shared/components/SectionCard';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatDateTime } from '../../shared/utils/formatters';

interface RemarketingDashboardProps {
  initialSubItem?: string;
  onNavigate?: (module: string, sub?: string) => void;
}

export const RemarketingDashboard: React.FC<RemarketingDashboardProps> = ({
  initialSubItem = 'remarketing-dashboard',
  onNavigate
}) => {
  const { abandonedCarts } = useCoreData();
  const [activeTab, setActiveTab] = useState<string>(initialSubItem || 'remarketing-dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubItem) {
      setActiveTab(initialSubItem);
    }
  }, [initialSubItem]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onNavigate?.('remarketing', tabId);
  };

  const totalAbandoned = abandonedCarts.length;
  const recoveredList = abandonedCarts.filter(c => c.status === 'recovered');
  const totalRecoveredValue = recoveredList.reduce((acc, c) => acc + c.totalValue, 0);
  const recoveryRate = totalAbandoned > 0 ? ((recoveredList.length / totalAbandoned) * 100).toFixed(1) : '24.8';

  const handleTriggerMessage = (cart: typeof abandonedCarts[0]) => {
    setToastMessage(`Link de checkout e assento reservado disparado via WhatsApp para ${cart.customerName} (${cart.customerPhone}).`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredCarts = abandonedCarts.filter(c => {
    const matchesSearch =
      !searchTerm.trim() ||
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerPhone.includes(searchTerm) ||
      c.eventName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const cartColumns: Column<typeof abandonedCarts[0]>[] = [
    {
      header: 'Comprador & Contato',
      accessor: (cart) => (
        <div>
          <div className="font-bold text-slate-900">{cart.customerName}</div>
          <div className="text-[11px] text-slate-500 font-mono">{cart.customerPhone}</div>
        </div>
      )
    },
    {
      header: 'Evento & Ingressos',
      accessor: (cart) => (
        <div>
          <div className="font-medium text-slate-800 truncate max-w-[200px]">{cart.eventName}</div>
          <div className="text-[10px] text-slate-400 font-mono">{cart.ticketCount} ingressos reservados</div>
        </div>
      )
    },
    {
      header: 'Valor Abandonado',
      align: 'right',
      accessor: (cart) => (
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(cart.totalValue)}
        </span>
      )
    },
    {
      header: 'Horário do Abandono',
      accessor: (cart) => (
        <span className="font-mono text-slate-600 text-[11px]">
          {formatDateTime(cart.abandonedAt)}
        </span>
      )
    },
    {
      header: 'Canal Ativo',
      accessor: () => (
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 text-xs">
          <MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (cart) => (
        cart.status === 'recovered' ? (
          <StatusBadge variant="success" label="Recuperado" />
        ) : (
          <StatusBadge variant="warning" label="Em Jornada" />
        )
      )
    },
    {
      header: 'Ação',
      align: 'right',
      accessor: (cart) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleTriggerMessage(cart)}
          icon={<Send className="h-3 w-3 text-emerald-600" />}
        >
          Disparar
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title={
          activeTab === 'remarketing-abandoned-carts' ? 'Carrinhos Abandonados & Fila de Disparo' :
          activeTab === 'remarketing-sales-recovery' ? 'Recuperação de Vendas & Checkout' :
          activeTab === 'remarketing-payment-recovery' ? 'Recuperação de Boletos & PIX Não Pagos' :
          activeTab === 'remarketing-journeys' ? 'Jornadas & Automações de Régua' :
          activeTab === 'remarketing-whatsapp' ? 'WhatsApp Remarketing & Mensageria' :
          activeTab === 'remarketing-email' ? 'E-mail Remarketing' :
          'Painel de Remarketing & Recuperação'
        }
        description="Recuperação inteligente de compras não concluídas, réguas de engajamento e reativação de compradores"
        badge={<StatusBadge variant="success" label="Jornada WhatsApp 15m / 2h / 24h Ativa" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleTabChange('remarketing-journeys')}
              icon={<Sliders className="h-3.5 w-3.5 text-orange-600" />}
            >
              Configurar Réguas
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleTabChange('remarketing-abandoned-carts')}
              icon={<ShoppingCart className="h-3.5 w-3.5" />}
            >
              Ver Carrinhos
            </Button>
          </div>
        }
      />

      {/* Sub-Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'remarketing-dashboard', label: 'Painel Geral' },
          { id: 'remarketing-abandoned-carts', label: `Carrinhos Abandonados (${totalAbandoned})` },
          { id: 'remarketing-sales-recovery', label: 'Recuperação de Vendas' },
          { id: 'remarketing-payment-recovery', label: 'Boletos & PIX' },
          { id: 'remarketing-journeys', label: 'Jornadas & Réguas' },
          { id: 'remarketing-whatsapp', label: 'WhatsApp' },
          { id: 'remarketing-email', label: 'E-mail' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTabChange(t.id)}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 text-xs ${
              activeTab === t.id
                ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PAINEL GERAL */}
      {activeTab === 'remarketing-dashboard' && (
        <div className="space-y-6">
          {/* KPI Cards (120-140px Height) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="TAXA DE RECUPERAÇÃO"
              value={`${recoveryRate}%`}
              trend={{ value: '1 em cada 4 carrinhos recuperados', isPositive: true }}
              icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
              badge="Alta Conversão"
              badgeVariant="emerald"
            />

            <MetricCard
              title="RECEITA RECUPERADA"
              value={formatCurrency(totalRecoveredValue || 142800)}
              subtitle="Valor salvo pelas réguas ativas"
              icon={<DollarSign className="h-4 w-4 text-orange-600" />}
              badge="Incremental"
              badgeVariant="orange"
            />

            <MetricCard
              title="MENSAGENS WHATSAPP"
              value="1.840 enviadas"
              subtitle="92% taxa de abertura em 10min"
              icon={<MessageCircle className="h-4 w-4 text-cyan-600" />}
              badge="Taxa 92%"
              badgeVariant="cyan"
            />

            <MetricCard
              title="CARRINHOS EM JORNADA"
              value={abandonedCarts.filter(c => c.status === 'in_journey').length.toString()}
              subtitle="Aguardando próximo disparo de régua"
              icon={<ShoppingCart className="h-4 w-4 text-purple-600" />}
              badge="Fila Ativa"
              badgeVariant="purple"
            />
          </div>

          {/* Quick Carrinhos List */}
          <SectionCard
            title="CARRINHOS RECENTES & STATUS DA RÉGUA"
            description="Disparo automatizado de links diretos com retenção de assento e cupom relâmpago"
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTabChange('remarketing-abandoned-carts')}
              >
                Ver Todos os Carrinhos
              </Button>
            }
          >
            <DataTable
              columns={cartColumns}
              data={filteredCarts.slice(0, 5)}
              keyExtractor={(c) => c.id}
            />
          </SectionCard>
        </div>
      )}

      {/* TAB 2: CARRINHOS ABANDONADOS COMPLETO */}
      {activeTab === 'remarketing-abandoned-carts' && (
        <div className="space-y-4">
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar por comprador, telefone ou evento..."
            selects={[
              {
                id: 'status',
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { label: 'Todos os Status', value: 'ALL' },
                  { label: 'Em Jornada', value: 'in_journey' },
                  { label: 'Recuperados', value: 'recovered' }
                ]
              }
            ]}
            hasActiveFilters={statusFilter !== 'ALL' || Boolean(searchTerm)}
            onClearFilters={() => {
              setStatusFilter('ALL');
              setSearchTerm('');
            }}
          />

          <DataTable
            columns={cartColumns}
            data={filteredCarts}
            keyExtractor={(c) => c.id}
            emptyMessage="Nenhum carrinho encontrado para o filtro informado."
          />
        </div>
      )}

      {/* OTHER REMARKETING TABS */}
      {(activeTab === 'remarketing-sales-recovery' ||
        activeTab === 'remarketing-payment-recovery' ||
        activeTab === 'remarketing-journeys' ||
        activeTab === 'remarketing-whatsapp' ||
        activeTab === 'remarketing-email') && (
        <SectionCard
          title={
            activeTab === 'remarketing-sales-recovery' ? 'Estratégia de Recuperação de Vendas Não Finalizadas' :
            activeTab === 'remarketing-payment-recovery' ? 'Reemissão Rápida de Boletos e PIX Expirados' :
            activeTab === 'remarketing-journeys' ? 'Construtor de Jornadas: 15min / 2h / 24h' :
            activeTab === 'remarketing-whatsapp' ? 'Templates Aprovados de Mensagens WhatsApp' : 'Disparos de E-mail de Recuperação'
          }
          description="Automações com alta taxa de entrega e retenção automática de assentos"
          badge={<StatusBadge variant="success" label="Régua Ativa" />}
        >
          <div className="p-6 text-center text-xs text-slate-500">
            <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 text-sm">Régua Automatizada Sincronizada ao Checkout</p>
            <p className="mt-1 max-w-md mx-auto text-slate-500">
              Cada abandono de carrinho ou PIX não pago inicia automaticamente uma sequência inteligente com links autenticados.
            </p>
          </div>
        </SectionCard>
      )}
    </div>
  );
};
