# ROADMAP — tính năng web đã có, mobile chưa có

Đối chiếu `vedora-frontend` (main, tới `9b1d532` — SEO blog) với `vedora-mobile` (tới `0da9fab`), ngày 2026-11-06.

Tài liệu này thay thế phần "còn thiếu" của [FEATURE_PARITY_PLAN.md](FEATURE_PARITY_PLAN.md) (2026-10-23). Phần lớn đợt 1–3 trong tài liệu đó đã xong: Cloudinary, Turnstile, quên mật khẩu, chi tiết bài + bình luận, hồ sơ người khác + theo dõi, công thức từ API, thông báo (có SSE), bài đã lưu, tìm kiếm, ảnh hồ sơ/username, gợi ý theo dõi, đọc Blog đầy đủ. Mục dưới đây chỉ liệt kê cái **còn thiếu**, đã đối chiếu lại với code hai bên.

Quy ước: **P1** = nên làm tiếp, giá trị cao và ít rủi ro; **P2** = làm sau; **P3** = cần quyết định sản phẩm/backend trước. Mỗi task đủ để giao cho một agent riêng. Agent phải đọc `AGENTS.md`, `docs/AGENT_RULES.md`, tài liệu Expo SDK đúng phiên bản, và file web trong cột "Tham chiếu web" để lấy đúng contract API.

## Bảng tổng hợp

| # | Tính năng | Ưu tiên | Web (tham chiếu) | Mobile hiện tại |
|---|-----------|---------|------------------|-----------------|
| R1 | Xóa bài viết của mình | P1 | `posts/components/delete-post-dialog.tsx`, `deletePost` (`DELETE /posts/:id`) | Menu bài chỉ có Báo cáo/Chia sẻ, không xóa được |
| R2 | Lưu và đánh giá công thức, danh sách "Đã lưu" của công thức | P1 | `recipes/components/recipe-rating.tsx`, `saved-recipes.tsx`, `hooks/use-recipe-favorite.ts`, `use-recipe-rating.ts` | Chỉ xem danh mục và chi tiết |
| R3 | Danh sách đi chợ từ thực đơn tuần | P1 | `meal-plan/components/shopping-list-button.tsx`, `fetchShoppingList` | Chưa có |
| R4 | Đếm lượt xem bài | P1 | `posts/lib/view-tracker.ts` (`POST /posts/views`) | Chưa gửi lượt xem |
| R5 | Blog: viết, sửa, xóa, "Blog của tôi" | P1 | `features/blogs/*` (`/blogs`, `/blogs/mine`) | Chỉ đọc; lựa chọn Blog trong dialog tạo nội dung đang "Sắp có" |
| R6 | Sở thích nguyên liệu trong hồ sơ ăn uống | P1 | `dietary/components/dietary-view.tsx` (`likedIngredientIds`) | Khối "Sở thích nguyên liệu" đang "Sắp có" |
| R7 | Xác minh tài khoản chuyên gia + huy hiệu | P2 | `features/verification/*`, `shared/components/verified-badge.tsx` | Chưa có |
| R8 | Gói Pro/Premium (xem gói, thanh toán SePay QR) | P2 | `features/billing/*`, `docs/sepay-payments.md` | Chưa có |
| R9 | Đăng nhập Google | P3 | `auth/components/google-button.tsx`, `auth/lib/google.ts` | Chưa có |
| R10 | Chọn thú cưng dinh dưỡng (Mầm xanh / Bé Salad) | P3 | `shared/components/nutrition-pet.tsx`, `shared/lib/pet-preference.ts` | Chỉ có Mầm xanh cố định |

## Chi tiết

### R1 — Xóa bài viết của mình (P1)
- Web: `DELETE /posts/:id`, hỏi xác nhận, sau đó làm mới feed/hồ sơ/đã lưu.
- Mobile: thêm mục "Xóa bài" vào `features/posts/components/post-menu.tsx`, chỉ hiện khi tác giả là người đang đăng nhập (ngược lại với "Báo cáo", vốn ẩn với bài của mình). Thêm `deletePost` vào `posts.service.ts`, hook mutation trong `use-posts.ts`, invalidate các key feed, hồ sơ, bookmark; nếu đang ở màn chi tiết thì quay lại.
- Kiểm tra UI: xóa bài của mình từ feed và từ màn chi tiết; bài biến mất ở Khám phá, Hồ sơ; không thấy mục Xóa ở bài người khác; hủy xác nhận không xóa.

