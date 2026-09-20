import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  ChevronLeft,
  Calendar,
  Building2,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  GitCompare,
  Printer,
  Copy,
  Layers,
  RefreshCw,
  Plus,
  Eye,
  DollarSign,
  Info,
  Check,
  Hash,
  FileSignature
} from 'lucide-react';
import {
  CommercialProposalDTO,
  CommercialProposalVersionDTO,
  ProposalCommercialTermDTO,
  ProposalEventReferenceDTO,
  CommercialProposalStatus
} from '@shared/types/index';
import { CommercialApi } from '../api/commercial.api';
import { ProposalStatusBadge } from './ProposalStatusBadge';
import { ProposalDiffModal } from './ProposalDiffModal';
import {
  ProposalAcceptModal,
  ProposalDeclineModal,
  ProposalSendModal,
  ProposalApprovalModal,
  ProposalSubmitApprovalModal,
  ProposalCancelModal,
  ProposalCreateVersionModal
} from './ProposalActionModals';
import { Button } from '../../../shared/components/Button';
import { formatDate, formatDateTime, formatCurrency } from '../../../shared/utils/formatters';

interface ProposalDetailsPageProps {
  proposalId: string;
  onBack: () => void;
  onSelectProducer?: (producerId: string) => void;
  onSelectOpportunity?: (opportunityId: string) => void;
  onGenerateContract?: (proposalId: string) => void;
}

type TabType = 'overview' | 'terms' | 'events' | 'versions' | 'document' | 'approvals' | 'deliveries';

