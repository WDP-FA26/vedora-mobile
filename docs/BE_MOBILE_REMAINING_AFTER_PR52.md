# BE và mobile: các phần còn chưa nối — cập nhật 26/11/2026

- Người thực hiện: Codex.
- BE: đã fetch `WDP-FA26/vedora-api`, main `c46a32d22058d95b65ec04e5782491953224bf5c`. Source đối chiếu tại `tmp/node_modules/vedora-api-review-20261125`, đã fast-forward tới commit này.
- Mobile: HEAD `13dce237836b93c2a8892e1a618785e50991a69c`, đọc source workspace hiện tại.
- Phương pháp: kiểm kê controller/DTO BE, đối chiếu caller HTTP, schema, hook và điểm vào UI mobile. So lại thay đổi từ mốc BE `8274a67`; thay thế backlog cũ của tài liệu này. Không sửa source tính năng, không commit/push.
- Phạm vi: mobile thành viên; Workspace được tách theo vai trò. Mức ưu tiên áp dụng khi triển khai BE main này cùng mobile hiện tại; chưa xác nhận commit production hoặc nghiệm thu API/thiết bị thật.

## 1. Đã có code nhưng cần sửa hợp đồng trước

### P1 — Hồ sơ ăn uống chưa chuyển sang Ghi nhớ (mới)

- BE `src/recipes/dietary.controller.ts` đã bỏ `GET /dietary/options`. `GET /dietary/me` trả `{ allergies: string[], preferences: string[] }`. `PUT /dietary/me` nhận hai trường này, mỗi danh sách tối đa 30 dòng, mỗi dòng tối đa 200 ký tự; bỏ trường để giữ nguyên, mảng rỗng để xóa (`src/recipes/dto/dietary.dto.ts`).
- Mobile `src/features/dietary-profile/services/dietary-profile.service.ts` vẫn gọi `/dietary/options`; `types/dietary-profile.schema.ts` vẫn bắt buộc `ingredients/groups`, gửi `ingredientIds/groupIds/allergyNote/preferenceNote`. GET không qua schema cũ; PUT không khớp whitelist của BE mới.
- Phải chuyển form Hồ sơ ăn uống, thẻ tóm tắt Hồ sơ và phần ràng buộc trong form yêu cầu thực đơn: `profile/components/profile-screen.tsx`, `meal-plan/types/meal-plan.schema.ts`, `meal-plan/components/meal-request-form.tsx`.
- BE đã đổi tool thành `updateMemory` (`src/meal-plan/tools/dietary-memory.tool.ts`, đăng ký trong `meal-planner-chat.service.ts`). Mobile `meal-plan/hooks/meal-planner-provider.tsx` chỉ invalidate sau `tool-updatePreferences`/`tool-updateAllergyNote`; chưa xử lý làm mới cache ghi nhớ theo tool mới, kể cả các bề mặt hồ sơ.

### P1 — Request chat thực đơn

- BE `src/meal-plan/dto/meal-plan.dto.ts:MealPlannerChatDto` yêu cầu `message: string`, `weekStart`; hỗ trợ `threadId`, `requestId`, `allowWebSearch`, `toolOutput`. `src/app.setup.ts` bật whitelist và forbidNonWhitelisted.
- Mobile `src/features/meal-plan/services/meal-plan.service.ts:askMealPlanner` vẫn gửi `messages: messages.slice(-40)`, thiếu `message`; dự kiến bị từ chối validation trước stream.
- Caller dự phòng `nutrition-chat/services/nutrition-chat.service.ts:askAccountAssistant` cũng dùng `messages[]`, thiếu `message/weekStart`. Luồng tài khoản chính dùng PlannerChatScreen; chat khách `/nutrition-chat` có hợp đồng riêng, không gộp vào lỗi này.
- UI hỏi lựa chọn, cấp quyền web, lịch sử và quay lại đã có. Mobile PATCH câu trả lời tool trước khi chat; không kết luận riêng thiếu `toolOutput` optional là lỗi bắt buộc.

### P1 — Chọn bìa Blog không đồng bộ nội dung

- BE `src/posts/blogs/blog-cover.ts:coverFromContent`, `blogs.service.ts` lấy ảnh đầu nội dung làm bìa, không lưu `coverImageUrl` như gửi lên.
- Mobile `src/features/blogs/components/blog-editor-screen.tsx:addImage(true)` chỉ `setCover(url)`; gỡ bìa chỉ xóa state cover. Cần đồng bộ chọn/đổi/gỡ bìa với nội dung để lưu/mở lại không đổi thành ảnh khác hoặc null.

