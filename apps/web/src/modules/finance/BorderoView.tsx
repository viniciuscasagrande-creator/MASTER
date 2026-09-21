import React, { useState } from 'react';
import {
  FileCheck,
  Building2,
  Calendar,
  DollarSign,
  Printer,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { Button } from '../../shared/components/Button';
import { formatCurrency } from '../../shared/utils/formatters';
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
      <div className="p-8 text-center text-xs text-slate-500 rounded-2xl border border-slate-200 bg-white shadow-xs">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-wide">
              BORDERÔ OFICIAL DE FECHAMENTO
            </h2>
            <StatusBadge variant="primary" label="Documento Contábil" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Balanço consolidado para prestação de contas, conciliação tributária e encerramento de evento.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 cursor-pointer"
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
      <div className="max-w-4xl mx-auto rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-xs space-y-8">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-orange-600 block mb-1">
              PRESTAÇÃO DE CONTAS OFICIAL
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              BORDERÔ FINANCEIRO FINAL
            </h1>
            <span className="text-xs text-slate-500">
              Evento: <strong className="text-slate-900">{selectedEvent.eventTitle}</strong>
            </span>
          </div>

          <div className="text-right text-xs text-slate-500 space-y-1">
            <div>Produtor: <strong className="text-slate-900">{producerName}</strong></div>
            <div>Data do Balanço: <span className="font-mono text-slate-900">{new Date().toLocaleDateString('pt-BR')}</span></div>
            <div>Código Borderô: <span className="font-mono font-bold text-orange-600">BORD-2026-{selectedEvent.eventId.replace('evt_', '')}</span></div>
          </div>
        </div>

        {/* Analytical Sections */}
        <div className="space-y-6 text-xs">
          {/* Section 1: Bilheteria */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-100">
              1. RESUMO DE BILHETERIA & ARRECADAÇÃO
            </h4>
            <div className="divide-y divide-slate-100">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-600">Total de Ingressos Emitidos / Validados:</span>
                <span className="font-mono text-slate-900 font-semibold">{selectedEvent.ticketsSold} ingressos</span>
              </div>
              <div className="py-2.5 flex justify-between font-bold">
                <span className="text-slate-900">(+) RECEITA BRUTA ARRECADADA:</span>
                <span className="font-mono text-emerald-600 text-sm">{formatCurrency(gross)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Taxas & Deduções */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-100">
              2. TAXAS CONTRATUAIS & RETENÇÕES DA PLATAFORMA
            </h4>
            <div className="divide-y divide-slate-100">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-600">Taxa de Serviço e Conveniência:</span>
                <span className="font-mono text-rose-600">-{formatCurrency(fee)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-600">Retenção de ISS sobre intermediação:</span>
                <span className="font-mono text-rose-600">-{formatCurrency(issTax)}</span>
              </div>
              <div className="py-2.5 flex justify-between font-bold">
                <span className="text-slate-900">(=) RECEITA LÍQUIDA DE INGRESSOS:</span>
                <span className="font-mono text-slate-900 text-sm">{formatCurrency(netRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Repasses & Saldo Final */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-100">
              3. REPASSES BANCÁRIOS & SALDO RESIDUAL
            </h4>
            <div className="divide-y divide-slate-100">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-600">Repasses Já Liquidados em Conta Corrente:</span>
                <span className="font-mono text-slate-700">-{formatCurrency(paidPayouts)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-600">Repasses em Processamento / Agendados:</span>
                <span className="font-mono text-slate-700">-{formatCurrency(pendingPayouts)}</span>
              </div>
              <div className="py-3.5 flex justify-between font-bold text-sm bg-emerald-50 border border-emerald-200 px-4 rounded-xl">
                <span className="text-emerald-900 uppercase">(=) SALDO RESIDUAL DISPONÍVEL P/ LIQUIDAÇÃO FINAL:</span>
                <span className="font-mono text-emerald-700 text-base">{formatCurrency(finalResidualBalance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Digital Signature Block */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
          <div className="space-y-3">
            <div className="h-12 border-b border-dashed border-slate-300 mx-6 flex items-end justify-center pb-1">
              <span className="text-[10px] text-slate-400 font-mono">Assinatura Digital Auditada</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">{producerName}</span>
              <span className="text-[11px] text-slate-500">Produtor Responsável</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-12 border-b border-dashed border-slate-300 mx-6 flex items-end justify-center pb-1">
              <span className="text-[10px] text-slate-400 font-mono">Homologação Financeira</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Diretoria Financeira & Controladoria</span>
              <span className="text-[11px] text-slate-500">Auditoria do Sistema</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
