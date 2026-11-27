# Mobile còn thiếu so với backend và web — 27/11/2026

> Hiện trạng mới được rà lại tại [báo cáo 28/11](MOBILE_PARITY_REVIEW_2026-11-28.md). Voice, nhà hàng và quản lý Trang đã có trên mobile; không dùng bảng lịch sử bên dưới làm danh sách việc còn thiếu hiện tại.

> Cập nhật sau báo cáo: mục Trợ lý giọng nói đã được tích hợp source theo web `f08e84f` (mic, Gateway Live, phiên gọi và lệnh màn hình/dữ liệu). Đã kiểm tra tự động và export Android/web; development build cùng kiểm tra mic/loa trên thiết bị còn chờ. Xem mục “Tích hợp trợ lý giọng nói” trong [PLAN.md](PLAN.md). Bảng dưới giữ nguyên kết quả tại thời điểm rà soát trước triển khai.

## Phạm vi đã đọc

| Repo | Source được đối chiếu |
| --- | --- |
| Backend | `tmp/node_modules/vedora-api-review-20261125`, HEAD `82c3f31effd2d0884b3a4bbab45c0357480872ea` |
| Web dùng làm mốc chính | `tmp/node_modules/vedora-web-dietary-review`, HEAD `f08e84f6b992cb4223a10776e6e1f7313a624f04` |
| Web tại máy | `C:/vedora`, HEAD `a71c6c44c04fbcd1a5c0ab55460aa9b917454f0f`; có thay đổi local `pnpm-lock.yaml`. Bản này cũ hơn mốc web đối chiếu chính. |
| Mobile | HEAD `9e2742730cd59df42827389285d4b513e02661b2`, **kèm các thay đổi local hiện tại**, gồm chuyển hồ sơ sang Ghi nhớ và đổi request chat sang `message` |

Đã đọc controller/DTO/caller, schema, hook và UI liên quan; tìm caller trong toàn bộ `src` mobile trước khi kết luận thiếu. Fetch BE và web đều không kết nối được GitHub, nên các commit trên chỉ là bản local đã có, chưa xác nhận là remote mới nhất. Không chạy BE/DB, API đăng nhập thật hoặc thao tác UI trên thiết bị. Các ưu tiên dưới đây là đề nghị triển khai, không phải mức độ lỗi đã tái hiện.

## A. Web đã có, mobile chưa có hoặc mới làm một phần

Đường dẫn trong bảng tính từ root từng repo. **P1**: hoàn thiện luồng sử dụng hiện có; **P2**: bổ sung parity; **P3**: tùy phạm vi sản phẩm.

