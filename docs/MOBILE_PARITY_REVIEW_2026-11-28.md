# Mobile còn thiếu so với backend và web — 28/11/2026

Báo cáo này thay kết luận hiện trạng của bản 27/11. Mobile đã có Voice, nhà hàng và quản lý Trang; không tiếp tục liệt kê toàn bộ các module đó là chưa làm.

**Cập nhật triển khai 28/11/2026:** Đã bổ sung Đi chợ (mục 5), thêm/gỡ/chuyển món trực tiếp (phần chính mục 6), Lên nhanh/hoàn tác (mục 7), xem tuần cũ (mục 10) và bảng Đi chợ trong Voice (một phần mục 19). Dùng cùng endpoint BE với web; dấu đã mua lưu theo tài khoản/tuần trên thiết bị, chưa có API đồng bộ dấu tick giữa thiết bị. Các mô tả thiếu ban đầu bên dưới giữ làm bằng chứng tại thời điểm rà soát; xem trạng thái cập nhật ở từng mục và checklist mới trong `docs/PLAN.md`. Đã kiểm tra tự động và xuất bundle, chưa nghiệm thu Expo Go/tài khoản thật.

## Nguồn và cách đối chiếu

| Repo | Mốc đã đọc |
| --- | --- |
| Backend | `WDP-FA26/vedora-api`, `origin/main` **9ce48cee304afaa384328610da56fbca0d96e728** |
| Frontend web | `WDP-FA26/vedora-frontend`, `origin/main` **6cfa75d843c24d1670c4dbda74c434bc6b24eb82** |
| Mobile | HEAD **e1d06d2e4e6684b719baaef4aa08be08aeecd740**, cộng toàn bộ source đang sửa/chưa commit trong workspace, gồm Voice realtime và UI nhà hàng mới |

Đã fetch thành công `main` của BE và web trong lượt rà soát này. Đọc source theo commit trên, không dùng HEAD cũ của các clone review. Snapshot để tra cứu nằm tại `tmp/node_modules/parity-be-20261128` và `tmp/node_modules/parity-web-20261128`; không sửa hai repo nguồn.

Đã lập danh mục controller/endpoint BE, route và module web/mobile; đối chiếu DTO/schema, service, hook và nơi component thực sự được gắn vào màn hình. Rà các luồng tài khoản, feed/bài viết/nháp, bình luận/báo cáo, hồ sơ, Blog/AI, công thức, thực đơn/chat/Voice, nhật ký/dinh dưỡng, nhà hàng/Trang, messaging, notifications, billing, xác minh và hỗ trợ. Đi sâu vào các nhánh thiếu/lệch bên dưới, không đọc từng dòng mọi module admin hoặc hạ tầng.

Phạm vi là ứng dụng thành viên và chủ/quản lý nhà hàng, nhiều tài khoản dùng chung hệ thống; có tài khoản với hơn 50 hội thoại/ngăn và có lịch sử thực đơn. Không biến mọi API quản trị thành yêu cầu mobile. **P1** là ưu tiên hoàn thiện luồng hiện có; **P2** là bổ sung tương đương web; **P3** là tùy chỉnh có thể làm sau. Đây là thứ tự đề nghị, không phải kết quả đo lỗi production.

Các đường dẫn BE/Web dưới đây tính từ root repo tương ứng. Các kết luận “chưa có” đã được tìm caller trong toàn bộ `src` mobile, không chỉ kiểm tra tên route.

## A. Cần sửa hành vi đã có

### 1. P1 — Ảnh bìa Blog không theo lựa chọn đang hiển thị

- **Luồng:** Chọn bìa A, chèn ảnh B trong nội dung, lưu và mở lại.
- **Vấn đề/hậu quả:** Mobile gửi `coverImageUrl: A`, nhưng BE lấy ảnh hợp lệ đầu tiên trong nội dung làm bìa. Kết quả mở lại có thể thành B hoặc không có bìa; thao tác Gỡ bìa cũng không có tác dụng nếu nội dung vẫn chứa ảnh đầu tiên.
- **Bằng chứng:** BE `src/posts/blogs/blogs.service.ts:75`, `:202`, `src/posts/blogs/blog-cover.ts:10`; Web `features/blogs/hooks/use-blog-draft.ts:22`, `:116` cùng suy bìa từ nội dung. Mobile `src/features/blogs/components/blog-editor-screen.tsx` giữ `cover` riêng; `addImage(true)` chỉ gọi `setCover`, còn `persist` gửi cả nội dung và bìa độc lập.
- **Sửa nhỏ nhất:** Suy bìa từ ảnh đầu nội dung như web, bỏ lựa chọn bìa độc lập không được BE lưu theo ý nghĩa đó. Thêm kiểm tra chọn/đổi/gỡ rồi mở lại.

### 2. P1 — Thông báo duyệt/từ chối Trang chưa mở được Trang

