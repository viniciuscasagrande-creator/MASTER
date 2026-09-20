import React, { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft,
  RefreshCw,
  FileCheck2,
  FileSignature,
  FileDiff,
  CalendarCheck2,
  AlertOctagon,
  PauseCircle,
  PlayCircle,
  Send,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Calendar,
  Layers,
  FileText,
  UserCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Lock,
  Hash,
  Info
} from 'lucide-react';
import {
  CommercialContractDTO,
  EffectiveCommercialTermsDTO,
  SignatureEnvelopeDTO
} from '@shared/types/index';
import { CommercialContractsApi } from './api/commercial-contracts.api';
import { ContractStatusBadge } from './ContractStatusBadge';
import { ContractAmendmentModal } from './modals/ContractAmendmentModal';
import { ContractRenewalModal } from './modals/ContractRenewalModal';
import { ContractTerminationModal } from './modals/ContractTerminationModal';
import { SignaturePreparationModal } from './modals/SignaturePreparationModal';
import { Button } from '../../../shared/components/Button';
import { formatDate } from '../../../shared/utils/formatters';

interface ContractDetailsPageProps {
  contractId: string;
  onBack: () => void;
  onSelectProducer?: (producerId: string) => void;
  onSelectProposal?: (proposalId: string) => void;
}

type TabType = 'OVERVIEW' | 'TERMS' | 'DOCUMENT' | 'SIGNATURE' | 'AMENDMENTS' | 'RENEWALS';

