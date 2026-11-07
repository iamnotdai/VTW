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
  /** @extension Word Speaking after the flashcards (spec §7.7). */
  wordSpeaking: (sceneId: string) => `/vocabulary/${seg(sceneId)}/speaking`,
  topicConversations: (sceneId: string) => `/vocabulary/${seg(sceneId)}/conversations`,
  /** @extension Pronunciation menu (spec §24). */
  pronunciation: '/pronunciation',
  /** @extension The same Word Speaking screen, opened from the Pronunciation menu (spec §7.7). */
  pronunciationScene: (sceneId: string) => `/pronunciation/scene/${seg(sceneId)}`,
  /** @extension The American English IPA chart (spec §24.2). */
  ipaSounds: '/pronunciation/sounds',
  ipaSound: (soundId: string) => `/pronunciation/sounds/${seg(soundId)}`,
  ipaSoundSpeaking: (soundId: string) => `/pronunciation/sounds/${seg(soundId)}/speaking`,
  conversations: '/conversation',
  conversationScene: (sceneId: string) => `/conversation/scene/${seg(sceneId)}`,
  conversation: (conversationId: string) => `/conversation/${seg(conversationId)}`,
  conversationVideo: (conversationId: string) => `/conversation/${seg(conversationId)}/video`,
  transcript: (conversationId: string) => `/conversation/${seg(conversationId)}/transcript`,
  practice: (conversationId: string) => `/conversation/${seg(conversationId)}/practice`,
  practiceResult: (conversationId: string) =>
    `/conversation/${seg(conversationId)}/practice/result`,
  /** @extension Role-play (spec §9.5); `speakerId` = the character the learner plays. */
  rolePlay: (conversationId: string, speakerId?: string) =>
    `/conversation/${seg(conversationId)}/role-play${speakerId ? `?as=${seg(speakerId)}` : ''}`,
  /** @extension Fill in the blanks, for learners who can type (spec §9.6). */
  fillBlanks: (conversationId: string) => `/conversation/${seg(conversationId)}/fill-blanks`,
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
