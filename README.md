# Village to World

> **Explore Life. Learn English.**

Web app học **tiếng Anh** và **tiếng Trung** cho mọi lứa tuổi (ưu tiên trẻ em và người mới bắt đầu):
khám phá các khung cảnh phong cách _Cozy 3D Village_, chạm vào đồ vật để học từ, xem hội thoại và luyện
nói. Nghĩa và bản dịch luôn là tiếng Việt. Ứng dụng chạy
**hoàn toàn trên trình duyệt**: không backend, không database; hồ sơ và tiến độ lưu trong
`localStorage` của thiết bị.

Đặc tả gốc: [VILLAGE_TO_WORLD_CODING_SPEC.md](VILLAGE_TO_WORLD_CODING_SPEC.md) (viết tắt "spec §…" trong code).

---

## Trạng thái hiện tại

Bộ khung đã chạy được **hành trình MVP của spec §22 từ đầu đến cuối** cho scene Bedroom, Bathroom, Living
Room, Kitchen, House Exterior và Dining Room:

- Đủ **16 màn hình** (bảng route bên dưới), layout responsive: sidebar trên desktop, rail icon
  trên tablet, bottom navigation trên mobile.
- Profile Setup (không có upload ảnh), Journey (trước là Home) chỉ có ảnh, Settings áp dụng ngay cho câu hỏi tiếp theo.
- Vocabulary: danh sách scene theo nhóm + % đã học, Topic Overview, Flashcards, Explore (hover, chạm
  hai bước, bàn phím, zoom/pan/pinch, toàn màn hình), Quiz gõ/trắc nghiệm theo `canTypeWords`,
  Answer/Word Detail, Objects Found.
- Conversation: danh sách theo scene, chi tiết, video (có fallback), transcript (phát từng câu,
  dịch tĩnh), Speaking Practice (SpeechRecognition + fallback _Listen & Repeat_), Speaking Result.
