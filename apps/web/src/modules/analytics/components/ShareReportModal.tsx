import React, { useState } from 'react';
import { X, Share2, ShieldAlert, Users, Lock, Building, Check } from 'lucide-react';
import { SavedReport, ReportVisibility } from '@shared/types/index';
import { Button } from '../../../shared/components/Button';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SavedReport | null;
  onSaveShare: (reportId: string, visibility: ReportVisibility, sharedWithUserIds: string[], sharedWithRoleCodes: string[]) => Promise<void>;
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  isOpen,
  onClose,
  report,
  onSaveShare
}) => {
  const [visibility, setVisibility] = useState<ReportVisibility>(report?.visibility || 'PRIVATE');
  const [selectedRole, setSelectedRole] = useState<string>('analista_comercial');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen || !report) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userIds = visibility === 'SPECIFIC_USERS' && selectedUserEmail ? [selectedUserEmail] : [];
      const roleCodes = visibility === 'ROLE' && selectedRole ? [selectedRole] : [];
      await onSaveShare(report.id, visibility, userIds, roleCodes);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2 text-orange-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Compartilhar Relatório</h2>
              <p className="text-xs text-slate-400">{report.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-6 text-sm">
          {/* Security Alert (Section 1.1.5.13.31) */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p>
              <strong>Regra de Segurança:</strong> O compartilhamento <u>nunca</u> amplia a permissão do destinatário.
              Se um operador não possuir permissão para visualizar as métricas deste domínio, o acesso aos dados continuará bloqueado.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Nível de Visibilidade
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'PRIVATE',
                  label: 'Privado',
                  desc: 'Apenas você e Administradores Gerais podem visualizar e executar',
                  icon: <Lock className="h-4 w-4 text-slate-400" />
                },
                {
                  id: 'TEAM',
                  label: 'Minha Equipe',
                  desc: 'Visível para todos os membros da sua equipe operacional',
                  icon: <Users className="h-4 w-4 text-cyan-400" />
                },
                {
                  id: 'ROLE',
                  label: 'Por Perfil de Acesso (Role)',
                  desc: 'Compartilhar com todos os usuários de um determinado cargo',
                  icon: <Building className="h-4 w-4 text-purple-400" />
                },
                {
                  id: 'PRODUCER',
                  label: 'Produtor do Evento',
                  desc: 'Compartilhado no portal do produtor vinculado ao evento',
                  icon: <Building className="h-4 w-4 text-emerald-400" />
                },
                {
                  id: 'SPECIFIC_USERS',
                  label: 'Usuários Específicos',
                  desc: 'Informe o ID ou e-mail do operador do Disk Interno',
                  icon: <Users className="h-4 w-4 text-orange-400" />
                }
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setVisibility(opt.id as ReportVisibility)}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                    visibility === opt.id
                      ? 'border-orange-500/60 bg-orange-500/5'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === opt.id}
                    onChange={() => setVisibility(opt.id as ReportVisibility)}
                    className="mt-1 text-orange-500 focus:ring-orange-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium text-slate-200">
                      {opt.icon}
                      <span>{opt.label}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional: Role selection */}
          {visibility === 'ROLE' && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Selecione o Perfil (Role)
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-orange-500"
              >
                <option value="analista_comercial">Analista Comercial</option>
                <option value="analista_financeiro">Analista Financeiro</option>
                <option value="atendente_sac">Atendente SAC</option>
                <option value="analista_marketing">Analista de Marketing</option>
                <option value="produtor">Produtor</option>
                <option value="supervisor_operacoes">Supervisor de Operações</option>
              </select>
            </div>
          )}

          {/* Conditional: User Email input */}
          {visibility === 'SPECIFIC_USERS' && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Identificador ou E-mail do Usuário
              </label>
              <input
                type="text"
                placeholder="ex: mariana.vendas@diskingressos.com.br"
                value={selectedUserEmail}
                onChange={(e) => setSelectedUserEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-orange-500"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-800 bg-slate-950 px-6 py-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar Compartilhamento'}
          </Button>
        </div>
      </div>
    </div>
  );
};
