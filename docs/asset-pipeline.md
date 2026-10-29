# Quy trình asset cho scene tương tác

Tài liệu cho designer và developer khi thay ảnh placeholder bằng art chính thức (spec §7.5, §20).
Ví dụ dùng scene **Bedroom**; scene khác làm tương tự.

## 1. Những file cần có

```text
public/assets/scenes/bedroom/
├── bedroom-desktop.webp   # toàn cảnh SẠCH: không UI, không chữ, không con trỏ, không nhân vật
│                          # (cũng dùng làm thumbnail thẻ scene)
├── bedroom-mobile.webp    # bản dọc cho điện thoại (chưa dùng: cần trace hotspot riêng trước)
└── objects/
    ├── 01_bed.webp        # sprite từng đồ vật, nền trong suốt, đánh số 01–24 theo thứ tự trong
    ├── 02_pillow.webp     # bedroom.json; cũng là ảnh trên flashcard và ô Objects Found
    └── …                  # 24_plant.webp
```

Nền Setup/Home và ảnh nhân vật (avatar boy/girl) khai báo đường dẫn trong `src/config/assets.ts`.
Ảnh chân dung người nói trong hội thoại (Mom, Dad…) khai báo ở `avatar` trong
`src/data/speakers.json` (hiện là placeholder trong `public/assets/characters/`). App cắt tròn
quanh khuôn mặt bằng CSS, nên vẽ nhân vật cùng khung 600×800 với khuôn mặt ở nửa trên như
`avatar-girl.webp`.

## 2. Ảnh nền

- Xuất ở khoảng **2× kích thước hiển thị chuẩn** (ví dụ 2400–3200 px chiều ngang), rồi nén WebP/AVIF.
- Ghi lại **kích thước thật** của file cuối cùng vào `width`/`height` trong
  `src/data/scenes/bedroom.json`. Kích thước này chính là `viewBox` của lớp SVG.
- Nếu sau này crop hoặc đổi tỉ lệ ảnh, **phải trace lại toàn bộ hotspot**.

## 3. Trace đường viền (hotspot)

Mỗi đồ vật cần một `svgPath` bám theo **đúng biên của vật**. Không dùng hình chữ nhật bao quanh lớn
hơn vật (spec §23). Cách làm:

1. Mở `background` trong Figma / Illustrator / Inkscape với artboard **đúng bằng kích thước ảnh**,
   đặt ảnh ở toạ độ (0, 0), tỉ lệ 100%.
2. Dùng Pen tool vẽ đường viền kín cho từng vật, tên layer đặt bằng `wordId` (ví dụ `lamp`).
   - Vật gồm nhiều mảnh (đôi dép, hai bên rèm) thì gộp vào một path nhiều sub-path, vẽ **cùng chiều
     kim đồng hồ** để fill non-zero không tạo lỗ.
3. Xuất SVG, copy thuộc tính `d` của từng path vào `hotspots[].svgPath`. Path có thể dùng lệnh tuyệt
   đối hoặc tương đối; bộ kiểm tra sẽ báo nếu path nằm ngoài ảnh (dấu hiệu trace sai kích thước).
4. Đặt `zIndex`: vật nằm trên (gối trên giường, ngăn kéo trên tủ) có số lớn hơn. Vật trên nhận chạm
   trước, và phần nó che sẽ bị cắt khỏi hiệu ứng sáng của vật bên dưới.
5. Vật nhỏ (sách, đồng hồ, dép) thêm `touchPadding` (đơn vị viewBox, ví dụ 8–14) để dễ chạm trên điện
   thoại. Đường viền highlight không đổi.
6. Nếu đỉnh giữa của vật bị vật khác che (ví dụ tủ đầu giường bị chân đèn che), đặt `anchor` để dấu
   tick "đã tìm" và nhãn hiện ở chỗ khác trên vật.

```json
{
  "wordId": "lamp",
  "svgPath": "M 1056 332 L 1124 332 … Z",
  "sprite": "/assets/scenes/bedroom/objects/04_lamp.webp",
  "spriteBounds": { "x": 1022, "y": 324, "width": 136, "height": 150 },
  "zIndex": 3,
  "touchPadding": 6
}
```

## 4. Sprite đồ vật (để cả vật "sáng lên")

- Cắt từng vật từ **chính file background cuối cùng** (cùng ánh sáng, cùng góc nhìn), nền trong suốt.
- `spriteBounds` là hình chữ nhật chứa sprite, tính theo **toạ độ của background**. Sprite được vẽ
  đè đúng vị trí đó khi vật được hover/chọn, kèm hiệu ứng sáng và viền.
- Xuất đủ nét để dùng làm ảnh flashcard (khuyến nghị cạnh dài ≥ 512 px), nén WebP.

## 5. Kiểm tra

```bash
npm run content:check   # tham chiếu, hotspot trong ảnh, file tồn tại
npm run dev             # mở /vocabulary/bedroom/explore và rê chuột/chạm từng vật
npm run test:e2e        # gồm test zoom không làm lệch hotspot
```

