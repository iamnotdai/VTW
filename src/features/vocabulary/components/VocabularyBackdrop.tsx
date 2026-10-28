import { VOCABULARY_BACKGROUND } from '@/config/assets';
import { assetUrl } from '@/lib/assets';

/**
 * Soft artwork behind the Vocabulary screens. Render it first inside a `relative` parent; later
 * siblings need their own `relative` to paint above it.
 */
export function VocabularyBackdrop() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 bg-cover bg-top bg-no-repeat opacity-80"
      style={{ backgroundImage: `url(${assetUrl(VOCABULARY_BACKGROUND)})` }}
    />
  );
}
