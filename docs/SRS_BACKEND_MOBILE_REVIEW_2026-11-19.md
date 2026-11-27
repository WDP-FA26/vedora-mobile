# Đối chiếu SRS, backend và mobile — 19/11/2026

Người thực hiện: Codex. Đây là rà soát source và hợp đồng API, chưa phải nghiệm thu chạy thực tế.

- SRS: `C:\Users\DELL\Downloads\Vedora_SRS_v1.1.pdf`, 67 trang. Yêu cầu chính tại mục 4–7, trang 7–22; Phụ lục B từ trang 23 quy định ưu tiên mục 4–7 nếu sơ đồ khác nội dung.
- Backend: [vedora-api tại f6bf6fbe](https://github.com/WDP-FA26/vedora-api/tree/f6bf6fbe0e515175d8d133278fe5b4b19f1728c6), bản main được clone trong lần rà soát này. Không coi tài liệu FE cũ là bằng chứng thay cho source hiện tại.
- Mobile: `a205612`, branch `feat/expert-verification`, nền main `09f799b`; đã có tính năng chuyên gia vừa push.
- Phạm vi: xác định việc mobile còn thiếu so với nghiệp vụ Guest/Member, đồng thời nêu khoảng trống/hợp đồng cần xử lý phía backend. SRS trang 22 loại native mobile khỏi phạm vi gốc; không mặc nhiên yêu cầu mobile phải có màn Admin.

## Kết luận

Mobile vẫn còn thiếu luồng và có chỗ chưa khớp hợp đồng API. Backend đã có API cho phần lớn chức năng còn thiếu trên mobile, đặc biệt đánh giá sao, danh sách mua sắm, xóa nội dung và tải video Blog. Chưa thể kết luận backend hoặc hệ thống đạt toàn bộ SRS chỉ bằng việc có endpoint.

Thông báo hệ thống và xác minh chuyên gia **đã có triển khai**, không còn là mục chưa làm như báo cáo cũ. Cần kiểm thử trên tài khoản/thiết bị thật.

## Việc mobile còn thiếu hoặc cần sửa

| Ưu tiên | Yêu cầu | Backend hiện có | Mobile hiện tại và việc còn lại |
|---|---|---|---|
| P1 | UC-05/06, mục 5.5: trạng thái xử lý/kiểm duyệt | `PROCESSING`, `PENDING_REVIEW`, `REJECTED`, `PUBLISHED`; có lý do và thông báo | `blogs.schema.ts` chỉ nhận DRAFT/PUBLISHED; `feed.schema.ts` thiếu PENDING_REVIEW/REJECTED; `compose.schema.ts` cũng thiếu hai trạng thái này. Cần tách kiểu input/response Blog, nhận đủ trạng thái, hiện lý do và poll kết quả xử lý. Đây là lệch hợp đồng gây lỗi thực tế khi dữ liệu hợp lệ từ API không qua Zod. |
| P1 | UC-25: danh sách mua sắm | `GET /meal-plan/shopping-list?days=MON,TUE`, có lượng đã biết, lượng chưa xác định, đơn vị và nguồn món/ngày/bữa | Chưa tìm thấy service/schema/route/UI mua sắm. Cần nút từ thực đơn đã lưu, chọn ngày, tổng nguyên liệu và mở nguồn đóng góp; không lấy nháp hoặc tự nhân số người. |
| P1 | UC-07: đánh giá công thức 1–5 sao | Public summary; GET/PUT/DELETE `/recipes/:id/rating` | Đã có lưu công thức, chưa có chấm/đổi/gỡ sao và điểm tổng hợp. Cần phân biệt chưa đánh giá với 0 sao, không cập nhật UI thành công nếu API lỗi. |
| P1 | UC-05: bài ngắn chữ và/hoặc tối đa 4 video | `POST /posts`, mặc định 250 từ/2.000 ký tự/4 media; chấp nhận chữ hoặc video | Trình tạo chỉ có Video hướng dẫn và Blog; video hướng dẫn một tệp, giới hạn body 280 ký tự. Chưa có trình bài ngắn chỉ chữ/nhiều video. Cần giữ luồng video hướng dẫn riêng, bổ sung bài ngắn và ràng buộc phù hợp. |
| P1 | UC-06: xóa Blog/bài của mình | `DELETE /posts/:id`, `DELETE /blogs/:id` | Menu bài chỉ chia sẻ/báo cáo; service Blog chưa xóa. Cần quyền tác giả, xác nhận xóa, trạng thái lỗi và cập nhật danh sách/cache. Xóa media đang chọn không thay thế xóa bài. |
| P1 | UC-09/BR-06: chỉ lưu đề xuất mới nhất | API lưu ngày có sẵn nhưng không nhận proposalId/version kỳ vọng | `previewProposal` kiểm tra latestProposalId, nhưng `saveDraft` không so sánh draft.id với latestProposalId. Nháp A đã mở vẫn có thể được lưu sau khi chat có đề xuất B nếu dữ liệu các bữa chưa đổi. Cần chặn tại bước lưu; xem thêm rủi ro đồng thời phía BE bên dưới. |
| P2 | UC-06: chèn/tải video Blog ≤100 MB | `POST /blogs/videos/uploads`, trả signed upload Cloudinary và URL | Service mobile chỉ có images/uploads; editor chưa có chọn/tải tệp video Blog. Renderer phát được video đã có không đồng nghĩa đã có luồng upload. |
| P2 | UC-07: ghi nhận lượt xem | `POST /posts/views` với postIds, đếm nền và chống trùng; hướng dẫn bài hiện ít nhất nửa màn trong một giây | Mobile chỉ đọc/hiển thị viewCount; chưa tìm thấy request ghi nhận views. Cần tracker theo khả năng nhìn thấy, gom batch; GET bài không thay thế endpoint này. |
| P2 | UC-08: số người/thời gian và chuẩn bị → xem lại → gửi | Trợ lý nhận yêu cầu chat, có bước đề xuất riêng | Form chỉ có 1–5 và “6+”, thời gian 15/30/45/60 hoặc không giới hạn; không biểu đạt chính xác toàn khoảng 1–20 người/1–240 phút. Có nút xem lại nhưng nút chính gửi thẳng AI. Cần làm rõ và sửa theo luồng SRS. |
| P2 | UC-09: cảnh báo rời luồng khi còn nháp | Không phải chức năng server | Chưa tìm thấy usePreventRemove/beforeRemove hoặc cảnh báo tương đương cho bản nháp thực đơn. Provider giữ nháp khi đổi tab nhưng chưa đáp ứng đầy đủ cảnh báo khi rời luồng. |
| P2 | UC-02: thông báo tài khoản đình chỉ | Guard/login có ACCOUNT_SUSPENDED và ACCOUNT_NOT_ACTIVE; kiểm tra trạng thái tài khoản | `auth-errors.ts` chưa phân biệt các code này: login HTTP 401 bị báo sai tên/mật khẩu. Cần thông báo đình chỉ phù hợp và kiểm tra thu hồi phiên/đổi tài khoản. Không kết luận mobile vượt được quyền server. |
| P3 | Mục 4.7: lựa chọn theme/mascot/vị trí | Chủ yếu là tùy chọn client | Theme theo thiết bị, mascot/vị trí cố định; chưa có màn chọn sáng/tối/theo thiết bị và lựa chọn trợ lý. |

P1 là nên làm trước để hoàn thiện luồng hoặc tránh lỗi dữ liệu; P2 là phần chức năng/quy tắc còn thiếu; P3 là tùy chỉnh giao diện.

### Bằng chứng mobile

- Kiểm duyệt: `src/features/blogs/types/blogs.schema.ts:6`, `src/features/feed/types/feed.schema.ts:30`, `src/features/feed/types/compose.schema.ts:20`; editor Blog chỉ hiện Đã đăng/Bản nháp ở `src/features/blogs/components/blog-editor-screen.tsx`.
- Công thức: `src/features/recipes/services/recipe.service.ts` có catalog/detail/favorite, không có rating.
- Mua sắm: `src/features/meal-plan/services/meal-plan.service.ts` và route `src/app/` chưa có shopping-list.
- Tạo bài: `src/features/feed/components/compose-dialog.tsx`, `src/features/feed/hooks/use-compose-actions.ts`, `src/features/feed/types/compose.schema.ts`.
- Xóa/chia sẻ: `src/features/posts/components/post-menu.tsx`, `src/features/posts/services/posts.service.ts`, `src/features/blogs/services/blogs.service.ts`.
- Đề xuất cũ: `src/features/meal-plan/hooks/meal-planner-provider.tsx`, hàm previewProposal và saveDraft; `src/features/meal-plan/utils/meal-plan.ts`, hàm changedDayInputs.
- Form: `src/features/meal-plan/components/meal-request-form.tsx:17`, `:18`; `planner-chat-screen.tsx` gọi sendMessage ngay trong onSubmit.
- Views: `src/features/feed/components/post-card.tsx` hiển thị viewCount; tìm service toàn src chưa thấy `/posts/views`.
- Đình chỉ: `src/features/auth/utils/auth-errors.ts`; cơ chế refresh 401 chung tại `src/shared/api/api-client.ts`.
- Giao diện: `src/components/vedora-theme-provider.tsx`, `src/hooks/use-color-scheme.ts`.

## Backend còn khoảng trống hoặc cần xác minh

### 1. Lưu thực đơn chưa có kiểm tra phiên bản dữ liệu đã xem

Liên quan UC-09, BR-06, BR-15 và mục 5.6.

`SaveMealDaysDto` chỉ nhận dữ liệu ngày/bữa, không có expectedVersion/previous/proposalId. `MealPlanService.apply` chạy preview trước transaction; trong transaction có khóa user nhưng xóa và thay toàn bộ các ngày gửi lên mà không đối chiếu với phiên bản client đã xem. Khóa làm các lần ghi tuần tự, chưa phát hiện payload cũ của lần ghi sau.

Mobile có GET mới và kiểm tra previous trước PUT, nhưng vẫn có khoảng thời gian giữa đọc và ghi. Suy luận từ contract và source: hai thiết bị cùng đọc A; thiết bị 1 lưu B; thiết bị 2 gửi payload từ A sau đó có thể ghi đè B mà không được báo xung đột. Chưa chạy tái hiện đồng thời trên DB thật.

Đề nghị bổ sung expectedVersion hoặc expectedPrevious vào hợp đồng lưu và kiểm tra cùng transaction; không chỉ dựa vào GET trước PUT ở client. Việc ngăn nháp A sau đề xuất B trong cùng UI vẫn phải sửa riêng trên mobile.

Bằng chứng: [SaveMealDaysDto](https://github.com/WDP-FA26/vedora-api/blob/f6bf6fbe0e515175d8d133278fe5b4b19f1728c6/src/meal-plan/dto/meal-plan.dto.ts), [MealPlanService.apply](https://github.com/WDP-FA26/vedora-api/blob/f6bf6fbe0e515175d8d133278fe5b4b19f1728c6/src/meal-plan/meal-plan.service.ts).

### 2. Giới hạn video Blog 100 MB chưa được chứng minh có enforcement phía server

SRS UC-06 yêu cầu tối đa 100 MB. Controller cấp chữ ký không nhận metadata dung lượng; `signBlogVideoUpload` ký public_id/asset_folder, chưa thấy max_file_size hoặc kiểm tra bytes cho luồng này. Tài liệu runtime-config cũng mô tả đây là cap frontend, không phải enforcement backend mới.

Cần xác minh cấu hình Cloudinary thật và kiểm tra upload vượt 100 MB. Chưa kết luận provider chắc chắn cho phép tệp lớn hơn; source hiện tại chưa đủ chứng minh giới hạn SRS được bảo vệ ngoài UI.

Bằng chứng: [blogs.controller.ts](https://github.com/WDP-FA26/vedora-api/blob/f6bf6fbe0e515175d8d133278fe5b4b19f1728c6/src/posts/blogs/blogs.controller.ts), [CloudinaryService.signBlogVideoUpload](https://github.com/WDP-FA26/vedora-api/blob/f6bf6fbe0e515175d8d133278fe5b4b19f1728c6/src/cloudinary/cloudinary.service.ts).

## Khác biệt đặc tả cần chốt

1. **Nhắn tin:** SRS UC-24/BR-17 quy định quyền gửi theo follow, cả hai bỏ follow thì không được gửi. BE hiện cho `followsPeer || acceptedAt`; khi đã chấp nhận lời mời thì vẫn có thể nhắn mà không follow. Mobile mới đã có Chấp nhận/Xóa lời mời theo API. Đây là thay đổi nghiệp vụ so với PDF, cần cập nhật SRS hoặc đổi implementation nếu nghiệm thu bắt buộc đúng bản PDF; không phải thiếu nút trên mobile.
2. **Sửa bài ngắn/video đã đăng:** BE đã thêm PATCH /posts/:id, nhưng SRS Phụ lục A trang 22 đưa việc này ngoài phạm vi. Không tính mobile thiếu sửa bài là thiếu yêu cầu bắt buộc của bản SRS này.
3. **Runtime config:** BE có GET /public-config; mobile vẫn dùng hằng số, gồm cả giới hạn minh chứng chuyên gia. Với mặc định hiện tại nhiều giá trị khớp, nhưng đổi env có thể làm mobile chặn sai/cho nhập vượt. Đây là việc tích hợp BE mới cần làm, không phải một UC riêng bị thiếu trong SRS.
4. **Chia sẻ:** Mobile dùng Share.share; SRS mô tả sao chép liên kết. Hệ điều hành có thể cung cấp thao tác sao chép nhưng chưa có nút sao chép riêng trong app. Cần thống nhất tiêu chí nghiệm thu.

## Đã có triển khai, cần kiểm thử tích hợp

- Đăng ký/email/password reset/Google/Turnstile; hồ sơ, ảnh và crop; tránh/thích nguyên liệu; follow và gợi ý.
- Feed, tìm kiếm, xem công thức, like/repost/bookmark/comment/report, công thức đã lưu.
- Thông báo hệ thống actor null, nội dung kiểm duyệt/báo cáo, đánh dấu đọc và SSE.
- Chuyên gia: nộp minh chứng, theo dõi kết quả/ghi chú, nộp lại và huy hiệu theo isProfessional. Không tính là còn thiếu.
- Blog nháp/editor/ảnh/trợ lý viết, video hướng dẫn; các khoảng thiếu đã liệt kê riêng.
- Thực đơn/AI/nháp/lưu/đổi món, lịch sử chat và mở/xóa hội thoại cũ.
- Tin nhắn riêng/lịch sử/chưa đọc/SSE/lời mời, với khác biệt nghiệp vụ đã nêu.
- Gói dịch vụ, quota, QR/SePay/kiểm tra/hủy/lịch sử thanh toán.
- BE có controller/service cho Admin quản lý account/status/role, kiểm duyệt/report, recipe/ingredient/rule, duyệt chuyên gia, PDF knowledge, policy, thống kê/AI costs và thanh toán. Rà soát này không đánh giá UI web Admin và không chứng nhận mọi AC của các nhóm đó đã đạt.

Không lấy nhận xét cũ trong recipe-ratings.md rằng chưa có đình chỉ làm kết luận hiện tại: source users/account-access mới đã triển khai trạng thái và kiểm tra account.

## Thứ tự đề nghị

1. Sửa trạng thái kiểm duyệt Blog/feed để tránh request thành công ở server nhưng UI báo lỗi.
2. Danh sách mua sắm và đánh giá sao vì API đã sẵn.
3. Xóa nội dung và trình bài ngắn đúng giới hạn.
4. Chặn đề xuất thực đơn cũ và bổ sung chống ghi đè đồng thời ở BE.
5. Video Blog, ghi nhận views, form thực đơn và xử lý tài khoản đình chỉ.
6. Runtime config, tùy chọn giao diện; chốt cập nhật SRS nhắn tin.

## Kiểm tra UI đề nghị (chưa thực hiện)

1. Xuất bản Blog → theo dõi PROCESSING/PENDING_REVIEW/REJECTED/PUBLISHED; mở lại từ thông báo và Blog của tôi. Nội dung không được mất khi có lỗi.
2. Mở công thức → chấm 4 sao → đổi 5 → gỡ; mở bằng guest và tài khoản khác để đối chiếu summary/quyền riêng.
3. Lưu thực đơn → chọn MON/TUE trong danh sách mua sắm → kiểm tra đơn vị khác nhau và lượng chưa rõ; nháp chưa lưu không được tính.
4. Tạo bài chỉ chữ và 2–4 video; thử 281 ký tự, quá 250 từ/quá 2.000 ký tự; xác nhận luồng một video hướng dẫn riêng.
5. Mở nội dung của mình → xóa → hủy rồi xác nhận; kiểm tra danh sách sau xóa và quyền của tài khoản khác.
6. Nhận A vào nháp → chat tạo B → thử lưu A; thử hai thiết bị cùng chỉnh một ngày, kiểm tra có thông báo xung đột thay vì ghi đè.
7. Mở bài hơn một giây → tải lại sau vài giây để đối chiếu views và chống trùng.
8. Thêm video Blog gần và vượt 100 MB; thử upload trực tiếp bằng signed target trong môi trường test để xác minh enforcement phía dịch vụ.
9. Thử 20 người/240 phút và kiểm tra bước chuẩn bị không tự gửi AI; rời màn khi có nháp phải có cảnh báo.
10. Admin đình chỉ một tài khoản đang đăng nhập; kiểm tra phiên bị chặn, thông báo chính xác, không lộ dữ liệu khi đổi account.
11. Duyệt/từ chối chuyên gia và kiểm tra tick; nhận thông báo actor null; kiểm tra chấp nhận lời mời nhắn tin theo quy tắc đã thống nhất.

Chưa chạy backend, DB, AI, Cloudinary, SePay hoặc kiểm thử trên thiết bị; chưa đo NFR. Không đưa tỷ lệ % hoàn thành vì chưa nghiệm thu từng AC.
