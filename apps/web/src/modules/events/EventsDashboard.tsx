import React, { useState } from 'react';
import {
  Calendar,
  Ticket,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { useScope } from '../../core/context/ScopeContext';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatNumber, formatDate } from '../../shared/utils/formatters';

export const EventsDashboard: React.FC = () => {
  const { events, producers } = useCoreData();
  const { selectedProducerId, setSelectedEventId } = useScope();

  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredEvents = events.filter(e => {
    if (selectedProducerId !== 'all' && e.producerId !== selectedProducerId) return false;
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    return true;
  });

  const totalCapacity = filteredEvents.reduce((acc, e) => acc + e.totalCapacity, 0);
  const totalSold = filteredEvents.reduce((acc, e) => acc + e.ticketsSold, 0);
  const totalRevenue = filteredEvents.reduce((acc, e) => acc + e.grossRevenue, 0);
  const totalCheckIns = filteredEvents.reduce((acc, e) => acc + e.checkInCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              PAINEL DE EVENTOS & BILHETERIA
            </h1>
            <Badge variant="orange" size="sm">
              Gestão de Capacidade & Lotes
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Controle operacional de setores, lotes, validação de ingressos em tempo real e check-in
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => alert('Wizard de criação de eventos do Disk Interno')}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            Criar Evento
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="EVENTOS ATIVOS"
          value={filteredEvents.length.toString()}
          subtitle={`${events.filter(e => e.status === 'in_operation').length} em operação hoje`}
          icon={<Calendar className="h-4 w-4 text-orange-400" />}
          badge="Catálogo"
          badgeVariant="orange"
        />

        <StatCard
          title="INGRESSOS VENDIDOS"
          value={formatNumber(totalSold)}
          trend={{ value: `${Math.round((totalSold / (totalCapacity || 1)) * 100)}% ocupação média`, isPositive: true }}
          icon={<Ticket className="h-4 w-4 text-cyan-400" />}
          badge="Tempo Real"
          badgeVariant="cyan"
        />

        <StatCard
          title="RECEITA DE BILHETERIA"
          value={formatCurrency(totalRevenue)}
          trend={{ value: '18.4% vs mês anterior', isPositive: true }}
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          badge="Bruto"
          badgeVariant="emerald"
        />

        <StatCard
          title="VALIDADOS NA PORTARIA"
          value={formatNumber(totalCheckIns)}
          subtitle="Check-in sincronizado via QR / Catracas"
          icon={<Users className="h-4 w-4 text-purple-400" />}
          badge="Portaria"
          badgeVariant="purple"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['all', 'Festival', 'Show', 'Teatro', 'Congresso'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              filterCategory === cat
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
            }`}
          >
            {cat === 'all' ? 'Todas as Categorias' : cat}
          </button>
        ))}
      </div>

      {/* Events Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredEvents.map((evt) => {
          const percentSold = Math.round((evt.ticketsSold / evt.totalCapacity) * 100);
          return (
            <div
              key={evt.id}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg flex flex-col justify-between transition-all hover:border-slate-700"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                        {evt.category}
                      </span>
                      <Badge
                        variant={evt.status === 'in_operation' ? 'orange' : evt.status === 'on_sale' ? 'emerald' : 'slate'}
                        size="sm"
                      >
                        {evt.status === 'in_operation' ? 'Em Operação' : evt.status === 'on_sale' ? 'Vendas Abertas' : 'Publicado'}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1.5 leading-snug">
                      {evt.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-orange-400" />
                      <span>{evt.venue} • {evt.city}/{evt.state}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Data: {formatDate(evt.date)} • Abertura: {evt.doorsOpen}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      {formatCurrency(evt.grossRevenue)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {formatNumber(evt.ticketsSold)} / {formatNumber(evt.totalCapacity)} ({percentSold}%)
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                      style={{ width: `${percentSold}%` }}
                    />
                  </div>
                </div>

                {/* Sectors Breakdown */}
                <div className="mt-4 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Setores & Lotes Ativos:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {evt.sectors.map((sec) => (
                      <div key={sec.id} className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-2 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-slate-200">{sec.name}</div>
                          <div className="text-[10px] text-slate-500">Lote {sec.batch} • {sec.sold}/{sec.capacity}</div>
                        </div>
                        <div className="font-bold text-white font-mono">
                          {formatCurrency(sec.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Produtor: <strong className="text-slate-200">{evt.producerName}</strong>
                </span>
                <button
                  onClick={() => alert(`Acessando mapa de assentos e bilheteria para: ${evt.title}`)}
                  className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  Gerenciar Setores →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
