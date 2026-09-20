import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  TrendingUp,
  FileText,
  ShieldCheck,
  ListTodo,
  ExternalLink,
  ChevronRight,
  Info,
  AlertTriangle,
  XCircle,
  Globe,
  Gift,
  Users,
  Sparkles
} from 'lucide-react';
import { EventDetailDTO, EventListItemDTO } from '../types/event.types';
import { EventContextHeader } from '../components/EventContextHeader';
import { StatCard } from '../../../shared/components/StatCard';
import { Badge } from '../../../shared/components/Badge';
import { formatNumber, formatDateTime } from '../../../shared/utils/formatters';
import { fetchEventReadiness } from '../api/readiness.api';
import { EventReadinessDTO } from '@shared/types/index';

interface EventDashboardPageProps {
  event: EventDetailDTO;
  availableEvents: EventListItemDTO[];
  onSelectAnotherEvent: (eventId: string) => void;
  onClearEventContext: () => void;
  onNavigateModule?: (moduleId: string, subItemId?: string) => void;
}

export const EventDashboardPage: React.FC<EventDashboardPageProps> = ({
  event,
  availableEvents,
  onSelectAnotherEvent,
  onClearEventContext,
  onNavigateModule
}) => {
  const capacity = event.capacity || 0;
  const sold = event.soldTickets || 0;
  const occupancy = event.occupancyPercentage ?? (capacity > 0 ? Math.round((sold / capacity) * 100) : null);

  const [readiness, setReadiness] = useState<EventReadinessDTO | null>(null);
  const [loadingReadiness, setLoadingReadiness] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (event?.id) {
      setLoadingReadiness(true);
      fetchEventReadiness(event.id)
        .then((data) => {
          if (isMounted) setReadiness(data);
        })
        .catch(() => {
          // Fallback gracefully if endpoint isn't reached or event is freshly created
        })
        .finally(() => {
          if (isMounted) setLoadingReadiness(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [event?.id]);

  // Subphases of Eventos module for the operational roadmap
  const EVENT_SUBPHASES = [
    {
      id: '1.2.1',
      title: 'Estrutura Core & Contexto',
      desc: 'Cadastro básico, código público imutável e isolamento multitenant.',
      status: 'COMPLETED'
    },
    {
      id: '1.2.2',
      title: 'Cadastro Completo & Wizard',
      desc: 'Wizard inteligente de 8 etapas, autosave, slug único e rascunhos.',
      status: 'COMPLETED'
    },
    {
      id: '1.2.3',
      title: 'Central de Locais & Mapas',
      desc: 'Venues reutilizáveis, setores físicos, portões e editor gráfico de layout.',
      status: 'COMPLETED'
    },
    {
      id: '1.2.4',
      title: 'Datas, Sessões & Capacidade',
      desc: 'Múltiplas sessões, motor de recorrência, reservas técnicas e conflitos.',
      status: 'COMPLETED'
    },
    {
      id: '1.2.5',
      title: 'Setores, Ingressos & Inventário',
      desc: 'Setores operacionais, catálogo de modalidades comerciais, cotas e inventário atômico compartilhado.',
      status: 'COMPLETED'
    },
    {
      id: '1.2.6',
      title: 'Lotes, Preços & Regras de Venda',
      desc: 'Máquina de estados de lotes, matriz de preços, centavos inteiros, split de taxas e regras comerciais.',
      status: 'COMPLETED'
    },
    {
      id: '1.2.7',
      title: 'Canais de Venda + Cortesias + Equipe do Evento',
      desc: 'Distribuição omnichannel (Site, PDV, Bilheteria), cotas e aprovação de cortesias, e dimensionamento de equipe operacional.',
      status: 'COMPLETED'
    },
    {
      id: '1.2.8',
      title: 'Documentos + Pendências + Central de Prontidão',
      desc: 'Gestão documental de alvarás e contratos, central de pendências operacionais e motor algorítmico de Readiness.',
      status: 'COMPLETED'
    },
    {
      id: '1.2.9',
      title: 'Gestão de Vendas & PDV',
      desc: 'Acompanhamento comercial em tempo real, terminais físicos e caixas.',
      status: 'NEXT'
    },
    {
      id: '1.2.10',
      title: 'Políticas & Cancelamento',
      desc: 'Regras de arrependimento, adiamentos e estornos.',
      status: 'UPCOMING'
    },
    {
      id: '1.2.11',
      title: 'BI & Analytics do Evento',
      desc: 'Velocidade de vendas, curvas de conversão e ticket médio.',
      status: 'UPCOMING'
    },
    {
      id: '1.2.12',
      title: 'Borderô & Fechamento',
      desc: 'Conciliação contábil, taxas de serviço e repasse ao produtor.',
      status: 'UPCOMING'
    },
    {
      id: '1.2.13',
      title: 'Check-in & Portaria',
      desc: 'Leitura de QR codes, controle de fluxo e catracas integradas.',
      status: 'UPCOMING'
    },
    {
      id: '1.2.14',
      title: 'Histórico & Auditoria',
      desc: 'Trilha completa e imutável de alterações do evento.',
      status: 'UPCOMING'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Context Banner with Event Identity & Fast Switcher */}
      <EventContextHeader
        event={event}
        availableEvents={availableEvents}
        onSelectAnotherEvent={onSelectAnotherEvent}
        onClearEventContext={onClearEventContext}
      />

      {/* 2. Operational KPIs for this active event */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="CAPACIDADE TOTAL"
          value={capacity > 0 ? formatNumber(capacity) : 'A definir'}
          subtitle="Carga máxima autorizada"
          icon={<Layers className="h-4 w-4 text-cyan-400" />}
          badge={capacity > 0 ? 'Capacidade' : 'Pendente'}
          badgeVariant={capacity > 0 ? 'cyan' : 'amber'}
        />

        <StatCard
          title="INGRESSOS VENDIDOS"
          value={formatNumber(sold)}
          subtitle={capacity > 0 ? `${occupancy}% do total ocupado` : 'Vendas não iniciadas'}
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          badge="Bilheteria"
          badgeVariant="emerald"
        />

        <StatCard
          title="DATA DE REALIZAÇÃO"
          value={event.startAt ? formatDateTime(event.startAt).split(' ')[0] : 'A definir'}
          subtitle={event.startAt ? `Início: ${formatDateTime(event.startAt).split(' ')[1] || '00:00'}` : 'Data não agendada'}
          icon={<Calendar className="h-4 w-4 text-orange-400" />}
          badge="Agenda"
          badgeVariant="orange"
        />

        <StatCard
          title="LOCAL & CIDADE"
          value={event.city || 'Curitiba'}
          subtitle={event.venue || 'Local a definir'}
          icon={<MapPin className="h-4 w-4 text-purple-400" />}
          badge={event.state || 'PR'}
          badgeVariant="purple"
        />
      </div>

      {/* 3. Cross-Module Context Synchronization Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              Contexto Operacional Sincronizado Globalmente
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Ao selecionar <strong className="text-slate-200">{event.name || event.title}</strong>, todas as consultas nos módulos integrados (Documentos, Tarefas, Relatórios, Observabilidade) aplicarão automaticamente o filtro deste evento.
            </p>
          </div>
        </div>

        {onNavigateModule && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateModule('events', 'events-sessions')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-xs text-orange-300 font-semibold transition-colors"
            >
              <Calendar className="h-3.5 w-3.5 text-orange-400" />
              Sessões
            </button>
            <button
              onClick={() => onNavigateModule('events', 'events-sections')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs text-cyan-300 font-semibold transition-colors"
            >
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              Setores & Cota
            </button>
            <button
              onClick={() => onNavigateModule('events', 'events-batches')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-300 font-semibold transition-colors"
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Lotes & Preços
            </button>
            <button
              onClick={() => onNavigateModule('events', 'events-rules')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-xs text-purple-300 font-semibold transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
              Regras de Venda
            </button>
            <button
              onClick={() => onNavigateModule('events', 'events-channels')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-xs text-blue-300 font-semibold transition-colors"
            >
              <Globe className="h-3.5 w-3.5 text-blue-400" />
              Canais
            </button>
            <button
              onClick={() => onNavigateModule('events', 'events-complimentary')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-xs text-pink-300 font-semibold transition-colors"
            >
              <Gift className="h-3.5 w-3.5 text-pink-400" />
              Cortesias
            </button>
            <button
              onClick={() => onNavigateModule('events', 'events-team')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs text-amber-300 font-semibold transition-colors"
            >
              <Users className="h-3.5 w-3.5 text-amber-400" />
              Equipe
            </button>
            <button
              onClick={() => onNavigateModule('events', 'events-documents')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-xs text-teal-300 font-semibold transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-teal-400" />
              Documentos
            </button>
            <button
              onClick={() => onNavigateModule('events', 'events-tasks')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs text-indigo-300 font-semibold transition-colors"
            >
              <ListTodo className="h-3.5 w-3.5 text-indigo-400" />
              Pendências
            </button>
            <button
              onClick={() => onNavigateModule('events', 'events-readiness')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-xs text-orange-300 font-bold transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-orange-400" />
              Prontidão
            </button>
          </div>
        )}
      </div>

      {/* 4. Central de Prontidão Operacional (Readiness Engine) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                readiness?.status === 'READY'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : readiness?.status === 'BLOCKED'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              {readiness?.status === 'READY' ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : readiness?.status === 'BLOCKED' ? (
                <XCircle className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Central de Prontidão Operacional (Readiness Engine)</h3>
                <Badge
                  variant={
                    readiness?.status === 'READY'
                      ? 'emerald'
                      : readiness?.status === 'BLOCKED'
                      ? 'rose'
                      : 'amber'
                  }
                  size="sm"
                >
                  {readiness?.status === 'READY'
                    ? '100% Pronto para Venda'
                    : readiness?.status === 'BLOCKED'
                    ? 'Bloqueios Críticos Detectados'
                    : readiness?.status === 'WARNING'
                    ? 'Alertas Identificados'
                    : 'Avaliação Automática'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Auditoria contínua sobre alvarás, capacidade, canais, ingressos, equipe e pendências operacionais.
              </p>
            </div>
          </div>

          {onNavigateModule && (
            <button
              onClick={() => onNavigateModule('events', 'events-readiness')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition-all shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              Abrir Central de Prontidão
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {readiness && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40">
              <span className="text-[11px] text-slate-400 font-medium">Índice de Prontidão</span>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {readiness.scorePercentage}%
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    readiness.scorePercentage >= 80
                      ? 'bg-emerald-500'
                      : readiness.scorePercentage >= 50
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${readiness.scorePercentage}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40">
              <span className="text-[11px] text-slate-400 font-medium">Regras Conformadas</span>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                {readiness.summary.readyCount}{' '}
                <span className="text-xs text-slate-500">/ {readiness.summary.totalChecks}</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">critérios técnicos atendidos</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40">
              <span className="text-[11px] text-slate-400 font-medium">Bloqueios Críticos</span>
              <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                {readiness.summary.blockingCount}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">impedem abertura de vendas</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40">
              <span className="text-[11px] text-slate-400 font-medium">Avisos & Alertas</span>
              <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                {readiness.summary.warningCount}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">recomendações operacionais</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Publication Readiness Checklist */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-orange-400" />
              Checklist de Prontidão para Publicação do Evento
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Requisitos operacionais obrigatórios antes do envio para aprovação e abertura de vendas
            </p>
          </div>
          <Badge variant="emerald" size="sm">
            5 de 6 Etapas Concluídas
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-emerald-300">
                1. Cadastro Básico & Código
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Código <span className="font-mono text-slate-300">{event.publicCode}</span> gerado com sucesso.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-emerald-300">
                2. Sessões & Locais
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Venue <span className="text-slate-200">{event.venue || 'Local Definido'}</span> e sessão principal vinculados.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-emerald-300">
                3. Setores & Inventário
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Capacidade de <span className="font-mono text-slate-200">{formatNumber(capacity)}</span> lugares e pool atômico.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-emerald-300">
                4. Ingressos, Lotes & Preços
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Modalidades comerciais, lotes escalonados e matriz de preços em centavos.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-emerald-300">
                5. Regras & Limites de Venda
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Cota de meia-entrada (40% legal) e proteção anti-cambismo por CPF.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-start gap-3">
            <Clock className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-slate-300">
                6. Aprovação & Publicação
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Validação executiva de alçadas e publicação para venda pública.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Subphases Roadmap of Module Eventos */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              Arquitetura Operacional do Módulo EVENTOS (Fases 1.2.1 a 1.2.14)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Estrutura modular de negócio construída consumindo o Core transversal Disk Interno
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {EVENT_SUBPHASES.map((sub) => {
            const isCompleted = sub.status === 'COMPLETED';
            const isNext = sub.status === 'NEXT';

            return (
              <div
                key={sub.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : isNext
                    ? 'border-orange-500/40 bg-orange-500/5'
                    : 'border-slate-800/80 bg-slate-950/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-400">
                    Fase {sub.id}
                  </span>
                  <Badge
                    variant={isCompleted ? 'emerald' : isNext ? 'orange' : 'slate'}
                    size="sm"
                  >
                    {isCompleted ? 'Concluído' : isNext ? 'Próxima Etapa' : 'Planejado'}
                  </Badge>
                </div>

                <div className="text-xs font-bold text-white mt-1.5">
                  {sub.title}
                </div>

                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {sub.desc}
                </p>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">
                    {isCompleted
                      ? 'Integrado e operacional'
                      : 'Disponível na próxima etapa'}
                  </span>
                  {isNext && (
                    <span className="text-orange-400 font-semibold flex items-center">
                      Configurar em breve <ChevronRight className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
