import React, { useState, useEffect } from 'react';
import {
  Database,
  FileSpreadsheet,
  Layers,
  ShieldAlert,
  GitMerge,
  FileCode,
  History,
  Activity,
  Plus,
  RefreshCw,
  Sparkles,
  Download,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  DataManagementTab,
  ImportRequest,
  DataQualityStats
} from './data-management.types';

import { OverviewTab } from './views/OverviewTab';
import { ImportsTab } from './views/ImportsTab';
import { QualityTab } from './views/QualityTab';
import { DuplicatesTab } from './views/DuplicatesTab';
import { MigrationsTab } from './views/MigrationsTab';
import { TemplatesTab } from './views/TemplatesTab';
import { MappingsTab } from './views/MappingsTab';
import { HistoryTab } from './views/HistoryTab';

import { NewImportWizard } from './components/NewImportWizard';
import { ImportDetailsModal } from './components/ImportDetailsModal';
import { RollbackModal } from './components/RollbackModal';

interface DataManagementCenterViewProps {
  initialTab?: DataManagementTab;
}

export const DataManagementCenterView: React.FC<DataManagementCenterViewProps> = ({
  initialTab = 'OVERVIEW'
}) => {
  const [activeTab, setActiveTab] = useState<DataManagementTab>(initialTab);
  const [imports, setImports] = useState<ImportRequest[]>([]);
  const [stats, setStats] = useState<DataQualityStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [inspectImportId, setInspectImportId] = useState<string | null>(null);
  const [rollbackImportId, setRollbackImportId] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [importsRes, statsRes] = await Promise.all([
        fetch('/api/data/imports', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
        }),
        fetch('/api/data-quality/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
        })
      ]);

      if (importsRes.ok) {
        const impData = await importsRes.json();
        setImports(impData.items || []);
      }

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData.stats || null);
      }
    } catch (err) {
      console.error('Falha ao carregar dados do Data Management Center:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelImport = async (id: string) => {
    if (!confirm('Deseja realmente cancelar esta importação?')) return;
    try {
      const res = await fetch(`/api/data/imports/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (res.ok) {
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerScan = async () => {
    try {
      const res = await fetch('/api/data-quality/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({})
      });
      if (res.ok) {
        alert('Varredura de qualidade iniciada com sucesso via Job Engine!');
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const tabsConfig: { id: DataManagementTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'OVERVIEW', label: 'Visão Geral', icon: Activity },
    { id: 'IMPORTS', label: 'Lotes de Importação', icon: FileSpreadsheet, badge: imports.filter(i => i.status === 'PROCESSING' || i.status === 'VALIDATING').length || undefined },
    { id: 'QUALITY', label: 'Qualidade de Dados', icon: ShieldAlert, badge: stats?.totalIssues || undefined },
    { id: 'DUPLICATES', label: 'Duplicidades & Mesclagens', icon: GitMerge },
    { id: 'MIGRATIONS', label: 'Projetos de Migração', icon: Layers },
    { id: 'TEMPLATES', label: 'Modelos Oficiais', icon: Download },
    { id: 'MAPPINGS', label: 'Mapeamentos Salvos', icon: FileCode },
    { id: 'HISTORY', label: 'Trilha & Auditoria', icon: History }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Core Interno • Governança & Qualidade</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            Central de Importação e Qualidade de Dados
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
              Fase 1.1.5.15
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Entrada controlada de planilhas, validação estrutural Mod11, sanitização contra fórmula injection, motor de desduplicação e orquestração de migrações em DAG.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchInitialData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WIZARD')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950/40 transition"
          >
            <Plus className="w-4 h-4" />
            Nova Importação
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-800 pb-1 scrollbar-thin">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                  isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Rendering */}
      <div className="pt-2">
        {activeTab === 'WIZARD' && (
          <NewImportWizard
            onSuccess={(id) => {
              setActiveTab('IMPORTS');
              fetchInitialData();
              setInspectImportId(id);
            }}
            onCancel={() => setActiveTab('IMPORTS')}
          />
        )}

        {activeTab === 'OVERVIEW' && (
          <OverviewTab
            stats={stats}
            recentImports={imports.slice(0, 5)}
            onOpenWizard={() => setActiveTab('WIZARD')}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onTriggerScan={handleTriggerScan}
          />
        )}

        {activeTab === 'IMPORTS' && (
          <ImportsTab
            imports={imports}
            onOpenWizard={() => setActiveTab('WIZARD')}
            onSelectImport={(id) => setInspectImportId(id)}
            onRequestRollback={(id) => setRollbackImportId(id)}
            onCancelImport={handleCancelImport}
          />
        )}

        {activeTab === 'QUALITY' && (
          <QualityTab onTriggerScan={handleTriggerScan} />
        )}

        {activeTab === 'DUPLICATES' && (
          <DuplicatesTab />
        )}

        {activeTab === 'MIGRATIONS' && (
          <MigrationsTab />
        )}

        {activeTab === 'TEMPLATES' && (
          <TemplatesTab />
        )}

        {activeTab === 'MAPPINGS' && (
          <MappingsTab />
        )}

        {activeTab === 'HISTORY' && (
          <HistoryTab
            onSelectImport={(item) => setInspectImportId(item.id)}
            onRequestRollback={(item) => setRollbackImportId(item.id)}
          />
        )}
      </div>

      {/* MODAL: Import Details */}
      {inspectImportId && (
        <ImportDetailsModal
          importId={inspectImportId}
          onClose={() => setInspectImportId(null)}
          onRequestRollback={(id) => {
            setInspectImportId(null);
            setRollbackImportId(id);
          }}
        />
      )}

      {/* MODAL: Rollback Execution */}
      {rollbackImportId && (
        <RollbackModal
          importId={rollbackImportId}
          onClose={() => setRollbackImportId(null)}
          onSuccess={() => {
            setRollbackImportId(null);
            fetchInitialData();
          }}
        />
      )}
    </div>
  );
};
