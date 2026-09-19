import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, Copy, Check, RefreshCw, ChevronDown, ChevronRight, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  showTechnicalDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCode: string;
  copied: boolean;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorCode: '',
    copied: false,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const generatedCode = `ERR-${dateStr}-${randomHex}`;

    return {
      hasError: true,
      error,
      errorCode: generatedCode
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log safe error telemetry without exposing raw internal secrets
    console.error(`[ErrorBoundary ${this.state.errorCode}]`, error, errorInfo);
  }

  private handleCopyCode = () => {
    if (this.state.errorCode) {
      navigator.clipboard.writeText(this.state.errorCode);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCode: '',
      copied: false,
      showDetails: false
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      const { fallbackTitle, showTechnicalDetails } = this.props;
      const { errorCode, copied, showDetails, error, errorInfo } = this.state;

      return (
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-6 md:p-8 backdrop-blur-sm text-slate-100 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <AlertOctagon className="h-6 w-6" />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-white">
                  {fallbackTitle || 'Ocorreu uma instabilidade nesta seção'}
                </h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-mono font-medium text-rose-400 border border-rose-500/30">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Código de Rastreio: {errorCode}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-300">
                A operação foi interceptada com segurança pelo sistema de proteção. Os dados anteriores não foram comprometidos.
                Informe o código de rastreio ao time de suporte ou tente recarregar a visualização.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tentar Novamente
                </button>

                <button
                  type="button"
                  onClick={this.handleCopyCode}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Código Copiado!' : 'Copiar Código de Rastreio'}
                </button>

                {showTechnicalDetails && (
                  <button
                    type="button"
                    onClick={() => this.setState({ showDetails: !showDetails })}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors ml-auto"
                  >
                    {showDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Detalhes Técnicos (Auditoria)
                  </button>
                )}
              </div>

              {showTechnicalDetails && showDetails && (
                <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-rose-300 overflow-x-auto">
                  <div className="text-slate-400 mb-1">Mensagem:</div>
                  <div className="font-semibold">{error?.message || 'Erro desconhecido'}</div>
                  {errorInfo?.componentStack && (
                    <div className="mt-2">
                      <div className="text-slate-400 mb-1">Component Stack:</div>
                      <pre className="text-slate-500 whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
