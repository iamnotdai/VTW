import { common } from './common';
import { conversation } from './conversation';
import { grammar } from './grammar';
import { profile } from './profile';
import { pronunciation } from './pronunciation';
import { speaking } from './speaking';
import { vocabulary } from './vocabulary';

/** Chinese UI copy, keyed by the English source text. One file per area. */
export const zhAreas = {
  common,
  vocabulary,
  pronunciation,
  conversation,
  grammar,
  speaking,
  profile,
} as const;

export const zh: Readonly<Record<string, string>> = Object.assign({}, ...Object.values(zhAreas));
