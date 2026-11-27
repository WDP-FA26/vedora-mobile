# Rà soát lại backend và mobile — 19/11/2026

Người thực hiện: Codex. Phạm vi là backend Vedora và FE mobile trong workspace này, không bao gồm web/Admin UI. Đây là rà soát source/hợp đồng và kiểm thử local, chưa phải nghiệm thu hệ thống chạy thật. Giả định ứng dụng có nhiều người dùng và một tài khoản có thể đăng nhập trên hai thiết bị.

- Backend main: `98b41304f69d446b67c6054a2d7555130bdb80be`.
- Mobile local: `009f50ac607ccd3b6a8046e251568613315f547a`. Mobile main đã merge PR #41; API compare với local trả `files: []`, không có khác biệt nội dung file tại thời điểm kiểm tra.
- Đọc lại các luồng Blog/đăng video, phiên đăng nhập, thực đơn/nháp/lưu, công thức/đánh giá, cùng các hợp đồng kiểm duyệt, mua sắm, đình chỉ tài khoản và cấu hình. Đối chiếu báo cáo SRS trước; không đọc lại toàn bộ PDF trong lần này, không chứng nhận toàn bộ AC.
- Không sửa source ứng dụng trong lần rà soát này.

## Những phần không còn tính là chưa làm

Đã có source cho trả lời bình luận, xóa bài/Blog có xác nhận, chia sẻ bài qua tin nhắn, đặt nút lưu trên ảnh, hiện/ẩn mật khẩu, xác minh chuyên gia và tích xanh ở các bề mặt có metadata, lập thực đơn tuần sau, chặn lưu nháp cũ trong cùng UI, cảnh báo nguyên liệu cần tránh trên món và chấm/đổi/gỡ đánh giá sao. PR #41 đánh giá công thức đã merge vào main. Những phần này vẫn cần kiểm thử tích hợp trên tài khoản/thiết bị thật.

## Cần sửa trước

### 1. Blog đăng thành công ở server nhưng mobile báo lưu lỗi — P1, FE

