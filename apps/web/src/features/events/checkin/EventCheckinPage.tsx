import React, { useState, useEffect, useCallback } from 'react';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  ShieldAlert,
  Sliders,
  Download,
  Upload,
  UserCheck,
  Clock,
  ArrowRightLeft,
  Lock,
  Unlock,
  Radio,
  Eye,
  Check,
  X,
  BatteryCharging,
  Layers,
  MapPin,
  Users
} from 'lucide-react';
import { useAuth } from '../../../core/auth/AuthContext';
import {
  fetchCheckinSummary,
  validateTicket,
  listAccessDevices,
  registerAccessDevice,
  revokeAccessDevice,
  authorizeAccessDevice,
  listAccessRules,
  createAccessRule,
  generateOfflineBundle,
  syncOfflineBatch,
  listOfflineConflicts,
  resolveOfflineConflict,
  listPendingExceptions,
  reviewException,
  listTicketBlocks,
  blockTicket,
  unblockTicket,
  startDeviceSession
} from '../api/checkin.api';
import {
  CheckinSummaryDTO,
  AccessValidationResultDTO,
  AccessDeviceDTO,
  AccessRuleDTO,
  OfflineConflictDTO,
  AccessExceptionRequestDTO,
  TicketAccessBlockDTO,
  AccessMovementType,
  ReentryPolicyType
} from '@shared/types/index';

interface EventCheckinPageProps {
  eventId: string;
  eventName: string;
  onNavigate?: (subItemId: string) => void;
}

type TabType = 'visao-geral' | 'scanner' | 'dispositivos' | 'regras' | 'offline' | 'bloqueios-excecoes';

