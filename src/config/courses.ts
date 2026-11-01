import type { CourseId } from '@/types/models';
import { QUIZ_PROMPTS } from './app';

export interface QuizPromptConfig {
  id: string;
  text: string;
  /** Chinese course. */
  pinyin?: string;
  textVi: string;
}

export interface CourseConfig {
  id: CourseId;
  /** Name of the language in itself, e.g. "中文". */
  label: string;
  /** Vietnamese name shown under `label` in the course picker, e.g. "Tiếng Trung". */
  labelVi: string;
  /** `lang` of the course text (HTML attribute, speech synthesis and recognition). */
  lang: string;
  /** Browser voices of these languages are offered in Settings, in this order (lower-case prefixes). */
  voiceLangs: readonly string[];
  /** Spoken with when the device has none of `voiceLangs`: better than silence. */
  fallbackVoiceLangs: readonly string[];
  slogan: string;
  /** Questions asked on a quiz card, see `pickQuizPrompt`. */
  quizPrompts: readonly QuizPromptConfig[];
}

const QUIZ_PROMPTS_ZH = [
  { id: 'what-object', text: '这是什么？', pinyin: 'Zhè shì shén me?', textVi: 'Đây là cái gì?' },
  {
    id: 'know-what',
    text: '你知道这是什么吗？',
    pinyin: 'Nǐ zhī dao zhè shì shén me ma?',
    textVi: 'Bạn có biết đây là gì không?',
  },
  {
    id: 'tell-what',
    text: '你能告诉我这是什么吗？',
    pinyin: 'Nǐ néng gào su wǒ zhè shì shén me ma?',
    textVi: 'Bạn có thể cho biết đây là gì không?',
  },
  {
    id: 'called-chinese',
    text: '这个用中文怎么说？',
    pinyin: 'Zhè ge yòng Zhōng wén zěn me shuō?',
    textVi: 'Cái này tiếng Trung nói thế nào?',
  },
  {
    id: 'call-this',
    text: '这个叫什么？',
    pinyin: 'Zhè ge jiào shén me?',
    textVi: 'Cái này gọi là gì?',
  },
  {
    id: 'see-picture',
    text: '你在图片里看到了什么？',
    pinyin: 'Nǐ zài tú piàn li kàn dào le shén me?',
    textVi: 'Bạn nhìn thấy gì trong bức hình?',
  },
  {
    id: 'know-name',
    text: '你知道这个东西的名字吗？',
    pinyin: 'Nǐ zhī dao zhè ge dōng xi de míng zi ma?',
    textVi: 'Bạn có biết tên của đồ vật này không?',
  },
  {
    id: 'chinese-word',
    text: '这个东西的中文是什么？',
    pinyin: 'Zhè ge dōng xi de Zhōng wén shì shén me?',
    textVi: 'Đồ vật này tiếng Trung là gì?',
  },
] as const satisfies readonly QuizPromptConfig[];

/**
 * @extension The languages a learner can study (Settings › Course). Pictures, hotspots and word ids
 * are shared; words, sentences, conversations and the UI copy come from each course.
 */
export const COURSES: Readonly<Record<CourseId, CourseConfig>> = {
  en: {
    id: 'en',
    label: 'English',
    labelVi: 'Tiếng Anh',
    lang: 'en-US',
    voiceLangs: ['en-us'],
    fallbackVoiceLangs: ['en'],
    slogan: 'Explore Life. Learn English.',
    quizPrompts: QUIZ_PROMPTS,
  },
  zh: {
    id: 'zh',
    label: '中文',
    labelVi: 'Tiếng Trung',
    lang: 'zh-CN',
    // Mainland Mandarin first, then Taiwan Mandarin. Never zh-HK: that voice speaks Cantonese.
    voiceLangs: ['zh-cn', 'cmn-hans', 'zh-tw', 'cmn-hant'],
    fallbackVoiceLangs: [],
    slogan: '探索生活，学习中文。',
    quizPrompts: QUIZ_PROMPTS_ZH,
  },
};

export const COURSE_IDS = Object.keys(COURSES) as CourseId[];

export const isCourseId = (value: unknown): value is CourseId =>
  typeof value === 'string' && value in COURSES;