- **Luồng:** Chủ nhà hàng nhận `WORKSPACE_APPROVED` hoặc `WORKSPACE_REJECTED` rồi chạm thông báo.
- **Vấn đề/hậu quả:** Schema mobile bỏ `workspaceId`; nội dung rơi vào “có thông báo mới cho bạn”. Với thông báo hệ thống không có actor/post, chạm không dẫn tới màn quản lý Trang, nên chủ Trang khó xem kết quả và lý do để gửi lại hồ sơ.
- **Bằng chứng:** BE `src/workspaces/workspaces.service.ts:577` gửi thông báo kèm `workspaceId`, `reason`, `note`. Web `features/notifications/schemas.ts`, `features/notifications/components/notifications-view.tsx:92`, `features/notifications/lib/notification-text.ts:153` nhận và mở workspace. Mobile `src/features/notifications/types/notification.schema.ts:3`, `src/features/notifications/utils/notification-text.ts:21`, `src/features/notifications/components/notifications-screen.tsx` chưa có nhánh này.
- **Sửa nhỏ nhất:** Giữ `workspaceId` trong schema, thêm lời thông báo và nhãn lý do, điều hướng tới `/pages/[id]`. Kiểm tra cả thông báo được chấp thuận lẫn bị từ chối. Đã xác nhận bằng assert trên schema/helper hiện tại: `workspaceId` bị strip và lời thông báo bằng nhánh loại chưa biết; chưa thử với thông báo thật từ server.

### 3. P2 — Badge tin nhắn chưa đọc chỉ cộng hai trang đầu

- **Luồng:** Có tin chưa đọc trong hội thoại ngoài 50 hội thoại đầu của một ngăn.
- **Vấn đề/hậu quả:** `useMessagingUnread` chỉ lấy tối đa 50 hội thoại/ngăn friends và requests rồi cộng. Badge có thể thấp hơn tổng thực tế dù BE đã có API tổng.
- **Bằng chứng:** BE `src/messaging/messaging.controller.ts:76`, GET `/messaging/unread-count`. Web `features/messaging/messaging-cache.ts:5` và hook unread dùng endpoint này. Mobile `src/features/messaging/hooks/use-messaging.ts` ghi rõ “first 50 conversations each” và tự cộng `unreadCount`.
- **Sửa nhỏ nhất:** Gọi endpoint tổng, giữ cách invalidation/SSE hiện có; bỏ việc tải hai danh sách chỉ để tính badge.

### 4. P2 — Tài khoản bị khóa vẫn được báo như sai mật khẩu

- **Luồng:** Nhập đúng thông tin của tài khoản SUSPENDED hoặc chưa ACTIVE.
- **Vấn đề/hậu quả:** BE trả 401 với `ACCOUNT_SUSPENDED`/`ACCOUNT_NOT_ACTIVE`; mobile gộp mọi 401 login thành sai tên đăng nhập hoặc mật khẩu. Người dùng thử đổi mật khẩu cũng không giải quyết được nguyên nhân.
- **Bằng chứng:** BE `src/auth-core/account-access.ts:4`, caller `src/auth/auth.service.ts`. Web `features/auth/lib/account-block.ts` phân biệt hai mã. Mobile `src/features/auth/utils/auth-errors.ts:13` chỉ xét 401 và action login.
- **Sửa nhỏ nhất:** Xét hai mã trước nhánh 401 chung, hiển thị đúng trạng thái và hướng dẫn hỗ trợ tương ứng.

## B. Web có luồng sử dụng, mobile chưa có hoặc mới làm một phần

### 5. P1 — Đi chợ từ thực đơn đã lưu

- **Trạng thái sau triển khai:** Đã có sheet Đi chợ, chọn ngày/số người, quy đổi lượng theo từng công thức, nguồn nguyên liệu/mở công thức, tick đã mua, sao chép và lưu cục bộ theo tài khoản/tuần. Voice mở/đổi phạm vi/số người/tick/gỡ tick/xóa tick, gửi snapshot và ngữ cảnh danh sách. API/schema/hook nằm trong các file `shopping-list.*`, `shopping-preferences.*`, `use-shopping-list.ts`, `shopping-list-panel.tsx`.

- **Web có:** Chọn ngày, cộng nguyên liệu, xem món đóng góp, đổi số người, đánh dấu đã mua, sao chép danh sách và mở công thức.
- **Mobile thiếu/hậu quả:** Không có caller GET `/meal-plan/shopping-list` hoặc màn Đi chợ. Lịch đã lưu chưa chuyển thành checklist mua nguyên liệu; Voice cũng không mở được bảng này.
- **Bằng chứng:** BE `src/meal-plan/shopping-list.controller.ts`, `src/meal-plan/dto/shopping-list.dto.ts`; Web `features/meal-plan/components/shopping-list/shopping-list-sheet.tsx`, được mount trong `features/meal-plan/components/meal-planner-view.tsx:820`. Mobile `src/features/meal-plan/services/meal-plan.service.ts` chưa có API này; hook Voice trả lời rõ mục chưa hỗ trợ.
- **Bổ sung nhỏ nhất:** Dùng danh sách tính sẵn của BE, thêm chọn ngày/số người và trạng thái đã mua cục bộ như web. Không tạo API lưu checklist mới khi BE chưa có hợp đồng đó.

