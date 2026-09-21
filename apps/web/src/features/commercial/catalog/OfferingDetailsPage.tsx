import React, { useEffect, useState, useCallback } from 'react';
import {
  Layers,
  ArrowLeft,
  Sparkles,
  Package,
  Cpu,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Hash,
  Archive,
  Plus,
  RefreshCw,
  FileText,
  Building2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import {
  CommercialOfferingDTO,
  CommercialOfferingVersionDTO,
  CommercialCatalogImpactDTO
} from '@shared/types/index';
import { CommercialCatalogApi } from './api/commercial-catalog.api';
import { NewVersionModal } from './components/NewVersionModal';
import { PublishVersionModal } from './components/PublishVersionModal';
import { DiscontinueOfferingModal } from './components/DiscontinueOfferingModal';
import { Button } from '../../../shared/components/Button';
import { formatDate } from '../../../shared/utils/formatters';

interface OfferingDetailsPageProps {
  offeringId: string;
  onBack: () => void;
  onSelectChildOffering?: (childOfferingId: string) => void;
}

type TabType = 'OVERVIEW' | 'COMPOSITION' | 'FEATURES' | 'TERMS' | 'VERSIONS' | 'IMPACT';

export const OfferingDetailsPage: React.FC<OfferingDetailsPageProps> = ({
  offeringId,
  onBack,
  onSelectChildOffering
}) => {
  const [offering, setOffering] = useState<CommercialOfferingDTO | null>(null);
  const [versions, setVersions] = useState<CommercialOfferingVersionDTO[]>([]);
  const [impact, setImpact] = useState<CommercialCatalogImpactDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');

  // Modals
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [publishingVersion, setPublishingVersion] = useState<CommercialOfferingVersionDTO | null>(null);
  const [isDiscontinueModalOpen, setIsDiscontinueModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [off, vers, imp] = await Promise.all([
        CommercialCatalogApi.getOfferingById(offeringId),
        CommercialCatalogApi.listOfferingVersions(offeringId),
        CommercialCatalogApi.getOfferingImpact(offeringId)
      ]);
      setOffering(off);
      setVersions(vers);
      setImpact(imp);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar detalhes da oferta.');
    } finally {
      setLoading(false);
    }
  }, [offeringId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !offering) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm">Carregando detalhes da oferta comercial...</p>
      </div>
    );
  }

  if (error || !offering) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 shadow-xs">
        <p className="text-rose-600 dark:text-rose-400 font-semibold">{error || 'Oferta comercial não encontrada.'}</p>
        <Button variant="outline" onClick={onBack} className="gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Catálogo
        </Button>
      </div>
    );
  }

  const currentVer = offering.currentVersion;

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao Catálogo Comercial
        </button>

        <div className="flex items-center gap-3">
          {offering.status === 'ACTIVE' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNewVersionModalOpen(true)}
                className="gap-2 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <GitBranch className="h-4 w-4" /> Nova Versão (Rascunho)
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDiscontinueModalOpen(true)}
                className="gap-2 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/10"
              >
                <Archive className="h-4 w-4" /> Descontinuar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Offering Header Banner */}
      <div className="p-6 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-0.5 rounded-lg border border-orange-200 dark:border-orange-800/40">
                {offering.publicCode}
              </span>
              <span className="text-xs text-slate-400 font-mono">({offering.code})</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                {offering.type}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-semibold ${
                  offering.status === 'ACTIVE'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : offering.status === 'DRAFT'
                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                }`}
              >
                {offering.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{offering.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Categoria: <strong className="text-slate-700 dark:text-slate-200">{offering.categoryName || 'Geral'}</strong> | Versão Ativa Corrente:{' '}
              <strong className="text-orange-600 dark:text-orange-400 font-mono">v{offering.currentVersionNumber}</strong>
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl min-w-[220px] text-right space-y-1">
            <p className="text-[10px] uppercase font-semibold text-slate-500">Condição Comercial Padrão</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {offering.defaultPricingModel === 'PERCENTAGE' && offering.defaultPercentage !== null
                ? `${offering.defaultPercentage}%`
                : offering.defaultAmount !== null
                ? `R$ ${offering.defaultAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : 'Sob Consulta'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {offering.defaultPricingModel} • Pagador: {offering.defaultPayer}
            </p>
          </div>
        </div>

        {/* Content Hash Banner */}
        {currentVer?.contentHash && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Integridade da Versão Corrente (SHA-256):</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">{currentVer.contentHash}</span>
            </div>
            {currentVer.publishedAt && (
              <span className="text-slate-500 text-[11px]">
                Publicado em {formatDate(currentVer.publishedAt)} por {currentVer.publishedByName || 'Diretoria'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-4 gap-6 text-sm overflow-x-auto">
          {[
            { id: 'OVERVIEW', label: 'Resumo da Oferta' },
            ...(offering.type === 'PACKAGE' || offering.type === 'PLAN'
              ? [{ id: 'COMPOSITION', label: `Composição (${currentVer?.compositions?.length || 0})` }]
              : []),
            { id: 'FEATURES', label: `Recursos Técnicos (${currentVer?.features?.length || 0})` },
            { id: 'TERMS', label: `Condições Padrão (${currentVer?.defaultTerms?.length || 0})` },
            { id: 'VERSIONS', label: `Versões Históricas (${versions.length})` },
            { id: 'IMPACT', label: 'Uso & Impacto Comercial' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`pb-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-bold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Descrição Comercial
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  {offering.description || 'Nenhuma descrição detalhada informada.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-400">Atributos Operacionais</h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-900">
                      <span className="text-slate-500">Código Oficial:</span>
                      <span className="font-mono text-slate-900 dark:text-slate-200">{offering.code}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-900">
                      <span className="text-slate-500">Código Público:</span>
                      <span className="font-mono text-orange-600 dark:text-orange-400">{offering.publicCode}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-900">
                      <span className="text-slate-500">Tipo de Estrutura:</span>
                      <span className="text-slate-900 dark:text-slate-200">{offering.type}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Ordem de Exibição:</span>
                      <span className="text-slate-900 dark:text-slate-200">{offering.sortOrder}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-400">Metadados de Versionamento</h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-900">
                      <span className="text-slate-500">Versão Vigente:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">v{offering.currentVersionNumber}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-900">
                      <span className="text-slate-500">Total de Versões:</span>
                      <span className="text-slate-900 dark:text-slate-200">{versions.length} registrada(s)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-900">
                      <span className="text-slate-500">Cadastrado em:</span>
                      <span className="text-slate-900 dark:text-slate-200">{formatDate(offering.createdAt)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Última Atualização:</span>
                      <span className="text-slate-900 dark:text-slate-200">{formatDate(offering.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPOSITION */}
          {activeTab === 'COMPOSITION' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                    Composição do Pacote na Versão Corrente (v{offering.currentVersionNumber})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Itens e serviços que compõem este combo operacional
                  </p>
                </div>
              </div>

              {!currentVer?.compositions || currentVer.compositions.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic py-6 text-center">
                  Este pacote não possui itens componentes vinculados nesta versão.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950">
                  {currentVer.compositions.map(comp => (
                    <div
                      key={comp.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-100/60 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-orange-600 dark:text-orange-400 font-semibold">
                            {comp.childOfferingPublicCode}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                            {comp.childOfferingType}
                          </span>
                          {comp.required && (
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded font-semibold">
                              Obrigatório
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {comp.childOfferingName}
                        </p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Quantidade</span>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{comp.quantity}x</p>
                        </div>

                        {onSelectChildOffering && (
                          <button
                            onClick={() => onSelectChildOffering(comp.childOfferingId)}
                            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="Ver Oferta Componente"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FEATURES */}
          {activeTab === 'FEATURES' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                  Recursos Técnicos Habilitados na Versão v{offering.currentVersionNumber}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Funcionalidades e módulos ativados contratualmente nos eventos que contratarem este item
                </p>
              </div>

              {!currentVer?.features || currentVer.features.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic py-6 text-center">
                  Nenhum recurso técnico específico configurado nesta versão.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentVer.features.map(f => (
                    <div
                      key={f.id}
                      className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-3"
                    >
                      <div className="p-2 bg-orange-50 dark:bg-indigo-500/10 border border-orange-200 dark:border-indigo-500/20 text-orange-600 dark:text-indigo-400 rounded-lg">
                        <Cpu className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">{f.featureName || f.featureCode}</p>
                          <span className="text-[10px] font-mono text-slate-500 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                            {f.featureCategory}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-orange-600 dark:text-indigo-400">{f.featureCode}</p>
                        {f.limitValue !== null && f.limitValue !== undefined && (
                          <p className="text-xs text-amber-700 dark:text-amber-400 pt-1 font-medium">
                            Limite Contratado: <strong>{f.limitValue} {f.limitUnit || 'unidades'}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TERMS */}
          {activeTab === 'TERMS' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                  Condições Comerciais Padrão Resolvidas (v{offering.currentVersionNumber})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Parâmetros de precificação que serão carregados por padrão em novas propostas
                </p>
              </div>

              {!currentVer?.defaultTerms || currentVer.defaultTerms.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic py-6 text-center">
                  Nenhuma condição financeira explícita nesta versão.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950">
                  {currentVer.defaultTerms.map(term => (
                    <div key={term.id} className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">{term.termType}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                            {term.calculationType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Responsável pelo Pagamento: <strong className="text-slate-800 dark:text-slate-200">{term.payer}</strong>
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                          {term.percentage !== null && term.percentage !== undefined
                            ? `${term.percentage}%`
                            : term.amount !== null && term.amount !== undefined
                            ? `R$ ${term.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </p>
                        {term.minimumAmount && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                            Mínimo: R$ {term.minimumAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: VERSIONS */}
          {activeTab === 'VERSIONS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                    Histórico Imutável de Versões do Catálogo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Todas as versões criadas possuem hash criptográfico e registro auditável
                  </p>
                </div>

                {offering.status === 'ACTIVE' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsNewVersionModalOpen(true)}
                    className="gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    <Plus className="h-4 w-4" /> Nova Versão (Rascunho)
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {versions.map(ver => {
                  const isCurrent = ver.id === offering.currentVersionId;
                  return (
                    <div
                      key={ver.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-white dark:bg-slate-950 border-orange-300 dark:border-indigo-500/40 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                              isCurrent
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            v{ver.versionNumber}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-semibold ${
                              ver.status === 'ACTIVE'
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                : ver.status === 'DRAFT'
                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                            }`}
                          >
                            {ver.status}
                          </span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {ver.nameSnapshot}
                          </span>
                          {isCurrent && (
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Versão Corrente Ativa
                            </span>
                          )}
                        </div>

                        {ver.status === 'DRAFT' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setPublishingVersion(ver)}
                            className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" /> Publicar Versão v{ver.versionNumber}
                          </Button>
                        )}
                      </div>

                      <div className="pt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                        {ver.changeSummary && (
                          <p className="text-slate-700 dark:text-slate-300 italic">
                            &quot;{ver.changeSummary}&quot;
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> Criado em: {formatDate(ver.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" /> Por: {ver.createdByName || ver.createdBy}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-slate-500 dark:text-slate-400">
                            <Hash className="h-3.5 w-3.5" /> {ver.contentHash}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: IMPACT */}
          {activeTab === 'IMPACT' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                  Análise de Impacto Comercial e Contratual em Tempo Real
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mapeamento de onde esta oferta está sendo negociada ou contratada por produtores
                </p>
              </div>

              {impact ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Propostas em Rascunho</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 pt-1">{impact.draftProposalsCount}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Propostas Enviadas</p>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 pt-1">{impact.sentProposalsCount}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Contratos Ativos</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 pt-1">{impact.activeContractsCount}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Pacotes Pai</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 pt-1">{impact.parentPackagesCount}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Diagnóstico de Dependências:</h4>
                    <p className="text-slate-600 dark:text-slate-300">{impact.warningMessage}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">Nenhum dado de impacto disponível.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isNewVersionModalOpen && (
        <NewVersionModal
          isOpen={isNewVersionModalOpen}
          onClose={() => setIsNewVersionModalOpen(false)}
          offering={offering}
          onVersionCreated={() => {
            loadData();
            setActiveTab('VERSIONS');
          }}
        />
      )}

      {publishingVersion && (
        <PublishVersionModal
          isOpen={Boolean(publishingVersion)}
          onClose={() => setPublishingVersion(null)}
          offering={offering}
          version={publishingVersion}
          onPublished={() => {
            loadData();
          }}
        />
      )}

      {isDiscontinueModalOpen && (
        <DiscontinueOfferingModal
          isOpen={isDiscontinueModalOpen}
          onClose={() => setIsDiscontinueModalOpen(false)}
          offering={offering}
          onDiscontinued={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};
