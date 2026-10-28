import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useProfileStore } from '@/stores/profileStore';
import { paths } from './paths';

/** Without a valid local profile, every screen sends the learner to Profile Setup (spec §4). */
export function RequireProfile({ children }: { children: ReactNode }) {
  const hasProfile = useProfileStore((state) => state.profile !== null);
  const location = useLocation();
  if (!hasProfile) return <Navigate to={paths.setup} replace state={{ from: location.pathname }} />;
  return children;
}

/** Returning learners with a valid profile go straight to Home (spec §6 "Người dùng quay lại"). */
export function SetupOnly({ children }: { children: ReactNode }) {
  const hasProfile = useProfileStore((state) => state.profile !== null);
  if (hasProfile) return <Navigate to={paths.home} replace />;
  return children;
}
