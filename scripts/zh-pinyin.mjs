/**
 * Fills in missing pinyin of the Chinese course (src/data/zh/words.json, conversations.json):
 * example sentences, dialogue lines and practice questions. Existing pinyin is kept, so a reviewer's
 * corrections are never overwritten (`--force` regenerates everything). Word pinyin ("táidēng") is
 * written by hand, and sentences read the course words the same way.
 *
 *   npm run content:pinyin            # fill missing pinyin
 *   npm run content:pinyin -- --force # regenerate all sentence pinyin
 *
 * Then run `npm run content:check`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { customPinyin, pinyin } from 'pinyin-pro';

const ZH = fileURLToPath(new URL('../src/data/zh/', import.meta.url));
const force = process.argv.includes('--force');

/*
 * Everyday readings the dictionary gets wrong: neutral tones, erhua ("r" joins the syllable before)
 * and the characters' names. Add a word here when a reviewer corrects its reading.
 */
const READINGS = {
  晚上: 'wǎn shang',
  早上: 'zǎo shang',
  东西: 'dōng xi',
  衣服: 'yī fu',
  喜欢: 'xǐ huan',
  漂亮: 'piào liang',
  舒服: 'shū fu',
  暖和: 'nuǎn huo',
  干净: 'gān jing',
  休息: 'xiū xi',
  知道: 'zhī dao',
  认识: 'rèn shi',
  告诉: 'gào su',
  朋友: 'péng you',
  时候: 'shí hou',
  地方: 'dì fang',
  窗户: 'chuāng hu',
  眼睛: 'yǎn jing',
  头发: 'tóu fa',
  多少: 'duō shao',
  意思: 'yì si',
  客气: 'kè qi',
  名字: 'míng zi',
  哪儿: 'nǎ r',
  这儿: 'zhè r',
  那儿: 'nà r',
  一会儿: 'yí huì r',
  一点儿: 'yì diǎn r',
  玩儿: 'wán r',
  鞋子: 'xié zi',
  管子: 'guǎn zi',
  花儿: 'huā r',
  找不到: 'zhǎo bu dào',
  看不见: 'kàn bu jiàn',
};

/** The characters' names, written with capitals. */
const NAMES = {
  莉莉: ['Lì', 'li'],
  小本: ['Xiǎo', 'Běn'],
  波波: ['Bō', 'bo'],
};

const PUNCTUATION = {
  '，': ',',
  '。': '.',
  '？': '?',
  '！': '!',
  '：': ':',
  '；': ';',
  '、': ',',
  '”': '”',
  '’': '’',
  '）': ')',
  '…': '…',
  '—': '—',
};
const OPENING = { '“': '“', '‘': '‘', '（': '(' };
const SENTENCE_END = /[.?!]$/;

const capitalize = (syllable) => syllable.charAt(0).toUpperCase() + syllable.slice(1);

/** "莉莉，这是你的卧室吗？" → "Lì li, zhè shì nǐ de wò shì ma?" (one syllable per character). */
export function sentencePinyin(text) {
  const chars = [...text];
  const syllables = pinyin(text, { type: 'array', toneType: 'symbol' });
  if (syllables.length !== chars.length) throw new Error(`Cannot align pinyin of "${text}"`);

  for (const [name, written] of Object.entries(NAMES)) {
    for (let at = text.indexOf(name); at !== -1; at = text.indexOf(name, at + 1)) {
      const start = [...text.slice(0, at)].length;
      written.forEach((syllable, offset) => (syllables[start + offset] = syllable));
    }
  }

  let out = '';
  let glue = true; // no space before the next syllable (start, after an opening quote)
  let sentenceStart = true;
  chars.forEach((char, index) => {
    const syllable = syllables[index];
    if (char in PUNCTUATION) {
      out += PUNCTUATION[char];
      if (SENTENCE_END.test(PUNCTUATION[char])) sentenceStart = true;
      return;
    }
    if (char in OPENING) {
      out += `${out ? ' ' : ''}${OPENING[char]}`;
      glue = true;
      sentenceStart = true;
      return;
    }
    if (/\s/.test(char)) return;
    if (char === '儿' && syllable === 'r') {
      out += 'r';
      return;
    }
    const word = sentenceStart ? capitalize(syllable) : syllable;
    out += `${glue ? '' : ' '}${word}`;
    glue = false;
    sentenceStart = false;
  });
  return out;
}

const fill = (object, field, text) => {
  if (!text) return 0;
  if (object[field] && !force) return 0;
  object[field] = sentencePinyin(text);
  return 1;
};

const readJson = (file) => JSON.parse(readFileSync(ZH + file, 'utf8'));
const writeJson = (file, value) => writeFileSync(ZH + file, `${JSON.stringify(value, null, 2)}\n`);

const toneless = (value) => value.normalize('NFD').replace(/\p{M}/gu, '');

/**
 * Splits a word's hand-written pinyin into one syllable per character, using the dictionary's
 * syllables as a guide: "xǐfàshuǐ" + [xǐ, fā, shuǐ] → "xǐ fà shuǐ". `null` when the letters differ.
 */
function wordReading(word) {
  const written = (word.pinyin ?? '').replace(/[\s']/g, '').normalize('NFC');
  const guess = pinyin(word.text, { type: 'array', toneType: 'symbol' });
  if (!written || toneless(written) !== toneless(guess.join(''))) return null;
  let at = 0;
  return guess
    .map((syllable) => {
      const length = syllable.normalize('NFC').length;
      const part = written.slice(at, at + length);
      at += length;
      return part;
    })
    .join(' ');
}

const words = readJson('words.json');
const conversations = readJson('conversations.json');
let filled = 0;

const wordReadings = {};
for (const word of Object.values(words)) {
  const reading = wordReading(word);
  if (reading) wordReadings[word.text] = reading;
  else console.log(`check word "${word.id}": cannot match ${word.text} with "${word.pinyin}"`);
}
customPinyin({ ...READINGS, ...wordReadings });

for (const word of Object.values(words)) {
  for (const example of word.examples ?? []) filled += fill(example, 'pinyin', example.text);
}

for (const conversation of conversations) {
  for (const line of conversation.lines ?? []) filled += fill(line, 'pinyin', line.text);
  for (const question of conversation.practiceQuestions ?? []) {
    filled += fill(question, 'promptPinyin', question.prompt);
    filled += fill(question, 'suggestedAnswerPinyin', question.suggestedAnswer);
  }
}

writeJson('words.json', words);
writeJson('conversations.json', conversations);
console.log(`Pinyin written for ${filled} sentence(s).`);
