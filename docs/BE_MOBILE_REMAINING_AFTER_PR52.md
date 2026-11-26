# BE và mobile: các phần còn chưa nối — cập nhật 25/11/2026

- Người thực hiện: Codex.
- BE: đã fetch và đọc lại `origin/main` tại `8274a676cb26af1fdcf861f8a878ea9e44421e3a`. Bản tham khảo: `tmp/node_modules/vedora-api-review-20261125`.
- Mobile: source workspace tại HEAD `810a80a` (`feat: add comment reporting and moderation notifications`).
- So với báo cáo trước tại BE `db7da97`, BE có thêm bốn commit: voice planner, kiểm thử voice, đổi lớp provider AI và công cụ trả kcal. Báo cáo này thay thế backlog cũ trong tài liệu này.
- Phương pháp: đối chiếu controller/DTO/service BE với toàn bộ caller HTTP, schema, hook và UI liên quan trên mobile. Đây là kết luận từ source; chưa nghiệm thu API/thiết bị thật. Không sửa source tính năng, không commit/push.

## 1. Đã nối nhưng sai hợp đồng

### P1 — Chat trợ lý thực đơn

- BE `src/meal-plan/dto/meal-plan.dto.ts:MealPlannerChatDto` yêu cầu `message: string`, `weekStart`; nhận thêm `threadId`, `requestId`, `allowWebSearch`, `toolOutput` tùy chọn. `src/app.setup.ts` bật whitelist và forbidNonWhitelisted.
- Mobile `src/features/meal-plan/services/meal-plan.service.ts:askMealPlanner` vẫn gửi `messages: messages.slice(-40)` và không gửi `message`. Request không khớp validation BE, dự kiến bị từ chối trước khi stream.
- Caller dự phòng `src/features/nutrition-chat/services/nutrition-chat.service.ts:askAccountAssistant` cũng gửi `messages[]`, thiếu `message`/`weekStart`. Không áp dụng kết luận này cho chat khách `/nutrition-chat`, vốn có hợp đồng riêng.
- UI lịch sử, trả lời câu hỏi, cho phép tìm web, quay lại mốc chat đã có. Cần sửa request và kiểm tra các nhánh tiếp tục hội thoại, không tính cả module chat là chưa làm.

### P1 — Bìa Blog không đồng bộ với nội dung

- BE `src/posts/blogs/blog-cover.ts:coverFromContent` và `blogs.service.ts` lấy ảnh đầu tiên hợp lệ trong nội dung làm bìa; không lưu `coverImageUrl` như FE gửi.
- Mobile `src/features/blogs/components/blog-editor-screen.tsx:addImage(true)` chỉ `setCover(url)`; chưa thêm/chuyển ảnh đó thành ảnh đầu nội dung. Chọn bìa A nhưng nội dung có ảnh B đầu tiên thì lưu/mở lại có thể thành B hoặc null.
- Cần đồng bộ thao tác chọn/đổi/gỡ bìa với nội dung.

## 2. Chức năng chưa nối hoặc mới nối một phần

Đường dẫn BE trong bảng bắt đầu từ `src/` của repo BE. Đường dẫn mobile bắt đầu từ `src/features/`.