### 6. P1 — Chỉnh món trực tiếp trên lịch

- **Trạng thái sau triển khai:** Đã có Thêm món theo hồ sơ, gỡ có xác nhận, chuyển ngày/bữa qua sheet; lưu nguyên tử các ngày liên quan bằng `PUT /meal-plan/days`, giữ bữa không chỉnh, chặn ngày khóa/món trùng/bữa quá 5 món. Có hoàn tác bảo vệ thay đổi mới hơn. Thao tác Đã ăn ngay trên món vẫn chưa thuộc lượt triển khai này; nhật ký hiện có được giữ nguyên.

- **Web có:** Thêm công thức vào ô, gỡ món, chuyển món sang ngày/bữa khác, lưu thay đổi và xử lý ngày khóa. Có thao tác đánh dấu Đã ăn ngay trên món để nối với nhật ký.
- **Mobile thiếu/hậu quả:** Màn thực đơn hiện chủ yếu xem lịch, mở công thức và nhờ AI chỉnh. Chưa có service `PUT /meal-plan/days` và thao tác chỉnh trực tiếp; người dùng phải nhờ AI cho thay đổi đơn giản.
- **Bằng chứng:** BE `src/meal-plan/meal-plan.controller.ts:157`; Web `features/meal-plan/components/calendar/calendar-board.tsx:294`, `calendar-dish-chip.tsx`, `add-recipe-dialog.tsx`, `move-dish-dialog.tsx`; callback `changeCalendar` trong `meal-planner-view.tsx:375`. Mobile `src/features/meal-plan/components/meal-plan-screen.tsx`, `services/meal-plan.service.ts`.
- **Bổ sung nhỏ nhất:** Thêm nút thêm/gỡ/chuyển bằng sheet phù hợp điện thoại, dùng cùng API và quy tắc khóa ngày. Nối Đã ăn vào API nhật ký hiện có; không cần sao chép thao tác kéo thả của desktop.

### 7. P2 — Lên nhanh không dùng lượt chat AI

- **Trạng thái sau triển khai:** Đã có sheet Các bữa trống/Cả tuần/Hôm nay, chọn bữa, 15/30/60 phút hoặc không giới hạn và ưu tiên món/nguyên liệu. Gọi generate rồi PUT days, chỉ lưu các ô được chọn thực sự thay đổi vì preview BE trả đủ bốn bữa. Có hoàn tác, chặn gửi lặp và phát hiện đề xuất cũ khi ô đã đổi.

- **Web có:** Nút Lên nhanh chọn ngày/bữa, thời gian nấu và món/nguyên liệu ưu tiên; gọi thuật toán chọn món, lưu ngay và có hoàn tác.
- **Mobile thiếu/hậu quả:** Các gợi ý “Bắt đầu nhanh” hiện mở form rồi gửi chat. Chúng không tương đương luồng Lên nhanh trên web.
- **Bằng chứng:** BE `src/meal-plan/meal-plan.controller.ts:142` ghi rõ `/generate` không dùng AI và chưa lưu; lưu bằng `PUT /days`. Web `features/meal-plan/components/quick-generate-dialog.tsx`, `meal-planner-view.tsx:393`, mount tại `:813`. Mobile chưa có caller `/meal-plan/generate` hoặc `/meal-plan/days`.
- **Bổ sung nhỏ nhất:** Một sheet chọn ô, gọi generate rồi save; giữ ảnh chụp dữ liệu trước thay đổi để hoàn tác. **Khác báo cáo cũ:** component này hiện đã được mount và có caller thật trên web, nên không còn nằm trong nhóm “BE có nhưng chưa thấy web dùng”.

### 8. P2 — Kcal và 5 nhóm chất của công thức/thực đơn

- **Web có:** Kcal mỗi suất, nhóm dưỡng chất trên món; tổng ngày/tuần, nhóm còn thiếu, biểu đồ và nút nhờ AI cân đối theo mục tiêu.
- **Mobile thiếu/hậu quả:** Schema công thức và món trong lịch chưa nhận `caloriesPerServing`/`nutritionPillars`; Zod bỏ các trường này nên UI không có dữ liệu để hiện. Người dùng xem lịch nhưng chưa thấy độ cân đối như web.
- **Bằng chứng:** BE `src/meal-plan/dto/meal-plan.dto.ts:301`, `:417`, DTO công thức; Web `features/recipes/components/recipe-card.tsx:128`, `features/meal-plan/components/calendar/recipe-sheet.tsx:206`, `features/meal-plan/components/nutrition/nutrition-companion-bar.tsx`, `features/meal-plan/lib/nutrition.ts`. Mobile `src/features/recipes/types/recipe.schema.ts:15`, `src/features/meal-plan/types/meal-plan.schema.ts:15`.
- **Bổ sung nhỏ nhất:** Nhận các trường tùy chọn, hiện kcal/nhóm chất rồi thêm tổng tuần và nút cân đối. **BMI, mục tiêu kcal, check-in cân nặng và lịch sử cân nặng đã có**, không tính chúng là chưa làm.

