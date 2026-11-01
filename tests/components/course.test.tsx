import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { STORAGE_KEYS } from '@/lib/storage';
import { renderApp, seedProfile, seedProgress, seedSettings } from '../helpers';

/* `resetAppState` (after every test) clears storage, which also brings the course back to English. */

const savedSettings = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)!);
const storedEnglishProgress = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.progress)!);

const TEN_WORDS = [
  'bed',
  'lamp',
  'pillow',
  'desk',
  'chair',
  'turtle',
  'rug',
  'book',
  'laptop',
  'clock',
];

/** Link labels of each main menu (sidebar and bottom navigation). */
async function menuLabels(name: string) {
  const menus = await screen.findAllByRole('navigation', { name });
  return menus.map((menu) =>
    within(menu)
      .getAllByRole('link')
      .map((link) => link.textContent),
  );
}

// `t()` warns about copy that has no Chinese translation yet.
let warn: MockInstance<typeof console.warn>;
const missingCopy = () =>
  warn.mock.calls.map(([message]) => String(message)).filter((m) => m.startsWith('[i18n]'));

beforeEach(() => {
  warn = vi.spyOn(console, 'warn');
});

afterEach(() => {
  warn.mockRestore();
});

describe('Settings › Course', () => {
  it('switches the whole app to Chinese at once, with its own progress', async () => {
    const user = userEvent.setup();
    seedProfile();
    seedProgress({ completedWordIdsByScene: { bedroom: TEN_WORDS } });
    renderApp('/settings');

    expect(await screen.findByRole('radio', { name: /English/ })).toBeChecked();
    expect(within(screen.getByRole('complementary')).getByText('Level 2')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /中文/ }));

    expect(savedSettings().course).toBe('zh');
    expect(document.documentElement.lang).toBe('zh-CN');
    for (const labels of await menuLabels('主菜单')) {
      expect(labels).toEqual(['旅程', '词汇', '对话', '设置']);
    }
    expect(screen.getByRole('heading', { level: 1, name: '设置' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /中文/ })).toBeChecked();
    // The Chinese course starts from zero; the English words stay learned.
    expect(within(screen.getByRole('complementary')).getByText('等级 1')).toBeInTheDocument();
    expect(storedEnglishProgress().completedWordIdsByScene.bedroom).toEqual(TEN_WORDS);
    expect(missingCopy()).toEqual([]);

    await user.click(screen.getByRole('radio', { name: /English/ }));
    expect(savedSettings().course).toBe('en');
    for (const labels of await menuLabels('Main')) {
      expect(labels).toEqual(['Journey', 'Vocabulary', 'Conversation', 'Settings']);
    }
    expect(within(screen.getByRole('complementary')).getByText('Level 2')).toBeInTheDocument();
  });

  it('works with the keyboard and keeps the focus on the picker after the switch', async () => {
    const user = userEvent.setup();
    seedProfile();
    renderApp('/settings');

    (await screen.findByRole('radio', { name: /English/ })).focus();
    await user.keyboard('{ArrowRight}');

    expect(savedSettings().course).toBe('zh');
    expect(screen.getByRole('radio', { name: /中文/ })).toHaveFocus();
  });
});

describe('Profile Setup › I want to learn', () => {
  it('sets up the profile in Chinese', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/setup');
    await user.click(await screen.findByRole('radio', { name: /中文/ }));

    expect(screen.getByRole('heading', { name: '欢迎来到 Village to World' })).toBeInTheDocument();
    expect(document.title).toBe('创建你的资料 · Village to World');
    await user.click(screen.getByRole('button', { name: '开始我的旅程' }));
    expect(screen.getByText('请输入你的名字。')).toBeInTheDocument();
    expect(screen.getByText('请选择你的年龄。')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: '你的名字' }), '小明');
    await user.click(screen.getByRole('radio', { name: '6–8' }));
    await user.click(screen.getByRole('radio', { name: '还不会，我想选答案' }));
    await user.click(screen.getByRole('radio', { name: '男孩' }));
    expect(missingCopy()).toEqual([]);
    await user.click(screen.getByRole('button', { name: '开始我的旅程' }));

    expect(router.state.location.pathname).toBe('/');
    expect(savedSettings().course).toBe('zh');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.profile)!)).toMatchObject({
      fullName: '小明',
      ageGroup: '6-8',
      avatar: 'boy',
      canTypeWords: false,
    });
    for (const labels of await menuLabels('主菜单')) {
      expect(labels).toEqual(['旅程', '词汇', '对话', '设置']);
    }
  });
});

describe('Journey in the Chinese course', () => {
  it('uses the Chinese slogan and copy', async () => {
    seedProfile();
    seedSettings({ course: 'zh' });
    renderApp('/');

    expect(
      await screen.findByRole('heading', { name: 'Village to World — 探索生活，学习中文。' }),
    ).toBeInTheDocument();
    expect(document.title).toBe('旅程 · Village to World');
    expect(screen.getByRole('img', { name: /小村庄/ })).toBeInTheDocument();
    expect(missingCopy()).toEqual([]);
  });
});