| Ưu tiên | Chức năng | BE hiện có | Mobile còn thiếu / bằng chứng |
| --- | --- | --- | --- |
| P1 | Trợ lý giọng nói — mới trên BE | POST `/meal-plan/voice/session`, POST `/meal-plan/voice/turns`; `meal-plan/voice/meal-planner-voice.controller.ts`, `docs/docs-for-FE/meal-plan-voice.md` | Chưa có caller, schema, mic, phiên realtime hoặc UI voice. Chưa xử lý tool để mở công thức/nhật ký/BMI, ghi bữa, cập nhật chỉ số, hoàn tác và làm mới cache. Đây là nhóm voice; các tool đặc thù này không mặc định có trong chat chữ. BE cần cấu hình gateway để session hoạt động. |
| P1 | Danh sách đi chợ | GET `/meal-plan/shopping-list`; `meal-plan/shopping-list.controller.ts` | Chưa có service/hook/route/UI: chọn ngày, xem nguyên liệu tổng hợp và nguồn món. Endpoint này không lưu trạng thái đã mua. |
| P1 | Feed cá nhân hóa và feed theo dõi | GET `/posts/feed`, GET `/posts/following`; `posts/posts.controller.ts` | `feed/services/feed.service.ts` gọi `/posts` nên chưa dùng nguồn cá nhân hóa. `following/services/following.service.ts` lấy tối đa 20 bài mỗi tác giả rồi ghép, chưa dùng phân trang chung `/posts/following`; có thể bỏ sót bài cũ và tăng số request. |
| P1 | Tạo bài POST chỉ chữ/nhiều video và nháp POST | POST `/posts`; CRUD/publish `/posts/drafts` với kind POST/VIDEO; `posts/dto/create-post.dto.ts`, `post-draft.dto.ts`, `post-drafts.service.ts` | `feed/services/compose.service.ts` chỉ tạo kind VIDEO, lọc bỏ nháp POST. `feed/hooks/use-compose-actions.ts` bắt buộc một video và loại media khác. Chưa có composer POST tổng quát. Upload nháp BE hiện tạo MediaType.VIDEO; không suy ra đã có upload ảnh POST. |
| P2 | Sửa mục nhật ký ăn uống | PATCH `/meal-plan/log/:id`; `meal-plan/meal-log/meal-log.controller.ts` | `meal-log/services/meal-log.service.ts` có đọc/thêm/xóa/ước tính kcal, chưa có update hoặc form sửa mục đã lưu. |
| P2 | Kcal và nhóm dinh dưỡng công thức/thực đơn | `caloriesPerServing`, `nutritionPillars`; `recipes/dto/recipe.dto.ts`, `meal-plan/dto/meal-plan.dto.ts` | `recipes/types/recipe.schema.ts` và recipe trong `meal-plan/types/meal-plan.schema.ts` chưa nhận/hiển thị. Kcal nhật ký và BMI đã có, không thuộc thiếu sót này. |
| P2 | Xem thực đơn tuần cũ | GET `/meal-plan?weekStart=...`, `minWeekStart` trong response | Schema mobile nhận minWeekStart nhưng `meal-plan/utils/meal-week.ts:planningWeeks` chỉ tạo lựa chọn từ currentWeekStart đến maxWeekStart. Chưa có chọn tuần trước; cần giữ quyền sửa theo ngày/tuần BE. |
| P2 | Chọn/upload video Blog | POST `/blogs/videos/uploads`; `posts/blogs/blogs.controller.ts` | `blogs/services/blogs.service.ts` mới có upload ảnh; editor nhận diện video có sẵn nhưng chưa có bộ chọn/upload video mới. |
| P2 | Thống kê bài của người đăng | GET `/analytics/posts`, GET `/analytics/posts/summary`; `posts/analytics/post-analytics.controller.ts` | Chưa có caller/route/UI thống kê và chọn khoảng ngày. Gửi lượt xem `/posts/views` đã có. |
| P2 | Tìm người dùng | GET `/profiles/search`; `profiles/profiles.controller.ts` | Chưa có caller; `posts/components/search-screen.tsx` chỉ có tab bài viết/công thức. Gợi ý theo dõi và hồ sơ công khai đã có. |
| P2 | Khám phá nhà hàng, menu và đánh giá | GET `/restaurants`, `/restaurants/menu/search`, `/restaurants/:pageUserId/menu`, `/reviews`; PUT/DELETE `/restaurants/:pageUserId/reviews/me`; `workspaces/workspaces.controller.ts:RestaurantsController` | Chưa có feature/service/route/UI: danh sách hoặc bản đồ, tìm món, xem menu, xem/viết/sửa/xóa đánh giá. Tách khỏi quản lý Trang. |

