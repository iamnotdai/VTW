# VILLAGE TO WORLD — CODING SPECIFICATION

> **Phiên bản:** 1.1 (bổ sung Pronunciation, Grammar, lộ trình 4 bước của Conversation)  
> **Ngày:** 07/11/2026 (bản 1.0: 24/10/2026)  
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
- Giao diện có thanh menu dọc: **Journey, Vocabulary, Pronunciation, Conversation, Grammar, Settings** theo đúng thứ tự này (mục "Journey" trước đây tên "Home"; đổi tên để không trùng với nhóm scene "Home" và để sau này mở rộng timeline). **Grammar chỉ có ở khóa tiếng Anh**: khóa tiếng Trung có 5 mục. Grammar đứng cuối (trước Settings) để đổi khóa học không làm xê dịch các mục khác. Mục menu có thể gắn một tính năng của khóa học (`CourseConfig.features`) và chỉ hiện ở khóa có tính năng đó.
- Menu chia theo **nội dung học** (từ, âm, hội thoại, ngữ pháp), không chia theo 4 kỹ năng Nghe/Nói/Đọc/Viết. Kỹ năng là cách luyện, gắn vào từng hoạt động (bảng ở §4).
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
        │           │   └── Word Speaking      [mở rộng §7.7, lối tắt]
        │           ├── Explore Scene
        │           │   ├── Select Object
        │           │   ├── Quiz: Type / Multiple Choice
        │           │   └── Result + Word Detail
        │           └── Topic Conversations
        │               └── Video → Transcript → Speaking
        ├── Pronunciation                      [mở rộng §24]
        │   ├── IPA Sounds (khóa tiếng Anh)
        │   │   └── Sound Card (flashcard từng âm)
        │   └── Scene List
        │       └── Word Speaking              [cùng màn §7.7]
        ├── Conversation
        │   └── Scene List
        │       └── Conversation Detail = lộ trình 4 bước [§9.7]
        │           ├── ① Listen & Watch (Video)
        │           ├── ② Fill in the Blanks   [mở rộng §9.6]
        │           ├── ③ Read (Transcript)
        │           └── ④ Speak: Role-play [§9.5] / Speaking Practice
        ├── Grammar (chỉ khóa tiếng Anh)       [mở rộng §25]
        │   └── 12 thì
        │       └── Lesson → Practice → Result
        └── Settings
