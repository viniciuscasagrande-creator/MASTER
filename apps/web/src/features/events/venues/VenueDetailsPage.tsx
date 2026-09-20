import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Layers,
  Map,
  LogIn,
  Phone,
  Globe,
  Archive,
  AlertCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import {
  VenueDTO,
  VenueSectionDTO,
  VenueAccessPointDTO,
  VenueMapDTO,
  CreateVenueSectionInput,
  VenueAccessPointType
} from '@shared/types/index';
import {
  fetchVenueById,
  archiveVenue,
  createVenueSection,
  updateVenueSection,
  deleteVenueSection,
  createVenueAccessPoint,
  updateVenueAccessPoint,
  deleteVenueAccessPoint,
  createVenueMap
} from '../api/venues.api';
import { useDiskContext } from '../../../core/context/DiskContext';
import { Badge } from '../../../shared/components/Badge';
import { formatNumber, formatDateTime } from '../../../shared/utils/formatters';
import { VENUE_TYPE_LABELS } from './VenueCard';
import { VenueSectionsManager } from './VenueSectionsManager';
import { VenueAccessPointsManager } from './VenueAccessPointsManager';
import { VenueMapsList } from './VenueMapsList';

interface VenueDetailsPageProps {
  venueId: string;
  onBack: () => void;
  onOpenMapEditor: (mapId: string, versionId?: string) => void;
}

type TabType = 'overview' | 'sections' | 'access' | 'maps';

