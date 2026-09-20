import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Copy,
  Plus,
  Trash2,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Square,
  Armchair,
  Sparkles,
  AlertCircle,
  Settings,
  HelpCircle
} from 'lucide-react';
import {
  VenueMapDTO,
  VenueMapVersionDTO,
  VenueMapElementDTO,
  VenueMapElementType,
  VenueSectionDTO,
  VenueSeatDTO
} from '@shared/types/index';
import {
  fetchVenueMapById,
  saveMapLayout,
  publishMapVersion,
  duplicateMapVersion,
  bulkUpdateSeats,
  fetchVenueSections
} from '../api/venues.api';
import { useDiskContext } from '../../../core/context/DiskContext';
import { Badge } from '../../../shared/components/Badge';
import { formatNumber } from '../../../shared/utils/formatters';

interface VenueMapEditorPageProps {
  venueId: string;
  mapId: string;
  initialVersionId?: string;
  onBack: () => void;
}

export const VenueMapEditorPage: React.FC<VenueMapEditorPageProps> = ({
  venueId,
  mapId,
  initialVersionId,
  onBack
}) => {
  const { apiFetch } = useDiskContext();

  const [map, setMap] = useState<VenueMapDTO | null>(null);
  const [version, setVersion] = useState<VenueMapVersionDTO | null>(null);
  const [elements, setElements] = useState<VenueMapElementDTO[]>([]);
  const [sections, setSections] = useState<VenueSectionDTO[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<'select' | 'stage' | 'section' | 'table' | 'entrance'>('select');

  // Bulk modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkSeatType, setBulkSeatType] = useState<'STANDARD' | 'VIP' | 'BOX' | 'TABLE_SEAT'>('STANDARD');
  const [bulkAccessible, setBulkAccessible] = useState(false);
  const [bulkRestricted, setBulkRestricted] = useState(false);

  // Load Map & Version data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [mapData, sectionsData] = await Promise.all([
        fetchVenueMapById(mapId, initialVersionId, apiFetch),
        fetchVenueSections(venueId, apiFetch)
      ]);

      setMap(mapData.map);
      setVersion(mapData.activeVersion);
      setElements(mapData.elements || []);
      setSections(sectionsData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar mapa e planta');
    } finally {
      setIsLoading(false);
    }
  }, [mapId, initialVersionId, venueId, apiFetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selected element
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // Handle Add Element
  const handleAddElement = (type: VenueMapElementType, label: string) => {
    if (!version) return;

    const newElement: VenueMapElementDTO = {
      id: `elem_${Date.now()}`,
      mapVersionId: version.id,
      type,
      x: 350,
      y: 250,
      width: type === 'STAGE' ? 240 : type === 'TABLE' ? 80 : 180,
      height: type === 'STAGE' ? 80 : type === 'TABLE' ? 80 : 120,
      rotation: 0,
      label,
      linkedSectionId: sections.length > 0 ? sections[0].id : null,
      sortOrder: elements.length + 1
    };

    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
    setActiveTool('select');
  };

  // Handle Save Layout
  const handleSave = async () => {
    if (!version) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const updated = await saveMapLayout(
        version.id,
        {
          elements,
          scale: zoom
        },
        apiFetch
      );

      setVersion(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar layout');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Publish Version
  const handlePublish = async () => {
    if (!version) return;
    if (confirm('Deseja publicar esta versão da planta? Ela se tornará a versão ativa para novos eventos.')) {
      try {
        setIsSaving(true);
        const pub = await publishMapVersion(version.id, apiFetch);
        setVersion(pub);
        alert('Planta publicada com sucesso!');
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Erro ao publicar versão');
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Handle Duplicate Version
  const handleDuplicate = async () => {
    if (!version) return;
    try {
      setIsSaving(true);
      const dup = await duplicateMapVersion(version.id, undefined, apiFetch);
      alert(`Nova versão criada com sucesso (v${dup.versionNumber})!`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao duplicar versão');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Element
  const handleDeleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Update selected element property
  const updateSelectedProp = (key: keyof VenueMapElementDTO, value: any) => {
    if (!selectedElementId) return;
    setElements((prev) =>
      prev.map((el) => (el.id === selectedElementId ? { ...el, [key]: value } : el))
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span>Carregando editor visual da planta...</span>
        </div>
      </div>
    );
  }

  if (errorMessage && !map) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Falha ao abrir planta</h3>
        <p className="text-xs text-slate-400">{errorMessage}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-3 animate-fadeIn">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{map?.name}</h2>
              <Badge variant={version?.status === 'ACTIVE' ? 'emerald' : 'orange'} size="sm">
                v{version?.versionNumber} • {version?.status === 'ACTIVE' ? 'Publicada' : 'Rascunho'}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              {elements.length} elementos gráficos posicionados • Capacidade estimada:{' '}
              <span className="font-mono text-cyan-400">
                {formatNumber(version?.totalCapacity || 0)}
              </span>
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold animate-pulse">
              <CheckCircle2 className="h-4 w-4" /> Salvo!
            </span>
          )}

          <button
            onClick={handleDuplicate}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            title="Criar nova versão a partir desta"
          >
            <Copy className="h-3.5 w-3.5 text-slate-400" />
            Nova Versão
          </button>

          {version?.status === 'DRAFT' && (
            <button
              onClick={handlePublish}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Publicar Versão
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? 'Salvando...' : 'Salvar Layout'}
          </button>
        </div>
      </div>

      {/* 2. Main Editor Body */}
      <div className="flex-1 flex gap-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 relative">
        {/* Left Toolbar */}
        <div className="w-14 border-r border-slate-800 bg-slate-900/80 p-2 flex flex-col items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTool('select')}
            className={`p-2.5 rounded-xl transition-all ${
              activeTool === 'select'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            title="Selecionar / Mover"
          >
            <Move className="h-4 w-4" />
          </button>

          <button
            onClick={() => handleAddElement('STAGE', 'PALCO PRINCIPAL')}
            className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            title="Adicionar Palco"
          >
            <Sparkles className="h-4 w-4 text-purple-400" />
          </button>

          <button
            onClick={() => handleAddElement('SECTION', 'Setor Geral')}
            className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            title="Adicionar Setor / Pista"
          >
            <Square className="h-4 w-4 text-cyan-400" />
          </button>

          <button
            onClick={() => handleAddElement('TABLE', 'Mesa 01')}
            className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            title="Adicionar Mesa"
          >
            <Armchair className="h-4 w-4 text-amber-400" />
          </button>

          <div className="w-full h-px bg-slate-800 my-1" />

          {/* Zoom buttons */}
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Aproximar Zoom"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Afastar Zoom"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Resetar visualização"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Center SVG Interactive Canvas */}
        <div
          className="flex-1 relative overflow-auto bg-slate-950 flex items-center justify-center p-8 select-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        >
          <svg
            width="900"
            height="600"
            viewBox="0 0 900 600"
            className="border border-slate-800/80 rounded-2xl bg-slate-900/40 shadow-2xl transition-transform origin-center"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Guide Grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="900" height="600" fill="url(#grid)" />

            {/* Render Elements */}
            {elements.map((elem) => {
              const isSelected = elem.id === selectedElementId;
              const isStage = elem.type === 'STAGE';
              const isTable = elem.type === 'TABLE';
              const linkedSec = sections.find((s) => s.id === elem.linkedSectionId);
              const color = linkedSec?.color || (isStage ? '#8b5cf6' : '#3b82f6');

              return (
                <g
                  key={elem.id}
                  transform={`translate(${elem.x}, ${elem.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(elem.id);
                  }}
                  className="cursor-pointer transition-all"
                >
                  {/* Shape */}
                  {isTable ? (
                    <circle
                      cx={elem.width / 2}
                      cy={elem.height / 2}
                      r={elem.width / 2}
                      fill={`${color}30`}
                      stroke={isSelected ? '#f97316' : color}
                      strokeWidth={isSelected ? 3 : 1.5}
                    />
                  ) : (
                    <rect
                      width={elem.width}
                      height={elem.height}
                      rx={isStage ? 12 : 8}
                      fill={isStage ? 'rgba(139, 92, 246, 0.25)' : `${color}25`}
                      stroke={isSelected ? '#f97316' : color}
                      strokeWidth={isSelected ? 3 : 1.5}
                      strokeDasharray={isStage ? 'none' : '4 2'}
                    />
                  )}

                  {/* Label */}
                  <text
                    x={elem.width / 2}
                    y={elem.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSelected ? '#f97316' : '#ffffff'}
                    fontSize={isStage ? 13 : 11}
                    fontWeight="bold"
                    className="font-sans pointer-events-none"
                  >
                    {elem.label || elem.type}
                  </text>

                  {/* Physical section tag if linked */}
                  {linkedSec && !isStage && (
                    <text
                      x={elem.width / 2}
                      y={elem.height / 2 + 16}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize={9}
                      className="font-mono pointer-events-none"
                    >
                      {linkedSec.name}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right Properties & Inspector Panel */}
        <div className="w-80 border-l border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between overflow-y-auto shrink-0">
          {selectedElement ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-orange-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Propriedades do Elemento
                  </h3>
                </div>

                <button
                  onClick={() => handleDeleteElement(selectedElement.id)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                  title="Excluir elemento"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Label */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Rótulo / Nome
                </label>
                <input
                  type="text"
                  value={selectedElement.label || ''}
                  onChange={(e) => updateSelectedProp('label', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Linked Physical Section */}
              {selectedElement.type !== 'STAGE' && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span>Setor Físico Vinculado</span>
                    <span className="text-[10px] text-orange-400">Fase 1.2.3</span>
                  </label>
                  <select
                    value={selectedElement.linkedSectionId || ''}
                    onChange={(e) => updateSelectedProp('linkedSectionId', e.target.value || null)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Nenhum (Visual apenas)</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name} ({sec.capacity} lug.)
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500">
                    Conecta este bloco visual ao setor físico para controle de lotação.
                  </p>
                </div>
              )}

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400">Posição X</label>
                  <input
                    type="number"
                    value={selectedElement.x}
                    onChange={(e) => updateSelectedProp('x', parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400">Posição Y</label>
                  <input
                    type="number"
                    value={selectedElement.y}
                    onChange={(e) => updateSelectedProp('y', parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400">Largura (px)</label>
                  <input
                    type="number"
                    value={selectedElement.width}
                    onChange={(e) => updateSelectedProp('width', parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400">Altura (px)</label>
                  <input
                    type="number"
                    value={selectedElement.height}
                    onChange={(e) => updateSelectedProp('height', parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Fast Bulk Config button */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-orange-400 text-xs font-semibold transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Configurar Assentos em Lote
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full text-slate-500 space-y-2">
              <Move className="h-8 w-8 text-slate-600 mb-1" />
              <div className="text-xs font-semibold text-slate-300">Nenhum elemento selecionado</div>
              <p className="text-[11px] text-slate-500 max-w-[200px]">
                Clique em um elemento do mapa para inspecionar e alterar suas propriedades.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Update Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-400" />
                Configurar Assentos em Lote
              </h3>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Tipo de Assento</label>
                <select
                  value={bulkSeatType}
                  onChange={(e) => setBulkSeatType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white"
                >
                  <option value="STANDARD">Padrão / Regular</option>
                  <option value="VIP">Assento VIP</option>
                  <option value="BOX">Camarote / Frisa</option>
                  <option value="TABLE_SEAT">Cadeira de Mesa</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkAccessible}
                    onChange={(e) => setBulkAccessible(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-orange-500"
                  />
                  <span>Assento com Acessibilidade PCD</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkRestricted}
                    onChange={(e) => setBulkRestricted(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-orange-500"
                  />
                  <span>Visão Parcial / Restrita</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!version) return;
                    try {
                      await bulkUpdateSeats(
                        version.id,
                        {
                          seatIds: [], // backend handles empty array safely
                          updates: {
                            seatType: bulkSeatType,
                            accessible: bulkAccessible,
                            restrictedView: bulkRestricted
                          }
                        },
                        apiFetch
                      );
                      setIsBulkModalOpen(false);
                      alert('Propriedades aplicadas com sucesso!');
                    } catch (err: any) {
                      alert(err.message || 'Erro ao atualizar');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs text-white font-semibold shadow-lg shadow-orange-500/20"
                >
                  Aplicar Configurações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
