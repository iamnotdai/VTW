# VILLAGE TO WORLD — CODING SPECIFICATION

> **Phiên bản:** 1.0  
> **Ngày:** 24/10/2026  
> **Dự án:** Village to World  
> **Slogan:** Explore Life. Learn English.  
> **Đối tượng:** Mọi lứa tuổi, ưu tiên người mới bắt đầu và trẻ em  
> **Phong cách:** Cozy 3D Village, tươi sáng, thân thiện, giàu hình ảnh  
> **Kiến trúc:** Web app chạy hoàn toàn ở trình duyệt, **không có backend/API riêng và không cần database trên server**.

---

## 1. Mục tiêu tài liệu

Đây là bản đặc tả để bắt đầu coding giao diện và chức năng của **Village to World**, dựa trên bộ thiết kế đã chốt, đặc biệt là màn hình **Vocabulary → Home → Bedroom → Explore**.

Ứng dụng cho phép người học:

1. Thiết lập hồ sơ khi mở ứng dụng lần đầu.
2. Khám phá thế giới hình ảnh và học từ vựng theo **khu vực / topic / scene**.
3. Xem flashcard, học phát âm, quan sát đồ vật trong phòng.
4. Di chuột hoặc chạm vào đồ vật trong ảnh để làm nổi bật, sau đó chọn đồ vật và trả lời câu hỏi.
5. Xem video hội thoại, đọc transcript và luyện nói theo tình huống.
6. Theo dõi tiến độ học ngay trên thiết bị đang sử dụng.

**Nguyên tắc quan trọng:** Không xây dựng cảnh 3D thời gian thực trong MVP. Dùng **hình nền 2D có phong cách render 3D + lớp tương tác SVG + sprite PNG/WebP trong suốt**. Đây là cách giữ chất lượng mỹ thuật như ảnh thiết kế với chi phí phát triển thấp hơn Three.js.

## 2. Yêu cầu đã chốt và giả định

### 2.1. Đã chốt

- Tên sản phẩm: **Village to World**.
- Slogan: **Explore Life. Learn English.**
- Giao diện có thanh menu dọc: **Journey, Vocabulary, Conversation, Settings** (mục "Journey" trước đây tên "Home"; đổi tên để không trùng với nhóm scene "Home" và để sau này mở rộng timeline).
- Nội dung **Journey (route `/`) chỉ hiển thị ảnh**, không thêm nút, card có link, hoặc CTA trong vùng nội dung chính. Menu dọc vẫn dùng để chuyển màn hình.
- Vocabulary phân nhóm theo topic/scene và hiển thị **phần trăm đã học**.
- Có: Topic Overview → Flashcards → Explore → câu hỏi → kết quả → tiến độ.
- Nếu chọn **“Yes, I can type words”**, hệ thống có thể **ngẫu nhiên giữa gõ đáp án và chọn đáp án**.
- Nếu chọn **“Not yet”**, chỉ hiển thị **câu hỏi trắc nghiệm chọn đáp án**.
- Có video hội thoại và nút **View Conversation / View Transcript** sau khi xem.
- Setup chỉ nhập tên, chọn nhóm tuổi, chọn khả năng gõ từ và **chọn giới tính qua ảnh nhân vật nam hoặc nữ**.
- **Không có** trường upload file hoặc upload profile picture.
- Hình nhân vật nam/nữ phải là tài nguyên riêng, không ép ảnh gốc vào hình tròn. Có thể hiển thị avatar crop tròn ở menu/header nếu thiết kế yêu cầu, nhưng không thay đổi file ảnh nguồn.
- Có background riêng cho **desktop/tablet** và **mobile**, form thiết lập hiển thị chính giữa trên mobile; background không có nhân vật bé gái dính sẵn vào nền.
- Không có server/database.

### 2.2. Giả định để coding MVP (có thể đổi bằng cấu hình)

- Dữ liệu chủ đề/từ vựng/hội thoại lưu trong các file JSON tĩnh.
- Ở Bedroom, cấu hình mẫu có **24 từ** và **10 hội thoại**, theo bản thiết kế.
- Bộ scene ví dụ: Living Room, Dining Room, Kitchen, Bedroom, Bathroom, Garden. Chỉ Bedroom cần hoàn chỉnh ở vòng đầu; các scene khác có thể dùng dữ liệu mẫu.
- Chọn giới tính trong setup là cách chọn hình đại diện ban đầu (male/female), **không ảnh hưởng logic học**.
- Xem video không bắt buộc mở khóa transcript; sau khi xem xong hoặc bấm “View Conversation” có thể xem transcript.
- Câu hỏi trắc nghiệm có 3–4 đáp án; số đáp án đặt trong config, không hard-code.
- Hoàn thành một từ khi người học trả lời đúng câu hỏi đầu tiên cho từ đó; có thể thêm luyện lại ở giai đoạn sau.
- Không có đăng nhập email/mật khẩu, không có đồng bộ đa thiết bị.

## 3. Technology stack

| Lớp | Công nghệ đề xuất | Ghi chú |
| --- | --- | --- |
| Frontend | **React + TypeScript + Vite** | SPA, component hóa |
| Styling | **Tailwind CSS** + CSS riêng | Dễ dựng UI responsive |
| Routing | React Router | Điều hướng màn hình |
| State tạm thời | React Context hoặc Zustand | Dữ liệu session, học tập |
| Scene interaction | **SVG overlay** trên ảnh WebP/PNG | Polygon/path theo hình đồ vật |
| Animation | CSS transitions/keyframes | Glow, scale, pulse, feedback |
| Tương tác nâng cao (sau MVP) | PixiJS | Chỉ thêm khi cần hiệu ứng nặng |
| Từ vựng và hội thoại | Static JSON | Không cần API |
| Tiến độ/hồ sơ/cài đặt | `localStorage` | Nhẹ, không đồng bộ đa thiết bị |
| Dữ liệu lớn/offline cache (nếu cần) | IndexedDB | Video metadata, asset cache |
| Phát âm từ/câu | Web Speech `speechSynthesis` hoặc file âm thanh | Ưu tiên audio thu âm khi cần giọng nhất quán |
| Nhận diện giọng nói (tùy chọn) | `SpeechRecognition` nếu trình duyệt hỗ trợ | Bắt buộc có fallback, không cam kết offline |
| Kiểm thử | Vitest + React Testing Library + Playwright | Logic, UI, responsive, E2E |
| Triển khai | Hosting tĩnh (Cloudflare Pages, Netlify, GitHub Pages...) | Không cần server tự quản |

**Lưu ý:** “Không cần server/database” nghĩa là không cần **backend riêng**. Nếu truy cập qua URL công khai, ứng dụng vẫn cần một nơi **phân phối file tĩnh** (HTML/CSS/JS/ảnh/video).

