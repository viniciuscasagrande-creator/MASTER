import React from 'react';
import { Camera, Lock, Calendar, Download, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { ReportSnapshot } from '@shared/types/index';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';

interface SnapshotsTabProps {
  snapshots: ReportSnapshot[];
  onViewSnapshot: (snapshot: ReportSnapshot) => void;
  onExportSnapshot: (snapshot: ReportSnapshot) => void;
}

export const SnapshotsTab: React.FC<SnapshotsTabProps> = ({
  snapshots,
  onViewSnapshot,
  onExportSnapshot
}) => {
  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-white">Fechamentos Históricos Congelados (Snapshots)</h3>
          <p className="text-xs text-slate-400">
            Registros imutáveis de fechamento mensal, fiscal e prestação de contas
          </p>
        </div>
      </div>

      {/* Immutability Callout */}
      <div className="flex items-start gap-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-xs text-cyan-200">
        <Lock className="h-5 w-5 shrink-0 text-cyan-400" />
        <div>
          <strong className="text-white">Foto Estática Imutável:</strong> Diferente de relatórios em tempo real cujos dados mudam conforme novas vendas e estornos acontecem, os snapshots congelam os números exatamente no momento da auditoria, permitindo auditorias independentes e conciliações contábeis seguras.
        </div>
      </div>

      {/* Snapshots Grid */}
      {snapshots.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 text-center">
          <Camera className="h-10 w-10 text-slate-600" />
          <h3 className="mt-3 text-sm font-semibold text-slate-300">Nenhum snapshot congelado</h3>
          <p className="mt-1 text-xs text-slate-500">
            Você pode criar snapshots a qualquer momento através dos seus relatórios salvos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {snapshots.map((snap) => (
            <div
              key={snap.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg transition hover:border-slate-700"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-xs font-bold text-cyan-400">
                      SNAPSHOT
                    </span>
                    <Badge variant="neutral" size="sm">
                      Imutável
                    </Badge>
                  </div>
                  <span className="font-mono text-xs text-slate-400">
                    {new Date(snap.snapshotDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-white">{snap.title}</h3>

                {snap.notes && (
                  <p className="mt-2 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300 italic">
                    "{snap.notes}"
                  </p>
                )}

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="h-4 w-4 text-orange-400" />
                  <span>
                    Gravado em <strong>{new Date(snap.createdAt).toLocaleString('pt-BR')}</strong> por{' '}
                    <strong className="text-slate-200">{snap.creatorUserName}</strong>
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3">
                <span className="font-mono text-[10px] text-slate-500">{snap.id}</span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewSnapshot(snap)}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5 text-cyan-400" />
                    Examinar Dados
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onExportSnapshot(snap)}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Exportar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
