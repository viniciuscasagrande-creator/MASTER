import React, { useState } from 'react';
import {
  SignatureProviderType,
  ContractPartyType,
  SignatureEnvelopeDTO
} from '@shared/types/index';
import { CommercialContractsApi } from '../api/commercial-contracts.api';
import { X, FileSignature, Send, UserCheck, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../shared/components/Button';

interface SignaturePreparationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  contractCode: string;
  defaultSigners?: Array<{
    partyType: ContractPartyType;
    name: string;
    email: string;
    document?: string;
    role?: string;
  }>;
  onSuccess?: (envelope: SignatureEnvelopeDTO) => void;
}

interface SignerItem {
  partyType: ContractPartyType;
  name: string;
  email: string;
  document: string;
  role: string;
  signingOrder: number;
}

export const SignaturePreparationModal: React.FC<SignaturePreparationModalProps> = ({
  isOpen,
  onClose,
  contractId,
  contractCode,
  defaultSigners,
  onSuccess
}) => {
  if (!isOpen) return null;

  const [provider, setProvider] = useState<SignatureProviderType>('AUTENTIQUE');
  const [signers, setSigners] = useState<SignerItem[]>(() => {
    if (defaultSigners && defaultSigners.length > 0) {
      return defaultSigners.map((s, idx) => ({
        partyType: s.partyType,
        name: s.name,
        email: s.email,
        document: s.document || '',
        role: s.role || (s.partyType === 'PRODUCER' ? 'Representante do Produtor' : 'Representante DiskIngressos'),
        signingOrder: idx + 1
      }));
    }
    return [
      {
        partyType: 'DISK_INGRESSOS',
        name: 'Diretoria Comercial DiskIngressos',
        email: 'diretoria@diskingressos.com.br',
        document: '111.222.333-44',
        role: 'Diretor Executivo',
        signingOrder: 1
      },
      {
        partyType: 'PRODUCER',
        name: 'Representante Legal do Produtor',
        email: 'produtor@exemplo.com.br',
        document: '000.000.000-00',
        role: 'Sócio-Administrador',
        signingOrder: 2
      }
    ];
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSigner = () => {
    setSigners(prev => [
      ...prev,
      {
        partyType: 'PRODUCER',
        name: '',
        email: '',
        document: '',
        role: 'Signatário Adicional',
        signingOrder: prev.length + 1
      }
    ]);
  };

  const handleRemoveSigner = (index: number) => {
    setSigners(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSigner = (index: number, field: keyof SignerItem, value: any) => {
    setSigners(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signers.length === 0) {
      setError('Adicione pelo menos um signatário ao envelope de assinatura.');
      return;
    }
    for (const s of signers) {
      if (!s.name.trim() || !s.email.trim()) {
        setError('Todos os signatários devem ter nome e e-mail válidos.');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const envelope = await CommercialContractsApi.prepareAndSendSignature(contractId, {
        provider,
        signers: signers.map(s => ({
          partyType: s.partyType,
          name: s.name.trim(),
          email: s.email.trim(),
          document: s.document.trim() || undefined,
          role: s.role.trim() || undefined,
          signingOrder: s.signingOrder
        }))
      });

      onSuccess?.(envelope);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao preparar e despachar envelope de assinatura.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-50 dark:bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
              <FileSignature className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Preparar Envelope para Assinatura Digital</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Despacho formal para o contrato <span className="font-mono font-semibold text-slate-900 dark:text-white">{contractCode}</span>
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-sm flex-1">
          {error && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">
              Autoridade Certificadora / Provedor de Assinatura *
            </label>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value as SignatureProviderType)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:border-purple-500 focus:outline-none transition-colors"
            >
              <option value="AUTENTIQUE">Autentique (Certificado Digital ICP-Brasil / Padrão B2B)</option>
              <option value="CLICKSIGN">Clicksign (Validade Jurídica MP 2.200-2)</option>
              <option value="DOCUSIGN">DocuSign (Internacional / Enterprise)</option>
              <option value="D4SIGN">D4Sign (Chaves Criptográficas)</option>
            </select>
          </div>

          {/* Signers List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Signatários do Envelope
              </label>
              <button
                type="button"
                onClick={handleAddSigner}
                className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Adicionar Signatário
              </button>
            </div>

            <div className="space-y-3">
              {signers.map((signer, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3.5 space-y-2.5 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-purple-600 dark:text-purple-400">
                      Signatário #{signer.signingOrder} ({signer.partyType})
                    </span>
                    {signers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSigner(index)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">Nome Completo *</label>
                      <input
                        type="text"
                        value={signer.name}
                        onChange={e => handleUpdateSigner(index, 'name', e.target.value)}
                        placeholder="Nome do signatário"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">E-mail para Assinatura *</label>
                      <input
                        type="email"
                        value={signer.email}
                        onChange={e => handleUpdateSigner(index, 'email', e.target.value)}
                        placeholder="email@dominio.com.br"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">CPF / Documento</label>
                      <input
                        type="text"
                        value={signer.document}
                        onChange={e => handleUpdateSigner(index, 'document', e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">Cargo / Papel Jurídico</label>
                      <input
                        type="text"
                        value={signer.role}
                        onChange={e => handleUpdateSigner(index, 'role', e.target.value)}
                        placeholder="Ex: Diretor Executivo"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-purple-200 dark:border-slate-800 bg-purple-50/60 dark:bg-slate-950/30 p-3 text-xs text-purple-900 dark:text-slate-400 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <span>
              O despacho criará um envelope criptográfico inviolável. Notificações com link seguro serão disparadas aos signatários.
            </span>
          </div>

          {/* Actions */}
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
              disabled={submitting}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {submitting ? 'Despachando Envelope...' : 'Despachar para Assinatura'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
