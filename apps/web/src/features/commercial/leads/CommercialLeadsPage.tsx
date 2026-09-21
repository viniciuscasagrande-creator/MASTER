import React, { useEffect, useState } from 'react';
import {
  UserPlus,
  Building2,
  Search,
  Plus,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import {
  CommercialLeadDTO,
  CommercialLeadStatus
} from '@shared/types/index';
import { CommercialApi } from '../api/commercial.api';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { StatCard } from '../../../shared/components/StatCard';
import { formatCnpj, formatDate } from '../../../shared/utils/formatters';

interface CommercialLeadsPageProps {
  onSelectConvertedProducer?: (producerId: string) => void;
}

export const CommercialLeadsPage: React.FC<CommercialLeadsPageProps> = ({
  onSelectConvertedProducer
}) => {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<CommercialLeadDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal: Nova Prospecção
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [savingLead, setSavingLead] = useState(false);
  const [leadForm, setLeadForm] = useState({
    companyName: '',
    tradeName: '',
    cnpj: '',
    contactName: '',
    contactRole: '',
    contactEmail: '',
    contactPhone: '',
    segmentId: 'SHOWS_FESTIVAIS',
    notes: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Modal: Converter Lead em Produtor
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<CommercialLeadDTO | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertCommissionRate, setConvertCommissionRate] = useState('8.0');
  const [convertError, setConvertError] = useState<string | null>(null);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await CommercialApi.listLeads({
        search: search.trim() || undefined,
        status: statusFilter || undefined
      });
      setLeads(res || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar prospecções comerciais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLeads();
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.companyName.trim()) {
      setFormError('Razão Social / Nome da Empresa é obrigatório.');
      return;
    }
    try {
      setSavingLead(true);
      setFormError(null);
      await CommercialApi.createLead({
        companyName: leadForm.companyName.trim(),
        tradeName: leadForm.tradeName.trim() || undefined,
        cnpj: leadForm.cnpj.trim() || undefined,
        contactName: leadForm.contactName.trim() || undefined,
        contactRole: leadForm.contactRole.trim() || undefined,
        contactEmail: leadForm.contactEmail.trim() || undefined,
        contactPhone: leadForm.contactPhone.trim() || undefined,
        segmentId: leadForm.segmentId,
        notes: leadForm.notes.trim() || undefined
      });
      setIsNewLeadModalOpen(false);
      setLeadForm({
        companyName: '',
        tradeName: '',
        cnpj: '',
        contactName: '',
        contactRole: '',
        contactEmail: '',
        contactPhone: '',
        segmentId: 'SHOWS_FESTIVAIS',
        notes: ''
      });
      loadLeads();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao criar prospecção.');
    } finally {
      setSavingLead(false);
    }
  };

  const handleOpenConvert = (lead: CommercialLeadDTO) => {
    setSelectedLeadForConvert(lead);
    setConvertCommissionRate('8.0');
    setConvertError(null);
    setConvertModalOpen(true);
  };

  const handleConfirmConvert = async () => {
    if (!selectedLeadForConvert) return;
    try {
      setConverting(true);
      setConvertError(null);
      const res = await CommercialApi.convertLead(selectedLeadForConvert.id);
      setConvertModalOpen(false);
      if (onSelectConvertedProducer && res.producerId) {
        onSelectConvertedProducer(res.producerId);
      } else {
        loadLeads();
      }
    } catch (err: any) {
      setConvertError(err.message || 'Erro ao converter prospecção em produtor.');
    } finally {
      setConverting(false);
    }
  };

  const getStatusBadge = (st: CommercialLeadStatus) => {
    switch (st) {
      case 'NEW':
        return <Badge variant="cyan">Novo</Badge>;
      case 'CONTACTED':
        return <Badge variant="purple">Contatado</Badge>;
      case 'QUALIFIED':
        return <Badge variant="amber">Qualificado</Badge>;
      case 'NEGOTIATING':
        return <Badge variant="orange">Em Negociação</Badge>;
      case 'CONVERTED':
        return <Badge variant="emerald">Convertido</Badge>;
      case 'LOST':
        return <Badge variant="rose">Perdido</Badge>;
      case 'DISQUALIFIED':
      default:
        return <Badge variant="slate">Desqualificado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-orange-500" />
              PROSPECÇÕES & NOVOS NEGÓCIOS (LEADS)
            </h1>
            <Badge variant="orange" size="sm">Pipeline B2B</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Prospecção de novos produtores de eventos, qualificação de mercado e conversão para a carteira ativa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLeads}
            icon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewLeadModalOpen(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            Nova Prospecção
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Prospecções"
          value={leads.length}
          subtitle="Em prospecção no Comercial"
          icon={<Building2 className="h-4 w-4 text-orange-500" />}
        />
        <StatCard
          title="Novos & Contatados"
          value={leads.filter((l) => l.status === 'NEW' || l.status === 'CONTACTED').length}
          subtitle="Em fase de sondagem inicial"
          icon={<Clock className="h-4 w-4 text-cyan-500" />}
        />
        <StatCard
          title="Qualificados / Negociação"
          value={leads.filter((l) => l.status === 'QUALIFIED' || l.status === 'NEGOTIATING').length}
          subtitle="Aptos para conversão em Produtor"
          icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
        />
        <StatCard
          title="Convertidos com Sucesso"
          value={leads.filter((l) => l.status === 'CONVERTED').length}
          subtitle="Migrados para produtores credenciados"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          badgeVariant="emerald"
        />
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Empresa, CNPJ, Contato ou Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filtrar por Status do Lead"
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-orange-500 focus:bg-white"
            >
              <option value="">Todos os Status</option>
              <option value="NEW">Novo</option>
              <option value="CONTACTED">Contatado</option>
              <option value="QUALIFIED">Qualificado</option>
              <option value="NEGOTIATING">Em Negociação</option>
              <option value="CONVERTED">Convertido</option>
              <option value="LOST">Perdido</option>
              <option value="DISQUALIFIED">Desqualificado</option>
            </select>

            <Button type="submit" variant="secondary" size="sm">
              Filtrar
            </Button>
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Leads Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Empresa / Prospecção</th>
                <th className="px-4 py-3">Contato Principal</th>
                <th className="px-4 py-3">Segmento</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Criado em</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading && leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-orange-500" />
                    Carregando prospecções...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Nenhuma prospecção encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {lead.tradeName || lead.companyName}
                        </div>
                        {lead.tradeName && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{lead.companyName}</div>
                        )}
                        {lead.cnpj && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                            CNPJ: {formatCnpj(lead.cnpj)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {lead.contactName ? (
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">{lead.contactName}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{lead.contactRole || 'Contato'}</div>
                            {lead.contactEmail && (
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{lead.contactEmail}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Não informado</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="slate" size="sm">
                          {lead.segmentId || 'Geral'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge(lead.status)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-slate-700 dark:text-slate-300">
                          {lead.ownerName || 'Não atribuído'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-400 text-xs">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {lead.status === 'CONVERTED' ? (
                          <Badge variant="emerald" size="sm">
                            Produtor Ativo
                          </Badge>
                        ) : (
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleOpenConvert(lead)}
                            icon={<ArrowRight className="h-3 w-3" />}
                          >
                            Converter em Produtor
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nova Prospecção */}
      <Modal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-orange-500" />
            <span className="text-slate-900 dark:text-white">Cadastrar Nova Prospecção (Lead)</span>
          </div>
        }
        size="lg"
      >
        <form onSubmit={handleSaveLead} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Razão Social <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                required
                value={leadForm.companyName}
                onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
                placeholder="Ex: Entretenimento Brasil Ltda"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nome Fantasia
              </label>
              <input
                type="text"
                value={leadForm.tradeName}
                onChange={(e) => setLeadForm({ ...leadForm, tradeName: e.target.value })}
                placeholder="Ex: Brasil Shows"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                CNPJ (Anti-duplicidade)
              </label>
              <input
                type="text"
                value={leadForm.cnpj}
                onChange={(e) => setLeadForm({ ...leadForm, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Segmento
              </label>
              <select
                value={leadForm.segmentId}
                onChange={(e) => setLeadForm({ ...leadForm, segmentId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 focus:bg-white"
              >
                <option value="SHOWS_FESTIVAIS">Shows & Festivais</option>
                <option value="TEATRO_CULTURA">Teatro & Cultura</option>
                <option value="CORPORATIVO">Corporativo</option>
                <option value="ESPORTIVO">Esportivo</option>
                <option value="RELIGIOSO">Religioso</option>
                <option value="OUTRO">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Contato Principal (Nome)
              </label>
              <input
                type="text"
                value={leadForm.contactName}
                onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })}
                placeholder="Ex: Fernanda Lima"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Comercial
              </label>
              <input
                type="email"
                value={leadForm.contactEmail}
                onChange={(e) => setLeadForm({ ...leadForm, contactEmail: e.target.value })}
                placeholder="fernanda@empresa.com.br"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={leadForm.contactPhone}
                onChange={(e) => setLeadForm({ ...leadForm, contactPhone: e.target.value })}
                placeholder="(41) 98888-7777"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Observações Comerciais & Expectativa de Eventos
            </label>
            <textarea
              rows={3}
              value={leadForm.notes}
              onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
              placeholder="Descreva perfil da produtora, histórico de festivais, praças pretendidas..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewLeadModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={savingLead}
            >
              Salvar Prospecção
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Converter em Produtor */}
      <Modal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-slate-900 dark:text-white">Converter Prospecção em Produtor Credenciado</span>
          </div>
        }
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Você está convertendo formalmente a empresa{' '}
            <strong className="text-slate-900 dark:text-white font-bold">
              {selectedLeadForConvert?.tradeName || selectedLeadForConvert?.companyName}
            </strong>{' '}
            em um produtor credenciado do sistema DiskIngressos.
          </p>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider text-[10px]">
              O que acontece após a conversão:
            </div>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 list-disc list-inside">
              <li>Criação da entidade mestre <strong className="text-slate-800 dark:text-slate-200">Produtor</strong> no Core</li>
              <li>Criação da <strong className="text-slate-800 dark:text-slate-200">Conta Comercial</strong> com parâmetros acordados</li>
              <li>Vinculação na sua <strong className="text-slate-800 dark:text-slate-200">Carteira Comercial</strong> como Owner</li>
              <li>Migração automática de todas as oportunidades associadas</li>
              <li>Cadastro do interlocutor primário nos contatos B2B</li>
            </ul>
          </div>

          {convertError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{convertError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Taxa de Comissão Negociada Padrão (%)
            </label>
            <input
              type="text"
              value={convertCommissionRate}
              onChange={(e) => setConvertCommissionRate(e.target.value)}
              placeholder="Ex: 8.0"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white font-mono"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Esta taxa servirá de base contratual para os futuros eventos cadastrados por este produtor.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConvertModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="success"
              size="sm"
              isLoading={converting}
              onClick={handleConfirmConvert}
            >
              Confirmar e Abrir Visão Comercial
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
