import { ResponsivePicture } from '@/components/common/ResponsivePicture';
import { BACKGROUNDS } from '@/config/assets';
import { FILLS } from '@/components/layout/wordmarkFills';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ProfileSetupForm } from './ProfileSetupForm';

/** Word filled with one of the logo's gradients. */
function GradientWord({ fill, children }: { fill: string; children: string }) {
  return (
    <span
      className="bg-clip-text text-transparent [-webkit-background-clip:text]"
      style={{ backgroundImage: fill }}
    >
      {children}
    </span>
  );
}

/**
 * Screen 01 — First-time Profile Setup (`/setup`): the form card over the artwork, right-aligned on
 * desktop/tablet and centred on phones (spec §2.1, §6).
 */
export function ProfileSetupPage() {
  useDocumentTitle('Create your profile');

  return (
    <div className="relative min-h-dvh overflow-hidden bg-sky-100">
      <ResponsivePicture
        desktop={BACKGROUNDS.setup.desktop}
        mobile={BACKGROUNDS.setup.mobile}
        alt=""
        className="absolute inset-0 block"
        imgClassName="h-full w-full object-cover"
        priority
      />

      <main className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-8 md:justify-end md:px-[5vw] md:py-10">
        <div className="w-full max-w-[36rem] animate-pop-in">
          <div className="rounded-[1.25rem] bg-white/95 p-6 shadow-lift backdrop-blur sm:p-9">
            <h1 className="font-brand leading-tight font-extrabold">
              <span className="text-lg font-bold text-navy-700 sm:text-xl">Welcome to</span>{' '}
              <span className="text-[1.75rem] tracking-[-0.02em] sm:text-[2.25rem]">
                <GradientWord fill={FILLS.dark.village}>Village</GradientWord>{' '}
                <GradientWord fill={FILLS.dark.to}>to</GradientWord>{' '}
                <GradientWord fill={FILLS.dark.world}>World</GradientWord>
              </span>
            </h1>
            <p className="mt-1 mb-6 text-base font-medium text-navy-600 sm:text-lg">
              Let’s set up your learning profile.
            </p>
            <ProfileSetupForm />
          </div>
        </div>
      </main>
    </div>
  );
}