## 4. Sơ đồ điều hướng

```text
First launch
└── Profile Setup (lần đầu)
    └── App shell
        ├── Journey              [chỉ ảnh]
        ├── Vocabulary
        │   └── Scene/Topic List
        │       └── Topic Overview (Bedroom)
        │           ├── Flashcards
        │           ├── Explore Scene
        │           │   ├── Select Object
        │           │   ├── Quiz: Type / Multiple Choice
        │           │   └── Result + Word Detail
        │           └── Topic Conversations
        │               └── Video → Transcript → Speaking
        ├── Conversation
        │   └── Scene List
        │       └── Conversation Detail
        │           ├── Video
        │           ├── Transcript
        │           └── Speaking Practice
        └── Settings
```

**Nguyên tắc:** Vocabulary và Conversation có thể vào **cùng một dữ liệu hội thoại** từ hai đường khác nhau. Không tạo hai bản hội thoại giống nhau.

## 5. Danh sách 16 màn hình cần xây dựng

> Số **13** không hiển thị rõ trong montage bản thiết kế đã cung cấp; ở đây định nghĩa thành **Speaking Result** để hoàn thiện hành trình 16 màn hình. Các màn còn lại bám theo ảnh tổng hợp.

| # | Màn hình | Route đề xuất | Nội dung/Chức năng |
| --- | --- | --- | --- |
| 01 | First-time Profile Setup | `/setup` | Full name, age group, can type words, ảnh chọn nam/nữ, Start My Journey |
| 02 | Journey (trước là Home) | `/` | Background full area, không CTA/card/link trong content |
| 03 | Vocabulary Scene List | `/vocabulary` | Nhóm Home/Garden..., thẻ scene, % học |
| 04 | Topic Overview (Bedroom) | `/vocabulary/:sceneId` | Banner scene, tổng từ, hội thoại, tiến độ, Start Learning, View Conversations |
| 05 | Vocabulary Flashcards | `/vocabulary/:sceneId/flashcards` | 1 thẻ lớn, ảnh đồ vật, tên, phát âm, ví dụ, related words, Next/Finish |
| 06 | Explore Scene | `/vocabulary/:sceneId/explore` | Ảnh Bedroom tương tác, hover/chạm, zoom, danh sách vật đã tìm |
| 07 | Vocabulary Quiz | `/vocabulary/:sceneId/quiz/:wordId` | Gõ đáp án hoặc trắc nghiệm theo setting |
| 08 | Answer Feedback / Word Detail | `/vocabulary/:sceneId/result/:wordId` | Correct/Incorrect, meaning, IPA, examples, related words, Next Object |
| 09 | Topic Conversations List | `/vocabulary/:sceneId/conversations` | Danh sách hội thoại theo scene |
| 10 | Conversation Video | `/conversation/:conversationId/video` | Video, player controls, View Conversation |
| 11 | Conversation Transcript | `/conversation/:conversationId/transcript` | Các câu theo nhân vật, play audio, translate tùy chọn |
| 12 | Speaking Practice | `/conversation/:conversationId/practice` | Câu hỏi, tap to speak, câu trả lời gợi ý, feedback |
| 13 | Speaking Result *(bổ sung MVP)* | `/conversation/:conversationId/practice/result` | Kết quả ghi âm/nhận diện, retry, next question |
| 14 | Conversation Scene List | `/conversation` | Nhóm hội thoại theo scene, số đã học |
| 15 | Conversation Detail | `/conversation/:conversationId` | Video preview/detail, transcript preview, nút Video/Transcript/Practice |
| 16 | Settings | `/settings` | Avatar, name, age, can type words, Save Changes |

### 5.1. Khung layout chung

- **Desktop:** Sidebar dọc bên trái (nền là ảnh ngôi làng, phần trên giữ màu navy để menu dễ đọc), logo đầu menu, avatar/tên/Level người học phía dưới (chỉ nằm ở sidebar, không lặp ở header); header/breadcrumb ở nội dung nếu màn có nội dung phụ (Topic Overview, Flashcards, Explore **không có header**); scene là vùng trung tâm.
- **Tablet:** Sidebar thu gọn theo độ rộng, vẫn dễ sử dụng bằng cảm ứng.
- **Mobile:** Sidebar chuyển thành drawer hoặc bottom navigation phù hợp; không để sidebar chiếm hết diện tích scene. Các nút tối thiểu khoảng 44×44 CSS px.
- **Home:** Giữ hình nền như ảnh đã chốt và không thêm UI điều hướng ở nội dung; vẫn có menu chính của ứng dụng.
- Cùng một bộ design token: nền xanh navy, CTA xanh dương, bề mặt trắng, góc bo lớn, đổ bóng mềm, hình minh họa 3D ấm áp.

## 6. Chi tiết tính năng Profile Setup

### Form

- **Full Name:** required, từ 1 đến 60 ký tự sau khi trim.
- **Age Group:** `under-6`, `6-8`, `9-12`, `13-17`, `18-plus`.
- **Can you type words?:**
  - `true`: Yes, I can type words.
  - `false`: Not yet, I prefer choosing answers.
- **Avatar Choice:** `boy` hoặc `girl`, chọn qua hai ảnh nhân vật.
- **Start My Journey:** Validate → lưu profile → chuyển Journey (`/`).

### Quy tắc responsive

- Dùng `<picture>` hoặc `background-image` với media query để đổi nền setup desktop/mobile.
- Form nằm trong card dễ đọc với nền đủ tương phản; mobile card ở chính giữa, cuộn được trên máy nhỏ.
- Không hiển thị input upload, nút Upload Photo, hoặc ảnh profile có thể upload.

### Người dùng quay lại

- Nếu đã có profile hợp lệ trong `localStorage`, vào trực tiếp Journey (`/`).
- Settings cho phép đổi name, age, avatar và khả năng gõ từ.
- Khi xóa dữ liệu trình duyệt, profile và tiến độ có thể bị mất.

## 7. Vocabulary: dữ liệu và quy trình học

### 7.1. Vocabulary Scene List

