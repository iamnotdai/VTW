# Village to World — notes for AI coding agents

Kids' English-learning web app. Spec: `VILLAGE_TO_WORLD_CODING_SPEC.md` (code comments cite it as
"spec §N"). Visual reference: the 16-screen design board `flow.png` (README explains the deliberate
differences). Team docs: `README.md` (Vietnamese), asset workflow: `docs/asset-pipeline.md`.

## Commands

- `npm run dev` · `npm run build` (tsc -b + vite build) · `npm run preview`
- `npm run lint` (oxlint) · `npm run format` / `format:check` (Prettier + Tailwind class sorting)
- `npm run test:run` (Vitest: tests/unit + tests/components) · `npm run test:e2e` (Playwright, builds first)
- `npm run content:check` after editing anything in `src/data/` or `public/assets/`

## Non-negotiables (from the spec)

- No backend, API keys, login or database. Learner data lives in localStorage and is only accessed
  through `src/lib/storage.ts` repositories (versioned keys `vtw:v1:*`).
- The `/` screen (menu label "Journey", route `paths.home`) content area shows ONLY the picture: no
  buttons, cards or links. The main menu has exactly four entries: Journey, Vocabulary,
  Conversation, Settings. ("Home" is only a vocabulary scene group, e.g. Bedroom.)
- Profile Setup collects name, age group, "can type words", boy/girl picture. Never add upload.
- Progress counts a word only after a CORRECT answer, once. Never hard-code progress.
- `canTypeWords=false` → multiple choice only. Pick the answer mode/options once per question.
- Hotspots are traced contours in the background's pixel space. Never use loose bounding boxes.
  Background and SVG overlay must share one transformed container.
- Every interaction must work with touch (no hover-only actions) and with the keyboard.
- Speech recognition is optional and not a pronunciation score. Always keep Listen & Repeat.
- Don't present placeholder art or sample words as final content.

## Conventions

- React 19 function components, TypeScript strict, `@/` alias = `src/`. Route URLs come from
  `src/app/paths.ts`; tunables live in `src/config/app.ts` (no magic numbers in components).
- Asset paths in JSON start with `/assets/...` and must be rendered through `assetUrl()`.
- Pure logic goes in `src/lib/` with unit tests; screens in `src/features/<area>/pages/`.
- UI copy is English (it's an English course); Vietnamese appears only as content (`meaningVi`, `textVi`).
- Tailwind v4 tokens are in `src/styles/index.css` (`navy` text, `sidebar`, `brand`, `leaf`, `sun`,
  `coral`, `cream`, `mist`, `stone`, `canvas`); font Inter, `font-brand` (Baloo 2) only for the logo.
  There is no tailwind-merge: don't pass a class that conflicts with a component's base display/size
  (use the component's `size`/`variant` props instead).
- Every screen except Journey (`/`) starts with `TopBar` (`components/layout/PageHeader.tsx`). The menu is one
  collapsible sidebar (`components/layout/Sidebar.tsx`) shared by all screens: logo pinned on top,
  a button collapses it to icons only.