### 9. P2 — Sửa nhật ký và nhờ trợ lý xem lại tuần

- **Web có:** Sửa khẩu phần/kcal của mục đã ghi; nút nhận xét tuần tạo ngữ cảnh nhật ký và chuyển sang chat.
- **Mobile thiếu/hậu quả:** Đã có xem/thêm/xóa, kcal ước tính, tổng kết tuần; chưa có PATCH hoặc form sửa. Muốn sửa một con số phải xóa rồi thêm lại, và chưa có điểm chuyển ngữ cảnh tuần sang trợ lý.
- **Bằng chứng:** BE `src/meal-plan/meal-log/meal-log.controller.ts:114`; Web `features/meal-plan/components/meal-log/meal-log-day-view.tsx:286`, `features/meal-plan/components/meal-log/meal-log-sheet.tsx:88`. Mobile `src/features/meal-log/services/meal-log.service.ts:13`, `src/features/meal-log/components/meal-log-screen.tsx` chỉ render nút xóa/thêm và tổng tuần.
- **Bổ sung nhỏ nhất:** Dùng lại form nhập cho chỉnh sửa; thêm nút hỏi trợ lý với ngữ cảnh tuần. Không cần API nhận xét tuần riêng; người dùng vẫn có thể tự hỏi AI bằng lời hoặc chat hiện tại.

### 10. P2 — Xem lại thực đơn tuần cũ

- **Trạng thái sau triển khai:** `planningWeeks` bắt đầu từ `minWeekStart`; thanh tuần dùng Trước/Sau/Về tuần này, nhãn theo tuần thực tế. Tuần/ngày cũ chỉ đọc; mở tuần từ thẻ chat cũ được chấp nhận trong khoảng BE trả về. Form lập thực đơn chỉ chọn tuần hiện tại/tương lai.

- **Web có:** Lùi tuần tới `minWeekStart` và xem ngày cũ ở chế độ chỉ đọc.
- **Mobile thiếu/hậu quả:** Schema đã có `minWeekStart`, nhưng `planningWeeks` chỉ tạo danh sách từ `currentWeekStart`; `changeWeek`/`showSavedWeek` từ chối tuần ngoài danh sách đó. Kể cả thẻ thực đơn đã lưu của cuộc chat cũ cũng có thể không mở được tuần cũ.
- **Bằng chứng:** BE `src/meal-plan/meal-plan.service.ts:243`; Web `features/meal-plan/components/week-nav.tsx:22`; Mobile `src/features/meal-plan/utils/meal-week.ts:15`, `src/features/meal-plan/hooks/meal-planner-provider.tsx:128` và thẻ trong `src/features/meal-plan/components/planner-chat-screen.tsx`.
- **Bổ sung nhỏ nhất:** Tạo tuần từ `minWeekStart`, giữ `editable` của từng ngày để khóa ghi. Nhật ký tuần cũ đã có, đây là lịch thực đơn riêng.

### 11. P1 — Nguồn feed Dành cho bạn và Đang theo dõi

- **Web có:** Dành cho bạn lấy nguồn cá nhân hóa `/posts/feed`; Đang theo dõi lấy `/posts/following` với cursor chung của backend.
- **Mobile thiếu/hậu quả:** Feed chính vẫn gọi `/posts`, chưa có thứ hạng cá nhân hóa. Đang theo dõi lấy danh sách tác giả rồi tối đa 20 bài/tác giả và ghép lại: vừa nhiều request, vừa không tải được các bài xa hơn của một tác giả đã tải.
- **Bằng chứng:** BE `src/posts/posts.controller.ts:117`, `:147`; Web `features/posts/posts-cache.ts:5`, `hooks/use-feed-posts.ts`, mount `features/home/components/feed.tsx:85`. Mobile `src/features/feed/services/feed.service.ts:17`, `src/features/following/services/following.service.ts`, `hooks/use-following-feed.ts:16`.
- **Bổ sung nhỏ nhất:** Giữ `/posts` cho khách/nguồn công khai cần thiết; dùng `/posts/feed` cho tài khoản và thay cách ghép tác giả bằng phân trang `/posts/following`. Giữ UI theo dõi và gợi ý đang có.

### 12. P1 — Bài ngắn POST và nháp POST dùng chung với web