- Group theo vùng: `Home`, `Garden`, có thể bổ sung `Village`, `School`, `Town`...
- Mỗi nhóm là một thanh trắng **đóng/mở được** (accordion): icon của nhóm (khai báo `icon` trong `SCENE_GROUPS`, nhóm chưa có ảnh thì bỏ trống), tên nhóm, số scene, nút mũi tên. Nhóm đầu tiên mở sẵn, các nhóm mở độc lập; thanh là `button` có `aria-expanded`/`aria-controls`.
- Lưới thẻ dùng chung cho mọi nhóm: dưới 480px 1 thẻ/hàng, từ 480px đến dưới 1024px 2 thẻ/hàng, từ 1024px 4 thẻ/hàng.
- Mỗi scene card: thumbnail, tên, `% completed` (số % màu xanh ở bên phải tên), thanh tiến độ.
- Trang full chiều rộng, nền là ảnh đồng cỏ ở độ mờ 80%; tiêu đề trang (header trong suốt, có đường kẻ mỏng) đứng cố định, chỉ danh sách bên dưới cuộn.
- Hiển thị progress bar dựa trên số từ đã hoàn thành trong scene.
- Ví dụ: Bedroom có 24 từ; 6 từ đã học → **25%**.
- Với scene chưa có nội dung thật, đánh dấu `Coming soon` hoặc ẩn, không đưa người dùng vào trang rỗng.

### 7.2. Topic Overview

- Không có header; nền cùng ảnh với trang Vocabulary. Từ tablet trở lên trang cao đúng một màn hình, chừa dải trống ở đầu trang bằng chỗ header của trang Vocabulary.
- Một thẻ trắng chia 60/40: ảnh lớn Bedroom bên trái, thông tin bên phải (điện thoại thì xếp dọc).
- Tên scene, mô tả ngắn.
- Ba ô chỉ số: `24 Words`, `10 Conversations`, vòng tròn hiển thị phần trăm hoàn thành.
- `Start Learning`: vào flashcards nếu lần đầu; về sau có thể Resume theo tiến độ.
- `View Conversations`: vào danh sách hội thoại tương ứng.
- `Back`: nút thứ ba trong cùng khối nút, về danh sách Vocabulary.

### 7.3. Flashcards

- Hiển thị **một flashcard lớn ở giữa** như thiết kế.
- Mỗi flashcard: số thứ tự (`3 / 24`), hình PNG/WebP đồ vật, từ tiếng Anh, IPA, nút nghe, Show Meaning, câu ví dụ có nút nghe, related words.
- Cho phép `Previous` (nếu có), `Next`, `Finish`. Không có nút `Skip`.
- Màn này **không có header/breadcrumb**: ảnh nền scene phủ kín vùng nội dung; dải ảnh đồ vật ở dưới cùng luôn đầy cả hai bên thẻ (gần cuối không dồn sang trái).
- `Next` chỉ chuyển thẻ (quy tắc đánh dấu “đã học” cần thống nhất; MVP ưu tiên **đã hoàn thành quiz** chứ không phải chỉ xem flashcard).
- `Finish` (hoặc `Next` ở thẻ cuối) thoát về overview hoặc chuyển sang Explore qua CTA rõ ràng (thẻ "Great job!" với Explore, Back to Overview, Start the cards again).
- Hỗ trợ bàn phím trái/phải khi desktop nếu không focus vào input.

### 7.4. Explore Scene

Tâm điểm của trải nghiệm:

1. Hiển thị **ảnh nền Bedroom sạch**, không chứa UI, lời thoại, nút hoặc con trỏ vẽ dính vào ảnh.
2. Trên ảnh đặt **SVG overlay** có `viewBox` trùng hệ tọa độ của hình nền.
3. Mỗi vật thể có một vùng tương tác dạng `path`/`polygon` (không dùng hình chữ nhật lớn khi vùng chồng chéo).
4. Khi hover: viền nổi bật, phát sáng, con trỏ `pointer`, hiệu ứng nhẹ, gợi ý “Click on an object!”.
5. Khi di chuột ra: tắt hover, không ảnh hưởng các đồ vật khác.
6. Khi click/tap: lưu `selectedWordId`, tạm khóa chọn đồ vật khác, mở Quiz (overlay hoặc route).
7. Sau câu trả lời đúng: đánh dấu đồ vật đã tìm, cập nhật progress và thanh **Objects Found**.
8. Có zoom in/out/reset và fullscreen **nếu trình duyệt hỗ trợ**. Mức zoom và vị trí kéo được nhớ theo scene (trong bộ nhớ, không lưu) nên quay lại từ câu hỏi/đáp án vẫn như cũ.
9. Trên mobile **không dựa vào hover**: chạm lần đầu nên chọn và highlight/hiện label; chạm tiếp hoặc nút “Learn” để mở câu hỏi. Có thể dùng single-tap mở câu hỏi nếu UX test thấy dễ dùng.
10. Các vùng mục tiêu phải đủ rộng cho cảm ứng; nếu vật nhỏ, có thể mở rộng `hitArea` nhưng không làm viền highlight sai hình.

**Khác biệt kỹ thuật quan trọng:**

- **Hotspot SVG** giúp xác định vị trí và nhận sự kiện; không tự “tách” vật thể từ ảnh nền.
- Muốn **cả chiếc đèn sáng lên đúng hình**, cần **ảnh sprite đã tách nền của riêng chiếc đèn**, hoặc alpha mask/segmentation mask chính xác. Render sprite lên vị trí tương ứng khi hover rồi thêm `filter: brightness(...) drop-shadow(...)`.
- Muốn **viền đúng biên vật thể**, dùng contour/path SVG hoặc mask, không chỉ vẽ border hình chữ nhật.
- Không thể tự động có highlight đúng mọi đồ vật chỉ từ một ảnh JPG/WebP chung nếu chưa có tọa độ/mask/sprite cho từng đồ vật.
- Cần xử lý thứ tự chồng lớp (`zIndex`) và đồ vật bị che một phần.

**Bố cục màn Explore (không header):**

- Ảnh vừa khít (không cắt) trên nền ảnh giống trang Vocabulary; ảnh co theo chiều cao màn hình, chừa chỗ cho thanh Objects Found.
- Thanh **Objects Found** rộng bằng ảnh, nằm ngay dưới ảnh. Hàng tiêu đề chia ba: nút `Back` (về Topic Overview) ở bên trái, tên "Objects Found" ở giữa, bộ đếm `x / 24` (và `View Conversations` khi đã tìm đủ) ở bên phải. Hàng ô đồ vật có nút Previous/Next ở hai đầu, cuộn khoảng 80% chiều rộng mỗi lần bấm.
- **Fullscreen** áp dụng cho cả trang (không chỉ khung ảnh) nên giữ nguyên khi chuyển sang câu hỏi và đáp án rồi quay lại. Khi fullscreen: ẩn sidebar/menu dưới, ẩn thanh Objects Found và nút Back, ảnh lớn hết cỡ trên nền navy; thoát bằng nút thu nhỏ ở góc ảnh hoặc phím Esc. Hotspot vẫn dùng được bằng chuột, chạm và bàn phím.

### 7.5. Quy chuẩn asset cho scene

