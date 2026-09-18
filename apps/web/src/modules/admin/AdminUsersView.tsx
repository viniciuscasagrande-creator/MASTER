import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Search,
  Plus,
  Lock,
  KeyRound,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Eye,
  Sliders,
  UserCheck,
  RotateCcw,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { UserAccount, PermissionString, ScopeType } from '@shared/types/index';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { useCoreData } from '../../core/context/CoreDataContext';
import { NewUserWizardModal } from './NewUserWizardModal';
import { UserDetailsModal } from './UserDetailsModal';

export const AdminUsersView: React.FC = () => {
  const { users, currentUser, switchUser, updateUserPermissions } = useAuth();
  const { producers, events } = useCoreData();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserAccount | null>(null);
  const [isNewUserWizardOpen, setIsNewUserWizardOpen] = useState(false);
  const [activeActionMenuUserId, setActiveActionMenuUserId] = useState<string | null>(null);

  // Filtered users list
  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.roleSlug !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.roleName.toLowerCase().includes(q);
    }
    return true;
  });

  const handleToggleStatus = (u: UserAccount) => {
    const nextStatus = u.status === 'active' ? 'blocked' : 'active';
    updateUserPermissions(u.id, u.permissions, u.scope, nextStatus);
    setActiveActionMenuUserId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              CENTRAL DE USUÁRIOS, PERFIS & PERMISSÕES
            </h1>
            <Badge variant="orange" size="sm">
              Fase 1.1.5.2 RBAC Core
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Controle de identidade, matriz granular de permissões por ação e restrição de escopo por produtor/evento
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsNewUserWizardOpen(true)}
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          Novo Usuário
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="USUÁRIOS ATIVOS"
          value={users.filter(u => u.status === 'active').length.toString()}
          subtitle={`${users.length} cadastrados no Core`}
          icon={<Users className="h-4 w-4 text-orange-400" />}
          badge="Identidade"
          badgeVariant="orange"
        />

        <StatCard
          title="USUÁRIOS COM 2FA ATIVO"
          value={users.filter(u => u.twoFactorEnforced).length.toString()}
          trend={{ value: '100% dos Administradores protegidos', isPositive: true }}
          icon={<KeyRound className="h-4 w-4 text-emerald-400" />}
          badge="Segurança Forte"
          badgeVariant="emerald"
        />

        <StatCard
          title="PRODUTORES SEGREGADOS"
          value={users.filter(u => u.scope.type === 'PRODUCER').length.toString()}
          subtitle="Escopo isolado por CNPJ/Organização"
          icon={<Building2 className="h-4 w-4 text-cyan-400" />}
          badge="Multi-Tenant"
          badgeVariant="cyan"
        />

        <StatCard
          title="PERMISSÕES MAPEADAS"
          value="45 ações"
          subtitle="Controle granular por endpoint e botão"
          icon={<ShieldCheck className="h-4 w-4 text-purple-400" />}
          badge="Matriz Ativa"
          badgeVariant="purple"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou perfil..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none"
          >
            <option value="all">Todos os Perfis</option>
            <option value="admin_geral">Administrador Geral</option>
            <option value="financeiro">Financeiro</option>
            <option value="produtor">Produtor</option>
            <option value="sac">SAC</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativo</option>
            <option value="blocked">Bloqueado</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3">Usuário & Organização</th>
                <th className="pb-3">Perfil de Acesso</th>
                <th className="pb-3">Escopo de Dados</th>
                <th className="pb-3">2FA</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((u) => {
                const isCurrent = currentUser.id === u.id;
                const isActionMenuOpen = activeActionMenuUserId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-orange-400 border border-slate-700">
                          {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            {u.name}
                            {isCurrent && (
                              <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                                Você
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          <div className="text-[10px] text-slate-500">{u.organization}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <Badge variant={u.roleSlug === 'admin_geral' ? 'orange' : 'slate'} size="sm">
                        {u.roleName}
                      </Badge>
                    </td>

                    <td className="py-3.5 font-mono text-[11px]">
                      {u.scope.type === 'GLOBAL' ? (
                        <span className="text-emerald-400 font-semibold">Toda DiskIngressos (Global)</span>
                      ) : u.scope.type === 'PRODUCER' ? (
                        <span className="text-cyan-400 font-semibold">Produtor {u.scope.producerIds.join(', ')}</span>
                      ) : (
                        <span className="text-purple-400 font-semibold">Evento {u.scope.eventIds.join(', ')}</span>
                      )}
                    </td>

                    <td className="py-3.5">
                      {u.twoFactorEnforced ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Opcional</span>
                      )}
                    </td>

                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        u.status === 'active' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {u.status === 'active' ? 'Ativo' : 'Bloqueado'}
                      </span>
                    </td>

                    <td className="py-3.5 text-right relative">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedUserForDetails(u)}
                          icon={<Sliders className="h-3.5 w-3.5" />}
                        >
                          Detalhes
                        </Button>

                        {!isCurrent && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => switchUser(u.id)}
                            icon={<UserCheck className="h-3.5 w-3.5" />}
                          >
                            Simular
                          </Button>
                        )}

                        <div className="relative">
                          <button
                            onClick={() => setActiveActionMenuUserId(isActionMenuOpen ? null : u.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>

                          {isActionMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl z-40 text-left text-xs animate-in fade-in duration-100">
                              <button
                                onClick={() => {
                                  setSelectedUserForDetails(u);
                                  setActiveActionMenuUserId(null);
                                }}
                                className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
                              >
                                Ver Detalhes & Permissões
                              </button>
                              <button
                                onClick={() => handleToggleStatus(u)}
                                className={`flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg ${
                                  u.status === 'active' ? 'text-rose-400 hover:bg-rose-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'
                                }`}
                              >
                                {u.status === 'active' ? 'Bloquear Acesso' : 'Desbloquear Acesso'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New User Wizard Modal (7 Steps) */}
      <NewUserWizardModal
        isOpen={isNewUserWizardOpen}
        onClose={() => setIsNewUserWizardOpen(false)}
      />

      {/* User Details Modal (6 Tabs) */}
      <UserDetailsModal
        user={selectedUserForDetails}
        isOpen={!!selectedUserForDetails}
        onClose={() => setSelectedUserForDetails(null)}
      />
    </div>
  );
};