| # | Ưu tiên | Chức năng | Phần mobile còn thiếu | Bằng chứng BE / web / mobile |
| --- | --- | --- | --- | --- |
| 1 | P1 | Trợ lý giọng nói | Mic, phiên gọi, gửi lượt nói, kết thúc cuộc gọi, trạng thái tiến trình và xử lý lệnh mở màn/làm mới dữ liệu từ trợ lý. | BE `src/meal-plan/voice/meal-planner-voice.controller.ts`: POST `/meal-plan/voice/session`, `/turns`. Web `features/meal-plan/hooks/use-meal-planner-voice.ts`, `voice.ts`, `components/voice-panel.tsx`, proxy `app/api/meal-planner/voice/session/route.ts`. Mobile chưa có caller/UI voice; chat chữ đã có. Phải đánh giá cách tích hợp native và gateway khi triển khai. |
| 2 | P1 | Danh sách đi chợ | Chọn ngày, cộng nguyên liệu từ thực đơn đã lưu, xem món đóng góp; đánh dấu đã mua/sao chép như web. | BE `src/meal-plan/shopping-list.controller.ts`; web `features/meal-plan/components/shopping-list-button.tsx`, `meal-plan.ts`; mobile chưa gọi `/meal-plan/shopping-list`. BE chỉ tính ngày chưa qua; trạng thái đã mua là client, chưa có API lưu riêng. |
| 3 | P1 | Feed Dành cho bạn | Chuyển feed tài khoản sang nguồn cá nhân hóa. | BE `src/posts/posts.controller.ts`; web `features/posts/posts-cache.ts:FOR_YOU_KEY` dùng `/posts/feed`; mobile `src/features/feed/services/feed.service.ts` vẫn gọi `/posts`. |
| 4 | P1 | Feed Đang theo dõi | Nguồn và phân trang chung của backend. | Web `features/posts/posts-cache.ts:FOLLOWING_KEY` dùng `/posts/following`; mobile `src/features/following/services/following.service.ts` lấy tối đa 20 bài theo từng tác giả rồi ghép. Đã có UI theo dõi, nhưng cách lấy dữ liệu chưa tương đương. |
| 5 | P1 | Tạo bài POST và nháp POST | Bài chỉ chữ, nhiều video, mở/tiếp tục nháp POST tạo từ web. | BE `src/posts/post-drafts.controller.ts`, `dto/create-post.dto.ts`; web `features/shared/components/composer.tsx`, module `post-drafts`; mobile `src/features/feed/services/compose.service.ts` chỉ tạo/lọc `kind === 'VIDEO'`, `hooks/use-compose-actions.ts` bắt buộc một video. Không tính luồng video hiện tại là chưa làm. |
| 6 | P2 | Thêm/thay video khi sửa bài đã đăng | Chọn và upload video mới ngay trong màn sửa. | Web `features/posts/components/edit-post-dialog.tsx` dùng `useMediaUploads`; mobile `src/features/posts/components/post-edit-screen.tsx` chỉ giữ/gỡ/đổi thứ tự video hiện có. **Sửa chữ và sửa danh sách video cũ đã làm**, không còn thiếu toàn bộ luồng sửa bài. |
| 7 | P2 | Sửa nhật ký ăn uống | Sửa khẩu phần/kcal của mục đã lưu. | BE `src/meal-plan/meal-log/meal-log.controller.ts`: PATCH `/meal-plan/log/:id`; web `features/meal-plan/meal-log.ts`, `components/meal-log-button.tsx`; mobile `src/features/meal-log/services/meal-log.service.ts` chỉ đọc/thêm/xóa/ước tính kcal, chưa có update/form sửa. |
| 8 | P2 | Nhờ trợ lý xem lại nhật ký tuần | Nút lấy ngữ cảnh tuần nhật ký và chuyển sang chat. | Web `features/meal-plan/components/meal-log-button.tsx:reviewWeek`; mobile `src/features/meal-log/components/meal-log-screen.tsx` chưa nối luồng này. Dùng chat hiện có, không cần endpoint nhận xét tuần riêng. |
| 9 | P2 | Dinh dưỡng công thức và thực đơn | Hiện kcal/suất, nhóm dưỡng chất; tổng hợp tuần và nút nhờ trợ lý cân đối theo mục tiêu. | BE `src/recipes/dto/recipe.dto.ts`, `src/meal-plan/dto/meal-plan.dto.ts` có `caloriesPerServing`, `nutritionPillars`; web `features/recipes/components/recipe-card.tsx`, `features/meal-plan/components/recipe-sheet.tsx`, `nutrition-companion-bar.tsx`. Mobile schema tại `src/features/recipes/types/recipe.schema.ts` và `meal-plan/types/meal-plan.schema.ts` chưa nhận hai trường này. **Kcal nhật ký, BMI, mục tiêu và check-in cân nặng đã có.** |
| 10 | P2 | Xem lại thực đơn tuần cũ | Chọn tuần từ `minWeekStart`, chỉ đọc ngày đã qua. | Web `features/meal-plan/components/week-nav.tsx`; mobile `src/features/meal-plan/utils/meal-week.ts:planningWeeks` bắt đầu từ `currentWeekStart` dù schema đã có `minWeekStart`. Nhật ký tuần cũ là luồng khác, đã có. |
| 11 | P2 | Upload/chèn video Blog | Chọn video mới, upload, tiến độ, retry/lỗi và chèn nội dung. | BE `src/posts/blogs/blogs.controller.ts`: POST `/blogs/videos/uploads`; web `features/blogs/lib/media-upload.ts:uploadBlogVideo`, `editor/use-media-insert.ts`; mobile `src/features/blogs/services/blogs.service.ts` mới upload ảnh. Đọc block video có sẵn không thay thế luồng chèn mới. |
| 12 | P2 | Thống kê bài của mình | Tổng hợp lượt xem/tim/bình luận/đăng lại/lưu theo khoảng ngày, danh sách bài và biểu đồ. | BE `src/posts/analytics/post-analytics.controller.ts`: `/analytics/posts`, `/summary`; web `features/post-analytics/components/analytics-view.tsx`; mobile chưa có caller/route/màn thống kê. Ghi nhận view đã có. |
| 13 | P2 | Tìm người dùng | Tìm tên/username/bio, mở hồ sơ và theo dõi từ kết quả. | BE `src/profiles/profiles.controller.ts`: `/profiles/search`; web `features/profiles/profiles-cache.ts:searchProfilesKey`, `hooks/use-profile-search.ts`; mobile `src/features/posts/components/search-screen.tsx` chỉ có Bài viết/Công thức, chưa có caller search profiles. |
| 14 | P2 | Khám phá nhà hàng | Danh sách/bản đồ theo vị trí, tìm món menu, xem menu và đọc/viết/sửa/xóa đánh giá. | BE `RestaurantsController` trong `src/workspaces/workspaces.controller.ts`; web `features/workspaces/components/restaurants-explorer.tsx`, `restaurant-reviews-section.tsx`; mobile chưa có caller/route/UI nhà hàng. |
| 15 | P3 | Chọn giao diện trong app | Sáng/Tối/Hệ thống và lưu lựa chọn. | Web `components/theme-switcher.tsx`; mobile `src/hooks/use-color-scheme.ts`, `src/components/vedora-theme-provider.tsx` theo hệ thống, chưa có lựa chọn riêng. Không cần API BE. |
| 16 | Theo vai trò | Trang/workspace | Đăng ký/gửi lại hồ sơ, thông tin Trang, thành viên/menu, chuyển danh tính cá nhân/Trang. | BE `src/workspaces/workspaces.controller.ts`, POST `/auth/switch`; web module `features/workspaces` và `app/home/pages`; mobile chưa có module/caller tương ứng. Chỉ đưa vào kế hoạch nếu mobile phục vụ chủ/quản lý Trang. |

