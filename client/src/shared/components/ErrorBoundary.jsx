import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-900 h-screen overflow-auto">
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="mb-4">Please take a screenshot of this and send it to support.</p>
          <div className="bg-white p-4 rounded shadow border border-red-200 font-mono text-xs whitespace-pre-wrap break-words">
            <p className="font-bold text-red-600">{this.state.error && this.state.error.toString()}</p>
            <br />
            <p className="text-gray-600">{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