Với mỗi scene, chuẩn bị:

- `background.webp`: toàn cảnh sạch ở độ phân giải đủ lớn (khuyến nghị xuất 2x so với vùng hiển thị chuẩn, rồi tối ưu dung lượng).
- `thumbnail.webp`: ảnh xem trước.
- `objects/<id>.webp` hoặc `.png`: sprite tách nền khi muốn nâng sáng/phóng to toàn bộ đồ vật.
- `masks/<id>.svg` (hoặc polygon khai báo trong JSON): đường viền vật thể.
- `scene.json`: kích thước gốc, tên scene, ánh xạ hotspot ↔ từ.
- `audio/words/<wordId>.mp3`: tùy chọn nếu không dùng Web Speech API.

**Tọa độ:** Dùng hệ tọa độ gốc của `background.webp` (ví dụ `1108 × 739` chỉ khi bạn dùng chính tệp demo hiện có). SVG `viewBox` phải trùng kích thước thực tế của asset cuối cùng. Nếu thay ảnh crop/tỉ lệ, hotspot phải được cập nhật.

### 7.6. Cấu trúc layer cho scene

```text
SceneViewport (responsive container, giữ đúng aspect-ratio)
├── Layer 1: Background image (background.webp)
├── Layer 2: Interactive SVG hit areas + outline paths
├── Layer 3: Object highlight sprites (khi hovered/selected)
├── Layer 4: Labels/tooltips/hints
├── Layer 5: Zoom controls + fullscreen
└── Layer 6: Objects Found bar + optional quiz modal
```

**Điều kiện bắt buộc:** Layer ảnh và SVG phải dùng **cùng một hộp tọa độ và cùng transform zoom/pan**. Nếu ảnh `object-fit: cover` bị crop nhưng SVG không crop tương ứng, vị trí click sẽ lệch. MVP ưu tiên `contain` hoặc viewport giữ `aspect-ratio`; nếu `cover` thì phải tính offset/crop chuẩn.

## 8. Vocabulary Quiz: luật nghiệp vụ

### Chọn hình thức câu hỏi

```ts
export type AnswerMode = 'typing' | 'multiple-choice';

export function pickAnswerMode(
  canTypeWords: boolean,
  randomValue: number = Math.random()
): AnswerMode {
  if (!canTypeWords) return 'multiple-choice';
  return randomValue < 0.5 ? 'typing' : 'multiple-choice';
}
```

- Nếu `canTypeWords = false`, **100% trắc nghiệm**.
- Nếu `canTypeWords = true`, mặc định **50% typing / 50% multiple-choice** cho mỗi câu hỏi; tỷ lệ có thể cấu hình sau.
- Chọn mode **một lần lúc tạo câu hỏi**, không random lại khi component re-render.
- Với từ không thể tạo đủ phương án hợp lệ, fallback sang typing (nếu cho phép) hoặc dùng bộ distractor đã duyệt.

### Typing mode

- Prompt: “What is this?” và ảnh đồ vật + nút nghe.
- Input, nút `Check Answer`.
- Chuẩn hóa: `trim`, chữ thường, thu gọn khoảng trắng, so sánh theo `acceptedAnswers`.
- Không tự xóa dấu hoặc chấp nhận sai chính tả tràn lan; nếu cho phép biến thể, khai báo minh bạch trong `acceptedAnswers`.
- Enter để submit; tránh submit lặp khi đang xử lý.

### Multiple-choice mode

- Prompt như trên; 3 hoặc 4 đáp án.
- Một đáp án đúng, các đáp án nhiễu lấy từ cùng scene hoặc cấu hình sẵn.
- Fisher–Yates shuffle **một lần khi khởi tạo câu hỏi**.
- Click/tap lựa chọn là **kiểm tra ngay**, không có nút `Check Answer`. Các lựa chọn là button (không phải radio) để phím mũi tên không vô tình gửi đáp án.
- Không hiển thị hai phương án có cùng chữ sau chuẩn hóa.

### Feedback

- **Correct:** icon check, từ, IPA, meaning, example sentences, related words, `Next Object` (phím Enter cũng làm việc của nút này, trừ khi đang focus vào một nút/link/ô nhập khác).
- **Incorrect:** báo nhẹ nhàng, không gây cảm giác thất bại; cho `Try Again` và/hoặc `Show Answer`, tùy config.
- Chỉ đánh dấu `completedWordIds` khi trả lời **đúng**, không khi xem flashcard hoặc xem đáp án.
- Đồ vật đã học vẫn bấm xem lại được; không cộng tiến độ lần nữa.

## 9. Conversation và Speaking

### 9.1. Danh sách hội thoại

- Từ topic Bedroom: 10 hội thoại minh họa `My Bedroom`, `Making the Bed`, `Where Is My Book?`...
- Từ Conversation menu: nhóm theo scene (Home, Garden...), card có số bài hoàn thành/tổng số.
- Cả hai entry point dùng `conversationId` chung.

### 9.2. Video

- Ưu tiên tệp MP4/WebM trong `public/assets/` nếu cần chạy độc lập; browser hỗ trợ controls, poster, caption nếu có.
- Có thể nhúng YouTube nếu có sẵn URL thật, nhưng cần Internet và cần xử lý cookie/iframe; **không giả định YouTube có thể tải offline**.
- Khi video kết thúc: hiển thị CTA `View Conversation` → Transcript.
- Cho phép xem transcript kể cả khi video lỗi mạng.

### 9.3. Transcript

- Hiển thị từng lượt thoại: avatar, tên nhân vật, câu tiếng Anh, nút Play Audio, nút Translate (nếu có bản dịch tĩnh).
- Dữ liệu câu thoại lưu JSON; không cần dịch runtime qua API.
- Tô sáng câu đang phát nếu có audio theo câu.

### 9.4. Speaking Practice

- Hiển thị câu hỏi, ví dụ: “What is in the bedroom?”.
- Có `Tap to speak` và trạng thái: `idle → requesting-permission → listening → processing → result`.
- Nếu browser hỗ trợ speech recognition: hiển thị transcript và so khớp **đơn giản** với câu mẫu. **Không gọi đây là chấm phát âm chính xác**, vì nhận diện từ không đo đầy đủ độ đúng phát âm.
- Một số trình duyệt không hỗ trợ speech recognition hoặc có thể xử lý âm thanh qua dịch vụ mạng. Vì vậy **không cam kết speech-to-text offline/hoàn toàn local**.
- Nếu API không khả dụng hoặc người dùng từ chối microphone: cung cấp `Listen & Repeat`, phát audio mẫu và nút `Mark as Practiced`, không chặn hành trình học.
- Chỉ xin quyền microphone **khi người dùng nhấn ghi âm**; hiển thị trạng thái và có nút dừng.
- Không upload hay lưu file giọng nói trong MVP.

