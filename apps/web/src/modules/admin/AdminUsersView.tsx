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
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { UserAccount, PermissionString, ScopeType } from '@shared/types/index';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { useCoreData } from '../../core/context/CoreDataContext';

export const AdminUsersView: React.FC = () => {
  const { users, currentUser, switchUser, updateUserPermissions } = useAuth();
  const { producers, events } = useCoreData();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

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

  const handleTogglePermission = (permission: PermissionString) => {
    if (!selectedUser) return;
    const hasPerm = selectedUser.permissions.includes(permission);
    const newPerms = hasPerm
      ? selectedUser.permissions.filter(p => p !== permission)
      : [...selectedUser.permissions, permission];

    updateUserPermissions(selectedUser.id, newPerms, selectedUser.scope, selectedUser.status);
    setSelectedUser({
      ...selectedUser,
      permissions: newPerms
    });
  };

  const handleScopeTypeChange = (type: ScopeType) => {
    if (!selectedUser) return;
    const newScope = {
      ...selectedUser.scope,
      type
    };
    updateUserPermissions(selectedUser.id, selectedUser.permissions, newScope, selectedUser.status);
    setSelectedUser({
      ...selectedUser,
      scope: newScope
    });
  };

  const handleToggleProducerScope = (producerId: string) => {
    if (!selectedUser) return;
    const exists = selectedUser.scope.producerIds.includes(producerId);
    const newProducerIds = exists
      ? selectedUser.scope.producerIds.filter(id => id !== producerId)
      : [...selectedUser.scope.producerIds, producerId];

    const newScope = {
      ...selectedUser.scope,
      producerIds: newProducerIds
    };
    updateUserPermissions(selectedUser.id, selectedUser.permissions, newScope, selectedUser.status);
    setSelectedUser({
      ...selectedUser,
      scope: newScope
    });
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
              Fase 1.1.5 RBAC Core
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Controle de identidade, matriz granular de permissões por ação e restrição de escopo por produtor/evento
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => alert('Modal de criação de novo colaborador com perfil e escopo')}
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
            <option value="suspended">Suspenso</option>
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

                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedUser(u)}
                          icon={<Sliders className="h-3.5 w-3.5" />}
                        >
                          Permissões
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail & Permissions Editor Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl h-full border-l border-slate-800 bg-slate-950 p-6 shadow-2xl flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-sm font-bold text-orange-400 border border-slate-700">
                  {selectedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">
                    {selectedUser.name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{selectedUser.email}</span>
                    <span>•</span>
                    <span className="text-orange-400 font-semibold">{selectedUser.roleName}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {/* Scope Selection */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Escopo de Dados Autorizado
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'GLOBAL' as ScopeType, label: 'Toda DiskIngressos', desc: 'Acesso a todos os produtores' },
                    { type: 'PRODUCER' as ScopeType, label: 'Produtor Específico', desc: 'Isolado ao CNPJ/produtor' },
                    { type: 'EVENT' as ScopeType, label: 'Eventos Específicos', desc: 'Restrito a eventos selecionados' },
                  ].map((s) => (
                    <button
                      key={s.type}
                      onClick={() => handleScopeTypeChange(s.type)}
                      className={`rounded-xl border p-2.5 text-left transition-all ${
                        selectedUser.scope.type === s.type
                          ? 'border-orange-500/60 bg-orange-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-semibold text-xs">{s.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>

                {/* If Producer scope, checkboxes for producers */}
                {selectedUser.scope.type === 'PRODUCER' && (
                  <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400">Selecione os Produtores Permitidos:</div>
                    <div className="space-y-1">
                      {producers.map(p => {
                        const isChecked = selectedUser.scope.producerIds.includes(p.id);
                        return (
                          <label key={p.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleProducerScope(p.id)}
                              className="accent-orange-500 rounded"
                            />
                            <span>{p.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({p.cnpj})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Granular Permission Matrix */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Matriz de Permissões Granulares (Ação por Ação)
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {selectedUser.permissions.length} concedidas
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Financeiro */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                    <div className="font-bold text-orange-400 text-xs">Módulo Financeiro</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { slug: 'financeiro.saldo.visualizar', label: 'Visualizar Saldos & Vendas' },
                        { slug: 'financeiro.transferencia.criar', label: 'Criar Transferência entre Eventos' },
                        { slug: 'financeiro.transferencia.aprovar', label: 'Aprovar Transferência de Saldo' },
                        { slug: 'financeiro.repasses.visualizar', label: 'Visualizar Lista de Repasses' },
                        { slug: 'financeiro.repasses.aprovar', label: 'Aprovar Liquidação de Repasses' },
                        { slug: 'financeiro.conciliacao.executar', label: 'Executar Auto-Conciliação' },
                      ].map(perm => {
                        const hasIt = selectedUser.permissions.includes(perm.slug as PermissionString);
                        return (
                          <label key={perm.slug} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 hover:text-white">
                            <input
                              type="checkbox"
                              checked={hasIt}
                              onChange={() => handleTogglePermission(perm.slug as PermissionString)}
                              className="accent-orange-500 rounded"
                            />
                            <span>{perm.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* SAC & Estornos */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                    <div className="font-bold text-cyan-400 text-xs">Atendimento SAC & Estornos</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { slug: 'sac.consulta.acessar', label: 'Acessar Central de Consulta 360°' },
                        { slug: 'sac.pedido.visualizar', label: 'Visualizar Detalhes do Pedido' },
                        { slug: 'sac.voucher.reenviar', label: 'Reenviar Voucher / QR Code' },
                        { slug: 'estorno.solicitacao.criar', label: 'Solicitar Cancelamento / Estorno' },
                        { slug: 'estorno.solicitacao.aprovar', label: 'Aprovar Estorno (Cascata Reversa)' },
                        { slug: 'estorno.chargeback.gerenciar', label: 'Gerenciar Disputas de Chargeback' },
                      ].map(perm => {
                        const hasIt = selectedUser.permissions.includes(perm.slug as PermissionString);
                        return (
                          <label key={perm.slug} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 hover:text-white">
                            <input
                              type="checkbox"
                              checked={hasIt}
                              onChange={() => handleTogglePermission(perm.slug as PermissionString)}
                              className="accent-orange-500 rounded"
                            />
                            <span>{perm.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Eventos & Suporte */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                    <div className="font-bold text-emerald-400 text-xs">Eventos & Suporte de Campo</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { slug: 'eventos.evento.visualizar', label: 'Consultar Eventos' },
                        { slug: 'eventos.evento.criar', label: 'Criar Novos Eventos' },
                        { slug: 'eventos.checkin.operar', label: 'Operar Catracas / Portaria' },
                        { slug: 'suporte.war_room.acessar', label: 'Acessar War Room' },
                        { slug: 'suporte.incidentes.resolver', label: 'Resolver Incidentes de Campo' },
                      ].map(perm => {
                        const hasIt = selectedUser.permissions.includes(perm.slug as PermissionString);
                        return (
                          <label key={perm.slug} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 hover:text-white">
                            <input
                              type="checkbox"
                              checked={hasIt}
                              onChange={() => handleTogglePermission(perm.slug as PermissionString)}
                              className="accent-orange-500 rounded"
                            />
                            <span>{perm.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => switchUser(selectedUser.id)}
                icon={<UserCheck className="h-3.5 w-3.5" />}
              >
                Simular Sessão deste Usuário
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedUser(null)}
              >
                Salvar e Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