```

**Nguyên tắc:** Vocabulary và Conversation có thể vào **cùng một dữ liệu hội thoại** từ hai đường khác nhau. Không tạo hai bản hội thoại giống nhau. Tương tự, Vocabulary và Pronunciation cùng mở **một màn Word Speaking**; màn nhận biết đang ở menu nào để hiện breadcrumb và nút quay lại cho đúng.

**Bốn kỹ năng** (mỗi hoạt động hiện icon kỹ năng: tai, micro, sách, bút chì):

| Hoạt động | Nghe | Nói | Đọc | Viết |
| --- | :-: | :-: | :-: | :-: |
| Vocabulary: Flashcards, Quiz | ✓ | | ✓ | ✓ |
| Pronunciation: IPA, Word Speaking | ✓ | ✓ | | |
| Conversation ① Listen & Watch | ✓ | | | |
| Conversation ② Fill in the Blanks | ✓ | | ✓ | ✓ |
| Conversation ③ Read | ✓ | | ✓ | |
| Conversation ④ Speak | ✓ | ✓ | ✓ | |
| Grammar: Practice | ✓ | ✓ | ✓ | ✓ |

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

**Màn mở rộng (luyện nói có chấm điểm, bổ sung 11/2026):** đều có thanh trên (breadcrumb) như các màn phụ khác.

| Màn hình | Route | Nội dung/Chức năng |
| --- | --- | --- |
| Word Speaking | `/vocabulary/:sceneId/speaking` | Nói từng từ của scene, điểm 0–100, tô màu từng cụm âm (§7.7) |
| Role-play | `/conversation/:conversationId/role-play?as=<speakerId>` | Chọn/đổi nhân vật, nói câu của nhân vật đó, chấm điểm từng câu (§9.5) |
| Fill in the Blanks | `/conversation/:conversationId/fill-blanks` | Chọn (hoặc gõ) từ còn thiếu trong hội thoại, cho mọi người học (§9.6) |

**Màn mở rộng (bổ sung 11/2026, bản 1.1):**

| Màn hình | Route | Nội dung/Chức năng |
| --- | --- | --- |
| Pronunciation | `/pronunciation` | Thẻ IPA Sounds ở đầu (chỉ khóa tiếng Anh) + lưới scene như Vocabulary, % từ nói tốt (§24) |
| Pronunciation Scene | `/pronunciation/scene/:sceneId` | Cùng màn Word Speaking (§7.7), breadcrumb Pronunciation › Scene |
| IPA Sounds | `/pronunciation/sounds` | Bảng âm Anh-Mỹ: nguyên âm, nguyên âm đôi, phụ âm (§24.2) |
| Sound Card | `/pronunciation/sounds/:soundId` | Flashcard một âm: ký hiệu, mẹo khẩu hình, từ ví dụ của scene (§24.2) |
| Sound Speaking | `/pronunciation/sounds/:soundId/speaking` | Lượt Word Speaking với các từ ví dụ của âm (§24.2) |
| Grammar | `/grammar` | Lưới 12 thì 3 × 4, chỉ khóa tiếng Anh (§25) |
| Grammar Lesson | `/grammar/:topicId` | Công thức, cách dùng, dấu hiệu, ví dụ (§25) |
| Grammar Practice | `/grammar/:topicId/practice` | Bài tập từng câu, màn kết quả (§25) |

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
- `Finish` (hoặc `Next` ở thẻ cuối) thoát về overview hoặc chuyển sang Explore qua CTA rõ ràng (thẻ "Great job!" với Explore, **Practice Pronunciation** (§7.7; trước đây tên "Practice Speaking", đổi để không trùng nút Speaking Practice của hội thoại), Back to Overview, Start the cards again).
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

### 7.7. Word Speaking — luyện nói theo flashcard *(mở rộng)*

- Hai lối vào, **một màn**: thẻ "Great job!" cuối Flashcards (`Practice Pronunciation`) → `/vocabulary/:sceneId/speaking` (breadcrumb Vocabulary › Scene › Speaking); thẻ scene ở menu Pronunciation → `/pronunciation/scene/:sceneId` (breadcrumb Pronunciation › Scene, menu Pronunciation sáng). Nút quay lại ở màn tổng kết đi theo menu đang mở.
- Điểm tốt nhất mỗi từ được lưu (§11.1, §24.1) để menu Pronunciation hiện tiến độ; **không** cộng vào tiến độ học từ hay Level.
- Lần lượt từng từ của scene (thứ tự flashcard): ảnh, từ, IPA (pinyin), nghĩa tiếng Việt (nếu bật trong Settings), nút nghe, **nghe chậm** (con ốc sên), **nghe lại chính mình** (khi có bản ghi), thanh tiến độ "Word 3 of 24".
- Bấm micro và nói → điểm **0–100** trong vòng tròn + mức: ≥ 80 `Excellent!`, ≥ 55 `Almost there!`, còn lại `Let’s try again!` (ngưỡng trong `SPEAKING_SCORE`). Từ được **tô màu theo cụm âm** (th, ee, er…): xanh = đúng, vàng gạch chấm = gần đúng, đỏ gạch sóng = cần luyện; màu luôn kèm kiểu gạch chân để không chỉ dựa vào màu. Hiện "We heard: …".
- Nút sau khi chấm: `Try Again` và `Next Word` (điểm thấp: `Try Again` là nút chính và `Skip`). Cuối lượt: điểm trung bình, điểm tốt nhất từng từ, `Practice the Tricky Words` (từ < 80 hoặc bỏ qua), `Practice All Words Again`, Explore, Back to Overview.
- **Cách chấm (không backend):** trình duyệt chỉ trả về chữ (các phỏng đoán của `SpeechRecognition`, lấy tối đa 5). Điểm so phỏng đoán với từ mục tiêu: tìm cụm từ nghe được gần nhất ("it's a lamp" → "lamp"), so từng chữ cái; đúng ở phỏng đoán thứ 2, 3… bị trừ điểm; `confidence` ảnh hưởng nhẹ; còn phần đỏ thì không quá 79. `acceptedAnswers` và `Word.soundsLike` (từ đồng âm như "pair" cho "pear") tính là đúng. Tiếng Trung: so từng chữ Hán, chữ đồng âm cùng thanh là đúng, cùng âm khác thanh là gần đúng kèm nhắc thanh điệu (pinyin tra bằng `pinyin-pro`, tải lười).
- **Ghi rõ giới hạn trên màn hình:** điểm là ước lượng từ những gì trình duyệt nghe được, không phải bài kiểm tra phát âm đầy đủ. Chấm theo âm vị/trọng âm thật như ELSA cần dịch vụ chấm phát âm có API key hoặc mô hình âm học lớn — ngoài phạm vi "không backend" (§1).
- **Nghe lại chính mình:** nếu trình duyệt cho phép vừa nhận dạng vừa ghi âm (`MediaRecorder`), lần thử cuối được giữ **trong bộ nhớ** (object URL), xóa khi thử lại/sang từ/rời màn. Không lưu, không upload (§9.4). Không ghi trên Android; tự tắt khi phát hiện micro không dùng chung được.
- Không hỗ trợ nhận dạng / micro bị chặn → `Listen & Repeat`: nghe, nói to, bấm `I said it!`.
- Luyện nói **không** cộng tiến độ học từ (§8 Feedback, §11.2).

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
- Không upload hay lưu file giọng nói trong MVP. (Word Speaking và Role-play chỉ giữ lần thử cuối trong bộ nhớ để "nghe lại chính mình", §7.7.)
- Màn Speaking Practice vẫn so khớp đơn giản như trên. Các màn **có chấm điểm** (Word Speaking §7.7, Role-play §9.5) dùng điểm ước lượng từ phỏng đoán của trình duyệt và luôn ghi rõ đó không phải bài kiểm tra phát âm đầy đủ.

### 9.5. Role-play — đóng vai theo hội thoại *(mở rộng)*

- Vào từ Transcript hoặc Conversation Detail (`Role-play`) → `/conversation/:conversationId/role-play`. Có thanh trên (breadcrumb).
- **Chọn nhân vật:** mỗi nhân vật của hội thoại là một thẻ (ảnh, tên, số câu, `Be <tên>`). Lựa chọn nằm trong URL (`?as=<speakerId>`, điều hướng kiểu replace để nút Back rời màn thay vì đi qua từng lần chọn). `Change Character` có ở mọi lúc (đang chơi hoặc ở màn kết quả) và quay lại màn chọn, đánh dấu nhân vật vừa chơi.
- **Chơi:** bấm `Start` (thao tác của người dùng nên trình duyệt cho phép đọc). Câu của nhân vật khác tự đọc lần lượt (file audio nếu có, không thì giọng trình duyệt với cao độ riêng của nhân vật), hiện dạng bong bóng chat; có `Skip`. Đến câu của người học: khung `Your turn!` với nút nghe câu mẫu, nghe chậm, micro; chấm điểm như §7.7 nhưng **theo từng từ** (từ thiếu = đỏ, từ gần giống = vàng); `Try Again` / `Continue`. Điểm hiện ngay trên bong bóng của câu đó.
- Tắt âm thanh trong Settings: câu của nhân vật khác không tự đọc, có nút `Continue`.
- Không hỗ trợ nhận dạng / micro bị chặn: `Listen & Repeat` → `I said it!`.
- **Kết thúc:** điểm trung bình các câu của người học (điểm tốt nhất mỗi câu), danh sách câu kèm điểm, `Play again`, `Change Character`, `Fill in the Blanks`, quay lại hội thoại. Xong một lượt Role-play cũng đánh dấu hội thoại **đã hoàn thành** (như xong Speaking Practice).

### 9.6. Fill in the Blanks — điền từ theo hội thoại *(mở rộng)*

- **Cho mọi người học** (bản 1.1; trước đây chỉ cho `canTypeWords = true`). Mặc định là **chọn đáp án**:
  - Mỗi chỗ trống có `FILL_BLANKS_CONFIG.choiceCount` lựa chọn (3), đúng một lựa chọn đúng, không có hai lựa chọn trùng chữ sau chuẩn hóa. Từ nhiễu lấy lần lượt từ đáp án của các chỗ trống khác trong cùng hội thoại, từ vựng của scene, rồi các từ dài khác của hội thoại; tiếng Trung chỉ lấy từ chữ Hán. Lựa chọn tạo **một lần** cùng lúc với bộ chỗ trống.
  - Lựa chọn là `button` (không phải radio), chạm là chấm ngay (như §8 Multiple-choice): đúng thì từ điền vào chỗ trống màu xanh; sai thì nút đó vàng, rung nhẹ, bị khóa, chọn lại được. Tiếng Trung: lựa chọn có pinyin.
  - Người học `canTypeWords = true` có thêm nút "Type the words instead" để chuyển sang ô gõ (luật gõ bên dưới). Người học không gõ được không bao giờ thấy ô gõ.
- Hội thoại hiện đầy đủ, mỗi câu ẩn **một** từ thành chỗ trống: ưu tiên từ vựng của scene có trong câu (kể cả số nhiều, cụm từ như "pencil cup"), không có thì một trong các từ dài nhất; **không** ẩn tên nhân vật, từ nhỏ (the, is, your…; 的, 我的…) và từ mà đáp án còn xuất hiện ở chỗ khác trong cùng câu. Tiếng Trung tách từ bằng `Intl.Segmenter` (chữ nằm trong từ khác, như 床 trong 起床, không được chọn); pinyin vẫn hiện nhưng che âm tiết của chỗ trống. Chọn ngẫu nhiên **một lần** khi tạo bài (như phương án quiz), `New Blanks` tạo bộ mới.
- Mỗi câu có nút nghe (luyện nghe chép) và bản dịch tiếng Việt (nếu bật trong Settings).
- Chế độ gõ — `Check Answers`: chỉ bỏ qua hoa/thường, dấu câu, khoảng trắng — không chấp nhận sai chính tả (giống §8 Typing mode). Ô đúng xanh, ô sai vàng + rung nhẹ; sửa ô nào thì bỏ đánh dấu ô đó; `Check Again`. Bộ gõ tiếng Trung: Enter để chọn chữ trong bộ gõ không bị tính là nộp bài.
- Cả hai chế độ: `Show Answers`. Kết thúc: "x / y đúng ngay lần đầu", `New Blanks`, bước tiếp theo (§9.7), quay lại hội thoại. Không cộng tiến độ học từ; đúng hết (không bấm `Show Answers`) thì đánh dấu bước ② của hội thoại (§9.7).

### 9.7. Lộ trình 4 bước của hội thoại *(mở rộng, bản 1.1)*

- Conversation Detail hiện 4 bước theo thứ tự, mỗi bước có icon kỹ năng (§4) và dấu ✓ khi đã xong:
  1. **Listen & Watch** → `/conversation/:id/video`. Xong khi xem/nghe hết.
  2. **Fill in the Blanks** → `/conversation/:id/fill-blanks`. Xong khi đúng hết (§9.6).
  3. **Read** → `/conversation/:id/transcript`. Xong khi bấm nút bước tiếp theo ở cuối transcript.
  4. **Speak** → Role-play (§9.5), Speaking Practice là lựa chọn phụ. Xong = hội thoại **đã hoàn thành** (`completedConversationIds`, luật cũ không đổi).
- **Không khóa bước nào** (§2.2): người học vào bước nào cũng được. Cuối mỗi màn có nút sang bước kế tiếp: Video → Fill in the Blanks → Transcript → Role-play.
- Dấu ✓ lưu trong `LearningProgress.conversationStepsById` (theo khóa học), chỉ ghi khi người học thực sự làm xong bước, không ghi khi mở màn.
- **Khi hội thoại chưa có video** (`videoSrc`/`youtubeId`): bước ① vẫn chạy được — phát lần lượt các câu (audio hoặc giọng trình duyệt) trên poster, làm sáng avatar người đang nói; nút CC hiện câu đang nói, **mặc định tắt** để luyện nghe. Có video thì dùng video.

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
  soundsLike?: string[]; // mở rộng §7.7: từ đồng âm, vd "pear" → ["pair", "pare"]
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
vtw:v1:profile         -> UserProfile
vtw:v1:progress        -> LearningProgress (khóa tiếng Anh)
vtw:v1:zh:progress     -> LearningProgress (khóa tiếng Trung)
vtw:v1:settings        -> AppSettings
vtw:v1:speaking        -> SpeakingProgress (điểm tốt nhất mỗi từ, khóa tiếng Anh)   [bản 1.1, §24.1]
vtw:v1:zh:speaking     -> SpeakingProgress (khóa tiếng Trung)                       [bản 1.1]
vtw:v1:grammar         -> GrammarProgress (bài tập đã làm đúng, chỉ tiếng Anh)      [bản 1.1, §25]
```

