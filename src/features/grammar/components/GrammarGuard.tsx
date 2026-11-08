import { Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { PageContainer, PageTitle, TopBar } from '@/components/layout/PageHeader';
import { useCourse } from '@/hooks/useCourse';
import { t } from '@/i18n';

/**
 * Grammar exists only in the English course (spec §25): in another course its screens show a
 * notice with a way to Settings › Course instead.
 */
export function GrammarGuard({ children }: { children: ReactNode }) {
  const course = useCourse();
  if (course.features.grammar) return children;
  return (
    <>
      <TopBar variant="title">
        <PageTitle title={t('Grammar')} />
      </TopBar>
      <PageContainer width="narrow">
        <EmptyState
          title={t('Grammar is part of the English course')}
          message={t('Choose English in Settings to learn the English tenses.')}
          actions={
            <ButtonLink to={paths.settings} leftIcon={<Settings aria-hidden className="size-5" />}>
              {t('Open Settings')}
            </ButtonLink>
          }
        />
      </PageContainer>
    </>
  );
}