- **Web có:** Composer POST cho bài chữ hoặc đính kèm nhiều video, nháp bền trên server và mở lại theo loại bài.
- **Mobile thiếu/hậu quả:** Composer hiện là video hướng dẫn, bắt buộc tiêu đề/mô tả và một video. `createDraft` luôn tạo `kind: VIDEO`, danh sách nháp lọc bỏ POST nên nháp bài chữ tạo trên web không hiện trên mobile.
- **Bằng chứng:** BE `src/posts/post-drafts.controller.ts`, DTO draft và create-post; Web `features/shared/components/composer.tsx:92`, `features/post-drafts/drafts-view.tsx`. Mobile `src/features/feed/services/compose.service.ts:18`, `:29`, `src/features/feed/hooks/use-compose-actions.ts:46` và `src/features/feed/components/compose-dialog.tsx`.
- **Bổ sung nhỏ nhất:** Thêm chế độ POST, nhận/hiển thị hai loại nháp và dùng lại uploader/draft API. Luồng video, tiến độ upload, retry và nháp VIDEO hiện tại đã có.

### 13. P2 — Upload video mới khi sửa bài đã đăng

- **Web có:** Thêm video mới và retry upload ngay trong hộp sửa bài.
- **Mobile thiếu/hậu quả:** Chỉ sửa chữ, gỡ/đổi thứ tự video đã có; không có chọn file mới. Người dùng không thay video lỗi hoặc bổ sung video bằng màn sửa hiện tại.
- **Bằng chứng:** BE POST `/media/uploads`, PATCH `/posts/:id`; Web `features/posts/components/edit-post-dialog.tsx:165` dùng `useMediaUploads`. Mobile `src/features/posts/components/post-edit-screen.tsx` mô tả rõ chỉ gỡ/đổi thứ tự video hiện có; không có caller picker/uploader trong luồng này.
- **Bổ sung nhỏ nhất:** Nối uploader hiện có vào màn sửa và chỉ gửi các media ID đã sẵn sàng khi lưu. Không liệt kê toàn bộ chức năng sửa bài là chưa làm.

### 14. P2 — Editor Blog: video và tự lưu nháp

- **Web có:** Chọn/upload/chèn video, tiến độ và retry; tự lưu Blog DRAFT/REJECTED sau khi ngừng gõ.
- **Mobile thiếu/hậu quả:** Service Blog mới có upload ảnh, chưa gọi `/blogs/videos/uploads`. Lưu nháp cần bấm nút; có cảnh báo rời màn nhưng chưa có autosave. Đọc được block video có sẵn không thay thế việc chèn video mới.
- **Bằng chứng:** BE `src/posts/blogs/blogs.controller.ts`; Web `features/blogs/editor/use-media-insert.ts:39`, `features/blogs/lib/media-upload.ts:55`, `features/blogs/hooks/use-blog-draft.ts:62` đặt timer 2.500 ms. Mobile `src/features/blogs/services/blogs.service.ts`, `src/features/blogs/hooks/use-blog-image.ts`, `src/features/blogs/components/blog-editor-screen.tsx`.
- **Bổ sung nhỏ nhất:** Dùng lại uploader để chèn block video; thêm autosave có thứ tự cho nháp sau khi sửa hợp đồng bìa ở mục 1. Blog đọc/soạn/sửa, upload ảnh và trợ lý viết bài đã có.

### 15. P2 — Thống kê nội dung của mình

- **Web có:** Chọn khoảng ngày, tổng lượt xem/tim/bình luận/đăng lại/lưu, so kỳ trước, biểu đồ và danh sách bài.
- **Mobile thiếu/hậu quả:** Chưa có route, API hoặc điểm vào thống kê, nên tác giả không xem hiệu quả bài trong app.
- **Bằng chứng:** BE `src/posts/analytics/post-analytics.controller.ts:33`, GET `/analytics/posts` và `/summary`; Web `app/home/analytics/page.tsx`, `features/post-analytics/components/analytics-view.tsx:233`. Không tìm thấy caller các endpoint hoặc module analytics trong `src` mobile.
- **Bổ sung nhỏ nhất:** Bắt đầu bằng khoảng ngày, thẻ tổng và danh sách phân trang; biểu đồ dùng cùng dữ liệu. Ghi nhận lượt xem bài đã có trên mobile.

### 16. P2 — Tìm kiếm tổng hợp: người dùng và món nhà hàng

- **Web có:** Các tab Tất cả/Mọi người/Công thức/Món nhà hàng/Bài viết; kết quả người dùng mở hồ sơ/theo dõi, kết quả món mở quán/menu.
- **Mobile thiếu/hậu quả:** Màn Search chỉ có Bài viết và Công thức, chưa gọi `/profiles/search`. Tìm món menu đã có trong màn Nhà hàng riêng, nhưng chưa xuất hiện trong tìm kiếm chung.
- **Bằng chứng:** BE `src/profiles/profiles.controller.ts:119`, GET `/restaurants/menu/search`; Web `features/posts/components/search-view.tsx:32`, `:53`, `:59`. Mobile `src/features/posts/components/search-screen.tsx` có hai tab, `src/features/profile/services/profile.service.ts` chưa có search profiles; `src/features/restaurants/services/restaurant.service.ts:21` đã có search menu.
- **Bổ sung nhỏ nhất:** Thêm tìm người dùng; dùng lại kết quả menu hiện có để thêm tab món vào Search. Không tạo service tìm nhà hàng/menu trùng với module đã làm.

