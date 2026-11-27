# Đối chiếu mobile với SRS v1.1

Ngày: 18/11/2026. Người thực hiện: Codex. Code tham chiếu: `0930cdb` và working tree tại thời điểm rà soát.

Nguồn: `C:\Users\DELL\Downloads\Vedora_SRS_v1.1.pdf`, đặc biệt mục 4–7 và Phụ lục A. SRS đặc tả **Vedora Web**; Phụ lục A, trang 22, ghi native mobile ngoài phạm vi. Báo cáo này dùng nghiệp vụ Guest/Member làm chuẩn tương đương cho mobile, không coi các yêu cầu Next.js hoặc màn quản trị là việc mobile bắt buộc phải làm.

Đây là rà soát source, route, schema và service; chưa chạy UI, backend, thanh toán thật hay kiểm thử trên thiết bị. “Đã có” nghĩa là đã thấy triển khai trong code, chưa phải kết luận đạt nghiệm thu AC.

## Chưa có luồng sử dụng

| # | Yêu cầu SRS | Phần mobile còn thiếu | Bằng chứng trong code | Ưu tiên |
|---|---|---|---|---|
| 1 | UC-05, trang 9: bài văn bản và/hoặc video; trình bài ngắn tối đa 4 video | Chưa có trình đăng bài ngắn chỉ chữ hoặc nhiều video. Dialog chỉ cho Video hướng dẫn (bắt buộc một video) và Blog. Service có nhận mảng mediaIds nhưng UI chưa cung cấp luồng này. | `src/features/feed/components/compose-dialog.tsx:165`, `:254`, `:258`; `src/features/feed/services/compose.service.ts:27` | P1 |
| 2 | UC-06, trang 9: tác giả xác nhận xóa Blog/bài đăng | Chưa có nút, mutation và service xóa bài/Blog đã lưu. Xóa video đang chọn/upload chưa gắn bài không phải xóa nội dung đã đăng. | `src/features/posts/components/post-menu.tsx:89`; `src/features/posts/services/posts.service.ts`; `src/features/blogs/services/blogs.service.ts`; `src/features/blogs/components/my-blogs-screen.tsx` | P1 |
| 3 | UC-07, trang 9–10: đánh giá công thức 1–5 sao, đổi/xóa đánh giá | Đã có lưu/bỏ lưu và danh sách công thức đã lưu; chưa có chọn sao, điểm đánh giá hoặc API đánh giá. | `src/features/recipes/services/recipe.service.ts`; `src/features/recipes/types/recipe.schema.ts`; `src/features/recipes/components/recipe-detail-screen.tsx` | P1 |
| 4 | UC-25, trang 11; mục 5.2: danh sách mua sắm | Chưa có màn/nút/API tổng hợp nguyên liệu theo ngày từ thực đơn đã lưu, tách đơn vị, lượng chưa biết và nguồn món/ngày/bữa. | `src/features/meal-plan/components/meal-plan-screen.tsx`; `src/features/meal-plan/services/meal-plan.service.ts`; `src/features/meal-plan/types/meal-plan.schema.ts` | P1 |
| 5 | UC-22, trang 8: nộp xác minh chuyên gia và xem kết quả | Cập nhật 19/11: đã thêm Tôi → Xác minh chuyên gia, mô tả 20–2.000 ký tự, 1–6 ảnh minh chứng tối đa 10 MB/ảnh, gửi yêu cầu, xem trạng thái/ghi chú và gửi lại khi bị từ chối. Tích xanh trên hồ sơ theo isProfessional từ server. Còn kiểm thử tích hợp nộp ảnh và admin xét duyệt với tài khoản thật. | `src/features/verification/`; `src/app/verification.tsx` | Đã triển khai, chờ kiểm thử tích hợp |
| 6 | UC-06, trang 9: chèn/tải video Blog tối đa 100 MB | Blog đã có editor, ảnh và bản nháp; chưa có chọn/tải tệp video vào Blog và service upload video Blog. Renderer đọc được video có sẵn không thay thế luồng upload. | `src/features/blogs/services/blogs.service.ts:21`; `src/features/blogs/components/blog-editor-screen.tsx:98`; `src/features/blogs/components/blog-rich-editor.tsx` | P2 |

