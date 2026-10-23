# Kế hoạch đồng bộ tính năng web → mobile

So sánh `vedora-frontend` (main, tới commit `7d64244` — admin dashboard) với `vedora-mobile` (main, tới `f8b7697` — dietary overview), ngày 2026-10-23.

Mỗi task bên dưới đủ để giao cho một agent riêng. Agent **bắt buộc** đọc `AGENTS.md`, `docs/AGENT_RULES.md`, tài liệu Expo SDK 57 (`https://docs.expo.dev/versions/v57.0.0/`), và đọc code web tương ứng (đường dẫn ghi trong từng task) để lấy đúng contract API trước khi viết service. Sau mỗi task: `npx tsc --noEmit`, `npx expo lint`, cập nhật `docs/PLAN.md`.

## Mobile đã có

Đăng nhập/đăng ký/xác minh email, refresh token; feed Khám phá (Dành cho bạn, Đang theo dõi, Blog), like/bookmark trên thẻ bài; đăng video; Công thức (dữ liệu tĩnh); Vedora AI hỏi nhanh (khách, chưa gửi được vì thiếu Turnstile); Lên thực đơn; Hồ sơ của tôi (sửa tên/bio); Hồ sơ ăn uống.

## Danh sách tính năng web có mà mobile chưa có

| # | Tính năng | Web (tham chiếu) | Mobile hiện tại | Ưu tiên |
|---|-----------|------------------|-----------------|---------|
| 1 | Upload video qua Cloudinary | `features/posts/lib/cloudinary-upload.ts`, `posts/schemas.ts` (`videoUploadSchema`) | Vẫn dùng Mux `uploadUrl` → **đang hỏng** vì API trả `upload: {url, fields, chunkSize}` | P0 |
| 2 | Turnstile khi đăng nhập | `auth/components/login-form.tsx`, `docs/login-turnstile.md` | Không gửi `turnstileToken` → **đăng nhập mật khẩu có thể bị 403 `CAPTCHA_FAILED`** | P0 |
| 3 | Quên / đặt lại mật khẩu | `auth/components/forgot-password-form.tsx`, `reset-password-form.tsx` | Chưa có | P1 |
| 4 | Trang chi tiết bài viết + bình luận (tạo/sửa/xóa) | `posts/components/post-detail.tsx`, `post-comments.tsx`, `hooks/use-comments.ts` | Chỉ hiện số bình luận | P1 |
| 5 | Repost, chia sẻ, báo cáo bài viết | `posts/lib/posts-api.ts` (`setPostRepost`, `reportPost`), `report-dialog.tsx` | Repost chỉ hiện số; chưa có share/report | P1 |
| 6 | Bài viết đã lưu (danh sách bookmark) | `posts/components/bookmarks-view.tsx`, `BOOKMARKS_KEY` | Bookmark được nhưng không có màn xem lại | P1 |
| 7 | Tìm kiếm bài viết | `posts/components/search-view.tsx`, `hooks/use-post-search.ts` (`/posts/search?q=&cursor=`) | Chưa có | P1 |
| 8 | Hồ sơ người khác, theo dõi/bỏ theo dõi, danh sách followers/following | `profiles/components/profile-view.tsx`, `follow-button.tsx`, `profile-list.tsx`, `hooks/use-follow.ts` | Chỉ có hồ sơ của mình | P1 |
| 9 | Đổi avatar/ảnh bìa, đổi username | `profiles/hooks/use-profile-image.ts`, `lib/crop-image.ts`, `updateMyUsername` | Chỉ sửa tên/bio | P2 |
| 10 | Gợi ý người theo dõi | `profiles/hooks/use-suggestions.ts`, `right-rail.tsx` | Chưa có | P2 |
| 11 | Thông báo (danh sách, đánh dấu đã đọc, badge chưa đọc, SSE realtime) | `features/notifications/*` | Chưa có | P1 |
| 12 | Danh mục công thức công khai từ API | `recipes/components/recipe-feed.tsx`, `GET /recipes`, `GET /recipes/:id` | Dùng dữ liệu tĩnh showcase | P1 |
| 13 | Blog: blog của tôi, soạn/sửa blog, upload ảnh/video trong blog | `features/blogs/*` (Lexical editor, `/blogs`, `/blogs/mine`) | Lựa chọn Blog trong dialog tạo nội dung đang "Sắp có" | P2 |
| 14 | Xác minh tài khoản chuyên gia (nộp hồ sơ, xem trạng thái) | `features/verification/components/verification-form.tsx`, `verification-view.tsx` | Chưa có | P2 |
| 15 | Đăng nhập Google | `auth/components/google-button.tsx`, `app/auth/google/route.ts` | Chưa có | P3 (cần contract backend cho mobile) |
| 16 | Hỏi nhanh AI cho khách (gửi được thật) | `nutrition-chat/lib/guest-session.ts` | UI có, chặn vì chưa có Turnstile | P1 (làm sau task 2) |

