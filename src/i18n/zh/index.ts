import { common } from './common';
import { conversation } from './conversation';
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
  speaking,
  profile,
} as const;

export const zh: Readonly<Record<string, string>> = Object.assign({}, ...Object.values(zhAreas));