## Đã làm một phần hoặc lệch SRS

| # | Yêu cầu SRS | Khoảng thiếu/sai khác | Bằng chứng trong code | Ưu tiên |
|---|---|---|---|---|
| 7 | UC-05, trang 9: tối đa 250 từ và 2.000 ký tự | Mobile giới hạn nội dung bài/video còn 280 ký tự và yêu cầu body không rỗng. Nội dung hợp lệ theo SRS vượt 280 ký tự bị chặn; cũng chưa đáp ứng video không kèm văn bản của trình bài ngắn. | `src/features/feed/types/compose.schema.ts:3`, `:25` | P1 |
| 8 | UC-06/AC-05; mục 5.5, trang 17: trạng thái xử lý/kiểm duyệt | Blog response chỉ nhận DRAFT/PUBLISHED; tạo bài chỉ nhận PROCESSING/PUBLISHED/FAILED. Chưa hỗ trợ đầy đủ chờ duyệt/bị từ chối theo SRS. Nếu API trả trạng thái khác, Zod từ chối response; cần đối chiếu contract backend trước khi bổ sung trạng thái, thông báo và thao tác thử lại. | `src/features/blogs/types/blogs.schema.ts:6`; `src/features/blogs/components/blog-editor-screen.tsx:92`; `src/features/feed/types/compose.schema.ts:20` | P1 |
| 9 | UC-23, trang 10: thông báo tương tác và kết quả kiểm duyệt; actor có thể không có | Chỉ nhận LIKE/COMMENT/REPOST/FOLLOW và bắt buộc actor là object. Thông báo kiểm duyệt hoặc actor null không qua schema: danh sách có thể báo lỗi, SSE bỏ qua sự kiện. | `src/features/notifications/types/notification.schema.ts:5`; `src/features/notifications/services/notification.service.ts:69`; `src/features/notifications/utils/notification-text.ts` | P1 |
| 10 | UC-08, trang 11: số người 1–20, thời gian 1–240 phút, chuẩn bị → xem lại → gửi riêng | Form chỉ có 1–5 và “6+”; thời gian 15/30/45/60 hoặc không giới hạn. Có “Xem lại nội dung trước khi gửi”, nhưng nút chính “Xác nhận và gửi” gọi AI trực tiếp từ form. Chưa nhập được số người/thời gian chính xác trên toàn khoảng SRS. | `src/features/meal-plan/components/meal-request-form.tsx:17`, `:18`, `:268`; `src/features/meal-plan/components/planner-chat-screen.tsx:57` | P2 |
| 11 | UC-09, trang 11: chỉ đề xuất mới nhất còn hiệu lực; cảnh báo khi rời trang có nháp | Có kiểm tra dữ liệu mới trước khi lưu và giữ bữa không sửa. Tuy nhiên saveDraft không đối chiếu draft.id với latestProposalId: nhận nháp A rồi hỏi ra B vẫn có thể lưu A nếu dữ liệu chưa đổi. Không thấy chặn/cảnh báo rời màn thực đơn có nháp; đổi tab vẫn giữ nháp trong provider nhưng chưa đủ yêu cầu cảnh báo rời luồng. | `src/features/meal-plan/hooks/meal-planner-provider.tsx:138`, `:152`; `src/features/meal-plan/utils/meal-plan.ts:29`; `src/features/meal-plan/components/meal-plan-screen.tsx` | P1 cho đề xuất cũ; P2 cho cảnh báo |
| 12 | Mục 4.7, trang 16: chọn sáng/tối/theo thiết bị, mascot và vị trí | Theme hiện theo thiết bị; mascot Mầm xanh cố định. Chưa thấy màn chọn theme, mascot hoặc vị trí trợ lý. | `src/hooks/use-color-scheme.ts:1`; `src/components/vedora-theme-provider.tsx:8`; `src/features/meal-plan/components/planner-chat-screen.tsx:27` | P3 |

## Điểm cần xác nhận thêm

