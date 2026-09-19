import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  DollarSign,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { ApprovalRequestItem } from './approval.types';
import { ApprovalDetailsModal } from './ApprovalDetailsModal';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { useDiskContext } from '../../core/context/DiskContext';
import { useAuth } from '../../core/auth/AuthContext';
import { formatCurrency, formatDateTime } from '../../shared/utils/formatters';

export const ApprovalHistoryView: React.FC = () => {
  const { apiFetch } = useDiskContext();
  const { currentUser } = useAuth();

  const [items, setItems] = useState<ApprovalRequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequestItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/v1/approvals/history');
      if (res.ok) {
        const json = await res.json();
        setItems(json.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleOpenDetails = (req: ApprovalRequestItem) => {
    setSelectedRequest(req);
    setIsDetailsOpen(true);
  };

  const filteredItems = items.filter(item => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchCode = item.requestCode.toLowerCase().includes(term);
      const matchTitle = item.title.toLowerCase().includes(term);
      const matchReq = item.requesterName.toLowerCase().includes(term);
      if (!matchCode && !matchTitle && !matchReq) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Aprovado</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejeitado</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral">Cancelado</Badge>;
      default:
        return <Badge variant="primary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Histórico de Decisões</h1>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-800 text-gray-300 border border-gray-700">
              {items.length} registros
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Registro imutável e auditável de todas as decisões tomadas pelo Colegiado de Aprovações.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchHistory}
            isLoading={isLoading}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" /> Atualizar
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#1e222d] p-4 rounded-xl border border-gray-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Pesquisar histórico por código, solicitante ou título..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700/80 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-gray-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Todos os Resultados</option>
            <option value="APPROVED">Aprovados</option>
            <option value="REJECTED">Rejeitados</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
        </div>
      </div>

      {/* History Items */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <RefreshCw className="h-8 w-8 animate-spin mb-3 text-blue-400" />
          <p className="text-sm">Carregando histórico de governança...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-[#1e222d] rounded-2xl border border-gray-800 p-8">
          <History className="h-10 w-10 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Nenhum registro no histórico</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Não há solicitações finalizadas de acordo com os filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => handleOpenDetails(item)}
              className="p-5 bg-[#1e222d] border border-gray-800/80 hover:border-gray-700 rounded-xl transition cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                    {item.requestCode}
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {item.title}
                  </h3>
                  {getStatusBadge(item.status)}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-400">
                  <span className="text-gray-300">Solicitante: <strong>{item.requesterName}</strong></span>
                  {item.amount !== undefined && item.amount !== null && (
                    <span className="font-semibold text-emerald-400">
                      {formatCurrency(item.amount)}
                    </span>
                  )}
                  <span>Finalizado em: {formatDateTime(item.updatedAt)}</span>
                  <span>
                    Aprovações: <strong className="text-white">{item.approvalsCount} de {item.approvalsRequired}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={e => {
                    e.stopPropagation();
                    handleOpenDetails(item);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  Auditar Trilha <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedRequest && (
        <ApprovalDetailsModal
          request={selectedRequest}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onApprove={async () => {}}
          onReject={async () => {}}
          onRequestChanges={async () => {}}
          onCancel={async () => {}}
          onExecute={async () => {}}
          onAddComment={async () => {}}
          currentUserId={currentUser.id}
          userRoles={[currentUser.roleSlug.toUpperCase()]}
        />
      )}
    </div>
  );
};