## 10. Data model TypeScript

### 10.1. Kiểu dữ liệu

```ts
export type AgeGroup = 'under-6' | '6-8' | '9-12' | '13-17' | '18-plus';
export type AvatarChoice = 'boy' | 'girl';
export type SceneGroup = 'home' | 'garden' | 'village' | 'school' | 'town';

export interface UserProfile {
  id: 'local-user';
  fullName: string;
  ageGroup: AgeGroup;
  avatar: AvatarChoice;
  canTypeWords: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Word {
  id: string;          // vd: "lamp"
  text: string;        // "lamp"
  ipa?: string;        // "/læmp/"
  meaningVi: string;   // "đèn"
  image: string;       // "/assets/bedroom/objects/lamp.webp"
  audio?: string;      // "/assets/audio/lamp.mp3"
  acceptedAnswers: string[];
  examples: { en: string; vi?: string; audio?: string }[];
  relatedWordIds: string[];
  distractorWordIds?: string[];
}

export interface SceneHotspot {
  wordId: string;
  svgPath: string;     // đường biên chính xác, tọa độ viewBox gốc
  sprite?: string;     // sprite có alpha, tùy chọn
  spriteBounds?: { x: number; y: number; width: number; height: number };
  zIndex?: number;
  touchPadding?: number;
}

export interface Scene {
  id: string;          // "bedroom"
  title: string;       // "Bedroom"
  group: SceneGroup;
  description: string;
  thumbnail: string;
  background: string;
  width: number;       // natural width của background
  height: number;      // natural height của background
  wordIds: string[];
  conversationIds: string[];
  hotspots: SceneHotspot[];
}

export interface DialogueLine {
  id: string;
  speakerId: string;
  textEn: string;
  textVi?: string;
  audio?: string;
  startSeconds?: number;
  endSeconds?: number;
}

export interface Conversation {
  id: string;
  sceneId: string;
  title: string;
  order: number;
  poster: string;
  videoSrc?: string;
  youtubeId?: string;
  lines: DialogueLine[];
  practiceQuestions: {
    id: string;
    prompt: string;
    suggestedAnswer: string;
    audio?: string;
  }[];
}

export interface LearningProgress {
  completedWordIdsByScene: Record<string, string[]>;
  foundWordIdsByScene: Record<string, string[]>;
  completedConversationIds: string[];
  lastVisitedSceneId?: string;
  lastFlashcardIndexByScene: Record<string, number>;
  updatedAt: string;
}

export interface AppSettings {
  soundEnabled: boolean;
  showVietnameseMeaning: boolean;
  quizTypingProbability: number; // mặc định 0.5; hiệu lực khi canTypeWords=true
  voiceURI: string | null; // giọng en-US của trình duyệt; null = tự chọn giọng tốt nhất
  voiceStyle: 'boy' | 'girl' | null; // giọng bé trai/bé gái (giọng nam/nữ + nâng cao độ); null = không chọn
}
```

### 10.2. Mẫu `scenes/bedroom.json` (rút gọn)

> `svgPath` bên dưới là **giá trị placeholder**, **không phải vị trí thật** trên ảnh Bedroom. Cần trace contour từ asset cuối cùng trước khi chạy production.

```json
{
  "id": "bedroom",
  "title": "Bedroom",
  "group": "home",
  "description": "Learn words and practice conversations in the bedroom.",
  "thumbnail": "/assets/scenes/bedroom/thumbnail.webp",
  "background": "/assets/scenes/bedroom/background.webp",
  "width": 1108,
  "height": 739,
  "wordIds": ["lamp", "bed", "pillow"],
  "conversationIds": ["my-bedroom", "making-the-bed"],
  "hotspots": [
    {
      "wordId": "lamp",
      "svgPath": "M 100 100 L 140 100 L 150 180 L 90 180 Z",
      "sprite": "/assets/scenes/bedroom/objects/lamp.webp",
      "spriteBounds": { "x": 90, "y": 95, "width": 65, "height": 95 },
      "zIndex": 3
    }
  ]
}
```

**Lưu ý:** `wordIds` ở ví dụ trên chỉ là 3 phần tử để minh họa; bản Bedroom hoàn chỉnh cần **đủ 24 từ** và `hotspots` tương ứng các đồ vật có thể click. Kích thước `1108 × 739` phù hợp với ảnh demo hiện có, không phải tiêu chuẩn chung cho các scene khác.

### 10.3. Mẫu `words.json` (rút gọn)

```json
{
  "lamp": {
    "id": "lamp",
    "text": "lamp",
    "ipa": "/læmp/",
    "meaningVi": "đèn",
    "image": "/assets/scenes/bedroom/objects/lamp.webp",
    "acceptedAnswers": ["lamp", "a lamp"],
    "examples": [
      { "en": "The lamp is on the desk.", "vi": "Chiếc đèn ở trên bàn." },
      { "en": "Please turn on the lamp.", "vi": "Hãy bật đèn lên." }
    ],
    "relatedWordIds": ["desk", "light", "switch"],
    "distractorWordIds": ["bed", "chair", "pillow"]
  }
}
```

**Data validation:** Kiểm tra mọi `wordId`, `conversationId`, `relatedWordIds`, `distractorWordIds` có tồn tại; không có `id` trùng; đường dẫn asset không 404. Có thể dùng Zod ở bước load dữ liệu nếu cần.

## 11. Lưu dữ liệu không cần database

### 11.1. Storage keys

```text
vtw:v1:profile      -> UserProfile
vtw:v1:progress     -> LearningProgress
vtw:v1:settings     -> AppSettings
```

- Đọc/ghi qua một lớp `storage.ts`, không gọi `localStorage` rải rác nhiều component.
- Bọc `try/catch` để xử lý trường hợp browser chặn storage hoặc JSON bị hỏng.
- Luôn có default an toàn và migration theo version khi thay đổi schema.
- Dữ liệu `localStorage` không phải kho lưu duy nhất của nội dung tĩnh; từ vựng vẫn nằm trong JSON được deploy cùng app.
- Không lưu video/base64 ảnh lớn vào `localStorage`.

### 11.2. Công thức progress

```ts
function getSceneProgressPercent(
  sceneWordIds: string[],
  completedWordIds: string[]
): number {
  if (sceneWordIds.length === 0) return 0;
  const done = new Set(completedWordIds);
  const count = sceneWordIds.filter(id => done.has(id)).length;
  return Math.round((count / sceneWordIds.length) * 100);
}
```