- **Tình huống:** Chọn Xuất bản Blog. Backend chuyển `PUBLISHED` yêu cầu thành `PROCESSING`, còn `blogSchema` chỉ nhận DRAFT/PUBLISHED. Response không qua Zod, editor đi vào nhánh lỗi trước khi nhận ID/kết quả mới; gửi lại Blog mới có thể tạo thêm bản.
- **Bằng chứng:** `src/features/blogs/types/blogs.schema.ts:6`; `src/features/blogs/components/blog-editor-screen.tsx:76`; [Blog service](https://github.com/WDP-FA26/vedora-api/blob/98b41304f69d446b67c6054a2d7555130bdb80be/src/posts/blogs/blogs.service.ts#L43). Feed cũng thiếu PENDING_REVIEW/REJECTED; response tạo bài thiếu hai trạng thái đó. Một item không hợp lệ có thể làm cả trang danh sách lỗi.
- **Sửa nhỏ nhất:** Tách trạng thái input khỏi response, nhận đủ trạng thái backend; hiện đang xử lý/chờ duyệt/bị từ chối và lý do, theo dõi kết quả xử lý. Input tạo Blog vẫn chỉ gửi DRAFT/PUBLISHED.
- **Nếu bỏ qua:** Người dùng tưởng mất bài; danh sách Blog của tôi hoặc bài từ thông báo có thể không tải được.

### 2. Tự refresh token làm remount toàn bộ tab và mất trạng thái đang nhập — P1, FE

- **Tình huống:** Đang nhập form hoặc mở nháp thực đơn, app làm mới access token. `MealPlannerProvider key={token ?? 'guest'}` bao ngoài Tabs nên key đổi; React tạo lại provider và cây con. Draft/form/tuần đang chọn trong bộ nhớ bị reset, dù vẫn là cùng tài khoản.
- **Bằng chứng:** `src/app/(tabs)/_layout.tsx:38`; refresh ghi token mới tại `src/shared/session/session-manager.ts:78`; local state nằm trong `meal-planner-provider.tsx`.
- **Sửa nhỏ nhất:** Phân biệt đổi tài khoản/đăng xuất với xoay token, dùng định danh phiên đăng nhập ổn định cho key. Chỉ reset dữ liệu riêng khi đổi chủ phiên.
- **Nếu bỏ qua:** Nháp có thể biến mất hoặc quay lại lịch sử cũ khi app trở về foreground/token hết hạn. Chưa tái hiện trên thiết bị thật.

### 3. Chọn ảnh bìa riêng nhưng backend không lưu ảnh đó — P1, hợp đồng BE/FE

- **Tình huống:** Thêm ảnh bìa A, nội dung không có ảnh hoặc ảnh đầu tiên là B, rồi lưu DRAFT. Mobile chỉ set `cover`, gửi `coverImageUrl`; backend bỏ giá trị bìa gửi lên và lấy ảnh đầu trong nội dung. Bìa sẽ thành null hoặc B.
- **Bằng chứng:** `blog-editor-screen.tsx:107` chỉ `setCover(url)`; [DTO ghi trường này bị bỏ qua](https://github.com/WDP-FA26/vedora-api/blob/98b41304f69d446b67c6054a2d7555130bdb80be/src/posts/dto/blog.dto.ts#L45); [service lấy coverOf(content)](https://github.com/WDP-FA26/vedora-api/blob/98b41304f69d446b67c6054a2d7555130bdb80be/src/posts/blogs/blogs.service.ts#L64).
- **Sửa nhỏ nhất:** Theo hợp đồng hiện tại, chọn bìa phải chèn/đưa ảnh lên đầu nội dung hoặc bỏ điều khiển bìa độc lập và giải thích quy tắc. Nếu muốn bìa độc lập thì cần đổi BE trước.
- **Nếu bỏ qua:** Ảnh upload được nhưng bìa mất/đổi sau lưu, nút Gỡ bìa cũng không phản ánh bìa còn trong nội dung.

### 4. Hai thiết bị có thể ghi đè thực đơn của nhau — P1, BE và FE

- **Tình huống:** Hai thiết bị cùng đọc A. Thiết bị 1 lưu B; thiết bị 2 gửi dữ liệu xây từ A sau đó. Backend chỉ nhận weekStart/days; khóa user tuần tự hóa thao tác nhưng không kiểm tra phiên bản đã đọc. Bản ghi sau có thể thay B.
- **Bằng chứng:** [SaveMealDaysDto](https://github.com/WDP-FA26/vedora-api/blob/98b41304f69d446b67c6054a2d7555130bdb80be/src/meal-plan/dto/meal-plan.dto.ts#L76); [apply: preview trước transaction và delete/insert trong transaction](https://github.com/WDP-FA26/vedora-api/blob/98b41304f69d446b67c6054a2d7555130bdb80be/src/meal-plan/meal-plan.service.ts#L638). Mobile GET rồi so `previous` trước PUT chỉ thu hẹp khoảng đua, không loại bỏ nó.
- **Sửa nhỏ nhất:** BE nhận expectedVersion/expectedPrevious, so sánh cùng transaction trước ghi; FE gửi giá trị và xử lý 409. Cơ chế chặn proposal cũ trong một UI hiện đã có, không thay thế kiểm tra này.
- **Nếu bỏ qua:** Mất thay đổi mới trên thiết bị còn lại. Đây là suy luận từ hợp đồng/source, chưa chạy hai client với DB thật.

### 5. Job đăng video nền không gắn chủ phiên — P1, FE

- **Tình huống:** A đăng video lỗi/chưa xong rồi đăng xuất; B đăng nhập cùng app. Zustand video store nằm ngoài cây tab, `clearSession` không dọn store này. Banner vẫn đọc job/title của A và có thể cho B bấm thử lại tác vụ A.
- **Bằng chứng:** `src/features/feed/stores/video-publish-store.ts:30`; `video-publish-banner.tsx:47`; `use-compose-actions.ts:119`; `session-manager.ts:50`. Tìm toàn source không thấy subscriber dọn job khi đổi chủ phiên.
- **Sửa nhỏ nhất:** Gắn job với chủ phiên ổn định, chặn kết quả/thử lại khi chủ phiên khác và hủy/dọn tác vụ khi logout. Không dùng token xoay định kỳ làm định danh chủ tài khoản.
- **Nếu bỏ qua:** Lộ tiêu đề nháp và thao tác retry nhầm phiên. Chưa kết luận BE cho phép gắn media của A vào bài B; quyền media phía server vẫn cần được giữ.

## Backend đã có nhưng mobile còn thiếu

### 6. Danh sách mua sắm — P1, FE

- **Tình huống:** Có thực đơn đã lưu nhưng không có nút/màn tổng hợp nguyên liệu.
- **Bằng chứng:** BE có `GET /meal-plan/shopping-list?weekStart=...&days=...`; chưa tìm thấy service/schema/route/UI tương ứng trong toàn `src`. [Hợp đồng](https://github.com/WDP-FA26/vedora-api/blob/98b41304f69d446b67c6054a2d7555130bdb80be/docs/docs-for-FE/meal-plan-shopping-list.md).
- **Sửa nhỏ nhất:** Mở từ tuần đang xem, chọn ngày; dùng tổng từ BE, giữ riêng đơn vị/phần chưa định lượng/nguồn món. Chỉ tính thực đơn đã lưu và các ngày từ hôm nay.
- **Nếu bỏ qua:** Thiếu luồng mua nguyên liệu dù API đã sẵn; không tự nhân lượng theo số người.

### 7. Bài ngắn chỉ chữ hoặc nhiều video — P2, FE

- **Tình huống:** Muốn đăng chỉ chữ hoặc chọn 2–4 video: composer hiện chỉ có Blog và một video hướng dẫn. Nội dung hợp lệ trên BE vượt 280 ký tự cũng bị mobile chặn.
- **Bằng chứng:** `compose.schema.ts:3,25`; `use-compose-actions.ts:83` không cho chọn nhiều. BE CreatePostDto cho body tùy chọn, mediaIds và giới hạn runtime riêng.
- **Sửa nhỏ nhất:** Bổ sung bài ngắn, chữ hoặc video; nhận giới hạn cấu hình BE thay vì 280 ký tự. Giữ kiểm tra không rỗng cả chữ và media.
- **Nếu bỏ qua:** Một phần khả năng đăng bài BE đã có không dùng được trên mobile.

### 8. Upload video trong Blog — P2, FE

- **Tình huống:** Muốn chèn video vào Blog nhưng editor chỉ có luồng thêm ảnh; renderer phát video sẵn có không thay thế luồng upload.
- **Bằng chứng:** BE `POST /blogs/videos/uploads`; service mobile chỉ có `/blogs/images/uploads`.
- **Sửa nhỏ nhất:** Thêm chọn/upload video và chèn vào nội dung theo hợp đồng, có tiến trình/lỗi/hủy.
- **Nếu bỏ qua:** Người viết mobile không tạo được Blog có video dù backend hỗ trợ.

### 9. Ghi nhận lượt xem — P2, FE

- **Tình huống:** Cuộn feed/xem bài nhưng mobile chỉ đọc viewCount, không gửi sự kiện đã xem.
- **Bằng chứng:** [POST /posts/views](https://github.com/WDP-FA26/vedora-api/blob/98b41304f69d446b67c6054a2d7555130bdb80be/src/posts/posts.controller.ts#L66); không tìm thấy `/posts/views` hoặc tracker tương đương trong mobile.
- **Sửa nhỏ nhất:** Ghi khi bài hiện ít nhất nửa màn trong một giây, gom batch theo hướng dẫn BE; không cộng mỗi render.
- **Nếu bỏ qua:** Lượt xem từ mobile không được đóng góp qua API này.

### 10. Cấu hình giới hạn từ backend — P2, FE

- **Tình huống:** BE đổi giới hạn OTP/bài/ảnh/minh chứng qua env, mobile vẫn kiểm tra hằng số cũ.
- **Bằng chứng:** BE `GET /public-config`; chưa có caller trong mobile. [Hợp đồng](https://github.com/WDP-FA26/vedora-api/blob/98b41304f69d446b67c6054a2d7555130bdb80be/docs/docs-for-FE/runtime-config.md).
- **Sửa nhỏ nhất:** Đọc/cache public-config, xây validation phù hợp; thời hạn đơn và quyền lợi gói cũ vẫn lấy từ từng response tương ứng.
- **Nếu bỏ qua:** Có thể chặn input hợp lệ hoặc cho gửi dữ liệu BE từ chối khi vận hành đổi cấu hình; không khẳng định mọi mặc định hiện tại đều sai.

### 11. Sao chép thực đơn giữa tuần — P3, FE, mở rộng tùy chọn

- **Tình huống:** Muốn dùng lại tuần cũ cho tuần mới nhưng mobile không có thao tác sao chép.
- **Bằng chứng:** BE `POST /meal-plan/copy` có fromWeekStart/toWeekStart/overwrite; chưa có caller trong mobile.
- **Sửa nhỏ nhất:** Thêm thao tác sao chép với chọn tuần đích và xác nhận ghi đè nếu đưa tính năng này vào phạm vi.
- **Nếu bỏ qua:** API sẵn chưa được khai thác; không tính riêng nó là lỗi hay yêu cầu SRS bắt buộc.

## Cần hoàn thiện thêm

### 12. Không mở được tuần thực đơn đã qua — P2, FE

- **Tình huống:** BE trả minWeekStart là tuần cũ có dữ liệu nhưng selector chỉ dựng từ currentWeekStart đến maxWeekStart. Ngày cũ trong tuần hiện tại xem được; tuần trước không chọn được.
- **Bằng chứng:** `src/features/meal-plan/utils/meal-week.ts:18`; backend toPlan/minWeekStart đã có. Chạy hàm thật với min 09/11, current 16/11: kết quả bắt đầu 16/11.
- **Sửa nhỏ nhất:** Dựng danh sách từ minWeekStart và giữ quá khứ chỉ đọc.
- **Nếu bỏ qua:** Lịch đã lưu tuần trước không truy cập được qua selector mobile.

### 13. Tài khoản bị khóa bị báo sai thành sai mật khẩu — P2, FE

- **Tình huống:** Login nhận 401 ACCOUNT_SUSPENDED nhưng `authErrorMessage` trả thông báo tên đăng nhập/mật khẩu không đúng.
- **Bằng chứng:** `src/features/auth/utils/auth-errors.ts:10`; BE account-access có ACCOUNT_SUSPENDED/ACCOUNT_NOT_ACTIVE. Refresh chung có cơ chế clearSession khi refresh 401, nên không kết luận có vòng lặp refresh vô hạn hoặc vượt quyền.
- **Sửa nhỏ nhất:** Ưu tiên code đình chỉ trước lỗi 401 chung; hiển thị lý do phù hợp khi phiên bị đóng.
- **Nếu bỏ qua:** Người dùng thử đổi/đặt lại mật khẩu thay vì biết tài khoản đang bị khóa.

### 14. Form thực đơn và cảnh báo rời nháp còn hạn chế — P2, FE

- **Tình huống:** Form chỉ chọn 1–5/6+ người và 15/30/45/60 phút; không nhập chính xác 20 người hoặc 240 phút. Không thấy cảnh báo rời luồng có nháp.
- **Bằng chứng:** `meal-request-form.tsx:19,20`; tìm toàn feature không thấy usePreventRemove/beforeRemove/BackHandler tương đương. Có xem lại nội dung nhưng nút chính vẫn gọi gửi AI từ form.
- **Sửa nhỏ nhất:** Theo phạm vi SRS đã đối chiếu trước, thêm nhập số trong khoảng và bước xem lại/gửi rõ ràng; cảnh báo khi thực sự bỏ nháp, tránh hỏi khi chuyển hai tab dùng chung nháp.
- **Nếu bỏ qua:** Form không biểu đạt đầy đủ nhu cầu đã đặc tả; người dùng có thể rời và mất trạng thái mà không được nhắc. Chat tự do vẫn có thể diễn đạt nhiều yêu cầu hơn form.

### 15. Tích xanh tác giả công thức thiếu metadata BE — P3, BE

- **Tình huống:** Tác giả là chuyên gia nhưng tên trong liên kết tác giả của công thức không có tích xanh như feed.
- **Bằng chứng:** RecipePostAuthorDto hiện chỉ có username/fullName; không có ID/isProfessional. Đây là giới hạn đã nêu khi triển khai huy hiệu, không phải bỏ sót thêm icon tại FE.
- **Sửa nhỏ nhất:** BE trả ID/isProfessional cùng tác giả; FE dùng ProfessionalName chung, không gọi hồ sơ cho từng thẻ.
- **Nếu bỏ qua:** Tích xanh chưa thể đồng bộ hoàn toàn ở bề mặt công thức theo dữ liệu server.

### 16. Hai kiểm thử cũ chưa cập nhật — P2, kiểm thử

- **Tình huống:** Chạy toàn bộ 66 test: 64 đạt, 2 lỗi. Billing fixture thiếu planVersion/freeLimits/textLimit/imageLimit; test favorite còn mong /recipes trong khi route đã chuyển /explore.
- **Bằng chứng:** `tests/billing.test.mjs:20`, `tests/recipe-favorite.test.mjs:41` và `auth/utils/return-to.ts`.
- **Sửa nhỏ nhất:** Đối chiếu hợp đồng rồi cập nhật fixture/kỳ vọng route; không bỏ validation thật chỉ để test xanh.
- **Nếu bỏ qua:** Bộ regression luôn đỏ, dễ bỏ qua lỗi mới. Riêng hai lỗi này chưa chứng minh billing thực tế đang hỏng.

## Điểm backend cần xác minh riêng

- Video Blog 100 MB: code cấp chữ ký hiện không nhận sizeBytes và chỉ ký public_id/asset_folder. Tài liệu cũng gọi cap này là frontend-only. Cần kiểm tra Cloudinary thực tế và thử vượt giới hạn trong môi trường test; chưa kết luận provider chắc chắn nhận tệp vượt mức.
- Nhắn tin sau chấp nhận lời mời so với quy tắc follow trong PDF là khác biệt nghiệp vụ đã ghi ở báo cáo cũ; không gắn nhãn thiếu FE khi mobile đã có chấp nhận lời mời/chia sẻ bài. Cần chốt đặc tả nghiệm thu nếu dùng PDF cũ.
- Commit BE mới nhất đổi cách lấy khung hình kiểm duyệt video theo khoảng thời gian. Đây là logic server, không tự tạo yêu cầu thêm màn hình mobile; vẫn cần kiểm tra xử lý lâu/lỗi trên thiết bị thật.

## Kiểm tra đã thực hiện và giới hạn

- Lint và TypeScript mobile đạt. Bản sao BE tạm ban đầu bị TypeScript quét chung; đã đổi phần tham chiếu sang .txt, chạy lại TypeScript đạt. Đây không phải lỗi build source mobile.
- Node test suite: 66 test, 64 đạt, 2 lỗi nêu ở mục 16.
- Thử trực tiếp schema: Blog PROCESSING, feed REJECTED và created post PENDING_REVIEW đều bị từ chối. Thử planningWeeks xác nhận tuần cũ bị bỏ.
- Chưa chạy backend/DB/Cloudinary/AI/SePay thật, chưa thử trên Android/iOS, chưa kiểm thử song song hai thiết bị và chưa đo tải/hiệu năng. Chưa audit sâu toàn bộ auth, billing, SSE, web/Admin UI hoặc mọi route BE. Không đưa tỷ lệ hoàn thành hay khẳng định an toàn toàn hệ thống.

## Thứ tự làm đề nghị

Sửa 1–5 trước (trạng thái Blog/feed, reset phiên, bìa, chống ghi đè BE, job nền khác tài khoản). Sau đó làm danh sách mua sắm, lượt xem, trình bài ngắn và video Blog; sửa xem tuần cũ và thông báo đình chỉ; cuối cùng đồng bộ config/các tùy chọn mở rộng. Cập nhật hai test lỗi song song để regression có giá trị.

## Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện)

1. Tạo Blog mới → chọn bìa A, không chèn ảnh hoặc chèn ảnh B trước → lưu nháp → mở lại để đối chiếu bìa; xuất bản và theo dõi PROCESSING/chờ duyệt/từ chối.
2. Đang nhập form thực đơn/mở nháp → để token gần hết hạn rồi đưa app ra nền/vào lại → kiểm tra form, chat, tuần và nháp không bị reset ngoài ý muốn.
3. A bắt đầu đăng video, tạo tình huống upload lỗi → đăng xuất → B đăng nhập → kiểm tra banner/tiêu đề/nút thử lại của A không còn.
4. Cùng tài khoản trên hai thiết bị: cùng mở một ngày A → thiết bị 1 lưu B → thiết bị 2 lưu payload cũ → phải báo xung đột thay vì ghi đè.
5. Lưu món ở tuần trước → sang tuần mới → mở selector tìm tuần trước, kiểm tra chỉ đọc; chọn tuần sau vẫn cho lập/lưu riêng.
6. Mở thực đơn đã lưu → tìm danh sách mua sắm và lọc ngày; kiểm tra phần chưa định lượng, đơn vị và nguồn món sau khi triển khai.
7. Tạo bài chỉ chữ/2–4 video; Blog chèn video; mở feed/xem bài rồi đối chiếu lượt xem bằng tài khoản khác sau vài giây.
8. Tài khoản bị khóa thử login và dùng phiên cũ; kiểm tra thông báo chính xác và cache riêng được dọn, guest vẫn dùng nội dung public.
9. Hồi quy các phần vừa làm: bình luận/phản hồi, xóa bài có hủy/xác nhận, chia sẻ chat, tích xanh, cảnh báo nguyên liệu và chấm/đổi/gỡ sao.