## B. Đã có nhưng còn lệch hành vi/hợp đồng

1. **P1 — Bìa Blog không lưu đúng lựa chọn riêng.** BE `src/posts/blogs/blog-cover.ts:coverFromContent` lấy ảnh đầu nội dung; web `features/blogs/hooks/use-blog-draft.ts` cũng suy ra từ nội dung. Mobile `src/features/blogs/components/blog-editor-screen.tsx:addImage(true)` chỉ `setCover(url)`, gỡ chỉ xóa state cover, rồi gửi `coverImageUrl`. Chọn/đổi/gỡ bìa chưa đồng bộ nội dung nên lưu/mở lại có thể ra bìa khác. Cần sửa hành vi này trước khi thêm tính năng editor.
2. **P2 — Huy hiệu tổng tin nhắn chưa đọc có thể thiếu.** BE có GET `/messaging/unread-count`; web `features/messaging/messaging-cache.ts` dùng key endpoint này. Mobile `src/features/messaging/hooks/use-messaging.ts:useMessagingUnread` chỉ cộng 50 cuộc trò chuyện đầu mỗi ngăn friends/requests. Unread ngoài hai trang đầu không được tính.
3. **P2 — Thông báo đăng nhập tài khoản bị khóa/chưa hoạt động chưa phân biệt.** BE `src/auth-core/account-access.ts` trả `ACCOUNT_SUSPENDED`/`ACCOUNT_NOT_ACTIVE`; web `features/auth/lib/account-block.ts` có xử lý riêng. Mobile `src/features/auth/utils/auth-errors.ts` hiện vẫn gộp HTTP 401 login thành sai tên đăng nhập/mật khẩu. Có thay đổi local trong file này, nhưng hai mã trên vẫn chưa được xử lý trong source đang đọc.

