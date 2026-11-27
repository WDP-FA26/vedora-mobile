# Mobile còn thiếu gì so với BE và web — 24/11/2026

## Phạm vi và phiên bản

Đối chiếu controller/DTO/service BE, màn hình và caller web, route/schema/service/hook/component mobile. Đây là rà soát code các luồng người dùng; không phải kết quả chạy API hoặc UI thật, cũng không chứng nhận BE đã hoàn thiện.

| Repo | Phiên bản đã đọc |
| --- | --- |
| BE `WDP-FA26/vedora-api`, `origin/main` | `0e0fece151b67bb3e6cff15588b42409d58947a3` |
| Web `WDP-FA26/vedora-frontend`, `origin/main` | `173ced4827c8afde0fb2f8036df44712b1783bbb` |
| Mobile, branch `feat/meal-planner-chat-experience` | `c45470fdf343550ef8395cf47516ec52ab604a68` |

Mobile được so theo branch đang làm, có thay đổi chat trong [PR #51](https://github.com/WDP-FA26/vedora-mobile/pull/51), không chỉ theo `main`. Không tính các màn quản trị web thành yêu cầu bắt buộc của mobile.

Ưu tiên dưới đây là đề xuất triển khai: **P1** hoàn thiện luồng người dùng và sửa lệch hợp đồng hiện có; **P2** bổ sung trải nghiệm đã có trên web; **P3** mở rộng theo phạm vi sản phẩm. Không phát hiện thêm P0 có đủ bằng chứng trong phạm vi so sánh chức năng này.

## Backlog đã xác nhận

| ID | Ưu tiên | Nhóm | Trạng thái mobile và phần cần làm |
| --- | --- | --- | --- |
| M01 | P1 | Hỗ trợ và khiếu nại | Chưa có màn danh sách/chi tiết ticket, tạo yêu cầu, ảnh đính kèm, trả lời, rút yêu cầu và tạo khiếu nại từ bài bị xử lý. |
| M02 | P1 | Thông báo mở đúng đích | Đã có thông báo cơ bản/kiểm duyệt bài. Thiếu `ticketId`, nội dung riêng và điều hướng ticket; thiếu nội dung riêng cho kết quả xử lý bình luận/báo cáo bình luận. |
| M03 | P1 | Hồ sơ dị ứng/khẩu vị | Đã chọn nguyên liệu/nhóm cần tránh. Chưa đọc, hiển thị và sửa `allergyNote`, `preferenceNote`. |
| M04 | P1 | Danh sách đi chợ | Chưa có màn/nút lấy nguyên liệu từ thực đơn đã lưu theo tuần và ngày, cộng số lượng, xem món đóng góp, đánh dấu đã mua/sao chép danh sách như web. |
| M05 | P1 | Bảng tin | Đã có feed và Đang theo dõi. Chưa dùng nguồn cá nhân hóa `/posts/feed` và nguồn theo dõi `/posts/following`; hiện tự ghép bài theo tác giả. |
| M06 | P1 | Tạo bài và bản nháp | Đã tạo video hướng dẫn một video và lưu nháp. Thiếu bài chỉ chữ, bài nhiều video, tiếp tục bản nháp loại `POST` đã tạo trên web. |
| M07 | P1 | Sửa bài đã đăng | Chưa có luồng sửa nội dung/video của bài `POST` đã đăng rồi gửi duyệt lại. Sửa bản nháp video và sửa Blog đã có, là các luồng khác. |
| M08 | P1 | Báo cáo bình luận | Đã báo cáo bài, trả lời/sửa/xóa bình luận. Thiếu báo cáo một bình luận cụ thể và xử lý kết quả tương ứng. |
| M09 | P1 | Ảnh bìa Blog | Có UI ảnh bìa riêng nhưng BE bỏ qua giá trị gửi lên và lấy ảnh đầu nội dung. Cần đồng bộ hành vi chọn/đổi/gỡ bìa với nội dung bài. Đây là phần làm chưa đúng hợp đồng. |
| M10 | P2 | Nhật ký ăn uống | Đã thêm/xóa món, ước tính kcal, xem tổng kết và tuần cũ. Thiếu sửa một mục đã ghi và nút “Nhờ trợ lý xem lại tuần” chuyển ngữ cảnh sang chat. |
| M11 | P2 | Dinh dưỡng trên thực đơn/công thức | BMI, mục tiêu và check-in cân nặng đã có. Thiếu hiển thị `caloriesPerServing`, `nutritionPillars` trong công thức, tổng hợp dinh dưỡng tuần trên lịch và nút nhờ trợ lý cân đối như web. |
| M12 | P2 | Lịch thực đơn tuần cũ | API/schema có `minWeekStart`, nhưng lựa chọn tuần mobile bắt đầu từ `currentWeekStart`; không duyệt lại các tuần thực đơn cũ được BE cho phép. |
| M13 | P2 | Video trong Blog | Đã upload ảnh và nhận diện block video có sẵn. Thiếu chọn/upload/chèn video mới, tiến độ và lỗi upload Blog. |
| M14 | P2 | Thống kê cho người đăng | Chưa có màn thống kê bài của mình: lượt xem/tim/bình luận/đăng lại/lưu theo khoảng ngày, biểu đồ và so với kỳ trước. Ghi nhận lượt xem bài đã có. |
| M15 | P2 | Nhà hàng | Chưa có khám phá bản đồ/danh sách theo vị trí, tìm món trong menu, xem menu, xem/viết/sửa/xóa đánh giá nhà hàng. |
| M16 | P3 | Trang/workspace | Chưa có đăng ký và theo dõi hồ sơ trang, quản lý thông tin/thành viên/menu, gửi lại hồ sơ và chuyển danh tính tài khoản/trang. Đưa vào nếu mobile phục vụ chủ nhà hàng/người quản lý trang. |
| M17 | P3 | Chọn giao diện | Đã theo sáng/tối của hệ thống. Chưa có lựa chọn Sáng/Tối/Hệ thống trong ứng dụng và lưu lựa chọn. |

## Bằng chứng và phạm vi từng nhóm

### M01–M02: hỗ trợ, khiếu nại, thông báo

- BE có tạo/list/detail/reply/withdraw tại [support.controller.ts](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/support/support.controller.ts#L48), cấp URL upload tại [support-attachments.controller.ts](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/support/support-attachments.controller.ts#L28), và [notification DTO có ticketId](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/notifications/dto/notification.dto.ts#L35).
- Web có [support API](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/support/lib/support-api.ts#L20), các màn `app/home/support`, tạo khiếu nại trong `features/support/components/create-appeal-dialog.tsx`, [điều hướng thông báo ticket](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/notifications/components/notifications-view.tsx#L88) và nội dung thông báo bình luận/ticket trong `features/notifications/lib/notification-text.ts`.
- Mobile mới hiển thị khiếu nại đang xử lý và khóa thao tác trong [post-moderation-notice.tsx](../src/features/posts/components/post-moderation-notice.tsx), chưa có module/route hỗ trợ. [notification.schema.ts](../src/features/notifications/types/notification.schema.ts) nhận `type` dạng string nên loại mới không làm hỏng cả danh sách, nhưng bỏ mất `ticketId`. [notification-text.ts](../src/features/notifications/utils/notification-text.ts) rơi về lời nhắn chung; [notifications-screen.tsx](../src/features/notifications/components/notifications-screen.tsx) chưa có nhánh mở ticket.
- Phạm vi cần làm: danh sách/chi tiết/lịch sử trao đổi, trạng thái/thời hạn/quyền thao tác theo BE, upload ảnh, tạo khiếu nại đúng bài, nhận thông báo và mở đúng ticket. Duyệt/giải quyết ticket của admin không thuộc backlog member mobile.

### M03–M04: hồ sơ ăn uống và đi chợ

- BE đọc/lưu hai ghi chú tại [dietary.dto.ts](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/recipes/dto/dietary.dto.ts#L55). Web có hai trường trong [dietary-view.tsx](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/dietary/components/dietary-view.tsx#L173).
- Cả [schema hồ sơ mobile](../src/features/dietary-profile/types/dietary-profile.schema.ts) và [schema hồ sơ dùng bởi chat thực đơn](../src/features/meal-plan/types/meal-plan.schema.ts) chỉ lấy nguyên liệu/nhóm. Việc gửi update hiện bỏ qua ghi chú nên BE giữ ghi chú cũ; chưa có bằng chứng mobile đang xóa ghi chú của web.
- BE có [GET /meal-plan/shopping-list](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/meal-plan/shopping-list.controller.ts#L23), web có [shopping-list-button.tsx](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/meal-plan/components/shopping-list-button.tsx#L80). Mobile chưa có caller/schema/route cho API này.
- Lưu ý khi triển khai: BE chỉ tính các ngày chưa qua; `knownQuantity` có thể là tổng chưa đầy đủ khi `hasUnknownQuantity=true`. `quantityBasis=RECIPE_PER_OCCURRENCE` cộng lượng gốc mỗi lần xuất hiện của công thức, không tự chia theo khẩu phần. Đánh dấu đã mua là tương tác client như web; chưa thấy API lưu trạng thái mua.

### M05–M08: bảng tin, bài viết, bình luận

- BE có [feed và following](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/posts/posts.controller.ts#L117), tạo bài và `PATCH /posts/:id` trong cùng controller; [CreatePostDto](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/posts/dto/create-post.dto.ts#L45) hỗ trợ body và danh sách media. [API báo cáo bình luận](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/posts/interactions/comment-reports.controller.ts#L25) đã có.
- Web dùng hai nguồn qua [posts-cache.ts](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/posts/posts-cache.ts#L10); [composer](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/shared/components/composer.tsx#L68) hỗ trợ bài chỉ chữ/nhiều video, [edit-post-dialog.tsx](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/posts/components/edit-post-dialog.tsx#L79) sửa bài, và `features/posts/components/report-dialog.tsx` báo cáo theo `commentId`.
- Mobile [feed.service.ts](../src/features/feed/services/feed.service.ts) vẫn gọi `/posts`. [following.service.ts](../src/features/following/services/following.service.ts) tải bài theo từng tác giả (`limit: 20`), chưa dùng cursor chung của `/posts/following`; do đó không tương đương nguồn phân trang chung do BE cung cấp.
- [compose.service.ts](../src/features/feed/services/compose.service.ts) chủ động lọc nháp chỉ còn `kind === 'VIDEO'`. [use-compose-actions.ts](../src/features/feed/hooks/use-compose-actions.ts) bắt buộc video và giữ một media. Cần thêm luồng bài ngắn/nháp `POST`, không coi chức năng video hiện tại là chưa triển khai.
- [posts.service.ts](../src/features/posts/services/posts.service.ts) có sửa/xóa bình luận và báo cáo bài, chưa có sửa bài đã đăng hoặc báo cáo bình luận. [post-menu.tsx](../src/features/posts/components/post-menu.tsx) chưa có hành động sửa bài `POST`; [comment-section.tsx](../src/features/posts/components/comment-section.tsx) đã có trả lời/sửa/xóa.

### M09 và M13: Blog

- BE ghi rõ `coverImageUrl` bị bỏ qua trong [blog.dto.ts](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/posts/dto/blog.dto.ts#L49); bìa được lấy từ ảnh đầu hợp lệ trong nội dung tại [blog-cover.ts](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/posts/blogs/blog-cover.ts#L12). Web cũng suy ra bìa từ nội dung trong [use-blog-draft.ts](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/blogs/hooks/use-blog-draft.ts#L21).
- Mobile [blog-editor-screen.tsx](../src/features/blogs/components/blog-editor-screen.tsx) giữ `cover` riêng, nhánh `addImage(true)` chỉ `setCover(url)` mà không đưa ảnh vào nội dung. Kết quả chọn/đổi/gỡ ảnh bìa riêng không được lưu theo điều người dùng đang thấy. Cần sửa UI và dữ liệu cùng lúc.
- BE có [POST /blogs/videos/uploads](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/posts/blogs/blogs.controller.ts#L85); web có [uploadBlogVideo](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/blogs/lib/media-upload.ts#L60) và `editor/use-media-insert.ts`. Mobile [blogs.service.ts](../src/features/blogs/services/blogs.service.ts) mới có upload ảnh. [blog-rich-editor.tsx](../src/features/blogs/components/blog-rich-editor.tsx) đã nhận diện video có sẵn, nên phần thiếu là upload/chèn mới, không phải hoàn toàn không đọc được video.

### M10–M12: nhật ký, dinh dưỡng, lịch sử tuần

- BE có [PATCH /meal-plan/log/:id](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/meal-plan/meal-log/meal-log.controller.ts#L114); web có update tại `features/meal-plan/meal-log.ts:119`, và [nút xem lại tuần](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/meal-plan/components/meal-log-button.tsx#L301). Mobile [meal-log.service.ts](../src/features/meal-log/services/meal-log.service.ts) mới có đọc/thêm/xóa/ước tính kcal, [meal-log-screen.tsx](../src/features/meal-log/components/meal-log-screen.tsx) chưa có sửa hoặc chuyển sang chat nhận xét tuần. Nút nhận xét của web dùng chat hiện có, không có endpoint “feedback tuần” riêng cần chờ BE.
- BE trả `caloriesPerServing`, `nutritionPillars` trong [recipe DTO](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/recipes/dto/recipe.dto.ts#L225) và [meal-plan DTO](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/meal-plan/dto/meal-plan.dto.ts#L302). Web dùng trong [recipe-card.tsx](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/recipes/components/recipe-card.tsx#L128) và [nutrition-companion-bar.tsx](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/meal-plan/components/nutrition-companion-bar.tsx#L225).
- Mobile [recipe.schema.ts](../src/features/recipes/types/recipe.schema.ts) và recipe trong [meal-plan.schema.ts](../src/features/meal-plan/types/meal-plan.schema.ts) chưa lấy hai trường này. Chưa có tổng hợp nhóm chất/kcal của tuần trên [meal-plan-screen.tsx](../src/features/meal-plan/components/meal-plan-screen.tsx). Không đưa BMI/check-in cân nặng hay đánh giá sao công thức vào danh sách thiếu vì đã có.
- BE cho biết khoảng tuần xem lại tại [GET /meal-plan](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/meal-plan/meal-plan.controller.ts#L84). Web [week-nav.tsx](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/meal-plan/components/week-nav.tsx#L20) dùng `minWeekStart`. Mobile [meal-week.ts](../src/features/meal-plan/utils/meal-week.ts) tạo danh sách từ tuần hiện tại và provider chỉ nhận các tuần trong danh sách đó. Cần tách khoảng được xem với khoảng được sửa; không mở sửa ngày đã qua. Nhật ký mobile đã có xem tuần trước, chỉ lịch thực đơn đang thiếu.

### M14–M17: thống kê, nhà hàng, workspace, giao diện

- Thống kê: BE có [GET /analytics/posts và /summary](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/posts/analytics/post-analytics.controller.ts#L38); web có [analytics-view.tsx](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/post-analytics/components/analytics-view.tsx). Mobile chưa có module/caller/màn tương ứng. [post-view.service.ts](../src/features/feed/services/post-view.service.ts) đã gửi `/posts/views`, nên không gộp việc ghi nhận view vào phần thiếu.
- Nhà hàng: BE có [restaurants controller](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/workspaces/workspaces.controller.ts#L320); web có [restaurants-explorer.tsx](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/workspaces/components/restaurants-explorer.tsx#L52), menu/tìm món và `restaurant-reviews-section.tsx`. Mobile chưa có module/route/service nhà hàng. Đây là chức năng thành viên, tách khỏi quản lý nhà hàng.
- Workspace: BE có [workspaces controller](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/workspaces/workspaces.controller.ts#L90) và [POST /auth/switch](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/auth/auth.controller.ts#L194); web có `app/home/pages`, [workspaces-api.ts](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/workspaces/lib/workspaces-api.ts#L38) và hook chuyển tài khoản. Mobile chưa có các luồng này, session chưa giữ danh tính trang. Chỉ ưu tiên khi chốt mobile phục vụ nhóm chủ trang; các endpoint `/admin/workspaces` không đưa vào yêu cầu mobile này.
- Theme: web có [ThemeSwitcher](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/components/theme-switcher.tsx#L20); mobile [use-color-scheme.ts](../src/hooks/use-color-scheme.ts) và [vedora-theme-provider.tsx](../src/components/vedora-theme-provider.tsx) theo hệ thống, chưa có lựa chọn riêng. Không cần endpoint BE để bổ sung lựa chọn local này.

## Phần đã có nhưng cần kiểm tra độ hoàn thiện

Các mục dưới đây là rủi ro đọc từ source, chưa tái hiện trên thiết bị. Tách khỏi backlog chức năng để không tính trùng.

1. **P1 — Phiên upload video chưa gắn với tài khoản:** `VideoPublishJob` trong [video-publish-store.ts](../src/features/feed/stores/video-publish-store.ts) không giữ chủ sở hữu/phiên và không được dọn khi đăng xuất; [runDraftJob](../src/features/feed/hooks/use-compose-actions.ts) tiếp tục sau khi dialog đóng. [Axios interceptor](../src/shared/api/api-client.ts) lấy token hiện tại cho từng request. Cần kiểm tra đổi tài khoản giữa lúc upload/retry: banner/nội dung job tài khoản trước có thể còn hiện, request bước sau dùng phiên mới; BE vẫn phải kiểm tra quyền truy cập nháp. Chưa có bằng chứng vượt quyền BE.
2. **P2 — Refresh token làm remount màn hình:** [layout tab](../src/app/(tabs)/_layout.tsx), route hồ sơ ăn uống/nhật ký, màn billing/verification dùng access token làm React key; [session-manager.ts](../src/shared/session/session-manager.ts) đổi access token khi refresh. Vì vậy có khả năng mất state đang nhập/chat đang chạy dù vẫn cùng tài khoản. Cache cũng được clear theo token tại [app-query-provider.tsx](../src/shared/query/app-query-provider.tsx). Cần giữ cách ly giữa tài khoản bằng danh tính phiên ổn định, đồng thời kiểm thử refresh cùng tài khoản.
3. **P2 — Thông báo tài khoản bị khóa/chưa hoạt động:** BE trả `ACCOUNT_SUSPENDED`/`ACCOUNT_NOT_ACTIVE` tại [account-access.ts](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/auth-core/account-access.ts#L4); web có [account-block.ts](https://github.com/WDP-FA26/vedora-frontend/blob/173ced4827c8afde0fb2f8036df44712b1783bbb/features/auth/lib/account-block.ts#L9). Mobile [auth-errors.ts](../src/features/auth/utils/auth-errors.ts) hiện quy mọi HTTP 401 khi login thành sai tên đăng nhập/mật khẩu. Cần phân biệt theo code BE.

## API BE có nhưng chưa thành chênh lệch web bắt buộc

- `GET /public-config`: BE có [public-config.controller.ts](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/config/public-config.controller.ts#L76). Chưa tìm thấy caller tương ứng trên cả mobile lẫn web; là đề xuất đồng bộ giới hạn runtime, không phải chức năng web đã có mà mobile bỏ sót.
- `POST /meal-plan/copy`: BE có [copy controller](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/meal-plan/meal-plan.controller.ts#L102); chưa thấy caller/nút chuyên biệt trên cả hai client. Có thể bổ sung thao tác sao chép tuần nếu cần; không tính ngang một tính năng web đã hoàn chỉnh.
- `GET /posts/:postId/summary`: BE có [summary controller](https://github.com/WDP-FA26/vedora-api/blob/0e0fece151b67bb3e6cff15588b42409d58947a3/src/posts/summaries/post-summaries.controller.ts#L46); chưa thấy hai client gọi endpoint riêng này. Cần chốt nhu cầu màn tóm tắt riêng trước khi đưa thành yêu cầu parity mobile.
- Admin: quản lý người dùng/nội dung, duyệt ticket/workspace, nhật ký hệ thống, catalog quản trị và xử lý thanh toán/kiểm duyệt là phạm vi web admin; không mặc định yêu cầu port toàn bộ sang mobile.

## Những mục không còn là backlog thiếu tính năng

- Chat thực đơn lưu trực tiếp vào lịch; lựa chọn/câu hỏi từ `askUser`; xin quyền tìm web và truyền quyết định; quay lại yêu cầu bằng vuốt/nhấn giữ và xác nhận; lịch sử chat; thẻ đã lưu chỉ xuất hiện khi stream kết thúc.
- Trạng thái PROCESSING/PENDING_REVIEW/REJECTED/REMOVED, lý do/bằng chứng kiểm duyệt, khóa sửa/xóa khi đang khiếu nại.
- Đánh giá sao công thức; lưu công thức; BMI/mục tiêu/check-in cân nặng; nhật ký thêm/xóa/ước tính kcal.
- Ghi nhận view qua `/posts/views`; trả lời/sửa/xóa bình luận; báo cáo bài; chia sẻ bài qua tin nhắn; sửa/xóa Blog; billing và xác minh cơ bản.

Có code không đồng nghĩa luồng đã được kiểm thử end-to-end hoặc mọi nhánh lỗi đã đạt. Các mục này được loại khỏi danh sách “chưa code”, không được coi là đã kiểm định production.

## Thứ tự triển khai đề nghị

1. Sửa ảnh bìa Blog (M09), kiểm tra job upload qua đổi phiên; hoàn thiện ticket/khiếu nại và thông báo (M01–M02).
2. Hồ sơ ăn uống và đi chợ (M03–M04), sửa nhật ký và nhận xét tuần (M10), dữ liệu dinh dưỡng/lịch sử tuần (M11–M12).
3. Dùng nguồn feed đúng (M05), tạo bài/nháp `POST`, sửa bài đã đăng và báo cáo bình luận (M06–M08).
4. Upload video Blog và thống kê (M13–M14).
5. Khám phá nhà hàng (M15); chốt nhu cầu chủ trang cho M16; thêm chọn theme M17 khi ưu tiên phù hợp.

## Checklist UI để xác nhận backlog

Chưa thực hiện trên môi trường đăng nhập thật. Các bước có màn chưa triển khai dùng web làm mẫu đối chiếu, không phải hướng dẫn mở một màn đã tồn tại trên mobile.

1. Đăng nhập cùng tài khoản trên web/mobile → mở hồ sơ ăn uống → lưu ghi chú dị ứng và khẩu vị trên web → mở lại mobile, đối chiếu hai ghi chú với danh sách nguyên liệu đã chọn.
2. Lưu thực đơn có vài món lặp lại → trên web mở Đi chợ, chọn ngày và xem lượng/nguồn món → đối chiếu mobile chưa có điểm mở danh sách; thử món thiếu số lượng và ngày đã qua.
3. Trên web mở bài bị xử lý → tạo khiếu nại có ảnh → mở chi tiết và trả lời/rút theo trạng thái → nhận thông báo ticket → đối chiếu mobile chỉ có thông báo trạng thái bài/khóa thao tác.
4. Mở Dành cho bạn/Đang theo dõi trên web và bảng tin/theo dõi mobile → dùng nhiều tác giả, nhiều trang bài → so sánh nguồn và khả năng tải tiếp; không dùng khác biệt thứ tự một lần tải làm bằng chứng duy nhất.
5. Web: tạo bài chỉ chữ, bài nhiều video và lưu nháp → mobile mở Bản nháp → kiểm tra thiếu nháp `POST`; mở bài đã đăng để đối chiếu hành động sửa và duyệt lại.
6. Mở bình luận của người khác → web báo cáo một bình luận → đối chiếu mobile chưa có hành động này; kiểm tra nội dung thông báo khi BE xử lý.
7. Mobile tạo Blog có ảnh bìa riêng và ảnh khác trong nội dung → lưu → mở lại và xem thẻ bài → xác nhận bìa theo ảnh đầu nội dung; đối chiếu luồng chèn/upload video trên web.
8. Ghi món vào Nhật ký → đối chiếu sửa khẩu phần/kcal và “Nhờ trợ lý xem lại tuần” trên web; kiểm tra mobile hiện có thêm/xóa và tổng kết. Mở công thức/lịch hai bên để so kcal và nhóm dưỡng chất.
9. Dùng tài khoản có thực đơn tuần trước → web lùi về tuần cũ → đối chiếu bộ chọn tuần mobile; kiểm tra ngày quá khứ luôn chỉ đọc.
10. Mở thống kê, khám phá nhà hàng/menu/đánh giá và Trang của tôi trên web → đối chiếu các điểm vào còn thiếu trên mobile. Với Trang, dùng tài khoản có quyền quản lý.
11. Đổi giao diện Sáng/Tối/Hệ thống trên web → đối chiếu mobile theo giao diện thiết bị. Thử refresh phiên khi đang nhập và đổi tài khoản trong lúc upload video để xác nhận các rủi ro riêng bên trên.

## Kiểm tra và thay đổi của task

- Đã đọc code và đối chiếu hợp đồng ở các commit nêu trên; tìm caller/route/schema ở cả hai client trước khi kết luận thiếu.
- Mobile: `npx expo lint` và `npx tsc --noEmit` đạt. Không thêm/sửa source trong task rà soát này.
- Chưa chạy BE/DB, API có xác thực hoặc UI thiết bị; chưa xác nhận triển khai production trùng commit trong repo. Không commit/push kết quả rà soát.
- Đã thêm báo cáo này và cập nhật `docs/PLAN.md`. Giữ nguyên các báo cáo/nhật ký local đã có trước task.
- Người thực hiện: Codex.
