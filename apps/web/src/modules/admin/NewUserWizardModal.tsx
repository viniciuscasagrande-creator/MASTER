import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  LayoutGrid,
  CheckSquare,
  Building2,
  Lock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { useAuth } from '../../core/auth/AuthContext';
import { useCoreData } from '../../core/context/CoreDataContext';
import { PermissionString, ScopeType, UserAccount } from '@shared/types/index';

interface NewUserWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: (newUser: UserAccount) => void;
}

const OFFICIAL_ROLES = [
  { slug: 'admin_geral', name: 'Administrador Geral', desc: 'Acesso irrestrito a todos os 9 módulos e configurações centrais.', badge: 'Soberano', internalOnly: true },
  { slug: 'admin_operacional', name: 'Administrador Operacional', desc: 'Operação de campo, bilheteria física e suporte a portas.', badge: 'Operações', internalOnly: true },
  { slug: 'financeiro', name: 'Financeiro', desc: 'Gestão de fluxo de caixa, repasses, saldos e conciliação bancária.', badge: 'Finanças', internalOnly: true },
  { slug: 'contabilidade', name: 'Contabilidade', desc: 'Livro diário, balancetes e DRE gerencial em tempo real.', badge: 'Fiscal', internalOnly: true },
  { slug: 'sac', name: 'Atendimento SAC', desc: 'Central 360°, pedidos, reenviar vouchers e abertura de chamados.', badge: 'Atendimento', internalOnly: true },
  { slug: 'estorno', name: 'Estorno & Chargeback', desc: 'Análise e aprovação de devoluções e contestações de cartão.', badge: 'Disputas', internalOnly: true },
  { slug: 'comercial', name: 'Comercial', desc: 'Prospecção de produtores, pipeline de eventos e metas de faturamento.', badge: 'Vendas', internalOnly: true },
  { slug: 'suporte_eventos', name: 'Suporte Eventos', desc: 'War room presencial, catracas e contingência de rede.', badge: 'Campo', internalOnly: true },
  { slug: 'marketing', name: 'Marketing', desc: 'Gestão de tráfego, ROAS, campanhas e pixels de conversão.', badge: 'Growth', internalOnly: false },
  { slug: 'remarketing', name: 'Remarketing', desc: 'Recuperação de carrinhos abandonados e automação WhatsApp.', badge: 'Retenção', internalOnly: false },
  { slug: 'produtor', name: 'Produtor', desc: 'Acesso estritamente segregado aos próprios eventos cadastrados.', badge: 'Parceiro', internalOnly: false },
  { slug: 'auditor', name: 'Auditor', desc: 'Acesso consultivo exclusivo a trilhas de conformidade e auditoria.', badge: 'Compliance', internalOnly: true }
];

const MODULE_OPTIONS = [
  { id: 'overview', name: 'Visão Geral' },
  { id: 'events', name: 'Eventos' },
  { id: 'commercial', name: 'Comercial' },
  { id: 'event-support', name: 'Suporte Eventos' },
  { id: 'sac', name: 'Atendimento SAC' },
  { id: 'refunds', name: 'Estorno' },
  { id: 'finance', name: 'Financeiro' },
  { id: 'accounting', name: 'Contabilidade' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'remarketing', name: 'Remarketing' },
  { id: 'admin', name: 'Administração' }
];

const DEFAULT_PERMISSIONS_BY_MODULE: Record<string, { slug: PermissionString; label: string }[]> = {
  financeiro: [
    { slug: 'financeiro.saldo.visualizar', label: 'Visualizar Saldos' },
    { slug: 'financeiro.transferencia.criar', label: 'Criar Transferências' },
    { slug: 'financeiro.transferencia.aprovar', label: 'Aprovar Transferências' },
    { slug: 'financeiro.repasses.visualizar', label: 'Visualizar Repasses' },
    { slug: 'financeiro.repasses.aprovar', label: 'Aprovar Liquidação' },
    { slug: 'financeiro.conciliacao.executar', label: 'Auto-Conciliação' }
  ],
  eventos: [
    { slug: 'eventos.evento.visualizar', label: 'Visualizar Eventos' },
    { slug: 'eventos.evento.criar', label: 'Criar Eventos' },
    { slug: 'eventos.evento.editar', label: 'Editar Eventos' },
    { slug: 'eventos.checkin.operar', label: 'Operar Portaria' }
  ],
  sac: [
    { slug: 'sac.consulta.acessar', label: 'Central 360°' },
    { slug: 'sac.pedido.visualizar', label: 'Visualizar Pedidos' },
    { slug: 'sac.voucher.reenviar', label: 'Reenviar Vouchers' },
    { slug: 'estorno.solicitacao.criar', label: 'Solicitar Estorno' }
  ]
};

