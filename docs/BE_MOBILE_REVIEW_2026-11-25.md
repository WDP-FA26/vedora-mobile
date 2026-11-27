# Đối chiếu backend và mobile — 25/11/2026

- Người thực hiện: Codex.
- BE: `WDP-FA26/vedora-api`, main `db7da97202d724e6afd0283821b7cdfd9948862a`, tải và đọc lại source trong lần này.
- Mobile: branch `feat/meal-planner-chat-experience`, HEAD `c45470fdf343550ef8395cf47516ec52ab604a68`; đọc source đang có trong workspace. Không sửa source ứng dụng.
- Phạm vi: API và luồng thành viên mobile. Không mặc định đưa chức năng admin vào mobile. Báo cáo trước ngày 24/11 được dùng làm mốc, không coi là bằng chứng thay cho source mới.
- Đây là đối chiếu code, chưa chạy BE/DB hay API đăng nhập thật; chưa xác nhận production đang dùng commit nào. Không đối chiếu lại web trong lần này.

## Cần sửa trước: hợp đồng chat thực đơn đã thay đổi

**P0 về tương thích nếu triển khai BE main mới cùng mobile hiện tại.**

BE `MealPlannerChatDto` bắt buộc `message: string`, không còn nhận `messages[]`. Controller truyền `dto.message` vào service; lịch sử do server đọc từ MongoDB. Global ValidationPipe bật `whitelist` và `forbidNonWhitelisted`, nên payload mobile hiện tại bị lỗi validation trước khi bắt đầu stream.