export const EventCheckinPage: React.FC<EventCheckinPageProps> = ({
  eventId,
  eventName,
  onNavigate
}) => {
  const { currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('visao-geral');

  // Summary State
  const [summary, setSummary] = useState<CheckinSummaryDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scanner State
  const [scanInput, setScanInput] = useState('');
  const [selectedMovement, setSelectedMovement] = useState<AccessMovementType>('ENTRY');
  const [manualOverrideReason, setManualOverrideReason] = useState('');
  const [lastValidation, setLastValidation] = useState<AccessValidationResultDTO | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationHistory, setValidationHistory] = useState<AccessValidationResultDTO[]>([]);

  // Devices State
  const [devices, setDevices] = useState<AccessDeviceDTO[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isNewDeviceModalOpen, setIsNewDeviceModalOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState('DEDICATED_SCANNER');

  // Rules State
  const [rules, setRules] = useState<AccessRuleDTO[]>([]);
  const [isNewRuleModalOpen, setIsNewRuleModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newReentryPolicy, setNewReentryPolicy] = useState<ReentryPolicyType>('NO_REENTRY');
  const [newMaxReentries, setNewMaxReentries] = useState(0);

  // Offline State
  const [conflicts, setConflicts] = useState<OfflineConflictDTO[]>([]);
  const [offlineStatusMsg, setOfflineStatusMsg] = useState<string | null>(null);

  // Exceptions & Blocks State
  const [exceptions, setExceptions] = useState<AccessExceptionRequestDTO[]>([]);
  const [blocks, setBlocks] = useState<TicketAccessBlockDTO[]>([]);
  const [blockTicketId, setBlockTicketId] = useState('');
  const [blockTicketNumber, setBlockTicketNumber] = useState('');
  const [blockReason, setBlockReason] = useState('');

  // Load summary and devices
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      setError(null);
      const [sumData, devData, rulesData, confData, excData, blkData] = await Promise.all([
        fetchCheckinSummary(eventId).catch(() => null),
        listAccessDevices(eventId).catch(() => []),
        listAccessRules(eventId).catch(() => []),
        listOfflineConflicts(eventId).catch(() => []),
        listPendingExceptions(eventId).catch(() => []),
        listTicketBlocks(eventId).catch(() => [])
      ]);

      if (sumData) setSummary(sumData);
      setDevices(devData);
      if (devData.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(devData[0].id);
      }
      setRules(rulesData);
      setConflicts(confData);
      setExceptions(excData);
      setBlocks(blkData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados de controle de acesso.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [eventId, selectedDeviceId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 12000); // 12s polling
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle Scan Validation
  const handleValidate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scanInput.trim()) return;

    setIsValidating(true);
    setError(null);

    try {
      const activeDevId = selectedDeviceId || (devices[0]?.id || 'dev_virtual');
      const result = await validateTicket(eventId, {
        tokenOrCode: scanInput.trim(),
        eventId,
        sessionId: summary?.sessionId || 'default',
        accessPointId: 'GATE-PRINCIPAL',
        deviceId: activeDevId,
        operatorId: currentUser?.id || 'sys_op',
        operatorName: currentUser?.name || 'Operador Central',
        movementType: selectedMovement,
        overrideJustification: selectedMovement === 'MANUAL_ENTRY' ? manualOverrideReason : undefined
      });

      setLastValidation(result);
      setValidationHistory(prev => [result, ...prev.slice(0, 20)]);
      setScanInput('');
      setManualOverrideReason('');

      // Refresh KPIs
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao processar leitura do ingresso.');
    } finally {
      setIsValidating(false);
    }
  };

  // Register Device Handler
  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;
    try {
      await registerAccessDevice(eventId, {
        name: newDeviceName.trim(),
        type: newDeviceType,
        allowedAccessPointIds: [],
        allowedSessionIds: []
      });
      setNewDeviceName('');
      setIsNewDeviceModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar dispositivo');
    }
  };

  // Create Rule Handler
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;
    try {
      await createAccessRule(eventId, {
        name: newRuleName.trim(),
        reentryPolicy: newReentryPolicy,
        maxReentries: newMaxReentries,
        active: true
      });
      setNewRuleName('');
      setIsNewRuleModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar regra de acesso');
    }
  };

  // Block Ticket Handler
  const handleBlockTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTicketId.trim() || !blockReason.trim()) return;
    try {
      await blockTicket(eventId, {
        ticketId: blockTicketId.trim(),
        ticketNumber: blockTicketNumber.trim() || blockTicketId.trim(),
        reason: blockReason.trim()
      });
      setBlockTicketId('');
      setBlockTicketNumber('');
      setBlockReason('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao bloquear ingresso');
    }
  };

  // Generate Offline Bundle Handler
  const handleGenerateOfflineBundle = async () => {
    try {
      setOfflineStatusMsg('Gerando pacote criptográfico...');
      const devId = selectedDeviceId || devices[0]?.id;
      if (!devId) {
        setOfflineStatusMsg('Nenhum dispositivo selecionado para o pacote.');
        return;
      }
      const bundle = await generateOfflineBundle(eventId, {
        sessionId: summary?.sessionId || 'default',
        accessPointId: 'GATE-PRINCIPAL',
        deviceId: devId
      });
      setOfflineStatusMsg(`Pacote gerado com sucesso! ${bundle.ticketsSummary.totalTickets} ingressos indexados.`);
    } catch (err: any) {
      setOfflineStatusMsg(`Erro: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                Check-in & Controle de Acesso
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Radio className="h-3 w-3 animate-pulse" /> Ao Vivo
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Evento: <strong className="text-slate-200">{eventName}</strong> — Validação centralizada e dispositivos
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          {onNavigate && (
            <button
              onClick={() => onNavigate('events-operation')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition"
            >
              <Radio className="h-4 w-4" />
              Central de Operação
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4 mb-8">
        {[
          { id: 'visao-geral', label: 'Visão Geral & Métricas', icon: Layers },
          { id: 'scanner', label: 'Scanner & Validação', icon: QrCode },
          { id: 'dispositivos', label: 'Coletores & Dispositivos', icon: Smartphone, badge: devices.length },
          { id: 'regras', label: 'Regras & Reentrada', icon: Sliders },
          { id: 'offline', label: 'Offline & Conflitos', icon: WifiOff, badge: conflicts.length > 0 ? conflicts.length : undefined },
          { id: 'bloqueios-excecoes', label: 'Bloqueios & Exceções', icon: ShieldAlert, badge: exceptions.length > 0 ? exceptions.length : undefined }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* TAB 1: VISÃO GERAL */}
      {activeTab === 'visao-geral' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-sm font-medium">
                <span>Taxa de Presença</span>
                <UserCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {summary ? `${summary.checkInPercentage}%` : '—'}
                </span>
                <span className="text-xs text-slate-500">
                  {summary ? `${summary.totalCheckedIn} de ${summary.totalTicketsSold}` : '0 emitidos'}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary ? summary.checkInPercentage : 0}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-sm font-medium">
                <span>Público no Local</span>
                <Users className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-cyan-300">
                  {summary ? summary.totalInsideVenue : 0}
                </span>
                <span className="text-xs text-slate-500">presentes agora</span>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Total saídas registradas: <strong className="text-slate-300">{summary?.totalExits || 0}</strong>
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-sm font-medium">
                <span>Validações Realizadas</span>
                <QrCode className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {summary ? summary.validationsTotal : 0}
                </span>
                <span className="text-xs text-emerald-400">
                  ✔ {summary ? summary.validationsAllowed : 0}
                </span>
                <span className="text-xs text-rose-400">
                  ✖ {summary ? summary.validationsDenied : 0}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                {summary && summary.validationsReview > 0
                  ? `${summary.validationsReview} sob revisão do supervisor`
                  : 'Nenhuma revisão pendente'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-sm font-medium">
                <span>Coletores Online</span>
                <Smartphone className="h-5 w-5 text-purple-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-purple-300">
                  {summary ? summary.devicesOnlineCount : 0}
                </span>
                <span className="text-xs text-slate-500">de {devices.length} cadastrados</span>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <Wifi className="h-3.5 w-3.5" /> Ativos
                </span>
                {summary && summary.conflictsCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-rose-400 font-semibold ml-auto">
                    <ShieldAlert className="h-3.5 w-3.5" /> {summary.conflictsCount} conflito(s)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Detailed breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Access Point */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-emerald-400" />
                Fluxo por Ponto de Acesso (Portões / Catracas)
              </h3>
              {summary && summary.byAccessPoint.length > 0 ? (
                <div className="space-y-3">
                  {summary.byAccessPoint.map(ap => (
                    <div key={ap.accessPointId} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-200">{ap.accessPointName}</div>
                        <div className="text-xs text-slate-500 font-mono">Código: {ap.code}</div>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="text-emerald-400">✔ {ap.totalAllowed} liberados</span>
                        <span className="text-rose-400">✖ {ap.totalDenied} negados</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Nenhuma validação registrada nos pontos de acesso até o momento.
                </div>
              )}
            </div>

            {/* By Ticket Type */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                <Layers className="h-4 w-4 text-cyan-400" />
                Entradas por Tipo de Ingresso
              </h3>
              {summary && summary.byTicketType.length > 0 ? (
                <div className="space-y-3">
                  {summary.byTicketType.map(tt => (
                    <div key={tt.ticketTypeId} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-medium text-slate-200">{tt.ticketTypeName}</span>
                        <span className="text-xs font-semibold text-cyan-400">
                          {tt.checkedIn}/{tt.sold} ({tt.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-500 h-full rounded-full transition-all"
                          style={{ width: `${tt.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Nenhum ingresso emitido para visualização de setores.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCANNER & VALIDAÇÃO AO VIVO */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Input and Decision Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center justify-between mb-4">
                <span>Leitor Oficial de Ingressos</span>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
                  Dispositivo: {devices.find(d => d.id === selectedDeviceId)?.name || 'Scanner Padrão'}
                </span>
              </h2>

              <form onSubmit={handleValidate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Modo de Movimento
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'ENTRY', label: 'Entrada / Reentrada', icon: UserCheck },
                      { id: 'EXIT', label: 'Registro de Saída', icon: ArrowRightLeft },
                      { id: 'MANUAL_ENTRY', label: 'Entrada Manual (Contingência)', icon: Sliders }
                    ].map(mode => {
                      const Icon = mode.icon;
                      const isSel = selectedMovement === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setSelectedMovement(mode.id as AccessMovementType)}
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                            isSel
                              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedMovement === 'MANUAL_ENTRY' && (
                  <div>
                    <label className="block text-xs font-medium text-amber-400 mb-1.5">
                      Justificativa Obrigatória para Entrada Manual
                    </label>
                    <input
                      type="text"
                      value={manualOverrideReason}
                      onChange={e => setManualOverrideReason(e.target.value)}
                      placeholder="Ex: Pulseira danificada, participante com RG autenticado"
                      className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Código de Barras, Token QR ou Código do Ingresso
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        autoFocus
                        value={scanInput}
                        onChange={e => setScanInput(e.target.value)}
                        placeholder="Aguardando bip do leitor óptico ou digitação..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-base font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 shadow-inner"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isValidating || !scanInput.trim()}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-emerald-900/30 shrink-0"
                    >
                      {isValidating ? 'Validando...' : 'Validar'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Live Feedback Card */}
            {lastValidation && (
              <div
                className={`p-6 rounded-2xl border-2 transition-all shadow-2xl ${
                  lastValidation.decision === 'ALLOW'
                    ? 'bg-emerald-950/30 border-emerald-500 text-emerald-100'
                    : lastValidation.decision === 'DENY'
                    ? 'bg-rose-950/30 border-rose-500 text-rose-100'
                    : 'bg-amber-950/30 border-amber-500 text-amber-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {lastValidation.decision === 'ALLOW' ? (
                      <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                    ) : lastValidation.decision === 'DENY' ? (
                      <XCircle className="h-10 w-10 text-rose-400" />
                    ) : (
                      <AlertTriangle className="h-10 w-10 text-amber-400" />
                    )}
                    <div>
                      <div className="text-2xl font-black tracking-tight">
                        {lastValidation.decision === 'ALLOW'
                          ? 'ACESSO LIBERADO'
                          : lastValidation.decision === 'DENY'
                          ? 'ACESSO RECUSADO'
                          : 'REVISÃO NECESSÁRIA'}
                      </div>
                      <div className="text-sm font-semibold opacity-90">
                        {lastValidation.reasonCode}: {lastValidation.message}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono opacity-60 bg-black/30 px-2.5 py-1 rounded">
                    {new Date(lastValidation.timestamp).toLocaleTimeString('pt-BR')}
                  </span>
                </div>

                {lastValidation.ticket && (
                  <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="block text-slate-400 font-medium">Ingresso</span>
                      <span className="text-sm font-bold text-white font-mono">{lastValidation.ticket.ticketNumber}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium">Tipo / Lote</span>
                      <span className="text-sm font-semibold text-slate-200">{lastValidation.ticket.ticketType}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium">Participante</span>
                      <span className="text-sm font-semibold text-slate-200">{lastValidation.ticket.attendeeName || 'Anônimo'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium">Entradas Registradas</span>
                      <span className="text-sm font-bold text-white">
                        {lastValidation.entriesCount} / {lastValidation.maxEntriesAllowed}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Recent Validation Stream */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[520px]">
            <h3 className="text-sm font-bold text-white flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span>Histórico Recente de Leituras</span>
              <span className="text-xs text-slate-500">{validationHistory.length} lidos</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {validationHistory.length > 0 ? (
                validationHistory.map((val, idx) => (
                  <div
                    key={val.id || idx}
                    className={`p-3 rounded-xl border text-xs transition ${
                      val.decision === 'ALLOW'
                        ? 'bg-emerald-950/20 border-emerald-900/40 text-slate-200'
                        : val.decision === 'DENY'
                        ? 'bg-rose-950/20 border-rose-900/40 text-slate-200'
                        : 'bg-amber-950/20 border-amber-900/40 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        {val.decision === 'ALLOW' ? (
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        ) : val.decision === 'DENY' ? (
                          <span className="h-2 w-2 rounded-full bg-rose-400" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                        )}
                        {val.ticket?.ticketNumber || 'Ingresso'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(val.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 truncate">
                      {val.reasonCode} — {val.message}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-center text-slate-600 text-xs">
                  Aguardando leituras de ingressos para exibir o fluxo em tempo real.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISPOSITIVOS & SCANNERS */}
      {activeTab === 'dispositivos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Coletores & Dispositivos de Acesso</h2>
              <p className="text-xs text-slate-400">
                Gerencie coletores físicos, catracas eletrônicas e celulares autorizados para leitura.
              </p>
            </div>
            <button
              onClick={() => setIsNewDeviceModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition"
            >
              Novo Coletor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map(dev => (
              <div
                key={dev.id}
                className={`p-5 rounded-2xl border transition shadow-lg ${
                  dev.status === 'ACTIVE'
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-rose-950/10 border-rose-900/40 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${
                      dev.status === 'ACTIVE'
                        ? 'bg-slate-800 text-emerald-400 border-slate-700'
                        : 'bg-rose-950/40 text-rose-400 border-rose-800'
                    }`}>
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{dev.name}</h4>
                      <p className="text-xs font-mono text-slate-400">{dev.deviceCode}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    dev.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {dev.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <BatteryCharging className="h-3.5 w-3.5 text-slate-500" />
                    Bateria: <strong className="text-slate-200">{dev.batteryLevel !== undefined ? `${dev.batteryLevel}%` : '—'}</strong>
                  </div>
                  <div>
                    App: <strong className="text-slate-200">{dev.appVersion || '1.0.0'}</strong>
                  </div>
                  <div className="col-span-2 text-[11px] text-slate-500">
                    Último sinal: {dev.lastHeartbeatAt ? new Date(dev.lastHeartbeatAt).toLocaleTimeString('pt-BR') : 'Sem sinal'}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  {dev.status === 'ACTIVE' ? (
                    <button
                      onClick={() => {
                        const reason = prompt('Informe o motivo da revogação do dispositivo:');
                        if (reason) revokeAccessDevice(eventId, dev.id, reason).then(loadData);
                      }}
                      className="w-full py-2 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 text-xs font-semibold border border-rose-600/30 transition"
                    >
                      Revogar Acesso Imediatamente
                    </button>
                  ) : (
                    <button
                      onClick={() => authorizeAccessDevice(eventId, dev.id).then(loadData)}
                      className="w-full py-2 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-xs font-semibold border border-emerald-600/30 transition"
                    >
                      Autorizar Dispositivo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Modal Novo Coletor */}
          {isNewDeviceModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-4">Cadastrar Novo Coletor / Scanner</h3>
                <form onSubmit={handleRegisterDevice} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Dispositivo</label>
                    <input
                      type="text"
                      required
                      value={newDeviceName}
                      onChange={e => setNewDeviceName(e.target.value)}
                      placeholder="Ex: Scanner Portão B-02"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Hardware</label>
                    <select
                      value={newDeviceType}
                      onChange={e => setNewDeviceType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    >
                      <option value="DEDICATED_SCANNER">Leitor Óptico Dedicado (Zebra / Honeywell)</option>
                      <option value="MOBILE_APP">Smartphone Android / iOS (PWA Scanner)</option>
                      <option value="TURNSTILE">Catraca Eletrônica / Totem de Autoatendimento</option>
                      <option value="DESKTOP_POS">Terminal de Portaria Desktop</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsNewDeviceModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REGRAS & REENTRADA */}
      {activeTab === 'regras' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Regras de Acesso e Políticas de Reentrada</h2>
              <p className="text-xs text-slate-400">
                Configure portões autorizados por setor e controle rígido sobre reentradas no local do evento.
              </p>
            </div>
            <button
              onClick={() => setIsNewRuleModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition"
            >
              Nova Regra
            </button>
          </div>

          <div className="space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    {rule.name}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">
                      {rule.reentryPolicy}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Janela de abertura: {rule.windowStartsBeforeMinutes} min antes / Fechamento: {rule.windowEndsAfterMinutes} min após início.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg">
                    Reentradas permitidas: {rule.maxReentries}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Nova Regra */}
          {isNewRuleModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-4">Criar Regra de Acesso</h3>
                <form onSubmit={handleCreateRule} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Regra</label>
                    <input
                      type="text"
                      required
                      value={newRuleName}
                      onChange={e => setNewRuleName(e.target.value)}
                      placeholder="Ex: Acesso VIP Reentrada Livre"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Política de Reentrada</label>
                    <select
                      value={newReentryPolicy}
                      onChange={e => setNewReentryPolicy(e.target.value as ReentryPolicyType)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    >
                      <option value="NO_REENTRY">Sem Reentrada (Entrada única obrigatória)</option>
                      <option value="REENTRY_ALLOWED">Reentrada Permitida</option>
                      <option value="REENTRY_AFTER_EXIT">Reentrada Apenas Após Registro de Saída</option>
                      <option value="LIMITED_REENTRY">Reentrada Limitada por Contagem</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Limite Máximo de Reentradas</label>
                    <input
                      type="number"
                      min={0}
                      value={newMaxReentries}
                      onChange={e => setNewMaxReentries(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsNewRuleModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition"
                    >
                      Salvar Regra
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: OFFLINE & CONFLITOS */}
      {activeTab === 'offline' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <WifiOff className="h-5 w-5 text-amber-400" />
                Operação em Contingência Offline
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Permite exportar um pacote de validação com hashes criptográficos para leitores portáteis sem sinal de internet.
                Ao reconectar, a conciliação automática detectará ingressos legítimos e conflitos duplicados.
              </p>
            </div>
            <button
              onClick={handleGenerateOfflineBundle}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition shrink-0"
            >
              <Download className="h-4 w-4" />
              Gerar Pacote Offline
            </button>
          </div>

          {offlineStatusMsg && (
            <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 text-xs font-mono">
              {offlineStatusMsg}
            </div>
          )}

          {/* Conflicts Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
              Conflitos de Sincronização Detectados ({conflicts.length})
            </h3>

            {conflicts.length > 0 ? (
              <div className="space-y-3">
                {conflicts.map(cnf => (
                  <div key={cnf.id} className="p-4 rounded-xl bg-slate-950/80 border border-rose-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {cnf.conflictType}
                        </span>
                        <span className="text-sm font-mono font-bold text-white">{cnf.ticketNumber}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">{cnf.resolutionNotes}</p>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Leitura Offline: {new Date(cnf.offlineMovementAt).toLocaleTimeString('pt-BR')} | 
                        Leitura Online: {cnf.serverMovementAt ? new Date(cnf.serverMovementAt).toLocaleTimeString('pt-BR') : '—'}
                      </div>
                    </div>
                    {!cnf.resolved ? (
                      <button
                        onClick={() => {
                          const notes = prompt('Descreva o parecer de resolução deste conflito:');
                          if (notes) resolveOfflineConflict(eventId, cnf.id, notes).then(loadData);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shrink-0"
                      >
                        Resolver Conflito
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-400">✔ Resolvido</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                Nenhum conflito de sincronização offline pendente.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: BLOQUEIOS & EXCEÇÕES */}
      {activeTab === 'bloqueios-excecoes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bloqueios */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-rose-400" />
              Bloqueio Administrativo de Ingressos
            </h3>

            <form onSubmit={handleBlockTicket} className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={blockTicketId}
                  onChange={e => setBlockTicketId(e.target.value)}
                  placeholder="ID do Ingresso"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  value={blockTicketNumber}
                  onChange={e => setBlockTicketNumber(e.target.value)}
                  placeholder="Número / Código"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              <input
                type="text"
                required
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                placeholder="Motivo (ex: Fraude, estorno, furto)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
              >
                Bloquear Acesso do Ingresso
              </button>
            </form>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {blocks.map(b => (
                <div key={b.id} className="p-3 rounded-xl bg-slate-950/70 border border-rose-900/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white font-mono">{b.ticketNumber}</span>
                    <p className="text-slate-400 text-[11px]">{b.reason}</p>
                  </div>
                  <button
                    onClick={() => {
                      const reason = prompt('Motivo do desbloqueio:');
                      if (reason) unblockTicket(eventId, b.ticketId, reason).then(loadData);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold"
                    title="Desbloquear Ingresso"
                  >
                    <Unlock className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {blocks.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs">Nenhum ingresso bloqueado.</div>
              )}
            </div>
          </div>

          {/* Exceções */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              Solicitações de Exceção para Supervisor
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {exceptions.map(exc => (
                <div key={exc.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Operador: {exc.operatorName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(exc.createdAt).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-slate-300">{exc.reason}</p>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => reviewException(eventId, exc.id, 'APPROVED').then(loadData)}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                    >
                      Aprovar Exceção
                    </button>
                    <button
                      onClick={() => reviewException(eventId, exc.id, 'REJECTED').then(loadData)}
                      className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition"
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
              {exceptions.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Nenhuma exceção aguardando parecer do supervisor.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