export const ContractDetailsPage: React.FC<ContractDetailsPageProps> = ({
  contractId,
  onBack,
  onSelectProducer,
  onSelectProposal
}) => {
  const [contract, setContract] = useState<CommercialContractDTO | null>(null);
  const [effectiveTerms, setEffectiveTerms] = useState<EffectiveCommercialTermsDTO | null>(null);
  const [documentHtml, setDocumentHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Tab
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');

  // Modals
  const [isAmendmentModalOpen, setIsAmendmentModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [isTerminationModalOpen, setIsTerminationModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [decisionReason, setDecisionReason] = useState('');
  const [isSuspending, setIsSuspending] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  // Loading actions
  const [actionLoading, setActionLoading] = useState(false);

  const loadContract = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CommercialContractsApi.getContractById(contractId);
      setContract(data);

      // Load effective terms
      if (data.producerId) {
        CommercialContractsApi.getEffectiveTerms(data.producerId)
          .then(setEffectiveTerms)
          .catch(() => null);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes do contrato comercial.');
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  // Submit Approval
  const handleSubmitApproval = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const updated = await CommercialContractsApi.submitApproval(contractId);
      setContract(updated);
      setActionSuccess('Contrato submetido para aprovação interna com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao submeter para aprovação.');
    } finally {
      setActionLoading(false);
    }
  };

  // Process Approval Decision (Maker-Checker)
  const handleProcessDecision = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const updated = await CommercialContractsApi.processDecision(contractId, {
        decision: decisionType,
        reason: decisionReason.trim() || undefined,
        expectedVersion: contract?.version
      });
      setContract(updated);
      setIsDecisionModalOpen(false);
      setDecisionReason('');
      setActionSuccess(
        decisionType === 'APPROVE'
          ? 'Contrato aprovado internamente com sucesso! Liberado para assinatura.'
          : 'Contrato rejeitado na alçada de aprovação.'
      );
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar decisão de aprovação.');
    } finally {
      setActionLoading(false);
    }
  };

  // Generate Document
  const handleGenerateDocument = async () => {
    if (!contract) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await CommercialContractsApi.generateDocument(
        contract.id,
        contract.currentVersionNumber
      );
      setDocumentHtml(res.htmlContent);
      setActionSuccess('Documento formal gerado com SHA-256 computado com sucesso!');
      await loadContract();
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar documento contratual.');
    } finally {
      setActionLoading(false);
    }
  };

  // Suspend
  const handleSuspend = async () => {
    if (!suspensionReason.trim()) {
      setError('Informe o motivo da suspensão.');
      return;
    }
    try {
      setIsSuspending(true);
      setError(null);
      const updated = await CommercialContractsApi.suspendContract(contractId, {
        reason: suspensionReason.trim()
      });
      setContract(updated);
      setIsSuspendModalOpen(false);
      setSuspensionReason('');
      setActionSuccess('Contrato suspenso temporariamente.');
    } catch (err: any) {
      setError(err.message || 'Erro ao suspender contrato.');
    } finally {
      setIsSuspending(false);
    }
  };

  // Reactivate
  const handleReactivate = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const updated = await CommercialContractsApi.reactivateContract(contractId);
      setContract(updated);
      setActionSuccess('Contrato reativado com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao reativar contrato.');
    } finally {
      setActionLoading(false);
    }
  };

  // Simulate Signature Webhook (for Demo / Dev)
  const handleSimulateSignature = async () => {
    if (!contract) return;
    const env = contract.envelopes?.[0];
    if (!env) {
      setError('Nenhum envelope de assinatura despachado para este contrato.');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await CommercialContractsApi.simulateSignatureWebhook({
        event: 'document_signed',
        provider: env.provider,
        providerReference: env.providerReference,
        signerEmail: env.signers?.[0]?.email || 'produtor@exemplo.com.br',
        allSigned: true
      });
      setActionSuccess('Webhook de assinatura processado com sucesso pela autoridade!');
      await loadContract();
    } catch (err: any) {
      setError(err.message || 'Erro ao simular webhook de assinatura.');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Amendment
  const handleApproveAmendment = async (amendmentId: string) => {
    try {
      setActionLoading(true);
      setError(null);
      await CommercialContractsApi.approveAmendment(contractId, amendmentId);
      setActionSuccess('Aditivo aprovado com sucesso!');
      await loadContract();
    } catch (err: any) {
      setError(err.message || 'Erro ao aprovar aditivo.');
    } finally {
      setActionLoading(false);
    }
  };

  // Activate Amendment
  const handleActivateAmendment = async (amendmentId: string) => {
    try {
      setActionLoading(true);
      setError(null);
      await CommercialContractsApi.activateAmendment(contractId, amendmentId);
      setActionSuccess('Aditivo ativado! Novas condições comerciais agora estão vigentes.');
      await loadContract();
    } catch (err: any) {
      setError(err.message || 'Erro ao ativar aditivo.');
    } finally {
      setActionLoading(false);
    }
  };

  // Complete Renewal
  const handleCompleteRenewal = async (renewalId: string) => {
    try {
      setActionLoading(true);
      setError(null);
      await CommercialContractsApi.completeRenewal(contractId, renewalId);
      setActionSuccess('Renovação concluída com nova vigência estendida!');
      await loadContract();
    } catch (err: any) {
      setError(err.message || 'Erro ao concluir renovação.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !contract) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-400 mb-3" />
        <p className="text-sm">Carregando detalhes do contrato comercial...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para Contratos
        </button>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-300">
          Contrato comercial não encontrado.
        </div>
      </div>
    );
  }

  const envelope = contract.envelopes?.[0];
  const isSigned = ['SIGNED', 'ACTIVE'].includes(contract.status);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para Central de Contratos
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={loadContract}
          className="border-slate-800 text-slate-400 hover:text-white h-8"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Recarregar
        </Button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Contract Signed but Not Active Notice */}
      {contract.status === 'SIGNED' && (
        <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-4 text-xs text-teal-200 flex items-start gap-3">
          <Clock className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-teal-300">
              Contrato Totalmente Assinado! Aguardando Início da Vigência.
            </p>
            <p className="mt-0.5 text-teal-200/80">
              As assinaturas eletrônicas foram concluídas com sucesso. Conforme o princípio de separação entre assinatura e vigência, o contrato entrará automaticamente em status <span className="font-bold text-teal-300">VIGENTE (ACTIVE)</span> na data <span className="font-semibold">{contract.effectiveFrom ? formatDate(contract.effectiveFrom) : 'prevista'}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xl font-bold text-white tracking-wide">
                {contract.publicCode}
              </span>
              <span className="rounded bg-slate-800 px-2.5 py-1 text-xs font-mono font-semibold text-slate-200 border border-slate-700 flex items-center gap-1">
                <Layers className="h-3 w-3 text-orange-400" />
                Versão v{contract.currentVersionNumber}
              </span>
              <ContractStatusBadge status={contract.status} />
              {isSigned && (
                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-700 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-amber-400" />
                  Imutável (Edição via Aditivos)
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-slate-100">{contract.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <div
                className="flex items-center gap-1.5 hover:text-white cursor-pointer"
                onClick={() => contract.producerId && onSelectProducer?.(contract.producerId)}
              >
                <Building2 className="h-4 w-4 text-orange-400" />
                <span className="font-medium text-slate-200">{contract.producerName || 'Produtor Contratante'}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span>
                  Vigência: <strong className="text-slate-200">{contract.effectiveFrom ? formatDate(contract.effectiveFrom) : 'Não definida'}</strong> até{' '}
                  <strong className="text-slate-200">{contract.effectiveUntil ? formatDate(contract.effectiveUntil) : 'Indeterminada'}</strong>
                </span>
              </div>

              {contract.sourceProposalPublicCode && (
                <div
                  className="flex items-center gap-1 hover:text-orange-400 cursor-pointer"
                  onClick={() => contract.sourceProposalId && onSelectProposal?.(contract.sourceProposalId)}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Proposta Origem: <strong>{contract.sourceProposalPublicCode}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* DRAFT */}
            {contract.status === 'DRAFT' && (
              <>
                <Button
                  size="sm"
                  onClick={handleSubmitApproval}
                  disabled={actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20"
                >
                  <ShieldCheck className="h-4 w-4 mr-1.5" />
                  Submeter Aprovação
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateDocument}
                  disabled={actionLoading}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  Gerar Minuta
                </Button>
              </>
            )}

            {/* APPROVAL_PENDING */}
            {contract.status === 'APPROVAL_PENDING' && (
              <Button
                size="sm"
                onClick={() => {
                  setDecisionType('APPROVE');
                  setIsDecisionModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20"
              >
                <ShieldCheck className="h-4 w-4 mr-1.5" />
                Decidir Aprovação (Maker-Checker)
              </Button>
            )}

            {/* APPROVED */}
            {contract.status === 'APPROVED' && (
              <>
                <Button
                  size="sm"
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/20"
                >
                  <FileSignature className="h-4 w-4 mr-1.5" />
                  Despachar para Assinatura
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateDocument}
                  disabled={actionLoading}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  Atualizar Minuta
                </Button>
              </>
            )}

            {/* SIGNATURE_PENDING or PARTIALLY_SIGNED */}
            {['SIGNATURE_PENDING', 'PARTIALLY_SIGNED'].includes(contract.status) && (
              <Button
                size="sm"
                onClick={handleSimulateSignature}
                disabled={actionLoading}
                className="bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-lg shadow-teal-600/20"
              >
                <UserCheck className="h-4 w-4 mr-1.5" />
                Simular Assinatura (Webhook Demo)
              </Button>
            )}

            {/* SIGNED or ACTIVE */}
            {isSigned && (
              <>
                <Button
                  size="sm"
                  onClick={() => setIsAmendmentModalOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/20"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Novo Aditivo
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsRenewalModalOpen(true)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <CalendarCheck2 className="h-4 w-4 mr-1.5 text-emerald-400" />
                  Renovar / Prorrogar
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsSuspendModalOpen(true)}
                  className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
                >
                  <PauseCircle className="h-4 w-4 mr-1.5" />
                  Suspender
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsTerminationModalOpen(true)}
                  className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                >
                  <AlertOctagon className="h-4 w-4 mr-1.5" />
                  Rescindir
                </Button>
              </>
            )}

            {/* SUSPENDED */}
            {contract.status === 'SUSPENDED' && (
              <Button
                size="sm"
                onClick={handleReactivate}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20"
              >
                <PlayCircle className="h-4 w-4 mr-1.5" />
                Reativar Contrato
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'OVERVIEW'
              ? 'border-orange-500 text-orange-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Visão Geral & Partes
        </button>

        <button
          onClick={() => setActiveTab('TERMS')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'TERMS'
              ? 'border-orange-500 text-orange-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Layers className="h-4 w-4" />
          Condições Efetivas (Financeiro)
        </button>

        <button
          onClick={() => setActiveTab('DOCUMENT')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'DOCUMENT'
              ? 'border-orange-500 text-orange-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <FileText className="h-4 w-4" />
          Minuta & Documento Formal
        </button>

        <button
          onClick={() => setActiveTab('SIGNATURE')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'SIGNATURE'
              ? 'border-orange-500 text-orange-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <FileSignature className="h-4 w-4" />
          Assinatura Digital ({envelope ? '1 Envelope' : '0'})
        </button>

        <button
          onClick={() => setActiveTab('AMENDMENTS')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'AMENDMENTS'
              ? 'border-orange-500 text-orange-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <FileDiff className="h-4 w-4" />
          Aditivos Contratuais ({contract.amendments?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('RENEWALS')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'RENEWALS'
              ? 'border-orange-500 text-orange-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <CalendarCheck2 className="h-4 w-4" />
          Renovações ({contract.renewals?.length || 0})
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: OVERVIEW & PARTIES                                           */}
      {/* =================================================================== */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Parties Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Party 1: DiskIngressos */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Building2 className="h-4 w-4 text-orange-400" />
                Contratada / Operadora (DiskIngressos)
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="text-white font-bold">DiskIngressos Serviços de Bilhetagem S.A.</div>
                <div className="text-slate-400">CNPJ: 12.345.678/0001-90</div>
                <div className="text-slate-400">Sede: Curitiba/PR, Brasil</div>
                <div className="pt-2 border-t border-slate-800 text-slate-300">
                  <span className="text-slate-500 block text-[11px]">Representante Legal:</span>
                  Diretoria Executiva DiskIngressos (comercial@diskingressos.com.br)
                </div>
              </div>
            </div>

            {/* Party 2: Producer */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Building2 className="h-4 w-4 text-purple-400" />
                Contratante (Produtor B2B)
              </div>
              {contract.parties?.find(p => p.partyType === 'PRODUCER') ? (
                (() => {
                  const p = contract.parties.find(x => x.partyType === 'PRODUCER')!;
                  return (
                    <div className="space-y-1.5 text-xs">
                      <div className="text-white font-bold">{p.legalName}</div>
                      <div className="text-slate-400">CNPJ / CPF: {p.document}</div>
                      <div className="text-slate-400">Endereço: {p.address || 'Brasil'}</div>
                      <div className="pt-2 border-t border-slate-800 text-slate-300">
                        <span className="text-slate-500 block text-[11px]">Representante Legal:</span>
                        {p.representativeName} ({p.representativeRole}) - {p.representativeEmail}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-xs text-slate-400">
                  {contract.producerName || 'Produtor Contratante'}
                </div>
              )}
            </div>
          </div>

          {/* Cryptographic & Audit Metadata */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Hash className="h-4 w-4 text-orange-400" />
              Integridade Criptográfica & Trilha de Auditoria
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="rounded-lg bg-slate-950/40 p-3 border border-slate-800">
                <span className="text-[11px] text-slate-500 block">Hash do Contrato (contentHash):</span>
                <span className="font-mono text-orange-400 text-[11px] break-all">
                  {contract.currentVersion?.contentHash || 'Calculado no fechamento da versão'}
                </span>
              </div>

              <div className="rounded-lg bg-slate-950/40 p-3 border border-slate-800">
                <span className="text-[11px] text-slate-500 block">Hash da Proposta de Origem:</span>
                <span className="font-mono text-cyan-400 text-[11px] break-all">
                  {contract.sourceProposalContentHash || 'Contrato criado de forma direta'}
                </span>
              </div>

              <div className="rounded-lg bg-slate-950/40 p-3 border border-slate-800">
                <span className="text-[11px] text-slate-500 block">Controle de Concorrência Otimista:</span>
                <span className="font-mono text-white text-xs">Versão de Lock: #{contract.version}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {contract.notes && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
              <div className="text-xs font-semibold text-slate-300">Observações Gerais</div>
              <p className="text-xs text-slate-400 leading-relaxed">{contract.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: EFFECTIVE TERMS (CONSUMED BY FINANCE)                        */}
      {/* =================================================================== */}
      {activeTab === 'TERMS' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200 flex items-start gap-3">
            <Info className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-300">
                Autoridade de Taxas para o Financeiro & Borderô
              </p>
              <p className="mt-0.5 text-emerald-200/80">
                Estas são as condições comerciais vigentes calculadas a partir do contrato base sobreposto por todos os aditivos contratuais ativos na data atual. O Financeiro consome este endpoint para apurações, borderôs e repasses.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Tipo da Taxa</th>
                    <th className="px-4 py-3">Descrição / Nome</th>
                    <th className="px-4 py-3">Modelo</th>
                    <th className="px-4 py-3">Valor / Percentual</th>
                    <th className="px-4 py-3">Pagador</th>
                    <th className="px-4 py-3">Origem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {effectiveTerms?.terms && effectiveTerms.terms.length > 0 ? (
                    effectiveTerms.terms.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-medium text-white">{t.termType}</td>
                        <td className="px-4 py-3">{t.name}</td>
                        <td className="px-4 py-3 text-slate-400">{t.calculationType}</td>
                        <td className="px-4 py-3 font-semibold text-white">
                          {t.percentage ? `${t.percentage}%` : t.amount ? `R$ ${t.amount.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                            {t.payer}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {t.source === 'AMENDMENT' ? (
                            <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold">
                              Aditivo {t.sourceAmendmentCode || ''}
                            </span>
                          ) : (
                            <span className="rounded bg-slate-800 text-slate-300 px-2 py-0.5 text-[11px]">
                              Contrato Base
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        Nenhuma condição comercial apurada para este produtor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: MINUTA & DOCUMENT                                            */}
      {/* =================================================================== */}
      {activeTab === 'DOCUMENT' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {contract.currentVersion?.documentChecksum ? (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>SHA-256 Checksum: <strong className="font-mono text-white">{contract.currentVersion.documentChecksum}</strong></span>
                </div>
              ) : (
                <span>Documento formal ainda não gerado para a versão v{contract.currentVersionNumber}.</span>
              )}
            </div>

            <Button
              size="sm"
              onClick={handleGenerateDocument}
              disabled={actionLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              {documentHtml ? 'Atualizar Minuta' : 'Gerar Minuta Oficial'}
            </Button>
          </div>

          {documentHtml ? (
            <div className="rounded-xl border border-slate-800 bg-white text-slate-900 p-8 shadow-2xl max-h-[700px] overflow-y-auto font-serif">
              <div dangerouslySetInnerHTML={{ __html: documentHtml }} />
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-600 opacity-40" />
              <p className="text-sm text-slate-400 font-medium">Nenhuma minuta gerada em tela</p>
              <p className="text-xs text-slate-500 mt-1">
                Clique em "Gerar Minuta Oficial" para compilar as cláusulas contratuais formalizadas.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: SIGNATURE ENVELOPE                                           */}
      {/* =================================================================== */}
      {activeTab === 'SIGNATURE' && (
        <div className="space-y-4">
          {envelope ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      Envelope de Assinatura Digital #{envelope.id}
                    </h3>
                    <span className="rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 text-[11px] font-semibold">
                      Provedor: {envelope.provider}
                    </span>
                    <span className="rounded bg-slate-800 text-slate-300 px-2 py-0.5 text-[11px] font-mono">
                      Ref: {envelope.providerReference || 'Simulado'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Status do Envelope: <strong className="text-white">{envelope.status}</strong>
                  </p>
                </div>

                {['SENT', 'SIGNATURE_PENDING', 'PARTIALLY_SIGNED'].includes(envelope.status) && (
                  <Button
                    size="sm"
                    onClick={handleSimulateSignature}
                    disabled={actionLoading}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs"
                  >
                    <UserCheck className="h-3.5 w-3.5 mr-1" />
                    Simular Assinatura (Webhook)
                  </Button>
                )}
              </div>

              {/* Signers List */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300">Signatários Vinculados</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {envelope.signers?.map((signer, idx) => (
                    <div
                      key={signer.id || idx}
                      className="rounded-lg border border-slate-800 bg-slate-950/50 p-3.5 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{signer.name}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            signer.status === 'SIGNED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {signer.status}
                        </span>
                      </div>
                      <div className="text-slate-400">{signer.email}</div>
                      <div className="text-[11px] text-slate-500">
                        {signer.role || 'Representante'} | Ordem: #{signer.signingOrder}
                      </div>
                      {signer.signedAt && (
                        <div className="text-[11px] text-emerald-400 pt-1 border-t border-slate-800/80">
                          Assinado em: {formatDate(signer.signedAt)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-500">
              <FileSignature className="h-12 w-12 mx-auto mb-3 text-slate-600 opacity-40" />
              <p className="text-sm text-slate-400 font-medium">Nenhum envelope despachado</p>
              <p className="text-xs text-slate-500 mt-1">
                Após aprovação interna do contrato, o envelope poderá ser despachado para os signatários.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: AMENDMENTS (ADITIVOS)                                        */}
      {/* =================================================================== */}
      {activeTab === 'AMENDMENTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Aditivos Contratuais Formalizados</h3>
              <p className="text-xs text-slate-400">
                Imutabilidade pós-assinatura: qualquer alteração de taxa, prazo ou escopo é registrada via aditivo.
              </p>
            </div>

            {isSigned && (
              <Button
                size="sm"
                onClick={() => setIsAmendmentModalOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Novo Aditivo
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {contract.amendments && contract.amendments.length > 0 ? (
              contract.amendments.map(adt => (
                <div
                  key={adt.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs">{adt.publicCode}</span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                        {adt.type}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                          adt.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : adt.status === 'APPROVED'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {adt.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {adt.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveAmendment(adt.id)}
                          disabled={actionLoading}
                          className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 h-7 text-xs"
                        >
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Aprovar Aditivo
                        </Button>
                      )}

                      {adt.status === 'APPROVED' && (
                        <Button
                          size="sm"
                          onClick={() => handleActivateAmendment(adt.id)}
                          disabled={actionLoading}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white h-7 text-xs font-semibold"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ativar Aditivo
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="text-slate-300 font-medium">Motivo: {adt.reason}</div>
                    <div className="text-slate-400">Resumo: {adt.summary}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                      <span>Vigência a partir de: {formatDate(adt.effectiveFrom)}</span>
                      <span>Hash: {adt.contentHash.substring(0, 16)}...</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-500">
                <FileDiff className="h-12 w-12 mx-auto mb-3 text-slate-600 opacity-40" />
                <p className="text-sm text-slate-400 font-medium">Nenhum aditivo lavrado</p>
                <p className="text-xs text-slate-500 mt-1">
                  Aditivos mantêm o histórico transparente de repactuação comercial sem alterar o contrato base.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 6: RENEWALS & RENEGOTIATIONS                                   */}
      {/* =================================================================== */}
      {activeTab === 'RENEWALS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Histórico de Renovações e Renegociações</h3>
              <p className="text-xs text-slate-400">
                Extensões simples de vigência ou desdobramento de novas oportunidades no CRM
              </p>
            </div>

            {isSigned && (
              <Button
                size="sm"
                onClick={() => setIsRenewalModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
              >
                <CalendarCheck2 className="h-3.5 w-3.5 mr-1" />
                Iniciar Renovação
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {contract.renewals && contract.renewals.length > 0 ? (
              contract.renewals.map(rnw => (
                <div
                  key={rnw.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">
                        Modalidade: {rnw.renewalType === 'SIMPLE' ? 'Prorrogação Simples' : 'Renegociação CRM'}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                          rnw.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {rnw.status}
                      </span>
                    </div>

                    {rnw.status !== 'COMPLETED' && rnw.status !== 'CANCELLED' && rnw.renewalType === 'SIMPLE' && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteRenewal(rnw.id)}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white h-7 text-xs font-semibold"
                      >
                        Concluir Prorrogação
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <div>
                      Prazo pretendido:{' '}
                      <span className="text-white">
                        {rnw.targetEffectiveFrom ? formatDate(rnw.targetEffectiveFrom) : '-'} até{' '}
                        {rnw.targetEffectiveUntil ? formatDate(rnw.targetEffectiveUntil) : '-'}
                      </span>
                    </div>
                    {rnw.notes && <div>Notas: {rnw.notes}</div>}
                    {rnw.sourceOpportunityId && (
                      <div className="text-orange-400 text-[11px]">
                        Vinculado à Oportunidade CRM #{rnw.sourceOpportunityId}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-500">
                <CalendarCheck2 className="h-12 w-12 mx-auto mb-3 text-slate-600 opacity-40" />
                <p className="text-sm text-slate-400 font-medium">Nenhuma renovação registrada</p>
                <p className="text-xs text-slate-500 mt-1">
                  Gerencie prorrogações ordinárias ou direcione o produtor para renegociação no CRM.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decision Modal (Maker-Checker) */}
      {isDecisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              Decisão de Aprovação Interna
            </div>

            <p className="text-xs text-slate-400">
              Avaliação de alçada para liberação de minuta e assinatura do contrato{' '}
              <strong className="text-white">{contract.publicCode}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Decisão *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionType('APPROVE')}
                    className={`py-2 rounded-lg border font-semibold ${
                      decisionType === 'APPROVE'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Aprovar Minuta
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionType('REJECT')}
                    className={`py-2 rounded-lg border font-semibold ${
                      decisionType === 'REJECT'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Rejeitar Minuta
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Parecer / Motivo {decisionType === 'REJECT' ? '*' : '(Opcional)'}
                </label>
                <textarea
                  rows={3}
                  value={decisionReason}
                  onChange={e => setDecisionReason(e.target.value)}
                  placeholder="Justifique ou adicione parecer da alçada comercial..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:outline-none"
                  required={decisionType === 'REJECT'}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDecisionModalOpen(false)}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleProcessDecision}
                disabled={actionLoading || (decisionType === 'REJECT' && !decisionReason.trim())}
                className={decisionType === 'APPROVE' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'}
              >
                {actionLoading ? 'Registrando...' : 'Confirmar Decisão'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {isSuspendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-orange-500/40 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <PauseCircle className="h-5 w-5 text-orange-400" />
              Suspender Contrato Comercial
            </div>

            <p className="text-xs text-slate-400">
              A suspensão congela temporariamente os efeitos contratuais até reativação formal.
            </p>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Motivo da Suspensão *</label>
              <textarea
                rows={3}
                value={suspensionReason}
                onChange={e => setSuspensionReason(e.target.value)}
                placeholder="Ex: Inadimplência temporária de repasses / Notificação formal..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-xs text-white focus:outline-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSuspendModalOpen(false)}
                disabled={isSuspending}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSuspend}
                disabled={isSuspending || !suspensionReason.trim()}
                className="bg-orange-600 hover:bg-orange-500 text-white"
              >
                {isSuspending ? 'Suspendendo...' : 'Confirmar Suspensão'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modals */}
      {isAmendmentModalOpen && (
        <ContractAmendmentModal
          isOpen={isAmendmentModalOpen}
          onClose={() => setIsAmendmentModalOpen(false)}
          contractId={contract.id}
          contractCode={contract.publicCode}
          onSuccess={() => {
            setActionSuccess('Aditivo contratual registrado com sucesso!');
            loadContract();
          }}
        />
      )}

      {isRenewalModalOpen && (
        <ContractRenewalModal
          isOpen={isRenewalModalOpen}
          onClose={() => setIsRenewalModalOpen(false)}
          contractId={contract.id}
          contractCode={contract.publicCode}
          currentEffectiveUntil={contract.effectiveUntil}
          onSuccess={() => {
            setActionSuccess('Renovação contratual registrada com sucesso!');
            loadContract();
          }}
        />
      )}

      {isTerminationModalOpen && (
        <ContractTerminationModal
          isOpen={isTerminationModalOpen}
          onClose={() => setIsTerminationModalOpen(false)}
          contractId={contract.id}
          contractCode={contract.publicCode}
          onSuccess={() => {
            setActionSuccess('Contrato comercial rescindido.');
            loadContract();
          }}
        />
      )}

      {isSignatureModalOpen && (
        <SignaturePreparationModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          contractId={contract.id}
          contractCode={contract.publicCode}
          defaultSigners={contract.parties?.map(p => ({
            partyType: p.partyType,
            name: p.representativeName,
            email: p.representativeEmail,
            document: p.representativeCpf,
            role: p.representativeRole
          }))}
          onSuccess={() => {
            setActionSuccess('Envelope de assinatura despachado com sucesso!');
            loadContract();
          }}
        />
      )}
    </div>
  );
};