## C. Backend có, chưa đủ căn cứ gọi là web đã làm

Các mục này tách khỏi bảng parity để không biến mọi endpoint thành yêu cầu mobile.

| Phần chưa nối | Bằng chứng và phạm vi |
| --- | --- |
| Lọc công thức theo thời gian, hiện nhóm món | BE `src/recipes/dto/recipe-catalog.dto.ts` có `maxMinutes`, recipe DTO có `tag`. Mobile `RecipeFilters` chỉ có `q/suitableForMe`, schema bỏ `tag`. Chưa thấy web dùng `maxMinutes` trong tìm công thức công khai; `maxMinutes` ở form lập thực đơn là luồng khác. |
| Cấu hình runtime | BE GET `/public-config`; chưa tìm thấy caller trên mobile hoặc web snapshot. Mobile vẫn dùng các hằng giới hạn riêng. |
| Sao chép tuần | BE POST `/meal-plan/copy`; chưa thấy caller chuyên biệt hai client. Chat tạo/lưu thực đơn đã có. |
| Tóm tắt AI bài viết riêng | BE GET `/posts/:postId/summary`; chưa thấy caller riêng hai client. Không nhầm endpoint này với rating summary hoặc analytics summary. |
| Đổi tên hội thoại | BE PATCH `/meal-plan/chat/threads/:threadId` hỗ trợ title; mobile PATCH hiện dùng trả lời tool, chưa có UI đổi tên. Chưa xác nhận web có thao tác đổi tên. |
| Tạo/xem trước/sửa thực đơn trực tiếp | BE POST `/meal-plan/preview`, `/generate`, PUT `/meal-plan/days`; mobile dùng chat/tool, chưa có caller trực tiếp. Web còn `generateMealDays` và component `QuickGenerate`, nhưng không tìm được caller/mount tương ứng khi rà source nên không coi đây là luồng web đang sử dụng đã hoàn chỉnh. |

Không đưa CRUD admin, kiểm duyệt, knowledge/logs, webhook/health vào yêu cầu mobile thành viên. Danh mục công thức admin và xóa tài khoản bị backend vô hiệu hóa không được xem là tính năng thành viên đã sẵn sàng.

## D. Các mục cũ đã loại khỏi danh sách thiếu

- Ticket hỗ trợ/khiếu nại, ảnh đính kèm, trao đổi/rút và mở từ thông báo: `src/features/support`, các route `src/app/support*`.
- Ảnh minh chứng báo cáo bài, báo cáo bình luận và thông báo xử lý: `src/features/posts/services/report-evidence.service.ts`, `comment-report.service.ts`, `src/features/notifications`.
- Sửa bài POST đã đăng: `src/app/posts/[id]/edit.tsx`, `post-edit-screen.tsx`, `use-update-post.ts`. Phần còn thiếu chỉ là upload video mới trong màn sửa.
- Ghi nhớ dị ứng/sở thích theo `{ allergies, preferences }`: schema/service/form local đã chuyển, không còn gọi `/dietary/options`; form yêu cầu thực đơn và thẻ hồ sơ đã đọc cấu trúc mới. Provider dùng `savedMemoryUpdates` xử lý `tool-updateMemory`. Chưa commit/nghiệm thu thực tế.
- Request chính `askMealPlanner` local đã gửi `message`, `weekStart`, `threadId`, `requestId`, `allowWebSearch`; không còn kết luận request chính vẫn gửi `messages[]`. Caller dự phòng `askAccountAssistant` trong `nutrition-chat.service.ts` còn hợp đồng cũ; `AiEntryScreen` hiện đưa tài khoản đăng nhập vào `PlannerChatScreen`, nên không gộp caller dự phòng thành lỗi chính đang xảy ra.
- Lựa chọn/câu hỏi trong chat, quyền tìm web, lịch sử/quay lại, trạng thái kiểm duyệt, tương tác bình luận, công thức yêu thích/đánh giá, BMI/check-in, auth/billing/xác minh/nhắn tin cơ bản đã có code.