- Tiến độ phát âm và ngữ pháp là **chỉ số riêng**: không cộng vào `completedWordIdsByScene`, % của scene ở Vocabulary hay Level.

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
- [ ] Menu đúng thứ tự Journey, Vocabulary, Pronunciation, Conversation, Grammar, Settings; khóa tiếng Trung không có Grammar.
- [ ] Grammar: 12 thì, thì chưa có bài là `Coming soon`; luyện tập chỉ tính câu trả lời đúng, mỗi câu một lần; xem đáp án không tính.
- [ ] Mobile: thanh dưới vừa màn 360px (chữ chỉ hiện ở mục đang chọn, mục khác vẫn có tên cho trình đọc màn hình).
- [ ] Word Speaking mở từ Vocabulary và Pronunciation là cùng một màn; luyện nói không làm tăng % học từ.
- [ ] Fill in the Blanks dùng được khi `canTypeWords=false` (chỉ chọn đáp án, không có ô gõ).
- [ ] Conversation Detail có 4 bước, không khóa bước; dấu ✓ chỉ có sau khi làm xong bước.
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

---

## 24. Pronunciation *(mở rộng, bản 1.1)*

Menu thứ ba (`/pronunciation`), có ở cả hai khóa học. Trang có tiêu đề (`TopBar` như Conversation), nền giống trang Vocabulary:

