import React, { useState } from 'react';
import {
  FileCheck,
  Building2,
  Calendar,
  DollarSign,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatDate } from '../../shared/utils/formatters';
import { EventBalanceItemUI } from './EventBalancesView';

interface BorderoViewProps {
  producerName: string;
  eventBalances: EventBalanceItemUI[];
}

export const BorderoView: React.FC<BorderoViewProps> = ({
  producerName,
  eventBalances
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    eventBalances[0]?.eventId || ''
  );

  const selectedEvent = eventBalances.find(e => e.eventId === selectedEventId) || eventBalances[0];

  if (!selectedEvent) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 rounded-2xl border border-slate-800 bg-slate-900/60">
        Nenhum evento com movimentação financeira para emissão de borderô.
      </div>
    );
  }

  const gross = selectedEvent.grossAmount || 0;
  const fee = selectedEvent.diskFee || 0;
  const netRevenue = selectedEvent.netRevenue || 0;
  const paidPayouts = selectedEvent.paidPayouts || 0;
  const pendingPayouts = selectedEvent.pendingPayouts || 0;
  const available = selectedEvent.availableBalance || 0;

  // Estimated tax deduction (ISS 3.5%)
  const issTax = Math.round(fee * 0.035 * 100) / 100;
  const finalResidualBalance = available;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Event Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide">
              BORDERÔ OFICIAL DE FECHAMENTO
            </h2>
            <Badge variant="amber" size="sm">
              Documento Fiscal Factual
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Balanço consolidado para prestação de contas, deduções tributárias e encerramento de evento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            {eventBalances.map(ev => (
              <option key={ev.eventId} value={ev.eventId}>
                {ev.eventTitle}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            icon={<Printer className="h-3.5 w-3.5" />}
          >
            Imprimir
          </Button>
        </div>
      </div>

      {/* Official Bordero Sheet */}
      <div className="max-w-4xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/80 p-8 sm:p-10 shadow-2xl space-y-8 backdrop-blur-xl">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block mb-1">
              DISKINGRESSOS PRO • PRESTAÇÃO DE CONTAS
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              BORDERÔ FINANCEIRO FINAL
            </h1>
            <span className="text-xs text-slate-400">
              Evento: <strong className="text-white">{selectedEvent.eventTitle}</strong>
            </span>
          </div>

          <div className="text-right text-xs text-slate-400 space-y-1">
            <div>Produtor: <strong className="text-white">{producerName}</strong></div>
            <div>Data do Balanço: <span className="font-mono text-white">{new Date().toLocaleDateString('pt-BR')}</span></div>
            <div>Código Borderô: <span className="font-mono text-amber-400">BORD-2026-{selectedEvent.eventId.replace('evt_', '')}</span></div>
          </div>
        </div>

        {/* Analytical Sections */}
        <div className="space-y-6 text-xs">
          {/* Section 1: Bilheteria */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800/60">
              1. RESUMO DE BILHETERIA & ARRECADAÇÃO
            </h4>
            <div className="divide-y divide-slate-800/40">
              <div className="py-2 flex justify-between">
                <span className="text-slate-300">Total de Ingressos Emitidos / Validados:</span>
                <span className="font-mono text-white font-semibold">{selectedEvent.ticketsSold} ingressos</span>
              </div>
              <div className="py-2 flex justify-between font-semibold">
                <span className="text-white">(+) RECEITA BRUTA ARRECADADA:</span>
                <span className="font-mono text-emerald-400 text-sm">{formatCurrency(gross)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Taxas & Deduções */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800/60">
              2. TAXAS CONTRATUAIS & RETENÇÕES DA PLATAFORMA
            </h4>
            <div className="divide-y divide-slate-800/40">
              <div className="py-2 flex justify-between">
                <span className="text-slate-300">Taxa de Serviço e Conveniência DiskIngressos:</span>
                <span className="font-mono text-rose-400">-{formatCurrency(fee)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-300">Retenção de ISS sobre intermediação:</span>
                <span className="font-mono text-rose-400">-{formatCurrency(issTax)}</span>
              </div>
              <div className="py-2 flex justify-between font-semibold">
                <span className="text-white">(=) RECEITA LÍQUIDA DE INGRESSOS:</span>
                <span className="font-mono text-white text-sm">{formatCurrency(netRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Repasses & Saldo Final */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800/60">
              3. REPASSES BANCÁRIOS & SALDO RESIDUAL
            </h4>
            <div className="divide-y divide-slate-800/40">
              <div className="py-2 flex justify-between">
                <span className="text-slate-300">Repasses Já Liquidados em Conta Corrente:</span>
                <span className="font-mono text-slate-300">-{formatCurrency(paidPayouts)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-300">Repasses em Processamento / Agendados:</span>
                <span className="font-mono text-slate-300">-{formatCurrency(pendingPayouts)}</span>
              </div>
              <div className="py-3.5 flex justify-between font-bold text-sm bg-emerald-500/10 border border-emerald-500/30 px-4 rounded-xl">
                <span className="text-emerald-400 uppercase">(=) SALDO RESIDUAL DISPONÍVEL P/ LIQUIDAÇÃO FINAL:</span>
                <span className="font-mono text-emerald-400 text-base">{formatCurrency(finalResidualBalance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Digital Signature Block */}
        <div className="pt-8 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
          <div className="space-y-3">
            <div className="h-12 border-b border-dashed border-slate-700 mx-6 flex items-end justify-center pb-1">
              <span className="text-[10px] text-slate-500 font-mono">Assinatura Digital Auditada via Token</span>
            </div>
            <div>
              <span className="font-semibold text-white block">{producerName}</span>
              <span className="text-[11px] text-slate-500">Produtor Responsável</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-12 border-b border-dashed border-slate-700 mx-6 flex items-end justify-center pb-1">
              <span className="text-[10px] text-slate-500 font-mono">Homologação Financeira DiskIngressos</span>
            </div>
            <div>
              <span className="font-semibold text-white block">Diretoria Financeira & Compliance</span>
              <span className="text-[11px] text-slate-500">Disk Interno PDT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