- **Hai khóa học**: Tiếng Anh và Tiếng Trung (chọn ở đầu Profile Setup hoặc trong Settings). Hai khóa
  dùng chung ảnh và hotspot; từ, câu, hội thoại, giọng đọc và **toàn bộ giao diện** đổi theo khóa;
  tiến độ lưu riêng từng khóa. Xem mục [Khóa học](#khóa-học-tiếng-anh--tiếng-trung).
- Lưu trữ qua lớp repository có versioned key, migration, fallback bộ nhớ khi trình duyệt chặn storage.
- Giao diện dựng theo **bản thiết kế `flow.png`** (16 màn): màu, font, logo chữ, menu (avatar + Level
  ở dưới sidebar), thẻ, nút… Xem mục [Giao diện theo bản thiết kế](#giao-diện-theo-bản-thiết-kế-flowpng).
- Test tự động: **157 test Vitest** (122 unit + 35 component, gồm kiểm tra nội dung JSON, asset và bản dịch giao diện) và
  **10 kịch bản E2E Playwright** (có một kịch bản khóa tiếng Trung), mỗi kịch bản chạy trên 2 thiết bị (desktop dùng chuột, Pixel 7 cảm ứng).

> ⚠️ **Toàn bộ hình ảnh hiện tại là PLACEHOLDER** (SVG vẽ tạm cho môi trường dev): logo, avatar,
> nền Setup/Home, scene Bedroom, sprite đồ vật, thumbnail các scene "Coming soon". 24 từ và 10 hội
> thoại của Bedroom, Bathroom, Kitchen và House Exterior, 30 từ và 10 hội thoại của Living Room và Dining Room là **nội dung mẫu**, cần
> giáo viên/biên tập duyệt lại trước khi phát
> hành. Nội dung **khóa tiếng Trung** (156 từ, pinyin, câu ví dụ, 60 hội thoại) là **bản nháp do AI soạn**,
> pinyin câu sinh tự động: bắt buộc người bản ngữ/giáo viên tiếng Trung duyệt trước khi phát hành. Chưa có
> file video và audio thu âm: app dùng giọng đọc của trình duyệt (Web Speech) làm fallback.

## Bắt đầu nhanh

Yêu cầu: **Node.js ≥ 22** (khuyến nghị 24), npm ≥ 10.

```bash
npm install
npm run dev              # http://localhost:5173
```

Lần đầu mở app sẽ vào màn **Setup**. Muốn làm lại từ đầu: DevTools → Application → Local Storage →
xoá các key `vtw:v1:*`.

Chạy test E2E lần đầu cần cài trình duyệt cho Playwright:

```bash
npx playwright install chromium
npm run test:e2e
```

## Scripts

| Lệnh                     | Việc                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| `npm run dev`            | Dev server (Vite)                                                   |
| `npm run build`          | Type-check (`tsc -b`) + build production vào `dist/`                |
| `npm run preview`        | Chạy thử bản build                                                  |
| `npm run lint`           | oxlint (gồm rule React Hooks, jsx-a11y, Vitest)                     |
| `npm run format`         | Prettier (tự sắp xếp class Tailwind)                                |
| `npm run format:check`   | Kiểm tra format (dùng trong CI)                                     |
| `npm run typecheck`      | Chỉ kiểm tra TypeScript                                             |
| `npm test`               | Vitest watch mode                                                   |
| `npm run test:run`       | Unit + component test một lần                                       |
| `npm run test:e2e`       | Playwright (tự build và chạy `vite preview`)                        |
| `npm run content:check`  | Kiểm tra dữ liệu JSON: tham chiếu, trùng id, hotspot, asset tồn tại |
| `npm run content:pinyin` | Điền pinyin còn thiếu cho câu của khóa tiếng Trung (`src/data/zh/`) |

## Công nghệ

| Lớp           | Công nghệ                                                                |
| ------------- | ------------------------------------------------------------------------ |
| UI            | React 19 + TypeScript 6 + Vite 8                                         |
| Style         | Tailwind CSS 4 (design token trong `src/styles/index.css`), lucide-react |
| Font          | Inter (chữ giao diện) + Baloo 2 (logo chữ), self-host, có tiếng Việt     |
| Routing       | React Router 8 (data router, browser hoặc hash, xem phần Deploy)         |
| State         | Zustand 5 (profile, progress, settings, audio, phiên quiz/speaking)      |
| Dữ liệu       | JSON tĩnh trong `src/data/`                                              |
| Lưu trữ       | `localStorage` qua `src/lib/storage.ts` (repository + migration)         |
| Âm thanh      | File audio nếu có, fallback `speechSynthesis`                            |
| Nhận diện nói | `SpeechRecognition` / `webkitSpeechRecognition` nếu trình duyệt hỗ trợ   |
| Test          | Vitest 5 + Testing Library (jsdom) + Playwright                          |
| Chất lượng    | oxlint + Prettier, GitHub Actions                                        |

## Cấu trúc thư mục

```text
├── public/
│   ├── _redirects                 # SPA fallback cho Netlify
│   └── assets/
│       ├── branding/              # logo, avatar-boy, avatar-girl
│       ├── characters/            # chân dung người nói trong hội thoại (Mom, Dad)
│       ├── backgrounds/           # setup/home × desktop/mobile
│       └── scenes/<sceneId>/      # <id>-desktop.webp, <id>-mobile.webp, objects/NN_<wordId>.webp
├── src/
│   ├── app/                       # App, router, routes (16 màn), guards, paths, providers
│   ├── components/
│   │   ├── common/                # Button, IconButton, AudioButton, ProgressBar, Avatar…
│   │   ├── icons/                 # icon đặc của menu, loa, quả địa cầu của logo
│   │   ├── layout/                # AppShell, Sidebar (+ menu thu gọn), MobileNav, TopBar/Breadcrumb, Logo
│   │   └── scene/                 # InteractiveScene, SvgHotspots, usePanZoom, zoom controls
│   ├── config/                    # app.ts (luật quiz, zoom, setting mặc định), assets.ts
│   ├── data/                      # words.json, conversations.json, speakers.json, scenes/*.json,
│   │                              # content.ts (truy vấn), validateContent.ts
│   ├── features/
│   │   ├── onboarding/            # Profile Setup
│   │   ├── home/
│   │   ├── vocabulary/            # pages, components, quiz/ (session store, câu hỏi)
│   │   ├── conversation/          # pages, components, speaking session
│   │   ├── settings/
│   │   └── misc/                  # NotFound / Coming soon / lỗi route
│   ├── hooks/                     # useSpeechRecognition, useMediaQuery, useAppFullscreen, useDocumentTitle
│   ├── lib/                       # storage, quiz, progress, speech, speechMatch, svgPath,
│   │                              # viewTransform, savedView, fullscreen, assets…
│   ├── stores/                    # Zustand stores
│   ├── styles/index.css           # Tailwind + design tokens
│   └── types/models.ts            # Data model (spec §10.1)
├── tests/
│   ├── unit/  components/  e2e/
│   ├── setup.ts  helpers.tsx
└── docs/asset-pipeline.md         # Quy trình làm art thật cho scene
```

## Kiến trúc

### 16 màn hình (spec §5)

| #   | Màn hình                | Route                                           |
| --- | ----------------------- | ----------------------------------------------- |
| 01  | Profile Setup           | `/setup`                                        |
| 02  | Journey (chỉ ảnh)       | `/`                                             |
| 03  | Vocabulary Scene List   | `/vocabulary`                                   |
| 04  | Topic Overview          | `/vocabulary/:sceneId`                          |
| 05  | Flashcards              | `/vocabulary/:sceneId/flashcards`               |
| 06  | Explore Scene           | `/vocabulary/:sceneId/explore`                  |
| 07  | Vocabulary Quiz         | `/vocabulary/:sceneId/quiz/:wordId`             |
| 08  | Answer / Word Detail    | `/vocabulary/:sceneId/result/:wordId`           |
| 09  | Topic Conversations     | `/vocabulary/:sceneId/conversations`            |
| 10  | Conversation Video      | `/conversation/:conversationId/video`           |
| 11  | Transcript              | `/conversation/:conversationId/transcript`      |
| 12  | Speaking Practice       | `/conversation/:conversationId/practice`        |
| 13  | Speaking Result         | `/conversation/:conversationId/practice/result` |
| 14  | Conversation Scene List | `/conversation`                                 |
| 15  | Conversation Detail     | `/conversation/:conversationId`                 |
| 16  | Settings                | `/settings`                                     |

Chưa có hồ sơ hợp lệ thì mọi route đều chuyển về `/setup`; đã có hồ sơ thì `/setup` chuyển về Journey.
Đường dẫn luôn tạo bằng `paths.*` trong `src/app/paths.ts`.

### Dữ liệu nội dung

- `src/data/words.json`: từ điển chung (key = `id`); `scenes/*.json`: mỗi scene một file, tự được
  nạp qua `import.meta.glob`; `conversations.json` và `speakers.json`: hội thoại dùng chung cho cả
  menu Vocabulary lẫn Conversation (một bản dữ liệu duy nhất, spec §4).
- Các trường bổ sung so với spec (đánh dấu `@extension` trong `types/models.ts`): `Scene.status`
  (`available` | `coming-soon`), `Scene.order`, `SceneHotspot.anchor`, `Speaker`,
  `Conversation.description`, `Conversation.captionsSrc`, `Word.plural` (câu "They’re curtains."),
  `LearningProgress.favoriteWordIds` (nút trái tim trên flashcard).
- `npm run content:check` báo lỗi cụ thể theo file/id: tham chiếu sai, trùng id, `acceptedAnswers`
  thiếu chính từ đó, hotspot nằm ngoài viewBox, scene thiếu hotspot, asset 404. Ở chế độ dev, lỗi
  cũng được in ra console khi mở app.

### Lưu trữ (spec §11)

| Key                  | Nội dung                                  |
| -------------------- | ----------------------------------------- |
| `vtw:v1:profile`     | `UserProfile`                             |
| `vtw:v1:progress`    | `LearningProgress` của khóa tiếng Anh     |
| `vtw:v1:zh:progress` | `LearningProgress` của khóa tiếng Trung   |
| `vtw:v1:settings`    | `AppSettings` (gồm `course`: `en` / `zh`) |

- Chỉ `src/lib/storage.ts` được chạm vào `localStorage`. Mọi lệnh đọc/ghi đều bọc `try/catch` và
  kiểm tra dữ liệu (`sanitize*`). Dữ liệu hỏng thì trả về mặc định; storage bị chặn thì chạy trong
  bộ nhớ (Settings sẽ báo cho người dùng).
- Store chỉ phụ thuộc interface `Repository<T>`, nên sau này có thể thay bằng đồng bộ tài khoản mà
  không phải sửa UI. Khi đổi schema: tăng `STORAGE_VERSION` và thêm migration vào `MIGRATIONS`.
- Tiến độ chỉ tăng khi trả lời **đúng**, mỗi từ chỉ tính một lần. Từ được thêm vào cả `completed` lẫn
  `found` để % và Objects Found luôn khớp nhau. Khi ghi, app gộp với bản đã lưu, nên mở nhiều tab
  cũng không mất từ đã học.

### Quiz (spec §8)

- `pickAnswerMode`: `canTypeWords = false` thì 100% trắc nghiệm; `true` thì 30% câu gõ đáp án,
  70% trắc nghiệm (`QUIZ_CONFIG.typingProbability = 0.3` trong `src/config/app.ts`).
- Câu hỏi (mode + thứ tự đáp án) được tạo **một lần** và đóng băng (`Object.freeze`), lưu trong
  session store, nên re-render hay refresh giữa chừng không random lại.
- Trắc nghiệm: 3 đáp án A/B/C như thiết kế (`QUIZ_CONFIG.choiceCount`, đổi được thành 4), đáp án nhiễu lấy theo thứ tự `distractorWordIds`
  → cùng scene → toàn bộ từ điển; không trùng chữ sau chuẩn hoá, không lấy từ đồng nghĩa của đáp án.
  Không đủ đáp án mà người học gõ được thì chuyển sang gõ.
- Gõ: chỉ chuẩn hoá trim / chữ thường / khoảng trắng; chỉ chấp nhận `acceptedAnswers`.
- Sai: báo nhẹ nhàng, có _Try Again_ và _Show Answer_ (bật/tắt trong `QUIZ_CONFIG`). Xem đáp án
  không tính là đã học.

### Scene tương tác (spec §7.4–7.6, §12)

```text
Viewport (aspect-ratio = width/height của scene, vừa khít chiều cao màn hình)
├── Một khung chung chịu transform zoom/pan
│   ├── Layer 1  background
│   ├── Layer 2  path SVG vùng chạm (sắp theo zIndex, vật trên nhận sự kiện trước)
│   └── Layer 3  sprite có glow + đường viền của vật đang chọn
│                (mask cắt bỏ phần bị vật có zIndex cao hơn che)
├── Layer 4  bong bóng "Click on an object!" / "What is this? · Learn" / tên vật đã tìm,
│            gắn vào vật đang chọn (không nhận click, trừ nút Learn)
└── Layer 5  nút tròn navy zoom in / zoom out / reset / fullscreen ở góc trên phải
Layer 6  thanh Objects Found ngay dưới tranh: nút Back (trái) · tên (giữa) · bộ đếm (phải), rồi hàng
         ô mỗi vật một ô (ảnh khi đã tìm, "?" khi chưa) với nút Previous/Next ở hai đầu
```

- Chuột: hover thì sáng, click thì mở câu hỏi. Cảm ứng: chạm lần đầu thì chọn và hiện nút **Learn**,
  chạm lần nữa hoặc bấm Learn thì mở. Bàn phím: Tab tới vật, Enter/Space để mở. Esc bỏ chọn.
  Các ô của thanh Objects Found là phương án thay thế cho bàn phím và trình đọc màn hình (vật chưa
  tìm có tên "Object 3"; focus/hover một ô sẽ làm sáng vật đó trên tranh).
- Kéo hoặc pinch không bị tính là chạm vào vật. `touchPadding` chỉ nới vùng chạm trên thiết bị cảm
  ứng, không làm sai đường viền.
- Mức zoom/pan được nhớ theo scene trong bộ nhớ (`lib/savedView.ts`), nên quay lại từ câu hỏi hoặc
  đáp án vẫn đúng chỗ cũ; tải lại trang thì về ban đầu. Toàn màn hình đặt trên cả trang
  (`hooks/useAppFullscreen.ts`) nên không bị thoát khi chuyển màn.
- Vật đã học vẫn mở lại được (Word Detail → _Practice Again_), không cộng tiến độ lần nữa.

### Âm thanh và giọng nói (spec §9.4)

- Không tự phát âm thanh. Mỗi lúc chỉ phát một âm thanh.
- Giọng đọc: file audio thu sẵn nếu có, không thì giọng **Anh-Mỹ (`en-US`)** của trình duyệt (khóa
  tiếng Trung: giọng **phổ thông `zh-CN`**, không có thì `zh-TW`; không bao giờ dùng `zh-HK` vì đó là
  tiếng Quảng Đông).
  _Settings → Reading voice_ cho chọn _Automatic_ / _Boy voice_ / _Girl voice_ (giọng nam/nữ nâng
  cao độ cho giống giọng trẻ em) và một giọng cụ thể của máy, có nút nghe thử; lưu ngay vào
  `voiceURI` / `voiceStyle` của `AppSettings`. Hội thoại đặt cao độ riêng cho từng nhân vật vẫn giữ
  cao độ đó. Chi tiết và cách thu âm: `docs/asset-pipeline.md` mục 8.
- Speaking: chỉ xin quyền micro khi người học bấm _Tap to speak_, không ghi âm hay upload gì. Kết quả
  so khớp các từ nghe được với câu mẫu, **không phải chấm phát âm** (app có ghi rõ trên màn hình).
  Trình duyệt không hỗ trợ, bị chặn micro hoặc lỗi mạng thì chuyển sang _Listen & Repeat_ →
  _Mark as Practiced_.
- Bài hội thoại được đánh dấu hoàn thành khi người học xong câu luyện nói cuối cùng.

### Khóa học (Tiếng Anh / Tiếng Trung)

- **Cấu hình**: `src/config/courses.ts` (`COURSES`): tên khóa, `lang` (`en-US` / `zh-CN`), giọng đọc được
  phép, khẩu hiệu, bộ câu hỏi quiz. Khóa đang học nằm trong `AppSettings.course`; `src/lib/course.ts`
  giữ khóa hiện tại cho các hàm thường (tra nội dung, `t()`, giọng đọc). Đổi khóa thì `App` remount
  toàn bộ màn hình (RouterProvider có `key` = khóa) và nạp tiến độ của khóa đó.
- **Nội dung**: scene (ảnh, hotspot, `wordIds`, `conversationIds`) dùng chung. Khóa tiếng Anh ở
  `src/data/*.json`, khóa tiếng Trung ở `src/data/zh/` với **cùng id**: `words.json`, `conversations.json`,
  `speakers.json` (莉莉, 小本, 妈妈, 爸爸) và `scenes.json` (chỉ dịch tên/mô tả scene). Các hàm trong
  `src/data/content.ts` tự trả nội dung của khóa đang học.
- **Trường riêng cho tiếng Trung**: `Word.pinyin` (hiện thay IPA), `Word.measure` (lượng từ cho câu đáp án
  "这是一盏台灯。"; bỏ trống với danh từ không đếm được: "这是牙膏。"), `pinyin` của câu ví dụ và câu thoại,
  `promptPinyin` / `suggestedAnswerPinyin` của câu hỏi luyện nói. `content:check` báo lỗi nếu chữ Hán
  thiếu pinyin.
- **Giao diện**: chữ trong component viết bằng tiếng Anh và bọc `t('Start Quiz')`; câu tiếng Anh chính là
  khóa tra từ điển. Bản tiếng Trung nằm ở `src/i18n/zh/` (mỗi khu vực một file: `common`, `vocabulary`,
  `conversation`, `profile`). Thiếu bản dịch thì hiện tiếng Anh và cảnh báo trong console (dev);
  `tests/unit/i18n.test.ts` kiểm tra mọi `t('...')` đều có bản dịch.
- **Quiz**: trắc nghiệm hoặc gõ **chữ Hán** (bằng bộ gõ pinyin của máy; Enter để chọn chữ trong bộ gõ
  không bị tính là nộp bài). `acceptedAnswers` chỉ chứa chữ Hán.
- **Luyện nói**: nhận dạng giọng `zh-CN`; so khớp **từng chữ Hán** (tiếng Trung không có dấu cách), số
  "3" được hiểu là "三", "两" và "二" coi như nhau. Vẫn chỉ là so khớp chữ, không chấm phát âm.
- **Font**: Inter không có chữ Hán nên trình duyệt dùng font hệ thống (PingFang SC, Microsoft YaHei,
  Noto Sans SC…), không tải thêm font.

## Giao diện theo bản thiết kế (`flow.png`)

Bản thiết kế 16 màn ở `flow.png` (thư mục gốc) là chuẩn hình ảnh. Những điểm chính:

- **Design token** trong `src/styles/index.css`, đo trực tiếp từ ảnh thiết kế: menu `bg-sidebar`
  (#133457), nút `brand-500` (#0B7FFE), chữ `navy-900`, tiến độ `leaf-500`, nền chip/ô `mist`, nền
  ảnh đồ vật `stone`. Font **Inter** cho giao diện; logo chữ "Village to World" vẽ bằng **Baloo 2**
  (quả địa cầu thay chữ "o") cho tới khi có file logo chính thức (`components/layout/Logo.tsx`).
- **Khung**: sidebar navy (nền ảnh ngôi làng) với 4 mục (Journey, Vocabulary, Conversation, Settings)
  và người học (avatar, tên, **Level**) ở dưới; phần lớn màn có thanh trên (breadcrumb / Back /
  tiêu đề, không có avatar); Flashcards, Topic Overview và Explore không có header. **Level** = 1 + số từ
  đã học / `LEVEL_CONFIG.wordsPerLevel` (mặc định 10), luôn tính từ tiến độ, không lưu riêng.
- **Menu thu gọn / mở rộng**: một sidebar dùng chung cho mọi màn, logo luôn ghim ở góc trái; nút ở
  cuối menu thu menu về chỉ còn icon hoặc mở lại đủ 4 mục kèm chữ (mặc định mở trên desktop, thu gọn
  trên tablet).
- **Khác với ảnh thiết kế, có chủ đích**:
  - Setup **không có nút "Upload Photo"** và nhãn là "Profile Picture" (bắt buộc chọn boy/girl) —
    spec §2.1, §6 cấm upload. Settings có "Change Photo" nhưng chỉ đổi giữa 2 nhân vật.
  - Thanh Objects Found nằm **ngay dưới** tranh thay vì đè lên mép dưới tranh, để không che vật ở
    sát đáy (thảm, dép). Tranh co theo chiều cao màn hình, hai bên là ảnh nền đồng cỏ (giống trang
    Vocabulary). Nút Back nằm trong thanh (bên trái, tên "Objects Found" ở giữa) và hàng ô có nút
    Previous/Next. Khi **toàn màn hình** (áp dụng cho cả trang nên giữ nguyên khi trả lời câu hỏi)
    chỉ còn bức tranh và các nút zoom.
  - Câu hỏi trắc nghiệm **không có nút "Check Answer"**: bấm đáp án là chấm ngay (đáp án là button,
    không phải radio, để phím mũi tên không gửi nhầm); phím Enter ở màn "Correct!" = Next Object.
  - Danh sách Vocabulary: mỗi nhóm đóng/mở được (nhóm đầu mở sẵn), lưới 4/2/1 thẻ theo chiều rộng,
    % hoàn thành hiện ngay cạnh tên scene.
  - Màn Settings có các trường như thiết kế, thêm mục _Reading voice_ (chọn giọng đọc) ở trên cùng;
    tuỳ chọn âm thanh / nghĩa tiếng Việt vẫn nằm trong `AppSettings` (mặc định bật) nhưng không có
    công tắc trên giao diện.
  - Transcript, Detail có thêm nút "Practice Speaking" / "View Conversation" để đi tiếp hành trình.
  - Tranh, nhân vật, thumbnail, video là **placeholder**; chữ (tên hội thoại, câu thoại, từ liên
    quan…) là dữ liệu mẫu — ảnh thiết kế dùng ví dụ khác (Emma, "Choosing Clothes"…).

## Thêm hoặc thay nội dung

- **Thêm từ**: thêm vào `words.json` (đủ `meaningVi`, `acceptedAnswers` có chứa chính từ đó, ít nhất
  một `examples`), gắn `id` vào `wordIds` và thêm hotspot trong scene, rồi chạy `npm run content:check`.
- **Thêm hội thoại**: thêm vào `conversations.json` (`sceneId`, `lines` với `speakerId` có trong
  `speakers.json`, `practiceQuestions`) và vào `conversationIds` của scene. Video đặt ở
  `public/assets/videos/` và khai báo `videoSrc`; phụ đề `.vtt` khai báo ở `captionsSrc`.
- **Thêm scene**: tạo `src/data/scenes/<id>.json`; để `"status": "coming-soon"` cho tới khi có đủ
  ảnh, từ và hotspot.
- **Nội dung tiếng Trung**: sửa `src/data/zh/words.json` / `conversations.json` với **cùng id** như bản
  tiếng Anh (từ mới của scene phải có ở cả hai khóa). Viết tay `pinyin` của từ (vd. `"táidēng"`) và
  `measure` nếu có; pinyin của câu thì chạy `npm run content:pinyin` (chỉ điền chỗ còn thiếu, không ghi
  đè chỗ đã sửa tay; câu dùng đúng cách đọc của từ đã viết tay). Sửa cách đọc sai của một từ thông dụng
  trong `READINGS` ở `scripts/zh-pinyin.mjs`. Cuối cùng chạy `npm run content:check`.
- **Thêm chữ giao diện**: viết `t('English text')` trong component và thêm bản dịch vào file tương ứng
  trong `src/i18n/zh/`.
- **Thay ảnh placeholder bằng art thật**: làm theo [docs/asset-pipeline.md](docs/asset-pipeline.md).
  Đường dẫn ảnh thương hiệu và nền nằm ở `src/config/assets.ts`.

## Deploy (hosting tĩnh)

`npm run build` tạo thư mục `dist/` gồm toàn file tĩnh. Hai biến môi trường (xem `.env.example`):

| Biến               | Ý nghĩa                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `VITE_BASE_PATH`   | Đường dẫn gốc khi chạy ở thư mục con, ví dụ `/VTW/` (mặc định `/`) |
| `VITE_ROUTER_MODE` | `browser` (URL sạch, mặc định) hoặc `hash` (`/#/...`)              |

- **Netlify**: build `npm run build`, publish `dist`. `public/_redirects` lo phần SPA fallback.
- **Cloudflare Pages**: tương tự Netlify; SPA fallback có sẵn khi không có `404.html`.
- **GitHub Pages**: workflow `.github/workflows/deploy-pages.yml` build với `VITE_ROUTER_MODE=hash`
  và `VITE_BASE_PATH=/<tên-repo>/`. Cần bật _Settings → Pages → Source: GitHub Actions_ của repo.

Mọi đường dẫn asset trong JSON (`/assets/...`) đi qua `assetUrl()`, nên tự đúng theo `VITE_BASE_PATH`.

## Kiểm thử

- `tests/unit`: quiz, progress, storage (JSON hỏng, storage bị chặn), profile, speech match,
  zoom/pan, parse SVG path, reducer của scene và quiz, kiểm tra nội dung + asset trên đĩa.
- `tests/components`: chạy trên route tree thật (memory router): setup, guard, menu đúng 4 mục,
  Journey không có CTA, Level ở menu, flashcards (trái tim không tính là đã học), Explore → Quiz →
  Result, tiến độ không tăng hai lần, đổi ảnh / `canTypeWords` trong Settings, hội thoại và
  fallback luyện nói.
- `tests/e2e`: hành trình MVP §22 trên desktop và mobile, deep link trên bản build, zoom không làm
  lệch hotspot, app vẫn chạy khi storage bị chặn.

## Đối chiếu checklist QA (spec §18)

| Hạng mục                                                             | Trạng thái                         |
| -------------------------------------------------------------------- | ---------------------------------- |
| Setup không có upload; avatar boy/girl hiển thị nguyên hình          | ✅ (test)                          |
| Journey chỉ có hình; sidebar đúng 4 mục                              | ✅ (test)                          |
| Vocabulary nhóm theo khu vực, % đúng; scene chưa có nội dung bị khoá | ✅ (test)                          |
| Bedroom đủ 24 từ / 10 hội thoại / 24 hotspot                         | ✅ dữ liệu mẫu, cần duyệt nội dung |
| Bathroom đủ 24 từ / 10 hội thoại / 24 hotspot                        | ✅ dữ liệu mẫu, cần duyệt nội dung |
| Living Room đủ 30 từ / 10 hội thoại / 30 hotspot                     | ✅ dữ liệu mẫu, cần duyệt nội dung |
| Kitchen đủ 24 từ / 10 hội thoại / 24 hotspot                         | ✅ dữ liệu mẫu, cần duyệt nội dung |
| House Exterior đủ 24 từ / 10 hội thoại / 24 hotspot                  | ✅ dữ liệu mẫu, cần duyệt nội dung |
| Dining Room đủ 30 từ / 10 hội thoại / 30 hotspot                     | ✅ dữ liệu mẫu, cần duyệt nội dung |
| Flashcards có Next / Finish                                          | ✅ (test)                          |
| Video luôn có đường vào transcript                                   | ✅ (test)                          |
| Đổi `canTypeWords` áp dụng cho câu tiếp theo                         | ✅ (test)                          |
| Hover/touch/keyboard đúng vật; zoom không làm lệch hotspot           | ✅ (E2E)                           |
| Fullscreen có fallback; trả lời đúng chỉ cộng một lần                | ✅                                 |
| `canTypeWords=false` không bao giờ ra câu gõ                         | ✅ (200 seed)                      |
| Storage hỏng/bị chặn không làm crash; deep link trên hosting tĩnh    | ✅ (test + E2E)                    |
| Mic bị chặn / không hỗ trợ vẫn học tiếp được                         | ✅ (test + E2E)                    |
| QA thiết bị thật iOS/Android, tối ưu asset thật                      | ⏳ khi có art và thiết bị thật     |

## Việc tiếp theo

1. Nhận art chính thức (spec §20), thay placeholder, trace lại hotspot (xem `docs/asset-pipeline.md`).
2. Giáo viên/biên tập duyệt 24 từ, IPA, ví dụ, bản dịch và 10 hội thoại.
3. Người bản ngữ/giáo viên tiếng Trung duyệt khóa tiếng Trung: tên gọi đồ vật, lượng từ, pinyin (nhất
   là thanh nhẹ, ví dụ 上/里 chỉ vị trí), câu ví dụ, hội thoại, bản dịch tiếng Việt và chữ giao diện
   (`src/i18n/zh/`).
4. Thu âm audio từ/câu (giọng thống nhất, cả tiếng Anh lẫn tiếng Trung: giọng trình duyệt hay đọc sai
   thanh điệu của từ đơn lẻ), thêm video + phụ đề `.vtt`.
5. QA trên thiết bị thật (iOS Safari, Android Chrome), đo hiệu năng với ảnh WebP/AVIF thật.
6. Tuỳ chọn: tách code theo route (lazy) nếu bundle tăng, export/import tiến độ dạng JSON.