- Đầu trang: thẻ chủ đề **IPA Sounds** (chỉ khóa tiếng Anh). Khóa tiếng Trung sau này có thẻ **Pinyin** (thanh mẫu, vận mẫu, thanh điệu) ở cùng chỗ; khi chưa có thì không hiện thẻ.
- Bên dưới: các nhóm scene đóng/mở và lưới thẻ scene **y như Vocabulary** (§7.1, dùng lại component). Thẻ scene mở Word Speaking của scene đó (`/pronunciation/scene/:sceneId`, §7.7).

### 24.1. Tiến độ phát âm

- Lưu **điểm tốt nhất của mỗi từ** (`SpeakingProgress = { bestScoreByWordId: Record<string, number>; updatedAt: string }`), theo khóa học (§11.1). Ghi mỗi khi một lượt Word Speaking (của scene hoặc của một âm) chấm một lần nói, chỉ giữ điểm cao nhất.
- Thẻ scene ở Pronunciation hiện % = số từ của scene có điểm tốt nhất ≥ `SPEAKING_SCORE.great` (80) / số từ của scene.
- Không bao giờ ghi vào tiến độ học từ, % ở Vocabulary hay Level (luật §7.7). Không lưu bản ghi âm.

### 24.2. IPA Sounds (khóa tiếng Anh)

