import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
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
      let errorMessage = this.state.error?.message || 'An unknown error occurred';
      try {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error) {
          errorMessage = parsedError.error;
        }
      } catch (e) {
        // Not a JSON error, use as is
      }

      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#212121] text-white p-4">
          <div className="bg-[#2f2f2f] p-6 rounded-xl border border-red-500/30 max-w-md w-full">
            <h2 className="text-xl font-bold text-red-400 mb-4">Something went wrong</h2>
            <p className="text-zinc-300 mb-4 text-sm">{errorMessage}</p>
            <button
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-sm font-medium"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
