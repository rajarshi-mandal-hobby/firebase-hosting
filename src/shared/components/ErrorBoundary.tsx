import { Component } from 'react';
import type { ReactNode } from 'react';
import { ErrorContainer } from './ErrorContainer';

interface Props {
    children: ReactNode;
    onRetry: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    resetErrorBoundary = () => {
        this.setState({ hasError: false, error: null });
        this.props.onRetry();
    };

    render() {
        if (this.state.hasError && this.state.error) {
            const { error } = this.state;
            return <ErrorContainer error={error} onRetry={this.resetErrorBoundary} isErrorBoundary />;
        }

        return this.props.children;
    }
}