### P2 — Thông báo trạng thái tài khoản khi đăng nhập

- BE `src/auth-core/account-access.ts` trả 401 kèm `ACCOUNT_SUSPENDED` hoặc `ACCOUNT_NOT_ACTIVE`.
- Mobile `src/features/auth/utils/auth-errors.ts` đang gộp mọi 401 khi login thành sai tên đăng nhập/mật khẩu; chưa hiển thị đúng lý do tài khoản bị khóa hoặc không hoạt động.

## 2. Chưa có hoặc mới làm một phần

Đường dẫn BE bắt đầu từ `src/` của BE; đường dẫn mobile bắt đầu từ `src/features/` trừ khi ghi khác.

| Ưu tiên | Chức năng | BE đã có | Mobile còn thiếu / bằng chứng |
| --- | --- | --- | --- |
| P1 | Trợ lý giọng nói | POST `/meal-plan/voice/session`, `/meal-plan/voice/turns`; `meal-plan/voice/meal-planner-voice.controller.ts` | Chưa có caller/schema/mic/phiên realtime/UI. Hợp đồng mới nhận `screen`, phát `data-screen`, `data-refresh`, `data-progress`, `data-summary`, `data-end-call`; chưa mở/đóng công thức/nhật ký/BMI, chọn bước nấu/cuộn, ghi bữa/cập nhật chỉ số/hoàn tác và làm mới cache. BE cần gateway; cần xác minh native riêng. |
| P1 | Danh sách đi chợ | GET `/meal-plan/shopping-list`; `meal-plan/shopping-list.controller.ts` | Chưa có service/hook/route/UI chọn ngày, nguyên liệu tổng hợp và nguồn món. BE chưa có lưu trạng thái đã mua, nên không liệt kê đó là API sẵn có. |
| P1 | Feed cá nhân hóa | GET `/posts/feed`; `posts/posts.controller.ts` | `feed/services/feed.service.ts` gọi `/posts`, chưa dùng nguồn cá nhân hóa. |
| P1 | Feed theo dõi đúng phân trang | GET `/posts/following` | `following/services/following.service.ts` lấy tối đa 20 bài/tác giả rồi ghép, chưa dùng feed/phân trang chung; có thể thiếu bài và tăng số request. |
| P1 | Bài POST chỉ chữ/nhiều video và nháp POST | POST `/posts`; CRUD/publish `/posts/drafts`; `posts/dto/create-post.dto.ts`, `post-draft.dto.ts` | `feed/services/compose.service.ts` chỉ tạo kind VIDEO, lọc nháp POST; `feed/hooks/use-compose-actions.ts` bắt buộc một video. Chưa có composer POST tổng quát. Không suy ra BE đã hỗ trợ upload ảnh POST từ tên mediaIds. |
| P2 | Sửa nhật ký ăn uống | PATCH `/meal-plan/log/:id`; `meal-plan/meal-log/meal-log.controller.ts` | `meal-log/services/meal-log.service.ts` chỉ đọc/thêm/xóa/ước tính kcal; chưa update hoặc form sửa mục đã lưu. |
| P2 | Dinh dưỡng công thức/thực đơn | `caloriesPerServing`, `nutritionPillars`; `recipes/dto/recipe.dto.ts`, `meal-plan/dto/meal-plan.dto.ts` | Schema công thức trong `recipes/types/recipe.schema.ts` và `meal-plan/types/meal-plan.schema.ts` chưa nhận/hiển thị. Kcal nhật ký và BMI đã có, không thuộc thiếu sót này. |
| P2 | Lọc thời gian nấu, hiển thị nhóm món | GET `/recipes?maxMinutes=...`, trường `tag`; `recipes/dto/recipe-catalog.dto.ts`, `recipe.dto.ts` | `recipes/services/recipe.service.ts` chỉ gửi q/suitableForMe/phân trang; RecipeFilters chưa có maxMinutes. Schema công thức và món thực đơn chưa nhận tag để dùng nhóm món BE trả. Không nhầm với danh mục động admin. |
| P2 | Xem thực đơn tuần cũ | GET `/meal-plan?weekStart=...`, minWeekStart | `meal-plan/utils/meal-week.ts:planningWeeks` bắt đầu từ currentWeekStart đến maxWeekStart; chưa chọn tuần trước. Cần giữ quyền sửa theo ngày/tuần BE. Nhật ký có xem tuần cũ riêng. |
| P2 | Upload/chèn video Blog | POST `/blogs/videos/uploads`; `posts/blogs/blogs.controller.ts` | `blogs/services/blogs.service.ts` chỉ upload ảnh; editor nhận diện video có sẵn nhưng chưa có chọn/upload video mới. |
| P2 | Thống kê bài của người đăng | GET `/analytics/posts`, `/analytics/posts/summary`; `posts/analytics/post-analytics.controller.ts` | Chưa có caller/route/UI thống kê và chọn khoảng ngày. Gửi lượt xem bài đã có. |
| P2 | Tìm người dùng | GET `/profiles/search`; `profiles/profiles.controller.ts` | Chưa có caller; `posts/components/search-screen.tsx` mới có bài viết/công thức. Gợi ý theo dõi và hồ sơ công khai đã có. |
| P2 | Khám phá nhà hàng/menu/đánh giá | GET `/restaurants`, `/restaurants/menu/search`, `/restaurants/:pageUserId/menu`, `/reviews`; PUT/DELETE `/restaurants/:pageUserId/reviews/me`; `workspaces/workspaces.controller.ts:RestaurantsController` | Chưa có feature/service/route/UI tìm nhà hàng/món, xem menu, đọc/viết/sửa/xóa đánh giá. Tách khỏi quản lý Trang. |

