import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Upload,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Download,
  Eye,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  HardDrive,
  FileCheck,
  FileWarning,
  FileCode,
  Calendar,
  Lock,
  ExternalLink
} from 'lucide-react';
import { StatCard } from '../../shared/components/StatCard';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { useDiskContext } from '../../core/context/DiskContext';
import { useAuth } from '../../core/auth/AuthContext';
import { formatDateTime } from '../../shared/utils/formatters';
import { DocumentItem, DocumentCategoryItem, DocumentStatus } from './documents.types';
import { DocumentUploaderModal } from './DocumentUploaderModal';
import { DocumentDetailsModal } from './DocumentDetailsModal';

interface DocumentCenterViewProps {
  onNavigate?: (moduleId: string, subItemId?: string) => void;
}

export const DocumentCenterView: React.FC<DocumentCenterViewProps> = ({ onNavigate }) => {
  const { apiFetch, activeProducer, activeEvent } = useDiskContext();
  const { hasPermission } = useAuth();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [categories, setCategories] = useState<DocumentCategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    quarantined: 0,
    expiring: 0,
    totalSizeBytes: 0
  });

  const loadCategories = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/documents/categories');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar categorias de documentos:', err);
    }
  }, [apiFetch]);

  const loadDocuments = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedCategory !== 'all') params.append('categoryId', selectedCategory);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (activeProducer?.id) params.append('producerId', activeProducer.id);
      if (activeEvent?.id) params.append('eventId', activeEvent.id);
      params.append('limit', '100');

      const res = await apiFetch(`/api/v1/documents?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const docs: DocumentItem[] = json.data || [];
        setDocuments(docs);

        // Calculate stats
        let avail = 0;
        let quar = 0;
        let exp = 0;
        let totalBytes = 0;
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        docs.forEach(doc => {
          if (doc.status === 'AVAILABLE') avail++;
          if (doc.status === 'QUARANTINED' || doc.status === 'PROCESSING') quar++;
          if (doc.validUntil) {
            const until = new Date(doc.validUntil);
            if (until > now && until <= thirtyDaysFromNow) {
              exp++;
            }
          }
          if (doc.currentVersion?.size) {
            totalBytes += doc.currentVersion.size;
          }
        });

        setStats({
          total: json.total ?? docs.length,
          available: avail,
          quarantined: quar,
          expiring: exp,
          totalSizeBytes: totalBytes
        });
      }
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [apiFetch, searchQuery, selectedCategory, selectedStatus, activeProducer?.id, activeEvent?.id]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleOpenDetails = (doc: DocumentItem) => {
    setSelectedDocument(doc);
    setIsDetailsOpen(true);
  };

  const handleQuickDownload = async (doc: DocumentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await apiFetch(`/api/v1/documents/${doc.id}/download`);
      if (res.ok) {
        const data = await res.json();
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
        }
      }
    } catch (err) {
      console.error('Erro ao baixar documento:', err);
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
        return <Badge variant="amber">Quarentena</Badge>;
      case 'REJECTED':
        return <Badge variant="rose">Rejeitado</Badge>;
      case 'PROCESSING':
        return <Badge variant="cyan">Processando</Badge>;
      case 'EXPIRED':
        return <Badge variant="slate">Expirado</Badge>;
      case 'ARCHIVED':
        return <Badge variant="purple">Arquivado</Badge>;
      case 'DELETED':
        return <Badge variant="rose">Excluído</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const canUpload = hasPermission('documentos.arquivo.enviar');

  return (
    <div className="space-y-6 p-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Gestão Documental
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">Fase 1.1.5.8</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <FileText className="h-7 w-7 text-cyan-400" />
            Central de Documentos e Anexos
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Repositório unificado de contratos, notas fiscais, comprovantes e anexos com integridade criptográfica SHA-256 e versionamento imutável.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => loadDocuments(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            Atualizar
          </Button>

          {canUpload && (
            <Button
              variant="primary"
              onClick={() => setIsUploaderOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-950/40"
            >
              <Upload className="h-4 w-4" />
              Novo Upload
            </Button>
          )}
        </div>
      </div>

      {/* Active Context Scope Alert if scoped */}
      {(activeProducer || activeEvent) && (
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs text-cyan-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>
              Filtro ativo por contexto de sessão: 
              {activeProducer && <strong className="ml-1 text-white">Produtor: {activeProducer.name}</strong>}
              {activeEvent && <strong className="ml-2 text-white">Evento: {activeEvent.name}</strong>}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Isolamento RBAC aplicado</span>
        </div>
      )}

      {/* StatCards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total de Arquivos"
          value={stats.total}
          subtitle="Documentos cadastrados"
          icon={<HardDrive className="h-5 w-5 text-cyan-400" />}
          badge="Catálogo"
          badgeVariant="cyan"
        />
        <StatCard
          title="Disponíveis"
          value={stats.available}
          subtitle="Aprovados pelo antivírus"
          icon={<FileCheck className="h-5 w-5 text-emerald-400" />}
          badge="Seguros"
          badgeVariant="emerald"
        />
        <StatCard
          title="Quarentena"
          value={stats.quarantined}
          subtitle="Em varredura / suspeitos"
          icon={<FileWarning className="h-5 w-5 text-amber-400" />}
          badge="Alerta"
          badgeVariant="amber"
        />
        <StatCard
          title="A Vencer"
          value={stats.expiring}
          subtitle="Vencendo em até 30 dias"
          icon={<Clock className="h-5 w-5 text-orange-400" />}
          badge="Expiração"
          badgeVariant="orange"
        />
        <StatCard
          title="Armazenamento"
          value={formatFileSize(stats.totalSizeBytes)}
          subtitle="Volume em disco local"
          icon={<Layers className="h-5 w-5 text-purple-400" />}
          badge="Storage"
          badgeVariant="purple"
        />
      </div>

      {/* Filters & Search Toolbar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por título, arquivo, tag ou motivo..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="h-3.5 w-3.5" />
              <span>Filtros:</span>
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.code})
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">Todos os Status</option>
              <option value="AVAILABLE">Disponível</option>
              <option value="QUARANTINED">Em Quarentena</option>
              <option value="PROCESSING">Processando</option>
              <option value="REJECTED">Rejeitado</option>
              <option value="EXPIRED">Expirado</option>
              <option value="ARCHIVED">Arquivado</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800/50 p-0.5 ml-2">
              <button
                onClick={() => setViewMode('table')}
                className={`rounded p-1.5 transition-colors ${viewMode === 'table' ? 'bg-cyan-600/30 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                title="Visualização em Tabela"
              >
                <TableIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-cyan-600/30 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                title="Visualização em Grade"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Content */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
            <span className="text-sm">Carregando repositório de documentos...</span>
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/80 text-slate-500 mb-4">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-white">Nenhum documento encontrado</h3>
          <p className="mt-1 text-sm text-slate-400 max-w-md">
            Não há arquivos correspondentes aos filtros selecionados ou associados ao contexto operacional atual.
          </p>
          {canUpload && (
            <Button
              variant="primary"
              onClick={() => setIsUploaderOpen(true)}
              className="mt-4 flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Fazer Primeiro Upload
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-800/40 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Documento</th>
                  <th className="px-4 py-3 font-semibold">Categoria</th>
                  <th className="px-4 py-3 font-semibold">Versão</th>
                  <th className="px-4 py-3 font-semibold">Tamanho</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Vencimento</th>
                  <th className="px-4 py-3 font-semibold">Criador / Data</th>
                  <th className="px-4 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {documents.map(doc => {
                  const currVer = doc.currentVersion;
                  const isExpiringSoon = doc.validUntil && new Date(doc.validUntil) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => handleOpenDetails(doc)}
                      className="cursor-pointer transition-colors hover:bg-slate-800/40"
                    >
                      {/* Title & Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-cyan-400">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white hover:text-cyan-400 transition-colors">
                                {doc.title}
                              </span>
                              {doc.isConfidential && (
                                <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-400 border border-rose-500/20" title="Documento Confidencial">
                                  <Lock className="h-3 w-3" /> Confidencial
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              {currVer?.originalFileName || 'arquivo'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300 border border-slate-700">
                          {doc.category?.name || 'Geral'}
                        </span>
                      </td>

                      {/* Version Pill */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-cyan-950/60 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-800/40 font-mono">
                          v{currVer?.version || 1}
                        </span>
                      </td>

                      {/* File Size */}
                      <td className="px-4 py-3.5 text-xs text-slate-400 font-mono">
                        {formatFileSize(currVer?.size)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {getStatusBadge(doc.status)}
                      </td>

                      {/* Valid Until */}
                      <td className="px-4 py-3.5 text-xs">
                        {doc.validUntil ? (
                          <span className={`font-mono ${isExpiringSoon ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
                            {new Date(doc.validUntil).toLocaleDateString('pt-BR')}
                            {isExpiringSoon && ' ⚠️'}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Creator & Date */}
                      <td className="px-4 py-3.5 text-xs text-slate-400">
                        <div>{doc.creatorName || 'Sistema'}</div>
                        <div className="text-[11px] text-slate-500">
                          {formatDateTime(doc.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenDetails(doc)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                            title="Ver Detalhes, Versões e Auditoria"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={e => handleQuickDownload(doc, e)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
                            title="Download Seguro (HMAC)"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid / Cards View */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {documents.map(doc => {
            const currVer = doc.currentVersion;
            return (
              <div
                key={doc.id}
                onClick={() => handleOpenDetails(doc)}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-900/90 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-cyan-400 group-hover:border-cyan-500/40">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-cyan-950/80 px-2 py-0.5 text-[11px] font-bold text-cyan-300 border border-cyan-800 font-mono">
                      v{currVer?.version || 1}
                    </span>
                    {getStatusBadge(doc.status)}
                  </div>
                </div>

                <div className="mt-3">
                  <h4 className="font-semibold text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">
                    {doc.title}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono line-clamp-1 mt-0.5">
                    {currVer?.originalFileName || 'arquivo'}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-400">
                  <span>{doc.category?.name || 'Geral'}</span>
                  <span className="font-mono">{formatFileSize(currVer?.size)}</span>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{formatDateTime(doc.createdAt)}</span>
                  <button
                    onClick={e => handleQuickDownload(doc, e)}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    <Download className="h-3 w-3" /> Baixar
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