- `Objects Found`: dùng `foundWordIdsByScene` hoặc thống nhất với `completedWordIdsByScene` nếu không tách trạng thái tìm được và học xong. **MVP đề xuất:** Chỉ thêm vào `foundWordIdsByScene` khi trả lời đúng để thanh Objects Found và % đã học không mâu thuẫn.
- Không vượt 100%, không cộng hai lần cùng `wordId`.
- `completedConversationIds`: đánh dấu sau khi người học chủ động hoàn thành hoặc đến bước cuối bài; không tính ngay lúc mở video.

### 11.3. Giới hạn phải chấp nhận

- Mỗi trình duyệt/thiết bị có tiến độ riêng; không tự đồng bộ.
- Clear site data, chế độ riêng tư hoặc thay thiết bị có thể làm mất tiến độ.
- Dữ liệu local không phù hợp cho các yêu cầu chống gian lận hoặc tài khoản nhiều thiết bị.
- Nâng cấp về sau có thể thêm đồng bộ tài khoản mà không cần viết lại toàn bộ UI nếu lưu data qua repository/service abstraction ngay từ đầu.

## 12. Ví dụ kỹ thuật: Scene SVG có hover và click

Ví dụ tối giản để minh họa cơ chế. Với sprite/mask chính xác, thêm lớp ảnh riêng cho hiệu ứng sáng lên toàn bộ đồ vật.

```tsx
import { useState } from 'react';

type Hotspot = {
  wordId: string;
  path: string;
};

type Props = {
  background: string;
  width: number;
  height: number;
  hotspots: Hotspot[];
  onSelect: (wordId: string) => void;
};

export function InteractiveScene({
  background,
  width,
  height,
  hotspots,
  onSelect
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <img
        src={background}
        alt="Interactive learning scene"
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        aria-label="Choose an object to learn"
      >
        {hotspots.map(hotspot => (
          <path
            key={hotspot.wordId}
            d={hotspot.path}
            role="button"
            tabIndex={0}
            aria-label={`Learn ${hotspot.wordId}`}
            onPointerEnter={() => setHoveredId(hotspot.wordId)}
            onPointerLeave={() => setHoveredId(null)}
            onClick={() => onSelect(hotspot.wordId)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(hotspot.wordId);
              }
            }}
            fill={hoveredId === hotspot.wordId
              ? 'rgba(255, 238, 120, 0.16)'
              : 'transparent'}
            stroke={hoveredId === hotspot.wordId ? '#ffdc64' : 'transparent'}
            strokeWidth={hoveredId === hotspot.wordId ? 5 : 0}
            style={{
              cursor: 'pointer',
              pointerEvents: 'all',
              filter: hoveredId === hotspot.wordId
                ? 'drop-shadow(0 0 12px rgba(255, 225, 100, .9))'
                : 'none',
              transition: 'filter 160ms ease'
            }}
          />
        ))}
      </svg>
    </div>
  );
}
```

**Chú ý:** Đoạn code này làm **nổi đường viền/vùng SVG**, **chưa làm sáng nguyên pixel đồ vật trong ảnh gốc**. Muốn giống hiệu ứng game trong hình, hãy bổ sung sprite trong suốt khớp vị trí, alpha mask, animation và kiểm tra thứ tự layer. Với SVG path, các vùng click nên được kiểm thử cả trên chuột, cảm ứng và bàn phím. Nếu có zoom/pan, áp dụng transform cho cả background và SVG trong cùng một scene content container.

## 13. UI/UX và responsive specification

### Desktop (gợi ý từ 1024px)

- Sidebar đủ rộng cho logo và 4 menu.
- Scene giữ tỷ lệ gốc và tận dụng chiều rộng, không kéo méo.
- Objects Found ở cạnh dưới vùng scene (kèm Back và nút Previous/Next); quiz có thể xuất hiện dạng card nổi hoặc màn riêng.
- Danh sách scene: 4 thẻ/hàng.
- Flashcard lớn căn giữa, nền scene blur nhẹ phía sau (nếu máy đủ mạnh).

### Tablet (gợi ý 768–1023px)

- Sidebar rút gọn hoặc chuyển sang drawer.
- Card grid 2 cột.
- Scene scale đều, nút zoom lớn để chạm.

### Mobile (dưới 768px)

- Dùng asset **mobile riêng** cho Setup/Home nếu được cung cấp.
- Scene Bedroom bản desktop có thể hiển thị `contain` và zoom/pan; **không crop làm mất đồ vật tương tác**.
- Quiz nên dùng bottom sheet hoặc màn full screen dễ bấm.
- Danh sách scene: 1 thẻ/hàng dưới 480px, 2 thẻ/hàng từ 480px.
- Objects Found có horizontal scroll (và nút Previous/Next); nhãn rõ và không che scene quá nhiều. Trên điện thoại ảnh ở trên, thanh Objects Found ngay dưới ảnh.
- Không dùng hover là hành động duy nhất; mọi chức năng phải thực hiện được qua touch.

### Accessibility

- Hỗ trợ focus/Enter/Space cho hotspot; nên có danh sách đồ vật thay thế cho người dùng keyboard/screen reader.
- Trạng thái focus phải nhìn thấy được, không chỉ glow khi hover.
- Button có tên rõ; ảnh có alt hợp lý; đủ contrast giữa chữ và nền sáng.
- Tôn trọng `prefers-reduced-motion`.
- Âm thanh không tự phát khi trang vừa tải; bật khi người học tương tác.

## 14. Cấu trúc thư mục đề xuất

