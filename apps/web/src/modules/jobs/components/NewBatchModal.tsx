import React, { useState } from 'react';
import { JobModule, JobPriority } from '../jobs.types';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Layers, CheckCircle2, Shield } from 'lucide-react';

interface NewBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    module: JobModule;
    itemsCount: number;
    jobType: string;
    priority: JobPriority;
  }) => void | Promise<void>;
}

export const NewBatchModal: React.FC<NewBatchModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState('');
  const [module, setModule] = useState<JobModule>('FINANCEIRO');
  const [jobType, setJobType] = useState('PAYOUT_CALCULATION');
  const [itemsCount, setItemsCount] = useState<number>(128);
  const [priority, setPriority] = useState<JobPriority>('HIGH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        module,
        itemsCount,
        jobType,
        priority
      });
      onClose();
    } catch {
      // error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Disparar Novo Processamento em Lote"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
            Nome do Lote Operacional *
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Lote Repasse Festivais de Primavera"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Módulo
            </label>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value as JobModule)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="FINANCEIRO">Financeiro</option>
              <option value="MARKETING">Marketing</option>
              <option value="RELATORIOS">Relatórios e BI</option>
              <option value="CONTABILIDADE">Contabilidade</option>
              <option value="EVENTOS">Eventos</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Prioridade
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as JobPriority)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Baixa</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Tipo de Operação
            </label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="PAYOUT_CALCULATION">Cálculo de Repasses</option>
              <option value="CNAB_GENERATION">Geração de CNAB</option>
              <option value="MARKETING_CAMPAIGN_DISPATCH">Disparo de Mensagens</option>
              <option value="FINANCE_RECONCILIATION">Conciliação Financeira</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Quantidade de Itens Filhos
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              value={itemsCount}
              onChange={(e) => setItemsCount(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-white font-semibold">
            <Layers className="h-3.5 w-3.5 text-orange-400" />
            <span>Processamento com Relação Parent × Child Jobs</span>
          </div>
          <p>
            Será gerado 1 registro Batch pai e {itemsCount} jobs filhos individuais com rastreamento por correlationId. O lote suporta retry seletivo para falhas pontuais.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Criar Lote ({itemsCount} jobs)
          </Button>
        </div>
      </form>
    </Modal>
  );
};
