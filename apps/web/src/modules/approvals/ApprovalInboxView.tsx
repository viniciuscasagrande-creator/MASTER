import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  RefreshCw,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  User,
  Building2,
  DollarSign,
  Calendar,
  CheckCircle2,
  Lock,
  FileText
} from 'lucide-react';
import { ApprovalRequestItem } from './approval.types';
import { ApprovalDetailsModal } from './ApprovalDetailsModal';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { useDiskContext } from '../../core/context/DiskContext';
import { useAuth } from '../../core/auth/AuthContext';
import { formatCurrency, formatDateTime } from '../../shared/utils/formatters';

interface ApprovalInboxViewProps {
  onNavigate?: (moduleId: string, subItemId?: string) => void;
}

export const ApprovalInboxView: React.FC<ApprovalInboxViewProps> = ({ onNavigate }) => {
  const { apiFetch } = useDiskContext();
  const { currentUser } = useAuth();

  const [items, setItems] = useState<ApprovalRequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequestItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [operationFilter, setOperationFilter] = useState('ALL');

  const fetchInbox = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/v1/approvals/inbox');
      if (res.ok) {
        const json = await res.json();
        setItems(json.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar caixa de aprovações:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  const handleOpenDetails = (req: ApprovalRequestItem) => {
    setSelectedRequest(req);
    setIsDetailsOpen(true);
  };

  const handleApprove = async (requestId: string, stepId?: string, comment?: string, stepUpToken?: string) => {
    const res = await apiFetch(`/api/v1/approvals/${requestId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(stepUpToken ? { 'x-step-up-token': stepUpToken } : {})
      },
      body: JSON.stringify({ stepId, comment, stepUpToken })
    });

    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.error || 'Falha ao aprovar etapa.');
    }

    await fetchInbox();
  };

  const handleReject = async (requestId: string, reason: string) => {
    const res = await apiFetch(`/api/v1/approvals/${requestId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });

    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.error || 'Falha ao rejeitar solicitação.');
    }

    await fetchInbox();
  };

  const handleRequestChanges = async (requestId: string, comment: string) => {
    const res = await apiFetch(`/api/v1/approvals/${requestId}/request-changes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment })
    });

    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.error || 'Falha ao solicitar alterações.');
    }

    await fetchInbox();
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

    await fetchInbox();
  };

  const handleExecute = async (requestId: string) => {
    const res = await apiFetch(`/api/v1/approvals/${requestId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.error || 'Falha ao executar operação.');
    }

    await fetchInbox();
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

    // Refresh selected request details
    const detRes = await apiFetch(`/api/v1/approvals/${requestId}`);
    if (detRes.ok) {
      const json = await detRes.json();
      setSelectedRequest(json.data);
    }
  };

  const filteredItems = items.filter(item => {
    if (operationFilter !== 'ALL' && item.operation !== operationFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchCode = item.requestCode.toLowerCase().includes(term);
      const matchTitle = item.title.toLowerCase().includes(term);
      const matchReq = item.requesterName.toLowerCase().includes(term);
      if (!matchCode && !matchTitle && !matchReq) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Minha Caixa de Entrada</h1>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {filteredItems.length} pendente(s)
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Solicitações aguardando sua análise e aval, respeitando matriz de alçada, segregação e dupla validação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInbox}
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
            placeholder="Filtrar por código (APR-...), título ou solicitante..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700/80 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-gray-500 shrink-0" />
          <select
            value={operationFilter}
            onChange={e => setOperationFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Todas as Operações</option>
            <option value="FINANCE_TRANSFER">Transferências Financeiras</option>
            <option value="REFUND_REQUEST">Estornos & Devoluções</option>
            <option value="FINANCE_ADVANCE">Antecipações Financeiras</option>
            <option value="FINANCE_PAYOUT">Repasses de Bilheteria</option>
            <option value="ADMIN_PERMISSION_CHANGE">Permissões Administrativas</option>
          </select>
        </div>
      </div>

      {/* Inbox List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <RefreshCw className="h-8 w-8 animate-spin mb-3 text-orange-400" />
          <p className="text-sm">Carregando itens pendentes de aprovação...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-[#1e222d] rounded-2xl border border-gray-800 p-8">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Tudo em dia!</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Você não possui nenhuma solicitação pendente para o seu perfil e alçada no momento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => {
            const hasExceededThreshold = item.hasSufficientThreshold === false;

            return (
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
                    <Badge variant={item.status === 'APPROVED' ? 'success' : 'warning'}>
                      {item.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1 text-gray-300">
                      <User className="h-3.5 w-3.5 text-gray-500" /> {item.requesterName}
                    </span>
                    {item.amount !== undefined && item.amount !== null && (
                      <span className="flex items-center gap-1 font-semibold text-emerald-400">
                        <DollarSign className="h-3.5 w-3.5" /> {formatCurrency(item.amount)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-gray-500" /> {formatDateTime(item.createdAt)}
                    </span>
                    <span className="text-gray-400">
                      Etapa: <strong>{item.currentStep} de {item.approvalsRequired}</strong>
                    </span>
                  </div>

                  {hasExceededThreshold && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Valor excede seu limite de alçada pessoal (R$ {item.thresholdLimit?.toFixed(2)}). Requer perfil superior.
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={e => {
                      e.stopPropagation();
                      handleOpenDetails(item);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Avaliar Solicitação <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedRequest && (
        <ApprovalDetailsModal
          request={selectedRequest}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestChanges={handleRequestChanges}
          onCancel={handleCancel}
          onExecute={handleExecute}
          onAddComment={handleAddComment}
          currentUserId={currentUser.id}
          userRoles={[currentUser.roleSlug.toUpperCase()]}
        />
      )}
    </div>
  );
};