## 3. API nền chưa dùng và phạm vi cần chọn

| Nhóm | API BE | Tình trạng mobile / tác động |
| --- | --- | --- |
| Tổng tin nhắn chưa đọc | GET `/messaging/unread-count`; `messaging/messaging.controller.ts` | Chưa gọi API tổng. `messaging/hooks/use-messaging.ts:useMessagingUnread` tải 50 conversation đầu mỗi ngăn friends/requests rồi cộng unreadCount. Số huy hiệu có thể thiếu khi tin chưa đọc nằm ngoài hai trang đầu; nên nối endpoint BE. |
| Giới hạn cấu hình runtime | GET `/public-config`; `config/public-config.controller.ts` | Chưa có caller/schema/cache. Mobile dùng hằng số riêng; ví dụ ảnh báo cáo 3 ảnh/5 MB. Nếu BE đổi giới hạn, form mobile chưa tự thích ứng. API này còn có giới hạn auth, nội dung, AI, phân trang và thanh toán, không chỉ upload. |
| Workspace/Trang | `/workspaces/mine`, đăng ký/proofs/resubmit, thông tin/thành viên/menu; POST `/auth/switch` | Chưa có module quản lý Trang hoặc chuyển phiên Trang. Chỉ lên kế hoạch nếu mobile phục vụ chủ/quản lý Trang. |
| Sao chép thực đơn | POST `/meal-plan/copy` | Chưa có nút/caller sao chép tuần trực tiếp. Chốt nhu cầu trước khi làm; không coi đây là bằng chứng chat không tạo được thực đơn. |
| Tóm tắt AI riêng của bài | GET `/posts/:postId/summary`; `posts/summaries/post-summaries.controller.ts` | Chưa gọi endpoint riêng. Xem bài/công thức liên kết hiện có không tương đương màn xem trạng thái/nội dung summary từ API này. |
| Thao tác thực đơn trực tiếp | POST `/meal-plan/preview`, `/generate`, PUT `/meal-plan/days` | Không có caller trực tiếp hiện tại; mobile đi qua planner chat và tool ghi thực đơn. Chỉ bổ sung khi cần màn preview/tự sửa/lưu ngoài chat, không mặc định là thiếu toàn bộ chức năng tạo/lưu thực đơn. |
| Quản lý tên hội thoại | POST `/meal-plan/chat/threads`, PATCH thread với title | Mobile có tạo thread qua chat, đọc/xóa/quay lại lịch sử; chưa có đổi tên hội thoại trong UI. Tạo thread bằng endpoint riêng không bắt buộc khi đã dùng cơ chế tạo trong chat. |

Không đưa API admin/moderation/knowledge, webhook, health, CRUD người dùng quản trị hay media nội bộ vào backlog bắt buộc của mobile thành viên.

## 4. Đã nối — bỏ khỏi backlog cũ

- Cập nhật 27/11/2026: đã nối PATCH `/posts/:id`, menu chủ bài và màn `/posts/[id]/edit`; sửa chữ, giữ/gỡ/đổi thứ tự video hiện có, xác nhận bỏ thay đổi và làm mới cache sau kiểm duyệt. Đối chiếu BE main `82c3f31`. Chưa thêm upload video mới trong màn sửa, chưa nghiệm thu trên thiết bị/API có đăng nhập.

- Ghi chú dị ứng/khẩu vị: đã bổ sung đọc/sửa/xóa trong Hồ sơ ăn uống, giới hạn 1.000 ký tự mỗi trường, cập nhật schema/cache hồ sơ và Thực đơn; giữ nội dung sau lỗi. Đã kiểm thử mock, chưa kiểm tra API/thiết bị thật.

