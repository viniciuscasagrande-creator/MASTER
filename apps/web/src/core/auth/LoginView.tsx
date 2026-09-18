import React, { useState } from 'react';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Users
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';

interface LoginViewProps {
  onSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { login, users, switchUser, currentUser } = useAuth();

  const [email, setEmail] = useState('vinicius.casagrande@diskingressos.com.br');
  const [password, setPassword] = useState('••••••••••••');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const res = login(email, password, needs2FA ? twoFactorCode : undefined);

    if (res.requires2FA) {
      setNeeds2FA(true);
      return;
    }

    if (!res.success) {
      setErrorMessage(res.error || 'Erro ao autenticar.');
      return;
    }

    if (onSuccess) onSuccess();
  };

  const handleQuickLogin = (userId: string) => {
    switchUser(userId);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-xl shadow-orange-500/20 mb-2">
            <span className="font-black text-xl text-white">DK</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            DISK INTERNO
          </h1>
          <p className="text-xs text-slate-400">
            Plataforma Unificada de Operações • Central de Autenticação & RBAC
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl space-y-5">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nome@diskingressos.com.br"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-orange-500 font-mono"
                />
              </div>
            </div>

            {/* 2FA input if required */}
            {needs2FA && (
              <div className="rounded-xl border border-orange-500/40 bg-orange-500/10 p-3.5 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                  <KeyRound className="h-4 w-4" />
                  <span>Autenticação de 2 Fatores (2FA) Obrigatória</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Digite o token de 6 dígitos gerado pelo seu aplicativo autenticador:
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  autoFocus
                  required
                  className="w-full rounded-lg border border-orange-500/50 bg-slate-950 py-2 px-3 text-center text-sm font-mono tracking-widest text-white outline-none"
                />
                <span className="text-[10px] text-slate-400 block text-center">
                  (Dica de teste: use <strong>123456</strong>)
                </span>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full py-2.5 text-xs font-semibold">
              {needs2FA ? 'Confirmar Token 2FA e Entrar' : 'Autenticar no Disk Interno'}
            </Button>
          </form>

          {/* Quick Demo Personas Switcher for Testing */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-orange-400" />
              Perfis Rápidos de Demonstração (Fase 1.1.5)
            </div>

            <div className="space-y-1.5">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleQuickLogin(u.id)}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-left text-xs hover:border-orange-500/50 hover:bg-slate-900 transition-all cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      {u.name}
                      {u.twoFactorEnforced && (
                        <span className="rounded bg-cyan-500/10 px-1 py-0.2 text-[9px] font-bold text-cyan-400 border border-cyan-500/20">
                          2FA
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {u.roleName} • {u.scope.type}
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 font-mono">
          Core de Identidade & RBAC v1.1.5 • Sessão Criptografada SHA-256
        </div>
      </div>
    </div>
  );
};
