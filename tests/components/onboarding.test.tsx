import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '@/lib/storage';
import { renderApp, seedProfile, seedProgress } from '../helpers';

describe('Profile Setup (screen 01)', () => {
  it('sends a first-time learner to Setup', async () => {
    const { router } = renderApp('/vocabulary');
    expect(
      await screen.findByRole('heading', { name: 'Welcome to Village to World' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/setup');
  });

  it('has no upload field or upload button', async () => {
    const { container } = renderApp('/setup');
    await screen.findByRole('heading', { name: 'Welcome to Village to World' });
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(screen.queryByText(/upload/i)).toBeNull();
  });

  it('shows friendly errors and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    renderApp('/setup');
    await user.click(await screen.findByRole('button', { name: 'Start My Journey' }));
    expect(screen.getByText('Please enter your name.')).toBeInTheDocument();
    expect(screen.getByText('Please choose your age group.')).toBeInTheDocument();
    expect(screen.getByText('Please choose one answer.')).toBeInTheDocument();
    expect(screen.getByText('Please choose your character.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Full Name' })).toHaveFocus();
  });

  it('saves the profile and opens Home', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/setup');
    await user.type(await screen.findByRole('textbox', { name: 'Full Name' }), '  Lily  ');
    await user.click(screen.getByRole('radio', { name: '6–8' }));
    await user.click(screen.getByRole('radio', { name: /Not yet, I prefer choosing answers/ }));
    await user.click(screen.getByRole('radio', { name: 'Girl' }));
    await user.click(screen.getByRole('button', { name: 'Start My Journey' }));

    expect(router.state.location.pathname).toBe('/');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.profile)!);
    expect(stored).toMatchObject({
      fullName: 'Lily',
      ageGroup: '6-8',
      avatar: 'girl',
      canTypeWords: false,
    });
  });

  it('sends a returning learner straight Home', async () => {
    seedProfile();
    const { router } = renderApp('/setup');
    await screen.findAllByRole('navigation', { name: 'Main' });
    expect(router.state.location.pathname).toBe('/');
  });
});

describe('App shell and Journey (screen 02)', () => {
  it('has exactly four menu entries', async () => {
    seedProfile();
    renderApp('/');
    const menus = await screen.findAllByRole('navigation', { name: 'Main' });
    for (const menu of menus) {
      expect(
        within(menu)
          .getAllByRole('link')
          .map((link) => link.textContent),
      ).toEqual(['Journey', 'Vocabulary', 'Conversation', 'Settings']);
    }
  });

  it('shows only the picture in the Home content area — no buttons, links or cards', async () => {
    seedProfile();
    renderApp('/');
    const main = await screen.findByRole('main');
    expect(within(main).getByRole('img')).toBeInTheDocument();
    expect(within(main).queryAllByRole('link')).toHaveLength(0);
    expect(within(main).queryAllByRole('button')).toHaveLength(0);
  });

  it('shows the learner and their level in the sidebar', async () => {
    seedProfile({ fullName: 'Ben', avatar: 'boy' });
    // 10 learned words → Level 2 (LEVEL_CONFIG.wordsPerLevel).
    seedProgress({
      completedWordIdsByScene: {
        bedroom: [
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
        ],
      },
    });
    renderApp('/');
    const sidebar = await screen.findByRole('complementary');
    expect(within(sidebar).getAllByText('Ben').length).toBeGreaterThan(0);
    expect(within(sidebar).getByText('Level 2')).toBeInTheDocument();
  });
});

describe('Settings (screen 16)', () => {
  it('changes the picture with the boy / girl choice — never an upload', async () => {
    const user = userEvent.setup();
    seedProfile({ avatar: 'girl' });
    const { container } = renderApp('/settings');
    await user.click(await screen.findByRole('button', { name: 'Change Photo' }));
    expect(container.querySelector('input[type="file"]')).toBeNull();
    await user.click(screen.getByRole('radio', { name: 'Boy' }));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(screen.getByText('Your changes are saved.')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.profile)!).avatar).toBe('boy');
  });
});
