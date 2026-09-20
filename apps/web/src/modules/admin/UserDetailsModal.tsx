import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Building2,
  Lock,
  KeyRound,
  History,
  Laptop,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sliders,
  UserCheck
} from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { UserAccount, PermissionString, ScopeType } from '@shared/types/index';
import { useAuth } from '../../core/auth/AuthContext';
import { useCoreData } from '../../core/context/CoreDataContext';

interface UserDetailsModalProps {
  user: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedUser: UserAccount) => void;
}

type TabType = 'overview' | 'permissions' | 'scope' | 'sessions' | 'security' | 'audit';

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave
}) => {
  const { currentUser, switchUser, updateUserPermissions } = useAuth();
  const { producers, auditLogs } = useCoreData();

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Local editable state
  const [currentUserData, setCurrentUserData] = useState<UserAccount | null>(user);

  // Mock active sessions for this user
  const [sessions, setSessions] = useState([
    {
      id: `sess_1_${user?.id}`,
      ipAddress: user?.lastIpAddress || '189.44.120.19',
      userAgent: 'Chrome 128.0 (Windows 11)',
      startedAt: '2026-09-18T10:15:00Z',
      isCurrent: true
    },
    {
      id: `sess_2_${user?.id}`,
      ipAddress: '177.102.18.4',
      userAgent: 'Safari 18.0 (iPhone iOS 18)',
      startedAt: '2026-09-17T20:30:00Z',
      isCurrent: false
    }
  ]);

  React.useEffect(() => {
    setCurrentUserData(user);
  }, [user]);

  if (!isOpen || !currentUserData) return null;

  const handleRevokeSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleRevokeAllSessions = () => {
    setSessions([]);
  };

  const handleToggleStatus = () => {
    const nextStatus: 'active' | 'blocked' = currentUserData.status === 'active' ? 'blocked' : 'active';
    const updated: UserAccount = { ...currentUserData, status: nextStatus };
    setCurrentUserData(updated);
    updateUserPermissions(updated.id, updated.permissions, updated.scope, updated.status);
    if (onSave) onSave(updated);
  };

  const handleTogglePermission = (perm: PermissionString) => {
    const exists = currentUserData.permissions.includes(perm);
    const newPerms = exists
      ? currentUserData.permissions.filter(p => p !== perm)
      : [...currentUserData.permissions, perm];

    const updated = { ...currentUserData, permissions: newPerms };
    setCurrentUserData(updated);
    updateUserPermissions(updated.id, newPerms, updated.scope, updated.status);
    if (onSave) onSave(updated);
  };

  const handleScopeTypeChange = (type: ScopeType) => {
    const newScope = { ...currentUserData.scope, type };
    const updated = { ...currentUserData, scope: newScope };
    setCurrentUserData(updated);
    updateUserPermissions(updated.id, updated.permissions, newScope, updated.status);
    if (onSave) onSave(updated);
  };

  const handleToggleProducerScope = (producerId: string) => {
    const exists = currentUserData.scope.producerIds.includes(producerId);
    const newProds = exists
      ? currentUserData.scope.producerIds.filter(id => id !== producerId)
      : [...currentUserData.scope.producerIds, producerId];

    const newScope = { ...currentUserData.scope, producerIds: newProds };
    const updated = { ...currentUserData, scope: newScope };
    setCurrentUserData(updated);
    updateUserPermissions(updated.id, updated.permissions, newScope, updated.status);
    if (onSave) onSave(updated);
  };

  // User-specific audit history
  const userAudits = auditLogs.filter(a => a.userId === currentUserData.id || a.userName.includes(currentUserData.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-sm font-bold text-orange-400 border border-slate-700">
              {currentUserData.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">{currentUserData.name}</h2>
                <Badge variant={currentUserData.status === 'active' ? 'emerald' : 'rose'} size="sm">
                  {currentUserData.status === 'active' ? 'Ativo' : 'Bloqueado'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="font-mono">{currentUserData.email}</span>
                <span>•</span>
                <span className="text-orange-400 font-semibold">{currentUserData.roleName}</span>
                <span>•</span>
                <span>{currentUserData.organization}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                switchUser(currentUserData.id);
                onClose();
              }}
              icon={<UserCheck className="h-3.5 w-3.5" />}
            >
              Simular Sessão
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-900/30 overflow-x-auto">
          {[
            { id: 'overview' as TabType, label: 'Visão Geral', icon: <User className="h-3.5 w-3.5" /> },
            { id: 'permissions' as TabType, label: 'Permissões Efetivas', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
            { id: 'scope' as TabType, label: 'Escopo de Dados', icon: <Building2 className="h-3.5 w-3.5" /> },
            { id: 'sessions' as TabType, label: 'Sessões Ativas', icon: <Laptop className="h-3.5 w-3.5" />, badge: sessions.length },
            { id: 'security' as TabType, label: 'Segurança & 2FA', icon: <KeyRound className="h-3.5 w-3.5" /> },
            { id: 'audit' as TabType, label: 'Auditoria', icon: <History className="h-3.5 w-3.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-800 px-1 text-[10px] font-bold text-slate-300">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Identidade</span>
                  <div className="font-semibold text-white text-sm">{currentUserData.name}</div>
                  <div className="text-slate-400 font-mono text-[11px]">{currentUserData.email}</div>
                  <div className="text-slate-500">{currentUserData.organization}</div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Perfil & Papel</span>
                  <div className="font-semibold text-orange-400 text-sm">{currentUserData.roleName}</div>
                  <div className="text-slate-400">Tipo: {currentUserData.isInternalStaff ? 'Colaborador Interno' : 'Parceiro Externo'}</div>
                  <div className="text-emerald-400 font-mono text-[11px]">Permissões: {currentUserData.permissions.length} concedidas</div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Atividade Recente</span>
                  <div className="text-slate-300">Último Login: {currentUserData.lastLoginAt ? new Date(currentUserData.lastLoginAt).toLocaleString('pt-BR') : 'Nunca acessou'}</div>
                  <div className="text-slate-400 font-mono text-[11px]">Último IP: {currentUserData.lastIpAddress || '127.0.0.1'}</div>
                  <div className="text-slate-500">Cadastrado em: {new Date(currentUserData.createdAt).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>

              {/* Status Control */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">Controle de Status da Conta</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Bloquear o usuário suspende imediatamente todas as sessões e tokens ativos.
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={currentUserData.status === 'active' ? 'outline' : 'primary'}
                  onClick={handleToggleStatus}
                >
                  {currentUserData.status === 'active' ? 'Bloquear Conta' : 'Reativar Conta'}
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: PERMISSÕES */}
          {activeTab === 'permissions' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-white">Permissões Efetivas do Colaborador</span>
                <span className="text-cyan-400 font-mono text-[11px]">{currentUserData.permissions.length} ações autorizadas</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { slug: 'financeiro.saldo.visualizar', label: 'Financeiro: Visualizar Saldos' },
                  { slug: 'financeiro.transferencia.criar', label: 'Financeiro: Criar Transferências' },
                  { slug: 'financeiro.transferencia.aprovar', label: 'Financeiro: Aprovar Transferências' },
                  { slug: 'financeiro.repasses.visualizar', label: 'Financeiro: Visualizar Repasses' },
                  { slug: 'financeiro.repasses.aprovar', label: 'Financeiro: Aprovar Liquidação' },
                  { slug: 'eventos.evento.visualizar', label: 'Eventos: Visualizar Eventos' },
                  { slug: 'eventos.evento.criar', label: 'Eventos: Criar Eventos' },
                  { slug: 'eventos.checkin.operar', label: 'Eventos: Operar Portaria' },
                  { slug: 'sac.consulta.acessar', label: 'SAC: Central de Consulta' },
                  { slug: 'sac.voucher.reenviar', label: 'SAC: Reenviar Vouchers' },
                  { slug: 'estorno.solicitacao.criar', label: 'Estorno: Criar Solicitação' },
                  { slug: 'estorno.solicitacao.aprovar', label: 'Estorno: Aprovar Estorno' },
                  { slug: 'admin.usuarios.visualizar', label: 'Admin: Visualizar Usuários' },
                  { slug: 'admin.usuarios.gerenciar', label: 'Admin: Gerenciar Permissões' }
                ].map(perm => {
                  const isChecked = currentUserData.permissions.includes(perm.slug as PermissionString);
                  return (
                    <label key={perm.slug} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-800 bg-slate-900/40 cursor-pointer hover:bg-slate-900">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePermission(perm.slug as PermissionString)}
                        className="accent-orange-500 rounded"
                      />
                      <span className="text-slate-200">{perm.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ESCOPO DE DADOS */}
          {activeTab === 'scope' && (
            <div className="space-y-4 text-xs">
              <div className="text-slate-300 font-semibold">Tipo de Escopo Operacional</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: 'GLOBAL' as ScopeType, title: 'Global', desc: 'Acesso completo a todos os produtores e eventos' },
                  { type: 'PRODUCER' as ScopeType, title: 'Produtor', desc: 'Restrito aos CNPJs autorizados' },
                  { type: 'EVENT' as ScopeType, title: 'Evento', desc: 'Restrito a eventos específicos' }
                ].map(s => (
                  <button
                    key={s.type}
                    onClick={() => handleScopeTypeChange(s.type)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      currentUserData.scope.type === s.type
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs">{s.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>

              {currentUserData.scope.type === 'PRODUCER' && (
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="font-semibold text-slate-300">Produtoras Vinculadas</div>
                  <div className="space-y-1.5">
                    {producers.map(p => {
                      const isChecked = currentUserData.scope.producerIds.includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/40 border border-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleProducerScope(p.id)}
                            className="accent-cyan-500 rounded"
                          />
                          <span className="text-white font-medium">{p.name}</span>
                          <span className="text-slate-500 font-mono text-[10px] ml-auto">{p.cnpj}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SESSÕES ATIVAS */}
          {activeTab === 'sessions' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <span className="font-semibold text-white">Dispositivos & Sessões Conectadas</span>
                  <span className="text-slate-400 text-[11px] block mt-0.5">
                    Sessões ativas no banco de dados com chave JWT associada.
                  </span>
                </div>
                {sessions.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRevokeAllSessions}
                  >
                    Derrubar Todas as Sessões
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">Nenhuma sessão ativa no momento.</div>
                ) : (
                  sessions.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-900/50">
                      <div className="flex items-center gap-3">
                        <Laptop className="h-5 w-5 text-orange-400" />
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            {s.userAgent}
                            {s.isCurrent && (
                              <Badge variant="emerald" size="sm">Esta sessão</Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            IP: {s.ipAddress} • Iniciada em: {new Date(s.startedAt).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevokeSession(s.id)}
                      >
                        Revogar
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SEGURANÇA & 2FA */}
          {activeTab === 'security' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <KeyRound className="h-4 w-4 text-emerald-400" />
                    <span>Autenticação em Duas Etapas (2FA TOTP)</span>
                  </div>
                  <Badge variant={currentUserData.twoFactorEnforced ? 'emerald' : 'slate'}>
                    {currentUserData.twoFactorEnforced ? 'Obrigatório' : 'Desativado'}
                  </Badge>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Exige validação com aplicativo como Google Authenticator ou 1Password a cada novo login.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="font-bold text-white">Redefinição de Credenciais</div>
                <p className="text-slate-400 text-[11px]">
                  Enviar link seguro de redefinição de senha para <strong className="text-white">{currentUserData.email}</strong>.
                </p>
                <Button size="sm" variant="outline" onClick={() => alert('Link de redefinição de senha enviado com sucesso.')}>
                  Enviar Link de Reset de Senha
                </Button>
              </div>
            </div>
          )}

          {/* TAB 6: TRILHA DE AUDITORIA */}
          {activeTab === 'audit' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-white">Histórico Recente de Ações deste Usuário</span>
                <span className="text-slate-400 font-mono text-[11px]">{userAudits.length} registros</span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {userAudits.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">Nenhum registro de auditoria encontrado.</div>
                ) : (
                  userAudits.map(a => (
                    <div key={a.id} className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{a.action}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{new Date(a.timestamp).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{a.details}</p>
                      <div className="text-[10px] font-mono text-cyan-400">IP: {a.ipAddress} • Módulo: {a.module}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (onSave && currentUserData) onSave(currentUserData);
              onClose();
            }}
          >
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
};
