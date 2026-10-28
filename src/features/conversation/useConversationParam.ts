import { useParams } from 'react-router';
import { getConversation, getScene } from '@/data/content';
import type { Conversation, Scene } from '@/types/models';

/** Reads `:conversationId`; both menus (Vocabulary and Conversation) share the same data. */
export function useConversationParam(): { conversation: Conversation; scene: Scene } | null {
  const { conversationId } = useParams();
  const conversation = getConversation(conversationId);
  const scene = conversation ? getScene(conversation.sceneId) : undefined;
  return conversation && scene ? { conversation, scene } : null;
}
