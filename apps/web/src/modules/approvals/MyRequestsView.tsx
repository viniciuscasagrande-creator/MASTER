import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { ApprovalRequestItem } from './approval.types';
import { ApprovalDetailsModal } from './ApprovalDetailsModal';
import { NewApprovalRequestModal } from './NewApprovalRequestModal';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { useDiskContext } from '../../core/context/DiskContext';
import { useAuth } from '../../core/auth/AuthContext';
import { formatCurrency, formatDateTime } from '../../shared/utils/formatters';

export const MyRequestsView: React.FC = () => {
  const { apiFetch } = useDiskContext();
  const { currentUser } = useAuth();

  const [items, setItems] = useState<ApprovalRequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequestItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchMyRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/v1/approvals/my-requests');
      if (res.ok) {
        const json = await res.json();
        setItems(json.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar minhas solicitações:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  const handleOpenDetails = (req: ApprovalRequestItem) => {
    setSelectedRequest(req);
    setIsDetailsOpen(true);
  };

  const handleCreateRequest = async (data: any) => {
    const res = await apiFetch('/api/v1/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.error || 'Falha ao criar solicitação.');
    }

    await fetchMyRequests();
  };

  const handleSimulate = async (data: any) => {
    const res = await apiFetch('/api/v1/admin/approval-rules/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
    return null;
  };

  const handleCancel = async (requestId: string, reason?: string) => {
    const res = await apiFetch(`/api/v1/approvals/${requestId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });

    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.error || 'Falha ao cancelar solicitação.');
    }

    await fetchMyRequests();
  };

  const handleAddComment = async (requestId: string, comment: string) => {
    const res = await apiFetch(`/api/v1/approvals/${requestId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment })
    });

    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.error || 'Falha ao adicionar comentário.');
    }

    const detRes = await apiFetch(`/api/v1/approvals/${requestId}`);
    if (detRes.ok) {
      const json = await detRes.json();
      setSelectedRequest(json.data);
    }
  };

  const filteredItems = items.filter(item => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchCode = item.requestCode.toLowerCase().includes(term);
      const matchTitle = item.title.toLowerCase().includes(term);
      if (!matchCode && !matchTitle) return false;
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
      case 'ACTION_REQUIRED':
        return <Badge variant="warning">Ajustes Requeridos</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="primary">Em Análise</Badge>;
      default:
        return <Badge variant="warning">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-orange-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Minhas Solicitações</h1>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-800 text-gray-300 border border-gray-700">
              {items.length} total
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Acompanhe em tempo real o status, pareceres técnicos e histórico de aprovação dos seus pedidos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchMyRequests}
            isLoading={isLoading}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" /> Atualizar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Nova Solicitação
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#1e222d] p-4 rounded-xl border border-gray-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por código ou título..."
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
            <option value="ALL">Todos os Status</option>
            <option value="PENDING">Pendentes</option>
            <option value="IN_PROGRESS">Em Análise</option>
            <option value="ACTION_REQUIRED">Ajustes Requeridos</option>
            <option value="APPROVED">Aprovados</option>
            <option value="REJECTED">Rejeitados</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <RefreshCw className="h-8 w-8 animate-spin mb-3 text-orange-400" />
          <p className="text-sm">Carregando suas solicitações...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-[#1e222d] rounded-2xl border border-gray-800 p-8">
          <FileText className="h-10 w-10 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Nenhuma solicitação encontrada</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-4">
            Você ainda não criou solicitações ou nenhuma atende aos filtros selecionados.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Criar Primeira Solicitação
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => handleOpenDetails(item)}
              className="group p-5 bg-[#1e222d] border border-gray-800/80 hover:border-orange-500/50 rounded-xl transition cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {item.requestCode}
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition">
                    {item.title}
                  </h3>
                  {getStatusBadge(item.status)}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-400">
                  <span className="text-gray-300">Operação: <strong>{item.operation}</strong></span>
                  {item.amount !== undefined && item.amount !== null && (
                    <span className="font-semibold text-emerald-400">
                      {formatCurrency(item.amount)}
                    </span>
                  )}
                  <span>Criado: {formatDateTime(item.createdAt)}</span>
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
                  className="text-gray-300 hover:text-white"
                >
                  Ver Histórico <ArrowRight className="h-4 w-4 ml-1.5" />
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
          onCancel={handleCancel}
          onExecute={async () => {}}
          onAddComment={handleAddComment}
          currentUserId={currentUser.id}
          userRoles={[currentUser.roleSlug.toUpperCase()]}
        />
      )}

      {/* New Request Modal */}
      <NewApprovalRequestModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreateRequest}
        onSimulate={handleSimulate}
      />
    </div>
  );
};
