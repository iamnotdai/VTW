/** Route builders (spec §5) — use these instead of hand-writing URLs. */
const seg = (value: string) => encodeURIComponent(value);

export const paths = {
  setup: '/setup',
  home: '/',
  vocabulary: '/vocabulary',
  topic: (sceneId: string) => `/vocabulary/${seg(sceneId)}`,
  flashcards: (sceneId: string) => `/vocabulary/${seg(sceneId)}/flashcards`,
  explore: (sceneId: string) => `/vocabulary/${seg(sceneId)}/explore`,
  quiz: (sceneId: string, wordId: string) => `/vocabulary/${seg(sceneId)}/quiz/${seg(wordId)}`,
  result: (sceneId: string, wordId: string) => `/vocabulary/${seg(sceneId)}/result/${seg(wordId)}`,
  topicConversations: (sceneId: string) => `/vocabulary/${seg(sceneId)}/conversations`,
  conversations: '/conversation',
  conversation: (conversationId: string) => `/conversation/${seg(conversationId)}`,
  conversationVideo: (conversationId: string) => `/conversation/${seg(conversationId)}/video`,
  transcript: (conversationId: string) => `/conversation/${seg(conversationId)}/transcript`,
  practice: (conversationId: string) => `/conversation/${seg(conversationId)}/practice`,
  practiceResult: (conversationId: string) =>
    `/conversation/${seg(conversationId)}/practice/result`,
  settings: '/settings',
} as const;

/**
 * Passed as router `state` so a screen knows where the learner came from and can go BACK
 * (keeping browser history clean) instead of pushing a duplicate entry.
 */
export interface NavigationState {
  from?: 'explore' | 'practice';
}

export function getNavigationState(state: unknown): NavigationState {
  return typeof state === 'object' && state !== null ? (state as NavigationState) : {};
}