### 17. P2 — Danh mục công thức theo cấu hình BE

- **Web có:** Chọn danh mục công khai do BE cấu hình, hiện nhãn và lọc công thức bằng `baseTag`.
- **Mobile thiếu/hậu quả:** Chỉ có từ khóa và Phù hợp với tôi; chưa gọi `/recipe-categories`, chưa nhận `tag`. Người dùng không duyệt theo danh mục mà web đã có.
- **Bằng chứng:** BE `src/recipes/recipe-categories.controller.ts`, `dto/recipe-catalog.dto.ts:40`; Web `features/recipes/components/recipe-feed.tsx:37`, `hooks/use-recipe-catalog.ts:121`. Mobile `src/features/recipes/services/recipe.service.ts:9`, `types/recipe.schema.ts`.
- **Bổ sung nhỏ nhất:** Nhận danh mục công khai và `tag`, thêm bộ lọc gọn trên điện thoại. Không cần port màn quản trị danh mục.

### 18. P2 — Thẻ kết quả Planner có thể bấm thao tác

- **Web có:** Kết quả `searchRestaurantDishes` hiện thành thẻ món có giá/quán/đánh giá, cảnh báo cần tránh, mở menu/chỉ đường/Ghi vào Nhật ký. Các cập nhật nhật ký/chỉ số/ghi nhớ cũng có thẻ trạng thái riêng.
- **Mobile thiếu/hậu quả:** Chat đã có nội dung trả lời, trace, câu hỏi, chấp thuận tìm web và thẻ tuần đã lưu; chưa có parser/render các thẻ trên. Khi hỏi món ăn ngoài, người dùng thiếu nút đi tiếp từ kết quả AI dù module nhà hàng và nhật ký đã tồn tại.
- **Bằng chứng:** BE `src/meal-plan/tools/search-restaurant-dishes.tool.ts`; Web `features/meal-plan/components/chat/planner-chat.tsx:388`, `tool-cards/restaurant-dish-cards.tsx`, `status-update-cards.tsx`, callback `meal-planner-view.tsx:765`. Mobile `src/features/meal-plan/components/planner-chat-screen.tsx:120` chỉ render question/web-consent/saved-plan trong footer.
- **Bổ sung nhỏ nhất:** Parse output đã kiểm tra bằng Zod, nối card món tới route nhà hàng và form nhật ký hiện có. Việc BE lưu ghi nhớ/chỉ số và mobile invalidate cache đã có; đây là thiếu hiển thị/thao tác tiếp theo, không phải toàn bộ tool không chạy.

### 19. P2/P3 — Voice chưa đủ bảng điều khiển và tùy chỉnh như web

- **Trạng thái sau triển khai:** Đã nối bảng Đi chợ và snapshot `shoppingDays`/`shoppingPeople`/`shoppingCheckedCount`, điều khiển tick theo tên có/không dấu và mở công thức ngay trong cuộc gọi. Các tab dinh dưỡng weekly/dietary, meter và DeepFilterNet vẫn là phần còn lại; chưa xác nhận audio trên thiết bị thật.

- **Web có:** AI mở/điều khiển Đi chợ và các tab dinh dưỡng weekly/bmi/dietary; có mức âm thanh mic và công tắc lọc nhiễu AI DeepFilterNet3.
- **Mobile thiếu/hậu quả:** Hook cố ý chặn shoppingList và bodyMetrics khác bmi, chưa đưa ngữ cảnh các bảng đó vào snapshot. Chưa có meter hoặc DeepFilterNet; đang dùng DSP trình duyệt và noise gate của mobile. Nói “mở bảng dinh dưỡng tuần” hoặc “mở đi chợ” chưa thao tác được như web.
- **Bằng chứng:** BE `src/meal-plan/tools/voice-screen.tools.ts`; Web `features/meal-plan/components/meal-planner-view.tsx:304`, `features/meal-plan/components/nutrition/nutrition-companion-bar.tsx`, `features/meal-plan/components/voice/voice-panel.tsx:120`. Mobile `src/features/meal-plan/hooks/use-meal-planner-voice.ts:45`, `src/features/meal-plan/types/voice.schema.ts`, `src/features/meal-plan/utils/voice-audio-html.ts`, `src/features/meal-plan/utils/voice-noise-gate.ts`.
- **Bổ sung nhỏ nhất:** Sau mục 5/8, nối các bảng đó vào Voice và snapshot, bỏ nhánh chưa hỗ trợ tương ứng. Meter/lọc nhiễu AI làm sau và phải đo trên thiết bị. Đây là giới hạn đã có comment `shortcut`, không coi là lỗi mới. Prompt, mic liên tục, ngắt lời, Gateway/Planner, điều hướng công thức/ngày, cuộn và highlight đã được triển khai; chất lượng audio thật vẫn cần nghiệm thu.

### 20. P3 — Chọn Sáng/Tối/Hệ thống trong app