## 3. API nền và thao tác cần chọn phạm vi UI

| Nhóm | API BE | Mobile còn thiếu / tác động |
| --- | --- | --- |
| Tổng tin nhắn chưa đọc | GET `/messaging/unread-count`; `messaging/messaging.controller.ts` | `messaging/hooks/use-messaging.ts:useMessagingUnread` chỉ cộng unreadCount của 50 conversation đầu mỗi ngăn friends/requests; huy hiệu có thể thiếu khi unread ở ngoài trang đầu. Chưa gọi API tổng. |
| Cấu hình runtime | GET `/public-config`; `config/public-config.controller.ts` | Chưa có caller/schema/cache; mobile giữ hằng số riêng cho giới hạn upload, form và nội dung. Khi BE đổi cấu hình, mobile chưa tự đồng bộ. |
| Workspace/Trang (theo vai trò) | `/workspaces/mine`, proofs/đăng ký/resubmit, details/members/menu; POST `/auth/switch` | Chưa có module quản lý Trang/chuyển danh tính. Chỉ đưa vào kế hoạch nếu mobile phục vụ chủ/quản lý Trang. |
| Sao chép tuần | POST `/meal-plan/copy` | Chưa có nút/caller sao chép trực tiếp; không suy ra chat không tạo được thực đơn. |
| Tóm tắt AI riêng của bài | GET `/posts/:postId/summary`; `posts/summaries/post-summaries.controller.ts` | Chưa có caller/nút xem trạng thái/nội dung summary qua endpoint này. |
| Chỉnh thực đơn trực tiếp ngoài chat | POST `/meal-plan/preview`, `/generate`, PUT `/meal-plan/days` | Chưa có caller trực tiếp; hiện chỉnh/tạo/lưu qua planner chat và tool. Chỉ thêm nếu cần UI preview/tự chọn món ngoài chat. |
| Đổi tên hội thoại | PATCH `/meal-plan/chat/threads/:threadId` với title | Mobile đã PATCH để trả lời tool, có đọc/xóa/quay lại lịch sử; chưa có UI đổi tên. Tạo thread qua POST riêng không bắt buộc khi chat đã tự tạo. |

## 4. Đã có code hoặc không thuộc backlog mobile thành viên

- Cập nhật 27/11/2026: đã nối PATCH `/posts/:id`, menu chủ bài và màn `/posts/[id]/edit`; sửa chữ, giữ/gỡ/đổi thứ tự video hiện có, xác nhận bỏ thay đổi và làm mới cache sau kiểm duyệt. Đối chiếu BE main `82c3f31`. Chưa thêm upload video mới trong màn sửa, chưa nghiệm thu trên thiết bị/API có đăng nhập.
- Hỗ trợ/khiếu nại: tạo/list/detail/trả lời/rút, ảnh, mở lại ticket thường theo hạn và mở từ thông báo; `support/services/support.service.ts` và các màn support.
- Ảnh minh chứng báo cáo bài/Blog: `posts/services/report-evidence.service.ts`, evidenceIds và UI chọn/xem/gỡ.
- Báo cáo bình luận/phản hồi: `posts/services/comment-report.service.ts`, `posts/components/comment-report-button.tsx`; năm loại thông báo xử lý bình luận đã có nội dung/điều hướng/cache.
- Ghi chú dị ứng/khẩu vị đã được làm theo hợp đồng BE cũ; với main mới phải chuyển sang Ghi nhớ (mục 1), không còn được coi là đã nối đúng hợp đồng hiện tại.
- Auth, Google native, billing/SSE, xác minh, hồ sơ, nhắn tin/chia sẻ bài, tương tác bài/công thức, yêu thích/đánh giá công thức và ghi lượt xem đã có caller. Đây là xác nhận có code, không chứng minh mọi nhánh chạy đúng trên hệ thống thật.
- Danh mục công thức mới chỉ có `/admin/recipe-categories` (CRUD/sắp xếp). `docs/docs-for-FE/recipe-categories.md` ghi rõ công thức vẫn dùng tag, gắn/lọc danh mục cho người dùng chưa triển khai. Không tính thiếu CRUD admin là thiếu chức năng mobile thành viên.
- DELETE `/users/:id` đang bị `DisabledEndpointGuard` vô hiệu hóa (404); không coi xóa tài khoản là API BE đã sẵn sàng để nối.
- Storage đổi sang SeaweedFS/HeadObject: luồng upload/activate cần nghiệm thu lại; thay đổi hạ tầng không tự đồng nghĩa phải thêm màn hình hoặc thay toàn bộ uploader.
- Không đưa admin/moderation/knowledge, webhook/health, quản trị tài khoản/thanh toán/logs vào backlog bắt buộc cho thành viên.

