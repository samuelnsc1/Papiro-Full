import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 my-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[var(--text)] flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{this.props.fallbackTitle || 'Ocorreu uma falha ao renderizar este bloco'}</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {this.state.error?.message || 'Erro inesperado. Os dados continuam seguros e você pode recarregar este bloco.'}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface)] transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