**Ngoài phạm vi mobile:** toàn bộ `app/admin/*` (dashboard insights, users, content, reports, recipes CRUD, knowledge, duyệt verification), landing page 3D, các trang preview nội bộ (`/home/video-preview`, `/home/meal-planner/preview`).

## Thứ tự và phụ thuộc

```
Đợt 1 (song song): T1 Cloudinary · T2 Turnstile (+T16) · T3 Quên mật khẩu
Đợt 2 (song song): T4 Chi tiết bài + bình luận + repost/report/share · T8 Hồ sơ người khác + follow · T12 Công thức API · T11 Thông báo
Đợt 3: T6 Đã lưu + T7 Tìm kiếm (dùng lại PostCard/route chi tiết của T4) · T9+T10 ảnh hồ sơ/username/gợi ý (sau T8)
Đợt 4: T14 Xác minh chuyên gia · T13 Blog · T15 Google
```

Các task cùng đợt chạm file khác nhau, trừ `src/features/feed/components/post-card.tsx` (T4 sửa; T8 chỉ thêm điều hướng tới hồ sơ tác giả — để T8 làm sau khi T4 merge hoặc chỉ sửa đúng phần avatar/tên tác giả).

## Chi tiết task

### T1 — Chuyển upload video sang Cloudinary (P0)
- Sửa `src/features/feed/types/compose.schema.ts`: `videoUploadTargetSchema` = `{ media: {...}, upload: { url, fields: Record<string,string>, chunkSize } }` (copy từ `signedUploadSchema` web). Gửi `{ type: "VIDEO" }` khi `POST /media/uploads`.
- Thay `uploadVideoToMux` trong `services/compose.service.ts` bằng `uploadVideoToCloudinary`: multipart `POST` tới `upload.url` với đủ `fields` + `file`; nếu file > `chunkSize`, chia chunk với header `X-Unique-Upload-Id` và `Content-Range` giống web. Native: dùng `expo-file-system` (`File`, đọc theo byte range) hoặc `FormData` với `{ uri, name, type }`; web: XHR + `Blob.slice`. Giữ tiến trình %, hủy, và `DELETE /media/:id` khi bỏ.
- Kiểm tra UI: đăng video < 3 phút trên Android/iOS và web, video lớn hơn `chunkSize`, hủy giữa chừng, mất mạng.

### T2 — Turnstile cho đăng nhập + mở khóa chat khách (P0, gồm T16)
- Tra Expo docs cho `react-native-webview` (`npx expo install react-native-webview`), tạo component dùng chung `src/shared/components/turnstile-challenge.tsx` (hoặc `features/auth/components/`) render widget Cloudflare trong WebView (HTML inline, `postMessage` token về RN; xử lý expired/error/timeout). Site key qua `EXPO_PUBLIC_TURNSTILE_SITE_KEY` trong `shared/config/env.ts`, dev fallback test key `1x00000000000000000000AA` như web. Trên web platform dùng script Turnstile trực tiếp.
- Login: thêm `turnstileToken` vào schema + `POST /auth/login`; khóa nút tới khi có token; sau lỗi xóa mật khẩu và reset widget; xử lý `403 CAPTCHA_FAILED` theo `ApiError.code`, giữ luồng `EMAIL_NOT_VERIFIED`.
- Chat khách: dùng cùng component lấy token cho `startGuestSession` trong `nutrition-chat`, bỏ trạng thái "chặn chờ contract".
- Cần rebuild dev build (thư viện native).

