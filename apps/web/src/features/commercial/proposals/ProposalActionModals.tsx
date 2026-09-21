import React, { useState } from 'react';
import { ProposalAcceptanceMethod, ProposalDeliveryChannel } from '@shared/types/index';
import { CommercialApi } from '../api/commercial.api';
import { X, CheckCircle2, XCircle, Send, ShieldCheck, AlertTriangle } from 'lucide-react';

// =============================================================================
// MODAL: ACEITE COMERCIAL FORMAL
// =============================================================================
interface AcceptModalProps {
  proposalId: string;
  versionNumber: number;
  expectedVersion?: number;
  publicCode: string;
  producerName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProposalAcceptModal: React.FC<AcceptModalProps> = ({
  proposalId,
  versionNumber,
  expectedVersion,
  publicCode,
  producerName,
  onClose,
  onSuccess
}) => {
  const [method, setMethod] = useState<ProposalAcceptanceMethod>('EMAIL_CONFIRMATION');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactDocument, setContactDocument] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) {
      setError('Informe o nome do responsável pelo aceite.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await CommercialApi.registerProposalAcceptance(proposalId, versionNumber, {
        method,
        contactName: contactName.trim(),
        contactEmail: contactEmail || undefined,
        contactDocument: contactDocument || undefined,
        notes: notes || undefined,
        expectedVersion: expectedVersion ?? 1
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar aceite comercial.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 dark:text-white">Registrar Aceite Comercial Formal</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
            <div className="text-slate-600 dark:text-slate-400">Proposta: <strong className="text-slate-900 dark:text-white">{publicCode} (V{versionNumber})</strong></div>
            <div className="text-slate-600 dark:text-slate-400">Produtor: <strong className="text-slate-900 dark:text-white">{producerName || 'Produtor Parceiro'}</strong></div>
            <div className="text-amber-700 dark:text-amber-400/90 pt-1 border-t border-slate-200 dark:border-slate-900 font-medium">
              Aviso de Domínio: O aceite comercial formaliza a negociação, mas não cria repasses financeiros nem borderôs automaticamente. A fase de contrato posterior (1.3.6) formalizará as cláusulas jurídicas.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Método de Formalização do Aceite *</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as ProposalAcceptanceMethod)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="EMAIL_CONFIRMATION">Confirmação Expressa por E-mail</option>
              <option value="DIGITAL_SIGNATURE">Assinatura Digital / Eletrônica</option>
              <option value="WHATSAPP_FORMAL">Validação Formal por WhatsApp Institucional</option>
              <option value="WRITTEN_FORM">Formulário Físico Assinado</option>
              <option value="PLATFORM_PORTAL">Aceite pelo Portal do Produtor</option>
              <option value="OTHER">Outro Meio Comprovatório</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do Contato / Representante Legal *</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Nome completo do signatário no produtor"
              required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">E-mail do Contato</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contato@produtor.com.br"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">CPF ou CNPJ</label>
              <input
                type="text"
                value={contactDocument}
                onChange={(e) => setContactDocument(e.target.value)}
                placeholder="Documento oficial"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Evidências / Notas de Aceite</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Aceite confirmado em resposta ao email com arquivo anexado de concordância."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              {submitting ? 'Registrando...' : 'Confirmar Aceite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// MODAL: RECUSA DA PROPOSTA (NÃO FECHA OPORTUNIDADE)
// =============================================================================
interface DeclineModalProps {
  proposalId: string;
  versionNumber: number;
  expectedVersion?: number;
  publicCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProposalDeclineModal: React.FC<DeclineModalProps> = ({
  proposalId,
  versionNumber,
  expectedVersion,
  publicCode,
  onClose,
  onSuccess
}) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Informe o motivo formal da recusa.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await CommercialApi.declineProposal(proposalId, versionNumber, {
        reason: reason.trim(),
        notes: notes || undefined,
        expectedVersion: expectedVersion ?? 1
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar recusa.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <XCircle className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 dark:text-white">Registrar Recusa de Proposta</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
            <div className="text-slate-600 dark:text-slate-400">Proposta: <strong className="text-slate-900 dark:text-white">{publicCode} (V{versionNumber})</strong></div>
            <div className="text-sky-600 dark:text-sky-400 pt-1 border-t border-slate-200 dark:border-slate-900">
              A negociação comercial permanecerá aberta no CRM. Você poderá criar uma Nova Versão com condições ajustadas.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Motivo Formal da Recusa *</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Taxa acima do orçamento / Contraproposta de 6%"
              required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Observações Adicionais</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes para embasar a próxima rodada de negociação..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-xl text-xs transition"
            >
              {submitting ? 'Registrando...' : 'Confirmar Recusa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// MODAL: ENVIO DA PROPOSTA AO PRODUTOR
// =============================================================================
interface SendModalProps {
  proposalId: string;
  versionNumber: number;
  expectedVersion?: number;
  publicCode: string;
  producerEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProposalSendModal: React.FC<SendModalProps> = ({
  proposalId,
  versionNumber,
  expectedVersion,
  publicCode,
  producerEmail,
  onClose,
  onSuccess
}) => {
  const [channel, setChannel] = useState<ProposalDeliveryChannel>('EMAIL');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState(producerEmail || '');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [messageBody, setMessageBody] = useState(
    `Prezados, segue proposta comercial formalizada pela DiskIngressos (${publicCode} V${versionNumber}). Permanecemos à disposição para alinhamentos.`
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      setError('Nome do destinatário no produtor é obrigatório.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await CommercialApi.sendProposal(proposalId, versionNumber, {
        channel,
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail || undefined,
        recipientPhone: recipientPhone || undefined,
        messageBody: messageBody || undefined,
        expectedVersion: expectedVersion ?? 1
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha ao enviar proposta comercial.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Send className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 dark:text-white">Enviar Proposta ao Produtor</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Canal de Envio *</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as ProposalDeliveryChannel)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:bg-white"
              >
                <option value="EMAIL">E-mail Formal</option>
                <option value="WHATSAPP">WhatsApp Comercial</option>
                <option value="LINK_PORTAL">Link de Acesso Seguro</option>
                <option value="MANUAL_HANDOFF">Entrega Presencial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Destinatário no Produtor *</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Nome do contato"
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="contato@produtor.com.br"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="(41) 99999-9999"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mensagem de Acompanhamento</label>
            <textarea
              rows={3}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              {submitting ? 'Enviando...' : 'Confirmar Envio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// MODAL: ALÇADA DE APROVAÇÃO INTERNA (APPROVE / REJECT)
// =============================================================================
interface ApprovalModalProps {
  proposalId: string;
  versionNumber: number;
  expectedVersion?: number;
  publicCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProposalApprovalModal: React.FC<ApprovalModalProps> = ({
  proposalId,
  versionNumber,
  expectedVersion,
  publicCode,
  onClose,
  onSuccess
}) => {
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (decision === 'REJECT' && !reason.trim()) {
      setError('Informe o motivo da reprovação interna.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await CommercialApi.processProposalDecision(proposalId, versionNumber, {
        decision,
        reason: reason || undefined,
        expectedVersion
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha ao processar decisão de aprovação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 dark:text-white">Alçada de Aprovação Comercial</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
            <div className="text-slate-600 dark:text-slate-400">Proposta: <strong className="text-slate-900 dark:text-white">{publicCode} (V{versionNumber})</strong></div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">
              Alçada vinculada estritamente ao contentHash canônico desta versão. Se os termos forem editados, a aprovação é invalidada.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Decisão da Alçada *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('APPROVE')}
                className={`p-3 rounded-xl border text-center font-semibold text-xs transition ${
                  decision === 'APPROVE'
                    ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                ✓ Aprovar Versão
              </button>
              <button
                type="button"
                onClick={() => setDecision('REJECT')}
                className={`p-3 rounded-xl border text-center font-semibold text-xs transition ${
                  decision === 'REJECT'
                    ? 'bg-rose-50 dark:bg-rose-950 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                ✕ Reprovar Internamente
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {decision === 'REJECT' ? 'Justificativa da Reprovação *' : 'Parecer / Observações'}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={decision === 'REJECT' ? 'Explique o motivo da reprovação (ex: taxa incompatível)...' : 'Observações adicionais sobre a aprovação...'}
              required={decision === 'REJECT'}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 text-white font-medium rounded-xl text-xs transition ${
                decision === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-xs'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-xs'
              }`}
            >
              {submitting ? 'Gravando...' : 'Confirmar Decisão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// MODAL: SUBMETER PARA ALÇADA DE APROVAÇÃO
// =============================================================================
interface SubmitApprovalModalProps {
  proposalId: string;
  versionNumber: number;
  expectedVersion?: number;
  publicCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProposalSubmitApprovalModal: React.FC<SubmitApprovalModalProps> = ({
  proposalId,
  versionNumber,
  expectedVersion,
  publicCode,
  onClose,
  onSuccess
}) => {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await CommercialApi.submitProposalApproval(proposalId, versionNumber, {
        justification: notes || undefined,
        expectedVersion: expectedVersion ?? 1
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha ao submeter proposta para aprovação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 dark:text-white">Submeter para Alçada Interna</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
            <div className="text-slate-600 dark:text-slate-400">Proposta: <strong className="text-slate-900 dark:text-white">{publicCode} (V{versionNumber})</strong></div>
            <div className="text-amber-700 dark:text-amber-400 text-[11px] pt-1 border-t border-slate-200 dark:border-slate-900">
              Esta ação congela a versão corrente para análise da Diretoria Comercial. Princípio Maker-Checker: o criador não pode aprovar sua própria proposta.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações / Justificativa para a Alçada
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Condição com desconto justificada por alto volume projetado no segundo semestre..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              {submitting ? 'Enviando...' : 'Submeter para Alçada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// MODAL: CANCELAR PROPOSTA
// =============================================================================
interface CancelModalProps {
  proposalId: string;
  publicCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProposalCancelModal: React.FC<CancelModalProps> = ({
  proposalId,
  publicCode,
  onClose,
  onSuccess
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Informe o motivo do cancelamento.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await CommercialApi.cancelProposal(proposalId, reason.trim());
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha ao cancelar proposta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 dark:text-white">Cancelar Proposta Comercial</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
            <div className="text-slate-600 dark:text-slate-400">Proposta: <strong className="text-slate-900 dark:text-white">{publicCode}</strong></div>
            <div className="text-rose-700 dark:text-rose-400 text-[11px] pt-1 border-t border-slate-200 dark:border-slate-900">
              O cancelamento é definitivo para esta proposta comercial. Se desejar reabrir tratativas no futuro, gere uma nova proposta vinculada à oportunidade.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motivo do Cancelamento *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Negociação encerrada pelo produtor / Mudança de escopo global..."
              required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs transition"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl text-xs transition"
            >
              {submitting ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// MODAL: CRIAR NOVA VERSÃO IMUTÁVEL
// =============================================================================
interface CreateVersionModalProps {
  proposalId: string;
  currentVersionNumber: number;
  expectedVersion?: number;
  publicCode: string;
  currentTerms?: any[];
  currentEvents?: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ProposalCreateVersionModal: React.FC<CreateVersionModalProps> = ({
  proposalId,
  currentVersionNumber,
  expectedVersion,
  publicCode,
  currentTerms,
  currentEvents,
  onClose,
  onSuccess
}) => {
  const [changeSummary, setChangeSummary] = useState('');
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeSummary.trim()) {
      setError('Descreva o sumário das alterações para o registro de auditoria.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await CommercialApi.createProposalVersion(proposalId, {
        changeSummary: changeSummary.trim(),
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        terms: currentTerms || [],
        events: currentEvents || [],
        expectedVersion: expectedVersion ?? 1
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha ao gerar nova versão da proposta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <h3 className="font-bold text-slate-900 dark:text-white">Criar Nova Versão (v{currentVersionNumber + 1})</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
            <div className="text-slate-600 dark:text-slate-400">Proposta: <strong className="text-slate-900 dark:text-white">{publicCode}</strong></div>
            <div className="text-slate-600 dark:text-slate-400">Versão Anterior: <span className="text-slate-700 dark:text-slate-300 font-mono">v{currentVersionNumber} (imutável)</span></div>
            <div className="text-orange-700 dark:text-orange-400 text-[11px] pt-1 border-t border-slate-200 dark:border-slate-900">
              A versão anterior será preservada com seu hash SHA-256 original. A nova versão v{currentVersionNumber + 1} nascerá em rascunho com os termos herdados para ajustes.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sumário da Mudança / Motivação da Revisão *
            </label>
            <textarea
              rows={3}
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="Ex: Revisão de comissão para 7,5% conforme contraproposta do produtor em reunião..."
              required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nova Validade da Proposta
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-xl text-xs transition"
            >
              {submitting ? 'Criando Versão...' : `Criar Versão v${currentVersionNumber + 1}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Aliases for intuitive imports
export const AcceptProposalModal = ProposalAcceptModal;
export const SendProposalModal = ProposalSendModal;
export const DeclineProposalModal = ProposalDeclineModal;
export const ApprovalDecisionModal = ProposalApprovalModal;
export const SubmitApprovalModal = ProposalSubmitApprovalModal;
export const CancelProposalModal = ProposalCancelModal;
export const CreateVersionModal = ProposalCreateVersionModal;