- BE: [DTO chat](https://github.com/WDP-FA26/vedora-api/blob/db7da97202d724e6afd0283821b7cdfd9948862a/src/meal-plan/dto/meal-plan.dto.ts#L480), [controller](https://github.com/WDP-FA26/vedora-api/blob/db7da97202d724e6afd0283821b7cdfd9948862a/src/meal-plan/meal-plan.controller.ts#L191), [validation](https://github.com/WDP-FA26/vedora-api/blob/db7da97202d724e6afd0283821b7cdfd9948862a/src/app.setup.ts#L48).
- Mobile: [askMealPlanner](../src/features/meal-plan/services/meal-plan.service.ts) vẫn gửi `messages: messages.slice(-40)`; [provider](../src/features/meal-plan/hooks/meal-planner-provider.tsx) vẫn tự ghép ngữ cảnh client.
- Cần đổi request sang tin nhắn mới nhất, giữ `weekStart`, `threadId`, `requestId`, quyền tìm web; đồng bộ cách gửi câu trả lời cho tool. BE có `toolOutput: { tool, toolCallId, output }`. Mobile hiện PATCH câu trả lời vào lịch sử trước lượt chat; không kết luận riêng việc thiếu `toolOutput` là lỗi bắt buộc vì trường này optional và lịch sử đã được cập nhật qua PATCH.
- [askAccountAssistant](../src/features/nutrition-chat/services/nutrition-chat.service.ts) cũng còn gửi dạng cũ, thiếu `weekStart`. Luồng đăng nhập thông thường hiện đi qua `PlannerChatScreen` trong `ai-entry-screen.tsx`, nên tách caller dự phòng này khỏi lỗi chính.
- Chat đã có UI hỏi lựa chọn, xin phép tìm web, lịch sử, quay lại yêu cầu và báo đã lưu; không phải thiếu toàn bộ chức năng chat. Chưa kiểm thử request thực tế, kết luận lỗi tương thích dựa trên DTO/validation/caller.

## Chức năng BE có, mobile chưa làm hoặc còn một phần

Các đường dẫn BE trong bảng đều thuộc commit nêu trên. P1/P2 là thứ tự đề nghị, không phải mức độ lỗi backend.

| Ưu tiên | Nhóm | Phần mobile còn thiếu | Bằng chứng BE → mobile |
| --- | --- | --- | --- |
| P1 | Ticket hỗ trợ/khiếu nại | Danh sách, chi tiết, tạo yêu cầu/khiếu nại từ bài, đính kèm, trả lời, rút yêu cầu. Mobile chỉ hiện trạng thái khiếu nại để khóa thao tác bài. | `src/support/support.controller.ts`, `support-attachments.controller.ts` → chưa có feature/route support; `posts/components/post-moderation-notice.tsx`. |
| P1 | Thông báo ticket/bình luận | Đọc `ticketId`, câu thông báo theo loại và mở ticket; nội dung riêng cho xử lý bình luận/báo cáo bình luận. | `src/notifications/dto/notification.dto.ts` → `notifications/types/notification.schema.ts`, `utils/notification-text.ts`, `components/notifications-screen.tsx`. |
| P1 | Ảnh minh chứng báo cáo bài — mới trên BE | Chọn/upload ảnh riêng tư rồi gửi `evidenceIds`. Báo cáo bài không ảnh đã có và vẫn được BE hỗ trợ. | `src/posts/interactions/post-report-evidence.controller.ts`, `src/posts/dto/post-interaction.dto.ts` → `posts/services/posts.service.ts:reportPost` chỉ gửi reason/details; form chưa có ảnh. |
| P1 | Ghi chú hồ sơ ăn uống | Đọc/sửa `allergyNote`, `preferenceNote`. Chọn nguyên liệu/nhóm tránh đã có; bỏ qua trường khi update không đồng nghĩa xóa ghi chú cũ. | `src/recipes/dto/dietary.dto.ts` → `dietary-profile/types/dietary-profile.schema.ts`, schema dietary trong `meal-plan/types/meal-plan.schema.ts`. |
| P1 | Danh sách đi chợ | Màn và caller `GET /meal-plan/shopping-list`, chọn ngày, tổng nguyên liệu, xem nguồn món. | `src/meal-plan/shopping-list.controller.ts`, `dto/shopping-list.dto.ts` → chưa có module/caller/route shopping-list. |
| P1 | Feed đúng nguồn BE | Feed cá nhân hóa `/posts/feed`, theo dõi `/posts/following` với phân trang chung. | `src/posts/posts.controller.ts` → `feed/services/feed.service.ts` gọi `/posts`; `following/services/following.service.ts` lấy tối đa 20 bài/tác giả rồi ghép. |
| P1 | Tạo bài POST và nháp POST | Bài chỉ chữ, nhiều video, tiếp tục nháp `POST`. Mobile đã có tạo/nháp video một media. | `src/posts/dto/create-post.dto.ts`, `src/posts/post-drafts.controller.ts` → `feed/services/compose.service.ts` lọc `kind === 'VIDEO'`; `feed/hooks/use-compose-actions.ts` yêu cầu video. |
| P1 | Sửa bài đã đăng | Sửa bài POST và gửi duyệt lại. Không tính sửa Blog hoặc bản nháp video là luồng này. | `PATCH /posts/:id` tại `src/posts/posts.controller.ts` → `posts/services/posts.service.ts`, `posts/components/post-menu.tsx` chưa có update post. |
| P1 | Báo cáo bình luận | Báo cáo một bình luận cụ thể. Trả lời/sửa/xóa bình luận đã có. | `src/posts/interactions/comment-reports.controller.ts` → `posts/services/posts.service.ts`, `posts/components/comment-section.tsx` chưa nối API báo cáo. |
| P1 | Bìa Blog chưa đúng hợp đồng | UI chọn bìa riêng nhưng BE suy ra bìa từ ảnh đầu nội dung, bỏ qua `coverImageUrl` gửi lên. | `src/posts/dto/blog.dto.ts`, `src/posts/blogs/blog-cover.ts` → `blogs/components/blog-editor-screen.tsx:addImage(true)` chỉ setCover. Cần đồng bộ chọn/đổi/gỡ bìa với nội dung. |
| P2 | Sửa nhật ký ăn uống | `PATCH /meal-plan/log/:id`; đã có đọc/thêm/xóa và ước tính kcal. | `src/meal-plan/meal-log/meal-log.controller.ts` → `meal-log/services/meal-log.service.ts` không có update; màn chưa có sửa mục. |
| P2 | Dinh dưỡng công thức/thực đơn | Nhận và hiện `caloriesPerServing`, `nutritionPillars` trên công thức/thực đơn; tổng hợp tuần từ dữ liệu này. | `src/recipes/dto/recipe.dto.ts`, `src/meal-plan/dto/meal-plan.dto.ts` → `recipes/types/recipe.schema.ts`, recipe trong `meal-plan/types/meal-plan.schema.ts` chưa lấy hai trường. Nhật ký đã có kcal, BMI/check-in đã có. |
| P2 | Xem thực đơn tuần cũ | Duyệt tuần từ `minWeekStart`; tách quyền xem và sửa ngày quá khứ. Nhật ký đã có tuần cũ. | `GET /meal-plan` và DTO khoảng tuần → `meal-plan/utils/meal-week.ts:planningWeeks` bắt đầu từ currentWeekStart. |
| P2 | Video Blog | Chọn/upload/chèn video mới, tiến độ và xử lý lỗi. Đã có upload ảnh và nhận diện block video sẵn có. | `POST /blogs/videos/uploads` tại `src/posts/blogs/blogs.controller.ts` → `blogs/services/blogs.service.ts` chỉ upload ảnh. |
| P2 | Thống kê người đăng | Danh sách bài, tổng hợp và số liệu theo ngày/khoảng thời gian. Ghi nhận lượt xem đã có. | `src/posts/analytics/post-analytics.controller.ts` (`GET /analytics/posts`, `/summary`) → chưa có module/caller/route analytics. |
| P2 | Khám phá nhà hàng | Theo vị trí, tìm món menu, xem menu, xem/viết/sửa/xóa đánh giá. | `RestaurantsController` trong `src/workspaces/workspaces.controller.ts` → chưa có feature/route/caller restaurants. |
| P2 | Tìm người dùng — bổ sung khi rà lại | Tìm theo tên, username, bio qua `/profiles/search`, mở hồ sơ/theo dõi từ kết quả. Gợi ý theo dõi và ẩn gợi ý đã có. | `src/profiles/profiles.controller.ts:119` → `posts/components/search-screen.tsx` chỉ có tab bài viết/công thức; không có caller `/profiles/search` trong src. |
| Theo vai trò | Workspace/Trang | Đăng ký, gửi lại hồ sơ, quản lý thành viên/menu/thông tin và chuyển danh tính `/auth/switch`. | `src/workspaces/workspaces.controller.ts`, `src/auth/auth.controller.ts` → chưa có module/caller; session mobile chưa giữ danh tính Trang. Chỉ đưa vào kế hoạch nếu mobile phục vụ chủ/quản lý Trang. |

Đường dẫn mobile trong cột cuối bắt đầu từ `src/features/`, trừ khi đã ghi rõ khác. Tìm route, caller, schema và component trước khi kết luận thiếu; không suy ra chỉ từ tên thư mục.

### Lưu ý hai API mới/quan trọng

- Ảnh báo cáo bài: [hướng dẫn BE](https://github.com/WDP-FA26/vedora-api/blob/db7da97202d724e6afd0283821b7cdfd9948862a/docs/docs-for-FE/post-report-evidence.md). Upload `POST /posts/:postId/report/evidence`, multipart field `file`, trả `{ id }`; submit report với `evidenceIds`. Mặc định tối đa 3 ảnh JPG/PNG/WebP, 5 MB/ảnh; giới hạn runtime tại `GET /public-config`. Không dùng URL ảnh công khai thay ID. Báo cáo bình luận không nhận ảnh theo hợp đồng này.
- Đi chợ: chỉ tính ngày chưa qua; lượng có thể chưa đầy đủ khi `hasUnknownQuantity=true`. Không tự chia lượng theo khẩu phần khi `quantityBasis=RECIPE_PER_OCCURRENCE`. Chưa có endpoint lưu trạng thái đã mua trong controller này.

## BE có API nhưng cần chốt nhu cầu UI

- `GET /public-config`: mobile chưa dùng để đồng bộ giới hạn runtime; đáng nối cùng form upload/báo cáo mới.
- `POST /meal-plan/copy`: chưa có caller mobile cho thao tác sao chép tuần riêng. Không dùng việc thiếu endpoint này để kết luận chat không thể tạo/lưu thực đơn.
- `GET /posts/:postId/summary`: chưa có caller/nút tóm tắt bài riêng trên mobile.
- Các API media tổng quát không cần được nối đủ nếu luồng hiện dùng upload qua bản nháp/Blog đã đáp ứng nghiệp vụ.
- Admin work queue mới, quản trị người dùng/kiểm duyệt/thanh toán/knowledge/logs không được tính thành phần mobile member chưa làm.
- Chọn theme và nút “nhờ trợ lý xem lại/cân đối tuần” là backlog trải nghiệm trong báo cáo 24/11; không có endpoint riêng còn thiếu để kết luận chỉ từ BE trong lần này.

## Đã code nhưng cần kiểm tra tiếp

1. `auth/utils/auth-errors.ts` quy 401 khi login thành sai mật khẩu, chưa phân biệt `ACCOUNT_SUSPENDED`/`ACCOUNT_NOT_ACTIVE` như BE `auth-core/account-access.ts`.
2. `app/(tabs)/_layout.tsx` và một số route dùng access token làm key; refresh token có thể remount cây màn hình và mất state đang nhập. Chưa tái hiện trên thiết bị.
3. `feed/stores/video-publish-store.ts` chưa gắn job với chủ phiên; cần thử đổi tài khoản trong lúc upload/retry. Chưa có bằng chứng vượt quyền backend.

## Thứ tự nên làm

1. Đồng bộ hợp đồng chat mới trước khi dùng BE main hiện tại.
2. Sửa bìa Blog; ticket/khiếu nại, thông báo; ảnh minh chứng báo cáo và báo cáo bình luận.
3. Ghi chú ăn uống, đi chợ, sửa nhật ký, dinh dưỡng và xem tuần cũ.
4. Feed đúng nguồn, tạo/nháp/sửa POST và tìm người dùng.
5. Video Blog, thống kê, nhà hàng; workspace theo phạm vi sản phẩm.

## Checklist UI từng bước — chưa thực hiện

1. Đăng nhập → tab Trợ lý → gửi tin ngắn → kiểm tra có stream; trả lời lựa chọn → đồng ý/từ chối tìm web → mở lại lịch sử → quay lại yêu cầu. Với BE mới, kiểm tra hết lỗi validation sau khi đồng bộ request.
2. Mở bài của người khác → Báo cáo → đối chiếu mobile chưa có chọn ảnh; dùng client có hỗ trợ ảnh để gửi thử và đối chiếu kết quả. Mở bình luận để kiểm tra thiếu nút báo cáo riêng.
3. Mở bài bị xử lý → đối chiếu điểm tạo khiếu nại còn thiếu → tạo/trả lời/rút ticket bằng client có hỗ trợ → nhận thông báo → kiểm tra mobile chưa mở được ticket.
4. Hồ sơ ăn uống → đối chiếu thiếu hai ghi chú → lưu thực đơn → kiểm tra thiếu điểm vào đi chợ → mở công thức/lịch để đối chiếu kcal/nhóm chất và bộ chọn tuần cũ.
5. Nhật ký → thêm món → kiểm tra thao tác sửa mục còn thiếu; tạo Blog → chọn bìa A, ảnh nội dung B → lưu/mở lại để kiểm tra bìa thực tế.
6. Tạo bài → đối chiếu bài chỉ chữ/nhiều video và nháp POST; mở bài POST đã đăng → kiểm tra thiếu sửa; mở Đang theo dõi → kiểm tra tải tiếp nhiều tác giả.
7. Tìm kiếm → kiểm tra chưa có tìm người; Hồ sơ → kiểm tra thiếu thống kê; đối chiếu điểm vào nhà hàng và Trang theo quyền tài khoản.
8. Khi đã có môi trường thử: đang nhập thì refresh phiên; đang upload thì đăng xuất/đổi tài khoản; thử tài khoản bị khóa để xác nhận các rủi ro riêng.

## Kiểm tra kỹ thuật

- Lint và TypeScript của mobile đều đạt. Lượt TypeScript đầu quét nhầm source BE tham khảo trong tmp và báo lỗi dependency BE; đã chuyển bản tham khảo vào tmp/node_modules để loại khỏi phạm vi mobile rồi chạy lại đạt. Không sửa tsconfig, không cài dependency hoặc chạy test/backend.
- Chưa chạy API có xác thực hoặc UI/thiết bị. Không commit/push, không triển khai thay đổi.
