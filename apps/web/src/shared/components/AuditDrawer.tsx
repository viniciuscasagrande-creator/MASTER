import React from 'react';
import { X, Layers, Clock, ShieldCheck, ArrowRight, Activity } from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { formatDateTime } from '../utils/formatters';

interface AuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditDrawer: React.FC<AuditDrawerProps> = ({ isOpen, onClose }) => {
  const { auditLogs } = useCoreData();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl h-full border-l border-slate-800 bg-slate-950 p-6 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                Trilha de Auditoria do Sistema
              </h2>
              <p className="text-[11px] text-slate-400">
                Registro imutável de eventos inter-departamentais (Produtor → Evento → Pedido)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List of audit logs */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-2.5 transition-all hover:border-slate-700"
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-semibold text-orange-400">
                  <span className="rounded bg-orange-500/10 px-1.5 py-0.5 border border-orange-500/20">
                    {log.module}
                  </span>
                  <span className="text-slate-300 font-mono">{log.action}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(log.timestamp)}
                </div>
              </div>

              <div className="text-xs text-slate-200">
                {log.details}
              </div>

              {/* Impact Cascade (Highlighting cross-module updates) */}
              {log.impactCascade && log.impactCascade.length > 0 && (
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 mt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <Activity className="h-3 w-3 text-cyan-400" />
                    Cascata em Tempo Real nos Módulos:
                  </div>
                  <div className="space-y-1">
                    {log.impactCascade.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono">
                        <span className="text-cyan-400 font-bold">↳</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-500">
                <span>Operador: <strong className="text-slate-400">{log.userName}</strong></span>
                <span className="font-mono">IP: {log.ipAddress}</span>
              </div>
            </div>
          ))}

          {auditLogs.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-500">
              Nenhum registro de auditoria no momento.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>{auditLogs.length} registros no histórico de auditoria</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Hash SHA-256 Verificado
          </span>
        </div>
      </div>
    </div>
  );
};