### R2 — Lưu và đánh giá công thức (P1)
- Web: yêu thích `PUT/DELETE /recipes/:id/favorite`, danh sách `GET /recipes/favorites?page=&limit=20`, đánh giá `GET/PUT/DELETE /recipes/:id/rating` (1–5 sao, xóa khi `null`), tóm tắt điểm công khai. Chi tiết key trong `recipes/recipes-cache.ts`, schema trong `recipes/schemas.ts`.
- Mobile: nút lưu và chọn sao ở `recipe-detail-screen.tsx` và thẻ công thức; thêm bộ lọc/tab "Đã lưu" trong tab Công thức. Cập nhật lạc quan, khách bấm thì chuyển tới đăng nhập với `returnTo`.
- Kiểm tra UI: lưu một công thức rồi vào "Đã lưu" thấy nó; bỏ lưu thì biến mất; đổi sao rồi mở lại vẫn giữ; khách bị yêu cầu đăng nhập.

### R3 — Danh sách đi chợ (P1)
- Web: lấy danh sách nguyên liệu gộp từ thực đơn đã lưu, chọn thứ trong tuần (T2–CN), nhóm theo mục (`SECTION_LABELS`), định dạng số lượng kiểu Việt (`formatQuantity`: "100,25"), sao chép. Contract trong `meal-plan/meal-plan.ts` (`shoppingListKey`, `shoppingListSchema`).
- Mobile: nút "Đi chợ" ở tab Thực đơn mở bottom sheet; tick từng món (lưu cục bộ), nút chia sẻ/sao chép dùng `Share`/`expo-clipboard`. Trạng thái rỗng khi chưa có thực đơn.
- Kiểm tra UI: có thực đơn tuần thì thấy danh sách nhóm theo mục; chọn bớt ngày thì danh sách đổi; chưa có thực đơn thì hiện hướng dẫn tạo.

### R4 — Đếm lượt xem (P1)
- Web: gom id bài đã hiển thị, mỗi bài chỉ báo một lần, gửi theo lô tối đa 50 mỗi 5 giây qua `POST /posts/views` với body `{ postIds }`, gửi nốt khi rời trang.
- Mobile: tracker nhỏ trong `features/feed` dùng `onViewableItemsChanged` của FlatList, gửi khi app xuống nền (`AppState`). Không chặn UI, bỏ qua lỗi.
- Kiểm tra UI: cuộn feed rồi xem số lượt xem trên web tăng; mở lại cùng bài trong một phiên không tăng thêm.

### R5 — Blog: viết, sửa, xóa (P1)
- Web: `POST /blogs`, `PATCH /blogs/:id`, `DELETE /blogs/:id`, `GET /blogs/mine?limit=50` (gồm bản nháp), upload ảnh `requestBlogImageUpload`, video `requestBlogVideoUpload`; nội dung là markdown. Xem `blogs/schemas.ts`, `editor/markdown.ts`, `hooks/use-blog-draft.ts` (lưu nháp).
- Mobile: mở lựa chọn Blog trong `compose-dialog.tsx`; màn "Blog của tôi" (vào từ tab Tôi) và màn soạn/sửa với `TextInput` markdown cùng thanh chèn đề mục/danh sách/ảnh/video, không port Lexical. Dùng lại uploader Cloudinary đã có cho video. Lưu nháp cục bộ. Đã có `features/blogs` (đọc) nên thêm mutation vào đó.
- Bỏ qua: panel "writing agent" của web.
- Kiểm tra UI: tạo blog có ảnh, đăng, thấy ở tab Blog của Khám phá; sửa rồi xem lại; xóa; thoát giữa chừng còn nháp.

### R6 — Sở thích nguyên liệu (P1)
- Web gửi `likedIngredientIds` cùng `ingredientIds` (nguyên liệu tránh) khi lưu hồ sơ ăn uống; mobile đang chỉ lo phần tránh và đặt "Sắp có" cho phần thích.
- Mobile: thay khối "Sắp có" trong `dietary-profile-screen.tsx` bằng bộ chọn nguyên liệu (tìm, chọn nhiều) dùng cùng dữ liệu với phần tránh; gửi `likedIngredientIds`. Chặn chọn trùng với danh sách tránh.
- Kiểm tra UI: chọn vài nguyên liệu thích, lưu, mở lại vẫn còn; chọn trùng với danh sách tránh thì bị chặn.

### R7 — Xác minh chuyên gia (P2)
- Web: `GET /verification/me` (trạng thái), upload minh chứng, `POST /verification` để nộp, trạng thái chờ/duyệt/từ chối kèm lý do; huy hiệu xác minh trên hồ sơ và thẻ bài. Duyệt thuộc admin (ngoài phạm vi mobile).
- Mobile: màn `verification` từ tab Tôi, chọn minh chứng bằng `expo-document-picker`/`expo-image-picker` (cần development build mới nếu thêm module native), hiển thị trạng thái; thêm `VerifiedBadge` ở thẻ bài, hồ sơ, bình luận.
- Kiểm tra UI: nộp hồ sơ thấy "Đang chờ duyệt"; sau khi admin duyệt trên web, huy hiệu xuất hiện trên mobile; bị từ chối thì thấy lý do và nộp lại được.

