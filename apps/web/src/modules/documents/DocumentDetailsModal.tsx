import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  History,
  Link as LinkIcon,
  Shield,
  Clock,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Archive,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { DocumentItem, DocumentVersionItem } from './documents.types';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { useDiskContext } from '../../core/context/DiskContext';
import { formatDateTime } from '../../shared/utils/formatters';

interface DocumentDetailsModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const DocumentDetailsModal: React.FC<DocumentDetailsModalProps> = ({
  document,
  isOpen,
  onClose,
  onRefresh
}) => {
  const { apiFetch } = useDiskContext();

  const [activeTab, setActiveTab] = useState<'details' | 'versions' | 'links' | 'audit'>('details');
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // New Version State
  const [isNewVersionOpen, setIsNewVersionOpen] = useState(false);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionBase64, setNewVersionBase64] = useState<string | null>(null);
  const [changeReason, setChangeReason] = useState('');
  const [isSubmittingVersion, setIsSubmittingVersion] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!isOpen || !document) return null;

  const handleDownload = async (versionId?: string) => {
    setIsDownloading(true);
    setActionError(null);
    try {
      const url = `/api/v1/documents/${document.id}/download${versionId ? `?versionId=${versionId}` : ''}`;
      const res = await apiFetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar link de download.');
      }

      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    } catch (err: any) {
      setActionError(err.message || 'Falha ao baixar arquivo.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyChecksum = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setNewVersionFile(f);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewVersionBase64(reader.result as string);
      };
      reader.readAsDataURL(f);
    }
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionFile || !newVersionBase64) {
      setActionError('Selecione o arquivo da nova versão.');
      return;
    }
    if (!changeReason || changeReason.trim().length < 3) {
      setActionError('O motivo da nova versão é obrigatório (mínimo 3 caracteres).');
      return;
    }

    setIsSubmittingVersion(true);
    setActionError(null);

    try {
      const res = await apiFetch(`/api/v1/documents/${document.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileContent: newVersionBase64,
          fileName: newVersionFile.name,
          mimeType: newVersionFile.type || 'application/octet-stream',
          changeReason: changeReason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar nova versão.');
      }

      setActionSuccess(`Nova versão registrada com sucesso!`);
      setIsNewVersionOpen(false);
      setNewVersionFile(null);
      setNewVersionBase64(null);
      setChangeReason('');
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Falha ao enviar nova versão.');
    } finally {
      setIsSubmittingVersion(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Tem certeza que deseja arquivar este documento?')) return;
    try {
      const res = await apiFetch(`/api/v1/documents/${document.id}/archive`, { method: 'POST' });
      if (res.ok) {
        setActionSuccess('Documento arquivado com sucesso.');
        onRefresh();
      }
    } catch (err: any) {
      setActionError(err.message || 'Erro ao arquivar documento.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja solicitar a exclusão lógica deste documento?')) return;
    try {
      const res = await apiFetch(`/api/v1/documents/${document.id}`, { method: 'DELETE' });
      if (res.ok) {
        setActionSuccess('Documento excluído com respeito às políticas de retenção legal.');
        onRefresh();
        setTimeout(onClose, 1000);
      }
    } catch (err: any) {
      setActionError(err.message || 'Erro ao excluir documento.');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{document.title}</h2>
                <Badge variant={document.status === 'AVAILABLE' ? 'success' : document.status === 'QUARANTINED' ? 'danger' : 'default'}>
                  {document.status === 'AVAILABLE' ? 'Disponível' : document.status === 'QUARANTINED' ? 'Em Quarentena' : document.status}
                </Badge>
                {document.isConfidential && (
                  <Badge variant="warning">🔒 Confidencial</Badge>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Categoria: <span className="text-neutral-200">{document.category?.name || 'Geral'}</span> • Versão Atual: <span className="text-sky-400 font-semibold">v{document.currentVersion?.version || 1}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action / Feedback Banner */}
        {actionError && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Action Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleDownload()}
              disabled={isDownloading || document.status === 'QUARANTINED'}
              className="bg-sky-600 hover:bg-sky-500 text-white font-medium"
            >
              <Download className="h-4 w-4 mr-1.5" />
              {isDownloading ? 'Gerando Link...' : 'Baixar Arquivo'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewVersionOpen(!isNewVersionOpen)}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Nova Versão
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleArchive}>
              <Archive className="h-4 w-4 mr-1.5 text-neutral-400" />
              Arquivar
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
              <Trash2 className="h-4 w-4 mr-1.5" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Inline New Version Uploader */}
        {isNewVersionOpen && (
          <form onSubmit={handleCreateVersion} className="mx-6 mt-4 rounded-xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-sky-300 flex items-center gap-2">
                <Upload className="h-4 w-4" /> Enviar Nova Versão (v{(document.currentVersion?.version || 1) + 1})
              </h3>
              <button type="button" onClick={() => setIsNewVersionOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Novo Arquivo *</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  required
                  className="w-full text-xs text-neutral-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Motivo da Nova Versão *</label>
                <input
                  type="text"
                  value={changeReason}
                  onChange={e => setChangeReason(e.target.value)}
                  placeholder="Ex: Assinatura atualizada, aditivo de cláusula"
                  required
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-hidden"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" type="button" onClick={() => setIsNewVersionOpen(false)}>
                Cancelar
              </Button>
              <Button size="sm" variant="primary" type="submit" disabled={isSubmittingVersion || !newVersionFile} className="bg-sky-600 hover:bg-sky-500">
                {isSubmittingVersion ? 'Salvando...' : 'Confirmar Nova Versão'}
              </Button>
            </div>
          </form>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 px-6 pt-3 gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 border-b-2 transition ${activeTab === 'details' ? 'border-sky-400 text-sky-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${activeTab === 'versions' ? 'border-sky-400 text-sky-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
          >
            <History className="h-4 w-4" />
            Histórico de Versões ({document.versions?.length || 1})
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${activeTab === 'links' ? 'border-sky-400 text-sky-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
          >
            <LinkIcon className="h-4 w-4" />
            Vínculos ({document.links?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${activeTab === 'audit' ? 'border-sky-400 text-sky-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
          >
            <Shield className="h-4 w-4" />
            Auditoria & Acessos
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Metadata Card */}
              <div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Metadados do Arquivo
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Arquivo Original:</span>
                    <span className="font-mono text-neutral-200">{document.currentVersion?.originalFileName || 'documento.bin'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Tamanho:</span>
                    <span className="text-neutral-200">{formatFileSize(document.currentVersion?.size)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Tipo MIME:</span>
                    <span className="font-mono text-neutral-200">{document.currentVersion?.mimeType || 'application/octet-stream'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Enviado em:</span>
                    <span className="text-neutral-200">{formatDateTime(document.createdAt)}</span>
                  </div>
                  {document.validUntil && (
                    <div className="flex justify-between py-1 border-b border-neutral-800/60">
                      <span className="text-neutral-400">Validade Legal:</span>
                      <span className="text-amber-400 font-semibold">{formatDateTime(document.validUntil)}</span>
                    </div>
                  )}
                </div>

                {/* Cryptographic SHA-256 Checksum */}
                {document.currentVersion?.checksum && (
                  <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-neutral-400">Checksum Criptográfico (SHA-256)</span>
                      <button
                        onClick={() => handleCopyChecksum(document.currentVersion!.checksum)}
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        {copiedHash === document.currentVersion.checksum ? (
                          <><Check className="h-3 w-3" /> Copiado</>
                        ) : (
                          <><Copy className="h-3 w-3" /> Copiar Hash</>
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-xs text-neutral-300 break-all select-all">
                      {document.currentVersion.checksum}
                    </p>
                  </div>
                )}
              </div>

              {/* Scope & Context Card */}
              <div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Escopo e Rastreabilidade
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">ID do Documento:</span>
                    <span className="font-mono text-xs text-neutral-400">{document.id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Produtor:</span>
                    <span className="text-neutral-200">{document.producerId || 'Geral / Plataforma'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Evento:</span>
                    <span className="text-neutral-200">{document.eventId || 'Todos os Eventos'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Retenção Obrigatória:</span>
                    <span className="text-neutral-200">{document.category?.retentionDays ? `${document.category.retentionDays} dias` : 'Permanente'}</span>
                  </div>
                </div>

                {document.description && (
                  <div className="mt-2">
                    <span className="text-xs font-semibold text-neutral-400">Observações:</span>
                    <p className="text-sm text-neutral-300 mt-1">{document.description}</p>
                  </div>
                )}

                {document.tags && document.tags.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-semibold text-neutral-400 block mb-1.5">Tags:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {document.tags.map((tag, idx) => (
                        <span key={idx} className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300 border border-neutral-700">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-400">
                O Disk Interno adota versionamento imutável: nenhuma versão existente é modificada ou excluída.
              </p>
              <div className="space-y-3">
                {document.versions && document.versions.length > 0 ? (
                  document.versions.map((ver: DocumentVersionItem) => (
                    <div
                      key={ver.id}
                      className={`rounded-xl border p-4 transition ${ver.id === document.currentVersionId ? 'border-sky-500/40 bg-sky-950/15' : 'border-neutral-800 bg-neutral-950/40'}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm ${ver.id === document.currentVersionId ? 'bg-sky-500 text-white' : 'bg-neutral-800 text-neutral-300'}`}>
                            v{ver.version}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{ver.originalFileName}</span>
                              {ver.id === document.currentVersionId && (
                                <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-500/30">
                                  Versão Atual
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-neutral-400">
                              {formatDateTime(ver.createdAt)} • {formatFileSize(ver.size)}
                            </span>
                          </div>
                        </div>

                        <Button size="sm" variant="ghost" onClick={() => handleDownload(ver.id)} className="text-sky-400 hover:text-sky-300">
                          <Download className="h-4 w-4 mr-1" /> Baixar v{ver.version}
                        </Button>
                      </div>

                      {ver.changeReason && (
                        <div className="mt-2 text-xs text-neutral-300 pl-11">
                          <span className="text-neutral-500">Motivo: </span>
                          {ver.changeReason}
                        </div>
                      )}

                      <div className="mt-2 pl-11 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                        <span className="truncate max-w-md">SHA-256: {ver.checksum}</span>
                        <button onClick={() => handleCopyChecksum(ver.checksum)} className="hover:text-neutral-300">
                          {copiedHash === ver.checksum ? 'Copiado!' : 'Copiar Hash'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-sm text-neutral-400">Nenhuma versão listada.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'links' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-400">
                Recursos do sistema vinculados a este documento (multi-vínculo):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {document.links && document.links.length > 0 ? (
                  document.links.map(link => (
                    <div key={link.id} className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/40 p-3">
                      <div className="flex items-center gap-2.5">
                        <Badge variant="info">{link.resourceType}</Badge>
                        <span className="font-mono text-xs text-white">{link.resourceId}</span>
                      </div>
                      <span className="text-[11px] text-neutral-500">{formatDateTime(link.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-6 text-sm text-neutral-400">Nenhum vínculo registrado.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-400">
                Trilha de auditoria e registro de acessos (visualizações, downloads e alterações):
              </p>
              <div className="space-y-2">
                {document.accessLogs && document.accessLogs.length > 0 ? (
                  document.accessLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between rounded-lg border border-neutral-800/80 bg-neutral-950/30 p-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold ${log.action === 'DOWNLOAD' ? 'text-emerald-400' : log.action === 'PREVIEW' ? 'text-sky-400' : log.action === 'VERSION_CREATE' ? 'text-amber-400' : 'text-neutral-300'}`}>
                          {log.action}
                        </span>
                        <span className="text-neutral-400">• Usuário: <span className="text-neutral-200">{log.userName || log.userId}</span></span>
                      </div>
                      <div className="flex items-center gap-3 text-neutral-500">
                        <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-sm text-neutral-400">Nenhum registro de acesso nesta sessão.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
