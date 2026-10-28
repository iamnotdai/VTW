import { Hourglass, MapPin } from 'lucide-react';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { PageContainer } from '@/components/layout/PageHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/** Shown for unknown URLs, unknown ids, and scenes that are not ready yet. */
export function NotFoundPage({
  title = 'We can’t find this place',
  message = 'This page does not exist. Let’s go back and keep exploring!',
  comingSoon = false,
}: {
  title?: string;
  message?: string;
  comingSoon?: boolean;
}) {
  useDocumentTitle(comingSoon ? 'Coming soon' : 'Not found');
  return (
    <PageContainer className="flex flex-1 items-center">
      <EmptyState
        icon={comingSoon ? <Hourglass aria-hidden /> : <MapPin aria-hidden />}
        title={title}
        message={message}
        actions={
          <>
            <ButtonLink to={paths.vocabulary}>Go to Vocabulary</ButtonLink>
            <ButtonLink to={paths.conversations} variant="secondary">
              Go to Conversations
            </ButtonLink>
          </>
        }
      />
    </PageContainer>
  );
}

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <NotFoundPage
      comingSoon
      title={`${title} is coming soon`}
      message="We are still building this place. Try the Bedroom for now!"
    />
  );
}
