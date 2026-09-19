import React, { useState } from 'react';
import { FeatureFlagItem } from './configuration.types';
import {
  ToggleLeft,
  ToggleRight,
  Radio,
  AlertOctagon,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Users,
  Building,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Lock,
  Search
} from 'lucide-react';

interface FeatureFlagsViewProps {
  featureFlags: FeatureFlagItem[];
  onTriggerKillSwitch: (key: string, reason: string) => Promise<void>;
  onResetKillSwitch: (key: string, reason: string) => Promise<void>;
  onToggleFlag?: (key: string, isEnabled: boolean) => Promise<void>;
  isSuperAdmin: boolean;
}

export const FeatureFlagsView: React.FC<FeatureFlagsViewProps> = ({
  featureFlags,
  onTriggerKillSwitch,
  onResetKillSwitch,
  onToggleFlag,
  isSuperAdmin
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [killSwitchModalKey, setKillSwitchModalKey] = useState<string | null>(null);
  const [killSwitchAction, setKillSwitchAction] = useState<'TRIGGER' | 'RESET'>('TRIGGER');
  const [justification, setJustification] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const killSwitches = featureFlags.filter(f => f.isKillSwitch);
  const standardFlags = featureFlags.filter(f => !f.isKillSwitch);

  const filteredFlags = standardFlags.filter(f =>
    f.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenKillSwitchModal = (key: string, action: 'TRIGGER' | 'RESET') => {
    setKillSwitchModalKey(key);
    setKillSwitchAction(action);
    setJustification('');
  };

  const handleConfirmKillSwitchAction = async () => {
    if (!killSwitchModalKey || !justification.trim()) return;
    setIsProcessing(true);
    try {
      if (killSwitchAction === 'TRIGGER') {
        await onTriggerKillSwitch(killSwitchModalKey, justification.trim());
      } else {
        await onResetKillSwitch(killSwitchModalKey, justification.trim());
      }
      setKillSwitchModalKey(null);
      setJustification('');
    } catch (err: any) {
      alert(err.message || 'Erro ao processar ação de Kill Switch.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Emergency Kill Switch Command Center */}
      <div className="bg-slate-900/80 border border-rose-500/40 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-400">
            <AlertOctagon className="h-5 w-5 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-rose-300">
              Painel de Emergência: Kill Switches Operacionais
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Ação Imediata & Auditoria Rigorosa
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Kill switches suspendem instantaneamente operações automatizadas sensíveis em caso de falha externa, suspeita de fraude ou anomalias financeiras. O acionamento emite evento de domínio em tempo real.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {killSwitches.map(ks => {
            const isTriggered = ks.isEnabled;
            return (
              <div
                key={ks.key}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                  isTriggered
                    ? 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/20'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-200">{ks.key}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        isTriggered
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-slate-800 text-emerald-400 border border-slate-700'
                      }`}
                    >
                      {isTriggered ? 'ACIONADO (BLOQUEANDO)' : 'DESARMADO (NORMAL)'}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100">{ks.name}</h3>
                  {ks.description && <p className="text-xs text-slate-400">{ks.description}</p>}

                  {isTriggered && ks.killSwitchReason && (
                    <div className="p-2.5 rounded bg-rose-900/30 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                      <div><strong>Motivo:</strong> {ks.killSwitchReason}</div>
                      {ks.killSwitchTriggeredAt && (
                        <div className="text-[10px] opacity-80">
                          Acionado em: {new Date(ks.killSwitchTriggeredAt).toLocaleString('pt-BR')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  {isTriggered ? (
                    <button
                      onClick={() => handleOpenKillSwitchModal(ks.key, 'RESET')}
                      disabled={!isSuperAdmin}
                      className="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Redefinir / Desarmar Kill Switch
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenKillSwitchModal(ks.key, 'TRIGGER')}
                      disabled={!isSuperAdmin}
                      className="px-3 py-1.5 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <AlertOctagon className="h-3.5 w-3.5" />
                      Acionar Kill Switch de Emergência
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Flags Standard Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar Feature Flags..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-md pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Radio className="h-4 w-4 text-purple-400" />
            <span>{filteredFlags.length} flags registradas</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFlags.map(flag => {
            let producers: string[] = [];
            let roles: string[] = [];
            try {
              producers = typeof flag.allowedProducers === 'string' ? JSON.parse(flag.allowedProducers) : (flag.allowedProducers || []);
            } catch {}
            try {
              roles = typeof flag.allowedRoles === 'string' ? JSON.parse(flag.allowedRoles) : (flag.allowedRoles || []);
            } catch {}

            return (
              <div
                key={flag.key}
                className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                      {flag.key}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        flag.isEnabled
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {flag.isEnabled ? 'HABILITADA' : 'DESABILITADA'}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100">{flag.name}</h3>
                  {flag.description && <p className="text-xs text-slate-400">{flag.description}</p>}

                  {/* Rollout Percentage Bar */}
                  <div className="space-y-1 pt-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Rollout Progressivo</span>
                      <strong className="text-purple-300 font-mono">{flag.rolloutPercentage}%</strong>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${flag.rolloutPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Whitelists & Metadata */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2 flex-wrap">
                    {producers.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] border border-blue-500/20">
                        Produtores: {producers.join(', ')}
                      </span>
                    )}
                    {roles.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] border border-amber-500/20">
                        Perfis: {roles.join(', ')}
                      </span>
                    )}
                    {producers.length === 0 && roles.length === 0 && (
                      <span className="text-[11px] text-slate-500">Público Geral</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kill Switch Prompt Modal */}
      {killSwitchModalKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-2xl">
            <div className={`flex items-center gap-2 ${killSwitchAction === 'TRIGGER' ? 'text-rose-400' : 'text-emerald-400'}`}>
              <AlertOctagon className="h-5 w-5" />
              <h3 className="text-sm font-bold">
                {killSwitchAction === 'TRIGGER' ? 'Confirmar Acionamento de Kill Switch' : 'Confirmar Redefinição de Kill Switch'}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {killSwitchAction === 'TRIGGER'
                ? `Você está acionando o interruptor de emergência "${killSwitchModalKey}". A operação será imediatamente bloqueada para toda a plataforma.`
                : `Você está desarmando o interruptor de emergência "${killSwitchModalKey}". As operações normais serão restabelecidas.`}
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Motivo / Justificativa Técnica (Obrigatório para Auditoria) *
              </label>
              <textarea
                rows={3}
                value={justification}
                onChange={e => setJustification(e.target.value)}
                placeholder="Informe detalhadamente a razão técnica ou operacional..."
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setKillSwitchModalKey(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isProcessing || !justification.trim()}
                onClick={handleConfirmKillSwitchAction}
                className={`px-3 py-1.5 text-xs font-medium rounded-md text-white disabled:opacity-50 flex items-center gap-1.5 ${
                  killSwitchAction === 'TRIGGER' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {isProcessing ? 'Processando...' : killSwitchAction === 'TRIGGER' ? 'Confirmar Bloqueio Imediato' : 'Confirmar Restauração'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