- **Web có:** Người dùng chọn và lưu giao diện riêng.
- **Mobile thiếu/hậu quả:** Theme theo hệ điều hành; chưa có lựa chọn riêng cho ứng dụng.
- **Bằng chứng:** Web `components/theme-switcher.tsx`, được dùng trong `features/shared/components/mobile-nav.tsx`, `left-nav.tsx`. Mobile `src/components/vedora-theme-provider.tsx:7`, `src/hooks/use-color-scheme.ts` và bản web của hook.
- **Bổ sung nhỏ nhất:** Một lựa chọn lưu cục bộ và dùng chung cho provider/navigation, không cần BE.

## C. BE có nhưng chưa đủ cơ sở gọi là phần mobile còn thiếu so với web

| Mục | Kết luận tại source hiện tại |
| --- | --- |
| Sao chép tuần | BE `POST /meal-plan/copy` đang bật. Chưa tìm thấy caller/màn sao chép tuần riêng trong web/mobile; không trộn với QuickGenerate hoặc chat tạo/lưu thực đơn. |
| Xem trước thay đổi trước khi lưu | BE `POST /meal-plan/preview` đang bật; chưa thấy caller UI riêng hai client. Web chỉnh lịch/generate có dùng PUT days, nên chỉ phần preview riêng nằm ở nhóm này. |
| Tóm tắt AI bài viết riêng | BE `GET /posts/:postId/summary` đang bật, trả trạng thái/tóm tắt/công thức nháp. Chưa thấy caller riêng trong hai client. Không nhầm với bình luận AI, rating summary hay analytics summary. |
| Đổi tên hội thoại | BE PATCH thread hỗ trợ title. Hai client có lịch sử và xóa hội thoại; chưa tìm thấy thao tác đổi tên trong UI web/mobile. Mobile PATCH thread hiện còn phục vụ câu trả lời tool, không chứng minh đã có đổi tên. |
| Lọc công thức theo số phút | BE catalog hỗ trợ `maxMinutes`; mobile chưa gửi. Web có maxMinutes trong luồng lập thực đơn, nhưng chưa thấy bộ lọc thời gian ở catalog công khai. Không coi catalog này là parity đã hoàn thành ở web. |
| Runtime public-config | **Không phải API sẵn dùng:** controller có `@UseGuards(DisabledEndpointGuard)` và bị ẩn khỏi Swagger; guard trả 404. Không đề nghị mobile nối API này. Điều này chỉnh lại cách diễn đạt của báo cáo 27/11. |

Không đưa dashboard/admin, kiểm duyệt, quản trị kiến thức/công thức, quản trị thanh toán, logs, webhook, health hoặc SEO/server rendering của Next.js vào checklist mobile thành viên. Xóa tài khoản cũng đang bị BE chặn bằng `DisabledEndpointGuard`, không phải tính năng sẵn sàng chỉ cần thêm nút.

## D. Những phần đã có — không tiếp tục báo thiếu toàn bộ

- Nhà hàng: danh sách, bản đồ/vị trí, tìm món menu, detail, menu và đọc/viết/sửa/xóa đánh giá.
- Trang nhà hàng: đăng ký/gửi lại hồ sơ, giấy tờ, quản lý thông tin/menu/thành viên, đổi danh tính cá nhân/Trang, ảnh đại diện và bìa. Phần còn thiếu mới xác nhận là thông báo kết quả ở mục 2, không phải cả module quản lý.
- Voice: phiên gọi/Gateway, prompt và lời chào đồng bộ web, audio thu/phát đồng thời bằng tài liệu Web Audio cục bộ trong Expo Go, ngắt lời, mute, kết thúc/gọi lại, snapshot UI, cuộn và highlight thay đổi đã lưu. Chưa xác nhận audio thật trên máy.
- Chat Planner: hỏi đáp, lập/sửa/lưu thực đơn qua tool, hỏi chọn lựa, chấp thuận tìm web, lịch sử, rewind và ghi nhớ. BE mới nhất hỏi quyền tìm web bằng lời trong Voice và làm phía server; không có căn cứ báo mobile thiếu một endpoint xin quyền Voice riêng.
- Công thức: catalog/tìm từ khóa, Phù hợp với tôi, detail, ảnh, lưu/yêu thích và đánh giá.
- Hồ sơ/theo dõi/gợi ý, avatar/bìa, username; bình luận/reply/sửa/xóa/report; bài đã lưu/đăng lại, sửa/xóa và trạng thái kiểm duyệt bài.
- Blog đọc/soạn/sửa, chèn ảnh và trợ lý viết; billing/gói/QR/trạng thái thanh toán realtime; nhắn tin friends/requests và chia sẻ bài; thông báo realtime; xác minh chuyên gia; hỗ trợ/khiếu nại/ảnh minh chứng.
- Ghi nhớ dị ứng/sở thích, BMI/mục tiêu kcal/check-in/lịch sử cân nặng; nhật ký thêm/xóa/món ăn ngoài/ước tính kcal và tổng kết.

