import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2
} from 'lucide-react';
import { ReportExportJob } from '@shared/types/index';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';

interface ExportsCenterTabProps {
  exports: ReportExportJob[];
  isLoading: boolean;
  onRefresh: () => void;
  onDownload: (jobId: string) => void;
}

export const ExportsCenterTab: React.FC<ExportsCenterTabProps> = ({
  exports,
  isLoading,
  onRefresh,
  onDownload
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredExports = exports.filter((exp) =>
    exp.reportTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por título ou operador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Security Watermark Callout */}
      <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
        <div>
          <strong className="text-white">Exportação Auditada e Rastreada:</strong> Todos os arquivos gerados (CSV com UTF-8 BOM, planilhas XLSX e PDFs) recebem carimbo e metadados de auditoria vinculando o operador, data, hora e código do lote. Os arquivos expiram automaticamente em 7 dias por política de retenção da LGPD.
        </div>
      </div>

      {/* Exports Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
              <th className="px-5 py-3.5 font-semibold uppercase tracking-wider">Arquivo / Relatório</th>
              <th className="px-4 py-3.5 font-semibold uppercase tracking-wider">Formato</th>
              <th className="px-4 py-3.5 font-semibold uppercase tracking-wider">Registros</th>
              <th className="px-4 py-3.5 font-semibold uppercase tracking-wider">Tamanho</th>
              <th className="px-4 py-3.5 font-semibold uppercase tracking-wider">Solicitado Por</th>
              <th className="px-4 py-3.5 font-semibold uppercase tracking-wider">Expiração</th>
              <th className="px-4 py-3.5 font-semibold uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5 text-right font-semibold uppercase tracking-wider">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredExports.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  Nenhuma exportação recente encontrada.
                </td>
              </tr>
            ) : (
              filteredExports.map((job) => {
                const isExpired = new Date(job.expiresAt) < new Date();

                return (
                  <tr key={job.id} className="transition hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{job.reportTitle}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-slate-500">{job.id}</div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="flex items-center gap-1.5 font-medium">
                        {job.format === 'CSV' && <Download className="h-3.5 w-3.5 text-blue-400" />}
                        {job.format === 'XLSX' && <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />}
                        {job.format === 'PDF' && <FileText className="h-3.5 w-3.5 text-rose-400" />}
                        <span className="text-slate-200">{job.format}</span>
                      </span>
                    </td>

                    <td className="px-4 py-4 font-mono text-slate-300">
                      {job.recordCount.toLocaleString('pt-BR')} linhas
                    </td>

                    <td className="px-4 py-4 font-mono text-slate-300">
                      {formatFileSize(job.fileSizeBytes)}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      <div>{job.userName}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(job.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`text-xs ${isExpired ? 'text-rose-400 font-semibold' : 'text-slate-400'}`}>
                        {new Date(job.expiresAt).toLocaleDateString('pt-BR')}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {job.status === 'COMPLETED' && (
                        <Badge variant="success" size="sm">
                          Pronto
                        </Badge>
                      )}
                      {job.status === 'PENDING' && (
                        <Badge variant="warning" size="sm">
                          Pendente
                        </Badge>
                      )}
                      {job.status === 'PROCESSING' && (
                        <Badge variant="info" size="sm">
                          Processando
                        </Badge>
                      )}
                      {job.status === 'FAILED' && (
                        <Badge variant="danger" size="sm">
                          Falhou
                        </Badge>
                      )}
                      {isExpired && (
                        <Badge variant="neutral" size="sm">
                          Expirado
                        </Badge>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {job.status === 'COMPLETED' && !isExpired ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onDownload(job.id)}
                          className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Download className="h-3 w-3" />
                          Baixar
                        </Button>
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
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
  );
};
