import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <Card className="w-full max-w-md border-destructive/30">
            <CardContent className="py-8 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-semibold text-lg text-foreground">
                  Something went wrong
                </h2>
                <p className="text-sm text-muted-foreground">
                  This page crashed unexpectedly. Refreshing usually fixes it.
                </p>
                {this.state.error && (
                  <details className="text-left mt-3">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      Show error details
                    </summary>
                    <pre className="mt-2 text-xs text-destructive bg-destructive/5 rounded-lg p-3 overflow-auto max-h-40">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
