import React from 'react';
import {
  ShieldCheck,
  Users,
  KeyRound,
  Building2,
  Lock,
  Activity,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  Laptop
} from 'lucide-react';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { useAuth } from '../../core/auth/AuthContext';
import { useCoreData } from '../../core/context/CoreDataContext';

interface AdminDashboardViewProps {
  onNavigateSubItem?: (subItemId: string) => void;
  onOpenNewUser?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigateSubItem,
  onOpenNewUser
}) => {
  const { users } = useAuth();
  const { auditLogs } = useCoreData();

  const activeUsers = users.filter(u => u.status === 'active').length;
  const twoFactorUsers = users.filter(u => u.twoFactorEnforced).length;
  const producerUsers = users.filter(u => u.scope.type === 'PRODUCER').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              PAINEL ADMINISTRATIVO & GOVERNANÇA
            </h1>
            <Badge variant="orange" size="sm">Fase 1.1.5.2</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestão centralizada de identidade, matriz RBAC, sessões distribuídas e governança de acessos do Disk Interno
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenNewUser && (
            <Button
              size="sm"
              variant="primary"
              onClick={onOpenNewUser}
              icon={<Users className="h-3.5 w-3.5" />}
            >
              Novo Colaborador
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="USUÁRIOS CADASTRADOS"
          value={users.length.toString()}
          subtitle={`${activeUsers} contas ativas no momento`}
          icon={<Users className="h-4 w-4 text-orange-400" />}
          badge="Identidade"
          badgeVariant="orange"
        />

        <StatCard
          title="COBERTURA 2FA (TOTP)"
          value={`${Math.round((twoFactorUsers / users.length) * 100)}%`}
          subtitle={`${twoFactorUsers} usuários com segundo fator ativo`}
          icon={<KeyRound className="h-4 w-4 text-emerald-400" />}
          badge="Segurança Forte"
          badgeVariant="emerald"
        />

        <StatCard
          title="PRODUTORES SEGREGADOS"
          value={producerUsers.toString()}
          subtitle="Escopos restritos a CNPJ específico"
          icon={<Building2 className="h-4 w-4 text-cyan-400" />}
          badge="Multi-Tenant"
          badgeVariant="cyan"
        />

        <StatCard
          title="EVENTOS DE AUDITORIA"
          value={auditLogs.length.toString()}
          subtitle="Trilha imutável registrada pelo Core"
          icon={<Activity className="h-4 w-4 text-purple-400" />}
          badge="Conformidade"
          badgeVariant="purple"
        />
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateSubItem && onNavigateSubItem('admin-users')}
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors">
              Usuários & Contas
            </span>
            <Users className="h-4 w-4 text-orange-400" />
          </div>
          <p className="text-xs text-slate-400">
            Tabela operacional de colaboradores com assistente em 7 passos, edição de matriz granular e bloqueio de credenciais.
          </p>
        </div>

        <div
          onClick={() => onNavigateSubItem && onNavigateSubItem('admin-roles')}
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
              Perfis Oficiais (12 Papéis)
            </span>
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-xs text-slate-400">
            Catálogo completo de papéis padrão do Disk Interno com mapeamento automático de responsabilidades.
          </p>
        </div>

        <div
          onClick={() => onNavigateSubItem && onNavigateSubItem('admin-sessions')}
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
              Sessões Ativas & Conexões
            </span>
            <Laptop className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xs text-slate-400">
            Monitoramento de tokens JWT emitidos, dispositivos conectados e revogação imediata de sessões em tempo real.
          </p>
        </div>
      </div>

      {/* Recent Core Security & Audit Logs */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-white">Últimas Ações Administrativas & de Governança</h3>
            <span className="text-xs text-slate-400">Registros sincronizados diretamente com o serviço de auditoria</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigateSubItem && onNavigateSubItem('admin-audit')}
          >
            Ver Auditoria Completa
          </Button>
        </div>

        <div className="space-y-2">
          {auditLogs.slice(0, 5).map(log => (
            <div key={log.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-orange-400" />
                <div>
                  <span className="font-semibold text-white mr-2">{log.userName}</span>
                  <span className="text-slate-400">{log.details}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
