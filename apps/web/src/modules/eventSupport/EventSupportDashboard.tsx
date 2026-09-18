import React, { useState } from 'react';
import {
  Headphones,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Radio,
  ShieldAlert,
  Wifi,
  Ticket,
  Plus
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatDateTime } from '../../shared/utils/formatters';

export const EventSupportDashboard: React.FC = () => {
  const { incidents, events, resolveIncident, addIncident } = useCoreData();
  const [newIncidentModal, setNewIncidentModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'catraca' | 'rede_wifi' | 'ingresso_falso' | 'tumulto' | 'sistema' | 'produtor'>('catraca');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [description, setDescription] = useState('');

  const openIncidents = incidents.filter(i => i.status !== 'resolved');
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved');

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    addIncident({
      eventId: selectedEventId,
      title,
      category,
      severity,
      description,
      reportedBy: 'Operador de Campo'
    });
    setNewIncidentModal(false);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              SALA DE OPERAÇÕES & SUPORTE A EVENTOS
            </h1>
            <Badge variant={openIncidents.length > 0 ? 'amber' : 'emerald'} size="sm" dot>
              {openIncidents.length > 0 ? `${openIncidents.length} Incidentes Abertos` : 'Operação Estável'}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitoramento de catracas, validação de ingressos no local, rede Wi-Fi e chamados críticos de portaria
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setNewIncidentModal(true)}
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          Registrar Incidente
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="EVENTOS EM ANDAMENTO"
          value={events.filter(e => e.status === 'in_operation').length.toString()}
          subtitle="Com equipe técnica e fiscais in loco"
          icon={<Radio className="h-4 w-4 text-orange-400" />}
          badge="Tempo Real"
          badgeVariant="orange"
        />

        <StatCard
          title="INCIDENTES CRÍTICOS"
          value={incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved').length.toString()}
          subtitle="SLA máximo de 10 minutos"
          icon={<ShieldAlert className="h-4 w-4 text-rose-400" />}
          badge="Alerta Máximo"
          badgeVariant="rose"
        />

        <StatCard
          title="CATRACAS CONECTADAS"
          value="48 unidades"
          subtitle="Pedreira: 28 • Couto Pereira: 20"
          icon={<Ticket className="h-4 w-4 text-cyan-400" />}
          badge="99.2% Uptime"
          badgeVariant="cyan"
        />

        <StatCard
          title="RESOLVIDOS HOJE"
          value={resolvedIncidents.length.toString()}
          trend={{ value: 'Tempo médio: 14min', isPositive: true }}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          badge="SLA Cumprido"
          badgeVariant="emerald"
        />
      </div>

      {/* Active Incidents Queue */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">Quadro de Incidentes & Chamados de Campo</h2>
          <span className="text-xs text-slate-400">Atualização a cada 5 segundos</span>
        </div>

        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className={`rounded-xl border p-4 transition-all ${
                inc.status === 'resolved'
                  ? 'border-slate-800/60 bg-slate-950/40 opacity-70'
                  : inc.severity === 'high' || inc.severity === 'critical'
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-slate-800 bg-slate-950/70'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={inc.severity === 'critical' || inc.severity === 'high' ? 'rose' : 'amber'}
                      size="sm"
                    >
                      {inc.severity.toUpperCase()}
                    </Badge>
                    <span className="font-bold text-sm text-white">{inc.title}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Evento: <strong className="text-slate-200">{inc.eventName}</strong> • Notificado por {inc.reportedBy} em {formatDateTime(inc.reportedAt)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={inc.status === 'resolved' ? 'emerald' : 'amber'}
                    size="sm"
                  >
                    {inc.status === 'resolved' ? 'Resolvido' : 'Em Andamento'}
                  </Badge>

                  {inc.status !== 'resolved' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => resolveIncident(inc.id)}
                      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    >
                      Marcar Resolvido
                    </Button>
                  )}
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-300">
                {inc.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Incident Modal */}
      {newIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1">Registrar Incidente Operacional</h3>
            <p className="text-xs text-slate-400 mb-4">
              Dispara alerta imediato para a sala de operações e supervisores no local
            </p>

            <form onSubmit={handleCreateIncident} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Evento</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white outline-none"
                >
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título Resumido</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Ex: Falha no leitor do Portão 3"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white outline-none"
                  >
                    <option value="catraca">Catraca / Leitor</option>
                    <option value="rede_wifi">Rede Wi-Fi / Link</option>
                    <option value="ingresso_falso">Ingresso Falso / Duplicado</option>
                    <option value="tumulto">Fila / Tumulto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Severidade</label>
                  <select
                    value={severity}
                    onChange={(e: any) => setSeverity(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white outline-none"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica (SLA 10m)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                  placeholder="Descreva a ocorrência detalhadamente..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setNewIncidentModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  Gravar Incidente
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