```text
village-to-world/
├── public/
│   └── assets/
│       ├── branding/
│       │   ├── logo.png
│       │   ├── avatar-boy.png
│       │   └── avatar-girl.png
│       ├── backgrounds/
│       │   ├── setup-desktop.webp
│       │   ├── setup-mobile.webp
│       │   ├── home-desktop.webp
│       │   └── home-mobile.webp
│       ├── scenes/
│       │   └── bedroom/
│       │       ├── background.webp
│       │       ├── thumbnail.webp
│       │       ├── objects/
│       │       │   ├── lamp.webp
│       │       │   ├── bed.webp
│       │       │   └── ...
│       │       └── masks/
│       │           ├── lamp.svg
│       │           └── ...
│       ├── audio/
│       └── videos/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── layout/        # Sidebar, Header, MobileNav, Breadcrumb
│   │   ├── common/        # Button, ProgressBar, Avatar, AudioButton
│   │   └── scene/         # SceneViewport, SvgHotspots, ObjectSprite, ZoomControls
│   ├── features/
│   │   ├── onboarding/
│   │   ├── home/
│   │   ├── vocabulary/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── quiz/
│   │   ├── conversation/
│   │   └── settings/
│   ├── data/
│   │   ├── scenes/
│   │   │   └── bedroom.json
│   │   ├── words.json
│   │   └── conversations.json
│   ├── hooks/
│   ├── lib/
│   │   ├── storage.ts
│   │   ├── speech.ts
│   │   ├── quiz.ts
│   │   ├── progress.ts
│   │   └── assets.ts
│   ├── stores/
│   ├── types/
│   └── styles/
├── tests/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

**Chú ý đường dẫn asset:** Với Vite, file trong `public/assets/` được truy cập qua `/assets/...`. Nếu deploy ở subpath (như GitHub Pages), xử lý `base`/asset URL đúng, không giả định mọi deployment đều ở root `/`.

## 15. Danh sách component chính

| Component | Trách nhiệm |
| --- | --- |
| `AppShell` | Layout/sidebar/mobile nav chung |
| `ProfileSetupForm` | Tạo profile ban đầu |
| `AvatarPicker` | Chọn hình nam/nữ |
| `SceneGroupSection` | Nhóm scene theo Home/Garden |
| `SceneCard` | Thumbnail + progress |
| `TopicOverview` | Thông tin scene và CTA |
| `FlashcardViewer` | Thẻ từ vựng |
| `InteractiveScene` | Background + hotspot + highlight |
| `SvgHotspots` | Path và pointer/keyboard events |
| `ObjectHighlightSprite` | Làm sáng/phóng to vật thể đã tách nền |
| `SceneZoomControls` | Zoom/pan/reset/fullscreen |
| `ObjectsFoundBar` | Danh sách vật đã học |
| `QuizDialog` | Điều phối mode câu hỏi |
| `TypingQuestion` | Câu hỏi nhập từ |
| `MultipleChoiceQuestion` | Chọn đáp án |
| `AnswerResult` | Feedback và chi tiết từ |
| `ConversationPlayer` | Video và navigation |
| `TranscriptViewer` | Hội thoại theo speaker |
| `SpeakingPractice` | Microphone + fallback |
| `SettingsForm` | Lưu thay đổi hồ sơ/cài đặt |

## 16. State machine đề xuất

### Vocabulary Explore

```text
SCENE_READY
  ├─ hover/focus → OBJECT_HIGHLIGHTED
  ├─ select object → QUIZ_READY
  └─ zoom/pan → SCENE_READY

QUIZ_READY
  ├─ answer incorrect → QUIZ_INCORRECT → retry/show answer
  └─ answer correct   → QUIZ_CORRECT → WORD_DETAIL

WORD_DETAIL
  └─ Next Object → SCENE_READY

SCENE_READY
  └─ all objects completed → SCENE_COMPLETE
