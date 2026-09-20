import React, { useState } from 'react';
import { Calendar, Building2, MapPin, Users, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { useDiskContext } from '../../../core/context/DiskContext';
import { createEvent } from '../api/events.api';
import { CreateEventInputDTO, EventDetailDTO } from '../types/event.types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: EventDetailDTO) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated
}) => {
  const { availableProducers, activeProducer, isLockedToSingleProducer, apiFetch } = useDiskContext();

  const initialProducerId = activeProducer?.id || (availableProducers[0]?.id || '');

  const [formData, setFormData] = useState<CreateEventInputDTO>({
    name: '',
    slug: '',
    producerId: initialProducerId,
    category: 'Show',
    startAt: '',
    endAt: '',
    timezone: 'America/Sao_Paulo',
    venue: '',
    city: 'Curitiba',
    state: 'PR',
    country: 'BR',
    capacity: undefined,
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (field: keyof CreateEventInputDTO, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug when name changes
      if (field === 'name' && !prev.slug) {
        updated.slug = value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage('O nome do evento é obrigatório.');
      return;
    }

    if (!formData.producerId) {
      setErrorMessage('Selecione o produtor responsável pelo evento.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateEventInputDTO = {
        ...formData,
        capacity: formData.capacity ? Number(formData.capacity) : undefined,
        startAt: formData.startAt ? new Date(formData.startAt).toISOString() : undefined,
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : undefined
      };

      const newEvent = await createEvent(payload, apiFetch);
      onEventCreated(newEvent);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao cadastrar evento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-400" />
          <span>Cadastrar Novo Evento (Rascunho)</span>
        </div>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Nome do Evento */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Nome do Evento *
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Turnê Acústica MPB Curitiba 2026"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {/* Produtor Responsável & Categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Produtor Responsável *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <select
                disabled={isLockedToSingleProducer}
                value={formData.producerId}
                onChange={(e) => handleChange('producerId', e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none disabled:opacity-60 cursor-pointer"
              >
                {availableProducers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Categoria
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none cursor-pointer"
            >
              <option value="Show">Show / Concerto</option>
              <option value="Festival">Festival</option>
              <option value="Teatro">Teatro / Espetáculo</option>
              <option value="Congresso">Congresso / Corporativo</option>
              <option value="Esporte">Esporte</option>
              <option value="Comédia">Comédia / Stand-up</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
        </div>

        {/* Data/Horário de Início e Término */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Data e Horário de Início
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="datetime-local"
                value={formData.startAt || ''}
                onChange={(e) => handleChange('startAt', e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Data e Horário de Término (Opcional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="datetime-local"
                value={formData.endAt || ''}
                onChange={(e) => handleChange('endAt', e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Local e Cidade/Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Local / Venue
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Ex: Teatro Positivo"
                value={formData.venue || ''}
                onChange={(e) => handleChange('venue', e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Cidade / UF
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Cidade"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-2/3 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
              <input
                type="text"
                maxLength={2}
                placeholder="UF"
                value={formData.state || ''}
                onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                className="w-1/3 rounded-xl bg-slate-950 border border-slate-700 px-2 py-2 text-xs text-white uppercase text-center focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Capacidade e Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Capacidade Prevista (Total)
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="number"
                min={1}
                placeholder="Ex: 5000"
                value={formData.capacity || ''}
                onChange={(e) => handleChange('capacity', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Identificador Amigável (Slug)
            </label>
            <input
              type="text"
              placeholder="ex-nome-do-evento"
              value={formData.slug || ''}
              onChange={(e) => handleChange('slug', e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-300 font-mono focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Descrição / Sinopse Operacional
          </label>
          <textarea
            rows={3}
            placeholder="Informações adicionais sobre a atração, orientações para bilheteria e produção..."
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
          <p className="flex items-center gap-1.5 font-medium text-slate-300">
            <FileText className="h-3.5 w-3.5 text-orange-400" />
            Criação Segura em Status Rascunho (DRAFT)
          </p>
          <p className="mt-1">
            O evento receberá um código público imutável (ex: <code className="text-orange-400">EVT-2026-XXXXXX</code>) e ficará disponível para configuração de sessões, setores e lotes.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            icon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          >
            {isSubmitting ? 'Cadastrando Evento...' : 'Criar Evento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