## 5. Thứ tự đề nghị

1. Chuyển Hồ sơ ăn uống/Ghi nhớ và cache tool mới; sửa request chat; đồng bộ bìa Blog.
2. Tổng unread và public-config; thông báo đúng trạng thái tài khoản.
3. Đi chợ → sửa nhật ký → dinh dưỡng/bộ lọc công thức → tuần cũ.
4. Feed đúng nguồn → POST tổng quát/nháp → tìm người dùng.
5. Voice → video Blog → thống kê → nhà hàng; Trang theo phạm vi sản phẩm.

## 6. Checklist UI trên màn hình — đề nghị, chưa thực hiện

1. Đăng nhập vào BE mới → Hồ sơ ăn uống → đối chiếu lỗi tải/schema; sau khi chuyển hợp đồng, thêm/sửa/xóa từng dòng dị ứng/khẩu vị → mở lại → nhờ trợ lý ghi nhớ sở thích và kiểm tra cập nhật ở Hồ sơ/Thực đơn.
2. Trợ lý → gửi tin → trả lời lựa chọn → cấp/từ chối tìm web → mở lịch sử → quay lại mốc cũ. Xác minh request hiện tại trước khi sửa và hồi quy sau sửa.
3. Blog → chọn bìa A, thêm ảnh B vào nội dung → lưu nháp → mở lại → đối chiếu bìa; tìm thao tác thêm video mới.
4. Thực đơn → bộ chọn tuần → tìm tuần cũ/Đi chợ; Nhật ký → mở mục đã lưu → tìm sửa; Công thức → đối chiếu kcal/nhóm chất/giới hạn thời gian nấu.
5. Khám phá/Theo dõi → cuộn nhiều trang; Tạo bài → thử chỉ chữ/nhiều video; Nháp → tìm POST; bài của mình → tìm sửa; Tìm kiếm → tìm tab người dùng.
6. Hộp thư có hơn 50 cuộc trò chuyện/ngăn và unread ngoài trang đầu → so huy hiệu với tổng BE → đọc tin → kiểm tra cập nhật.
7. Tìm điểm vào voice/thống kê/nhà hàng/Trang. Các mục này là checklist đối chiếu phần thiếu, không phải khẳng định màn đã tồn tại.
8. Hồi quy phần có sẵn: gửi ticket kèm ảnh → mở từ thông báo; báo cáo bài kèm ảnh; báo cáo bình luận và nhận thông báo xử lý. Thử tài khoản khóa để kiểm tra thông báo đăng nhập.

## 7. Kiểm chứng và giới hạn

- Đã fetch thành công BE main mới, đọc thay đổi và đối chiếu controller/DTO cùng caller/schema/hook/UI liên quan; không chỉ dùng báo cáo cũ.
- Tìm toàn bộ src mobile các endpoint shopping-list, voice, feed/following chuyên dụng, analytics, profiles/search, restaurants, workspaces, public-config, copy, summary: chưa có caller tương ứng. `/notifications/unread-count` đã có; `/messaging/unread-count` còn thiếu.
- Chưa chạy BE/DB/storage/gateway, gọi API bằng tài khoản thật hoặc thao tác Android/iOS/web. Tài liệu voice BE mô tả tích hợp trình duyệt; cần xác minh mic/realtime và quyền native trước khi triển khai.
- Không sửa source tính năng hoặc thêm dependency. Kết quả lint/TypeScript của lượt rà ghi trong PLAN.md.