- **Bảng âm Anh-Mỹ**, khớp với giọng en-US của app. Ký hiệu thống nhất với IPA trong `words.json`: nguyên âm `iː ɪ e æ ɑː ɔː ʊ uː ʌ ə ɜːr ər`, nguyên âm đôi `eɪ aɪ ɔɪ aʊ oʊ`, 24 phụ âm (`p b t d k ɡ f v θ ð s z ʃ ʒ h tʃ dʒ m n ŋ l r j w`). Không dùng bảng "44 âm" Anh-Anh.
- IPA của mọi từ tiếng Anh phải tách hết được thành các âm trong bảng (`tokenizeIpa` trong `src/lib/ipa.ts`, tách theo ký hiệu dài nhất trước, bỏ qua `/`, `ˈ`, `ˌ`, khoảng trắng). `npm run content:check` báo lỗi khi có ký hiệu lạ. Không dùng dấu chấm tách âm tiết, không dùng `ɚ`, `ɝ`, `t̬`.
- Dữ liệu âm: `src/data/pronunciation/ipa.json` (thứ tự trong file là thứ tự trên bảng), mỗi âm `{ id, symbol, aliases?, group: 'vowel' | 'diphthong' | 'consonant', tipVi, extraExamples?, audio?, mouthImage? }`. `aliases`: cách viết khác của cùng âm trong `Word.ipa` (`i` ngắn cuối từ như bunny `/ˈbʌni/` thuộc `/iː/`). `extraExamples` (`{ text, ipa, meaningVi }`): chỉ cho âm không có từ nào trong các scene (`/ð/`: this, mother…). `tipVi` là mẹo khẩu hình bằng tiếng Việt (nội dung, cần người duyệt).
- **Bảng âm** (`/pronunciation/sounds`): ba nhóm, mỗi âm là một ô (ký hiệu + một từ ví dụ), bấm mở Sound Card. Ô có dấu ✓ khi một trong các từ ví dụ của âm đã được nói tốt (điểm tốt nhất ≥ 80).
- **Sound Card** (`/pronunciation/sounds/:soundId`): ký hiệu lớn, mẹo khẩu hình, tối đa `IPA_CONFIG.exampleWords` (6) **từ ví dụ lấy tự động** từ từ vựng các scene có chứa âm đó (theo thứ tự scene và flashcard; từ ghi đúng ký hiệu chính đứng trước từ chỉ khớp qua `aliases`), mỗi từ có ảnh đồ vật, IPA (tô sáng âm đang học, không chỉ dựa vào màu), nghĩa tiếng Việt (nếu bật) và nút nghe. Nút `Say These Words` mở **lượt Word Speaking** với chính các từ đó (`/pronunciation/sounds/:soundId/speaking`, chấm điểm như §7.7, quay lại Sound Card khi xong). Âm chỉ có `extraExamples` thì chỉ có nút nghe. `Previous` / `Next` theo thứ tự bảng. Khóa tiếng Trung mở các route này thì thấy thông báo kèm nút quay lại Pronunciation.
- **Giới hạn phải ghi nhớ:** giọng trình duyệt không đọc được một âm đơn lẻ, và nhận dạng giọng nói chỉ trả về chữ. Vì vậy chỉ có nút nghe âm khi có file `audio` thu sẵn, và chỉ chấm điểm các **từ ví dụ**, không chấm âm đơn lẻ. Chưa có `mouthImage` thì không hiện hình (không dùng ảnh tạm).

