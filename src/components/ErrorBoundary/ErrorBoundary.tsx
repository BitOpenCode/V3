import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BubbleCard } from '../ui';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary" style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#1e1e1e',
          color: '#ffffff',
          padding: '20px'
        }}>
          <div style={{ 
            maxWidth: '500px', 
            textAlign: 'center',
            backgroundColor: '#2e2e2e',
            padding: '30px',
            borderRadius: '10px',
            border: '2px solid #8a2be2'
          }}>
            <h2 style={{ color: '#ff0000', fontSize: '1.5rem', marginBottom: '16px' }}>
              ⚠️ Something went wrong
            </h2>
            <p style={{ color: '#c0c0c0', fontSize: '1rem', marginBottom: '20px' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details style={{ 
                margin: '20px 0', 
                textAlign: 'left', 
                backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                borderRadius: '8px', 
                padding: '12px' 
              }}>
                <summary style={{ cursor: 'pointer', color: '#0077cc', fontWeight: '600', marginBottom: '8px' }}>
                  Error Details
                </summary>
                <pre style={{ 
                  fontSize: '0.75rem', 
                  color: '#c0c0c0', 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-all',
                  overflowX: 'auto',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {this.state.error?.stack}
                  {'\n\n'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button 
              onClick={this.handleReset} 
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #8a2be2, #0077cc)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '16px'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

