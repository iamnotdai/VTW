import type { RouteObject } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { ConversationDetailPage } from '@/features/conversation/pages/ConversationDetailPage';
import { ConversationScenesPage } from '@/features/conversation/pages/ConversationScenesPage';
import { ConversationVideoPage } from '@/features/conversation/pages/ConversationVideoPage';
import { SpeakingPracticePage } from '@/features/conversation/pages/SpeakingPracticePage';
import { SpeakingResultPage } from '@/features/conversation/pages/SpeakingResultPage';
import { TranscriptPage } from '@/features/conversation/pages/TranscriptPage';
import { HomePage } from '@/features/home/HomePage';
import { NotFoundPage } from '@/features/misc/NotFoundPage';
import { RouteErrorPage } from '@/features/misc/RouteErrorPage';
import { ProfileSetupPage } from '@/features/onboarding/ProfileSetupPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { ExplorePage } from '@/features/vocabulary/pages/ExplorePage';
import { FlashcardsPage } from '@/features/vocabulary/pages/FlashcardsPage';
import { QuizPage } from '@/features/vocabulary/pages/QuizPage';
import { ResultPage } from '@/features/vocabulary/pages/ResultPage';
import { TopicConversationsPage } from '@/features/vocabulary/pages/TopicConversationsPage';
import { TopicOverviewPage } from '@/features/vocabulary/pages/TopicOverviewPage';
import { VocabularyPage } from '@/features/vocabulary/pages/VocabularyPage';
import { RequireProfile, SetupOnly } from './guards';

/** The 16 screens of spec §5 (numbers in comments). */
export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: 'setup', // 01
        element: (
          <SetupOnly>
            <ProfileSetupPage />
          </SetupOnly>
        ),
      },
      {
        element: (
          <RequireProfile>
            <AppShell />
          </RequireProfile>
        ),
        children: [
          {
            // Errors inside a screen keep the menu visible.
            errorElement: <RouteErrorPage />,
            children: [
              { index: true, element: <HomePage /> }, // 02
              { path: 'vocabulary', element: <VocabularyPage /> }, // 03
              { path: 'vocabulary/:sceneId', element: <TopicOverviewPage /> }, // 04
              { path: 'vocabulary/:sceneId/flashcards', element: <FlashcardsPage /> }, // 05
              { path: 'vocabulary/:sceneId/explore', element: <ExplorePage /> }, // 06
              {
                path: 'vocabulary/:sceneId/quiz/:wordId',
                element: <QuizPage />,
              }, // 07
              {
                path: 'vocabulary/:sceneId/result/:wordId',
                element: <ResultPage />,
              }, // 08
              { path: 'vocabulary/:sceneId/conversations', element: <TopicConversationsPage /> }, // 09
              {
                path: 'conversation/:conversationId/video', // 10
                element: <ConversationVideoPage />,
              },
              {
                path: 'conversation/:conversationId/transcript', // 11
                element: <TranscriptPage />,
              },
              {
                path: 'conversation/:conversationId/practice', // 12
                element: <SpeakingPracticePage />,
              },
              {
                path: 'conversation/:conversationId/practice/result', // 13
                element: <SpeakingResultPage />,
              },
              { path: 'conversation', element: <ConversationScenesPage /> }, // 14
              { path: 'conversation/:conversationId', element: <ConversationDetailPage /> }, // 15
              { path: 'settings', element: <SettingsPage /> }, // 16
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
];