Google OAuth đã có source tích hợp, nhưng `src/features/auth/services/google-auth.service.ts:19` chủ động chặn Expo Go (`StoreClient`) và bản web của mobile. Đây là giới hạn của luồng OAuth hiện tại trong yêu cầu **chỉ Expo Go**, không phải chưa viết đăng nhập Google. Báo cáo này không yêu cầu tạo development build.

## E. Thứ tự làm đề nghị

1. Hoàn thiện kết quả lưu/thông báo: 1, 2, 3, 4.
2. Thực đơn sử dụng hằng ngày còn: Đã ăn trực tiếp của 6, dinh dưỡng của 8, sửa/nhận xét nhật ký của 9 và tab dinh dưỡng Voice của 19. Các mục 5, 7, 10 và chỉnh món chính của 6 đã có code; nghiệm thu thiết bị theo PLAN.
3. Nội dung và khám phá: 11, 12, 16, 17, 18.
4. Hoàn thiện tác giả: 13, 14, 15; meter/lọc nhiễu AI của 19 và theme 20 làm sau.

## F. Checklist đối chiếu UI từng bước — chưa thực hiện trên thiết bị

1. Đăng nhập cùng tài khoản trên web/mobile. Tạo Blog có ảnh đầu B; thử chọn bìa A, đổi/gỡ, lưu và mở lại. So ảnh bìa với ảnh đầu nội dung; thử upload video và chờ tự lưu nháp trên web, tìm thao tác tương ứng trên mobile.
2. Với chủ Trang có kết quả duyệt/từ chối từ môi trường test, mở Thông báo; đọc tên trạng thái, lý do và chạm để mở đúng Trang/gửi lại hồ sơ. Không dùng dữ liệu thật để tạo thao tác duyệt giả.
3. Dùng tài khoản test có unread ngoài 50 hội thoại đầu/ngăn; so badge, đọc tin rồi so lại. Dùng tài khoản test bị đình chỉ/chưa ACTIVE, nhập đúng mật khẩu và đối chiếu lời báo lỗi login.
4. Lưu thực đơn có món lặp giữa các ngày. Trên web mở Đi chợ, đổi ngày/số người, tick, sao chép và mở công thức; đối chiếu điểm vào mobile.
5. Trên web thêm/gỡ/chuyển một món bằng UI lịch, đánh dấu Đã ăn rồi kiểm tra nhật ký; thử ngày cũ bị khóa. Đối chiếu mobile hiện phải dùng AI hoặc vào nhật ký riêng.
6. Dùng Lên nhanh trên web với một vài ô trống, lưu rồi hoàn tác; đối chiếu nút Bắt đầu nhanh của mobile đang mở form chat.
7. Mở cùng công thức/lịch trên hai client; so kcal/suất, 5 nhóm chất, tổng tuần và nút cân đối. Kiểm tra mobile vẫn giữ BMI/check-in đã làm.
8. Trong nhật ký, sửa khẩu phần/kcal và nhờ AI nhận xét tuần trên web; đối chiếu mobile. Lùi về tuần có thực đơn đã lưu cũ và thử mở lại từ lịch sử chat.
9. Đối chiếu Dành cho bạn/Đang theo dõi với nhiều tác giả và nhiều trang. Tạo bài chữ/nhiều video, lưu nháp POST trên web, tìm/mở tiếp trên mobile. Thử thêm video mới trong màn sửa bài.
10. Tìm cùng tên người, món nhà hàng và danh mục công thức trên hai client. Hỏi AI tìm món nhà hàng; kiểm tra thẻ kết quả, mở menu/chỉ đường/Ghi vào Nhật ký và cảnh báo cần tránh.
11. Mở Thống kê với hai khoảng ngày trên web, đối chiếu điểm vào mobile. Đổi Sáng/Tối/Hệ thống và mở lại app để so lựa chọn riêng với theme hệ thống.
12. Trong Voice, nói mở Đi chợ/bảng dinh dưỡng tuần/ghi nhớ; so màn thực sự mở và snapshot. Trên điện thoại kiểm tra mic/quyền/loa/ngắt lời; trên web mở Micro và lọc nhiễu, xem meter và bật/tắt DeepFilterNet.

Người thực hiện: Codex. Chỉ thêm báo cáo và cập nhật tài liệu kế hoạch, không sửa source ứng dụng hoặc BE/web, không commit/push.

**Kiểm tra đã chạy:** TypeScript và Expo lint mobile đều đạt. Assert đọc trực tiếp schema/helper xác nhận mất workspaceId và nhánh lời thông báo chung. Không thêm kiểm thử chỉ để sao chép implementation; không export/build lại vì task không đổi source/config chạy app.

**Chưa kiểm tra:** Không chạy BE/DB/Qdrant, test suite của BE/web, API có tài khoản thật, thanh toán thật, đo tải hoặc UI trên thiết bị. Không nghiệm thu mic/khử vọng/quyền WebView trên iOS/Android. Các mục trên được xác nhận ở mức source và caller; mức độ ảnh hưởng production chưa được đo.
