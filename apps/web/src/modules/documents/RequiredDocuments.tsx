import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Upload,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { useDiskContext } from '../../core/context/DiskContext';
import { DocumentItem, DocumentResourceType } from './documents.types';
import { DocumentUploaderModal } from './DocumentUploaderModal';

interface RequiredDocumentsProps {
  operation: string;
  resourceType: DocumentResourceType;
  resourceId: string;
  amount?: number;
  producerId?: string;
  eventId?: string;
  onRequirementStatusChange?: (isValid: boolean) => void;
  className?: string;
}

interface RequirementResult {
  valid: boolean;
  missingRequirements: Array<{
    categoryCode: string;
    minDocuments: number;
    currentCount: number;
    description?: string;
  }>;
  satisfiedRequirements: Array<{
    categoryCode: string;
    count: number;
  }>;
}

export const RequiredDocuments: React.FC<RequiredDocumentsProps> = ({
  operation,
  resourceType,
  resourceId,
  amount,
  producerId,
  eventId,
  onRequirementStatusChange,
  className = ''
}) => {
  const { apiFetch } = useDiskContext();

  const [isLoading, setIsLoading] = useState(true);
  const [validation, setValidation] = useState<RequirementResult | null>(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [preselectedCategory, setPreselectedCategory] = useState<string | undefined>(undefined);

  const checkRequirements = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch current documents linked to this resource
      const docsRes = await apiFetch(`/api/v1/resources/${resourceType}/${resourceId}/documents`);
      let linkedCategoryCodes: string[] = [];
      if (docsRes.ok) {
        const docs: DocumentItem[] = await docsRes.json();
        linkedCategoryCodes = docs
          .map(d => d.category?.code)
          .filter((code): code is string => !!code);
      }

      // 2. Validate against requirements engine
      const valRes = await apiFetch('/api/v1/documents/validate-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          amount,
          producerId,
          eventId,
          linkedCategoryCodes
        })
      });

      if (valRes.ok) {
        const result: RequirementResult = await valRes.json();
        setValidation(result);
        if (onRequirementStatusChange) {
          onRequirementStatusChange(result.valid);
        }
      }
    } catch (err) {
      console.error('Erro ao validar documentos obrigatórios:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, operation, resourceType, resourceId, amount, producerId, eventId, onRequirementStatusChange]);

  useEffect(() => {
    checkRequirements();
  }, [checkRequirements]);

  const handleOpenUploadForCategory = (catCode: string) => {
    setPreselectedCategory(catCode);
    setIsUploaderOpen(true);
  };

  if (isLoading) {
    return (
      <div className={`rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 flex items-center justify-center gap-2 ${className}`}>
        <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
        Validando checklist de documentos obrigatórios...
      </div>
    );
  }

  if (!validation) return null;

  const totalRequired = (validation.missingRequirements?.length || 0) + (validation.satisfiedRequirements?.length || 0);

  if (totalRequired === 0) {
    return null; // No mandatory rules for this operation
  }

  return (
    <div className={`rounded-xl border ${validation.valid ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-amber-500/30 bg-amber-950/10'} p-4 shadow-md ${className}`}>
      {/* Status banner */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-3">
        <div className="flex items-center gap-2">
          {validation.valid ? (
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-amber-400" />
          )}
          <div>
            <h4 className="font-semibold text-white text-sm">
              {validation.valid ? 'Documentação Obrigatória Completa' : 'Documentação Pendente para Aprovação'}
            </h4>
            <p className="text-xs text-slate-400">
              Operação: <span className="font-mono text-cyan-300">{operation}</span>
            </p>
          </div>
        </div>

        <button
          onClick={checkRequirements}
          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title="Revalidar documentos"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {/* Missing Requirements */}
        {validation.missingRequirements.map((req, idx) => (
          <div
            key={`missing-${idx}`}
            className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-900/20 p-2.5 text-xs text-slate-200"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-semibold text-amber-300 font-mono">
                  {req.categoryCode}
                </span>
                <span className="ml-2 text-slate-400">
                  ({req.currentCount}/{req.minDocuments} anexados)
                </span>
                {req.description && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{req.description}</p>
                )}
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenUploadForCategory(req.categoryCode)}
              className="border-amber-500/40 text-amber-300 hover:bg-amber-950/40 text-[11px] py-1 px-2.5 h-auto flex items-center gap-1"
            >
              <Upload className="h-3 w-3" />
              Anexar
            </Button>
          </div>
        ))}

        {/* Satisfied Requirements */}
        {validation.satisfiedRequirements.map((sat, idx) => (
          <div
            key={`sat-${idx}`}
            className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-900/10 p-2.5 text-xs text-slate-200"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-medium text-white font-mono">{sat.categoryCode}</span>
                <span className="ml-2 text-emerald-400 text-[11px]">
                  ({sat.count} documento{sat.count > 1 ? 's' : ''} verificado{sat.count > 1 ? 's' : ''})
                </span>
              </div>
            </div>
            <Badge variant="emerald">Atendido</Badge>
          </div>
        ))}
      </div>

      {/* Modal */}
      <DocumentUploaderModal
        isOpen={isUploaderOpen}
        onClose={() => {
          setIsUploaderOpen(false);
          setPreselectedCategory(undefined);
        }}
        initialResourceType={resourceType}
        initialResourceId={resourceId}
        initialCategoryCode={preselectedCategory}
        onSuccess={() => {
          checkRequirements();
        }}
      />
    </div>
  );
};