export const NewUserWizardModal: React.FC<NewUserWizardModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const { currentUser } = useAuth();
  const { producers } = useCoreData();

  const [step, setStep] = useState<number>(1);

  // Step 1: Dados Básicos
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [organization, setOrganization] = useState('DiskIngressos');
  const [position, setPosition] = useState('');

  // Step 2: Perfil
  const [selectedRoleSlug, setSelectedRoleSlug] = useState('financeiro');

  // Step 3: Módulos
  const [selectedModules, setSelectedModules] = useState<string[]>(['overview', 'finance']);

  // Step 4: Permissões Granulares
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionString[]>([
    'financeiro.saldo.visualizar',
    'financeiro.repasses.visualizar'
  ]);

  // Step 5: Escopo
  const [scopeType, setScopeType] = useState<ScopeType>('GLOBAL');
  const [selectedProducerIds, setSelectedProducerIds] = useState<string[]>([]);

  // Step 6: Segurança
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [forcePasswordChange, setForcePasswordChange] = useState(true);

  if (!isOpen) return null;

  const totalSteps = 7;
  const isCreatorAdmin = currentUser.roleSlug === 'admin_geral';

  const handleToggleModule = (modId: string) => {
    setSelectedModules(prev =>
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    );
  };

  const handleTogglePermission = (perm: PermissionString) => {
    setSelectedPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleToggleProducer = (prodId: string) => {
    setSelectedProducerIds(prev =>
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  };

  const handleFinish = () => {
    const chosenRole = OFFICIAL_ROLES.find(r => r.slug === selectedRoleSlug);

    const newUser: UserAccount = {
      id: `usr_${Date.now()}`,
      name: name.trim() || 'Novo Colaborador',
      email: email.trim().toLowerCase(),
      status: 'active',
      roleSlug: selectedRoleSlug as any,
      roleName: chosenRole?.name || 'Colaborador',
      organization: organization.trim() || 'DiskIngressos',
      isInternalStaff: chosenRole?.internalOnly ?? true,
      scope: {
        type: scopeType,
        producerIds: scopeType === 'PRODUCER' ? selectedProducerIds : [],
        eventIds: []
      },
      twoFactorEnabled: enforce2FA,
      twoFactorEnforced: enforce2FA,
      permissions: selectedPermissions,
      lastLoginAt: undefined,
      lastIpAddress: undefined,
      createdAt: new Date().toISOString()
    };

    if (onUserCreated) {
      onUserCreated(newUser);
    }
    onClose();
  };

  const selectedRole = OFFICIAL_ROLES.find(r => r.slug === selectedRoleSlug);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 font-black text-xs">
                {step}
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Assistente de Criação de Usuário & Acesso
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Passo {step} de {totalSteps} — Configuração de Identidade, RBAC e Escopo
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="h-1 w-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: Dados Básicos */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <User className="h-4 w-4 text-orange-400" />
                1. Informações Básicas do Colaborador
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Nome Completo *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Amanda Silva"
                    className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">E-mail Profissional *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amanda@diskingressos.com.br"
                    className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(41) 99999-0000"
                    className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">CPF / CNPJ</label>
                  <input
                    type="text"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Organização / Produtora</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="DiskIngressos Matriz ou Nome da Produtora"
                    className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Cargo / Função</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Ex: Analista de Conciliação"
                    className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Perfis de Acesso */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-orange-400" />
                2. Seleção de Perfil Oficial (RBAC)
              </div>
              <p className="text-xs text-slate-400">
                O perfil atribui automaticamente o conjunto base de permissões e define a experiência padrão do usuário.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {OFFICIAL_ROLES.map((r) => {
                  const isSelected = selectedRoleSlug === r.slug;
                  return (
                    <button
                      key={r.slug}
                      onClick={() => setSelectedRoleSlug(r.slug)}
                      className={`rounded-2xl border p-3.5 text-left transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500/10 text-white shadow-lg shadow-orange-500/10'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{r.name}</span>
                        <Badge variant={isSelected ? 'orange' : 'slate'} size="sm">
                          {r.badge}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {r.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Módulos & Menus */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-orange-400" />
                3. Módulos Operacionais Habilitados
              </div>
              <p className="text-xs text-slate-400">
                Selecione quais áreas do Disk Interno este usuário poderá visualizar na barra lateral.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {MODULE_OPTIONS.map((m) => {
                  const isChecked = selectedModules.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleToggleModule(m.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs text-left transition-all ${
                        isChecked
                          ? 'border-orange-500/60 bg-orange-500/10 text-white font-semibold'
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{m.name}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="accent-orange-500 rounded pointer-events-none"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Permissões Granulares */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-orange-400" />
                4. Permissões Granulares Específicas
              </div>
              <p className="text-xs text-slate-400">
                Ajuste os poderes específicos concedidos diretamente a este colaborador.
              </p>
              <div className="space-y-3">
                {Object.entries(DEFAULT_PERMISSIONS_BY_MODULE).map(([mod, perms]) => (
                  <div key={mod} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2">
                    <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                      Módulo {mod}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perms.map(p => {
                        const hasIt = selectedPermissions.includes(p.slug);
                        return (
                          <label key={p.slug} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                            <input
                              type="checkbox"
                              checked={hasIt}
                              onChange={() => handleTogglePermission(p.slug)}
                              className="accent-orange-500 rounded"
                            />
                            <span>{p.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Escopo de Dados */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-orange-400" />
                5. Escopo de Dados e Segregação Multi-Tenant
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setScopeType('GLOBAL')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    scopeType === 'GLOBAL'
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-xs text-emerald-400">Acesso Global</div>
                  <div className="text-[10px] text-slate-400 mt-1">Enxerga todas as produtoras e eventos da plataforma.</div>
                </button>
                <button
                  onClick={() => setScopeType('PRODUCER')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    scopeType === 'PRODUCER'
                      ? 'border-cyan-500/60 bg-cyan-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-xs text-cyan-400">Produtor Específico</div>
                  <div className="text-[10px] text-slate-400 mt-1">Isolado estritamente aos CNPJs selecionados.</div>
                </button>
              </div>

              {scopeType === 'PRODUCER' && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Selecione as Produtoras Autorizadas:</span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {producers.map(p => {
                      const isChecked = selectedProducerIds.includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/40 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleProducer(p.id)}
                            className="accent-cyan-500 rounded"
                          />
                          <div className="overflow-hidden">
                            <span className="font-medium text-white">{p.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono ml-2">({p.cnpj})</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Segurança & 2FA */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-orange-400" />
                6. Políticas de Segurança e 2FA
              </div>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 cursor-pointer hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={enforce2FA}
                    onChange={(e) => setEnforce2FA(e.target.checked)}
                    className="accent-orange-500 rounded mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-xs text-white">Exigir Segundo Fator de Autenticação (2FA)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Obriga o uso de aplicativo autenticador (TOTP) no primeiro login.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 cursor-pointer hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={forcePasswordChange}
                    onChange={(e) => setForcePasswordChange(e.target.checked)}
                    className="accent-orange-500 rounded mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-xs text-white">Forçar Troca de Senha Provisória</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Gera uma senha temporária segura e força a criação de nova senha no primeiro acesso.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 7: Revisão & Confirmação */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                7. Revisão Geral do Usuário
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-sm font-bold text-white">{name || 'Colaborador Sem Nome'}</span>
                    <span className="text-slate-400 font-mono block text-[11px]">{email || 'sem-email@dominio.com'}</span>
                  </div>
                  <Badge variant="orange">{selectedRole?.name}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-slate-500">Organização:</span> <span className="text-slate-300 font-semibold">{organization}</span></div>
                  <div><span className="text-slate-500">Escopo:</span> <span className="text-cyan-400 font-semibold">{scopeType}</span></div>
                  <div><span className="text-slate-500">Módulos Habilitados:</span> <span className="text-slate-300 font-semibold">{selectedModules.length}</span></div>
                  <div><span className="text-slate-500">Permissões Efetivas:</span> <span className="text-slate-300 font-semibold">{selectedPermissions.length} ações</span></div>
                  <div><span className="text-slate-500">Segundo Fator (2FA):</span> <span className="text-emerald-400 font-semibold">{enforce2FA ? 'Obrigatório' : 'Opcional'}</span></div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-orange-400 shrink-0" />
                  <span>
                    O novo usuário será cadastrado no banco relacional seguro do Core Node.js com Argon2id.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(prev => Math.max(prev - 1, 1))}
            disabled={step === 1}
            icon={<ChevronLeft className="h-3.5 w-3.5" />}
          >
            Voltar
          </Button>

          {step < totalSteps ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setStep(prev => Math.min(prev + 1, totalSteps))}
              icon={<ChevronRight className="h-3.5 w-3.5" />}
            >
              Avançar
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleFinish}
              icon={<Sparkles className="h-3.5 w-3.5" />}
            >
              Concluir e Criar Usuário
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
