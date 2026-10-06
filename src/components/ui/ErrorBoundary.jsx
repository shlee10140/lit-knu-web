import React from 'react'
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[LIT App ErrorBoundary Catch]:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('lit_')) {
          localStorage.removeItem(key)
        }
      })
    } catch (_) {}
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 dark:bg-[#07070b] text-fg">
          <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-7 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-xl font-bold tracking-tight text-fg">
                페이지를 불러오는 중 오류가 발생했습니다
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed break-keep">
                일시적인 네트워크 지연이거나 저장된 캐시 데이터에 충돌이 있을 수 있습니다. 새로고침을 시도해 주세요.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="rounded-xl bg-slate-100 dark:bg-white/[0.04] p-3 text-left font-mono text-[11px] text-muted overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full h-11 rounded-xl bg-[#3182F6] hover:bg-[#2563EB] active:scale-[0.98] text-xs sm:text-sm font-bold text-white shadow-sm shadow-[#3182F6]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                새로고침
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full h-11 rounded-xl border border-line bg-surface hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.98] text-xs sm:text-sm font-semibold text-muted hover:text-fg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                데이터 초기화 복구
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
