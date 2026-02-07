import * as React from "react";

/**
 * Props for the Graph error boundary component.
 */
export interface GraphErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional render function for custom error UI. Receives the caught error. */
  renderError?: (error: Error) => React.ReactNode;
}

interface GraphErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary for catching rendering errors in graph sub-components.
 * Wraps chart content to prevent rendering errors from crashing the entire UI.
 * @returns The children if no error, or the error UI if an error was caught
 */
class GraphErrorBoundaryClass extends React.Component<
  GraphErrorBoundaryProps,
  GraphErrorBoundaryState
> {
  constructor(props: GraphErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): GraphErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Error rendering chart:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.renderError) {
        return this.props.renderError(this.state.error);
      }

      return (
        <div data-slot="graph-error">
          <div>
            <p>Error loading chart</p>
            <p>An error occurred while rendering. Please try again.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { GraphErrorBoundaryClass as GraphErrorBoundary };