export const VenueDetailsPage: React.FC<VenueDetailsPageProps> = ({
  venueId,
  onBack,
  onOpenMapEditor
}) => {
  const { apiFetch } = useDiskContext();

  const [venue, setVenue] = useState<VenueDTO | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVenue = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchVenueById(venueId, apiFetch);
      setVenue(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes do local');
    } finally {
      setIsLoading(false);
    }
  }, [venueId, apiFetch]);

  useEffect(() => {
    loadVenue();
  }, [loadVenue]);

  // Handler for archiving
  const handleArchive = async () => {
    if (!venue) return;
    if (confirm(`Deseja realmente arquivar o local "${venue.name}"?`)) {
      try {
        await archiveVenue(venue.id, apiFetch);
        await loadVenue();
      } catch (err: any) {
        alert(err.message || 'Erro ao arquivar local');
      }
    }
  };

  // Handlers for Sections
  const handleAddSection = async (input: CreateVenueSectionInput) => {
    if (!venue) return;
    await createVenueSection(venue.id, input, apiFetch);
    await loadVenue();
  };

  const handleUpdateSection = async (
    sectionId: string,
    input: Partial<CreateVenueSectionInput> & { active?: boolean }
  ) => {
    await updateVenueSection(sectionId, input, apiFetch);
    await loadVenue();
  };

  const handleDeleteSection = async (sectionId: string) => {
    await deleteVenueSection(sectionId, apiFetch);
    await loadVenue();
  };

  // Handlers for Access Points
  const handleAddAccessPoint = async (input: {
    name: string;
    code?: string;
    type: VenueAccessPointType;
    active?: boolean;
  }) => {
    if (!venue) return;
    await createVenueAccessPoint(venue.id, input, apiFetch);
    await loadVenue();
  };

  const handleUpdateAccessPoint = async (
    id: string,
    input: { active?: boolean; name?: string; type?: VenueAccessPointType }
  ) => {
    await updateVenueAccessPoint(id, input, apiFetch);
    await loadVenue();
  };

  const handleDeleteAccessPoint = async (id: string) => {
    await deleteVenueAccessPoint(id, apiFetch);
    await loadVenue();
  };

  // Handlers for Maps
  const handleCreateMap = async (input: { name: string; description?: string }) => {
    if (!venue) throw new Error('Local não carregado');
    const newMap = await createVenueMap(venue.id, input, apiFetch);
    await loadVenue();
    return newMap;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span>Carregando local...</span>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white">Local não encontrado</h3>
        <p className="text-xs text-slate-400">{error || 'Não foi possível encontrar as informações deste local.'}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Catálogo
        </button>
      </div>
    );
  }

  const isGlobal = venue.scope === 'GLOBAL';
  const typeLabel = VENUE_TYPE_LABELS[venue.type] || venue.type;
  const sections = venue.sections || [];
  const accessPoints = venue.accessPoints || [];
  const maps = venue.maps || [];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors mt-0.5"
            title="Voltar ao catálogo"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <Badge variant="cyan" size="sm">
                {typeLabel}
              </Badge>
              {isGlobal ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  <ShieldCheck className="h-3 w-3" />
                  Global
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  Produtor
                </span>
              )}

              <Badge variant={venue.status === 'ACTIVE' ? 'emerald' : 'slate'} size="sm">
                {venue.status === 'ACTIVE' ? 'Ativo' : 'Arquivado'}
              </Badge>

              <span className="font-mono text-xs text-slate-500 ml-1">
                {venue.publicCode}
              </span>
            </div>

            <h1 className="text-xl font-bold text-white">{venue.name}</h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              <span>
                {venue.street ? `${venue.street}, ${venue.number || 'S/N'} - ` : ''}
                {venue.district ? `${venue.district}, ` : ''}
                {venue.city} - {venue.state}
              </span>
            </p>
          </div>
        </div>

        {/* Right action */}
        <div className="flex items-center gap-2">
          {venue.status === 'ACTIVE' && (
            <button
              onClick={handleArchive}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-rose-400 border border-slate-750 transition-colors"
            >
              <Archive className="h-3.5 w-3.5" />
              Arquivar Local
            </button>
          )}
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Visão Geral & Cadastro
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'sections'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          Setores Físicos ({sections.length})
        </button>

        <button
          onClick={() => setActiveTab('access')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'access'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LogIn className="h-4 w-4" />
          Acessos & Portões ({accessPoints.length})
        </button>

        <button
          onClick={() => setActiveTab('maps')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'maps'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Map className="h-4 w-4" />
          Mapas & Plantas ({maps.length})
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-300">
                Informações Gerais do Espaço
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-500">Nome Oficial</span>
                  <div className="font-bold text-white mt-0.5">{venue.name}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-500">Tipo de Venue</span>
                  <div className="font-bold text-white mt-0.5">{typeLabel}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-500">Capacidade Nominal Aprovada</span>
                  <div className="font-bold text-white mt-0.5 font-mono">
                    {venue.capacity ? `${formatNumber(venue.capacity)} pessoas` : 'Não informada'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-500">Escopo Operacional</span>
                  <div className="font-bold text-white mt-0.5">
                    {isGlobal ? 'Global / Multitenant' : `Exclusivo (${venue.producerName || 'Produtor'})`}
                  </div>
                </div>
              </div>

              {venue.notes && (
                <div className="pt-3 border-t border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold block mb-1">
                    Observações e Restrições Técnicas:
                  </span>
                  <p className="text-xs text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                    {venue.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-400" />
                Endereço Completo
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-500">Logradouro / Rua</span>
                  <div className="font-semibold text-white mt-0.5">
                    {venue.street || 'Não informado'}, {venue.number || 'S/N'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-500">Bairro / Região</span>
                  <div className="font-semibold text-white mt-0.5">
                    {venue.district || '—'} {venue.complement ? `(${venue.complement})` : ''}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-500">Cidade & Estado</span>
                  <div className="font-semibold text-white mt-0.5">
                    {venue.city} - {venue.state}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-500">CEP</span>
                  <div className="font-mono text-white mt-0.5">{venue.postalCode || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-400" />
                Contatos da Administração
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Telefone:</span>
                  <span className="text-slate-200 font-mono">{venue.phone || 'Não informado'}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">E-mail:</span>
                  <span className="text-slate-200">{venue.email || 'Não informado'}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Website:</span>
                  {venue.website ? (
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Globe className="h-3 w-3" />
                      {venue.website}
                    </a>
                  ) : (
                    <span className="text-slate-400">Não informado</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 text-xs">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                Auditoria & Registro
              </h3>

              <div className="space-y-2 text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Cadastrado em:</span>
                  <span className="text-slate-200">{formatDateTime(venue.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Última atualização:</span>
                  <span className="text-slate-200">{formatDateTime(venue.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Versão cadastral:</span>
                  <span className="font-mono text-slate-200">v{venue.version}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sections' && (
        <VenueSectionsManager
          venueId={venue.id}
          venueCapacity={venue.capacity}
          sections={sections}
          onAddSection={handleAddSection}
          onUpdateSection={handleUpdateSection}
          onDeleteSection={handleDeleteSection}
        />
      )}

      {activeTab === 'access' && (
        <VenueAccessPointsManager
          venueId={venue.id}
          accessPoints={accessPoints}
          onAddAccessPoint={handleAddAccessPoint}
          onUpdateAccessPoint={handleUpdateAccessPoint}
          onDeleteAccessPoint={handleDeleteAccessPoint}
        />
      )}

      {activeTab === 'maps' && (
        <VenueMapsList
          venueId={venue.id}
          maps={maps}
          onCreateMap={handleCreateMap}
          onOpenMapEditor={onOpenMapEditor}
        />
      )}
    </div>
  );
};
