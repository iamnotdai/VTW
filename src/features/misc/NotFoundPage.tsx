import { Hourglass, MapPin } from 'lucide-react';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { PageContainer } from '@/components/layout/PageHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';

/** Shown for unknown URLs, unknown ids, and scenes that are not ready yet. */
export function NotFoundPage({
  title = t('We can’t find this place'),
  message = t('This page does not exist. Let’s go back and keep exploring!'),
  comingSoon = false,
}: {
  title?: string;
  message?: string;
  comingSoon?: boolean;
}) {
  useDocumentTitle(comingSoon ? t('Coming soon') : t('Not found'));
  return (
    <PageContainer className="flex flex-1 items-center">
      <EmptyState
        icon={comingSoon ? <Hourglass aria-hidden /> : <MapPin aria-hidden />}
        title={title}
        message={message}
        actions={
          <>
            <ButtonLink to={paths.vocabulary}>{t('Go to Vocabulary')}</ButtonLink>
            <ButtonLink to={paths.conversations} variant="secondary">
              {t('Go to Conversations')}
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
      title={t('{title} is coming soon', { title })}
      message={t('We are still building this place. Try the Bedroom for now!')}
    />
  );
}
