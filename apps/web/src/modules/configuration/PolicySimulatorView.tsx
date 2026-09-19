import React, { useState } from 'react';
import { PolicySimulateInput, PolicySimulateResult, PolicySimulateTraceStep } from './configuration.types';
import {
  Play,
  Shield,
  Clock,
  Layers,
  Sparkles,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  Code2
} from 'lucide-react';

interface PolicySimulatorViewProps {
  onSimulate: (input: PolicySimulateInput) => Promise<PolicySimulateResult>;
}

export const PolicySimulatorView: React.FC<PolicySimulatorViewProps> = ({ onSimulate }) => {
  const [domain, setDomain] = useState('FINANCE');
  const [operation, setOperation] = useState('TRANSFER_REQUEST');
  const [producerId, setProducerId] = useState('prd_100');
  const [eventId, setEventId] = useState('evt_1001');
  const [inputJson, setInputJson] = useState('{\n  "amount": 75000,\n  "category": "VIP",\n  "paymentMethod": "PIX"\n}');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<PolicySimulateResult | null>(null);

  const applyTemplate = (type: string) => {
    switch (type) {
      case 'TRANSFER_HIGH':
        setDomain('FINANCE');
        setOperation('TRANSFER_REQUEST');
        setProducerId('prd_100');
        setEventId('evt_1001');
        setInputJson('{\n  "amount": 120000,\n  "channel": "WEB",\n  "urgency": "HIGH"\n}');
        break;
      case 'REFUND_TICKET':
        setDomain('REFUNDS');
        setOperation('REFUND_REQUEST');
        setProducerId('prd_100');
        setEventId('evt_1001');
        setInputJson('{\n  "amount": 450,\n  "daysSincePurchase": 4,\n  "isCustomerVip": true\n}');
        break;
      case 'SAC_VIP':
        setDomain('SAC');
        setOperation('SAC_TICKET');
        setProducerId('prd_100');
        setEventId('');
        setInputJson('{\n  "customerTier": "VIP",\n  "channel": "CHAT",\n  "subject": "Reclamação de Entrada"\n}');
        break;
    }
  };

  const handleExecuteSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    let parsedInput: any = {};
    try {
      parsedInput = JSON.parse(inputJson);
    } catch {
      alert('Formato JSON inválido. Verifique a sintaxe.');
      return;
    }

    setIsSimulating(true);
    try {
      const res = await onSimulate({
        domain,
        operation,
        producerId: producerId.trim() || undefined,
        eventId: eventId.trim() || undefined,
        input: parsedInput
      });
      setResult(res);
    } catch (err: any) {
      alert(err.message || 'Erro ao executar simulação.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Introduction Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Simulador Central de Políticas & Regras (Dry-Run)
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Avalie o comportamento das políticas em tempo real sem alterar dados de produção.
            O simulador executa a árvore hierárquica completa (<strong>Evento &gt; Produtor &gt; Global &gt; Padrão</strong>) e exibe o rastreio de decisão passo a passo.
          </p>
        </div>

        {/* Quick Templates */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Modelos:</span>
          <button
            type="button"
            onClick={() => applyTemplate('TRANSFER_HIGH')}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 text-purple-300 hover:bg-purple-900/40 border border-purple-500/30 transition-colors"
          >
            Transferência &gt; 50k
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('REFUND_TICKET')}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 text-blue-300 hover:bg-blue-900/40 border border-blue-500/30 transition-colors"
          >
            Estorno Padrão
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('SAC_VIP')}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 text-emerald-300 hover:bg-emerald-900/40 border border-emerald-500/30 transition-colors"
          >
            SAC VIP
          </button>
        </div>
      </div>

      {/* Simulator Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 5 cols */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Code2 className="h-4 w-4 text-purple-400" />
            Parâmetros de Entrada da Operação
          </h3>

          <form onSubmit={handleExecuteSimulation} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Domínio *</label>
                <select
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="FINANCE">FINANCE (Financeiro)</option>
                  <option value="REFUNDS">REFUNDS (Estornos)</option>
                  <option value="SAC">SAC (Atendimento)</option>
                  <option value="SECURITY">SECURITY (Segurança)</option>
                  <option value="TASKS">TASKS (Tarefas)</option>
                  <option value="DOCUMENTS">DOCUMENTS (Documentos)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Operação *</label>
                <input
                  type="text"
                  value={operation}
                  onChange={e => setOperation(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Produtor (Opcional)</label>
                <input
                  type="text"
                  placeholder="ex: prd_100"
                  value={producerId}
                  onChange={e => setProducerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Evento (Opcional)</label>
                <input
                  type="text"
                  placeholder="ex: evt_1001"
                  value={eventId}
                  onChange={e => setEventId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Payload / Dados da Operação (JSON) *
              </label>
              <textarea
                rows={7}
                value={inputJson}
                onChange={e => setInputJson(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-md p-3 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500 scrollbar-thin"
              />
            </div>

            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-2 px-4 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-white" />
              {isSimulating ? 'Simulando Resolução...' : 'Executar Simulação de Regra'}
            </button>
          </form>
        </div>

        {/* Right Result: 7 cols */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Resultado da Avaliação & Rastreabilidade
          </h3>

          {!result ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-950/40 rounded-lg border border-dashed border-slate-800 text-slate-500 space-y-2">
              <Play className="h-8 w-8 text-slate-600" />
              <p className="text-xs">Preencha os parâmetros à esquerda e execute a simulação para visualizar o diagnóstico de regras.</p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Decision Banner */}
              <div
                className={`p-4 rounded-lg border flex items-start gap-3 ${
                  result.decision
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {result.decision ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold">
                    {result.decision ? 'Operação Autorizada pelas Regras' : 'Operação Bloqueada / Restrita'}
                  </h4>
                  <p className="text-xs opacity-90">{result.explanation}</p>
                </div>
              </div>

              {/* Requirements Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Aprovações</span>
                  <div className="text-lg font-bold text-purple-300">
                    {result.requirements?.approvalsRequired || 1}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Step-Up 2FA</span>
                  <div className={`text-xs font-bold mt-1.5 ${result.requirements?.stepUpRequired ? 'text-amber-400' : 'text-slate-400'}`}>
                    {result.requirements?.stepUpRequired ? 'Obrigatório' : 'Dispensado'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">SLA Definido</span>
                  <div className="text-xs font-bold mt-1.5 text-indigo-300">
                    {result.requirements?.slaMinutes ? `${result.requirements.slaMinutes} min` : 'Padrão'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Origem Escopo</span>
                  <div className="text-xs font-bold mt-1.5 text-cyan-300">
                    {result.scope}
                  </div>
                </div>
              </div>

              {/* Matched Policy & Rule Details */}
              {result.effectivePolicy && (
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-500">Política Efetiva:</span>
                    <div className="font-semibold text-purple-300">
                      {result.effectivePolicy.code} - {result.effectivePolicy.name} (v{result.effectivePolicy.version})
                    </div>
                  </div>
                  {result.effectivePolicy.ruleName && (
                    <div className="text-right space-y-0.5">
                      <span className="text-[11px] text-slate-500">Regra Aplicada:</span>
                      <div className="font-semibold text-emerald-400">
                        {result.effectivePolicy.ruleName}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Trace Chain View */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-purple-400" />
                  Rastreamento Passo a Passo da Hierarquia (Trace Chain)
                </div>

                <div className="space-y-2">
                  {result.trace?.map((step: PolicySimulateTraceStep, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                        step.policyFound && step.ruleMatched
                          ? 'bg-purple-950/20 border-purple-500/40 text-purple-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {step.level}
                          </span>
                          <span className="font-medium text-slate-200">{step.targetName || '-'}</span>
                          {step.policyCode && (
                            <span className="font-mono text-purple-300 font-semibold">{step.policyCode}</span>
                          )}
                        </div>
                        <p className="text-[11px] opacity-90">{step.notes}</p>
                      </div>

                      <div className="shrink-0">
                        {step.ruleMatched ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                            Regra: {step.ruleMatched}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 text-[10px]">
                            Sem disparo
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
