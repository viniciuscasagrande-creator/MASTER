import React, { useState, useEffect } from 'react';
import {
  ProposalTermType,
  CommercialPricingModel,
  ProposalPayer,
  CommercialProposalDTO,
  CommercialContractDTO,
  ContractPartyType
} from '@shared/types/index';
import { CommercialContractsApi } from '../api/commercial-contracts.api';
import { CommercialApi } from '../../api/commercial.api';
import {
  X,
  FileCheck2,
  FilePlus,
  Plus,
  Trash2,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { Button } from '../../../../shared/components/Button';

interface ContractCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (contract: CommercialContractDTO) => void;
  initialProposalId?: string;
  initialProducerId?: string;
}

interface TermItem {
  termType: ProposalTermType;
  name: string;
  calculationType: CommercialPricingModel;
  percentage?: number;
  amount?: number;
  minimumAmount?: number;
  payer: ProposalPayer;
  splitProducerPercentage?: number;
  splitBuyerPercentage?: number;
  conditions?: string;
}

export const ContractCreateModal: React.FC<ContractCreateModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialProposalId,
  initialProducerId
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'FROM_PROPOSAL' | 'DIRECT'>(
    initialProposalId ? 'FROM_PROPOSAL' : 'FROM_PROPOSAL'
  );

  const [acceptedProposals, setAcceptedProposals] = useState<CommercialProposalDTO[]>([]);
  const [producers, setProducers] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State: From Proposal
  const [selectedProposalId, setSelectedProposalId] = useState<string>(initialProposalId || '');
  const [titleFromProp, setTitleFromProp] = useState('');
  const [effectiveFromProp, setEffectiveFromProp] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [effectiveUntilProp, setEffectiveUntilProp] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [notesFromProp, setNotesFromProp] = useState('');

  // Form State: Direct Contract
  const [directProducerId, setDirectProducerId] = useState(initialProducerId || '');
  const [directTitle, setDirectTitle] = useState('');
  const [directDescription, setDirectDescription] = useState('');
  const [directEffectiveFrom, setDirectEffectiveFrom] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [directEffectiveUntil, setDirectEffectiveUntil] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [directNotes, setDirectNotes] = useState('');

  // Direct Parties
  const [producerLegalName, setProducerLegalName] = useState('');
  const [producerDoc, setProducerDoc] = useState('');
  const [producerRepName, setProducerRepName] = useState('');
  const [producerRepRole, setProducerRepRole] = useState('Sócio-Administrador');
  const [producerRepCpf, setProducerRepCpf] = useState('');
  const [producerRepEmail, setProducerRepEmail] = useState('');

  // Direct Terms
  const [terms, setTerms] = useState<TermItem[]>([
    {
      termType: 'PLATFORM_COMMISSION',
      name: 'Comissão de Plataforma DiskIngressos',
      calculationType: 'PERCENTAGE',
      percentage: 8.0,
      payer: 'PRODUCER',
      conditions: 'Cobrança padrão sobre ingressos vendidos'
    }
  ]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingInitial(true);
        const [propsRes, prodsRes] = await Promise.all([
          CommercialApi.listProposals({ status: 'ACCEPTED', limit: 100 }).catch(() => ({ data: [] })),
          fetch('/api/v1/commercial/producers', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
          })
            .then(r => (r.ok ? r.json() : []))
            .catch(() => [])
        ]);

        const accProps = propsRes.data || [];
        setAcceptedProposals(accProps);
        if (Array.isArray(prodsRes)) {
          setProducers(prodsRes);
        }

        if (initialProposalId) {
          const matched = accProps.find((p: any) => p.id === initialProposalId);
          if (matched) {
            setSelectedProposalId(matched.id);
            setTitleFromProp(`Contrato de Prestação de Serviços - ${matched.producerName || 'Produtor'}`);
          }
        } else if (accProps.length > 0 && !selectedProposalId) {
          setSelectedProposalId(accProps[0].id);
          setTitleFromProp(`Contrato de Prestação de Serviços - ${accProps[0].producerName || 'Produtor'}`);
        }
      } catch (err: any) {
        console.error('Erro ao carregar dados iniciais para contrato:', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadInitialData();
  }, [initialProposalId]);

  const handleSelectProposal = (propId: string) => {
    setSelectedProposalId(propId);
    const matched = acceptedProposals.find(p => p.id === propId);
    if (matched) {
      setTitleFromProp(`Contrato de Prestação de Serviços - ${matched.producerName || 'Produtor'}`);
      if (matched.validUntil) {
        setEffectiveUntilProp(matched.validUntil.split('T')[0]);
      }
    }
  };

  const handleAddTerm = () => {
    setTerms(prev => [
      ...prev,
      {
        termType: 'CUSTOM',
        name: 'Taxa de Conveniência',
        calculationType: 'PERCENTAGE',
        percentage: 10.0,
        payer: 'BUYER',
        splitBuyerPercentage: 100
      }
    ]);
  };

  const handleRemoveTerm = (index: number) => {
    setTerms(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTerm = (index: number, field: keyof TermItem, value: any) => {
    setTerms(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'FROM_PROPOSAL') {
        if (!selectedProposalId) {
          throw new Error('Selecione uma proposta comercial aceita.');
        }

        const contract = await CommercialContractsApi.createContractFromProposal({
          proposalId: selectedProposalId,
          title: titleFromProp.trim() || undefined,
          effectiveFrom: effectiveFromProp,
          effectiveUntil: effectiveUntilProp,
          notes: notesFromProp.trim() || undefined
        });

        onCreated?.(contract);
        onClose();
      } else {
        // Direct
        if (!directProducerId) {
          throw new Error('Selecione um produtor contratante.');
        }
        if (!directTitle.trim()) {
          throw new Error('O título do contrato é obrigatório.');
        }
        if (terms.length === 0) {
          throw new Error('Adicione ao menos uma condição comercial ao contrato.');
        }

        const contract = await CommercialContractsApi.createDirectContract({
          producerId: directProducerId,
          title: directTitle.trim(),
          description: directDescription.trim() || undefined,
          effectiveFrom: directEffectiveFrom,
          effectiveUntil: directEffectiveUntil,
          terms: terms.map(t => ({
            termType: t.termType,
            name: t.name,
            calculationType: t.calculationType,
            percentage: t.percentage ? Number(t.percentage) : undefined,
            amount: t.amount ? Number(t.amount) : undefined,
            minimumAmount: t.minimumAmount ? Number(t.minimumAmount) : undefined,
            payer: t.payer,
            splitProducerPercentage: t.splitProducerPercentage ? Number(t.splitProducerPercentage) : undefined,
            splitBuyerPercentage: t.splitBuyerPercentage ? Number(t.splitBuyerPercentage) : undefined,
            conditions: t.conditions
          })),
          parties: [
            {
              partyType: 'DISK_INGRESSOS',
              legalName: 'DiskIngressos Serviços de Bilhetagem S.A.',
              tradeName: 'DiskIngressos',
              document: '12.345.678/0001-90',
              address: 'Curitiba/PR, Brasil',
              representativeName: 'Diretor Comercial DiskIngressos',
              representativeRole: 'Diretor Executivo',
              representativeCpf: '111.222.333-44',
              representativeEmail: 'comercial@diskingressos.com.br'
            },
            {
              partyType: 'PRODUCER',
              legalName: producerLegalName || 'Produtor Contratante Ltda',
              tradeName: producerLegalName,
              document: producerDoc || '00.000.000/0001-00',
              address: 'Brasil',
              representativeName: producerRepName || 'Representante Legal',
              representativeRole: producerRepRole || 'Administrador',
              representativeCpf: producerRepCpf || '000.000.000-00',
              representativeEmail: producerRepEmail || 'contato@produtor.com.br'
            }
          ],
          notes: directNotes.trim() || undefined
        });

        onCreated?.(contract);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar contrato comercial.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProp = acceptedProposals.find(p => p.id === selectedProposalId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-orange-50 dark:bg-orange-500/10 p-2 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Criar Novo Contrato Comercial B2B</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formalização jurídica entre a DiskIngressos e o Produtor Contratante
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setMode('FROM_PROPOSAL')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x ${
              mode === 'FROM_PROPOSAL'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-orange-600 dark:text-orange-400 border-b-white dark:border-b-slate-900 -mb-[1px] shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            A partir de Proposta Comercial Aceita (Recomendado)
          </button>
          <button
            type="button"
            onClick={() => setMode('DIRECT')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x ${
              mode === 'DIRECT'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-orange-600 dark:text-orange-400 border-b-white dark:border-b-slate-900 -mb-[1px] shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
            }`}
          >
            <FilePlus className="h-3.5 w-3.5" />
            Criação Direta de Contrato
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex-1 space-y-6 text-sm">
          {error && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* ============================================================= */}
          {/* MODE: FROM ACCEPTED PROPOSAL                                  */}
          {/* ============================================================= */}
          {mode === 'FROM_PROPOSAL' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Layers className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                  Selecione a Proposta Comercial Aceita
                </div>

                {acceptedProposals.length === 0 && !loadingInitial ? (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="font-semibold">Nenhuma proposta formal aceita no momento.</p>
                      <p className="mt-0.5 text-amber-700/90 dark:text-amber-200/80">
                        Para criar um contrato a partir de uma proposta, certifique-se de que a proposta comercial foi aprovada e seu aceite formal foi registrado pelo produtor.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">
                      Proposta Comercial Aceita *
                    </label>
                    <select
                      value={selectedProposalId}
                      onChange={e => handleSelectProposal(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-orange-500 focus:outline-none transition-colors"
                    >
                      <option value="">Selecione uma proposta aceita...</option>
                      {acceptedProposals.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.publicCode} - {p.title} ({p.producerName || 'Produtor'}) - v{p.currentVersionNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedProp && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3 text-xs space-y-1.5 mt-2 shadow-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Produtor:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{selectedProp.producerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Hash da Proposta Aceita:</span>
                      <span className="font-mono text-[11px] text-orange-600 dark:text-orange-400 truncate max-w-[280px]">
                        {selectedProp.currentVersion?.contentHash || 'Integridade Criptográfica Garantida'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Condições Cadastradas:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {selectedProp.currentVersion?.terms?.length || 0} taxas/condições
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Editable Fields for generated contract */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">
                    Título Formal do Contrato *
                  </label>
                  <input
                    type="text"
                    value={titleFromProp}
                    onChange={e => setTitleFromProp(e.target.value)}
                    placeholder="Ex: Contrato de Prestação de Serviços de Bilhetagem - Produtor X"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:border-orange-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">
                    Início da Vigência (effectiveFrom) *
                  </label>
                  <input
                    type="date"
                    value={effectiveFromProp}
                    onChange={e => setEffectiveFromProp(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:border-orange-500 focus:outline-none transition-colors"
                    required
                  />
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Data em que as condições entram em vigor após assinatura
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">
                    Fim da Vigência (effectiveUntil) *
                  </label>
                  <input
                    type="date"
                    value={effectiveUntilProp}
                    onChange={e => setEffectiveUntilProp(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:border-orange-500 focus:outline-none transition-colors"
                    required
                  />
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Data de encerramento do prazo contratual ordinário
                  </span>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">
                    Notas Contratuais & Observações Gerais
                  </label>
                  <textarea
                    rows={3}
                    value={notesFromProp}
                    onChange={e => setNotesFromProp(e.target.value)}
                    placeholder="Observações complementares, cláusulas especiais ou detalhes operacionais..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* MODE: DIRECT CONTRACT ENTRY                                   */}
          {/* ============================================================= */}
          {mode === 'DIRECT' && (
            <div className="space-y-5">
              {/* Producer and basic info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">
                    Produtor Contratante *
                  </label>
                  <select
                    value={directProducerId}
                    onChange={e => {
                      setDirectProducerId(e.target.value);
                      const prod = producers.find(p => p.id === e.target.value);
                      if (prod) {
                        setProducerLegalName(prod.legalName || prod.tradeName || prod.name || '');
                        setProducerDoc(prod.document || '');
                        if (!directTitle) {
                          setDirectTitle(`Contrato Comercial - ${prod.tradeName || prod.name || 'Produtor'}`);
                        }
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:border-orange-500 focus:outline-none transition-colors"
                    required
                  >
                    <option value="">Selecione o Produtor...</option>
                    {producers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.tradeName || p.name || p.legalName} ({p.document || 'Sem CNPJ'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">
                    Título do Contrato *
                  </label>
                  <input
                    type="text"
                    value={directTitle}
                    onChange={e => setDirectTitle(e.target.value)}
                    placeholder="Ex: Contrato de Prestação de Serviços de Bilhetagem"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:border-orange-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">
                    Vigência Inicial (effectiveFrom) *
                  </label>
                  <input
                    type="date"
                    value={directEffectiveFrom}
                    onChange={e => setDirectEffectiveFrom(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:border-orange-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">
                    Vigência Final (effectiveUntil) *
                  </label>
                  <input
                    type="date"
                    value={directEffectiveUntil}
                    onChange={e => setDirectEffectiveUntil(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:border-orange-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Producer Legal Representative */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                  Dados do Produtor & Representante Legal (Para Assinatura)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Razão Social / Nome</label>
                    <input
                      type="text"
                      value={producerLegalName}
                      onChange={e => setProducerLegalName(e.target.value)}
                      placeholder="Razão Social Produtora Ltda"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">CNPJ / CPF Produtor</label>
                    <input
                      type="text"
                      value={producerDoc}
                      onChange={e => setProducerDoc(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Nome Representante</label>
                    <input
                      type="text"
                      value={producerRepName}
                      onChange={e => setProducerRepName(e.target.value)}
                      placeholder="Nome completo do signatário"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Cargo Representante</label>
                    <input
                      type="text"
                      value={producerRepRole}
                      onChange={e => setProducerRepRole(e.target.value)}
                      placeholder="Ex: Sócio-Administrador"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">CPF Representante</label>
                    <input
                      type="text"
                      value={producerRepCpf}
                      onChange={e => setProducerRepCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">E-mail Signatário</label>
                    <input
                      type="email"
                      value={producerRepEmail}
                      onChange={e => setProducerRepEmail(e.target.value)}
                      placeholder="assinatura@produtor.com.br"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Commercial Terms Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Condições Comerciais & Taxas do Contrato
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTerm}
                    className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Adicionar Condição
                  </button>
                </div>

                <div className="space-y-2.5">
                  {terms.map((term, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3 flex flex-col md:flex-row gap-3 items-start md:items-center"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 w-full">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">Tipo de Taxa</label>
                          <select
                            value={term.termType}
                            onChange={e => handleUpdateTerm(index, 'termType', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                          >
                            <option value="PLATFORM_COMMISSION">Comissão de Plataforma</option>
                            <option value="ACCESS_CONTROL">Controle de Acesso</option>
                            <option value="BOX_OFFICE">Bilheteria Física</option>
                            <option value="MARKETING">Marketing & Divulgação</option>
                            <option value="EQUIPMENT">Locação de Equipamentos</option>
                            <option value="SETUP_FEE">Taxa de Configuração</option>
                            <option value="CUSTOM">Taxa Personalizada</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">Descrição / Nome</label>
                          <input
                            type="text"
                            value={term.name}
                            onChange={e => handleUpdateTerm(index, 'name', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">Percentual (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={term.percentage ?? ''}
                            onChange={e => handleUpdateTerm(index, 'percentage', e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Ex: 8.0"
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">Pagador</label>
                          <select
                            value={term.payer}
                            onChange={e => handleUpdateTerm(index, 'payer', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                          >
                            <option value="PRODUCER">Produtor</option>
                            <option value="BUYER">Comprador Final</option>
                            <option value="SPLIT">Rateio (Split)</option>
                          </select>
                        </div>
                      </div>

                      {terms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTerm(index)}
                          className="text-slate-400 hover:text-rose-500 p-1.5 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || (mode === 'FROM_PROPOSAL' && (!selectedProposalId || acceptedProposals.length === 0))}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-xs"
            >
              {submitting ? 'Gerando Contrato...' : 'Formalizar Contrato Comercial'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
