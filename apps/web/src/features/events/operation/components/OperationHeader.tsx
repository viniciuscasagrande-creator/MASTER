import React from 'react';
import {
  Radio,
  Play,
  Square,
  AlertTriangle,
  RefreshCw,
  Maximize2,
  Minimize2,
  Send,
  ArrowRightLeft,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { EventOperationSessionDTO, OperationStatus } from '@shared/types/index';

interface OperationHeaderProps {
  operation: EventOperationSessionDTO;
  sessions: Array<{ id: string; name: string; startDate?: string }>;
  selectedSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onStartOperation: () => void;
  onStartClosing: () => void;
  onCloseOperation: () => void;
  onOpenBroadcastModal: () => void;
  onOpenHandoffModal: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  canManageOperation: boolean;
}

export const OperationHeader: React.FC<OperationHeaderProps> = ({
  operation,
  sessions,
  selectedSessionId,
  onSelectSession,
  onStartOperation,
  onStartClosing,
  onCloseOperation,
  onOpenBroadcastModal,
  onOpenHandoffModal,
  onRefresh,
  isLoading,
  isFullscreen,
  onToggleFullscreen,
  canManageOperation
}) => {
  const getStatusBadge = (status: OperationStatus) => {
    switch (status) {
      case 'PREPARATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            EM PREPARAÇÃO
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PRONTO PARA ABERTURA
          </span>
        );
      case 'OPENING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            ABRINDO PORTÕES
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            OPERAÇÃO AO VIVO
          </span>
        );
      case 'CLOSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            ENCERRAMENTO EM ANDAMENTO
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            OPERAÇÃO ENCERRADA
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Section: Title, Status, Session Selector */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400" />
                Central de Operação
              </h1>
              {getStatusBadge(operation.status)}
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-800 text-slate-400 text-xs font-mono">
                <span>Seq:</span>
                <span className="text-white font-bold">{operation.sequence}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Comando operacional em tempo real • Sessão: <span className="text-slate-200 font-medium">{operation.sessionName || 'Principal'}</span>
            </p>
          </div>

          {/* Session Switcher */}
          {sessions.length > 1 && (
            <div className="relative">
              <select
                value={selectedSessionId}
                onChange={(e) => onSelectSession(e.target.value)}
                className="appearance-none bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-1.5 pl-3 pr-8 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.startDate ? `(${new Date(s.startDate).toLocaleDateString('pt-BR')})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Right Section: Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Internal Communication & Handoff */}
          <button
            onClick={onOpenBroadcastModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            title="Enviar comunicado interno à equipe operacional"
          >
            <Send className="w-3.5 h-3.5 text-blue-400" />
            <span>Comunicado</span>
          </button>

          <button
            onClick={onOpenHandoffModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            title="Registrar passagem formal de turno entre líderes"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
            <span>Passagem de Turno</span>
          </button>

          {/* Operational Lifecycle Buttons */}
          {canManageOperation && (
            <>
              {(operation.status === 'PREPARATION' || operation.status === 'READY') && (
                <button
                  onClick={onStartOperation}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Abrir Operação</span>
                </button>
              )}

              {operation.status === 'ACTIVE' && (
                <button
                  onClick={onStartClosing}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-lg shadow-orange-900/30 transition active:scale-95"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Iniciar Encerramento</span>
                </button>
              )}

              {operation.status === 'CLOSING' && (
                <button
                  onClick={onCloseOperation}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-900/30 transition active:scale-95"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Encerrar Operação</span>
                </button>
              )}
            </>
          )}

          {/* Refresh & Fullscreen Controls */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-50"
            title="Atualizar snapshot"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title={isFullscreen ? 'Sair do Modo Sala de Controle' : 'Entrar no Modo Sala de Controle (Fullscreen)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>
    </div>
  );
};
