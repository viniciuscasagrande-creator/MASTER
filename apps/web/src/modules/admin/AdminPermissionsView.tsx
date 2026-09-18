import React, { useState } from 'react';
import {
  CheckSquare,
  Search,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  ChevronDown,
  Filter
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';

interface PermissionEntry {
  code: string;
  module: string;
  action: string;
  description: string;
  defaultRoles: string[];
}

const ALL_PERMISSIONS: PermissionEntry[] = [
  // Eventos
  { code: 'eventos.evento.visualizar', module: 'Eventos', action: 'Visualizar', description: 'Consultar listagem e detalhes dos eventos', defaultRoles: ['ADMIN_GERAL', 'ADMIN_OPERACIONAL', 'PRODUTOR'] },
  { code: 'eventos.evento.criar', module: 'Eventos', action: 'Criar', description: 'Cadastrar novos espetáculos e shows', defaultRoles: ['ADMIN_GERAL', 'ADMIN_OPERACIONAL', 'PRODUTOR'] },
  { code: 'eventos.evento.editar', module: 'Eventos', action: 'Editar', description: 'Alterar configurações, datas e horários', defaultRoles: ['ADMIN_GERAL', 'ADMIN_OPERACIONAL'] },
  { code: 'eventos.checkin.operar', module: 'Eventos', action: 'Check-in', description: 'Operar portaria e catracas de validação', defaultRoles: ['ADMIN_GERAL', 'ADMIN_OPERACIONAL', 'SUPORTE_EVENTOS'] },
  { code: 'eventos.setores.configurar', module: 'Eventos', action: 'Setores', description: 'Configurar lotes, mapas e capacidade de assentos', defaultRoles: ['ADMIN_GERAL', 'PRODUTOR'] },

  // Financeiro
  { code: 'financeiro.saldo.visualizar', module: 'Financeiro', action: 'Saldo', description: 'Visualizar faturamento e saldos acumulados', defaultRoles: ['ADMIN_GERAL', 'FINANCEIRO', 'PRODUTOR'] },
  { code: 'financeiro.transferencia.criar', module: 'Financeiro', action: 'Transferência', description: 'Solicitar transferência entre eventos do produtor', defaultRoles: ['ADMIN_GERAL', 'FINANCEIRO'] },
  { code: 'financeiro.transferencia.aprovar', module: 'Financeiro', action: 'Aprovação Transferência', description: 'Aprovar transferência de fundos inter-eventos', defaultRoles: ['ADMIN_GERAL', 'FINANCEIRO'] },
  { code: 'financeiro.repasses.visualizar', module: 'Financeiro', action: 'Repasses', description: 'Consultar calendário e valores de repasse', defaultRoles: ['ADMIN_GERAL', 'FINANCEIRO', 'PRODUTOR'] },
  { code: 'financeiro.repasses.aprovar', module: 'Financeiro', action: 'Aprovação Repasses', description: 'Liquidar e autorizar pagamentos a produtores', defaultRoles: ['ADMIN_GERAL', 'FINANCEIRO'] },
  { code: 'financeiro.conciliacao.executar', module: 'Financeiro', action: 'Conciliação', description: 'Executar conciliação bancária automática', defaultRoles: ['ADMIN_GERAL', 'FINANCEIRO'] },

  // SAC & Estorno
  { code: 'sac.consulta.acessar', module: 'SAC', action: 'Consulta 360°', description: 'Acessar painel consolidado do cliente', defaultRoles: ['ADMIN_GERAL', 'ATENDIMENTO_SAC'] },
  { code: 'sac.pedido.visualizar', module: 'SAC', action: 'Ver Pedido', description: 'Inspecionar ingressos e cobranças do cliente', defaultRoles: ['ADMIN_GERAL', 'ATENDIMENTO_SAC'] },
  { code: 'sac.voucher.reenviar', module: 'SAC', action: 'Reenviar Voucher', description: 'Disparar QR Code por e-mail ou WhatsApp', defaultRoles: ['ADMIN_GERAL', 'ATENDIMENTO_SAC'] },
  { code: 'estorno.solicitacao.criar', module: 'Estorno', action: 'Solicitar', description: 'Abrir solicitação de estorno de ingresso', defaultRoles: ['ADMIN_GERAL', 'ATENDIMENTO_SAC', 'ESTORNO'] },
  { code: 'estorno.solicitacao.aprovar', module: 'Estorno', action: 'Aprovar Estorno', description: 'Executar cascata de cancelamento e devolução', defaultRoles: ['ADMIN_GERAL', 'ESTORNO'] },
  { code: 'estorno.chargeback.gerenciar', module: 'Estorno', action: 'Chargeback', description: 'Apresentar contestação de chargeback ao gateway', defaultRoles: ['ADMIN_GERAL', 'ESTORNO'] },

  // Marketing & Remarketing
  { code: 'marketing.campanha.visualizar', module: 'Marketing', action: 'Ver Campanhas', description: 'Analisar ROAS, cliques e investimento', defaultRoles: ['ADMIN_GERAL', 'MARKETING', 'PRODUTOR'] },
  { code: 'marketing.campanha.criar', module: 'Marketing', action: 'Criar Campanhas', description: 'Cadastrar nova veiculação de mídia paga', defaultRoles: ['ADMIN_GERAL', 'MARKETING'] },
  { code: 'marketing.pixel.configurar', module: 'Marketing', action: 'Pixel', description: 'Configurar Meta Pixel, TikTok e Google Tag', defaultRoles: ['ADMIN_GERAL', 'MARKETING', 'PRODUTOR'] },
  { code: 'remarketing.carrinhos.visualizar', module: 'Remarketing', action: 'Carrinhos', description: 'Acessar abandonos e valor retido', defaultRoles: ['ADMIN_GERAL', 'REMARKETING'] },

  // Contabilidade
  { code: 'contabilidade.diario.visualizar', module: 'Contabilidade', action: 'Livro Diário', description: 'Auditar lançamentos contábeis de partidas dobradas', defaultRoles: ['ADMIN_GERAL', 'CONTABILIDADE'] },
  { code: 'contabilidade.dre.visualizar', module: 'Contabilidade', action: 'DRE', description: 'Demonstrativo do Resultado do Exercício em tempo real', defaultRoles: ['ADMIN_GERAL', 'CONTABILIDADE'] },

  // Governança & Admin
  { code: 'admin.usuarios.visualizar', module: 'Administração', action: 'Ver Usuários', description: 'Visualizar lista e status de colaboradores', defaultRoles: ['ADMIN_GERAL'] },
  { code: 'admin.usuarios.gerenciar', module: 'Administração', action: 'Gerenciar Usuários', description: 'Criar, alterar perfis e bloquear credenciais', defaultRoles: ['ADMIN_GERAL'] },
  { code: 'admin.auditoria.visualizar', module: 'Administração', action: 'Ver Auditoria', description: 'Inspecionar trilha imutável de eventos', defaultRoles: ['ADMIN_GERAL', 'AUDITOR'] }
];

export const AdminPermissionsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  const modules = Array.from(new Set(ALL_PERMISSIONS.map(p => p.module)));

  const filtered = ALL_PERMISSIONS.filter(p => {
    if (selectedModule !== 'all' && p.module !== selectedModule) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.action.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              MATRIZ DE PERMISSÕES GRANULARES
            </h1>
            <Badge variant="orange" size="sm">{ALL_PERMISSIONS.length} ações mapeadas</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Controle atômico de acesso por funcionalidade, botão e endpoint do Disk Interno
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 outline-none"
          >
            <option value="all">Todos os Módulos</option>
            {modules.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar permissão..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3">Código da Permissão</th>
                <th className="pb-3">Módulo & Ação</th>
                <th className="pb-3">Descrição de Autorização</th>
                <th className="pb-3">Perfis que Herdam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((perm) => (
                <tr key={perm.code} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 font-mono text-[11px] text-orange-400 font-semibold">
                    {perm.code}
                  </td>

                  <td className="py-3.5">
                    <div className="font-semibold text-white">{perm.action}</div>
                    <div className="text-[10px] text-slate-400">{perm.module}</div>
                  </td>

                  <td className="py-3.5 text-slate-300 text-xs">
                    {perm.description}
                  </td>

                  <td className="py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {perm.defaultRoles.map(r => (
                        <span key={r} className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-300 border border-slate-700">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
