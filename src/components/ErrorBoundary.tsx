'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            className="min-h-screen flex items-center justify-center p-4"
            dir="rtl"
            style={{ fontFamily: 'Cairo, sans-serif', background: '#FAFAF8' }}
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-red-100">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">عذراً، حدث خطأ</h2>
              <p className="text-gray-500 text-sm mb-6">
                {this.state.error?.message || 'حدث خطأ غير متوقع في التطبيق'}
              </p>
              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-[#1B5E38] text-white rounded-xl font-bold hover:bg-[#2D7A4E] transition-colors"
              >
                إعادة تحميل الصفحة
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}