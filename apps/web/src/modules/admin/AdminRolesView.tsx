import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Search,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { useAuth } from '../../core/auth/AuthContext';

interface RoleDetail {
  code: string;
  name: string;
  category: 'Administração' | 'Financeiro & Fiscal' | 'Atendimento' | 'Comercial' | 'Operação & Campo' | 'Growth' | 'Parceiro';
  description: string;
  defaultScope: 'GLOBAL' | 'PRODUCER' | 'EVENT';
  isProtected: boolean;
  permissions: string[];
}

const OFFICIAL_ROLES: RoleDetail[] = [
  {
    code: 'ADMINISTRADOR_GERAL',
    name: 'Administrador Geral',
    category: 'Administração',
    description: 'Acesso soberano irrestrito a todos os módulos, configurações globais e usuários da plataforma.',
    defaultScope: 'GLOBAL',
    isProtected: true,
    permissions: ['* (Universal Bypass)']
  },
  {
    code: 'ADMINISTRADOR_OPERACIONAL',
    name: 'Administrador Operacional',
    category: 'Administração',
    description: 'Gestão de eventos, bilheteria física, pontos de venda e suporte operacional a portas.',
    defaultScope: 'GLOBAL',
    isProtected: false,
    permissions: ['eventos.evento.*', 'eventos.checkin.*', 'suporte.*']
  },
  {
    code: 'FINANCEIRO',
    name: 'Financeiro',
    category: 'Financeiro & Fiscal',
    description: 'Saldos, conciliação bancária, aprovação de repasses e fluxo financeiro inter-eventos.',
    defaultScope: 'GLOBAL',
    isProtected: false,
    permissions: ['financeiro.saldo.visualizar', 'financeiro.transferencia.*', 'financeiro.repasses.*', 'financeiro.conciliacao.*']
  },
  {
    code: 'CONTABILIDADE',
    name: 'Contabilidade',
    category: 'Financeiro & Fiscal',
    description: 'Livro diário, balancetes patrimoniais, plano de contas e DRE gerencial em tempo real.',
    defaultScope: 'GLOBAL',
    isProtected: false,
    permissions: ['contabilidade.diario.*', 'contabilidade.dre.*', 'contabilidade.balancete.*']
  },
  {
    code: 'ATENDIMENTO_SAC',
    name: 'Atendimento SAC',
    category: 'Atendimento',
    description: 'Central de Consulta, pedidos, histórico de compras de clientes e reenvio de vouchers.',
    defaultScope: 'GLOBAL',
    isProtected: false,
    permissions: ['sac.consulta.acessar', 'sac.pedido.*', 'sac.voucher.reenviar', 'sac.ticket.*']
  },
  {
    code: 'ESTORNO',
    name: 'Estorno & Chargeback',
    category: 'Atendimento',
    description: 'Análise criteriosa e aprovação de cancelamentos de compras e disputas de cartões.',
    defaultScope: 'GLOBAL',
    isProtected: false,
    permissions: ['estorno.solicitacao.*', 'estorno.chargeback.*']
  },
  {
    code: 'COMERCIAL',
    name: 'Comercial',
    category: 'Comercial',
    description: 'Prospecção e cadastro de novas produtoras, pipeline de fechamentos e metas de vendas.',
    defaultScope: 'GLOBAL',
    isProtected: false,
    permissions: ['comercial.produtores.*', 'comercial.propostas.*', 'comercial.metas.*']
  },
  {
    code: 'SUPORTE_EVENTOS',
    name: 'Suporte Eventos',
    category: 'Operação & Campo',
    description: 'War room presencial nos dias de espetáculo, monitoramento de catracas e contingência.',
    defaultScope: 'GLOBAL',
    isProtected: false,
    permissions: ['suporte.war_room.*', 'suporte.incidentes.*']
  },
  {
    code: 'MARKETING',
    name: 'Marketing',
    category: 'Growth',
    description: 'Criação e monitoramento de campanhas de tráfego, ROAS, UTMs e pixels de conversão.',
    defaultScope: 'GLOBAL',
    isProtected: false,
    permissions: ['marketing.campanha.*', 'marketing.pixel.*']
  },
  {
    code: 'REMARKETING',
    name: 'Remarketing',
    category: 'Growth',
    description: 'Recuperação ativa de carrinhos abandonados, réguas de automação e canais WhatsApp.',
    defaultScope: 'GLOBAL',
    isProtected: false,
    permissions: ['remarketing.carrinhos.*', 'remarketing.regua.*', 'remarketing.mensagem.*']
  },
  {
    code: 'PRODUTOR',
    name: 'Produtor',
    category: 'Parceiro',
    description: 'Visão estritamente restrita e segregada aos próprios eventos e relatórios cadastrados.',
    defaultScope: 'PRODUCER',
    isProtected: false,
    permissions: ['eventos.evento.visualizar', 'eventos.evento.criar', 'financeiro.saldo.visualizar', 'marketing.campanha.*']
  },
  {
    code: 'AUDITOR',
    name: 'Auditor',
    category: 'Administração',
    description: 'Perfil consultivo exclusivo para visualização de trilhas de auditoria e conformidade.',
    defaultScope: 'GLOBAL',
    isProtected: false,
    permissions: ['admin.auditoria.visualizar', 'relatorios.exportar']
  }
];

export const AdminRolesView: React.FC = () => {
  const { users } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleDetail>(OFFICIAL_ROLES[0]);

  const filteredRoles = OFFICIAL_ROLES.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleUserCount = (roleCode: string) => {
    return users.filter(u => u.roleSlug.toUpperCase() === roleCode || u.roleName.toUpperCase().includes(roleCode)).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              PERFIS DE ACESSO (12 PAPÉIS OFICIAIS)
            </h1>
            <Badge variant="orange" size="sm">RBAC Governança</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Definição dos 12 papéis padronizados do Disk Interno com permissões herdadas e escopos padrão
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar perfis ou categorias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredRoles.map((role) => {
              const userCount = getRoleUserCount(role.code);
              const isSelected = selectedRole.code === role.code;

              return (
                <div
                  key={role.code}
                  onClick={() => setSelectedRole(role)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{role.name}</span>
                    <Badge variant={isSelected ? 'orange' : 'slate'} size="sm">
                      {role.category}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {role.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Users className="h-3 w-3" />
                      {userCount} {userCount === 1 ? 'colaborador' : 'colaboradores'}
                    </span>
                    <span className="text-cyan-400 uppercase">{role.defaultScope}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Role Inspector Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white">{selectedRole.name}</h3>
              <span className="text-[11px] text-slate-400 font-mono">{selectedRole.code}</span>
            </div>
            <Badge variant="orange">{selectedRole.category}</Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Descrição Oficial</span>
              <p className="text-slate-200 mt-1 leading-relaxed">{selectedRole.description}</p>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Escopo de Dados Padrão</span>
              <span className="text-cyan-400 font-semibold font-mono text-[11px]">{selectedRole.defaultScope}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Permissões Mapeadas por Padrão</span>
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {selectedRole.permissions.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
