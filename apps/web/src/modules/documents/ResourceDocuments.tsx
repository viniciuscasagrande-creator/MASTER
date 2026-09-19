import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Upload,
  Download,
  Eye,
  RefreshCw,
  Plus,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers
} from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { useDiskContext } from '../../core/context/DiskContext';
import { useAuth } from '../../core/auth/AuthContext';
import { formatDateTime } from '../../shared/utils/formatters';
import { DocumentItem, DocumentResourceType, DocumentStatus } from './documents.types';
import { DocumentUploaderModal } from './DocumentUploaderModal';
import { DocumentDetailsModal } from './DocumentDetailsModal';

interface ResourceDocumentsProps {
  resourceType: DocumentResourceType;
  resourceId: string;
  title?: string;
  readOnly?: boolean;
  className?: string;
}

export const ResourceDocuments: React.FC<ResourceDocumentsProps> = ({
  resourceType,
  resourceId,
  title = 'Anexos & Documentos Comprobatórios',
  readOnly = false,
  className = ''
}) => {
  const { apiFetch } = useDiskContext();
  const { hasPermission } = useAuth();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const loadDocuments = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await apiFetch(`/api/v1/resources/${resourceType}/${resourceId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(`Erro ao carregar anexos para ${resourceType}:${resourceId}:`, err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [apiFetch, resourceType, resourceId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDownload = async (docId: string) => {
    try {
      const res = await apiFetch(`/api/v1/documents/${docId}/download`);
      if (res.ok) {
        const data = await res.json();
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
        }
      }
    } catch (err) {
      console.error('Erro ao gerar link de download:', err);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="emerald">Disponível</Badge>;
      case 'QUARANTINED':
        return <Badge variant="amber">Em Quarentena</Badge>;
      case 'REJECTED':
        return <Badge variant="rose">Rejeitado</Badge>;
      case 'PROCESSING':
        return <Badge variant="cyan">Processando</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const canUpload = !readOnly && hasPermission('documentos.arquivo.enviar');

  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <Paperclip className="h-5 w-5 text-cyan-400" />
          <h3 className="font-semibold text-white text-base">{title}</h3>
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-mono font-medium text-slate-300">
            {documents.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDocuments(true)}
            disabled={isRefreshing}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {canUpload && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsUploaderOpen(true)}
              className="flex items-center gap-1.5 text-xs border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40"
            >
              <Plus className="h-3.5 w-3.5" />
              Anexar Arquivo
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
          Carregando anexos vinculados...
        </div>
      ) : documents.length === 0 ? (
        <div className="py-8 text-center">
          <Paperclip className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Nenhum documento ou anexo vinculado a este registro.</p>
          {canUpload && (
            <button
              onClick={() => setIsUploaderOpen(true)}
              className="mt-2 text-xs text-cyan-400 hover:underline font-medium inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Fazer upload agora
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => {
            const currVer = doc.currentVersion;
            return (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-800/40 p-3 transition-colors hover:bg-slate-800/70"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-cyan-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm truncate">
                        {doc.title}
                      </span>
                      <span className="rounded bg-cyan-950/60 px-1.5 py-0.2 text-[10px] font-bold text-cyan-300 border border-cyan-800/40 font-mono">
                        v{currVer?.version || 1}
                      </span>
                      {doc.isConfidential && (
                        <span className="rounded bg-rose-500/10 px-1.5 py-0.2 text-[10px] text-rose-400 border border-rose-500/20" title="Confidencial">
                          <Lock className="h-2.5 w-2.5 inline mr-0.5" /> Confidencial
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                      <span>{doc.category?.name || 'Geral'}</span>
                      <span>•</span>
                      <span>{formatFileSize(currVer?.size)}</span>
                      <span>•</span>
                      <span>{formatDateTime(doc.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {getStatusBadge(doc.status)}

                  <button
                    onClick={() => {
                      setSelectedDocument(doc);
                      setIsDetailsOpen(true);
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                    title="Detalhes e Versões"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDownload(doc.id)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-cyan-400 transition-colors"
                    title="Baixar Arquivo"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <DocumentUploaderModal
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        initialResourceType={resourceType}
        initialResourceId={resourceId}
        onSuccess={() => {
          loadDocuments(true);
        }}
      />

      <DocumentDetailsModal
        document={selectedDocument}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onRefresh={() => {
          loadDocuments(true);
        }}
      />
    </div>
  );
};
