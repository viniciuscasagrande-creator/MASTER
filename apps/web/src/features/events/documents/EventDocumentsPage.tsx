import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Upload,
  Download,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { EventDocumentRequirementDTO, EventDocumentRequirementStatus } from '@shared/types/index';
import { fetchDocumentRequirements } from '../api/documents.api';
import { StatCard } from '../../../shared/components/StatCard';
import { Badge } from '../../../shared/components/Badge';
import { formatNumber, formatDateTime } from '../../../shared/utils/formatters';
import { UploadDocumentModal } from './UploadDocumentModal';

interface EventDocumentsPageProps {
  eventId: string;
  eventName?: string;
}

const STATUS_CONFIG: Record<EventDocumentRequirementStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  VALID: { label: 'Válido e Vigente', variant: 'success' },
  EXPIRING: { label: 'Vence em Breve (< 15 dias)', variant: 'warning' },
  EXPIRED: { label: 'Documento Vencido', variant: 'danger' },
  MISSING: { label: 'Documento Pendente', variant: 'danger' },
  UNDER_REVIEW: { label: 'Em Análise Jurídica', variant: 'info' },
  UPLOADED: { label: 'Enviado', variant: 'info' },
  REJECTED: { label: 'Recusado / Irregular', variant: 'danger' }
};

export const EventDocumentsPage: React.FC<EventDocumentsPageProps> = ({
  eventId,
  eventName
}) => {
  const [requirements, setRequirements] = useState<EventDocumentRequirementDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [selectedReq, setSelectedReq] = useState<EventDocumentRequirementDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDocumentRequirements(eventId);
      setRequirements(data || []);
    } catch (err) {
      console.error('Erro ao carregar requisitos documentais:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cálculos de conformidade
  const validCount = requirements.filter(r => r.status === 'VALID').length;
  const missingCount = requirements.filter(r => r.status === 'MISSING').length;
  const expiringCount = requirements.filter(r => r.status === 'EXPIRING' || r.status === 'EXPIRED').length;
  const blockingMissing = requirements.filter(r => r.blocking && r.status !== 'VALID').length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Central de Documentos & Conformidade Legal</h1>
            <Badge variant="info">Fase 1.2.8</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Requisitos regulatórios e alvarás obrigatórios para abertura de vendas e realização da operação na praça.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas de Conformidade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Documentos Válidos"
          value={`${validCount} / ${requirements.length}`}
          subtitle="Documentação aprovada e vigente"
          icon={<ShieldCheck className="h-5 w-5 text-emerald-400" />}
        />
        <StatCard
          title="Bloqueantes Pendentes"
          value={formatNumber(blockingMissing)}
          subtitle="Impedem abertura de vendas"
          icon={<XCircle className="h-5 w-5 text-rose-400" />}
        />
        <StatCard
          title="Pendentes de Envio"
          value={formatNumber(missingCount)}
          subtitle="Requerem protocolo e anexo"
          icon={<Clock className="h-5 w-5 text-amber-400" />}
        />
        <StatCard
          title="Alerta de Vencimento"
          value={formatNumber(expiringCount)}
          subtitle="Vencem nos próximos 15 dias"
          icon={<AlertTriangle className="h-5 w-5 text-cyan-400" />}
        />
      </div>

      {/* Alerta de Documentos Bloqueantes se houver */}
      {blockingMissing > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5">Alerta Crítico de Publicação / Operação:</strong>
            Existem {blockingMissing} documento(s) com caráter bloqueante que ainda não foram homologados como válidos. O Readiness Engine manterá o evento bloqueado para publicação até o saneamento destas exigências.
          </div>
        </div>
      )}

      {/* Lista de Requisitos Documentais */}
      <div className="space-y-3">
        {requirements.map(req => {
          const cfg = STATUS_CONFIG[req.status] || { label: req.status, variant: 'default' };

          return (
            <div
              key={req.id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700/80 transition-all"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                    req.status === 'VALID'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : req.blocking
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white">{req.categoryName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {req.categoryCode}
                    </span>
                    {req.blocking && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
                        Bloqueante
                      </span>
                    )}
                  </div>

                  {req.notes && <p className="text-xs text-slate-400 mt-1">{req.notes}</p>}

                  {req.linkedDocumentName && (
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1 text-slate-300 font-mono">
                        <FileCheck2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{req.linkedDocumentName}</span>
                        {req.fileSize && <span className="text-[11px] text-slate-500">({req.fileSize})</span>}
                      </span>

                      {req.validUntil && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <span>Válido até: <strong className="text-slate-200">{formatDateTime(req.validUntil)}</strong></span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <Badge variant={cfg.variant}>{cfg.label}</Badge>

                <button
                  onClick={() => {
                    setSelectedReq(req);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
                >
                  <Upload className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{req.status === 'VALID' ? 'Substituir / Renovar' : 'Anexar Documento'}</span>
                </button>
              </div>
            </div>
          );
        })}

        {requirements.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-xs text-slate-500">
            Nenhum requisito documental cadastrado para este evento.
          </div>
        )}
      </div>

      {/* Modal de Anexo */}
      {selectedReq && (
        <UploadDocumentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedReq(null);
          }}
          eventId={eventId}
          requirement={selectedReq}
          onSaved={loadData}
        />
      )}
    </div>
  );
};
