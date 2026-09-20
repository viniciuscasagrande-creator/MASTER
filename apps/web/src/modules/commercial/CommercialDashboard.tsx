import React, { useState, useEffect } from 'react';
import { CommercialDashboardPage } from '../../features/commercial/dashboard/CommercialDashboardPage';
import { OrdersPage } from '../../features/commercial/orders/OrdersPage';
import { OrderDetailsPage } from '../../features/commercial/orders/OrderDetailsPage';
import { CommercialSalesPage } from '../../features/commercial/sales/CommercialSalesPage';
import { useCoreData } from '../../core/context/CoreDataContext';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatCurrency } from '../../shared/utils/formatters';
import { Building2, Plus, Target, TrendingUp, Award } from 'lucide-react';
import { StatCard } from '../../shared/components/StatCard';

interface CommercialDashboardProps {
  initialSubItem?: string;
  onNavigate?: (moduleId: string, subItemId?: string) => void;
}

export const CommercialDashboard: React.FC<CommercialDashboardProps> = ({
  initialSubItem = 'commercial-dashboard',
  onNavigate
}) => {
  const [currentView, setCurrentView] = useState<string>(initialSubItem);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { producers } = useCoreData();

  useEffect(() => {
    if (initialSubItem) {
      setCurrentView(initialSubItem);
    }
  }, [initialSubItem]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentView('commercial-orders-detail');
  };

  const handleBackToOrders = () => {
    setSelectedOrderId(null);
    setCurrentView('commercial-orders');
  };

  // Route switcher
  if (currentView === 'commercial-orders-detail' && selectedOrderId) {
    return (
      <OrderDetailsPage
        orderId={selectedOrderId}
        onBack={handleBackToOrders}
      />
    );
  }

  if (currentView === 'commercial-orders') {
    return (
      <OrdersPage
        onSelectOrder={handleSelectOrder}
        onBackToDashboard={() => setCurrentView('commercial-dashboard')}
      />
    );
  }

  if (currentView === 'commercial-sales') {
    return (
      <CommercialSalesPage
        onNavigateToOrders={() => setCurrentView('commercial-orders')}
        onNavigateToEventsModule={(subItem) => onNavigate?.('events', subItem)}
      />
    );
  }

  // Fallback subItem: Producers list view
  if (currentView === 'commercial-producers') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                PRODUTORES CREDENCIADOS
              </h1>
              <Badge variant="orange" size="sm">
                Comercial & Parcerias
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Relação de produtores conveniados, termos contratuais e taxas comerciais
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="pb-3">Razão Social & CNPJ</th>
                  <th className="pb-3">Eventos Cadastrados</th>
                  <th className="pb-3">Volume Histórico</th>
                  <th className="pb-3">Taxa Negociada</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {producers.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3">
                      <div className="font-semibold text-white">{prod.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">CNPJ: {prod.cnpj}</div>
                    </td>
                    <td className="py-3 text-slate-300 font-mono">{prod.totalEvents} eventos</td>
                    <td className="py-3 font-mono font-bold text-white">{formatCurrency(prod.totalRevenue)}</td>
                    <td className="py-3 font-mono text-orange-400 font-bold">{(prod.commissionRate * 100).toFixed(1)}%</td>
                    <td className="py-3">
                      <Badge variant="emerald" size="sm">{prod.status.toUpperCase()}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Default: Primary Executive Dashboard (Fase 1.3.1)
  return (
    <CommercialDashboardPage
      onNavigateToOrders={() => setCurrentView('commercial-orders')}
      onNavigateToSales={() => setCurrentView('commercial-sales')}
      onSelectOrder={handleSelectOrder}
      onNavigateToRemarketing={() => onNavigate?.('remarketing', 'remarketing-abandoned-carts')}
    />
  );
};
