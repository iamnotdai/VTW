import { common } from './common';
import { conversation } from './conversation';
import { profile } from './profile';
import { vocabulary } from './vocabulary';

/** Chinese UI copy, keyed by the English source text. One file per area. */
export const zhAreas = { common, vocabulary, conversation, profile } as const;

export const zh: Readonly<Record<string, string>> = Object.assign({}, ...Object.values(zhAreas));