- UC-07 đề cập lượt xem. Mobile hiển thị `viewCount` nhưng chưa thấy request ghi nhận lượt xem hoặc tracker trong source. Cần xác nhận backend có tự ghi khi GET hay cần endpoint riêng; chưa kết luận thiếu ghi nhận phía hệ thống khi chưa đọc/chạy backend.
- Luồng share đang dùng Share.share với liên kết web; thao tác sao chép phụ thuộc share sheet của hệ điều hành. Chưa thấy nút sao chép riêng như UC-07 mô tả.
- Kiểm duyệt lại Blog, kiểm duyệt bình luận, phân quyền tài nguyên, bảo vệ dữ liệu giữa tài khoản, quota/hoàn quota và xác nhận SePay cần kiểm thử tích hợp. Không thể xác nhận chỉ bằng việc có nút/service.
- Chưa đo NFR hiệu năng, khả năng tiếp cận, UTC+7 trên thiết bị đổi múi giờ, hay kiểm thử các tình huống mất mạng/chuyển tài khoản. Không đưa tỷ lệ hoàn thành vì chưa nghiệm thu từng AC.

## Các nhóm đã có triển khai

Đăng ký/xác minh email; đăng nhập mật khẩu/Google; quên/đặt lại mật khẩu; phiên và đăng xuất; sửa hồ sơ, ảnh và username; tránh/thích nguyên liệu; theo dõi, danh sách và gợi ý; feed và tìm kiếm; xem công thức; thích/đăng lại/bình luận/báo cáo; lưu bài/công thức; video hướng dẫn; viết/sửa Blog, ảnh, lưu nháp và trợ lý Blog; hỏi đáp khách; AI thực đơn, đề xuất/nháp/lưu/đổi món; nhắn tin và tin nhắn chờ; thông báo tương tác qua SSE; gói Free/Plus/Pro, quota, QR, kiểm tra/hủy và lịch sử thanh toán.

Roadmap ngày 06/11 không còn phản ánh đủ code hiện tại: Google login, billing, Blog và likedIngredientIds đã có. Không lấy các mục đó làm bằng chứng còn thiếu.

## Ngoài phạm vi đối chiếu mobile

- Các màn Admin: kiểm duyệt/xử lý báo cáo, quản lý tài khoản, danh mục, duyệt chuyên gia, PDF, chính sách, thống kê/chi phí AI và thanh toán quản trị. Phần gửi báo cáo của Member đã có; phần nộp xác minh của Member vẫn thiếu.
- Không coi tạo công thức cho Member là thiếu: UC-19/BR-11 giao quản lý danh mục cho Admin.
- Push notification, offline, BMI, nhận diện nguyên liệu qua ảnh, nhóm chat, gọi thoại/video và lịch sử chat AI dài hạn không phải yêu cầu phải bổ sung để đạt tương đương SRS này. SRS dùng thông báo trực tuyến, không yêu cầu push native.

## Kiểm tra UI đề nghị (chưa thực hiện)

1. Đăng nhập → Trang chủ → tạo nội dung: kiểm tra lựa chọn hiện có; thử đăng chỉ chữ và chọn nhiều video.
2. Mở bài của mình → menu; mở Blog của tôi → sửa bài: tìm thao tác xóa và xác nhận.
3. Mở công thức → lưu → mở lại danh sách đã lưu; kiểm tra thao tác đánh giá 1–5 sao, đổi/xóa sao.
4. Tạo và lưu thực đơn → tìm danh sách mua sắm → chọn ngày → đối chiếu tổng lượng, đơn vị, lượng chưa biết.
5. Mở Tôi → tìm đăng ký chuyên gia → gửi mô tả/minh chứng → kiểm tra trạng thái sau khi duyệt trên web.
6. Tạo Blog → thử chọn video; xuất bản/sửa bài khiến backend chờ duyệt hoặc từ chối → xem trạng thái và thông báo.
7. Tạo đề xuất A → nhận vào nháp → hỏi để có B → quay về lưu A: phải ngăn lưu đề xuất cũ. Thử rời luồng khi còn nháp.
8. Mở form thực đơn → thử nhập 20 người, 240 phút → chuyển sang chat để xem lại trước khi gửi.
9. Mở cài đặt → tìm chọn sáng/tối/theo thiết bị và mascot/vị trí.

Kiểm tra kỹ thuật: `npx --no-install tsc --noEmit` và `npx --no-install expo lint` đều thành công. Không thay đổi source ứng dụng.