## 25. Grammar *(mở rộng, bản 1.1)*

Menu thứ năm (`/grammar`), **chỉ khóa tiếng Anh** và là phần **tùy chọn**: không gợi ý theo tuổi, không khóa bài, không tính vào Level hay % của scene. Mở `/grammar` khi đang học tiếng Trung thì thấy thông báo kèm nút vào Settings.

- **Trang chính:** 12 thì theo 3 hàng Quá khứ / Hiện tại / Tương lai, mỗi hàng 4 thẻ Đơn / Tiếp diễn / Hoàn thành / Hoàn thành tiếp diễn (điện thoại: 1 cột, từ 480px: 2 cột, desktop: 4 cột); mỗi thẻ có tên tiếng Anh, tên tiếng Việt, trình độ (A1–B2, chỉ để tham khảo) và % bài tập đã làm đúng. Thì chưa có nội dung là `Coming soon`, không mở được.
- **Lesson** (`/grammar/:topicId`): công thức khẳng định / phủ định / câu hỏi, cách dùng (tiếng Việt, là nội dung), dấu hiệu nhận biết, câu ví dụ có nút nghe. Câu ví dụ dùng lại từ vựng và ảnh đồ vật của scene (`wordIds`).
- **Practice** (`/grammar/:topicId/practice`): từng câu một, 3 dạng: chọn dạng động từ đúng (`choose`), nghe câu rồi chọn (`listen-choose`), chạm thẻ từ theo thứ tự để xếp thành câu (`order`, không cần kéo thả, dùng được bằng bàn phím). Lựa chọn và thẻ từ xáo **một lần** mỗi câu. Câu chọn: chạm là chấm ngay (như §8); sai thì nút vàng và bị khóa, sau một lần sai có `Show Answer`. Câu nghe: nút nghe và nghe chậm, nghĩa tiếng Việt chỉ hiện sau khi trả lời (nó lộ thì của câu). Câu xếp thẻ: nghĩa tiếng Việt là đề bài, chạm thẻ đã đặt để lấy lại, `Check` khi đặt đủ thẻ. Kết thúc: "x / y đúng ngay lần đầu", `Practice Again`, quay lại Lesson, `All Tenses`.
- **Tiến độ:** một bài tập chỉ tính sau khi trả lời **đúng**, và chỉ tính **một lần** (`vtw:v1:grammar`, §11.1).
- **Dữ liệu:** `src/data/grammar/<topicId>.json` (không có bản `zh/`). `content:check` kiểm tra: đáp án nằm trong các lựa chọn, lựa chọn không trùng nhau, `wordIds` tồn tại, ghép các thẻ từ đúng bằng câu gốc. Nội dung viết mới và cần giáo viên tiếng Anh duyệt. Hiện có bài của 4 thì A1 (hiện tại đơn, hiện tại tiếp diễn, quá khứ đơn, tương lai đơn): mỗi thì 2–3 cách dùng, 3 công thức, dấu hiệu nhận biết, 6 câu ví dụ, 10 bài tập (5 chọn, 2 nghe, 3 xếp thẻ). 8 thì còn lại là `coming-soon`.
