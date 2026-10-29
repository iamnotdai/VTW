import { Navigate } from 'react-router';
import { paths } from '@/app/paths';
import { PageContainer, PageTitle, TopBar } from '@/components/layout/PageHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useProfileStore } from '@/stores/profileStore';
import { SettingsForm } from './SettingsForm';
import { VoiceSettings } from './VoiceSettings';

/** Screen 16 — Settings (`/settings`). */
export function SettingsPage() {
  useDocumentTitle('Settings');
  const profile = useProfileStore((state) => state.profile);
  if (!profile) return <Navigate to={paths.setup} replace />;

  return (
    <>
      <TopBar variant="title">
        <PageTitle title="Settings" description="Manage your profile and learning preferences." />
      </TopBar>
      <PageContainer width="full" className="flex max-w-[40rem] flex-col gap-8 lg:mx-0">
        <VoiceSettings />
        <SettingsForm profile={profile} />
      </PageContainer>
    </>
  );
}
