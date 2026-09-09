import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-xl text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Đã xảy ra lỗi tải trang</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Rất xin lỗi vì sự bất tiện này. Một lỗi đã xảy ra trong quá trình hiển thị giao diện.
            </p>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl text-left mb-6 overflow-x-auto text-xs text-red-600 dark:text-red-400 font-mono border border-red-100 dark:border-red-900/30">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" /> Tải lại trang (F5)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
