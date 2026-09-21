import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  PlusCircle,
  ShieldAlert,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  Search,
  ExternalLink,
  History
} from 'lucide-react';
import {
  ContractedProductSummaryDTO,
  ProducerEntitlementDTO,
  EntitlementOverrideDTO,
  EntitlementAuditLogDTO,
  CreateEntitlementOverrideDTO
} from '@shared/types/index';
import { EntitlementsApi } from '../api/entitlements.api';
import { Badge, BadgeVariant } from '../../../../shared/components/Badge';
import { Button } from '../../../../shared/components/Button';
import { StatCard } from '../../../../shared/components/StatCard';
import { Modal } from '../../../../shared/components/Modal';
import { formatDate, formatDateTime } from '../../../../shared/utils/formatters';

interface ProducerProductsTabProps {
  producerId: string;
}

export const ProducerProductsTab: React.FC<ProducerProductsTabProps> = ({ producerId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'produtos' | 'diagnostico' | 'auditoria'>('produtos');

  const [products, setProducts] = useState<ContractedProductSummaryDTO[]>([]);
  const [entitlements, setEntitlements] = useState<ProducerEntitlementDTO[]>([]);
  const [overrides, setOverrides] = useState<EntitlementOverrideDTO[]>([]);
  const [auditLogs, setAuditLogs] = useState<EntitlementAuditLogDTO[]>([]);

  // Modals & Action States
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<string | null>(null);

  // Test Access State
  const [testFeatureCode, setTestFeatureCode] = useState('feature.events.max_active_events');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testingAccess, setTestingAccess] = useState(false);

  // Override Form
  const [overrideForm, setOverrideForm] = useState<CreateEntitlementOverrideDTO>({
    producerId,
    featureCode: 'feature.access.offline_validator',
    action: 'GRANT',
    reason: '',
    effectiveUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    approvedBy: 'diretoria-comercial',
    approvedByName: 'Diretoria Comercial DiskIngressos'
  });
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodsRes, entsRes, ovrsRes, logsRes] = await Promise.all([
        EntitlementsApi.getContractedProducts(producerId),
        EntitlementsApi.getProducerEntitlements(producerId),
        EntitlementsApi.listOverrides(producerId),
        EntitlementsApi.getAuditLogs(producerId)
      ]);
      setProducts(prodsRes);
      setEntitlements(entsRes);
      setOverrides(ovrsRes);
      setAuditLogs(logsRes);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados de habilitações.');
    } finally {
      setLoading(false);
    }
  }, [producerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReconcile = async () => {
    try {
      setReconciling(true);
      setReconcileResult(null);
      const res = await EntitlementsApi.reconcileProducer(producerId);
      setReconcileResult(
        `Reconciliação concluída: ${res.evaluatedContracts} contratos avaliados, ${res.createdEntitlements} criados, ${res.updatedEntitlements} atualizados.`
      );
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Falha na reconciliação.');
    } finally {
      setReconciling(false);
    }
  };

  const handleCreateOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setOverrideSubmitting(true);
      await EntitlementsApi.createOverride({
        ...overrideForm,
        producerId,
        effectiveUntil: new Date(overrideForm.effectiveUntil).toISOString()
      });
      setIsOverrideModalOpen(false);
      setOverrideForm({
        producerId,
        featureCode: 'feature.access.offline_validator',
        action: 'GRANT',
        reason: '',
        effectiveUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        approvedBy: 'diretoria-comercial',
        approvedByName: 'Diretoria Comercial DiskIngressos'
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar override.');
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const handleRevokeOverride = async (overrideId: string) => {
    if (!confirm('Deseja realmente revogar este override antecipadamente?')) return;
    try {
      await EntitlementsApi.revokeOverride(overrideId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao revogar override.');
    }
  };

  const handleRunAccessTest = async () => {
    try {
      setTestingAccess(true);
      setTestResult(null);
      const res = await EntitlementsApi.checkEntitlement(producerId, testFeatureCode, 1);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ allowed: false, reason: err.message });
    } finally {
      setTestingAccess(false);
    }
  };

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'ACTIVE':
        return 'emerald';
      case 'SCHEDULED':
        return 'cyan';
      case 'SUSPENDED':
        return 'amber';
      case 'EXPIRED':
      case 'TERMINATED':
        return 'rose';
      default:
        return 'slate';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'ACCESS':
        return <Badge variant="cyan" size="sm">PORTARIA / ACESSO</Badge>;
      case 'BOX_OFFICE':
        return <Badge variant="purple" size="sm">BILHETERIA FÍSICA</Badge>;
      case 'MARKETING':
        return <Badge variant="orange" size="sm">MARKETING</Badge>;
      case 'REPORTS':
        return <Badge variant="emerald" size="sm">BORDERÔ / ANALYTICS</Badge>;
      case 'FINANCE':
        return <Badge variant="amber" size="sm">FINANCEIRO</Badge>;
      default:
        return <Badge variant="slate" size="sm">PLATAFORMA</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-3 text-orange-500" />
        Carregando produtos e habilitações comerciais...
      </div>
    );
  }

  const activeEntitlementsCount = entitlements.filter(e => e.status === 'ACTIVE').length;
  const activeOverridesCount = overrides.filter(o => o.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {reconcileResult && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{reconcileResult}</span>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Produtos Contratados"
          value={products.length}
          subtitle="Ofertas ativas ou agendadas"
          icon={<Package className="w-5 h-5 text-orange-400" />}
        />
        <StatCard
          title="Habilitações Técnicas"
          value={activeEntitlementsCount}
          subtitle="Recursos com vigência ativa"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          title="Overrides Administrativos"
          value={activeOverridesCount}
          subtitle="Concessões temporárias ativas"
          icon={<ShieldAlert className="w-5 h-5 text-purple-400" />}
        />
        <StatCard
          title="Conformidade & Vigência"
          value={entitlements.some(e => e.status === 'SUSPENDED') ? 'Com Pendência' : 'Regular'}
          subtitle="Status operacional do produtor"
          icon={<Activity className="w-5 h-5 text-cyan-400" />}
        />
      </div>

      {/* Sub-Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('produtos')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'produtos'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5" />
              Produtos & Limites ({products.length})
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('diagnostico')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'diagnostico'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              Diagnóstico & Overrides ({overrides.length})
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('auditoria')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'auditoria'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <History className="w-3.5 h-3.5" />
              Telemetria ({auditLogs.length})
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTestModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Simular Acesso
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReconcile}
            disabled={reconciling}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${reconciling ? 'animate-spin' : ''}`} />
            Reconciliar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsOverrideModalOpen(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Novo Override
          </Button>
        </div>
      </div>

      {/* TAB 1: PRODUTOS CONTRATADOS & LIMITES */}
      {activeSubTab === 'produtos' && (
        <div className="space-y-6">
          {products.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs">
              <Package className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Nenhum produto comercial contratado</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
                Este produtor ainda não possui contratos comerciais ativos provisionados ou migrações legadas registradas.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" size="sm" onClick={handleReconcile}>
                  Reconciliar Contratos
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {products.map((prod, idx) => (
                <div
                  key={`${prod.offeringId}-${idx}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-6 hover:border-orange-300 dark:hover:border-slate-700 transition-colors shadow-xs"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{prod.offeringName}</h3>
                        <Badge variant={getStatusBadgeVariant(prod.status)}>
                          {prod.status}
                        </Badge>
                        <Badge variant="orange" size="sm">
                          {prod.offeringType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {prod.contractPublicCode && (
                          <span className="flex items-center gap-1 font-mono">
                            Contrato: {prod.contractPublicCode}
                          </span>
                        )}
                        {prod.publicCode && (
                          <span className="flex items-center gap-1 font-mono text-slate-400 dark:text-slate-500">
                            Oferta: {prod.publicCode}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          Vigência: {prod.effectiveFrom ? formatDate(prod.effectiveFrom) : 'Imediato'} até{' '}
                          {prod.effectiveUntil ? formatDate(prod.effectiveUntil) : 'Indeterminado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Features & Limites Included */}
                  <div className="mt-6">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-orange-500" />
                      Capacidades e Limites Operacionais Incluídos
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prod.features.map((feat) => (
                        <div
                          key={feat.code}
                          className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-sm font-medium text-slate-900 dark:text-slate-200">{feat.name}</h5>
                                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{feat.code}</span>
                              </div>
                              {getCategoryBadge(feat.category)}
                            </div>
                          </div>

                          {feat.limits && feat.limits.length > 0 ? (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/60 space-y-2">
                              {feat.limits.map((lim) => {
                                const percentage = lim.value > 0 ? Math.min(100, Math.round((lim.currentUsage / lim.value) * 100)) : 0;
                                return (
                                  <div key={lim.key} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-500 dark:text-slate-400">Consumo em Tempo Real:</span>
                                      <span className={`font-semibold ${lim.isExceeded ? 'text-rose-500 dark:text-rose-400' : 'text-slate-900 dark:text-slate-200'}`}>
                                        {lim.currentUsage} / {lim.value} {lim.unit}
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-full transition-all duration-300 ${
                                          lim.isExceeded ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`}
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                    {lim.isExceeded && (
                                      <p className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">
                                        Limite atingido. Operações extras exigem aditivo ou override.
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
                              <span>Acesso ilimitado contratado</span>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIAGNÓSTICO & OVERRIDES */}
      {activeSubTab === 'diagnostico' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Overrides Administrativos Registrados</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Concessões excepcionais, bloqueios preventivos ou alterações temporárias de cotas.
                </p>
              </div>
              <Button size="sm" variant="primary" onClick={() => setIsOverrideModalOpen(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Cadastrar Override
              </Button>
            </div>

            {overrides.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                Nenhum override administrativo ativo ou histórico para este produtor.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50/80 dark:bg-slate-950 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Ação</th>
                      <th className="py-3 px-4">Recurso</th>
                      <th className="py-3 px-4">Justificativa</th>
                      <th className="py-3 px-4">Vigência</th>
                      <th className="py-3 px-4">Aprovador</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {overrides.map((ovr) => (
                      <tr key={ovr.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <Badge variant={ovr.action === 'GRANT' ? 'emerald' : 'rose'} size="sm">
                            {ovr.action}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">{ovr.featureName || ovr.featureCode}</div>
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{ovr.featureCode}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate" title={ovr.reason}>
                          {ovr.reason}
                        </td>
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          Até {formatDate(ovr.effectiveUntil)}
                        </td>
                        <td className="py-3 px-4 text-xs">{ovr.approvedByName || ovr.approvedBy}</td>
                        <td className="py-3 px-4">
                          <Badge variant={ovr.status === 'ACTIVE' ? 'emerald' : 'slate'} size="sm">
                            {ovr.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {ovr.status === 'ACTIVE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeOverride(ovr.id)}
                              className="text-rose-500 hover:text-rose-600 hover:border-rose-300"
                            >
                              Revogar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUDITORIA & TELEMETRIA */}
      {activeSubTab === 'auditoria' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Trilha de Auditoria & Telemetria de Direitos</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Histórico imutável de provisionamento, reconciliação e verificações de acesso interceptadas pelo motor transversal.
          </p>

          {auditLogs.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              Nenhum registro de telemetria disponível.
            </p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          log.eventType === 'CHECK_DENIED'
                            ? 'rose'
                            : log.eventType === 'CHECK_WARNING'
                            ? 'amber'
                            : 'emerald'
                        }
                        size="sm"
                      >
                        {log.eventType}
                      </Badge>
                      <span className="font-semibold text-slate-900 dark:text-white">{log.source}</span>
                      {log.featureCode && (
                        <span className="font-mono text-slate-500 dark:text-slate-400">{log.featureCode}</span>
                      )}
                    </div>
                    {log.detailsJson && (
                      <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{log.detailsJson}</p>
                    )}
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: NOVO OVERRIDE TEMPORÁRIO */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Cadastrar Override Administrativo Temporário"
      >
        <form onSubmit={handleCreateOverride} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Recurso Técnico / Feature
            </label>
            <select
              value={overrideForm.featureCode}
              onChange={(e) => setOverrideForm({ ...overrideForm, featureCode: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 focus:bg-white"
            >
              <option value="feature.access.offline_validator">Validação Offline de Ingressos (feature.access.offline_validator)</option>
              <option value="feature.access.facial_biometrics">Biometria Facial (feature.access.facial_biometrics)</option>
              <option value="feature.events.max_active_events">Limite de Eventos Ativos (feature.events.max_active_events)</option>
              <option value="feature.marketing.boost_email">Disparo de E-mail Marketing (feature.marketing.boost_email)</option>
              <option value="feature.reports.advanced_analytics">Bordero e Analytics (feature.reports.advanced_analytics)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ação
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${
                  overrideForm.action === 'GRANT'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="GRANT"
                  checked={overrideForm.action === 'GRANT'}
                  onChange={() => setOverrideForm({ ...overrideForm, action: 'GRANT' })}
                  className="hidden"
                />
                <CheckCircle2 className="w-4 h-4" />
                <span>GRANT (Conceder)</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${
                  overrideForm.action === 'REVOKE'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="REVOKE"
                  checked={overrideForm.action === 'REVOKE'}
                  onChange={() => setOverrideForm({ ...overrideForm, action: 'REVOKE' })}
                  className="hidden"
                />
                <XCircle className="w-4 h-4" />
                <span>REVOKE (Revogar)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data de Vigência Final (Expiração Obrigatória)
            </label>
            <input
              type="date"
              required
              value={overrideForm.effectiveUntil}
              onChange={(e) => setOverrideForm({ ...overrideForm, effectiveUntil: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Justificativa Comercial / Operacional (Mínimo 10 caracteres)
            </label>
            <textarea
              required
              rows={3}
              placeholder="Descreva a razão da concessão ou corte emergencial..."
              value={overrideForm.reason}
              onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsOverrideModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={overrideSubmitting}>
              {overrideSubmitting ? 'Salvando...' : 'Salvar Override'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: TESTE DE ACESSO EM TEMPO REAL */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => {
          setIsTestModalOpen(false);
          setTestResult(null);
        }}
        title="Simulador de Avaliação de Entitlement"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Executa a avaliação canônica em tempo real combinando Contrato, Limites, Vigência e Overrides para verificar se o produtor teria acesso liberado.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Selecione o Recurso Técnico
            </label>
            <select
              value={testFeatureCode}
              onChange={(e) => setTestFeatureCode(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 focus:bg-white"
            >
              <option value="feature.events.max_active_events">feature.events.max_active_events</option>
              <option value="feature.access.offline_validator">feature.access.offline_validator</option>
              <option value="feature.access.facial_biometrics">feature.access.facial_biometrics</option>
              <option value="feature.marketing.boost_email">feature.marketing.boost_email</option>
              <option value="feature.reports.advanced_analytics">feature.reports.advanced_analytics</option>
            </select>
          </div>

          <Button
            variant="primary"
            onClick={handleRunAccessTest}
            disabled={testingAccess}
            className="w-full"
          >
            {testingAccess ? 'Avaliando...' : 'Simular Verificação'}
          </Button>

          {testResult && (
            <div
              className={`p-4 rounded-xl border ${
                testResult.allowed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                {testResult.allowed ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>ACESSO PERMITIDO</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <span>ACESSO BLOQUEADO</span>
                  </>
                )}
              </div>
              {testResult.reason && (
                <p className="text-xs opacity-90 mt-1">Motivo: {testResult.reason}</p>
              )}
              {testResult.limit && (
                <p className="text-xs opacity-80 mt-1 font-mono">
                  Uso: {testResult.limit.currentUsage} / Limite: {testResult.limit.limitValue} (Estourado: {testResult.limit.exceeded ? 'SIM' : 'NÃO'})
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