Mẹo: trong Explore, Tab qua các ô của thanh **Objects Found**. Mỗi ô làm sáng vật tương ứng trên
tranh, nên dễ soát hết 24 vật xem viền có khớp không.

## 6. Ảnh hiện tại

Không còn ảnh SVG tự sinh. Chép file WebP vào đúng tên ở mục 1 (scene khác đặt `<id>-desktop.webp`,
`<id>-mobile.webp`), rồi chạy `npm run content:check`. Cho tới khi đủ file, check sẽ báo thiếu ảnh.

## 7. Ảnh giao diện (ngoài scene)

Ba loại ảnh này không nằm trong `src/data/scenes/*.json` mà khai báo trong code, nên
`npm run content:check` **không kiểm tra** chúng: sau khi thay file phải mở app xem bằng mắt.
Tất cả đều là WebP và phải render qua `assetUrl()`.

| File                                                               | Khai báo                                     | Dùng ở                                                                       |
| ------------------------------------------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------- |
| `public/assets/backgrounds/vocabulary-desktop.webp`                | `VOCABULARY_BACKGROUND` (`config/assets.ts`) | Nền trang Vocabulary, Topic Overview, Explore                                |
| `public/assets/backgrounds/sidebar.webp`                           | `SIDEBAR_BACKGROUND` (`config/assets.ts`)    | Nền sidebar (menu bên trái)                                                  |
| `public/assets/branding/completed-boy.webp`, `completed-girl.webp` | `COMPLETED_IMAGES` (`config/assets.ts`)      | Hình bé trong popup "Completed!" của Explore (theo hình bé trai/gái đã chọn) |
| `public/assets/icons/group-<id>.webp`                              | `SCENE_GROUPS[].icon` (`config/app.ts`)      | Icon cạnh tên nhóm scene (Vocabulary, Conversation)                          |

### Nền Vocabulary

- Tỉ lệ **16:9** (hiện 1672×941). Hiển thị `cover`, căn từ trên, ở độ mờ 80% (`VocabularyBackdrop`).
- Phần giữa ảnh nên là vùng **sáng, gần như trống** (kem/vàng nhạt): thẻ scene, tiêu đề và chữ phụ
  nằm đè lên đó. Cảnh chi tiết (cây, nhà, hoa) đặt ở mép trời và mép dưới.
- Chưa có bản dọc cho điện thoại: mobile dùng chung ảnh này và bị cắt hai bên.

### Nền sidebar

- Ảnh **dọc 1:3** (hiện 480×1440). Hiển thị `cover`, căn đáy, nên khi sidebar thu gọn (80px) chỉ thấy
  phần giữa ảnh.
- **Phần trên phải là navy trơn** (khoảng 60% chiều cao) để logo và 4 mục menu dễ đọc; cảnh ngôi làng
  chỉ nằm ở phần dưới, nơi có avatar và tên người học (chữ trắng đè lên, tránh vùng quá sáng).

### Icon nhóm scene

- Vuông **256×256**, **nền trong suốt**, WebP (khoảng 10–15 KB). Hiển thị 48px nên chọn hình đơn
  giản, đậm nét, không chữ.
- Tên file theo id nhóm: `group-home.webp`, `group-garden.webp`. Hiện có Home và Garden.
- Thêm icon cho nhóm khác (`village`, `school`, `town`): chép file vào `public/assets/icons/` rồi thêm
  `icon: '/assets/icons/group-village.webp'` vào dòng nhóm đó trong `SCENE_GROUPS`. Nhóm chưa có
  `icon` vẫn hiển thị bình thường, chỉ không có ảnh.

## 8. Giọng đọc tiếng Anh (Anh-Mỹ)

App đọc theo thứ tự: **file audio thu sẵn** → nếu không có hoặc lỗi thì dùng **giọng của trình duyệt**.

- **Giọng trình duyệt**: chỉ liệt kê giọng `en-US`. Người học chọn trong **Settings → Reading voice**
  (có nút nghe thử); mặc định "Automatic" chọn giọng nghe tự nhiên nhất của máy đó (Google, Microsoft
  Natural, Apple…). Danh sách giọng khác nhau tùy máy và trình duyệt.
- **Từ quan trọng**: thu sẵn giọng Anh-Mỹ để mọi máy nghe giống nhau. Đặt file MP3 (mono, ~64 kbps,
  một từ/câu một file) vào `public/assets/audio/words/<wordId>.mp3` (câu ví dụ: `…/examples/`,
  hội thoại: `…/conversations/`), rồi điền đường dẫn vào trường `audio` tương ứng trong
  `src/data/**/*.json`, ví dụ `"audio": "/assets/audio/words/lamp.mp3"`. Từ nào chưa có `audio` vẫn
  dùng giọng trình duyệt. Chạy `npm run content:check` để chắc chắn file tồn tại.
- Khi thu: dùng người đọc giọng Mỹ, đọc chậm và rõ, nghỉ ~0.2 s ở đầu/cuối file, cùng một người cho
  cả bộ để giọng nhất quán.
