import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, UserCheck } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';

interface AccessDeniedViewProps {
  requiredPermission?: string;
  scopeIssue?: string;
  onBack?: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  requiredPermission,
  scopeIssue,
  onBack
}) => {
  const { currentUser, switchUser } = useAuth();

  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-xl mb-4">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <Badge variant="rose" size="md" className="mb-2">
        403 — ACESSO NEGADO
      </Badge>

      <h2 className="text-xl font-bold text-white tracking-tight">
        Você não possui permissão para acessar esta área ou operação
      </h2>

      <p className="mt-2 max-w-lg text-xs text-slate-400 leading-relaxed">
        {scopeIssue || 'Sua credencial autenticada não possui o perfil, ação granular ou escopo de dados necessários no Core de Permissões.'}
      </p>

      {/* Permission Detail Card */}
      <div className="mt-6 w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-left text-xs space-y-2">
        <div className="flex justify-between text-slate-400">
          <span>Usuário Conectado:</span>
          <span className="font-semibold text-white">{currentUser.name}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Perfil Atribuído:</span>
          <span className="font-semibold text-orange-400">{currentUser.roleName}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Escopo de Dados:</span>
          <span className="font-mono text-cyan-400">{currentUser.scope.type}</span>
        </div>
        {requiredPermission && (
          <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-400">
            <span>Permissão Exigida:</span>
            <span className="font-mono text-rose-400 font-bold">{requiredPermission}</span>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack} icon={<ArrowLeft className="h-3.5 w-3.5" />}>
            Voltar para Visão Geral
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          onClick={() => switchUser('usr-admin-1')}
          icon={<UserCheck className="h-3.5 w-3.5" />}
        >
          Alternar para Admin Master
        </Button>
      </div>
    </div>
  );
};