export const ProposalDetailsPage: React.FC<ProposalDetailsPageProps> = ({
  proposalId,
  onBack,
  onSelectProducer,
  onSelectOpportunity,
  onGenerateContract
}) => {
  const [proposal, setProposal] = useState<CommercialProposalDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Selected version for inspection (defaults to activeVersion)
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(null);

  // Modals state
  const [isSubmitApprovalOpen, setIsSubmitApprovalOpen] = useState(false);
  const [isApprovalDecisionOpen, setIsApprovalDecisionOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCreateVersionOpen, setIsCreateVersionOpen] = useState(false);

  // Diff Modal state
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [diffBase, setDiffBase] = useState<number>(1);
  const [diffTarget, setDiffTarget] = useState<number>(2);

  // Document preview state
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [docContent, setDocContent] = useState<string | null>(null);
  const [docChecksum, setDocChecksum] = useState<string | null>(null);

  // Copy feedback
  const [copiedHash, setCopiedHash] = useState(false);

  const loadProposal = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CommercialApi.getProposalById(proposalId);
      setProposal(data);
      if (!selectedVersionNumber && data.currentVersionNumber) {
        setSelectedVersionNumber(data.currentVersionNumber);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes da proposta comercial.');
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    loadProposal();
  }, [loadProposal]);

  if (loading && !proposal) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mb-3" />
        <p className="text-sm">Carregando detalhes da proposta comercial...</p>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex p-3 rounded-full bg-rose-500/10 text-rose-400 mb-3">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Erro ao carregar proposta</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">{error || 'Proposta não encontrada.'}</p>
        <Button onClick={onBack} variant="outline" size="sm">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar para Lista
        </Button>
      </div>
    );
  }

  // Active / displayed version
  const currentVer = proposal.versions?.find((v) => v.versionNumber === selectedVersionNumber) || proposal.currentVersion || proposal.versions?.[0];
  const terms: ProposalCommercialTermDTO[] = currentVer?.terms || [];
  const events: ProposalEventReferenceDTO[] = currentVer?.events || [];
  const activeVerNum = proposal.currentVersionNumber || 1;

  // Concurrency lock
  const expectedVersion = proposal.version || 1;

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleGenerateDocument = async () => {
    try {
      setGeneratingDoc(true);
      const res = await CommercialApi.generateProposalDocument(proposal.id, currentVer?.versionNumber || activeVerNum);
      setDocContent(res.htmlContent);
      setDocChecksum(res.documentChecksum);
      setActiveTab('document');
      loadProposal();
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar documento formal.');
    } finally {
      setGeneratingDoc(false);
    }
  };

  const handlePrintDocument = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && docContent) {
      printWindow.document.write(docContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const formatModel = (model?: string) => {
    switch (model) {
      case 'PERCENTAGE': return 'Percentual de Vendas';
      case 'FIXED_PER_TICKET': return 'Fixo por Ingresso Emitido';
      case 'FIXED_PER_EVENT': return 'Fixo por Evento';
      case 'TIERED': return 'Escalonado por Volume';
      case 'HYBRID': return 'Misto / Híbrido';
      default: return model || 'Geral';
    }
  };

  const isExpiringSoon = () => {
    const validUntil = currentVer?.validUntil || proposal.validUntil;
    if (!validUntil) return false;
    const diffDays = Math.ceil((new Date(validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 5;
  };

  const isExpired = () => {
    if (proposal.status === 'EXPIRED') return true;
    const validUntil = currentVer?.validUntil || proposal.validUntil;
    if (!validUntil) return false;
    return new Date(validUntil).getTime() < new Date().getTime();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb / Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para Central de Propostas
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadProposal}
            className="border-slate-800 text-slate-400 hover:text-white h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Recarregar
          </Button>
        </div>
      </div>

      {/* Header Banner & Status */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 relative z-10">
          {/* Main Info */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xl font-bold text-white tracking-wide">
                {proposal.publicCode}
              </span>
              <span className="rounded bg-slate-800 px-2.5 py-1 text-xs font-mono font-semibold text-slate-200 border border-slate-700 flex items-center gap-1">
                <Layers className="h-3 w-3 text-orange-400" />
                Versão v{currentVer?.versionNumber || activeVerNum}
              </span>
              <ProposalStatusBadge status={proposal.status} />
              <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-semibold text-orange-400 border border-orange-500/20">
                B2B DiskIngressos
              </span>
            </div>

            <h1 className="text-xl font-bold text-slate-100">{proposal.title}</h1>

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-slate-500" />
                <span>Produtor: </span>
                <strong
                  className="text-slate-200 hover:text-orange-400 transition-colors cursor-pointer"
                  onClick={() => onSelectProducer && onSelectProducer(proposal.producerId)}
                >
                  {proposal.producerName || 'Produtor B2B'}
                </strong>
                {(proposal as any).producerDocument && (
                  <span className="text-slate-500">({(proposal as any).producerDocument})</span>
                )}
              </div>

              {proposal.opportunityTitle && (
                <div className="flex items-center gap-1.5">
                  <span>🎯 Oportunidade:</span>
                  <strong
                    className="text-orange-400/90 hover:underline cursor-pointer"
                    onClick={() => onSelectOpportunity && proposal.opportunityId && onSelectOpportunity(proposal.opportunityId)}
                  >
                    {proposal.opportunityTitle}
                  </strong>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span>Validade: </span>
                <strong className={isExpired() ? 'text-rose-400' : isExpiringSoon() ? 'text-amber-400' : 'text-slate-200'}>
                  {(currentVer?.validUntil || proposal.validUntil) ? formatDate(currentVer?.validUntil || proposal.validUntil) : 'Não especificada'}
                </strong>
              </div>

              {/* Canonical Hash badge */}
              {currentVer?.contentHash && (
                <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 text-[11px] font-mono text-slate-400">
                  <Hash className="h-3 w-3 text-slate-500" />
                  <span>sha: {currentVer.contentHash.slice(0, 16)}...</span>
                  <button
                    onClick={() => handleCopyHash(currentVer.contentHash!)}
                    title="Copiar Hash Canônico SHA-256"
                    className="hover:text-white transition-colors"
                  >
                    {copiedHash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Draft Actions */}
            {proposal.status === 'DRAFT' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsSubmitApprovalOpen(true)}
                  className="bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                >
                  <ShieldCheck className="h-4 w-4 mr-1.5" />
                  Submeter Alçada
                </Button>

                <Button
                  size="sm"
                  onClick={() => setIsSendOpen(true)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20"
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  Enviar ao Produtor
                </Button>
              </>
            )}

            {/* Internal Approval Actions */}
            {proposal.status === 'APPROVAL_PENDING' && (
              <Button
                size="sm"
                onClick={() => setIsApprovalDecisionOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
              >
                <ShieldCheck className="h-4 w-4 mr-1.5" />
                Decidir Alçada
              </Button>
            )}

            {/* Internal Approved Actions */}
            {(proposal.status === 'APPROVED' || proposal.status === 'READY_TO_SEND') && (
              <Button
                size="sm"
                onClick={() => setIsSendOpen(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20"
              >
                <Send className="h-4 w-4 mr-1.5" />
                Enviar ao Produtor
              </Button>
            )}

            {/* Sent Actions */}
            {proposal.status === 'SENT' && (
              <>
                <Button
                  size="sm"
                  onClick={() => setIsAcceptOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 font-semibold"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Registrar Aceite
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDeclineOpen(true)}
                  className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Recusa
                </Button>
              </>
            )}

            {/* Accepted Actions: Generate Contract */}
            {proposal.status === 'ACCEPTED' && (
              <Button
                size="sm"
                onClick={() => onGenerateContract?.(proposal.id)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20"
              >
                <FileSignature className="h-4 w-4 mr-1.5" />
                Gerar Contrato Comercial
              </Button>
            )}

            {/* Document Generation */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateDocument}
              disabled={generatingDoc}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <FileText className={`h-4 w-4 mr-1.5 ${generatingDoc ? 'animate-spin' : ''}`} />
              {currentVer?.documentId ? 'Ver Documento' : 'Gerar Documento'}
            </Button>

            {/* Create New Version (available on all except CANCELLED) */}
            {proposal.status !== 'CANCELLED' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreateVersionOpen(true)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                title="Criar nova versão com versionamento imutável"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova Versão
              </Button>
            )}

            {/* Cancel Proposal */}
            {proposal.status !== 'ACCEPTED' && proposal.status !== 'CANCELLED' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsCancelOpen(true)}
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 px-2"
                title="Cancelar Proposta"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Status Alerts Banners */}
        {proposal.status === 'ACCEPTED' && (
          <div className="mt-5 p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-emerald-300 block text-sm">
                Proposta Aceita Formalmente pelo Produtor!
              </strong>
              <p className="text-slate-300">
                Condições comerciais formalizadas e aprovadas. Esta proposta está pronta para a celebração do contrato jurídico formal (Fase posterior 1.3.6).
              </p>
              <p className="text-emerald-400 font-semibold pt-1 border-t border-emerald-900/60 text-[11px]">
                Regra de Domínio: O aceite comercial formal NÃO gera repasse, borderô financeiro nem cria eventos operacionais na grade automaticamente.
              </p>
            </div>
          </div>
        )}

        {proposal.status === 'APPROVAL_PENDING' && (
          <div className="mt-5 p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <strong>Aguardando Decisão da Alçada Comercial:</strong> Versão v{activeVerNum} submetida à aprovação da diretoria com restrição de Maker-Checker.
            </div>
          </div>
        )}

        {isExpired() && proposal.status !== 'ACCEPTED' && (
          <div className="mt-5 p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
              <span>Esta proposta atingiu a data limite de validade. Para prosseguir a negociação, gere uma nova versão com validade estendida.</span>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateVersionOpen(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-7 ml-3 shrink-0"
            >
              Renovar Versão
            </Button>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-orange-500 text-orange-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Info className="h-4 w-4" />
          Resumo Geral
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'terms'
              ? 'border-orange-500 text-orange-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Condições Comerciais ({terms.length})
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'events'
              ? 'border-orange-500 text-orange-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Eventos Abrangidos ({events.length})
        </button>

        <button
          onClick={() => setActiveTab('versions')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'versions'
              ? 'border-orange-500 text-orange-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          Versões & Histórico ({proposal.versions?.length || 1})
        </button>

        <button
          onClick={() => setActiveTab('document')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'document'
              ? 'border-orange-500 text-orange-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          Documento Formal
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'approvals'
              ? 'border-orange-500 text-orange-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Alçadas & Aprovações
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'deliveries'
              ? 'border-orange-500 text-orange-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="h-4 w-4" />
          Envios & Aceite
        </button>
      </div>

      {/* TAB CONTENT: Resumo Geral */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Box: Detalhes do Negócio */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Objeto e Escopo da Negociação
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {proposal.description || 'Nenhuma descrição detalhada informada.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block">Modelo Comercial Principal:</span>
                  <strong className="text-slate-200 text-sm">{formatModel(currentVer?.commercialModel || 'STANDARD')}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Tipo de Negociação:</span>
                  <strong className="text-slate-200 text-sm">B2B Produtor de Eventos</strong>
                </div>
              </div>
            </div>

            {/* Box: Vigência e Datas */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Prazos & Vigência
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Data de Criação</span>
                  <strong className="text-slate-200">{formatDate(proposal.createdAt)}</strong>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Validade Comercial</span>
                  <strong className="text-slate-200">
                    {(currentVer?.validUntil || proposal.validUntil) ? formatDate(currentVer?.validUntil || proposal.validUntil) : 'Indeterminada'}
                  </strong>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Vigência Proposta</span>
                  <strong className="text-slate-200">
                    {proposal.validUntil ? `Até ${formatDate(proposal.validUntil)}` : 'Por evento'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Box: Observações */}
            {proposal.notes && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Notas Internas
                </h3>
                <p className="text-xs text-slate-400 whitespace-pre-line">{proposal.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column: Cards Rápidos */}
          <div className="space-y-6">
            {/* Produtor Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Produtor Parceiro</h3>
                <Building2 className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <h4
                  className="font-bold text-white hover:text-orange-400 cursor-pointer transition-colors"
                  onClick={() => onSelectProducer && onSelectProducer(proposal.producerId)}
                >
                  {proposal.producerName || 'Produtor B2B'}
                </h4>
                {(proposal as any).producerDocument && (
                  <p className="text-xs text-slate-400 mt-0.5">{(proposal as any).producerDocument}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
                onClick={() => onSelectProducer && onSelectProducer(proposal.producerId)}
              >
                Ver Ficha do Produtor
              </Button>
            </div>

            {/* Oportunidade Vinculada */}
            {proposal.opportunityId && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Oportunidade CRM</h3>
                  <span className="text-xs">🎯</span>
                </div>
                <h4
                  className="font-bold text-white hover:text-orange-400 cursor-pointer transition-colors"
                  onClick={() => onSelectOpportunity && onSelectOpportunity(proposal.opportunityId!)}
                >
                  {proposal.opportunityTitle}
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
                  onClick={() => onSelectOpportunity && onSelectOpportunity(proposal.opportunityId!)}
                >
                  Ver Pipeline / Oportunidade
                </Button>
              </div>
            )}

            {/* Integridade & Versionamento */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 text-xs">
              <h3 className="font-semibold text-slate-400 uppercase tracking-wider">Governança Canônica</h3>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Versão Ativa:</span>
                  <span className="font-mono font-bold">v{activeVerNum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Versões Totais:</span>
                  <span>{proposal.versions?.length || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Imutabilidade:</span>
                  <span className="text-emerald-400 font-semibold">Ativa (SHA-256)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Condições Comerciais */}
      {activeTab === 'terms' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Taxas & Serviços Negociados</h3>
              <p className="text-xs text-slate-400">
                Condições comerciais válidas para a versão v{currentVer?.versionNumber || activeVerNum}.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/40 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3 font-medium">Serviço / Oferta</th>
                    <th className="px-5 py-3 font-medium">Tipo de Cobrança</th>
                    <th className="px-5 py-3 font-medium">Taxa / Valor</th>
                    <th className="px-5 py-3 font-medium">Base de Cálculo</th>
                    <th className="px-5 py-3 font-medium">Quem Paga</th>
                    <th className="px-5 py-3 font-medium">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {terms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        Nenhum termo comercial cadastrado nesta versão.
                      </td>
                    </tr>
                  ) : (
                    terms.map((term, idx) => (
                      <tr key={term.id || idx} className="hover:bg-slate-800/30">
                        <td className="px-5 py-3 font-semibold text-white">
                          {term.offeringName || term.name || 'Serviço'}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 border border-slate-700">
                            {term.calculationType === 'PERCENTAGE'
                              ? 'Percentual'
                              : term.calculationType === 'FIXED_AMOUNT'
                              ? 'Fixo'
                              : term.calculationType === 'PER_TICKET'
                              ? 'Fixo / Ingresso'
                              : term.calculationType}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono font-bold text-orange-400">
                          {term.percentage !== null && term.percentage !== undefined
                            ? `${term.percentage}%`
                            : term.amount !== null && term.amount !== undefined
                            ? formatCurrency(term.amount)
                            : '-'}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-300">
                          {term.calculationType || 'PERCENTAGE'}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              term.payer === 'BUYER'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            }`}
                          >
                            {term.payer === 'BUYER' ? 'Comprador Final' : 'Produtor (B2B)'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-400 max-w-xs truncate" title={term.conditions || ''}>
                          {term.conditions || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Eventos Abrangidos */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Eventos Abrangidos no Escopo</h3>
              <p className="text-xs text-slate-400">
                Projeção comercial e estimativa de VGV para dimensionamento das condições.
              </p>
            </div>
          </div>

          <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg text-xs text-amber-300/90 flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              <strong>Importante (Regra de Domínio):</strong> O vínculo de eventos nesta fase é estritamente uma referência para elaboração da proposta comercial. A criação efetiva de sessões e setores na grade operacional ocorre após o contrato formal assinado.
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/40 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3 font-medium">Nome do Evento</th>
                    <th className="px-5 py-3 font-medium">Local / Praça</th>
                    <th className="px-5 py-3 font-medium">Data Prevista</th>
                    <th className="px-5 py-3 font-medium">Público Estimado</th>
                    <th className="px-5 py-3 font-medium">VGV Projetado</th>
                    <th className="px-5 py-3 font-medium">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        Nenhum evento referenciado diretamente nesta versão (proposta por catálogo geral).
                      </td>
                    </tr>
                  ) : (
                    events.map((ev, idx) => (
                      <tr key={ev.id || idx} className="hover:bg-slate-800/30">
                        <td className="px-5 py-3 font-semibold text-white">{ev.estimatedEventName || ev.eventName || 'Evento'}</td>
                        <td className="px-5 py-3 text-xs text-slate-300">{ev.estimatedVenue || 'A definir'}</td>
                        <td className="px-5 py-3 text-xs text-slate-300">
                          {ev.estimatedDate ? formatDate(ev.estimatedDate) : 'A definir'}
                        </td>
                        <td className="px-5 py-3 text-xs font-mono">
                          {ev.estimatedTickets ? `${ev.estimatedTickets.toLocaleString('pt-BR')} ingressos` : '-'}
                        </td>
                        <td className="px-5 py-3 text-xs font-mono font-bold text-orange-400">
                          {ev.estimatedGrossRevenue ? formatCurrency(ev.estimatedGrossRevenue) : '-'}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-400 max-w-xs truncate">
                          -
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Versões & Histórico (Versionamento Imutável) */}
      {activeTab === 'versions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Histórico de Versões Imutáveis</h3>
              <p className="text-xs text-slate-400">
                Cada versão possui um hash criptográfico SHA-256 determinístico. Nenhuma versão enviada ou aprovada é sobrescrita.
              </p>
            </div>

            {proposal.versions && proposal.versions.length >= 2 && (
              <Button
                size="sm"
                onClick={() => {
                  setDiffBase(1);
                  setDiffTarget(proposal.versions!.length);
                  setIsDiffOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
              >
                <GitCompare className="h-4 w-4 mr-1.5" />
                Comparar Versões
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {proposal.versions?.map((ver) => {
              const isSelected = (ver.versionNumber === (currentVer?.versionNumber || activeVerNum));
              const isActive = (ver.versionNumber === activeVerNum);

              return (
                <div
                  key={ver.id || ver.versionNumber}
                  className={`rounded-xl border p-5 transition-all ${
                    isSelected
                      ? 'border-orange-500/60 bg-slate-900/90 shadow-lg shadow-orange-500/5'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-base font-bold text-white">
                          Versão v{ver.versionNumber}
                        </span>
                        {isActive && (
                          <span className="rounded bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-400 border border-orange-500/20">
                            Versão Vigente
                          </span>
                        )}
                        <ProposalStatusBadge status={ver.status} />
                      </div>

                      <p className="text-xs text-slate-300">
                        {ver.changeSummary || 'Versão inicial formalizada.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span>Criado em: {formatDateTime(ver.createdAt)}</span>
                        {ver.validUntil && <span>Válida até: {formatDate(ver.validUntil)}</span>}
                        {ver.terms && <span>{ver.terms.length} condições comerciais</span>}
                        {ver.events && <span>{ver.events.length} eventos vinculados</span>}
                      </div>

                      {/* Hash SHA-256 */}
                      {ver.contentHash && (
                        <div className="flex items-center gap-2 pt-1 font-mono text-xs text-slate-400">
                          <span className="text-slate-600">SHA-256:</span>
                          <span className="bg-slate-950 px-2 py-0.5 rounded text-slate-300 select-all">
                            {ver.contentHash}
                          </span>
                          <button
                            onClick={() => handleCopyHash(ver.contentHash)}
                            title="Copiar Hash"
                            className="hover:text-white"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isSelected ? 'primary' : 'outline'}
                        onClick={() => setSelectedVersionNumber(ver.versionNumber)}
                        className={isSelected ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'border-slate-700 text-slate-300'}
                      >
                        {isSelected ? 'Visualizando' : 'Inspecionar'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Documento Formal */}
      {activeTab === 'document' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Documento Formal da Proposta</h3>
              <p className="text-xs text-slate-400">
                Minuta oficial com cabeçalho institucional DiskIngressos, checksum criptográfico e campos de aceite.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateDocument}
                disabled={generatingDoc}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${generatingDoc ? 'animate-spin' : ''}`} />
                Atualizar Minuta
              </Button>

              {docContent && (
                <Button
                  size="sm"
                  onClick={handlePrintDocument}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Printer className="h-4 w-4 mr-1.5" />
                  Imprimir / Salvar PDF
                </Button>
              )}
            </div>
          </div>

          {/* Checksum header */}
          {(docChecksum || currentVer?.contentHash) && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>Checksum de Integridade do Documento:</span>
              <strong className="text-orange-400 select-all">
                {docChecksum || currentVer?.contentHash}
              </strong>
            </div>
          )}

          {/* Document Content View */}
          {docContent ? (
            <div className="rounded-xl border border-slate-800 bg-white p-8 text-black shadow-2xl overflow-auto max-h-[800px]">
              <div dangerouslySetInnerHTML={{ __html: docContent }} />
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-16 text-center text-slate-400">
              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-600" />
              <h4 className="text-base font-semibold text-slate-200">Nenhum documento gerado ainda</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Gere a minuta formal com todas as condições comerciais e checksum de integridade.
              </p>
              <Button
                size="sm"
                onClick={handleGenerateDocument}
                disabled={generatingDoc}
                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <FileText className="h-4 w-4 mr-1.5" />
                {generatingDoc ? 'Gerando...' : 'Gerar Documento Agora'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Alçadas & Aprovações */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Governança & Alçadas Comerciais</h3>
            <p className="text-xs text-slate-400">
              Registro estrito de aprovação com princípio Maker-Checker e validação por hash criptográfico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Status de Alçada
                </span>
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
              </div>

              <div className="text-lg font-bold text-white">
                {proposal.status === 'APPROVED' || proposal.status === 'READY_TO_SEND'
                  ? 'Aprovada Internamente'
                  : proposal.status === 'APPROVAL_PENDING'
                  ? 'Pendente de Decisão da Alçada'
                  : 'Rascunho Comercial'}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Regras de alçada aplicadas: se a taxa de plataforma negociada for inferior a 7,00% ou se houver split de conveniência ativado, a proposta exige parecer obrigatório da Diretoria Comercial antes do envio formal.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Princípio Maker-Checker
                </span>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>

              <div className="text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Bloqueio de auto-aprovação ativo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Validação estrita de contentHash vinculada ao parecer</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Invalidacão automática se os termos forem alterados</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Envios & Aceite */}
      {activeTab === 'deliveries' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Rastreamento de Envios & Aceite Formal</h3>
            <p className="text-xs text-slate-400">
              Histórico de canais de entrega (E-mail, WhatsApp, Portal) e formalização do aceite pelo produtor.
            </p>
          </div>

          {/* Aceite Registrado */}
          {proposal.status === 'ACCEPTED' && (
            <div className="p-5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>Aceite Comercial Registrado</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300 pt-2 border-t border-emerald-900/40">
                <div>
                  <span className="text-slate-500 block">Status:</span>
                  <strong className="text-emerald-300">Aceito pelo Produtor</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Versão Formalizada:</span>
                  <strong className="text-slate-200">v{activeVerNum}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Próxima Etapa:</span>
                  <strong className="text-orange-400">Elaboração Contratual (1.3.6)</strong>
                </div>
              </div>
            </div>
          )}

          {/* Deliveries list */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Canais de Envio & Entregas
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Send className="h-4 w-4 text-cyan-400" />
                  <div>
                    <strong className="text-slate-200">Envio de Formalização Comercial</strong>
                    <p className="text-slate-500">Destinatário principal do produtor</p>
                  </div>
                </div>
                <span className="text-slate-400">
                  {proposal.status === 'SENT' || proposal.status === 'ACCEPTED' ? 'Entregue' : 'Não enviado'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Modal: Submeter para Alçada */}
      {isSubmitApprovalOpen && (
        <ProposalSubmitApprovalModal
          proposalId={proposal.id}
          versionNumber={currentVer?.versionNumber || activeVerNum}
          expectedVersion={expectedVersion}
          publicCode={proposal.publicCode}
          onClose={() => setIsSubmitApprovalOpen(false)}
          onSuccess={() => {
            setIsSubmitApprovalOpen(false);
            loadProposal();
          }}
        />
      )}

      {/* Modal: Decisão de Alçada */}
      {isApprovalDecisionOpen && (
        <ProposalApprovalModal
          proposalId={proposal.id}
          versionNumber={currentVer?.versionNumber || activeVerNum}
          expectedVersion={expectedVersion}
          publicCode={proposal.publicCode}
          onClose={() => setIsApprovalDecisionOpen(false)}
          onSuccess={() => {
            setIsApprovalDecisionOpen(false);
            loadProposal();
          }}
        />
      )}

      {/* Modal: Enviar ao Produtor */}
      {isSendOpen && (
        <ProposalSendModal
          proposalId={proposal.id}
          versionNumber={currentVer?.versionNumber || activeVerNum}
          expectedVersion={expectedVersion}
          publicCode={proposal.publicCode}
          producerEmail={proposal.producerName ? undefined : undefined}
          onClose={() => setIsSendOpen(false)}
          onSuccess={() => {
            setIsSendOpen(false);
            loadProposal();
          }}
        />
      )}

      {/* Modal: Registrar Aceite Formal */}
      {isAcceptOpen && (
        <ProposalAcceptModal
          proposalId={proposal.id}
          versionNumber={currentVer?.versionNumber || activeVerNum}
          expectedVersion={expectedVersion}
          publicCode={proposal.publicCode}
          producerName={proposal.producerName}
          onClose={() => setIsAcceptOpen(false)}
          onSuccess={() => {
            setIsAcceptOpen(false);
            loadProposal();
          }}
        />
      )}

      {/* Modal: Recusa */}
      {isDeclineOpen && (
        <ProposalDeclineModal
          proposalId={proposal.id}
          versionNumber={currentVer?.versionNumber || activeVerNum}
          expectedVersion={expectedVersion}
          publicCode={proposal.publicCode}
          onClose={() => setIsDeclineOpen(false)}
          onSuccess={() => {
            setIsDeclineOpen(false);
            loadProposal();
          }}
        />
      )}

      {/* Modal: Cancelar Proposta */}
      {isCancelOpen && (
        <ProposalCancelModal
          proposalId={proposal.id}
          publicCode={proposal.publicCode}
          onClose={() => setIsCancelOpen(false)}
          onSuccess={() => {
            setIsCancelOpen(false);
            loadProposal();
          }}
        />
      )}

      {/* Modal: Criar Nova Versão */}
      {isCreateVersionOpen && (
        <ProposalCreateVersionModal
          proposalId={proposal.id}
          currentVersionNumber={currentVer?.versionNumber || activeVerNum}
          expectedVersion={expectedVersion}
          publicCode={proposal.publicCode}
          currentTerms={terms}
          currentEvents={events}
          onClose={() => setIsCreateVersionOpen(false)}
          onSuccess={() => {
            setIsCreateVersionOpen(false);
            loadProposal();
          }}
        />
      )}

      {/* Modal: Diff entre Versões */}
      {isDiffOpen && (
        <ProposalDiffModal
          proposalId={proposal.id}
          baseVersion={diffBase}
          targetVersion={diffTarget}
          totalVersions={proposal.versions?.length || 2}
          onClose={() => setIsDiffOpen(false)}
        />
      )}
    </div>
  );
};
