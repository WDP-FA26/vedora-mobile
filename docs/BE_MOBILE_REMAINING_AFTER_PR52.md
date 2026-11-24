# BE và mobile: phần còn thiếu sau PR #52

> Cập nhật sau lần rà: đã triển khai báo cáo bình luận và đủ năm thông báo xử lý trong workspace. Mục này ở bảng bên dưới là ảnh chụp backlog tại `d507900`, hiện không còn thuộc nhóm chưa code. Chưa kiểm thử với BE/admin thật; xem checklist mới trong PLAN.md.

- Ngày: 25/11/2026. Người thực hiện: Codex.
- Đã fetch BE `WDP-FA26/vedora-api` origin/main: `db7da97202d724e6afd0283821b7cdfd9948862a`; không có cập nhật mới so với lần rà trước.
- Mobile: `feat/mobile-support-report-evidence`, `d507900`, đã push và mở PR #52. Các kết luận dưới đây tính cả code của PR, chưa khẳng định đã merge vào main hay triển khai production.
- Đối chiếu controller/DTO BE với service, schema, route và component mobile. Không thay đổi source; chưa chạy BE/DB hoặc kiểm tra API đăng nhập trên thiết bị. Không tính các màn admin là chức năng mobile thành viên còn thiếu.

## Lỗi tương thích cần sửa trước

**Chat thực đơn: BE yêu cầu `message`, mobile vẫn gửi `messages[]`.**

- BE: `src/meal-plan/dto/meal-plan.dto.ts:MealPlannerChatDto` bắt buộc `message: string`; `src/meal-plan/meal-plan.controller.ts` truyền message vào service. Lịch sử do BE đọc từ server. `src/app.setup.ts` bật whitelist và forbidNonWhitelisted.
- Mobile: `src/features/meal-plan/services/meal-plan.service.ts:askMealPlanner` vẫn gửi `messages: messages.slice(-40)`. Vì vậy request hiện tại không khớp validation của BE main. Chưa gửi request thật; kết luận dựa trên hợp đồng source.
- UI chat/lịch sử/câu hỏi lựa chọn/quyền tìm web/quay lại yêu cầu đã có. Cần sửa request và kiểm tra lại toàn luồng, không cần xây lại toàn bộ chat. Caller dự phòng `nutrition-chat/services/nutrition-chat.service.ts` cũng cần rà đồng bộ.

## Tính năng chưa có hoặc mới có một phần

Đường dẫn BE bắt đầu từ `src/` trong repo BE; đường dẫn mobile bắt đầu từ `src/features/`.

| Ưu tiên | Chức năng | BE đã có | Mobile còn thiếu / bằng chứng |
| --- | --- | --- | --- |
| P1 | Báo cáo bình luận và thông báo xử lý | `posts/interactions/comment-reports.controller.ts`: POST `/posts/:postId/comments/:commentId/report`; service phát COMMENT_REPORT_RESOLVED/DISMISSED | `posts/services/posts.service.ts`, `posts/components/comment-section.tsx` chưa có caller/hành động báo cáo bình luận; `notifications/utils/notification-text.ts` chưa có câu riêng cho hai loại thông báo này. |
| P1 | Ghi chú dị ứng/khẩu vị | `recipes/dto/dietary.dto.ts`: `allergyNote`, `preferenceNote` ở đọc và cập nhật | `dietary-profile/types/dietary-profile.schema.ts`, dietary trong `meal-plan/types/meal-plan.schema.ts` chưa nhận hai trường; UI chưa cho nhập. Chọn nguyên liệu/nhóm tránh đã có. |
| P1 | Danh sách đi chợ | `meal-plan/shopping-list.controller.ts`: GET `/meal-plan/shopping-list` | Chưa có caller/route/màn shopping-list trong `src`. Cần chọn ngày, tổng hợp nguyên liệu và nguồn món; BE chưa có lưu trạng thái đã mua trong controller này. |
| P1 | Feed cá nhân hóa và feed theo dõi | `posts/posts.controller.ts`: GET `/posts/feed`, `/posts/following` | `feed/services/feed.service.ts` gọi `/posts`; `following/services/following.service.ts` lấy tối đa 20 bài/tác giả rồi ghép, chưa dùng nguồn/phân trang chung BE. |
| P1 | Bài POST chỉ chữ/nhiều media và nháp POST | `posts/dto/create-post.dto.ts`, `posts/post-drafts.controller.ts` | `feed/services/compose.service.ts` lọc nháp `kind === 'VIDEO'`, tạo nháp VIDEO; `feed/hooks/use-compose-actions.ts` yêu cầu một video và xóa media khác. Chưa có luồng bài POST tổng quát. |
| P1 | Sửa bài POST đã đăng | `posts/posts.controller.ts`: PATCH `/posts/:id` | `posts/services/posts.service.ts`, `posts/components/post-menu.tsx` chưa có caller/UI sửa bài. Sửa Blog và sửa nháp video đã có, là hai luồng khác. |
| P1 | Đồng bộ bìa Blog | `posts/blogs/blog-cover.ts` suy ra bìa từ ảnh đầu nội dung | `blogs/components/blog-editor-screen.tsx:addImage(true)` chỉ setCover; gửi coverImageUrl riêng nhưng chưa đồng bộ ảnh đầu nội dung khi chọn/đổi/gỡ bìa. Đây là tính năng có UI nhưng sai hợp đồng. |
| P2 | Sửa mục nhật ký ăn uống | `meal-plan/meal-log/meal-log.controller.ts`: PATCH `:id` | `meal-log/services/meal-log.service.ts` chỉ có đọc/thêm/xóa/ước tính kcal, chưa update; UI chưa có sửa. |
| P2 | Kcal và nhóm dinh dưỡng công thức/thực đơn | `recipes/dto/recipe.dto.ts`, `meal-plan/dto/meal-plan.dto.ts`: `caloriesPerServing`, `nutritionPillars` | `recipes/types/recipe.schema.ts` và schema recipe trong `meal-plan/types/meal-plan.schema.ts` chưa nhận/hiển thị. Không tính kcal nhật ký và BMI đã có thành thiếu. |
| P2 | Xem thực đơn tuần cũ | GET `/meal-plan`, dữ liệu `minWeekStart` | `meal-plan/utils/meal-week.ts:planningWeeks` bắt đầu từ currentWeekStart dù schema nhận minWeekStart. Cần cho xem tuần trước và tách quyền sửa ngày quá khứ. |
| P2 | Chọn/upload video Blog | `posts/blogs/blogs.controller.ts`: POST `/blogs/videos/uploads` | `blogs/services/blogs.service.ts` mới upload ảnh; editor nhận diện video có sẵn nhưng chưa có luồng chọn/upload video mới. |
| P2 | Thống kê bài của người đăng | `posts/analytics/post-analytics.controller.ts`: GET `/analytics/posts`, `/summary` | Chưa có caller/route/UI analytics. Ghi nhận lượt xem bài đã có. |
| P2 | Tìm người dùng | `profiles/profiles.controller.ts`: GET `/profiles/search` | `posts/components/search-screen.tsx` chỉ có tab bài viết/công thức, chưa có caller tìm người. Gợi ý theo dõi/hồ sơ công khai đã có. |
| P2 | Khám phá nhà hàng/menu/đánh giá | `workspaces/workspaces.controller.ts:RestaurantsController`: danh sách, menu/search, menu/reviews, PUT/DELETE reviews/me | Chưa có feature/caller/route restaurants. Tách khỏi quản lý Trang. |

