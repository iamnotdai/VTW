import { Navigate } from 'react-router';
import { paths } from '@/app/paths';
import { PageContainer, PageTitle, TopBar } from '@/components/layout/PageHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import { useProfileStore } from '@/stores/profileStore';
import { CoursePicker } from './CoursePicker';
import { SettingsForm } from './SettingsForm';
import { VoiceSettings } from './VoiceSettings';

/** Screen 16 — Settings (`/settings`). */
export function SettingsPage() {
  useDocumentTitle(t('Settings'));
  const profile = useProfileStore((state) => state.profile);
  if (!profile) return <Navigate to={paths.setup} replace />;

  return (
    <>
      <TopBar variant="title">
        <PageTitle
          title={t('Settings')}
          description={t('Manage your profile and learning preferences.')}
        />
      </TopBar>
      <PageContainer width="full" className="flex max-w-[40rem] flex-col gap-8 lg:mx-0">
        {/* First: switching course remounts the screen, which drops unsaved profile edits. */}
        <CoursePicker />
        <VoiceSettings />
        <SettingsForm profile={profile} />
      </PageContainer>
    </>
  );
}
