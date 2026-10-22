// If a screen throws while rendering, show a short message with a way out instead of a blank page.
// Moving to another route (or step) clears the error and tries again; the screen itself is not remounted.
import { Component, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { resetDraft } from '../pages/panel/catalog/draftStore';
import { withBase } from '../app/base';

interface State {
  error: Error | null;
}

class Boundary extends Component<{ children: ReactNode; resetKey: string }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: { resetKey: string }) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  componentDidCatch(error: Error) {
    console.error('Screen error:', error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const home = `/panel/v3/new/growth/demo/home${window.location.search}`;
    return (
      <div className="min-h-[calc(100vh-var(--concept-strip-h))] bg-secondary-bg flex items-start justify-center p-6 font-body text-primary-text" data-screen-error>
        <div className="mt-16 w-full max-w-[560px] rounded-lg bg-white p-6 border border-solid border-primary-border">
          <h1 className="m-0 font-heading font-bold text-3xl leading-7">This screen couldn't open</h1>
          <p className="mt-2 mb-4 text-lg leading-5 text-secondary-text">
            Something in the saved demo data didn't fit this version of the prototype. Starting the listing again usually fixes it.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="h-9 cursor-pointer rounded-sm border-0 bg-brand-primary-bg px-4 font-button font-semibold text-lg text-white"
              onClick={() => {
                resetDraft();
                window.location.assign(withBase(home));
              }}
            >
              Start the listing again
            </button>
            <button
              type="button"
              className="h-9 cursor-pointer rounded-sm border border-solid border-brand-primary-bg bg-white px-4 font-button font-semibold text-lg text-brand-primary-bg"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
          <p className="mt-4 mb-0 text-sm leading-4 text-tertiary-text break-words">Details: {error.message}</p>
        </div>
      </div>
    );
  }
}

export function ScreenErrorBoundary({ children }: { children: ReactNode }) {
  const loc = useLocation();
  return <Boundary resetKey={loc.pathname + loc.search}>{children}</Boundary>;
}