## Cần chốt phạm vi hoặc hoàn thiện nền

- **Workspace/Trang:** BE có đăng ký/gửi lại hồ sơ, thành viên/menu/thông tin và POST `/auth/switch`; mobile chưa có. Chỉ ưu tiên nếu mobile phục vụ chủ/quản lý Trang.
- **Public config:** BE GET `/public-config` công bố giới hạn upload, gồm ảnh báo cáo; mobile chưa đọc. Ảnh báo cáo đã code theo mặc định 3 ảnh/5 MB nên chưa tự thích ứng khi BE đổi cấu hình.
- **Sao chép tuần và tóm tắt bài riêng:** BE POST `/meal-plan/copy`, GET `/posts/:postId/summary`; chưa có caller mobile. Chốt nhu cầu UI trước khi coi là yêu cầu bắt buộc; không suy ra chat không thể tạo thực đơn.
- Các API admin, quản lý knowledge, webhook, health và media tổng quát không mặc định cần màn tương ứng trên mobile thành viên.

## Đã loại khỏi backlog sau PR #52

- Danh sách/chi tiết/tạo/trả lời/rút ticket, ảnh hỗ trợ, khiếu nại từ bài và mở lại ticket thường theo hạn BE: `support/` và routes `/support`.
- Thông báo ticket nhận ticketId, nội dung riêng và mở đúng ticket; cache cập nhật qua SSE.
- Ảnh minh chứng báo cáo bài/Blog: multipart endpoint riêng, evidenceIds, chọn/xem/gỡ ảnh, giữ ID khi gửi lỗi và kiểm tra phiên; UI thùng rác/lưới ảnh đã có. Chưa xác nhận upload thật trên thiết bị.

## Thứ tự đề nghị

1. Sửa hợp đồng chat trước khi ghép mobile với BE main.
2. Báo cáo bình luận + thông báo; sửa bìa Blog.
3. Ghi chú dị ứng/khẩu vị → đi chợ → sửa nhật ký → dinh dưỡng/tuần cũ.
4. Feed đúng nguồn → tạo/nháp/sửa POST → tìm người dùng.
5. Video Blog → thống kê → nhà hàng; Workspace theo phạm vi sản phẩm.

## Checklist UI đối chiếu — chưa thực hiện trên thiết bị

1. Mở Trợ lý, gửi tin và trả lời lựa chọn/quyền tìm web; xem lỗi validation nếu dùng BE main hiện tại. Sau sửa request, thử lịch sử và quay lại yêu cầu.
2. Mở bình luận người khác để đối chiếu thiếu báo cáo; tạo Blog có bìa khác ảnh đầu nội dung, lưu/mở lại để kiểm tra bìa.
3. Mở hồ sơ ăn uống tìm ghi chú; mở thực đơn tìm Đi chợ và tuần trước; mở nhật ký tìm sửa mục; mở công thức đối chiếu kcal/nhóm chất.
4. Mở feed/theo dõi nhiều trang; thử tạo bài chỉ chữ/nhiều media, mở nháp POST và sửa bài đã đăng; vào tìm kiếm đối chiếu thiếu tab người dùng.
5. Mở editor Blog tìm thêm video; tìm thống kê/nhà hàng/Trang để xác nhận phạm vi còn thiếu. Không coi việc chưa có đường dẫn trên mobile là hướng dẫn mở màn đã tồn tại.
6. Kiểm tra hồi quy phần đã làm: ticket có ảnh và thông báo mở đúng ticket; báo cáo bài kèm 3 ảnh, gỡ ảnh và thử lại sau lỗi.
