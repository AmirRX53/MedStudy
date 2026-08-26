import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Application-level error boundary. Catches render-time errors anywhere below
 * it so a crash cannot leave the user with a blank window and no recovery
 * path. Sits above all providers, so it uses plain bilingual text instead of
 * the language context.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('MedStudy render error:', error, info)
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-container placeholder-page">
          <div className="placeholder-icon">⚠️</div>
          <h2 className="page-title">Something went wrong</h2>
          <p className="placeholder-desc">
            MedStudy hit an unexpected error. Reload the app to continue, or restart the
            application if the problem persists. Export a JSON backup of your data before
            reporting the issue.
          </p>
          <p className="placeholder-desc" lang="fa" dir="rtl">
            برنامه با خطای غیرمنتظره‌ای مواجه شد. برای ادامه، برنامه را بارگذاری مجدد کنید؛
            اگر مشکل ادامه داشت، برنامه را دوباره راه‌اندازی کنید.
          </p>
          <button className="btn btn-primary" onClick={this.handleReload}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