### R8 — Gói Pro/Premium (P2)
- Web: `GET /billing/plans`, `GET /billing/me`, tạo thanh toán rồi theo dõi `GET /payment-intents/:id` kèm SSE; QR chuyển khoản SePay, hủy khi chưa chuyển tiền. Hiện **gói không có đặc quyền**, chỉ ghi nhận thời hạn. Đọc `docs/sepay-payments.md` của web (idempotency key, SSE, hủy).
- Quyết định cần có trước: bán gói số trong app có thể vướng chính sách thanh toán của App Store/Google Play. Phương án an toàn là làm màn "Gói của bạn" **chỉ xem** (gói, hạn dùng, lịch sử) và mở trang `/billing` trên web để thanh toán. Chỉ làm luồng QR trong app khi đã chốt chính sách và gói có đặc quyền thực.
- Kiểm tra UI: gói hiện đúng sau khi mua trên web; hết hạn thì về Miễn phí.

### R9 — Đăng nhập Google (P3)
- Web dùng route server `app/auth/google/route.ts`. Mobile cần backend xác nhận contract (ví dụ `expo-auth-session` lấy ID token rồi gửi lên API). Chưa làm đến khi có contract; việc đầu tiên là đọc `vedora-api` và ghi lại endpoint cần.

### R10 — Thú cưng dinh dưỡng (P3)
- Web cho chọn Mầm xanh hoặc Bé Salad và vị trí nút nổi (lưu cookie). Mobile có nhân vật Mầm xanh cố định. Thêm lựa chọn trong Hồ sơ → Cài đặt, lưu bằng `expo-secure-store`/AsyncStorage, và ảnh Bé Salad cho nút trợ lý. Giá trị thấp, làm khi rảnh.

## Dọn dẹp nhỏ nên làm cùng

- Bỏ lựa chọn **"Công thức" (Sắp có)** trong `compose-dialog.tsx`: web không có kiểu đăng này, nên không thể đạt tương đương.
- Xóa file không dùng `features/navigation/components/assistant-button.tsx` (chưa được commit) và `features/meal-plan/components/meal-planner-screen.tsx`.
- Cập nhật mục "Mobile đã có" của `FEATURE_PARITY_PLAN.md` hoặc ghi chú "đã thay bằng ROADMAP" để tránh hai tài liệu mâu thuẫn.

## Ngoài phạm vi mobile (không làm)

- Toàn bộ `app/admin/*` (thống kê, người dùng, nội dung, báo cáo, CRUD công thức/nguyên liệu/quy tắc, kho kiến thức, duyệt xác minh).
- Landing 3D và nhạc nền, trang preview nội bộ (`/home/video-preview`, `/home/meal-planner/preview`).
- SEO web: tiêu đề trang theo bài, thẻ chia sẻ, structured data, `robots.ts`, `sitemap.ts`.

## Gợi ý riêng cho mobile (không có trên web)

Không thuộc phạm vi đồng bộ, nhưng hợp lý với app di động và cần backend/ứng dụng hỗ trợ:

- **Push notification** (FCM/APNs qua `expo-notifications`): thông báo hiện chỉ nhận qua SSE khi app mở. Cần backend lưu push token.
- **Deep link / universal link** cho `/posts/:id`, `/profile/:id`, `/recipes/:id` để mở link chia sẻ thẳng vào app (nút Chia sẻ đang gửi link web).
- **Lưu ngoại tuyến** công thức đã lưu và thực đơn tuần, vì hay dùng trong bếp.

## Thứ tự đề xuất

```
Đợt A (song song, ít đụng nhau): R1 Xóa bài · R4 Lượt xem · R6 Sở thích nguyên liệu · R2 Công thức (lưu/đánh giá)
Đợt B: R3 Đi chợ · R5 Blog (viết/sửa)
Đợt C: R7 Xác minh · R8 Gói (bản chỉ xem)
Sau cùng: R9 Google · R10 Thú cưng · mục "Gợi ý riêng cho mobile"
```

Ghi chú xung đột: R1 sửa `post-menu.tsx`; R7 chạm `post-card.tsx` (huy hiệu) — làm R7 sau R1. R5 chạm `compose-dialog.tsx` cùng phần dọn lựa chọn "Công thức".

## Ghi chú chung cho agent

- Không sửa `vedora-frontend` hay backend. Nếu endpoint web không khớp backend, ghi vào `docs/PLAN.md` mục "Giới hạn tích hợp".
- Mọi request qua `shared/api/api-client.ts` + `requestJson`; query key trong `data/*.keys.ts`; không gọi `fetch` rải rác (ngoại lệ: upload trực tiếp lên Cloudinary và SSE, đặt trong `services/`).
- Thư viện native mới cài bằng `npx expo install` và cần development build mới.
- Mỗi task một branch/PR riêng (`feat/mobile-<tên>`); chạy `npx expo lint`, `npx tsc --noEmit`; cập nhật `docs/PLAN.md` theo mẫu.