- Báo cáo bình luận/phản hồi: `posts/services/comment-report.service.ts`, `posts/components/comment-report-button.tsx` và `comment-section.tsx`.
- Đủ năm loại thông báo COMMENT_REMOVED, COMMENT_REMOVED_BY_POST_OWNER, COMMENT_THREAD_REMOVED, COMMENT_REPORT_RESOLVED, COMMENT_REPORT_DISMISSED: nội dung, điều hướng và cache liên quan đã code.
- Hỗ trợ/khiếu nại: tạo/list/detail/trả lời/rút, ảnh, mở lại ticket thường theo hạn và thông báo mở đúng ticket.
- Ảnh minh chứng báo cáo bài/Blog: endpoint multipart riêng, evidenceIds và UI chọn/xem/gỡ.
- Gửi lượt xem bài; nhắn tin/chia sẻ bài, chấp nhận/xóa lời mời; auth, billing/SSE, xác minh, hồ sơ, tương tác bài/công thức đã có caller. Danh sách này xác nhận có code kết nối, không chứng minh mọi nhánh đã chạy đúng trên hệ thống thật.

## 5. Thứ tự đề nghị

1. Sửa request chat và đồng bộ bìa Blog.
2. Nối API tổng unread và public-config.
3. Đi chợ → sửa nhật ký → dinh dưỡng → tuần cũ.
4. Feed đúng nguồn → POST tổng quát/nháp → tìm người dùng.
5. Voice → video Blog → thống kê → nhà hàng; Trang theo phạm vi sản phẩm.

## 6. Checklist UI trên màn hình — đề nghị, chưa thực hiện

1. Đăng nhập → Trợ lý → gửi tin → trả lời câu hỏi lựa chọn → cấp/từ chối tìm web → mở lịch sử → quay lại mốc cũ; xác minh lỗi request hiện tại trước khi sửa và hồi quy sau khi sửa.
2. Blog → tạo bài → chọn bìa A → thêm ảnh B trong nội dung → lưu nháp → đóng/mở lại; kiểm tra bìa thực tế. Tìm thao tác thêm video mới.
3. Hồ sơ ăn uống → tìm ghi chú dị ứng/khẩu vị; Thực đơn → mở bộ chọn tuần → tìm tuần cũ/Đi chợ; Nhật ký → mở mục đã lưu → tìm sửa; Công thức → xem kcal/nhóm chất.
4. Khám phá/Theo dõi → cuộn nhiều trang; Tạo bài → thử chỉ chữ và nhiều video; Nháp → tìm nháp POST; bài của mình → menu → tìm sửa. Tìm kiếm → đối chiếu tab người dùng.
5. Hộp thư → chuẩn bị hơn 50 cuộc trò chuyện ở một ngăn, có tin chưa đọc ngoài trang đầu → so huy hiệu mobile với tổng BE; đánh dấu đã đọc và kiểm tra cập nhật.
6. Trợ lý → tìm thao tác voice; Hồ sơ → tìm thống kê/Trang; tìm Nhà hàng/menu/đánh giá. Đây là đối chiếu điểm vào còn thiếu, không phải hướng dẫn mở màn đã tồn tại.
7. Hồi quy phần đã có: báo cáo bình luận người khác → nhận thông báo xử lý; gửi ticket kèm ảnh → mở qua thông báo; báo cáo bài kèm ảnh → gỡ và thử gửi lại sau lỗi.

## 7. Kiểm chứng và giới hạn

- Đã fetch BE main thành công, đọc thay đổi mới và đối chiếu source liên quan.
- Chưa chạy BE/DB/storage/gateway, gọi API bằng tài khoản thật, kiểm tra mic/realtime hoặc thao tác Android/iOS/web. Cần xác minh tương thích native riêng khi triển khai voice; tài liệu FE BE hiện mô tả tích hợp trình duyệt.
- Không thay đổi source tính năng hoặc thêm dependency. Kết quả lint/TypeScript của lượt rà này được ghi trong PLAN.md.