```

- Quản lý bằng union type/discriminated state hoặc reducer thay vì nhiều boolean mâu thuẫn.
- Khi chọn `wordId`, mode và danh sách options phải cố định đến khi kết thúc câu hỏi.
- Khi mở lại scene, đọc tiến độ từ storage.

## 17. Lộ trình triển khai (ưu tiên Bedroom end-to-end)

### Phase 1 — Nền tảng và bộ khung

- [ ] Vite + React + TypeScript, lint, test.
- [ ] Tạo theme/design tokens và AppShell desktop/mobile.
- [ ] Setup profile, avatar nam/nữ, background responsive.
- [ ] Journey (`/`) chỉ có ảnh như brief.
- [ ] Router và localStorage repository.

**Hoàn thành khi:** Người dùng setup một lần, refresh không mất profile, vào được 4 menu.

### Phase 2 — Vocabulary tĩnh

- [ ] Model scene/word, dữ liệu JSON.
- [ ] Vocabulary Scene List theo nhóm + progress.
- [ ] Topic Overview Bedroom.
- [ ] Flashcards với Next/Finish, audio, meaning, examples.

**Hoàn thành khi:** Điều hướng từ Vocabulary → Bedroom → Flashcards trơn tru trên desktop/mobile.

### Phase 3 — Explore và Quiz (quan trọng nhất)

- [ ] Chuẩn bị ảnh nền Bedroom sạch.
- [ ] Trace đủ hotspot SVG cho các vật có thể học; làm file JSON.
- [ ] Tách sprite/mask cho những đồ vật cần hiệu ứng glow toàn thân.
- [ ] Viết InteractiveScene có hover/click/touch/keyboard.
- [ ] Zoom + pan + reset.
- [ ] Hai mode câu hỏi với logic theo `canTypeWords`.
- [ ] Correct/Incorrect, Word Detail, Objects Found, progress lưu local.

**Hoàn thành khi:** Người học chọn một chiếc đèn trong Bedroom, thấy highlight đúng chiếc đèn, trả lời đúng, thấy từ “lamp”, rồi quay về scene với tiến độ tăng đúng một lần.

### Phase 4 — Conversation và Speaking

- [ ] Conversation Scene List/Topic List.
- [ ] Video player + CTA View Conversation.
- [ ] Transcript và phát audio từng câu.
- [ ] Speaking UI, xin quyền mic, hỗ trợ fallback.
- [ ] Speaking Result và lưu hoàn thành bài.

**Hoàn thành khi:** Đi được từ Bedroom → My Bedroom video → Transcript → Practice; thiết bị không hỗ trợ mic vẫn học tiếp được.

### Phase 5 — Kiểm thử và triển khai

- [ ] Responsive mọi màn.
- [ ] Kiểm tra ảnh không méo, hotspot không lệch ở nhiều tỷ lệ màn hình.
- [ ] QA cảm ứng iOS/Android và chuột desktop.
- [ ] Tối ưu dung lượng/độ nét assets.
- [ ] Test refresh, back/forward, xóa storage, permission mic.
- [ ] Build và deploy lên static hosting.

## 18. Acceptance criteria / checklist QA

### Product

- [ ] Setup không có upload ảnh.
- [ ] Ảnh boy/girl hiển thị riêng, không bị méo/cắt mất phần quan trọng.
- [ ] Journey vùng nội dung chỉ hiển thị hình, không thêm CTA.
- [ ] Sidebar đúng 4 mục.
- [ ] Vocabulary group theo topic, progress đúng.
- [ ] Bedroom hiển thị đủ 24 từ/đồ vật trong bản production.
- [ ] Flashcards có Next, Finish.
- [ ] Video có đường vào transcript.
- [ ] Settings thay `canTypeWords` có tác dụng ngay với **câu hỏi tiếp theo**.

### Interactive scene

- [ ] Hover đúng vật và hiệu ứng chỉ áp dụng đúng vật.
- [ ] Không click nhầm vật khác ở các vùng sát nhau.
- [ ] Touch hoạt động mà không cần hover.
- [ ] Zoom/pan không làm lệch SVG hotspot.
- [ ] Fullscreen graceful fallback nếu browser không hỗ trợ.
- [ ] Correct update Objects Found và % một lần duy nhất.
- [ ] Đồ vật đã học vẫn có thể xem lại.

### Quiz

- [ ] `canTypeWords=false`: không bao giờ ra typing mode.
- [ ] `canTypeWords=true`: có cả typing và multiple-choice qua nhiều lượt.
- [ ] Typing chấp nhận đáp án đã khai báo, không tự cho đúng tất cả gần đúng.
- [ ] Multiple-choice chỉ có một đáp án đúng, không trùng option.
- [ ] Trả lời sai không tăng % hoàn thành.
- [ ] Đã hoàn thành rồi thì trả lời lại không tăng % quá 100%.

### Kỹ thuật

- [ ] Không có backend/private API key trong client.
- [ ] Không yêu cầu đăng nhập hoặc database.
- [ ] Browser storage hỏng/không khả dụng không làm app crash.
- [ ] Route deep-link xử lý đúng trên static hosting (SPA fallback hoặc hash routing).
- [ ] Audio/video có trạng thái lỗi, không autoplay trái chính sách trình duyệt.
- [ ] Mic từ chối quyền hoặc SpeechRecognition không hỗ trợ vẫn dùng được app.
- [ ] Build production không có lỗi TypeScript nghiêm trọng.

## 19. Rủi ro & giải pháp

| Rủi ro | Cách xử lý |
| --- | --- |
| Ảnh đẹp nhưng không biết vật nào ở đâu | Tạo hotspot SVG + sprite/mask thủ công một lần cho mỗi scene |
| Hotspot lệch khi responsive | Dùng cùng viewBox/aspect-ratio/transform cho ảnh và SVG |
| Sprite bị lệch với nền | Xuất sprite từ đúng scene gốc, dùng bounds cùng tọa độ |
| Scene quá nặng, tải chậm | WebP/AVIF, preload ảnh chính, lazy-load scene khác, giảm filter đắt |
| Touch khó chọn vật nhỏ | Tách visual contour và hit area, hỗ trợ zoom |
| Giọng phát âm khác máy | Dùng MP3 thu âm nhất quán khi có asset; TTS làm fallback |
| Speech recognition không chạy | Fallback Listen & Repeat/Mark as Practiced |
| Tiến độ mất khi xóa dữ liệu trình duyệt | Nêu rõ giới hạn; cân nhắc export/import JSON hoặc backend sau này |
| Hosting thư mục con làm lỗi URL | Cấu hình Vite base và router đúng môi trường |

## 20. Tài sản cần chuẩn bị trước khi coding full scene

**Bắt buộc**

1. Logo `Village to World` PNG nền trong suốt.
2. Avatar boy + girl là **2 ảnh riêng**, giữ đủ nhân vật.
3. Ảnh Setup desktop/mobile đã loại bỏ nhân vật dính vào nền.
4. Ảnh Home desktop/mobile riêng, không có form/menu nhúng vào ảnh.
5. Ảnh Bedroom background **sạch**, đủ nét, không có UI nhúng.
6. Danh sách chuẩn **24 từ Bedroom**: spelling, meaning, IPA, ví dụ, đáp án nhiễu.
7. Danh sách chuẩn **10 hội thoại Bedroom**, transcript, và nguồn video/audio thực tế.
8. File SVG path hoặc polygon của từng đối tượng Bedroom có thể click.

**Nên có để highlight đúng chất lượng thiết kế**

9. Sprite PNG/WebP tách nền của từng vật quan trọng (lamp, bed, pillow, desk, chair...).
10. Audio MP3 phát âm từng từ/câu nếu muốn giọng cố định giữa các trình duyệt.
11. Caption/subtitle (`.vtt`) cho video.

## 21. Cách khởi tạo dự án

```bash
npm create vite@latest village-to-world -- --template react-ts
cd village-to-world
npm install
npm install react-router-dom zustand
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm run dev
```

Tiếp theo cấu hình Tailwind CSS theo **hướng dẫn tương ứng phiên bản đã cài**, tránh sao chép lệnh cũ từ các phiên bản khác nhau. Sau đó dựng AppShell, router và localStorage trước khi làm scene tương tác.

**Chưa cần cài Three.js/PixiJS ở Phase 1.** Dùng SVG/CSS để xác minh trải nghiệm trước. Chỉ nâng cấp PixiJS nếu có nhu cầu hiệu ứng phức tạp, rất nhiều sprite, particle hoặc hiệu năng canvas tốt hơn rõ rệt.

## 22. Định nghĩa MVP hoàn thành

Một bản MVP đạt yêu cầu khi:

> Người học mới mở Village to World → setup với tên/nhóm tuổi/avatar/khả năng gõ → vào Home chỉ có ảnh → chọn Vocabulary → Bedroom → xem Flashcards → vào Explore → rê chuột/chạm chiếc đèn thấy highlight đúng vật → chọn vật → làm câu hỏi phù hợp với setting → xem kết quả “lamp”, nghe phát âm, xem ví dụ → quay lại scene thấy Objects Found tăng → thoát rồi quay lại vẫn giữ tiến độ → mở My Bedroom video, xem transcript và luyện nói, không cần backend hay database.

---

## 23. Ghi chú cho lập trình viên / AI coding agent

- Hãy bám sát **ảnh thiết kế gốc** về bố cục, logo, màu sắc, khoảng cách và phong cách Cozy 3D; nội dung spec này không thay thế file design hoặc asset chính thức.
- **Không được dựng giả hotspot bằng bounding box rộng** nếu làm click vào vùng xung quanh vật thể. Phải kiểm tra mask/path thực tế.
- **Không giả định “ảnh 3D” đòi hỏi Three.js**. MVP sử dụng 2D scene + 2.5D effects.
- Không hard-code tiến độ; dùng completed IDs thực tế.
- Không thêm backend, xác thực, upload profile, nút link trên Home hay tính năng ngoài phạm vi khi chưa được yêu cầu.
- Chỉ triển khai một scene Bedroom đầy đủ trước để kiểm chứng pipeline asset → tương tác → câu hỏi → tiến độ. Sau đó mới nhân rộng các scene.
- Nếu dữ liệu/asset chưa có, hiển thị placeholder hoặc trạng thái `Coming soon`, không tự nhận rằng hình demo hay danh sách mẫu đã là dữ liệu chính thức.

**Tệp prototype tham khảo hiện có trong môi trường làm việc:** `village_to_world_bedroom_demo.html` (demo HTML độc lập). Tệp này dùng để thử nghiệm ý tưởng, không phải code production.
