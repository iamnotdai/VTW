import { t } from '@/i18n';
import type { GrammarFormKind, GrammarTime } from '@/types/models';

/** Row headings of the tense chart. */
export function grammarTimeLabel(time: GrammarTime): string {
  switch (time) {
    case 'past':
      return t('Past');
    case 'present':
      return t('Present');
    case 'future':
      return t('Future');
  }
}

export function grammarFormLabel(kind: GrammarFormKind): string {
  switch (kind) {
    case 'affirmative':
      return t('Affirmative');
    case 'negative':
      return t('Negative');
    case 'question':
      return t('Question');
  }
}
