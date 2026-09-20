import React, { useEffect, useState } from 'react';
import {
  Building2,
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Briefcase,
  AlertCircle,
  Plus,
  Edit2,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  CheckCircle2,
  ListTodo,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import {
  ProducerCommercialSummaryDTO,
  CommercialAccountDTO,
  ProducerContactDTO,
  CommercialActivityDTO,
  CommercialOpportunityDTO,
  CommercialPerformanceDTO,
  CommercialActivityType,
  CommercialStatus
} from '@shared/types/index';
import { CommercialApi } from '../api/commercial.api';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { StatCard } from '../../../shared/components/StatCard';
import { Modal } from '../../../shared/components/Modal';
import { formatCnpj, formatCurrency, formatDate, formatDateTime } from '../../../shared/utils/formatters';
import { ProducerProductsTab } from './components/ProducerProductsTab';

interface ProducerCommercialPageProps {
  producerId: string;
  onBack: () => void;
  onSelectOpportunity?: (opportunityId: string) => void;
  onSelectEvent?: (eventId: string) => void;
}

type TabType = 'resumo' | 'produtos' | 'eventos' | 'performance' | 'contatos' | 'oportunidades' | 'atividades' | 'pendencias';

export const ProducerCommercialPage: React.FC<ProducerCommercialPageProps> = ({
  producerId,
  onBack,
  onSelectOpportunity,
  onSelectEvent
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('resumo');

  // Summary data
  const [summary, setSummary] = useState<ProducerCommercialSummaryDTO | null>(null);
  const [account, setAccount] = useState<CommercialAccountDTO | null>(null);
  const [contacts, setContacts] = useState<ProducerContactDTO[]>([]);
  const [activities, setActivities] = useState<CommercialActivityDTO[]>([]);
  const [opportunities, setOpportunities] = useState<CommercialOpportunityDTO[]>([]);
  const [performance, setPerformance] = useState<CommercialPerformanceDTO | null>(null);

  // Modals state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Forms state
  const [activityForm, setActivityForm] = useState({
    type: 'MEETING' as CommercialActivityType,
    subject: '',
    description: '',
    nextActionDescription: '',
    nextActionAt: ''
  });
  const [opportunityForm, setOpportunityForm] = useState({
    title: '',
    businessType: 'NOVO_EVENTO',
    estimatedValue: '',
    expectedDecisionAt: '',
    description: ''
  });
  const [contactForm, setContactForm] = useState({
    name: '',
    roleTitle: '',
    email: '',
    phone: '',
    isPrimary: false,
    canNegotiate: false,
    notes: ''
  });
  const [editAccountForm, setEditAccountForm] = useState({
    commercialClassification: 'REGULAR',
    segmentId: 'SHOWS_FESTIVAIS',
    commercialStatus: 'ACTIVE' as CommercialStatus,
    notesSummary: ''
  });
  const [assignForm, setAssignForm] = useState({
    userId: '',
    role: 'PRIMARY' as const,
    notes: ''
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumRes, accRes, contRes, actRes, oppRes, perfRes] = await Promise.all([
        CommercialApi.getProducerSummary(producerId),
        CommercialApi.getCommercialAccount(producerId).catch(() => null),
        CommercialApi.listContacts(producerId).catch(() => []),
        CommercialApi.listActivities({ producerId }).catch(() => []),
        CommercialApi.listOpportunities({ producerId }).catch(() => []),
        CommercialApi.getPerformance({ producerId }).catch(() => null)
      ]);

      setSummary(sumRes);
      setAccount(accRes);
      setContacts(contRes);
      setActivities(actRes || []);
      setOpportunities(oppRes || []);
      setPerformance(perfRes);

      if (accRes) {
        setEditAccountForm({
          commercialClassification: accRes.commercialClassification || 'REGULAR',
          segmentId: accRes.segmentId || 'SHOWS_FESTIVAIS',
          commercialStatus: accRes.commercialStatus || 'ACTIVE',
          notesSummary: accRes.notesSummary || ''
        });
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar visão comercial do produtor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [producerId]);

  // Submit Activity
  const handleRegisterActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.subject.trim()) {
      setActionError('O assunto da atividade é obrigatório.');
      return;
    }
    try {
      setActionLoading(true);
      setActionError(null);
      await CommercialApi.registerActivity({
        producerId,
        type: activityForm.type,
        subject: activityForm.subject.trim(),
        description: activityForm.description.trim() || undefined,
        nextActionDescription: activityForm.nextActionDescription.trim() || undefined,
        nextActionAt: activityForm.nextActionAt ? new Date(activityForm.nextActionAt).toISOString() : undefined
      });
      setIsActivityModalOpen(false);
      setActivityForm({
        type: 'MEETING',
        subject: '',
        description: '',
        nextActionDescription: '',
        nextActionAt: ''
      });
      await loadAll();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao registrar atividade.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Opportunity
  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opportunityForm.title.trim()) {
      setActionError('O título da oportunidade é obrigatório.');
      return;
    }
    try {
      setActionLoading(true);
      setActionError(null);
      const estVal = opportunityForm.estimatedValue
        ? parseFloat(opportunityForm.estimatedValue.replace(/\./g, '').replace(',', '.'))
        : undefined;

      await CommercialApi.createOpportunity({
        title: opportunityForm.title.trim(),
        producerId,
        typeId: opportunityForm.businessType,
        estimatedValue: estVal,
        expectedDecisionAt: opportunityForm.expectedDecisionAt
          ? new Date(opportunityForm.expectedDecisionAt).toISOString()
          : undefined,
        description: opportunityForm.description.trim() || undefined
      });
      setIsOpportunityModalOpen(false);
      setOpportunityForm({
        title: '',
        businessType: 'NOVO_EVENTO',
        estimatedValue: '',
        expectedDecisionAt: '',
        description: ''
      });
      await loadAll();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao criar oportunidade.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Contact
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim()) {
      setActionError('Nome do contato é obrigatório.');
      return;
    }
    try {
      setActionLoading(true);
      setActionError(null);
      await CommercialApi.addContact(producerId, {
        name: contactForm.name.trim(),
        roleTitle: contactForm.roleTitle.trim() || undefined,
        email: contactForm.email.trim() || undefined,
        phone: contactForm.phone.trim() || undefined,
        isPrimary: contactForm.isPrimary,
        canNegotiate: contactForm.canNegotiate,
        notes: contactForm.notes.trim() || undefined
      });
      setIsContactModalOpen(false);
      setContactForm({
        name: '',
        roleTitle: '',
        email: '',
        phone: '',
        isPrimary: false,
        canNegotiate: false,
        notes: ''
      });
      await loadAll();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao adicionar contato.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Edit Account
  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setActionError(null);
      await CommercialApi.updateCommercialAccount(producerId, {
        commercialClassification: editAccountForm.commercialClassification,
        segmentId: editAccountForm.segmentId,
        commercialStatus: editAccountForm.commercialStatus,
        notesSummary: editAccountForm.notesSummary.trim() || undefined,
        expectedVersion: account?.version
      });
      setIsEditAccountModalOpen(false);
      await loadAll();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao atualizar conta comercial.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Assign Portfolio
  const handleAssignPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.userId.trim()) {
      setActionError('Informe o ID do responsável comercial.');
      return;
    }
    try {
      setActionLoading(true);
      setActionError(null);
      await CommercialApi.assignProducerToPortfolio({
        producerId,
        userId: assignForm.userId.trim(),
        role: assignForm.role,
        notes: assignForm.notes.trim() || undefined
      });
      setIsAssignModalOpen(false);
      await loadAll();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao atribuir carteira.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (st?: CommercialStatus | string) => {
    switch (st) {
      case 'ACTIVE':
      case 'ATIVO':
        return <Badge variant="emerald">Ativo</Badge>;
      case 'PROSPECT':
        return <Badge variant="cyan">Prospect</Badge>;
      case 'SUSPENDED':
      case 'SUSPENSO':
        return <Badge variant="rose">Suspenso</Badge>;
      case 'CLOSED':
        return <Badge variant="rose">Encerrado</Badge>;
      default:
        return <Badge variant="slate">Inativo</Badge>;
    }
  };

  const getClassificationBadge = (cl?: string) => {
    switch (cl) {
      case 'ESTRATEGICO':
        return <Badge variant="purple">Estratégico</Badge>;
      case 'KEY_ACCOUNT':
        return <Badge variant="orange">Key Account</Badge>;
      case 'NOVO':
        return <Badge variant="cyan">Novo</Badge>;
      case 'REGULAR':
        return <Badge variant="slate">Regular</Badge>;
      default:
        return <Badge variant="slate">Geral</Badge>;
    }
  };

  const getActivityTypeLabel = (t: CommercialActivityType) => {
    switch (t) {
      case 'MEETING':
        return { label: 'Reunião', variant: 'purple' as const, icon: <Briefcase className="h-3.5 w-3.5" /> };
      case 'CALL':
        return { label: 'Ligação', variant: 'cyan' as const, icon: <Phone className="h-3.5 w-3.5" /> };
      case 'WHATSAPP':
        return { label: 'WhatsApp', variant: 'emerald' as const, icon: <MessageSquare className="h-3.5 w-3.5" /> };
      case 'EMAIL':
        return { label: 'Email', variant: 'slate' as const, icon: <Mail className="h-3.5 w-3.5" /> };
      case 'VISIT':
        return { label: 'Visita Técnica', variant: 'orange' as const, icon: <Building2 className="h-3.5 w-3.5" /> };
      case 'FOLLOW_UP':
        return { label: 'Follow-up', variant: 'amber' as const, icon: <Clock className="h-3.5 w-3.5" /> };
      default:
        return { label: 'Anotação', variant: 'slate' as const, icon: <FileText className="h-3.5 w-3.5" /> };
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-400 mb-3" />
        <p className="text-sm">Carregando visão comercial do produtor...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={onBack} icon={<ArrowLeft className="h-4 w-4" />}>
          Voltar para Central de Produtores
        </Button>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-300">
          <ShieldAlert className="h-6 w-6 text-rose-400 mb-2" />
          <h2 className="font-semibold text-white">Não foi possível carregar o produtor</h2>
          <p className="text-xs text-rose-200 mt-1">{error || 'Produtor não encontrado ou acesso restrito.'}</p>
        </div>
      </div>
    );
  }

  const primaryOwner = summary.portfolio.find((a) => a.role === 'PRIMARY') || summary.portfolio[0];
  const isNextActionOverdue = summary.nextActionAt && new Date(summary.nextActionAt) < new Date();

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb / Back */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Voltar para Central de Produtores
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditAccountModalOpen(true)}
            icon={<Edit2 className="h-3.5 w-3.5" />}
          >
            Editar Conta
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsOpportunityModalOpen(true)}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            Nova Oportunidade
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsActivityModalOpen(true)}
            icon={<MessageSquare className="h-3.5 w-3.5" />}
          >
            Registrar Interação
          </Button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {summary.producer.name}
              </h1>
              {getStatusBadge(summary.commercialAccount?.commercialStatus || summary.producer.status)}
              {getClassificationBadge(summary.commercialAccount?.commercialClassification)}
              {summary.commercialAccount?.segmentId && (
                <Badge variant="slate" size="sm">
                  {summary.commercialAccount.segmentId}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="font-mono">CNPJ: {formatCnpj(summary.producer.cnpj)}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-orange-400" />
                Responsável:{' '}
                {primaryOwner?.userName ? (
                  <span className="font-semibold text-white">
                    {primaryOwner.userName}
                  </span>
                ) : (
                  <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="text-orange-400 hover:underline font-medium"
                  >
                    + Atribuir responsável
                  </button>
                )}
              </span>
              {primaryOwner && (
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="text-[11px] text-slate-500 hover:text-orange-400 underline ml-1"
                >
                  Alterar
                </button>
              )}
            </div>
          </div>

          {/* Quick Summary Pill / Next Action */}
          <div className="flex flex-col sm:flex-row gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <div className="pr-4 border-r border-slate-800/80">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Eventos no Catálogo
              </div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                <span className="text-emerald-400">{summary.activeEventsCount}</span>
                <span className="text-xs text-slate-500"> / {summary.eventsCount} total</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Próxima Ação Comercial
              </div>
              <div className="mt-0.5">
                {summary.nextActionAt ? (
                  <div className="flex items-center gap-1.5">
                    <Clock
                      className={`h-3.5 w-3.5 ${
                        isNextActionOverdue ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    />
                    <span
                      className={`text-xs font-mono font-semibold ${
                        isNextActionOverdue ? 'text-rose-400' : 'text-slate-200'
                      }`}
                    >
                      {formatDate(summary.nextActionAt)}
                    </span>
                    {isNextActionOverdue && (
                      <Badge variant="rose" size="sm">
                        Atrasada
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic">Nenhuma ação agendada</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-t border-slate-800 mt-6 pt-4 overflow-x-auto">
          {[
            { id: 'resumo', label: 'Resumo da Conta' },
            { id: 'produtos', label: 'Produtos Contratados & Limites' },
            { id: 'eventos', label: `Eventos (${performance?.events?.length || summary.eventsCount})` },
            { id: 'performance', label: 'Performance Comercial' },
            { id: 'contatos', label: `Contatos B2B (${contacts.length})` },
            { id: 'oportunidades', label: `Oportunidades (${opportunities.length})` },
            { id: 'atividades', label: `Histórico de Interações (${activities.length})` },
            { id: 'pendencias', label: `Pendências (${summary.pendingTasksCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Produtos Contratados & Limites (Fase 1.3.8) */}
      {activeTab === 'produtos' && (
        <ProducerProductsTab producerId={producerId} />
      )}

      {/* Tab 1: Resumo da Conta */}
      {activeTab === 'resumo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-orange-400" />
                Condições Comerciais & Parâmetros
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-500">Classificação Comercial</div>
                  <div className="mt-1">{getClassificationBadge(account?.commercialClassification)}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Segmento: {account?.segmentId || 'SHOWS_FESTIVAIS'}</div>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-500">Status da Conta</div>
                  <div className="mt-1">{getStatusBadge(account?.commercialStatus)}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Versão do registro: v{account?.version || 1}</div>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 sm:col-span-2">
                  <div className="text-slate-500">Resumo de Anotações Estratégicas</div>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    {account?.notesSummary || 'Nenhuma anotação cadastrada para esta conta comercial.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Performance Snapshot */}
            {performance && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Métricas Comerciais Consolidadas
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400">Volume Bruto Vendido</div>
                    <div className="text-lg font-bold font-mono text-white mt-1">
                      {formatCurrency(performance.summary.grossSales || 0)}
                    </div>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400">Ingressos Vendidos</div>
                    <div className="text-lg font-bold font-mono text-white mt-1">
                      {performance.summary.ticketsSold.toLocaleString('pt-BR')} un
                    </div>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400">Ticket Médio</div>
                    <div className="text-lg font-bold font-mono text-white mt-1">
                      {formatCurrency(performance.summary.averageOrderValue || 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Key Contact & Next Actions */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Interlocutor Primário
                </h3>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setIsContactModalOpen(true)}
                  icon={<UserPlus className="h-3 w-3" />}
                >
                  Adicionar
                </Button>
              </div>

              {contacts.find((c) => c.isPrimary) || contacts[0] ? (
                (() => {
                  const primary = contacts.find((c) => c.isPrimary) || contacts[0];
                  return (
                    <div className="space-y-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                      <div>
                        <div className="text-sm font-semibold text-white">{primary.name}</div>
                        <div className="text-xs text-orange-400">{primary.roleTitle || 'Representante'}</div>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-300">
                        {primary.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-slate-500" />
                            <a href={`mailto:${primary.email}`} className="hover:underline text-slate-200 truncate">
                              {primary.email}
                            </a>
                          </div>
                        )}
                        {primary.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-500" />
                            <span className="font-mono">{primary.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-xs text-slate-500 italic py-4 text-center">
                  Nenhum contato cadastrado ainda.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ações Rápidas
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setIsActivityModalOpen(true)}
                icon={<MessageSquare className="h-4 w-4 text-orange-400" />}
              >
                Registrar Atendimento / Reunião
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setIsOpportunityModalOpen(true)}
                icon={<Plus className="h-4 w-4 text-emerald-400" />}
              >
                Criar Oportunidade Comercial
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setIsContactModalOpen(true)}
                icon={<UserPlus className="h-4 w-4 text-cyan-400" />}
              >
                Cadastrar Contato B2B
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Eventos */}
      {activeTab === 'eventos' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg overflow-hidden backdrop-blur-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Eventos Realizados & Em Cartaz</h3>
            <span className="text-xs text-slate-400 font-mono">
              {performance?.events?.length || summary.eventsCount} eventos encontrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Capacidade</th>
                  <th className="px-4 py-3 text-center">Ingressos Vendidos</th>
                  <th className="px-4 py-3 text-right">Volume Bruto</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {!performance?.events || performance.events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      Nenhum evento registrado para este produtor no catálogo.
                    </td>
                  </tr>
                ) : (
                  performance.events.map((evt) => (
                    <tr key={evt.eventId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">
                        {evt.eventName}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={evt.status === 'PUBLISHED' || evt.status === 'ON_SALE' ? 'emerald' : 'slate'}
                          size="sm"
                        >
                          {evt.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-300">
                        {evt.capacity.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        {evt.ticketsSold.toLocaleString('pt-BR')} un ({evt.occupancyPercentage}%)
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        {formatCurrency(evt.grossSales || 0)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {onSelectEvent && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => onSelectEvent(evt.eventId)}
                            icon={<ExternalLink className="h-3 w-3" />}
                          >
                            Ver Evento
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Performance Comercial */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {performance ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Faturamento Bruto"
                  value={formatCurrency(performance.summary.grossSales || 0)}
                  subtitle="Vendas totais acumuladas"
                  icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
                />
                <StatCard
                  title="Ingressos Emitidos"
                  value={performance.summary.ticketsSold.toLocaleString('pt-BR')}
                  subtitle="Volume de público transacionado"
                  icon={<CheckCircle2 className="h-4 w-4 text-cyan-400" />}
                />
                <StatCard
                  title="Ticket Médio"
                  value={formatCurrency(performance.summary.averageOrderValue || 0)}
                  subtitle="Média por pedido"
                  icon={<TrendingUp className="h-4 w-4 text-orange-400" />}
                />
                <StatCard
                  title="Taxa de Ocupação"
                  value={`${performance.summary.commercialOccupancyPercentage}%`}
                  subtitle="Média ponderada do inventário"
                  badgeVariant="cyan"
                  icon={<AlertCircle className="h-4 w-4 text-cyan-400" />}
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                  Desempenho por Canal de Venda
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="pb-3">Canal</th>
                        <th className="pb-3 text-center">Ingressos</th>
                        <th className="pb-3 text-right">Volume</th>
                        <th className="pb-3 text-right">Participação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {performance.channels && performance.channels.length > 0 ? (
                        performance.channels.map((ch) => (
                          <tr key={ch.channelId} className="hover:bg-slate-800/30">
                            <td className="py-2.5 font-medium text-white">{ch.channelName}</td>
                            <td className="py-2.5 text-center font-mono text-slate-300">{ch.ticketsSold}</td>
                            <td className="py-2.5 text-right font-mono font-semibold text-emerald-400">
                              {formatCurrency(ch.grossSales || 0)}
                            </td>
                            <td className="py-2.5 text-right font-mono text-slate-400">
                              {performance.summary.grossSales && ch.grossSales
                                ? `${((ch.grossSales / performance.summary.grossSales) * 100).toFixed(1)}%`
                                : '0%'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-500">
                            Nenhum dado de canal disponível para o período selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">
              Nenhum dado consolidado de performance comercial disponível.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Contatos B2B */}
      {activeTab === 'contatos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white">Interlocutores da Conta Comercial</h3>
              <p className="text-xs text-slate-400">Contatos de produção, financeiro, marketing e direção da empresa</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsContactModalOpen(true)}
              icon={<Plus className="h-4 w-4" />}
            >
              Novo Contato
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                Nenhum contato B2B cadastrado para este produtor.
              </div>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 relative group hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white text-sm">{contact.name}</span>
                        {contact.isPrimary && (
                          <Badge variant="orange" size="sm">Principal</Badge>
                        )}
                        {contact.canNegotiate && (
                          <Badge variant="purple" size="sm">Pode Negociar</Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{contact.roleTitle || 'Representante Comercial'}</div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                        <span className="font-mono">{contact.phone}</span>
                      </div>
                    )}
                  </div>

                  {contact.notes && (
                    <div className="mt-3 text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded border border-slate-800/80">
                      {contact.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Oportunidades */}
      {activeTab === 'oportunidades' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white">Oportunidades Comerciais Vinculadas</h3>
              <p className="text-xs text-slate-400">Negociações de novos eventos, contratos de exclusividade ou renovações</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsOpportunityModalOpen(true)}
              icon={<Plus className="h-4 w-4" />}
            >
              Nova Oportunidade
            </Button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Código & Título</th>
                  <th className="px-4 py-3">Estágio do Funil</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Valor Estimado</th>
                  <th className="px-4 py-3">Previsão Fechamento</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {opportunities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      Nenhuma oportunidade cadastrada para este produtor.
                    </td>
                  </tr>
                ) : (
                  opportunities.map((opp) => (
                    <tr key={opp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{opp.title}</div>
                        <div className="text-[10px] text-orange-400 font-mono">{opp.publicCode}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="cyan" size="sm">{opp.stageName || 'Estágio Inicial'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            opp.status === 'WON'
                              ? 'emerald'
                              : opp.status === 'CLOSED'
                              ? 'rose'
                              : 'amber'
                          }
                          size="sm"
                        >
                          {opp.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        {opp.estimatedValue ? formatCurrency(opp.estimatedValue) : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {opp.expectedDecisionAt ? formatDate(opp.expectedDecisionAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {onSelectOpportunity && (
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => onSelectOpportunity(opp.id)}
                            icon={<ChevronRight className="h-3.5 w-3.5" />}
                          >
                            Ver Detalhes
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Atividades & Histórico */}
      {activeTab === 'atividades' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white">Histórico de Atendimentos & Contatos</h3>
              <p className="text-xs text-slate-400">Registro cronológico de reuniões, telefonemas e alinhamentos comerciais</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsActivityModalOpen(true)}
              icon={<MessageSquare className="h-4 w-4" />}
            >
              Registrar Nova Interação
            </Button>
          </div>

          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                Nenhuma atividade comercial registrada até o momento.
              </div>
            ) : (
              activities.map((act) => {
                const typeInfo = getActivityTypeLabel(act.type);
                return (
                  <div
                    key={act.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant={typeInfo.variant} size="sm">
                          <span className="flex items-center gap-1">
                            {typeInfo.icon}
                            {typeInfo.label}
                          </span>
                        </Badge>
                        <span className="text-sm font-semibold text-white">{act.subject}</span>
                      </div>
                      {act.description && (
                        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                          {act.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Registrado por: <strong className="text-slate-400">{act.createdByName || 'Comercial'}</strong></span>
                        <span>•</span>
                        <span className="font-mono">{formatDateTime(act.createdAt)}</span>
                      </div>
                    </div>

                    {act.nextActionDescription && (
                      <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg text-xs min-w-[220px]">
                        <div className="text-[10px] uppercase font-bold text-orange-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Próxima Ação Gerada
                        </div>
                        <div className="font-medium text-slate-200 mt-0.5">{act.nextActionDescription}</div>
                        {act.nextActionAt && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            Prazo: {formatDate(act.nextActionAt)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 7: Pendências */}
      {activeTab === 'pendencias' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center space-y-3">
          <ListTodo className="h-10 w-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Tarefas & Pendências da Central de Trabalho</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Todas as pendências operacionais e comerciais vinculadas a este produtor são orquestradas pelo Core Task Engine.
          </p>
          <div className="pt-2">
            <Badge variant="amber">
              {summary.pendingTasksCount} tarefas abertas no Core
            </Badge>
          </div>
        </div>
      )}

      {/* Modal: Registrar Atividade */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-orange-400" />
            <span>Registrar Interação Comercial</span>
          </div>
        }
        size="lg"
      >
        <form onSubmit={handleRegisterActivity} className="space-y-4">
          {actionError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tipo de Interação <span className="text-orange-400">*</span>
              </label>
              <select
                value={activityForm.type}
                onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as CommercialActivityType })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="MEETING">Reunião Presencial / Online</option>
                <option value="CALL">Ligação Telefônica</option>
                <option value="WHATSAPP">Contato via WhatsApp</option>
                <option value="EMAIL">Email Formal</option>
                <option value="VISIT">Visita Técnica</option>
                <option value="FOLLOW_UP">Follow-up / Acompanhamento</option>
                <option value="NOTE">Anotação Interna</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Assunto <span className="text-orange-400">*</span>
              </label>
              <input
                type="text"
                required
                value={activityForm.subject}
                onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                placeholder="Ex: Alinhamento de taxas e datas do festival"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descrição detalhada da conversa
            </label>
            <textarea
              rows={3}
              value={activityForm.description}
              onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
              placeholder="Principais pontos acordados, solicitações do produtor e impressões gerais..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Sincronizar Próxima Ação (Core Task Engine)
            </div>
            <p className="text-[11px] text-slate-400">
              Opcional: cria automaticamente uma tarefa acionável na Central de Trabalho com alerta de prazo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Título da Próxima Ação
                </label>
                <input
                  type="text"
                  value={activityForm.nextActionDescription}
                  onChange={(e) => setActivityForm({ ...activityForm, nextActionDescription: e.target.value })}
                  placeholder="Ex: Enviar minuta revisada do contrato"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Data Limite (Deadline)
                </label>
                <input
                  type="date"
                  value={activityForm.nextActionAt}
                  onChange={(e) => setActivityForm({ ...activityForm, nextActionAt: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsActivityModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={actionLoading}
            >
              Registrar Atividade
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Nova Oportunidade */}
      <Modal
        isOpen={isOpportunityModalOpen}
        onClose={() => setIsOpportunityModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-orange-400" />
            <span>Nova Oportunidade Comercial</span>
          </div>
        }
        size="lg"
      >
        <form onSubmit={handleCreateOpportunity} className="space-y-4">
          {actionError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Título da Oportunidade <span className="text-orange-400">*</span>
            </label>
            <input
              type="text"
              required
              value={opportunityForm.title}
              onChange={(e) => setOpportunityForm({ ...opportunityForm, title: e.target.value })}
              placeholder="Ex: Turnê Acústica 2026 - Exclusividade Curitiba"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tipo de Negócio
              </label>
              <select
                value={opportunityForm.businessType}
                onChange={(e) => setOpportunityForm({ ...opportunityForm, businessType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="NOVO_EVENTO">Novo Evento</option>
                <option value="RENOVACAO">Renovação</option>
                <option value="EXCLUSIVIDADE">Exclusividade</option>
                <option value="UPSELL">Upsell de Serviços</option>
                <option value="RECUPERACAO">Recuperação</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Valor Estimado de Venda (R$)
              </label>
              <input
                type="text"
                value={opportunityForm.estimatedValue}
                onChange={(e) => setOpportunityForm({ ...opportunityForm, estimatedValue: e.target.value })}
                placeholder="Ex: 150.000,00"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Previsão de Decisão
              </label>
              <input
                type="date"
                value={opportunityForm.expectedDecisionAt}
                onChange={(e) => setOpportunityForm({ ...opportunityForm, expectedDecisionAt: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Contexto da Negociação
            </label>
            <textarea
              rows={3}
              value={opportunityForm.description}
              onChange={(e) => setOpportunityForm({ ...opportunityForm, description: e.target.value })}
              placeholder="Escopo do evento, locais cogitados, expectativa de público..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpportunityModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={actionLoading}
            >
              Criar Oportunidade
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Adicionar Contato */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-orange-400" />
            <span>Adicionar Interlocutor B2B</span>
          </div>
        }
        size="md"
      >
        <form onSubmit={handleAddContact} className="space-y-4">
          {actionError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nome Completo <span className="text-orange-400">*</span>
            </label>
            <input
              type="text"
              required
              value={contactForm.name}
              onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
              placeholder="Ex: Mariana Silva"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Cargo / Função
              </label>
              <input
                type="text"
                value={contactForm.roleTitle}
                onChange={(e) => setContactForm({ ...contactForm, roleTitle: e.target.value })}
                placeholder="Ex: Gerente Geral de Produção"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Telefone / Celular
              </label>
              <input
                type="text"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                placeholder="(41) 99999-8888"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Comercial
            </label>
            <input
              type="email"
              value={contactForm.email}
              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              placeholder="mariana@empresa.com.br"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-6 py-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={contactForm.isPrimary}
                onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-orange-500"
              />
              Contato Principal da Conta
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={contactForm.canNegotiate}
                onChange={(e) => setContactForm({ ...contactForm, canNegotiate: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-orange-500"
              />
              Tomador de Decisão / Pode Negociar
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Notas Adicionais
            </label>
            <input
              type="text"
              value={contactForm.notes}
              onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
              placeholder="Preferência de horário, canal favorito..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsContactModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={actionLoading}
            >
              Salvar Contato
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Conta Comercial */}
      <Modal
        isOpen={isEditAccountModalOpen}
        onClose={() => setIsEditAccountModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-orange-400" />
            <span>Editar Parâmetros da Conta Comercial</span>
          </div>
        }
        size="md"
      >
        <form onSubmit={handleUpdateAccount} className="space-y-4">
          {actionError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Status Comercial
              </label>
              <select
                value={editAccountForm.commercialStatus}
                onChange={(e) => setEditAccountForm({ ...editAccountForm, commercialStatus: e.target.value as CommercialStatus })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="ACTIVE">Ativo</option>
                <option value="PROSPECT">Prospect</option>
                <option value="SUSPENDED">Suspenso</option>
                <option value="CLOSED">Encerrado</option>
                <option value="INACTIVE">Inativo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Classificação
              </label>
              <select
                value={editAccountForm.commercialClassification}
                onChange={(e) => setEditAccountForm({ ...editAccountForm, commercialClassification: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="ESTRATEGICO">Estratégico</option>
                <option value="KEY_ACCOUNT">Key Account</option>
                <option value="REGULAR">Regular</option>
                <option value="NOVO">Novo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Segmento
            </label>
            <select
              value={editAccountForm.segmentId}
              onChange={(e) => setEditAccountForm({ ...editAccountForm, segmentId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="SHOWS_FESTIVAIS">Shows & Festivais</option>
              <option value="TEATRO_CULTURA">Teatro & Cultura</option>
              <option value="CORPORATIVO">Corporativo</option>
              <option value="ESPORTIVO">Esportivo</option>
              <option value="RELIGIOSO">Religioso</option>
              <option value="OUTRO">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Notas e Acordos Internos
            </label>
            <textarea
              rows={3}
              value={editAccountForm.notesSummary}
              onChange={(e) => setEditAccountForm({ ...editAccountForm, notesSummary: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditAccountModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={actionLoading}
            >
              Atualizar Conta
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Atribuir Carteira */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-orange-400" />
            <span>Atribuir Responsável Comercial</span>
          </div>
        }
        size="sm"
      >
        <form onSubmit={handleAssignPortfolio} className="space-y-4">
          {actionError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              ID do Usuário Comercial
            </label>
            <input
              type="text"
              required
              value={assignForm.userId}
              onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
              placeholder="Ex: usr-admin-1"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Papel na Conta
            </label>
            <select
              value={assignForm.role}
              onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="PRIMARY">Responsável Principal (Primary Owner)</option>
              <option value="SUPPORT">Suporte Comercial (Support)</option>
              <option value="MANAGER">Gerente da Conta (Manager)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Motivo da Atribuição / Transferência
            </label>
            <input
              type="text"
              value={assignForm.notes}
              onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
              placeholder="Ex: Reorganização de carteira regional"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={actionLoading}
            >
              Confirmar Atribuição
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