### T3 — Quên / đặt lại mật khẩu (P1)
- Route `src/app/forgot-password.tsx`, `src/app/reset-password.tsx`; feature trong `features/auth`. Endpoint `POST /auth/password/forgot`, `POST /auth/password/reset` — đọc body/schema ở `vedora-frontend/features/auth/schemas.ts` và `actions.ts`. Xác định reset dùng mã OTP hay token link; nếu là link, cấu hình deep link (`scheme` trong `app.json`) để mở `reset-password?token=`. Thêm liên kết "Quên mật khẩu?" ở màn đăng nhập; sau khi đặt lại về login kèm thông báo.

### T4 — Chi tiết bài viết, bình luận, repost, chia sẻ, báo cáo (P1)
- Feature mới `features/posts` (hoặc mở rộng `feed`): route `src/app/posts/[id].tsx` dùng `GET /posts/:id`; hiển thị media (tái dùng `feed-video.tsx`), nội dung đầy đủ.
- Bình luận: `GET /posts/:id/comments` (phân trang cursor, `useInfiniteQuery`), `POST`, `PATCH /comments/:commentId`, `DELETE`; chỉ chủ bình luận được sửa/xóa. Khách đọc được, thao tác thì chuyển login với `returnTo`.
- Repost `PUT/DELETE /posts/:id/repost` (xem `setPostRepost`), report `POST /posts/:id/report` với lý do (xem `report-dialog.tsx`), chia sẻ bằng `Share` của React Native với link web `/posts/:id`. Ẩn report với bài của chính mình.
- Cập nhật `post-card.tsx`: chạm thẻ/biểu tượng bình luận → chi tiết; nút repost; menu "…" có Báo cáo/Chia sẻ. Optimistic update và invalidate các query feed.

### T6 — Bài viết đã lưu (P1, sau T4)
- Màn danh sách `GET /posts/bookmarks?limit=50`, vào từ tab Tôi. Bỏ lưu thì cập nhật cache cả feed và danh sách.

### T7 — Tìm kiếm bài viết (P1, sau T4)
- Route `src/app/search.tsx`, ô tìm có debounce, `GET /posts/search?q=&cursor=` với `useInfiniteQuery`. Giới hạn độ dài `q` theo schema web. Điểm vào: icon tìm kiếm ở header Khám phá.

### T8 — Hồ sơ người khác và theo dõi (P1)
- Route `src/app/profile/[id].tsx`, `profile/[id]/followers.tsx`, `profile/[id]/following.tsx`. Endpoint: `GET /profiles/:id`, `GET /profiles/:id/relationship`, `PUT/DELETE /profiles/:id/follow`, `GET /profiles/:id/followers|following?cursor=`, bài viết `GET /posts?authorId=&limit=20`.
- Tách phần hiển thị hồ sơ hiện có trong `profile-screen.tsx` thành component dùng chung (header, tab bài viết) cho cả "của tôi" và "người khác". Nếu `id` là của mình thì chuyển về tab Tôi.
- Chạm avatar/tên tác giả ở thẻ bài → hồ sơ. Cập nhật số follower optimistic, invalidate feed Đang theo dõi.

### T9 — Ảnh đại diện, ảnh bìa, username (P2, sau T8)
- Chọn và crop ảnh bằng `expo-image-picker` (`allowsEditing`, aspect 1:1 cho avatar, rộng cho cover) — xem lại docs SDK 57. Luồng 3 bước như web: `requestImageUpload` → upload lên storage (đọc `features/shared/lib/storage-upload.ts`) → `activateImage`; xóa ảnh bằng `removeImage`.
- Đổi username qua `PATCH /users/:id` (xem `updateMyUsername`), validate theo schema web, báo trùng theo `ApiError.code`.

