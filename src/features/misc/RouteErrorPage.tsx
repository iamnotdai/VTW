import { RefreshCw, TriangleAlert } from 'lucide-react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { paths } from '@/app/paths';
import { Button, ButtonLink } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { NotFoundPage } from './NotFoundPage';

/** Friendly fallback instead of a blank screen when something unexpected breaks. */
export function RouteErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  if (import.meta.env.DEV) console.error(error);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-4">
      <EmptyState
        icon={<TriangleAlert aria-hidden />}
        title="Oops! Something went wrong"
        message="Please try again. Your progress is safe on this device."
        actions={
          <>
            <Button
              leftIcon={<RefreshCw aria-hidden className="size-5" />}
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
            <ButtonLink to={paths.vocabulary} variant="secondary" reloadDocument>
              Go to Vocabulary
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