## E. Rủi ro riêng cần nghiệm thu

- Job upload trong `src/features/feed/stores/video-publish-store.ts` chưa gắn với chủ tài khoản/phiên. Cần thử đổi tài khoản khi upload/retry; chưa có bằng chứng vượt quyền BE.
- Một số cây màn hình dùng access token làm React key; cần thử refresh cùng tài khoản khi đang nhập/chat để kiểm tra remount/mất state. Đây là rủi ro đọc code, chưa tái hiện UI.
- Thay đổi local chưa commit được tính là đã có code trong báo cáo; nếu chỉ build từ HEAD, kết quả phần Ghi nhớ/chat sẽ khác.

## F. Thứ tự đề nghị

1. Sửa bìa Blog; kiểm tra tổng unread/trạng thái đăng nhập; nghiệm thu các thay đổi Ghi nhớ/chat đang có.
2. Đi chợ, sửa nhật ký/nhận xét tuần, dinh dưỡng và lịch tuần cũ.
3. Feed đúng nguồn, composer/nháp POST và thêm video trong sửa bài; tìm người dùng.
4. Voice có một nhánh đánh giá tích hợp native/gateway riêng; tiếp theo video Blog, thống kê, nhà hàng. Trang và theme theo phạm vi ưu tiên.

## G. Checklist UI từng bước — đề nghị, chưa thực hiện

1. Đăng nhập cùng tài khoản trên web/mobile → mở Ghi nhớ → sửa dị ứng/sở thích → lưu/mở lại → nhờ trợ lý ghi nhớ thêm một dòng → kiểm tra hồ sơ và form lập thực đơn cập nhật.
2. Tạo Blog → chọn bìa A → chèn ảnh B trong nội dung → lưu/mở lại → so ảnh bìa. Trên web chèn video mới và đối chiếu điểm thao tác còn thiếu ở mobile.
3. Lưu thực đơn có món lặp → web mở Đi chợ → chọn ngày → xem tổng nguyên liệu/nguồn món → đối chiếu mobile. Dùng món thiếu lượng để xem cảnh báo tổng chưa đầy đủ.
4. Nhật ký → thêm món → web sửa khẩu phần/kcal → nhấn Nhờ trợ lý xem lại tuần → đối chiếu mobile. Mở công thức/lịch để so kcal, nhóm dưỡng chất và tổng hợp tuần.
5. Với tài khoản đã có thực đơn tuần trước: web lùi tuần → kiểm tra mobile không chọn được tuần đó; ngày đã qua phải chỉ đọc.
6. Dành cho bạn/Đang theo dõi → cuộn nhiều trang với nhiều tác giả. Tạo bài chỉ chữ/nhiều video trên web → lưu nháp POST → mở nháp mobile. Mở bài đã đăng → mobile sửa chữ/gỡ/đổi thứ tự video → tìm thao tác upload video mới còn thiếu.
7. Tìm tên người dùng trên web/mobile → so loại kết quả. Mở thống kê bài và nhà hàng/menu/đánh giá trên web → đối chiếu điểm vào mobile.
8. Web mở voice → cấp mic → nói yêu cầu → quan sát tiến trình, màn trợ lý mở và kết thúc gọi; đối chiếu mobile chưa có luồng voice. Trang dùng tài khoản quản lý; theme kiểm tra Sáng/Tối/Hệ thống.
9. Dùng tài khoản có unread ngoài 50 cuộc trò chuyện đầu/ngăn → so badge hai bên → đọc tin → so lại. Thử tài khoản bị khóa/chưa hoạt động và đối chiếu nội dung báo lỗi login.
10. Hồi quy các phần đã có: tạo ticket kèm ảnh → nhận thông báo → mở/trả lời; báo cáo bài kèm ảnh; báo cáo bình luận; sửa POST. Thử refresh khi đang nhập và đổi tài khoản khi upload để xác minh rủi ro phiên.

Người thực hiện: Codex. Task này chỉ thêm báo cáo và cập nhật `docs/PLAN.md`, không sửa source ứng dụng, không commit/push.