### T10 — Gợi ý theo dõi (P2, sau T8)
- `GET /profiles/suggestions?limit=`, theo dõi và ẩn gợi ý (`DELETE /profiles/suggestions/:id`). Hiển thị một hàng cuộn ngang ở đầu feed Đang theo dõi (đặc biệt khi feed rỗng).

### T11 — Thông báo (P1)
- Feature `features/notifications`: route `src/app/notifications.tsx`; `GET /notifications?limit=30`, `GET /notifications/unread-count`, `POST /notifications/:id/read`, `POST /notifications/read`. Chạm thông báo → bài viết/hồ sơ theo `notification-text.ts` web.
- Badge chưa đọc trên icon chuông ở header Khám phá (hoặc tab Tôi). Realtime: kết nối `GET /notifications/sse` bằng Bearer token khi app foreground (tham khảo cách `shared/api/ai-stream.ts` đọc stream; dùng `expo/fetch`), ngắt khi background, refetch unread khi mở lại. Không làm push notification trong task này.

### T12 — Công thức từ API (P1)
- Thay dữ liệu tĩnh trong `features/recipes/components/recipes-screen.tsx` bằng `GET /recipes?page=&limit=` (`useInfiniteQuery`) và màn chi tiết `src/app/recipes/[id].tsx` dùng `GET /recipes/:id`. Lấy schema `recipePageSchema`, `recipeDetailSchema` từ `vedora-frontend/features/recipes/schemas.ts`; tham khảo `recipe-feed.tsx`, `recipe-source.tsx`. Giữ tìm/lọc nếu API hỗ trợ, nếu không thì lọc trên trang đã tải và ghi rõ giới hạn.

### T13 — Blog (P2)
- Đọc blog: kiểm tra tab Blog trên feed đã render đúng bài `type === "BLOG"` và mở được chi tiết (dùng route T4, render markdown — chọn thư viện render markdown tương thích Expo).
- Blog của tôi: `GET /blogs/mine?limit=50` (bản nháp + đã đăng), vào từ tab Tôi.
- Soạn/sửa: `POST /blogs`, `PATCH /blogs/:id` với body markdown (xem `features/blogs/schemas.ts`, `editor/markdown.ts`). Mobile dùng editor markdown đơn giản (TextInput + thanh chèn ảnh/video), không port Lexical. Upload ảnh `requestBlogImageUpload`, video `POST /blogs/videos/uploads` (dùng lại uploader Cloudinary từ T1). Bật lựa chọn Blog trong `compose-dialog.tsx`. Writing agent trên web đang là mock — bỏ qua.

### T14 — Xác minh tài khoản chuyên gia (P2)
- Feature `features/verification`: route `src/app/verification.tsx`, vào từ tab Tôi. `GET /verification/me` (trạng thái), upload minh chứng `requestProofUpload` (ảnh/PDF qua `expo-document-picker` hoặc image picker), `POST /verification` để nộp. Hiển thị trạng thái chờ/duyệt/từ chối + lý do; huy hiệu xác minh (`verified-badge.tsx`) trên hồ sơ và thẻ bài.

### T15 — Đăng nhập Google (P3)
- Web dùng route server Next `app/auth/google/route.ts`. Mobile cần xác nhận với backend luồng phù hợp (ví dụ `expo-auth-session` lấy ID token rồi `POST /auth/google` với token, hoặc redirect về deep link). Chỉ làm sau khi có contract; agent trước tiên đọc `vedora-api` và ghi lại contract cần thiết.

## Ghi chú chung cho agent
- Không sửa `vedora-frontend` hay backend. Nếu endpoint web không khớp backend, ghi vào `docs/PLAN.md` mục "Giới hạn tích hợp".
- Mọi request qua `shared/api/api-client.ts` + `requestJson`; query key trong `data/*.keys.ts`; không gọi `fetch` rải rác (ngoại lệ: upload trực tiếp lên Cloudinary và SSE, đặt trong `services/`).
- Thư viện native mới (`react-native-webview`, `expo-document-picker`…) cài bằng `npx expo install` và cần development build mới.
- Mỗi task một branch/PR riêng (`feat/mobile-<tên>`), cập nhật `docs/PLAN.md` theo mẫu.
