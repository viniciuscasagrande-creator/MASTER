import React, { useState } from 'react';
import { ArrowLeft, Building2, MapPin, Users, Phone, FileText, AlertCircle, Check } from 'lucide-react';
import { CreateVenueInput, VenueType, VenueScope } from '@shared/types/index';
import { createVenue } from '../api/venues.api';
import { useDiskContext } from '../../../core/context/DiskContext';
import { VENUE_TYPE_LABELS } from './VenueCard';

interface VenueCreatePageProps {
  onSuccess: (newVenueId: string) => void;
  onCancel: () => void;
}

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const VenueCreatePage: React.FC<VenueCreatePageProps> = ({ onSuccess, onCancel }) => {
  const { apiFetch, selectedProducerId, isGlobalScope } = useDiskContext();

  const [name, setName] = useState('');
  const [type, setType] = useState<VenueType>('ARENA');
  const [scope, setScope] = useState<VenueScope>(isGlobalScope ? 'GLOBAL' : 'PRODUCER');
  const [postalCode, setPostalCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('Curitiba');
  const [state, setState] = useState('PR');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCepChange = (rawCep: string) => {
    setPostalCode(rawCep);
    const clean = rawCep.replace(/\D/g, '');
    if (clean === '81280330' || clean.length === 8) {
      if (!city) setCity('Curitiba');
      if (!state) setState('PR');
      if (!street) setStreet('Rua Prof. Pedro Viriato Parigot de Souza');
      if (!district) setDistrict('Campo Comprido');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Informe o nome do local.');
      return;
    }
    if (!city.trim() || !state.trim()) {
      setErrorMessage('Cidade e Estado são obrigatórios.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const input: CreateVenueInput = {
        name: name.trim(),
        type,
        scope,
        producerId: scope === 'PRODUCER' && selectedProducerId !== 'all' ? selectedProducerId : undefined,
        postalCode: postalCode.trim() || undefined,
        street: street.trim() || undefined,
        number: number.trim() || undefined,
        complement: complement.trim() || undefined,
        district: district.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        country: 'Brasil',
        capacity: typeof capacity === 'number' ? capacity : undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        notes: notes.trim() || undefined
      };

      const newVenue = await createVenue(input, apiFetch);
      onSuccess(newVenue.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao cadastrar local');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Voltar ao catálogo"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-400" />
              Cadastrar Novo Local Físico
            </h2>
            <p className="text-xs text-slate-400">
              Arenas, estádios, teatros e casas de espetáculos reutilizáveis em múltiplos eventos.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Dados Básicos */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 text-slate-300">
            <Building2 className="h-4 w-4 text-cyan-400" />
            Identificação do Local
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Nome Oficial do Espaço <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Arena da Baixada, Teatro Positivo, Pedreira Paulo Leminski"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Tipo de Espaço <span className="text-rose-400">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as VenueType)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                {Object.entries(VENUE_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Escopo de Disponibilidade
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setScope('GLOBAL')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    scope === 'GLOBAL'
                      ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-200'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="font-bold">Global (Público)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Disponível para qualquer produtor na plataforma
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setScope('PRODUCER')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    scope === 'PRODUCER'
                      ? 'border-orange-500/60 bg-orange-500/10 text-orange-200'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="font-bold">Exclusivo do Produtor</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Restrito aos eventos do produtor ativo
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-orange-400" />
                <span>Capacidade Total Nominal de Público</span>
              </label>
              <input
                type="number"
                min="0"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value ? parseInt(e.target.value, 10) : '')}
                placeholder="Ex: 42000"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:border-orange-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500">
                Lotação máxima aprovada pelos Bombeiros / Alvará de Funcionamento.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Endereço */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 text-slate-300">
            <MapPin className="h-4 w-4 text-orange-400" />
            Localização e Endereço Físico
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">CEP</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="80000-000"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Rua / Logradouro</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Rua / Avenida..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Número</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="1000"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Complemento</label>
              <input
                type="text"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                placeholder="Portão 4, Anexo"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Bairro</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Água Verde"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Cidade <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Curitiba"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Estado (UF) <span className="text-rose-400">*</span>
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                required
              >
                {BRAZILIAN_STATES.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3. Contato e Operação */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 text-slate-300">
            <Phone className="h-4 w-4 text-emerald-400" />
            Contato e Observações Técnicas
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Telefone / Recepção</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(41) 3000-0000"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">E-mail Operacional</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operacao@local.com.br"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Site Oficial</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Observações Operacionais</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Regras de montagem de palco, docas de carga/descarga, horários limites da vizinhança, etc."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all"
          >
            <Check className="h-4 w-4" />
            {isSubmitting ? 'Salvando...' : 'Salvar Local'}
          </button>
        </div>
      </form>
    </div>
  );
};
