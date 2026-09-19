import React, { useState } from 'react';
import { Plus, Trash2, Sliders, Shield, AlertTriangle } from 'lucide-react';

interface NewPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const NewPolicyModal: React.FC<NewPolicyModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('FINANCE');
  const [description, setDescription] = useState('');
  const [scopeType, setScopeType] = useState<'GLOBAL' | 'PRODUCER' | 'EVENT'>('GLOBAL');
  const [priority, setPriority] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial rule
  const [ruleName, setRuleName] = useState('Regra Padrão');
  const [rulePriority, setRulePriority] = useState<number>(50);
  const [conditionField, setConditionField] = useState('amount');
  const [conditionOperator, setConditionOperator] = useState('GREATER_THAN');
  const [conditionValue, setConditionValue] = useState('50000');
  const [approvalsRequired, setApprovalsRequired] = useState<number>(1);
  const [stepUpRequired, setStepUpRequired] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    setIsSubmitting(true);
    try {
      let parsedVal: any = conditionValue;
      if (!isNaN(Number(conditionValue))) {
        parsedVal = Number(conditionValue);
      }

      await onSubmit({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        domain,
        description: description.trim() || undefined,
        scopeType,
        priority: Number(priority),
        rules: [
          {
            name: ruleName.trim(),
            priority: Number(rulePriority),
            orderIndex: 1,
            conditions: [
              {
                field: conditionField.trim(),
                operator: conditionOperator,
                value: parsedVal
              }
            ],
            action: {
              decision: true,
              approvalsRequired: Number(approvalsRequired),
              stepUpRequired
            }
          }
        ]
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar política');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100">Criar Nova Política de Negócio (Rascunho)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Código da Política *</label>
              <input
                type="text"
                required
                placeholder="ex: POL-FIN-TRANSFER-VIP"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Domínio *</label>
              <select
                value={domain}
                onChange={e => setDomain(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="FINANCE">FINANCE (Financeiro)</option>
                <option value="REFUNDS">REFUNDS (Estornos)</option>
                <option value="SAC">SAC (Atendimento)</option>
                <option value="SECURITY">SECURITY (Segurança)</option>
                <option value="TASKS">TASKS (Tarefas)</option>
                <option value="DOCUMENTS">DOCUMENTS (Documentos)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nome Descritivo da Política *</label>
            <input
              type="text"
              required
              placeholder="ex: Regras de Aprovação para Grandes Transferências"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Descrição</label>
            <textarea
              rows={2}
              placeholder="Descreva a finalidade desta política..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Escopo</label>
              <select
                value={scopeType}
                onChange={e => setScopeType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="GLOBAL">GLOBAL (Toda a Plataforma)</option>
                <option value="PRODUCER">PRODUCER (Produtor Específico)</option>
                <option value="EVENT">EVENT (Evento Específico)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Prioridade</label>
              <input
                type="number"
                value={priority}
                onChange={e => setPriority(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Initial Rule Builder Section */}
          <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3 pt-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-purple-400" />
              Configuração da Regra Inicial
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Nome da Regra</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={e => setRuleName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Prioridade da Regra</label>
                <input
                  type="number"
                  value={rulePriority}
                  onChange={e => setRulePriority(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400">Campo (Field)</label>
                <input
                  type="text"
                  value={conditionField}
                  onChange={e => setConditionField(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-purple-300"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400">Operador</label>
                <select
                  value={conditionOperator}
                  onChange={e => setConditionOperator(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-300 font-mono"
                >
                  <option value="GREATER_THAN">GREATER_THAN (&gt;)</option>
                  <option value="GREATER_OR_EQUAL">GREATER_OR_EQUAL (&gt;=)</option>
                  <option value="LESS_THAN">LESS_THAN (&lt;)</option>
                  <option value="LESS_OR_EQUAL">LESS_OR_EQUAL (&lt;=)</option>
                  <option value="EQUAL">EQUAL (=)</option>
                  <option value="NOT_EQUAL">NOT_EQUAL (!=)</option>
                  <option value="CONTAINS">CONTAINS</option>
                  <option value="IN">IN</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400">Valor</label>
                <input
                  type="text"
                  value={conditionValue}
                  onChange={e => setConditionValue(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-emerald-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Aprovações Exigidas</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={approvalsRequired}
                  onChange={e => setApprovalsRequired(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200"
                />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="chkStepUp"
                  checked={stepUpRequired}
                  onChange={e => setStepUpRequired(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="chkStepUp" className="text-xs text-slate-300 select-none cursor-pointer">
                  Exigir Reautenticação Step-Up (2FA)
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-md bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? 'Criando...' : 'Criar Política (Rascunho)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
