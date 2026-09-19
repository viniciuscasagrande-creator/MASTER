import React, { useState } from 'react';
import { InheritanceTreeNode, EffectiveConfigResult } from './configuration.types';
import {
  GitFork,
  ChevronRight,
  ChevronDown,
  Layers,
  Building,
  Calendar,
  Globe,
  Sliders,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

interface InheritanceTreeViewProps {
  parameters: EffectiveConfigResult[];
  onSelectNodeScope: (scope: { type: 'GLOBAL' | 'PRODUCER' | 'EVENT'; producerId?: string; eventId?: string; name: string }) => void;
  currentScope: { type: 'GLOBAL' | 'PRODUCER' | 'EVENT'; producerId?: string; eventId?: string; name: string };
}

export const InheritanceTreeView: React.FC<InheritanceTreeViewProps> = ({
  parameters,
  onSelectNodeScope,
  currentScope
}) => {
  // Sample organizational hierarchy tree
  const treeData: InheritanceTreeNode = {
    id: 'node_global',
    name: 'DiskIngressos Corporativo (Global)',
    type: 'GLOBAL',
    children: [
      {
        id: 'node_prd_100',
        name: 'Opus Entretenimento',
        type: 'PRODUCER',
        producerId: 'prd_100',
        children: [
          {
            id: 'node_evt_1001',
            name: 'Festival Curitiba 2026',
            type: 'EVENT',
            producerId: 'prd_100',
            eventId: 'evt_1001'
          },
          {
            id: 'node_evt_1002',
            name: 'Show Arena Curitiba',
            type: 'EVENT',
            producerId: 'prd_100',
            eventId: 'evt_1002'
          }
        ]
      },
      {
        id: 'node_prd_200',
        name: 'Live Nation Brasil',
        type: 'PRODUCER',
        producerId: 'prd_200',
        children: [
          {
            id: 'node_evt_2001',
            name: 'Turnê Mundial Estádio',
            type: 'EVENT',
            producerId: 'prd_200',
            eventId: 'evt_2001'
          }
        ]
      },
      {
        id: 'node_prd_300',
        name: 'T4F - Time For Fun',
        type: 'PRODUCER',
        producerId: 'prd_300',
        children: []
      }
    ]
  };

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    node_global: true,
    node_prd_100: true,
    node_prd_200: true
  });

  const toggleNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const isSelected = (node: InheritanceTreeNode) => {
    if (node.type === 'GLOBAL' && currentScope.type === 'GLOBAL') return true;
    if (node.type === 'PRODUCER' && currentScope.type === 'PRODUCER' && currentScope.producerId === node.producerId) return true;
    if (node.type === 'EVENT' && currentScope.type === 'EVENT' && currentScope.eventId === node.eventId) return true;
    return false;
  };

  const renderTreeNode = (node: InheritanceTreeNode, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id] ?? true;
    const selected = isSelected(node);

    let icon = <Globe className="h-4 w-4 text-emerald-400 shrink-0" />;
    if (node.type === 'PRODUCER') icon = <Building className="h-4 w-4 text-blue-400 shrink-0" />;
    if (node.type === 'EVENT') icon = <Calendar className="h-4 w-4 text-purple-400 shrink-0" />;

    return (
      <div key={node.id} className="space-y-1">
        <div
          onClick={() => {
            onSelectNodeScope({
              type: node.type,
              producerId: node.producerId,
              eventId: node.eventId,
              name: node.name
            });
          }}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          className={`flex items-center gap-2 py-2 pr-3 rounded-md cursor-pointer transition-colors text-xs select-none ${
            selected
              ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
          }`}
        >
          {hasChildren ? (
            <button
              onClick={e => toggleNode(node.id, e)}
              className="p-0.5 text-slate-400 hover:text-white"
            >
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <span className="w-3.5" />
          )}

          {icon}
          <span className="truncate">{node.name}</span>
          <span className="ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 uppercase">
            {node.type}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-slate-800/80 ml-4 space-y-1">
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <GitFork className="h-5 w-5 text-purple-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Árvore de Herança de Configurações & Políticas
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Navegue pela estrutura organizacional para verificar exatamente quais valores são herdados da matriz global ou do produtor, e quais parâmetros possuem sobreposições específicas (overrides).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Tree Explorer: 4 cols */}
        <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-slate-800">
            <span>Estrutura Organizacional</span>
            <span className="text-[10px] text-purple-400 font-mono">Clique para inspecionar</span>
          </div>

          <div className="space-y-1">
            {renderTreeNode(treeData)}
          </div>
        </div>

        {/* Right Configuration Table: 8 cols */}
        <div className="lg:col-span-8 bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">Visualizando Escopo</span>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                {currentScope.name}
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {currentScope.type}
                </span>
              </h3>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-400" />
              <span>{parameters.length} parâmetros avaliados</span>
            </div>
          </div>

          {/* Parameters Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Parâmetro / Chave</th>
                  <th className="py-2.5 px-3">Valor Efetivo</th>
                  <th className="py-2.5 px-3">Origem (Source)</th>
                  <th className="py-2.5 px-3">Status de Herança</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {parameters.map(p => {
                  const isDirectOverride = p.source === currentScope.type;
                  return (
                    <tr key={p.key} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-200">
                        {p.key}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-purple-300">
                        {String(p.value)} {p.unit || ''}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {p.source}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {isDirectOverride ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                            <Sparkles className="h-3 w-3" /> Sobreposto neste nível
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Herdado de {p.source}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
