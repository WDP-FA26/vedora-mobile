# Kế hoạch và kết quả công việc

## 2026-11-25 — Chuẩn bị PR báo cáo bình luận bằng tiếng Anh

- Kết quả đã làm: Xác nhận PR #52 đã merge, tạo nhánh `feat/comment-reporting-notifications` và fast-forward lên main `0f9c496`. Tập hợp code, kiểm thử, báo cáo backlog cập nhật và PLAN để commit/push, tạo PR mới có tiêu đề/mô tả tiếng Anh; giữ các báo cáo đối chiếu cũ ngoài phạm vi.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện trên thiết bị): (1) Mở bình luận/phản hồi người khác, báo cáo và kiểm tra tiếp nhận hoặc lỗi trùng. (2) Nhận từng loại thông báo gỡ/bỏ qua, nhấn để mở trang xem bài/Blog, thiếu bài thì giữ màn thông báo. (3) Thử mạng gián đoạn, đưa app ra nền rồi mở lại và kiểm tra số bình luận được cập nhật.
- Người thực hiện: Codex.

## 2026-11-25 — Báo cáo bình luận và thông báo xử lý

- Kết quả đã làm: Thêm nút Báo cáo cho bình luận gốc/phản hồi của người khác khi hồ sơ đăng nhập đã tải; bình luận của mình không có nút. Form có trích đoạn, bảy lý do, mô tả tối đa 500 ký tự và xác nhận tiếp nhận. Service/hook gọi `POST /posts/:postId/comments/:commentId/report`, kiểm tra UUID/input/receipt bằng Zod; không gửi ảnh/evidenceIds. Mô tả là tùy chọn kể cả OTHER theo DTO BE. Chặn gửi lặp/đóng khi gửi, giữ nội dung sau lỗi, nhận ALREADY_REPORTED như đã tiếp nhận và kiểm tra phiên trước/sau request. Bổ sung đủ COMMENT_REMOVED, COMMENT_REMOVED_BY_POST_OWNER, COMMENT_THREAD_REMOVED, COMMENT_REPORT_RESOLVED, COMMENT_REPORT_DISMISSED; hiển thị trích đoạn, không quy kết vi phạm cho chủ bài xóa/xóa theo luồng. Thông báo bình luận mở trang xem bài/Blog khi còn postId; không điều hướng nếu thiếu postId và không gắn commentId đã xóa. SSE và reconnect làm mới cache bình luận/các bề mặt có số lượng. Không đổi BE, chưa tự commit/push thay đổi này.
- Kiểm tra kỹ thuật: Lint, TypeScript và export Android/web đạt; 39/39 kiểm thử liên quan đạt, gồm 6 ca mới cho hợp đồng text-only, OTHER tùy chọn, phản hồi, phiên, form lỗi/trùng/chống gửi lặp, năm thông báo/điều hướng và cache SSE/reconnect. Chưa kiểm tra tài khoản thật, admin xử lý thực tế hoặc UI/bàn phím trên thiết bị.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện trên thiết bị): (1) Đăng nhập, mở bài/Blog công khai và bình luận người khác; kiểm tra Báo cáo hiện trên bình luận gốc/phản hồi và ẩn ở bình luận của mình. (2) Nhấn Báo cáo, đọc trích đoạn, thử gửi chưa chọn lý do; chọn từng lý do, nhập mô tả, thử OTHER không mô tả và kiểm tra giới hạn 500 ký tự. (3) Gửi, kiểm tra tiếp nhận; mở lại gửi cùng bình luận để kiểm tra báo cáo trùng không thành lỗi. (4) Ngắt mạng khi gửi để kiểm tra giữ lựa chọn/nội dung; thử gửi liên tiếp, đóng trong lúc gửi và đổi phiên. (5) Admin gỡ bình luận/bỏ qua báo cáo, hoặc chủ bài xóa bình luận gốc có phản hồi; kiểm tra đúng câu thông báo cho tác giả và người báo cáo, số lượng/hội thoại được làm mới. (6) Nhấn thông báo của bài và Blog để mở trang xem; khi postId null giữ màn thông báo và đánh dấu đã đọc. (7) Thử sáng/tối, màn nhỏ, chữ lớn, bàn phím và trình đọc màn hình; đưa app nền rồi mở lại để kiểm tra đồng bộ sau khi lỡ SSE.
- Người thực hiện: Codex.

## 2026-11-25 — Rà phần BE còn thiếu trên mobile sau PR #52

- Kết quả đã làm: Fetch BE main `db7da97`, đối chiếu lại với mobile `d507900`, ghi [BE_MOBILE_REMAINING_AFTER_PR52.md](BE_MOBILE_REMAINING_AFTER_PR52.md). Loại ticket/khiếu nại/thông báo ticket và ảnh báo cáo bài đã code trong PR #52 khỏi backlog. Xác nhận lỗi hợp đồng chat `messages[]`/`message`; liệt kê 14 nhóm thiếu/chưa hoàn chỉnh còn lại, tách Workspace theo vai trò và public-config/copy/summary khỏi yêu cầu UI mặc định. Không sửa source, không tự commit/push báo cáo mới.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở Trợ lý thử gửi tin với BE main để xác nhận lỗi hợp đồng. (2) Mở bình luận và Blog để kiểm tra thiếu báo cáo bình luận/bìa khác nội dung. (3) Mở hồ sơ ăn uống, lịch và nhật ký tìm ghi chú/đi chợ/tuần cũ/sửa mục/dinh dưỡng. (4) Đối chiếu feed/theo dõi, tạo/nháp/sửa POST và tìm người dùng. (5) Đối chiếu upload video Blog, thống kê, nhà hàng/Trang; kiểm tra hồi quy ticket và ảnh báo cáo đã có. Checklist và bằng chứng chi tiết trong báo cáo.
- Người thực hiện: Codex.

## 2026-11-25 — Chuẩn bị PR hỗ trợ và ảnh báo cáo bài viết

- Kết quả đã làm: Tập hợp module hỗ trợ/khiếu nại, điều hướng thông báo ticket, UI hỗ trợ và ảnh minh chứng báo cáo bài viết vào nhánh `feat/mobile-support-report-evidence` để commit/push và mở PR về main. Giữ các báo cáo đối chiếu repo ngoài phạm vi thay đổi tính năng.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện trên thiết bị): (1) Từ Hồ sơ mở Hỗ trợ, tạo yêu cầu theo từng chủ đề, đính kèm ảnh và trả lời/rút yêu cầu. (2) Từ bài bị xử lý tạo khiếu nại rồi mở đúng ticket qua thông báo. (3) Từ feed báo cáo bài người khác, thêm đủ 3 ảnh, xem lớn/gỡ ảnh và gửi; kiểm tra ảnh còn khi gửi lỗi và bị xóa khỏi form khi đóng. (4) Kiểm tra theme sáng/tối, màn nhỏ và bàn phím.
- Người thực hiện: Codex.

## 2026-11-25 — Gom bố cục ảnh minh chứng trong báo cáo

- Kết quả đã làm: Gom tiêu đề, bộ đếm, quy cách ảnh và lưới ảnh vào một khung thống nhất. Dùng ba cột ảnh vuông cùng kích thước và khoảng cách đều; ô thêm ảnh nằm cùng hàng với ảnh đã chọn. Khi chưa có ảnh, hiển thị vùng chọn ảnh toàn chiều rộng. Đặt icon thùng rác trong góc trên ảnh với nền theo theme, vùng chạm 44 × 44 điểm; bỏ hàng nút xóa rời bên dưới. Giữ thao tác xem lớn, gỡ, tải ảnh và gửi báo cáo.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện trên thiết bị): (1) Feed → Báo cáo bài viết → cuộn tới Ảnh minh chứng, kiểm tra tiêu đề/bộ đếm và vùng chọn ảnh cùng một khung. (2) Thêm lần lượt 1, 2, 3 ảnh; kiểm tra các ô vuông bằng nhau, ô thêm ảnh nằm cạnh ảnh và ẩn khi đủ 3. (3) Nhấn ảnh để xem lớn, nhấn thùng rác ở góc để gỡ đúng ảnh; kiểm tra ô thêm xuất hiện lại, bộ đếm cập nhật. (4) Thử ảnh sáng/tối, theme sáng/tối, màn nhỏ và chữ lớn để kiểm tra icon rõ, nội dung không tràn; gửi lỗi rồi kiểm tra ảnh còn giữ.
- Người thực hiện: Codex.

## 2026-11-25 — Icon thùng rác cho ảnh minh chứng

- Kết quả đã làm: Thay chữ Gỡ ảnh trong form báo cáo bài viết bằng icon thùng rác màu đỏ, nút 44 × 44 điểm phía dưới bên phải ảnh. Giữ nhãn trợ năng theo số ảnh và trạng thái khóa khi đang xử lý.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện trên thiết bị): (1) Feed → Báo cáo bài viết → thêm ảnh minh chứng. (2) Kiểm tra dưới ảnh hiện icon thùng rác thay chữ Gỡ ảnh. (3) Nhấn icon, kiểm tra gỡ đúng ảnh và có thể thêm ảnh khác. (4) Thử sáng/tối và trình đọc màn hình để kiểm tra màu, vùng chạm và nhãn Gỡ ảnh minh chứng.
- Người thực hiện: Codex.

## 2026-11-25 — Bổ sung ảnh minh chứng khi báo cáo bài viết

- Kết quả đã làm: Fetch và đọc BE origin/main `db7da97`, đối chiếu `docs/docs-for-FE/post-report-evidence.md`, controller/service và DTO. BE nhận multipart field `file` qua `POST /posts/:postId/report/evidence`, trả UUID rồi nhận `evidenceIds` ở `POST /posts/:postId/report`; khác endpoint ảnh hỗ trợ. Bổ sung mobile chọn từng ảnh, kiểm tra JPG/PNG/WebP và mặc định 3 ảnh × 5 MB, tải qua Axios có xác thực, xem/phóng to/gỡ ảnh; gửi ID ảnh cùng lý do/mô tả. Giữ ảnh đã tải sau lỗi để thử lại, bỏ ID khi đóng, chặn gửi/tải lặp và đóng khi đang xử lý. Kiểm tra phiên trước/sau upload và mutation; không đưa ảnh phiên/bài khác vào báo cáo. Hiển thị lỗi định dạng, dung lượng, ảnh hết hạn và kho ảnh chưa sẵn sàng. Không dùng signed PUT hoặc endpoint support cho ảnh báo cáo; không đổi BE và không thêm thư viện. Giới hạn mobile hiện theo mặc định BE 3/5, chưa đọc cấu hình tùy chỉnh từ public-config.
- Kiểm tra kỹ thuật: Lint, TypeScript và 29/29 kiểm thử liên quan đạt, gồm 10 ca mới cho giới hạn/UUID, multipart web/native, payload có/không ảnh, hủy chọn, đổi phiên, giữ/gỡ ảnh khi gửi lỗi, chặn thao tác lặp và xóa ảnh khi đóng. Chưa chạy BE/storage thật hoặc gửi ảnh trên thiết bị Android/iOS; kết quả mock multipart chưa chứng minh upload thực tế.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện trên thiết bị): (1) Đăng nhập → Feed → ba chấm ở bài người khác → Báo cáo bài viết. (2) Chọn lý do, nhập mô tả; nhấn Thêm ảnh minh chứng, hủy bộ chọn rồi mở lại để chọn JPG/PNG/WebP. (3) Thử ảnh trên 5 MB/sai định dạng để kiểm tra cảnh báo; thêm đủ 3 ảnh, kiểm tra nút thêm ẩn, chạm ảnh phóng to rồi gỡ một ảnh và thêm lại. (4) Gửi và kiểm tra màn cảm ơn; quản trị mở báo cáo tương ứng để xác nhận đúng ảnh minh chứng. (5) Ngắt mạng khi gửi, kiểm tra ảnh/nội dung vẫn còn; bật mạng và thử lại, báo cáo trùng vẫn về màn cảm ơn. (6) Đóng/Hủy rồi mở lại, kiểm tra không còn ảnh cũ; đổi tài khoản lúc đang chọn/tải để kiểm tra không dùng ảnh của phiên cũ. (7) Thử kho ảnh chưa cấu hình, ảnh hết hạn và bài không còn công khai; kiểm tra thông báo và khả năng gỡ ảnh để gửi không ảnh. (8) Thử sáng/tối, màn nhỏ và bàn phím; kiểm tra luồng tương tự từ chi tiết bài/Blog dùng chung menu.
- Người thực hiện: Codex.

## 2026-11-25 — Làm mới UI báo cáo bài viết trên feed

- Kết quả đã làm: Đồng bộ form Báo cáo bài viết/Blog với phong cách hỗ trợ: sticker bơ, thẻ lời nhắc, nút đóng 44 điểm, từng lý do có viền và trạng thái chọn, trường mô tả rõ bắt buộc khi chọn Lý do khác, bộ đếm ký tự và nút gửi/hủy có vùng chạm tối thiểu 48 điểm. Khóa lý do/mô tả khi đang gửi; thêm sticker cà chua ở màn cảm ơn. Dùng theme sáng/tối, cuộn form và điều chỉnh inset bàn phím trên iOS. Giữ API, schema và xử lý báo cáo trùng; chưa bổ sung ảnh minh chứng.
- Kiểm tra kỹ thuật: 8/8 kiểm thử menu/xóa/chia sẻ bài viết đạt; lint và TypeScript đạt. Chưa gửi báo cáo với tài khoản thật hoặc kiểm tra bố cục/bàn phím trên thiết bị.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Feed → dấu ba chấm trên bài của người khác → Báo cáo bài viết; kiểm tra sticker và phần mở đầu. (2) Chọn từng lý do, kiểm tra viền/màu và trạng thái radio; thử lý do dài trên màn nhỏ. (3) Chọn Lý do khác rồi gửi khi chưa nhập mô tả để kiểm tra cảnh báo; nhập nội dung và kiểm tra bộ đếm tối đa 500 ký tự. (4) Bật bàn phím, cuộn tới nút gửi; gửi và kiểm tra màn cảm ơn có sticker, nhấn Đóng trở lại feed. (5) Thử Hủy, nút đóng, chạm nền và theme sáng/tối; ngắt mạng khi gửi để kiểm tra thông tin vẫn còn và có thể thử lại. (6) Mở menu bài của mình và chức năng chia sẻ để kiểm tra các thao tác cũ.
- Người thực hiện: Codex.

## 2026-11-25 — Dropdown chủ đề hỗ trợ

- Kết quả đã làm: Thay ba chip Hỗ trợ chung/Thanh toán/Xác minh tài khoản bằng dropdown trong form tạo yêu cầu. Mặc định Hỗ trợ chung; nhấn mở/đóng danh sách, đánh dấu mục hiện tại và tự đóng khi chọn. Khóa lựa chọn khi đang gửi; giữ giá trị category gửi API và luồng khiếu nại. Dùng theme và thư viện sẵn có.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện trên thiết bị): (1) Hồ sơ → Hỗ trợ & khiếu nại → Tạo yêu cầu hỗ trợ. (2) Kiểm tra ô chủ đề mặc định Hỗ trợ chung có mũi tên; nhấn để xổ ba lựa chọn. (3) Chọn Thanh toán, kiểm tra danh sách đóng và ô hiển thị lựa chọn mới; mở lại thấy dấu tích ở Thanh toán. (4) Chuyển sang Xác minh tài khoản rồi Hỗ trợ chung; nhấn lại ô để đóng mà không đổi lựa chọn. (5) Nhập tiêu đề/nội dung và gửi; kiểm tra chi tiết đúng chủ đề. (6) Thử sáng/tối, màn nhỏ, chữ lớn và trình đọc màn hình.
- Người thực hiện: Codex.

## 2026-11-25 — Cân đối UI hỗ trợ và thêm sticker Vedora

- Kết quả đã làm: Thêm sticker bơ/cà rốt/cà chua sẵn có vào lời chào, form, trạng thái trống/kết thúc và điểm vào từ Hồ sơ. Cân giữa tiêu đề, thống nhất lề và thẻ bo góc; chuyển bộ lọc trạng thái sang hàng cuộn ngang, làm rõ ticket cần phản hồi và hạn trả lời. Chia form thành nhóm thông tin và nội dung, lý do khiếu nại dạng radio; thu gọn vùng thêm/gỡ ảnh. Tin nhắn của bạn căn phải, Vedora căn trái, thời gian tách riêng; giảm độ nổi của các thao tác phụ. Không thêm thư viện.
- Kiểm tra kỹ thuật: Lint, TypeScript và 22/22 kiểm thử liên quan đạt. Đã xem ảnh render component thật qua React Native Web với font/sticker của app: 5 màn danh sách, tạo yêu cầu, trao đổi, khiếu nại, yêu cầu đã đóng ở 320 px sáng và 390 px tối. Fixture thay lớp image/symbol và dữ liệu API; chưa kiểm tra tài khoản thật, bàn phím hay thiết bị Android/iOS.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện trên thiết bị): (1) Hồ sơ → Hỗ trợ & khiếu nại: kiểm tra sticker, lề hai bên và tiêu đề cân giữa. (2) Cuộn ngang bộ lọc, chọn từng trạng thái, mở thẻ yêu cầu; kiểm tra nhãn trạng thái và hạn phản hồi dễ đọc. (3) Tạo yêu cầu: chọn chủ đề, nhập tiêu đề/mã tham chiếu/nội dung; thêm ảnh, chạm phóng to, gỡ và thêm đủ 4 ảnh. (4) Từ bài bị xử lý mở khiếu nại, chọn từng lý do và nhập giải trình; kiểm tra nút gửi khi bật bàn phím. (5) Mở ticket có hai bên trao đổi: tin của bạn bên phải, Vedora bên trái; gửi phản hồi và thử bước xác nhận rút. (6) Mở danh sách trống và ticket đã kết thúc để xem sticker/thông điệp tương ứng; đổi theme sáng/tối, thử màn nhỏ và chữ lớn để kiểm tra xuống dòng, cuộn và vùng chạm.
- Người thực hiện: Codex.

## 2026-11-25 — Hỗ trợ, khiếu nại và thông báo ticket trên mobile

- Kết quả đã làm: Thêm module support theo API BE main `db7da97`, các route `/support`, `/support/new`, `/support/[id]`. Từ Hồ sơ mở danh sách có lọc trạng thái, phân trang và tải lại; tạo yêu cầu chung/thanh toán/xác minh với tiêu đề, nội dung, mã tham chiếu. Từ thông báo xử lý trên bài/Blog, dùng `appeal.canAppeal`, hạn gửi và ticket hiện có của BE để gửi hoặc xem khiếu nại. Thêm upload ảnh JPG/PNG/WebP vào URL ký riêng bằng helper upload hiện có (mặc định tối đa 4 ảnh, 10 MB/ảnh), xem ảnh/phóng to, gỡ ảnh trước gửi, giữ nội dung và ID ảnh khi gửi lỗi. Chi tiết có lịch sử, ảnh, kết quả, hạn phản hồi, trả lời bằng chữ/ảnh; hỗ trợ mở lại ticket thường theo `reopenableUntil`, không mở lại khiếu nại đã kết thúc; rút ticket đang mở có bước xác nhận. Không tự retry mutation; lỗi chưa xác nhận kết quả nhắc tải lại trước khi gửi để tránh trùng. Kiểm tra đổi phiên trong luồng upload và mutation, cập nhật/invalidate cache hỗ trợ, thông báo và quyền sửa/xóa bài/Blog. Thông báo nhận `ticketId`, hiển thị các loại ticket/khôi phục bài và ưu tiên mở đúng ticket; SSE làm mới cache support. Thêm đường quay về danh sách hỗ trợ sau đăng nhập. Dùng thư viện sẵn có, không đổi BE, không commit/push.
- Kiểm tra kỹ thuật: 22/22 kiểm thử liên quan support/notification/moderation/upload/verification đạt, gồm 8 ca support mới và 1 ca hành động khiếu nại. Toàn bộ suite 129/134 đạt; 5 ca lỗi billing, dietary-profile và recipe-favorite đã được tái xác nhận trên snapshot HEAD chưa sửa, không phát sinh từ task. Lint, TypeScript và export Android/web được kiểm tra cho thay đổi routing. Đã đọc tài liệu ImagePicker/FileSystem SDK 58 và Expo Router trước khi triển khai. Chưa chạy BE/DB, gửi ticket/ảnh bằng tài khoản thật hoặc kiểm tra UI trên thiết bị.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Đăng nhập → Hồ sơ → Hỗ trợ & khiếu nại → tạo yêu cầu Hỗ trợ chung, Thanh toán hoặc Xác minh; bỏ trống tiêu đề/nội dung để kiểm tra cảnh báo rồi nhập hợp lệ. (2) Thêm ảnh JPG/PNG/WebP, thử hủy bộ chọn, thử ảnh quá dung lượng/sai định dạng, thêm đủ 4 ảnh và gỡ một ảnh; gửi rồi kiểm tra mã yêu cầu, nội dung và ảnh ở chi tiết; chạm ảnh để phóng to. (3) Về danh sách, lọc từng trạng thái, tải lại và Xem thêm khi có nhiều trang; mở đúng yêu cầu. (4) Từ bài/Blog của mình bị từ chối hoặc gỡ, nhấn Gửi khiếu nại, chọn lý do, nhập giải trình/ảnh và gửi; mở lại bài để kiểm tra khóa sửa/xóa và nút Xem khiếu nại; thử trường hợp hết hạn/đã có ticket. (5) Khi quản trị phản hồi, mở thông báo và kiểm tra đi thẳng đúng ticket dù thông báo kèm postId; xem nội dung mới, hạn phản hồi, gửi chữ hoặc chỉ ảnh và kiểm tra trạng thái trở về Đang xử lý. (6) Mở ticket đang hoạt động → Rút yêu cầu → Hủy để giữ ticket, rồi xác nhận rút; kiểm tra trạng thái Đã rút và quyền thao tác bài được cập nhật theo BE. (7) Mở ticket thường đã đóng còn thời hạn, gửi & mở lại; mở khiếu nại đã kết thúc hoặc ticket hết thời hạn để kiểm tra không có form trả lời. (8) Ngắt mạng khi gửi, kiểm tra nội dung/ảnh đã tải còn giữ, tải lại xác nhận kết quả trước khi gửi lại; đăng xuất/đổi tài khoản khi chọn ảnh để kiểm tra không gắn ảnh/cache vào phiên khác. (9) Thử sáng/tối, màn nhỏ, bàn phím, chữ lớn và trình đọc màn hình trên Android/iOS; thử đường dẫn ticket sai/không có quyền và thao tác tải lại khi URL ảnh hết hạn.
- Người thực hiện: Codex.

## 2026-11-25 — Đồng bộ code mobile mới nhất

- Kết quả đã làm: Fetch repo mobile, chuyển từ branch feat/meal-planner-chat-experience sang main và fast-forward tới origin/main `55ac13f` (merge PR #51). Source tại commit mới trùng source branch đang mở trước đồng bộ. Khôi phục đầy đủ PLAN.md và giữ các báo cáo local, không commit/push.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở app và đăng nhập. (2) Mở tab Trợ lý, kiểm tra giao diện chat và lịch sử. (3) Mở tab Thực đơn và hồ sơ để kiểm tra điều hướng sau đồng bộ. Lưu ý hợp đồng chat với BE mới vẫn cần sửa theo báo cáo BE ngày 25/11; đồng bộ main không giải quyết lỗi đó.
- Người thực hiện: Codex.

## 2026-11-25 — Đọc lại BE main và đối chiếu phần mobile còn thiếu

- Kết quả đã làm: Đọc BE main `db7da97`, đối chiếu source mobile `c45470f`, thêm báo cáo [BE_MOBILE_REVIEW_2026-11-25.md](BE_MOBILE_REVIEW_2026-11-25.md). Phát hiện lỗi tương thích ưu tiên đầu: BE chat bắt buộc `message`, mobile vẫn gửi `messages[]`; validation BE mới sẽ từ chối payload này. Bổ sung ảnh minh chứng báo cáo bài và tìm người dùng vào backlog; xác nhận các nhóm thiếu/thiếu một phần: ticket/thông báo, ghi chú ăn uống, đi chợ, feed đúng nguồn, tạo/nháp/sửa POST, báo cáo bình luận, bìa/video Blog, sửa nhật ký, dinh dưỡng/tuần cũ, thống kê, nhà hàng và workspace theo vai trò. Tách admin và API cần chốt nhu cầu UI khỏi phạm vi bắt buộc. Không sửa source ứng dụng, không commit/push. Lint và TypeScript mobile đạt; chưa chạy BE/DB/API đăng nhập hoặc UI thật.
- Các bước kiểm tra luồng UI trên màn hình (checklist đề nghị, chưa thực hiện): (1) Đăng nhập, mở Trợ lý, gửi tin rồi trả lời lựa chọn/xin quyền tìm web, mở lịch sử và quay lại yêu cầu để đối chiếu lỗi hợp đồng chat mới. (2) Mở bài/bình luận của người khác, kiểm tra thiếu ảnh minh chứng và báo cáo bình luận; mở bài bị xử lý để đối chiếu thiếu tạo khiếu nại, trao đổi/rút ticket và mở từ thông báo. (3) Mở hồ sơ ăn uống, lịch thực đơn, công thức và nhật ký, đối chiếu ghi chú, đi chợ, kcal/nhóm chất, tuần cũ và sửa món đã ghi. (4) Tạo/mở lại Blog có bìa riêng và ảnh nội dung khác, kiểm tra bìa thực tế; đối chiếu upload video Blog. (5) Đối chiếu tạo bài chỉ chữ/nhiều video, nháp POST, sửa bài, nguồn feed theo dõi và tìm người. (6) Kiểm tra điểm vào thống kê/nhà hàng/Trang theo vai trò; thử refresh khi nhập, đổi tài khoản lúc upload và đăng nhập tài khoản bị khóa khi có môi trường thử. Chi tiết và bằng chứng ở báo cáo.
- Người thực hiện: Codex.

Sau mỗi task/tính năng, thêm một mục ngắn theo mẫu:

## YYYY-MM-DD — Tên task/tính năng

- Kết quả: Nêu những gì đã hoàn thành.
- Kiểm tra: Hướng dẫn kiểm tra UI từng bước (step by step) trên màn hình (thao tác, điều hướng, quan sát kết quả; không ghi lệnh kiểm tra code như lint/tsc).
- Người thực hiện: Tên người hoặc agent thực hiện.

## 2026-10-14 — Quy tắc cập nhật kế hoạch

- Kết quả: Việt hóa `AGENTS.md`; thêm quy tắc ghi kết quả, kiểm tra và người thực hiện vào file này sau mỗi task/tính năng.
- Kiểm tra: Xác nhận liên kết tới `docs/PLAN.md` và đủ ba mục trong file này; `npx expo lint`, `npx tsc --noEmit`, `git diff --check` đều đạt.
- Người thực hiện: Vy.

## 2026-10-14 — MOB-05: Đăng nhập, đăng ký và xác minh email

- Kết quả: Thêm ba màn xác thực và điểm vào từ trang chủ; kiểm tra dữ liệu bằng Zod, gọi đúng endpoint auth, chuyển tài khoản chưa xác minh sang màn nhập mã, gửi lại mã theo thời gian chờ và lưu phiên trong bộ nhớ. Thêm đăng xuất và chuyển tab sang layout riêng để màn auth không có thanh tab.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, `npx expo export --platform web`, `npx expo export --platform android` và `git diff --check` đều đạt. Chưa kiểm tra tương tác trên thiết bị với email thật.
- Người thực hiện: Vy.

## 2026-10-14 — Làm mới phiên bằng refresh token

- Kết quả: Lưu refresh token bằng Expo SecureStore trên Android/iOS, khôi phục phiên khi mở app, tự động xoay token khi nhận 401 hoặc trở lại ứng dụng gần hết hạn, gộp các request refresh đồng thời và chỉ thử lại request một lần. Đăng xuất xóa phiên cục bộ và thu hồi họ token trên backend; web tiếp tục giữ phiên trong bộ nhớ.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, bundle Android/web và `git diff --check` đều đạt. Bước UI cần chạy trên thiết bị với API thật: đăng nhập, mở lại app để kiểm tra khôi phục phiên, để access token hết hạn rồi thao tác tiếp, cuối cùng đăng xuất và mở lại app; chưa có thiết bị/API để thực hiện.
- Người thực hiện: Codex.

## 2026-11-07 — Đối chiếu lại mobile với 8 ảnh web sau khi bổ sung blog

- Kết quả: Đối chiếu ảnh web với code mobile hiện tại. Còn thiếu đăng nhập Google; trang gói hiện tại, mua Pro/Premium, thanh toán SePay và lịch sử giao dịch; lối vào/luồng xin xác minh chuyên gia; mục Thích và cấu hình sở thích nguyên liệu; lưu công thức ngay trên thẻ; lối vào Điều khoản, Quyền riêng tư, Tiêu chuẩn cộng đồng và Trợ năng. Blog của bạn/viết blog đã có trong nhánh tính năng. Chia sẻ bài đã có trong menu ba chấm. Ảnh billing ghi Pro/Premium chưa có đặc quyền bổ sung, nên chưa kết luận các quyền lợi quảng bá Vedora Plus là tính năng web đã hoạt động. Không suy ra luồng nằm sau nút bấm chỉ từ ảnh.
- Bước kiểm tra UI: (1) Mở Đăng nhập, đối chiếu nút Google trên ảnh web. (2) Mở Tôi, kiểm tra lối vào Gói của bạn và Xác minh tài khoản chuyên gia. (3) Mở Hồ sơ ăn uống, kiểm tra mục sở thích nguyên liệu còn Sắp có và thẻ tóm tắt chỉ có Không ăn. (4) Mở Công thức, kiểm tra thiếu nút lưu trên thẻ. (5) Mở Tôi > Blog của tôi, tạo/lưu nháp một blog để xác nhận phần đã bổ sung. (6) Mở menu ba chấm của bài viết để kiểm tra Chia sẻ. Đây là hướng dẫn kiểm tra trên thiết bị, chưa thao tác trực tiếp trong task đối chiếu.
- Người thực hiện: Codex.

## 2026-10-14 — Đồng bộ nhận diện Vedora và dọn màn mẫu

- Kết quả: Chuyển logo, biểu tượng và bốn hình minh họa từ `vedora-frontend/public` sang `assets/branding`; tạo icon ứng dụng từ logo gốc; dùng logo và sticker trên màn xác thực/màn chủ; thay icon, splash, favicon; bỏ tab Khám phá, màn và thành phần Expo mẫu, đưa màn chủ về route `/`.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, bundle Android/web, `npx expo config --type public --json` và `git diff --check` đều đạt; kiểm tra trực quan icon và đối chiếu SHA-256 cho sáu ảnh nguồn. Bước UI cần chạy trên thiết bị: mở màn chủ, đăng nhập/đăng ký/xác minh để xem logo và sticker ở sáng/tối; tạo native build mới để xem icon/splash; chưa kiểm tra trên thiết bị thật.
- Người thực hiện: Codex.

## 2026-10-14 — MOB-06: Feed Khám phá

- Kết quả: Thêm route `/explore` và lối vào từ màn chủ; đọc feed công khai `GET /posts` với cursor, lọc Dành cho bạn/Bài ngắn/Blog, kéo để làm mới, tải tiếp và trạng thái trống/lỗi. Card hiển thị tác giả, nội dung, blog, video Mux; cho người đã đăng nhập thả mầm/lưu bài và cập nhật cache. Khách được dẫn tới đăng nhập/đăng ký rồi quay lại Khám phá.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, xuất bundle Android/web và `git diff --check` đều đạt. Preview web với API mẫu cục bộ hiển thị bài ngắn/blog, lọc Blog và điều hướng khách sang đăng nhập/đăng ký đúng; bundle sau kiểm tra đã trả về API trong `.env`. Chưa thử video và thao tác ghi trên thiết bị với API thật; cần native build mới cho `expo-video`.
- Người thực hiện: Codex.

## 2026-10-14 — Điều hướng thẳng tới feed sau xác thực

- Kết quả: Đăng nhập và xác minh email thành công chuyển thẳng tới `/explore`; phiên được khôi phục khi mở ứng dụng cũng bỏ qua màn chào. `auth-home` chỉ hiển thị cho khách, còn nút đăng xuất được đặt trên feed để người đã đăng nhập vẫn thoát được.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, bundle Android/web và `git diff --check` đều đạt. Bước UI cần thử trên thiết bị với tài khoản thật: khách mở `/` thấy màn chào, đăng nhập/xác minh thành công vào `/explore`, mở lại ứng dụng với phiên hợp lệ vào feed, bấm đăng xuất trên feed rồi về trạng thái khách.
- Người thực hiện: Codex.

## 2026-10-14 — Giao diện Khám phá dạng timeline mạng xã hội

- Kết quả: Đổi feed từ các card rời thành timeline liền mạch với đường phân cách; thu gọn thanh thương hiệu, chuyển bộ lọc sang tab gạch chân. Bài viết ưu tiên tác giả, nội dung và media, có hàng biểu tượng bình luận/đăng lại/thả mầm/lưu; giữ nguyên phân trang, lọc và các thao tác hiện có.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, xuất bundle Android/web và `git diff --check` đạt. Xem preview web cỡ 390 × 844 với API mẫu: bài ngắn/blog và tab Blog hiển thị đúng. Đã dọn server/dữ liệu thử và xuất lại bundle với API trong `.env`. Cần xem tiếp trên thiết bị Android/iOS với API và ảnh/video thật.
- Người thực hiện: Codex.

## 2026-10-16 — Đưa giao diện Khám phá web sang mobile

- Kết quả: Dùng logo, thanh tab cuộn ngang, vùng tạo bài và bố cục bài viết theo giao diện web; thêm sáu bài minh họa tĩnh đã có trên web khi API trả danh sách trống. Khi có bài thật, bảng tin dùng API với phân trang, thả mầm, lưu và phát video như trước; lỗi API vẫn hiển thị lỗi. Cập nhật trạng thái media, nhãn video, thông tin lượt xem và bộ đọc phản hồi frontend cho các trường Blog/avatar tùy chọn. Tab Đang theo dõi, Công thức và tạo bài hiển thị trạng thái chưa hỗ trợ trên mobile vì chưa có luồng tương ứng.
- Kiểm tra UI cần thực hiện: Mở `/explore` ở màn điện thoại để xem logo, tab và các thẻ bài; chuyển Dành cho bạn/Blog/Bài viết; kéo làm mới, mở menu tài khoản, thả mầm/lưu bài API thật và phát video nếu có bài; kiểm tra trạng thái tải/lỗi và màn tối. Chưa kiểm tra tương tác trên thiết bị ở task này.
- Người thực hiện: Nhóm frontend.

## 2026-10-16 — Bảng tin Đang theo dõi, Công thức và điều hướng dưới

- Kết quả: Bật tab Đang theo dõi trong Khám phá, lấy hồ sơ hiện tại, danh sách tác giả đang theo dõi và bài công khai của từng tác giả bằng API hiện có; gộp theo thời gian, hỗ trợ làm mới, tải thêm tác giả và trạng thái khách/rỗng/lỗi. Thêm trang Công thức với tìm kiếm, lọc và nội dung món từ giao diện Khám phá web. Thêm thanh điều hướng cố định gồm Trang chủ, Công thức, Vedora AI, Lên thực đơn và Tôi; mục Tôi dùng phiên đăng nhập và đăng xuất hiện có. Màn AI và Lên thực đơn là điểm vào, hiển thị rõ trạng thái chưa kết nối trên mobile. Không đổi backend hoặc contract API.
- Giới hạn dữ liệu: Chưa có API danh mục công thức công khai nên trang Công thức hiện dùng nội dung tĩnh của web, không giả thao tác lưu/phát. Bảng tin theo dõi lấy tối đa 20 bài gần đây mỗi tác giả đã tải; chưa phân trang sâu bài của từng tác giả. Mobile chưa có service chat AI hoặc thực đơn.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, bundle Android và web đạt. Bước UI cần thực hiện: mở Khám phá và chuyển Đang theo dõi; đăng nhập để xem bài của người theo dõi, kéo làm mới và thử trạng thái lỗi/rỗng; mở Công thức, tìm và lọc; chuyển qua đủ năm tab trên điện thoại, kiểm tra màn sáng/tối và đăng xuất trong Tôi. Chưa kiểm tra trực quan trên thiết bị ở task này.
- Người thực hiện: Nhóm frontend.

## 2026-10-16 — Thanh điều hướng chỉ có icon và tự ẩn ở Trang chủ

- Kết quả: Bỏ nhãn chữ khỏi thanh điều hướng dưới, giữ nhãn trợ năng cho năm nút. Thanh mặc định hiển thị; khi cuộn xuống ở bảng tin Trang chủ hoặc Đang theo dõi sẽ ẩn, cuộn lên hoặc trở về đầu danh sách sẽ hiện lại. Chuyển tab hoặc đổi bộ lọc Khám phá sẽ đưa thanh về trạng thái hiển thị. Dùng ngưỡng cuộn để hạn chế chớp tắt khi bố cục thay đổi.
- Kiểm tra: `npx tsc --noEmit` và `npx expo lint` đạt. Bước UI cần thực hiện trên điện thoại: mở app kiểm tra thanh có đủ năm icon và không có chữ; vuốt xuống/lên ở Trang chủ và Đang theo dõi; chuyển sang Công thức, Vedora AI, Lên thực đơn, Tôi để xác nhận thanh luôn hiện; đổi bộ lọc rồi thử kéo về đầu trang. Chưa kiểm tra trực quan trên thiết bị ở task này.
- Người thực hiện: Nhóm frontend.

## 2026-10-16 — Tạo nội dung từ Khám phá trên mobile

- Kết quả: Bỏ tab Công thức ở bộ lọc đầu trang Khám phá; trang Công thức ở thanh điều hướng dưới vẫn hoạt động. Thay ô tạo bài chờ bằng dialog chọn loại nội dung đồng bộ giao diện web. Video hướng dẫn có form tiêu đề, mô tả, mẫu nội dung, chọn/xem trước video, xác nhận bỏ bản soạn và gửi bài qua `POST /media/uploads` → URL Mux → `POST /posts`. Bài ngắn gửi qua `POST /posts`. Khi lỗi, nội dung soạn được giữ lại; bài `PROCESSING` không được thêm như bài đã xuất bản. Blog và Công thức hiển thị “Sắp có” theo luồng web hiện tại vì chưa có API đăng cho tài khoản thường.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, `npx expo export --platform android`, `npx expo export --platform web` và `git diff --check` đạt. Bước UI cần thực hiện trên điện thoại với tài khoản thật: mở trang chủ, xác nhận bộ lọc không còn Công thức, mở dialog tạo bài, chọn video dưới 3 phút, xem trước, thử đăng và thử trạng thái mạng lỗi; kiểm tra Blog/Công thức không thể gửi bài. Chưa đăng video thật trên thiết bị ở task này.
- Người thực hiện: Nhóm frontend.

## 2026-10-16 — Tinh chỉnh trang tạo nội dung

- Kết quả: Bỏ lựa chọn và form “Viết bài ngắn” khỏi dialog tạo nội dung trên mobile. Giữ luồng đăng video, cùng hai lựa chọn Blog/Công thức ở trạng thái “Sắp có”. Đổi nền dialog sang màu ngà xanh dịu, thêm sticker cà chua ở màn chọn và sticker cà rốt ở form video, thu gọn tiêu đề/thẻ lựa chọn và tăng cỡ chữ phụ để dễ đọc hơn. Không đổi API hoặc dữ liệu server.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint` và `git diff --check` đạt; tìm trong component/hook không còn luồng “Viết bài ngắn”. Bước UI cần thực hiện: Mở Khám phá → Tạo nội dung, xem bố cục sticker và cỡ chữ trên màn điện thoại sáng/tối; mở Video hướng dẫn, cuộn form, nhập nội dung và mở bàn phím để kiểm tra footer. Chưa kiểm tra trực quan trên thiết bị ở task này.
- Người thực hiện: Nhóm frontend.

## 2026-10-16 — Thu gọn tab trang chủ

- Kết quả: Bộ lọc đầu trang Khám phá chỉ còn Dành cho bạn, Đang theo dõi và Blog. Giữ nguyên dữ liệu bảng tin và thanh điều hướng dưới.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint` và `git diff --check`.
- Người thực hiện: Nhóm frontend.

## 2026-10-16 — Căn giữa tab trang chủ

- Kết quả: Căn giữa ba tab Khám phá trong một nhóm có ba vùng bấm bằng nhau, giới hạn chiều rộng trên màn hình lớn, tăng cỡ chữ và dùng màu chủ đạo cho tab đang chọn. Giữ nguyên dữ liệu và điều hướng.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint` và `git diff --check` đạt. Bước UI trên điện thoại: mở trang chủ, chọn lần lượt Dành cho bạn, Đang theo dõi, Blog; kiểm tra căn giữa ở màn hình hẹp và rộng, màu/gạch chân tab chọn và thanh điều hướng dưới. Chưa kiểm tra trực quan trên thiết bị ở task này.
- Người thực hiện: Nhóm frontend.

## 2026-10-16 — Lên thực đơn và hỏi nhanh trên mobile

- Kết quả: Thay màn chờ của tab Lên thực đơn bằng biểu mẫu yêu cầu, chat Trợ lý Vedora, bản xem trước thực đơn 7 ngày và thao tác lưu có xác nhận qua API hiện có. Hiển thị món đã lưu, cho yêu cầu đổi món, kiểm tra thực phẩm cần tránh từ hồ sơ và nhập nguyên liệu đang có cho từng yêu cầu. Tab Vedora AI có giao diện hỏi nhanh với hình hạt đậu mầm, câu hỏi gợi ý, xử lý lỗi và lời mời đăng nhập/đăng ký khi API báo hết lượt khách. Giữ lối quay về tab ban đầu sau xác thực. Không sửa backend hay contract API.
- Giới hạn tích hợp: API hồ sơ đang dùng chỉ trả thực phẩm cần tránh, chưa có nguyên liệu sẵn có để đồng bộ. Chat khách cần bước xác minh mobile và contract chat cho tài khoản đã đăng nhập từ backend; trước khi nhận contract, app không gửi câu hỏi bằng mã xác minh giả hoặc tự đặt giới hạn lượt hỏi.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, bundle Android/web và `git diff --check` đạt. Bước UI trên điện thoại với API thật: mở Thực đơn khi chưa/đã đăng nhập, nhập yêu cầu và nguyên liệu, gửi trong chat, xem đề xuất rồi lưu, thử lỗi mạng; mở Vedora AI, xác minh khách theo contract mobile, hỏi đến khi server báo hết lượt và kiểm tra lối đăng nhập/đăng ký. Chưa kiểm tra tương tác API trên thiết bị ở task này.
- Người thực hiện: Nhóm frontend.

## 2026-10-16 — Hồ sơ cá nhân và hồ sơ ăn uống trên mobile

- Kết quả: Thay màn Tôi bằng hồ sơ cá nhân dùng `GET /profiles/me`, hiển thị ảnh bìa/avatar, thông tin, số người theo dõi, bài viết công khai và video trong bài gần đây. Cho sửa tên hiển thị và giới thiệu qua `PATCH /profiles/me`. Thêm trang Hồ sơ ăn uống với danh mục nhóm/nguyên liệu cần tránh, chọn hoặc bỏ chọn, lưu qua `PUT /dietary/me` và cập nhật dữ liệu thực đơn liên quan. Khách được đưa tới đăng nhập rồi quay lại đúng trang.
- Giới hạn tích hợp: API hồ sơ ăn uống hiện chỉ lưu nhóm và nguyên liệu cần tránh. Sở thích/nguyên liệu sẵn có trên web đang là dữ liệu trong bộ nhớ, nên mobile không báo đã lưu chúng vào tài khoản; phần sở thích hiển thị “Sắp có”. Trang hồ sơ chỉ lấy bài công khai từ trang đầu API, vì API hiện dùng cho web cũng chưa cung cấp danh sách video theo đủ trạng thái.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, bundle Android/web và `git diff --check` đạt. Bước UI trên điện thoại với tài khoản thật: mở tab Tôi, xem ảnh và bài đã đăng, sửa tên/giới thiệu rồi tải lại; vào Hồ sơ ăn uống, chọn nhóm và nguyên liệu, lưu rồi quay lại xem tóm tắt; thử trạng thái mạng lỗi và đăng xuất. Chưa kiểm tra API trên thiết bị ở task này.
- Người thực hiện: Nhóm frontend.

## 2026-10-16 — Gắn tóm tắt hồ sơ ăn uống vào trang Hồ sơ

- Kết quả: Đổi tóm tắt Hồ sơ ăn uống từ thẻ nổi thành một phần liền mạch ngay dưới thông tin cá nhân, cùng nền và chỉ ngăn bằng đường kẻ. Giữ sticker, thêm liên kết Xem chi tiết và hai cột Không ăn/Thích theo giao diện web. Dữ liệu Không ăn tiếp tục lấy từ API hiện có; cột Thích chỉ hiện trạng thái chưa chọn vì API chưa lưu sở thích.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint` và `git diff --check` đạt. Bước UI trên điện thoại: mở tab Tôi, xem phần ăn uống liền với hồ sơ, chạm Xem chi tiết, thử hồ sơ có/không có thực phẩm cần tránh và trạng thái tải/lỗi; kiểm tra cỡ chữ, bố cục trên màn hình hẹp. Chưa kiểm tra trực quan trên thiết bị ở task này.
- Người thực hiện: Nhóm frontend.

## 2026-10-23 — Đồng bộ tính năng Đợt 1: Cloudinary, Turnstile, quên mật khẩu

- Kết quả: (T1) Đăng video chuyển từ Mux sang Cloudinary: schema `POST /media/uploads` nhận `upload: {url, fields, chunkSize}`, `uploadVideoToCloudinary` gửi multipart (XHR) kèm `fields`, chia chunk với `X-Unique-Upload-Id`/`Content-Range`, có tiến trình %, hỗ trợ `AbortSignal`, vẫn `DELETE /media/:id` khi lỗi. (T2/T16) Thêm `TurnstileChallenge` dùng chung (WebView trên native, script trực tiếp trên web); đăng nhập gửi `turnstileToken`, khóa nút tới khi có token, reset widget sau mỗi lần thử, xử lý `CAPTCHA_FAILED`; chat khách ở tab Vedora AI mở modal Turnstile để lấy token cho `startGuestSession`. Cấu hình `EXPO_PUBLIC_TURNSTILE_SITE_KEY` (dev dùng test key) và `EXPO_PUBLIC_TURNSTILE_ORIGIN`. (T3) Thêm màn Quên mật khẩu và Đặt lại mật khẩu bằng mã OTP 6 số (`/auth/password/forgot`, `/auth/password/reset`), liên kết “Quên mật khẩu?” ở đăng nhập, về login kèm thông báo.
- Giới hạn tích hợp: cần dev build mới (thêm `react-native-webview`). Production phải đặt site key thật và hostname trong `EXPO_PUBLIC_TURNSTILE_ORIGIN` được widget cho phép. Upload native dùng `File.slice` làm phần của FormData — chưa kiểm chứng trên thiết bị.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, bundle Android/web đạt. Bước UI: đăng nhập (nút khóa tới khi widget xong, sai mật khẩu thì widget reset); Vedora AI → Xác minh và bắt đầu → hỏi thử; Quên mật khẩu → nhập email → nhập mã + mật khẩu mới → về đăng nhập; đăng video nhỏ và video lớn hơn `chunkSize`, hủy giữa chừng, tắt mạng. Chưa chạy trên thiết bị.
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của nhóm frontend.

## 2026-10-23 — Đồng bộ tính năng Đợt 2: chi tiết bài, hồ sơ người khác, công thức API, thông báo

- Kết quả: (T4) Màn chi tiết bài `/posts/[id]` (`GET /posts/:id`) với bình luận phân trang cursor, thêm/sửa/xóa (chỉ chủ bình luận), khách đọc được và được chuyển đăng nhập khi thao tác; nút repost (PUT/DELETE), menu “…” có Chia sẻ (link `EXPO_PUBLIC_WEB_URL/posts/:id`) và Báo cáo (ẩn với bài của mình, bỏ qua `ALREADY_REPORTED`). Thẻ bài chạm bình luận → chi tiết; mọi thay đổi like/lưu/repost/bình luận được vá vào mọi cache bài viết. (T8) Hồ sơ người khác `/profile/[id]` với nút Theo dõi (optimistic, rollback), danh sách followers/following, chạm avatar/tên tác giả ở thẻ bài hoặc bình luận để mở hồ sơ; id của mình chuyển về tab Tôi; số theo dõi trên hồ sơ của mình chạm được. (T12) Tab Công thức dùng `GET /recipes` (tìm `q` debounce, lọc “Hợp với hồ sơ ăn uống của tôi” khi đã đăng nhập, phân trang) và chi tiết `/recipes/[id]` (nguyên liệu, cách làm, cảnh báo kết hợp). (T11) Màn `/notifications` (danh sách, đánh dấu đã đọc từng cái/tất cả, chạm → bài viết hoặc hồ sơ), chuông có badge chưa đọc ở header Khám phá, SSE `GET /notifications/sse` bằng `expo/fetch` khi app foreground, tự kết nối lại sau 5s, ngắt khi background; không làm push.
- Giới hạn tích hợp: màn hồ sơ người khác viết riêng, chưa tách chung với `profile-screen.tsx` của tôi (chỉ trùng phần header). Tab Công thức bỏ dữ liệu tĩnh cũ (`showcase-posts` vẫn dùng cho feed trống). Ảnh trong bài (IMAGE) vẫn chưa hiển thị như trước. Web hiện không có tab thông báo riêng nên badge ở header Khám phá.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, bundle Android/web đạt. Bước UI: mở bài từ feed → bình luận, sửa, xóa; repost, chia sẻ, báo cáo bài người khác (không thấy với bài của mình); chạm tác giả → theo dõi/bỏ theo dõi, xem followers/following, kiểm tra feed Đang theo dõi; tab Công thức tìm “đậu”, bật lọc hợp với tôi, mở chi tiết; đăng nhập hai tài khoản, tài khoản A like/bình luận/theo dõi tài khoản B và xem badge/toast cập nhật realtime ở B. Chưa chạy trên thiết bị/API thật.
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của nhóm frontend.

## 2026-10-23 — Đồng bộ tính năng Đợt 3: bài đã lưu, tìm kiếm, ảnh hồ sơ/username, gợi ý theo dõi

- Kết quả: (T6) Màn `/bookmarks` (`GET /posts/bookmarks`), vào từ tab Tôi; bỏ lưu ở thẻ bài cập nhật cả feed lẫn danh sách. (T7) Màn `/search` (`GET /posts/search?q=&cursor=`, debounce 350ms, tối đa 200 ký tự, phân trang), vào từ biểu tượng kính lúp ở header Khám phá. (T9) Trong form Chỉnh sửa hồ sơ: chọn/cắt ảnh bằng `expo-image-picker` (avatar 1:1, bìa 3:1), luồng `POST /profiles/me/images/uploads` → PUT lên storage → `activate` (thử lại khi 409), xóa ảnh `DELETE /profiles/me/images/:kind`, kiểm tra loại/dung lượng (5 MB avatar, 10 MB bìa); đổi tên đăng nhập `PATCH /users/:id`, báo trùng khi 409. (T10) Hàng “Gợi ý theo dõi” cuộn ngang ở đầu tab Đang theo dõi (`GET /profiles/suggestions`), theo dõi hoặc ẩn gợi ý (`DELETE /profiles/suggestions/:id`), cập nhật ngay trên giao diện và hoàn tác khi lỗi.
- Giới hạn tích hợp: ảnh đã chọn đi qua bộ cắt gốc của hệ điều hành nên có thể được nén lại; dung lượng kiểm tra theo `fileSize` của picker. `userId` cho đổi username lấy từ `profile.id` (cùng id người dùng ở web). Header Khám phá dời chuông sang phải để chứa kính lúp.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, bundle Android/web đạt. Bước UI: lưu/bỏ lưu bài ở feed rồi mở Tôi → Bài viết đã lưu; tìm “đậu” và cuộn tải thêm; Tôi → Chỉnh sửa hồ sơ → đổi/xóa avatar và ảnh bìa, đổi username (thử tên đã tồn tại); đăng nhập tài khoản chưa theo dõi ai, mở Đang theo dõi → theo dõi và ẩn một gợi ý. Chưa chạy trên thiết bị/API thật.
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của nhóm frontend.

## 2026-10-23 — Chặn người đã đăng nhập vào các trang xác thực

- Kết quả: Thêm `GuestOnly` bọc các route đăng nhập, đăng ký, xác minh email, quên và đặt lại mật khẩu; người đã có phiên được chuyển thẳng về `returnTo` hợp lệ (mặc định Khám phá) thay vì thấy form. Trước đó chỉ trang chào `/` có kiểm tra phiên.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, bundle web đạt. Bước UI: đăng nhập rồi vuốt/nhấn quay lại hoặc mở thẳng `/login`, `/register`, `/forgot-password` → vào Khám phá, không thấy form; đăng xuất → các trang này mở lại bình thường; đăng nhập từ tab Tôi → quay lại đúng tab Tôi. Chưa chạy trên thiết bị.
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của nhóm frontend.

## 2026-10-23 — Thiết kế lại màn Chào mừng

- Kết quả: Thay thẻ xanh phía trên bằng banner ảnh tràn từ mép trên (cả vùng status bar), cao khoảng nửa màn hình, chỉ bo hai góc dưới (36), phủ lớp tối nhẹ để chữ “Ăn sạch, Sống xanh.” dễ đọc. Bỏ hàng sticker và thẻ viền; phần dưới là tiêu đề chào mừng, nút chính “Khám phá bài viết” (kèm mũi tên), dải “hoặc”, rồi hai nút ngang hàng “Đăng nhập” (viền) và “Tạo tài khoản” (nền nhạt).
- Giới hạn: ảnh banner lấy trực tiếp từ link Pinterest (`i.pinimg.com`), có thể bị chặn hoặc đổi link; nên tải về `assets/branding/` khi chốt ảnh. Khi ảnh chưa tải, nền xanh rừng hiện thay thế.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint` đạt. Bước UI: mở app khi chưa đăng nhập, kiểm tra banner tràn dưới status bar, hai góc dưới bo, chữ đọc rõ trên ảnh; bấm từng nút; thử màn nhỏ/lớn và chế độ tối. Chưa chạy trên thiết bị.
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của nhóm frontend.

## 2026-10-23 — Trợ lý Vedora trả lời dạng stream (gõ dần)

- Kết quả: Viết lại `requestAiStream` dùng `fetch` của `expo/fetch` và đọc `response.body` từng đoạn thay vì chờ Axios trả đủ. Parser SSE chạy tăng dần (`AiStreamParser`), gọi `onText` sau mỗi `text-delta`; vẫn giữ Bearer của khách, refresh một lần khi 401 với phiên tài khoản, mã lỗi quota/`ApiError`, timeout 120s và huỷ bằng `AbortSignal`. Chat khách (tab Vedora AI) và chat Lên thực đơn hiển thị chữ hiện dần kèm con trỏ ▍; chỉ hiện “đang suy nghĩ” cho tới khi có chữ đầu tiên. Lỗi giữa chừng gỡ câu hỏi và phần trả lời dở, trả lại nội dung để gửi lại. Đề xuất thực đơn và cờ `refused` vẫn lấy ở cuối stream.
- Giới hạn: nếu server hoặc proxy (Cloudflare/Nginx) gom đệm phản hồi thì chữ vẫn có thể ra thành cục lớn, chỉ kiểm chứng được với server thật.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, bundle Android/web đạt. Bước UI: tab Vedora AI → xác minh → hỏi một câu, xem chữ hiện dần; bấm làm mới giữa chừng; tab Lên thực đơn → Trò chuyện → yêu cầu đổi món, xem chữ dần rồi nút “Xem đề xuất”; tắt mạng giữa chừng để kiểm tra khôi phục nội dung. Chưa chạy trên thiết bị/API thật.
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của nhóm frontend.

## 2026-10-23 — Trợ lý Vedora không đòi xác minh với người đã đăng nhập

- Kết quả: Chat ở tab Vedora AI nhận biết phiên tài khoản. Khi đã đăng nhập, bỏ thẻ “Xác minh để hỏi thử” và thẻ hết lượt khách, mở ô nhập ngay, và gửi câu hỏi qua trợ lý tài khoản `POST /meal-plan/chat` (dùng phiên đăng nhập, tự refresh khi 401) thay vì phiên khách Turnstile. Khách chưa đăng nhập giữ nguyên luồng xác minh và giới hạn lượt. Đăng nhập xong thì trạng thái hết lượt khách cũ không còn hiển thị; phiên hết hạn báo “Vui lòng đăng nhập lại”.
- Giới hạn: giới hạn lượt của tài khoản do server quyết định (429 báo “gửi hơi nhanh”); app không tự đặt hạn mức.
- Kiểm tra: `npx tsc --noEmit`, `npx expo lint`, bundle web đạt. Bước UI: khách hỏi 3 lần đến khi hết lượt → Đăng nhập → quay lại tab Vedora AI: không còn form xác minh, hỏi được ngay; đăng xuất → form xác minh quay lại; hết hạn phiên giữa chừng. Chưa chạy trên thiết bị/API thật.
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của nhóm frontend.

## 2026-10-23 — Thiết kế lại màn Hồ sơ (tab Tôi) và tách màn Chỉnh sửa hồ sơ

- Kết quả: Tab Tôi chuyển sang bố cục thẻ bo góc: header “Hồ sơ” + @username với hai nút tròn bên phải là **Bài viết đã lưu** (biểu tượng bookmark) và **Đăng xuất** (màu đỏ, hỏi xác nhận trước khi thoát; web dùng `window.confirm`). Thẻ chính gồm ảnh bìa, avatar căn giữa, tên + huy hiệu chuyên gia, bio, ngày tham gia, hàng thống kê 3 cột (Bài viết / Người theo dõi / Đang theo dõi — chạm được) và nút “Chỉnh sửa hồ sơ”. Thẻ Hồ sơ ăn uống hiển thị dạng chip (tối đa 6, kèm “+N”), chạm cả thẻ để mở chi tiết. Bài viết/Video đổi thành segmented control. Chỉnh sửa hồ sơ chuyển sang màn con `/edit-profile` với ba nhóm lưu độc lập: Ảnh hồ sơ (xem trước bìa + avatar, đổi/xóa), Thông tin công khai (tên, giới thiệu, nút Lưu chỉ bật khi có thay đổi), Tài khoản (tên đăng nhập có tiền tố @). Tách `ProfileAvatar` dùng chung.
- Giới hạn: bỏ dòng “Thích: Chưa chọn” (dữ liệu tĩnh) ở thẻ ăn uống. Màn hồ sơ người khác chưa áp dụng giao diện mới.
- Bước kiểm tra UI: (1) Đăng nhập → tab Tôi: thấy header có nút bookmark và nút đăng xuất, thẻ hồ sơ với avatar giữa và hàng 3 số liệu. (2) Chạm “Người theo dõi”/“Đang theo dõi” → mở đúng danh sách; chạm “Bài viết” → về tab Bài viết. (3) Chạm thẻ Hồ sơ ăn uống → mở `/dietary-profile`; khai báo >6 mục rồi quay lại thấy chip “+N”. (4) Chuyển Bài viết ↔ Video ở segmented control. (5) Chạm bookmark → mở Bài viết đã lưu. (6) Chạm “Chỉnh sửa hồ sơ” → màn con: đổi/xóa avatar, ảnh bìa (thấy xem trước cập nhật); sửa tên/giới thiệu → nút Lưu sáng lên → Lưu → thấy “Đã lưu thông tin hồ sơ.”; đổi username (thử tên trùng). Quay lại → tab Tôi hiển thị dữ liệu mới. (7) Chạm đăng xuất → Hủy thì ở lại; Đăng xuất thì về màn Chào mừng. (8) Kiểm tra chế độ tối. Chưa chạy trên thiết bị/API thật.
- Người thực hiện: Claude (Opus 5.5), theo yêu cầu của Vy Ngo Chi.

## 2026-10-23 — Đối chiếu nhóm API post-interactions

- Kết quả: So 11 endpoint `post-interactions` trên Swagger (`/docs`) với mobile. Like, lưu, repost (PUT/DELETE, response `isLiked/likeCount`, `isBookmarked`, `isReposted/repostCount`), bình luận (GET phân trang cursor, POST, PATCH, DELETE) và báo cáo (6 lý do, `details` ≤ 500, 409 `ALREADY_REPORTED`) đã được tích hợp từ Đợt 2–3 và khớp hợp đồng. Bổ sung phần còn thiếu: API cho **tác giả bài viết** xóa bình luận của người khác, nên màn chi tiết bài giờ hiện nút “Xóa” trên mọi bình luận khi bạn là chủ bài; “Sửa” vẫn chỉ hiện với bình luận của chính mình.
- Giới hạn: quyền xóa của admin chưa hiển thị vì mobile chưa lưu `role` của người dùng (admin thao tác trên web).
- Bước kiểm tra UI: (1) Tài khoản A đăng bài, tài khoản B bình luận vào bài đó. (2) Đăng nhập A → mở bài → bình luận của B có nút “Xóa”, không có “Sửa”. (3) Chạm Xóa → xác nhận → bình luận biến mất, số bình luận giảm 1. (4) Đăng nhập B → mở bài của người khác → chỉ thấy Sửa/Xóa trên bình luận của mình. (5) Like, lưu, repost, báo cáo trên thẻ bài vẫn hoạt động như trước. Chưa chạy trên thiết bị/API thật.
- Người thực hiện: Claude (Opus 5.5), theo yêu cầu của Vy Ngo Chi.

## 2026-10-23 — Sửa lỗi đăng video hướng dẫn trên Android/iOS (lỗi Blob, treo 0%)

- Kết quả: (1) Lỗi “Creating blobs from ArrayBuffer and ArrayBufferView are not supported” do `File.slice()` của `expo-file-system` tạo `Blob` từ byte, mà React Native không hỗ trợ. (2) Bản vá đầu tự dựng multipart rồi gửi `Uint8Array` qua XHR thì treo ở 0%, vì RN mã hóa base64 bằng vòng lặp JS và API trả `chunkSize` = 20 MB. Giờ trên native video đi bằng upload task multipart gốc của `expo-file-system` (`createUploadTask`, `UploadType.MULTIPART`, `sessionType: foreground`), không còn byte nào đi qua JS: video ≤ `chunkSize` gửi thẳng file gốc; video lớn hơn được chép từng đoạn ra file tạm trong cache rồi gửi kèm `X-Unique-Upload-Id`/`Content-Range`, xóa file tạm khi xong hoặc lỗi. Tiến độ lấy từ `onProgress` của task, hủy bằng `AbortSignal`. Web giữ nguyên `File.slice` + `FormData` qua XHR.
- Giới hạn: chưa chạy trên thiết bị thật nên chưa xác nhận Cloudinary nhận multipart native (các trường đã ký được gửi dạng tham số form) và chưa đo tốc độ; tiến độ native có thể gồm cả phần khung multipart nên chỉ xấp xỉ.
- Bước kiểm tra UI: (1) Đăng nhập trên Android hoặc iOS (Expo Go hoặc development build) → Khám phá → soạn bài → chọn video ≤ 3 phút. (2) Nhập tiêu đề, mô tả → đăng → phần trăm phải nhích lên và đạt 100%, không treo ở 0%, không báo lỗi Blob. (3) Thử video nhỏ hơn 20 MB (một lần gửi) và lớn hơn 20 MB (nhiều đoạn). (4) Bài chuyển sang trạng thái đang xử lý rồi phát được video. (5) Tắt mạng giữa chừng → báo lỗi, đăng lại được. (6) Trên web đăng video vẫn bình thường.
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của Vy Ngo Chi.

## 2026-10-23 — Đăng video chạy nền, thoát form vẫn xem được tiến độ

- Kết quả: Bấm “Đăng video” giờ kiểm tra nội dung rồi đóng form ngay, việc tải video và tạo bài chạy nền trong store \`video-publish-store\` (không phụ thuộc form). Trang chính hiện thẻ trạng thái dưới thanh lọc: đang tải (thanh tiến độ + %), đang đăng bài, thành công (tự ẩn sau 8 giây), đang xử lý, hoặc lỗi kèm nút “Thử lại” và dấu ✕ để bỏ. Thử lại sau lỗi bỏ qua bước tải nếu video đã lên Cloudinary; bỏ một job lỗi thì xóa media đã tải. Chỉ cho một video đăng cùng lúc (đăng tiếp sẽ báo “đang được đăng”). Form không còn màn “Đã gửi nội dung” và trạng thái đang gửi.
- Giới hạn: thẻ trạng thái chỉ hiện ở tab Khám phá (kể cả khi đang ở “Đang theo dõi”); job mất nếu thoát hẳn app, và việc tải có thể dừng khi app xuống nền. Bài ở trạng thái “đang xử lý” không tự làm mới feed.
- Bước kiểm tra UI: (1) Đăng nhập → Khám phá → soạn → Video hướng dẫn → chọn video, nhập tiêu đề, mô tả → “Đăng video”. (2) Form đóng ngay, thẻ trạng thái hiện ở trang chính với % tăng dần. (3) Trong lúc tải, chuyển tab khác rồi quay lại Khám phá → thẻ vẫn còn và tiếp tục tăng. (4) Mở form soạn khi video đang tải, đăng tiếp → báo đang có video khác. (5) Xong → “Đã đăng video thành công”, tự ẩn; kéo làm mới thấy bài. (6) Tắt mạng giữa chừng → thẻ đỏ, bấm Thử lại → tiếp tục; bấm ✕ → thẻ biến mất. (7) Chọn video quá 3 phút vẫn báo lỗi ngay trong form.
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của Vy Ngo Chi.

## 2026-10-23 — Sửa schema bản tin sau khi API chuyển video sang Cloudinary

- Kết quả: API đã bỏ `playbackId` (Mux) ở `media`, thay bằng `publicId`, `playbackUrl` (HLS), `posterUrl` và `captions`. Schema cũ đòi `playbackId` nên cả trang bản tin bị Zod từ chối, không tải được. Cập nhật `feed.schema.ts` theo `MediaResponseDto` (thêm `playbackUrl`, `posterUrl`, `publicId`, `captions` mặc định rỗng). `feed-video.tsx` phát thẳng `playbackUrl`, dùng `posterUrl` làm ảnh bìa (bỏ link Mux) và lấy khung hình theo `aspectRatio` (giới hạn 9:16 – 16:9), nên video dọc không còn bị thu nhỏ trong khung 16:9. Đã kiểm tra bằng đúng JSON mẫu: schema cũ lỗi ở `media.0.playbackId`, schema mới hợp lệ.
- Giới hạn: phụ đề (`captions`) mới được nhận vào dữ liệu, chưa hiển thị trong trình phát; chưa phát thử HLS Cloudinary trên thiết bị.
- Bước kiểm tra UI: (1) Mở tab Khám phá → bản tin tải được, bài có video hiện ảnh bìa và nút phát. (2) Chạm phát → video chạy; video dọc có khung cao hơn video ngang. (3) Bài có video đang xử lý hiện “Video đang được xử lý”. (4) Mở chi tiết bài, hồ sơ, bài đã lưu, tìm kiếm → vẫn hiển thị bài có video.
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của Vy Ngo Chi.

## 2026-10-23 — Thu nhỏ video trong bài và sửa ô bình luận bị bàn phím che

- Kết quả: (1) Video trong bài không còn chiếm hết chiều ngang: khung vừa với tỉ lệ thật (`aspectRatio`), cao tối đa 240 và rộng tối đa 85% bề ngang bài, canh trái; nút phát, huy hiệu và thời lượng thu nhỏ theo, ô “đang xử lý” cũng gọn hơn. (2) Màn chi tiết bài: tách bình luận thành danh sách cuộn được (`CommentList`) và ô nhập ghim cố định ở đáy (`CommentComposer`), đặt trong `KeyboardAvoidingView` nên bàn phím đẩy ô nhập lên, không che; ô nhập tự giãn tới 120 chữ cao, nút Gửi bên cạnh, bỏ khoảng đệm an toàn đáy khi bàn phím mở. Trạng thái nháp dùng chung qua hook `useCommentDraft` (sửa bình luận từ danh sách vẫn nạp vào ô nhập).
- Giới hạn: không đặt keyboardVerticalOffset vì view cha nằm ở đỉnh màn hình (đặt offset sẽ làm ô nhập cách bàn phím một khoảng); chưa thử trên thiết bị thật (đặc biệt Android edge-to-edge).
- Bước kiểm tra UI: (1) Khám phá → bài có video: video nhỏ hơn, video dọc cao tối đa 240; chạm phát vẫn chạy trong cùng khung. (2) Chạm biểu tượng bình luận để mở chi tiết bài → ô “Viết bình luận…” nằm cố định ở đáy. (3) Chạm vào ô nhập → bàn phím mở, ô nhập nằm ngay trên bàn phím, không bị che; gõ nhiều dòng thấy ô giãn. (4) Gửi bình luận → xuất hiện trong danh sách. (5) Chạm “Sửa” ở bình luận của mình → nội dung nạp vào ô nhập, hiện “Đang sửa bình luận / Hủy sửa”. (6) Khách chưa đăng nhập: đáy hiện “Đăng nhập để bình luận”.
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của Vy Ngo Chi.

## 2026-10-23 — Gọn thẻ tạo nội dung và sửa nút đóng bị đẩy ra ngoài vùng an toàn

- Kết quả: Thẻ tạo nội dung ở trang Khám phá chỉ còn avatar và thanh “Chia sẻ cách nấu món chay của bạn” (chạm để mở màn chọn loại bài); bỏ hàng hai nút “Thêm video” và “Tạo nội dung” cùng mã/kiểu liên quan. Màn chọn loại bài đăng: `SafeAreaView` đặt bên trong `Modal` trả về inset bằng 0 nên thanh tiêu đề và nút đóng (X) chui dưới thanh trạng thái. Nay đọc inset bằng `useSafeAreaInsets` ở ngoài Modal rồi đệm trên/dưới cho tờ đăng bài toàn màn hình (màn rộng không đệm).
- Giới hạn: chưa thử trên thiết bị có tai thỏ/đảo động và điều hướng 3 nút.
- Bước kiểm tra UI: (1) Đăng nhập → Khám phá: thẻ trên cùng chỉ có avatar và thanh “Chia sẻ cách nấu món chay của bạn”. (2) Chạm thanh đó → màn Tạo nội dung mở; tiêu đề và nút X nằm dưới thanh trạng thái, chạm được. (3) Chọn “Tạo video hướng dẫn” → nút quay lại và X vẫn trong vùng an toàn; nút “Đăng video” ở đáy không bị thanh điều hướng che. (4) Xoay ngang/màn rộng: tờ đăng bài dạng hộp giữa vẫn bình thường. (5) Khách chưa đăng nhập chạm thanh → chuyển sang đăng nhập.
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của Vy Ngo Chi.

## 2026-10-23 — Đồng bộ màu vùng an toàn với thanh tiêu đề và hiện lại đồng hồ/biểu tượng trạng thái

- Kết quả: (1) Vùng an toàn phía trên (nền `background`) khác màu thanh tiêu đề (nền `card`) ở nhiều màn nên thấy hai dải màu lệch nhau; nay thanh tiêu đề của Khám phá, Hồ sơ ăn uống, Trợ lý/Lên thực đơn, Thông báo, Bài đã lưu, Chi tiết bài, Tìm kiếm, danh sách theo dõi, Hồ sơ người khác, Chi tiết công thức và Trợ lý Vedora dùng cùng màu `background` với vùng an toàn. (2) Tờ đăng bài toàn màn hình: đệm trên chuyển vào chính thanh tiêu đề nên màu thanh tiêu đề chạy lên tận mép trên. (3) Thêm `StatusBar style="auto"` ở layout gốc để đồng hồ, pin, sóng luôn tương phản với nền (chữ đậm trên nền sáng, chữ sáng trên nền tối); màn Chào mừng vẫn tự đặt chữ sáng trên banner ảnh.
- Giới hạn: chưa thử trên thiết bị thật (Android edge-to-edge, iOS có tai thỏ, chế độ tối); các thẻ bên trong màn vẫn dùng màu `card` như cũ.
- Bước kiểm tra UI: (1) Khám phá, Hồ sơ, Thông báo, Chi tiết bài, Tìm kiếm, Bài đã lưu: dải trên cùng và thanh tiêu đề cùng một màu liền mạch, không có đường lệch màu. (2) Đồng hồ, pin, sóng hiển thị rõ ở chế độ sáng và tối. (3) Mở màn Tạo nội dung: thanh tiêu đề phủ tới mép trên, nút X chạm được. (4) Màn Chào mừng: biểu tượng trạng thái màu sáng trên ảnh banner; vào màn khác thì đổi lại cho đúng.
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của Vy Ngo Chi.

## 2026-10-27 — Bấm vào bài viết để mở chi tiết

- Kết quả: Trước đây chỉ nút bình luận mới mở chi tiết bài; bấm vào nội dung bài ngắn hay thẻ Blog thì không có phản hồi. Nay bấm vào nội dung bài hoặc thẻ Blog (ảnh bìa, tiêu đề, tóm tắt) sẽ mở màn Chi tiết bài; "Xem thêm/Thu gọn" vẫn chỉ mở rộng tại chỗ. Ở màn Chi tiết, tóm tắt Blog hiển thị đầy đủ thay vì cắt 2 dòng.
- Giới hạn: API `GET /posts/:id` chỉ trả tiêu đề và đoạn tóm tắt (đã cắt) cho Blog nên chưa đọc trọn bài Blog; chưa chạy lint/tsc và chưa thử trên thiết bị vì công cụ shell lỗi tạm thời.
- Bước kiểm tra UI: (1) Vào Khám phá, bấm vào đoạn chữ của một bài ngắn: mở màn "Bài viết" kèm bình luận. (2) Bấm vào thẻ Blog: mở màn chi tiết, tóm tắt hiện đầy đủ. (3) Với bài dài, bấm "Xem thêm": nội dung mở rộng tại chỗ, không chuyển màn. (4) Trong màn chi tiết, bấm vào nội dung không điều hướng lại chính nó; nút quay lại về Khám phá.
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của Vy Ngo Chi.

## 2026-10-27 — Chi tiết Blog hiển thị toàn bộ bài (theo vedora-frontend)

- Kết quả: Theo `post-detail.tsx` và `blog-markdown.tsx` của vedora-frontend, bài Blog ở màn Chi tiết nay tải nội dung đầy đủ từ `GET /blogs/:id` (feed chỉ có tóm tắt). Thêm module `features/blogs` (schema Zod, service, hook TanStack Query, bộ đọc Markdown và `BlogArticle`) hiển thị tiêu đề, đề mục, đoạn văn, đậm/nghiêng, mã, danh sách, trích dẫn, đường kẻ, liên kết (chỉ http/https/mailto), ảnh và video (video mở bằng liên kết). HTML thô trong bài không được hiển thị. Thẻ tóm tắt Blog được thay bằng bài đầy đủ ở màn Chi tiết.
- Giới hạn: chưa gộp nhiều ảnh liền nhau thành thư viện ảnh như web; video trong bài mở ngoài ứng dụng; chưa gửi lượt xem; chưa chạy lint/tsc và chưa thử trên thiết bị vì công cụ shell lỗi tạm thời.
- Bước kiểm tra UI: (1) Vào Khám phá, chọn tab Blog, bấm vào một bài Blog. (2) Màn "Bài viết" hiện vòng tải rồi tiêu đề và toàn bộ nội dung (đề mục, danh sách, ảnh) thay vì chỉ đoạn tóm tắt. (3) Bấm một liên kết trong bài: mở trình duyệt. (4) Tắt mạng rồi mở lại bài: hiện "Chưa tải được nội dung blog" và nút "Thử lại" hoạt động. (5) Kéo xuống: phần thả mầm/lưu và bình luận vẫn dùng được.
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của Vy Ngo Chi.

## 2026-10-27 — Tab Trợ lý Vedora tạo thực đơn, tab Thực đơn chỉ hiển thị

- Kết quả: Giữ tab Trợ lý Vedora với biểu tượng hạt đậu mầm cũ ở giữa thanh tab. Đã tách màn "Lên thực đơn" cũ làm hai: tab Trợ lý Vedora (đã đăng nhập) chứa khung trò chuyện và biểu mẫu yêu cầu thực đơn; tab Thực đơn chỉ hiển thị thực đơn tuần đã lưu và bản đề xuất của trợ lý (Lưu thực đơn, Bỏ đề xuất, Đổi món). Hai tab dùng chung một phiên (`MealPlannerProvider`) nên đề xuất, bản nháp và nội dung chat được giữ khi đổi tab. Khách chưa đăng nhập vẫn dùng khung hỏi nhanh dinh dưỡng ở tab Trợ lý; tab Thực đơn mời đăng nhập. Đã gỡ nút hạt đậu nổi và nút đóng thêm ở lần sửa trước.
- Giới hạn: chưa chạy lint/tsc và chưa thử trên thiết bị vì công cụ shell lỗi tạm thời; hai file không còn dùng (`meal-planner-screen.tsx`, `assistant-button.tsx`) chưa xoá được và cần xoá thủ công.
- Bước kiểm tra UI: (1) Đăng nhập, thanh tab có Trang chủ, Công thức, Trợ lý (hạt đậu mầm), Thực đơn, Tôi. (2) Tab Trợ lý: bấm "Lên thực đơn 7 ngày", điền biểu mẫu rồi tiếp tục, tin nhắn được điền sẵn, bấm gửi. (3) Khi trợ lý đề xuất, bấm "Xem trong Thực đơn": app chuyển sang tab Thực đơn, hiện "Đề xuất chưa được lưu" và các ngày. (4) Bấm "Lưu thực đơn": thực đơn tuần cập nhật; hoặc "Bỏ đề xuất". (5) Ở tab Thực đơn bấm "Đổi món": chuyển về tab Trợ lý với câu yêu cầu điền sẵn. (6) Tab Thực đơn không có khung chat. (7) Đăng xuất: tab Trợ lý là khung hỏi nhanh, tab Thực đơn hiện nút Đăng nhập.
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của Vy Ngo Chi.

## 2026-11-06 — Lộ trình đồng bộ tính năng web → mobile (ROADMAP)

- Kết quả: Đối chiếu lại vedora-frontend (main, tới `9b1d532`) với mobile và viết `docs/ROADMAP.md` liệt kê tính năng web còn thiếu trên mobile: xóa bài của mình, lưu/đánh giá công thức, danh sách đi chợ, đếm lượt xem, viết/sửa Blog, sở thích nguyên liệu, xác minh chuyên gia, gói Pro/Premium, đăng nhập Google, chọn thú cưng; kèm thứ tự đợt làm, việc dọn dẹp và gợi ý riêng cho mobile (push, deep link, ngoại tuyến). Chỉ là tài liệu, chưa đổi code.
- Giới hạn: đối chiếu theo code hai repo, chưa chạy thử web; đường dẫn API từng mục cần đọc lại ở code web khi bắt tay làm. Gói Pro/Premium cần chốt chính sách thanh toán trong app trước.
- Bước kiểm tra UI: không có (chỉ thêm tài liệu).
- Người thực hiện: Claude (Sonnet 5.5), theo yêu cầu của Vy Ngo Chi.

## 2026-11-06 — Đồng bộ mã nguồn từ GitHub

- Kết quả: Đồng bộ main về origin/main tại commit 07af2a3; lưu lịch sử local trước đồng bộ ở nhánh backup/main-before-sync-20261106 do remote đã viết lại lịch sử.
- Kiểm tra UI: Chưa chạy ứng dụng; bước kiểm tra đề xuất là mở app, đăng nhập, xem bảng tin, hồ sơ và tab Trợ lý/Thực đơn.
- Người thực hiện: Codex.

## 2026-11-06 — Khởi động Expo và cung cấp QR

- Kết quả: Chạy Metro ở chế độ Expo Go/LAN tại địa chỉ LAN do Expo hiển thị; tạo ảnh QR tại .expo/expo-qr.png. Server phản hồi packager-status:running.
- Kiểm tra UI: Điện thoại và máy tính dùng cùng mạng Wi-Fi; mở Expo Go, quét QR, chờ tải ứng dụng rồi kiểm tra màn hình đầu tiên. Chưa xác nhận trên điện thoại.
- Người thực hiện: Codex.

## 2026-11-06 — Cập nhật QR sau khi IP Wi-Fi thay đổi

- Kết quả: Phát hiện QR cũ trỏ tới IP LAN của máy phát triển trong khi IP Wi-Fi hiện tại là IP LAN của máy phát triển. Khởi động lại Expo Go/LAN tại địa chỉ LAN do Expo hiển thị và tạo QR mới ở .expo/expo-qr-current.png; địa chỉ LAN phản hồi packager-status:running. Người dùng báo Request timeout; cần thử QR mới để xác nhận hết lỗi trên điện thoại.
- Bước kiểm tra UI: Kết nối điện thoại cùng Wi-Fi với máy tính, đóng lần tải cũ trong Expo Go và quét QR mới; chờ tải màn hình đầu tiên. Chưa xác nhận kết quả trên điện thoại.
- Người thực hiện: Codex.
- Chẩn đoán bổ sung: Manifest trả HTTP 500 (UnexpectedServerError) khi CLI chạy online; chạy lại bằng expo start --go --offline --port 8081 thì manifest Android trả HTTP 200 tại IP LAN mới. Chế độ offline chỉ áp dụng cho Expo CLI; chưa xác nhận hết timeout trên điện thoại.
- Kiểm tra tải ứng dụng: Manifest Android và bundle đều HTTP 200; bundle gồm 2346 modules, tải thành công 12.264.589 byte. Chưa kiểm tra trực tiếp trên điện thoại.

## 2026-11-06 — Nâng Expo SDK 58 để chạy trên Expo Go iPhone

- Kết quả: Nâng Expo và các thư viện tương thích lên SDK 58, React 19.3, React Native 0.88; cập nhật config plugin và lockfile. Chuyển kiểu ref/danh sách theo API mới, xử lý chế độ màu chưa xác định và chờ đọc/ghi xong từng phần video trước khi upload. Khởi động lại Expo; manifest iOS xác nhận exposdk:58.0.0. Chưa xác nhận kết quả trực tiếp trên iPhone.
- Bước kiểm tra UI: (1) Trên iPhone, chọn Go home để thoát màn lỗi SDK cũ. (2) Kết nối cùng Wi-Fi với máy tính, quét QR mới bằng Camera/Expo Go. (3) Chờ mở màn chào hoặc bảng tin, xác nhận không còn báo lệch SDK. (4) Chuyển qua Công thức, Trợ lý, Thực đơn và Tôi; cuộn danh sách và thử giao diện sáng/tối. (5) Đăng nhập, chọn video lớn và thử đăng để kiểm tra tiến trình tải từng phần.
- Người thực hiện: Codex.

## 2026-11-06 — Sửa lỗi tài khoản Expo Go khi mở trên iPhone

- Kết quả: Log iOS báo Expo Go đã đăng nhập nhưng CLI không gửi tài khoản khi chạy offline. Xác nhận CLI dùng cùng tài khoản với iPhone và khởi động lại Expo online qua mạng LAN. Giữ địa chỉ địa chỉ LAN do Expo hiển thị và QR SDK 58 hiện tại.
- Bước kiểm tra UI: (1) Giữ đăng nhập tài khoản hiện tại trong Expo Go trên iPhone. (2) Bấm Try Again trên màn lỗi, hoặc Go home rồi quét QR SDK 58. (3) Chờ tải app và xác nhận màn lỗi tài khoản không còn xuất hiện. Chưa xác nhận trực tiếp trên điện thoại.
- Người thực hiện: Codex.

## 2026-11-06 — Chạy lại Expo login theo yêu cầu

- Kết quả: Chạy Expo login; bước tự mở trình duyệt của CLI lỗi trên Windows nên chạy lại với trình duyệt mở thủ công và giữ phiên callback chờ xác thực. Chưa xác nhận hoàn tất đăng nhập.
- Bước kiểm tra UI: (1) Mở link đăng nhập Expo được cung cấp trong chat trên trình duyệt của máy tính đang chạy dự án. (2) Đăng nhập tài khoản Expo của bạn và xác nhận kết nối CLI. (3) Khi trang báo thành công, quay lại Expo Go trên iPhone và bấm Try Again.
- Người thực hiện: Codex.

## 2026-11-06 — Khởi chạy Expo Vedora

- Kết quả: Khởi chạy Expo Go qua LAN tại địa chỉ LAN do Expo hiển thị với CLI offline vì chế độ online trả UnexpectedServerError; Metro phản hồi packager-status:running, manifest iOS trả HTTP 200. Chưa kiểm tra trực tiếp trên điện thoại.
- Bước kiểm tra UI: (1) Kết nối điện thoại cùng Wi-Fi với máy tính. (2) Mở Expo Go và mở địa chỉ địa chỉ LAN do Expo hiển thị. (3) Chờ ứng dụng tải và xác nhận màn hình chào hoặc bảng tin hiển thị.
- Người thực hiện: Codex.

## 2026-11-06 — Gửi QR Expo theo IP hiện tại

- Kết quả: Xác nhận Metro đang chạy; tạo QR mới tại .expo/expo-qr-current.png trỏ đến địa chỉ LAN do Expo hiển thị theo IP Wi-Fi hiện tại.
- Bước kiểm tra UI: (1) Giữ điện thoại và máy tính cùng mạng. (2) Quét QR mới bằng Camera/Expo Go. (3) Chờ ứng dụng mở màn hình đầu tiên; chưa xác nhận trên điện thoại.
- Người thực hiện: Codex.

## 2026-11-06 — Kiểm tra lỗi thiếu cấu hình Turnstile trên đăng nhập

- Kết quả: Xác nhận .env.local chỉ có EXPO_PUBLIC_API_URL trỏ API remote, thiếu EXPO_PUBLIC_TURNSTILE_SITE_KEY. Component không tạo widget khi thiếu key nên nút đăng nhập bị khóa. Bản frontend local cũng chưa có site key thật. Chờ site key công khai và hostname được widget cho phép để cấu hình; chưa thay key thử nghiệm cho API remote.
- Bước kiểm tra UI: (1) Sau khi bổ sung site key và origin rồi khởi động lại Expo, mở lại màn đăng nhập. (2) Xác nhận thông báo thiếu cấu hình biến mất và widget xác minh xuất hiện. (3) Hoàn tất xác minh, nhập thông tin tài khoản và bấm Đăng nhập. (4) Xác nhận vào bảng tin hoặc nhận thông báo lỗi tài khoản; chưa kiểm tra lại trên điện thoại vì thiếu cấu hình.
- Người thực hiện: Codex.

## 2026-11-06 — Bổ sung cấu hình Turnstile thật cho Expo

- Kết quả: Cập nhật .env.local bằng site key công khai và origin https://vedora-opal.vercel.app do người dùng cung cấp, giữ API remote và web URL. Khởi động lại Expo, xóa cache Metro; chạy CLI offline vì online vẫn trả UnexpectedServerError. Manifest và bundle iOS trả HTTP 200; bundle chứa đúng site key và origin mới. Chưa xác nhận widget và đăng nhập trên iPhone.
- Bước kiểm tra UI: (1) Thoát phiên ứng dụng cũ trong Expo Go rồi mở lại QR địa chỉ LAN do Expo hiển thị. (2) Vào Đăng nhập, xác nhận không còn thông báo thiếu cấu hình. (3) Chờ widget Turnstile tải và hoàn tất xác minh. (4) Nhập tài khoản, mật khẩu và bấm Đăng nhập; xác nhận vào bảng tin. (5) Nếu Expo Go báo lệch tài khoản CLI, đăng xuất Expo Go khi dùng phiên CLI offline rồi mở lại dự án.
- Người thực hiện: Codex.

## 2026-11-06 — Đối chiếu tính năng app với 8 ảnh web

- Kết quả: Đọc routes, components và services hiện tại, đối chiếu ảnh người dùng gửi. App thiếu Google login; Blog của bạn và trình viết blog; trang gói dịch vụ/mua gói/thanh toán/lịch sử; luồng nộp xác minh chuyên gia; thao tác lưu ngay trên thẻ công thức; lối vào Điều khoản/Quyền riêng tư/Tiêu chuẩn cộng đồng/Trợ năng. Phần tóm tắt hồ sơ ăn uống chưa có mục Thích. App đã có đọc blog, feed, thông báo, lưu bài, theo dõi/gợi ý theo dõi, hồ sơ/video và lên thực đơn. Không coi khác bố cục desktop/mobile là thiếu tính năng; chưa xác nhận các hành vi web ngoài ảnh.
- Bước kiểm tra UI: (1) Mở Đăng nhập, đối chiếu nút Google trên web. (2) Vào Khám phá > tạo nội dung, kiểm tra Blog còn Sắp có. (3) Vào Tôi, đối chiếu Blog của bạn, Gói của bạn, xác minh chuyên gia và mục Thích trên hồ sơ. (4) Vào Công thức, kiểm tra thiếu nút lưu trên thẻ. (5) Mở Đang theo dõi để xem gợi ý theo dõi; mở tab Trợ lý và Thực đơn để xác nhận các tính năng đã có. Đây là hướng dẫn kiểm tra trên thiết bị, chưa thực hiện trực tiếp trong task đối chiếu.
- Người thực hiện: Codex.

## 2026-11-06 — Thêm Blog của bạn và Viết blog

- Kết quả: Thêm màn Blog của bạn lấy API thật /blogs/mine, phân trang, kéo để tải lại, trạng thái Nháp/Đã đăng và mở chỉnh sửa. Thêm trình viết blog với tiêu đề, nội dung Markdown, ảnh bìa/ảnh trong bài (tối đa 5 MB), xem trước, lưu nháp, đăng bài, sửa bài đã có và chuyển về nháp. Chặn tiêu đề/nội dung không hợp lệ, khóa thao tác khi đang lưu/tải ảnh, cảnh báo khi rời màn hình còn thay đổi chưa lưu. Mở từ Tôi > Blog của bạn, menu tài khoản Khám phá và Tạo nội dung > Blog; đăng nhập xong quay lại mục Blog. Đối chiếu DTO/controller backend và cách web gọi API trước khi triển khai.
- Giới hạn: Chưa thử lưu/đăng/upload thật bằng tài khoản trên iPhone. Phiên bản này lưu bằng nút Lưu nháp/Lưu thay đổi; chưa có tự động lưu, upload video trong blog hoặc trợ lý viết bài.
- Bước kiểm tra UI: (1) Mở Tôi > Blog của bạn (hoặc menu avatar ở Khám phá), xác nhận danh sách hoặc trạng thái chưa có bài. (2) Bấm Viết blog, thử lưu tiêu đề rỗng và đăng nội dung rỗng để xem lỗi. (3) Nhập tiêu đề, nội dung có đề mục/danh sách; chọn ảnh bìa và Thêm ảnh, mở Xem trước. (4) Bấm Lưu nháp, quay lại danh sách, mở bài để xác nhận dữ liệu được giữ; lưu tiếp và xác nhận không tạo bản sao. (5) Sửa nội dung rồi quay lại, chọn Tiếp tục viết trong cảnh báo; thử lại với Bỏ thay đổi. (6) Bấm Đăng blog, mở Xem bài đã đăng, kiểm tra bài trong feed Blog và hồ sơ. (7) Mở chỉnh sửa từ Blog của bạn, lưu thay đổi, chuyển về nháp và kiểm tra bài không còn công khai. (8) Quay lại Khám phá > Tạo nội dung > Blog để tạo bài mới; kéo tải lại danh sách, thử mất mạng và tải lại khi có mạng. Đây là các bước kiểm tra đề xuất trên thiết bị, chưa thực hiện trực tiếp trong task.
- Người thực hiện: Codex.

## 2026-11-06 — Đặt Blog của tôi thay tab Video trong hồ sơ

- Kết quả: Hồ sơ cá nhân có hai tab Bài viết và Blog của tôi. Tab Bài viết chỉ hiển thị post có video, gọi API lọc type=POST để blog không chiếm danh sách video. Tab Blog của tôi hiển thị trực tiếp blog nháp/đã đăng, nút Viết blog, chỉnh sửa, tải lại và xem thêm; dùng lại danh sách Blog hiện có và không lồng FlatList trong ScrollView. Bỏ thẻ Blog riêng phía trên hồ sơ. Số tổng được ghi Đã đăng vì API cộng cả blog và post, bỏ số tổng này khỏi nhãn tab Bài viết để tránh hiểu nhầm là số video.
- Giới hạn: Chưa kiểm tra trực tiếp trên điện thoại; danh sách video vẫn là 20 post gần nhất theo luồng hồ sơ hiện có, chưa thêm phân trang video trong task đổi tab này.
- Bước kiểm tra UI: (1) Tải lại Expo và mở tab Tôi. (2) Xác nhận hàng tab là Bài viết / Blog của tôi, không còn tab Video hay thẻ Blog phía trên. (3) Mở Bài viết, xác nhận chỉ hiện bài video ăn uống; tài khoản chỉ có blog phải hiện trạng thái chưa có video. (4) Mở Blog của tôi, xác nhận thấy cả Nháp và Đã đăng; thử Tải lại và Xem thêm nếu có. (5) Bấm Viết blog, lưu nháp rồi quay lại, xác nhận bài hiện trong tab Blog của tôi. (6) Mở một blog để sửa/đăng, quay về kiểm tra hai tab không trộn nội dung.
- Người thực hiện: Codex.

## 2026-11-07 — Chuẩn bị commit theo tính năng và bảo vệ cấu hình local

- Kết quả: Phân nhóm thay đổi nâng Expo SDK 58, tạo/quản lý blog và tab blog trong hồ sơ để commit riêng; rà soát thông tin nhạy cảm, ẩn tên tài khoản Expo và IP LAN cá nhân trong nhật ký mới. Giữ cấu hình môi trường local ngoài Git.
- Bước kiểm tra UI: (1) Mở ứng dụng bằng Expo Go tương thích và kiểm tra bảng tin, Công thức, Trợ lý, Thực đơn. (2) Đăng nhập, mở Khám phá > Tạo nội dung > Blog, nhập tiêu đề/nội dung và xem trước. (3) Lưu nháp, mở lại rồi đăng blog và kiểm tra bài đã đăng. (4) Mở Tôi > Blog của tôi, chỉnh sửa blog và xác nhận tab Bài viết chỉ hiển thị video. Các bước này là hướng dẫn kiểm tra trên thiết bị, chưa thực hiện trực tiếp trong task commit.
- Người thực hiện: Codex.

## 2026-11-07 — Thêm gói dịch vụ và thanh toán SePay trên mobile

- Kết quả: Thêm màn Gói của bạn tại /billing và chi tiết thanh toán tại /payment/[id], mở từ tab Tôi hoặc menu tài khoản Khám phá. Đọc gói hiện tại, thời hạn UTC+7, giá/thời lượng do server trả, đơn đang chờ và 20 giao dịch gần nhất. Thêm xác nhận mua Pro/Premium, QR và thông tin chuyển khoản có thể chọn để sao chép, kiểm tra trạng thái tự động mỗi 4 giây khi màn thanh toán đang được xem, nút Tôi đã thanh toán chỉ kiểm tra server, tiếp tục/hủy đơn chờ với cảnh báo không hoàn tiền. Chỉ hiển thị thành công khi API trả SUCCEEDED, làm mới gói sau thanh toán/hủy; giữ idempotency key khi thử lại lỗi mạng trong phiên ứng dụng, chặn thao tác trùng và hủy request ghi khi rời màn/đổi phiên. Đối chiếu DTO/controller/docs API và implementation web; kiểm tra dữ liệu Zod gồm tiền VND, QR đúng origin và đúng số tiền. Không thêm dependency, không đưa secret SePay vào mobile.
- Giới hạn: Dùng polling thay cho SSE; chưa chuyển tiền thật hoặc thử trực tiếp trên iPhone/Android. Retry key chỉ giữ trong bộ nhớ đến khi khởi động lại app; server vẫn tái sử dụng đơn đang chờ của tài khoản. Pro/Premium chỉ ghi nhận gói, chưa có đặc quyền; mua mới thay thế thời hạn cũ và không tự gia hạn.
- Bước kiểm tra UI: (1) Khi chưa đăng nhập, mở /billing, bấm Đăng nhập rồi xác nhận quay lại Gói của bạn. (2) Sau đăng nhập, mở Tôi > Gói của bạn hoặc menu avatar ở Khám phá; kiểm tra gói hiện tại, thời hạn, giá và lịch sử. (3) Bấm Mua Pro/Premium, đọc điều kiện thay thế gói, chọn Để sau rồi mở lại và Xác nhận tạo thanh toán. (4) Kiểm tra QR, ngân hàng, số tài khoản, số tiền và nội dung; quay về và bấm Tiếp tục thanh toán, xác nhận vẫn cùng đơn. (5) Bấm Tôi đã thanh toán khi chưa chuyển tiền, xác nhận vẫn chờ và không tự báo thành công. (6) Với giao dịch thử được backend xác nhận, đợi tự cập nhật hoặc bấm kiểm tra; mở lại Gói của bạn để kiểm tra gói, thời hạn và lịch sử mới. (7) Với đơn chưa chuyển tiền, bấm Hủy, thử Giữ giao dịch rồi xác nhận hủy; kiểm tra QR biến mất và có thể mua mới. (8) Thử mất mạng/tải lại, thanh toán tạm đóng, truy cập đơn không thuộc tài khoản và đăng xuất/đăng nhập tài khoản khác; xác nhận không hiển thị QR cũ khi lỗi hoặc dữ liệu phiên trước. Đây là các bước kiểm tra đề xuất, chưa chạy trên thiết bị hay thực hiện chuyển khoản thật trong task.
- Người thực hiện: Codex.

## 2026-11-07 — Cải thiện bố cục gói dịch vụ và thanh toán

- Kết quả: Thiết kế lại màn Gói của bạn với thẻ gói hiện tại nổi bật, đơn chờ có nút tiếp tục rõ ràng, thẻ chọn Pro/Premium co giãn theo màn hình, lịch sử dạng danh sách thay thẻ lồng nhau; mặc định hiện 5 giao dịch và có Xem tất cả/Thu gọn. Chuyển làm mới sang nút ở header và kéo xuống. Màn thanh toán ưu tiên trạng thái/số tiền, QR co giãn, từng dòng thông tin ngân hàng có thể chọn để sao chép, hướng dẫn hai bước và nút kiểm tra cố định cuối màn hình. Tách màu trạng thái chờ/thành công/đã hủy, bổ sung trạng thái trống/lỗi, đổi xác nhận mua/hủy thành bảng trượt từ dưới lên, tăng vùng bấm và hỗ trợ theme sáng/tối. Giữ thông báo gói chưa có đặc quyền, điều kiện thay thế thời hạn và cảnh báo hủy không hoàn tiền.
- Bước kiểm tra UI: (1) Vào Tôi > Gói của bạn trên màn hình nhỏ, kiểm tra thẻ gói, giá và nút chọn không bị cắt; kéo xuống hoặc bấm làm mới. (2) Với tài khoản chưa có giao dịch, kiểm tra thông báo trống; với hơn 5 giao dịch, thử Xem tất cả và Thu gọn, chạm một dòng để xem chi tiết. (3) Bấm Chọn Pro/Premium, đọc bảng xác nhận, thử Chọn lại gói rồi mở lại và tiếp tục. (4) Ở màn thanh toán, kiểm tra QR vừa chiều rộng, mở ảnh QR, nhấn giữ số tài khoản/nội dung để chọn sao chép; cuộn xuống và xác nhận nút kiểm tra vẫn ở cuối màn hình. (5) Thử kiểm tra khi chưa chuyển tiền, lỗi mạng và thanh toán tạm đóng; xác nhận không hiển thị thành công hoặc QR cũ khi lỗi. (6) Thử bảng hủy với Giữ giao dịch và xác nhận hủy cho đơn chưa chuyển tiền; kiểm tra trạng thái đã hủy khác trạng thái thành công. (7) Kiểm tra theme tối, cỡ chữ lớn và xoay ngang, rồi dùng giao dịch thử đã được server xác nhận để xem trạng thái thành công. Đây là hướng dẫn kiểm tra; chưa xác nhận trực tiếp trên thiết bị hoặc trình duyệt vì browser access host không khả dụng, chưa thực hiện chuyển tiền thật.
- Người thực hiện: Codex.

## 2026-11-07 — Đặt gói dịch vụ dưới hồ sơ ăn uống và dùng sticker Vedora

- Kết quả: Chuyển thẻ Gói của bạn từ đầu màn hồ sơ xuống ngay dưới Hồ sơ ăn uống, trước tab Bài viết/Blog của tôi. Thiết kế thẻ ngang gọn với nền xanh nhạt theo theme, sticker cà rốt trên nền kem, mô tả ngắn và mũi tên mở thanh toán. Dùng lại sticker cà rốt cho thẻ gói hiện tại/màn chưa đăng nhập, bơ cho Pro và cà chua cho Premium trong màn chọn gói và bảng xác nhận; thu gọn padding/khoảng cách thẻ gói. Sticker mang tính trang trí, không làm lặp nội dung khi đọc bằng trình đọc màn hình; giữ màu chữ theo theme sáng/tối.
- Bước kiểm tra UI: (1) Tải lại app, đăng nhập và mở tab Tôi; kiểm tra thứ tự thông tin cá nhân > Hồ sơ ăn uống > Gói của bạn > Bài viết/Blog của tôi. (2) Kiểm tra sticker cà rốt, thẻ xanh nhạt và mô tả không bị cắt trên màn hình nhỏ; bấm thẻ để mở Gói của bạn. (3) Kiểm tra sticker cà rốt ở gói hiện tại, bơ ở Pro và cà chua ở Premium; bấm chọn từng gói, xem sticker trong bảng xác nhận rồi chọn lại mà không tạo thanh toán. (4) Bật theme tối, tăng cỡ chữ và kiểm tra các nhãn, giá, sticker, mũi tên vẫn rõ; kiểm tra tab hồ sơ và nút quay lại. Chưa xác nhận trực tiếp trên điện thoại trong task này.
- Người thực hiện: Codex.

## 2026-11-07 — Kiểm tra nút tiếp tục giao dịch đang chờ

- Kết quả: Ảnh lỗi iPhone xác định màn thanh toán bị lỗi render do Pressable bên trong Link asChild nhận mảng style. Dùng StyleSheet.flatten cho nút mở ảnh QR để tương thích Slot của Expo Router. Đồng thời bỏ khóa nút Tiếp tục thanh toán theo trạng thái tạo giao dịch mới; nút mở chi tiết bằng ID hiện có, không tạo đơn mới.
- Bước kiểm tra UI: (1) Tải lại ứng dụng trên iPhone, đăng nhập và mở Tôi > Gói của bạn. (2) Với tài khoản có giao dịch đang chờ, bấm Tiếp tục thanh toán; xác nhận màn Thanh toán hiển thị QR, không có Render Error về Slot/style. (3) Bấm Mở ảnh QR để lưu, kiểm tra mở ảnh rồi quay về ứng dụng. (4) Kiểm tra mã giao dịch và số tiền vẫn thuộc đơn cũ; quay lại rồi mở từ lịch sử. (5) Nếu tải lỗi mạng, bấm Thử tải lại giao dịch. Chưa xác nhận lại trực tiếp trên điện thoại sau sửa, không chuyển khoản thật trong task.
- Người thực hiện: Codex.

## 2026-11-07 — Commit tính năng gói dịch vụ và thanh toán

- Kết quả: Gom module billing, lối vào từ hồ sơ/menu tài khoản, giao diện sticker và bản sửa lỗi render QR vào commit tính năng. Rà soát tệp đưa vào Git; giữ cấu hình môi trường, dữ liệu tham chiếu và sản phẩm build ngoài commit.
- Bước kiểm tra UI: (1) Mở Tôi, kiểm tra Gói của bạn nằm dưới Hồ sơ ăn uống. (2) Mở gói, xem giá và bảng xác nhận Pro/Premium. (3) Với đơn đang chờ, bấm Tiếp tục thanh toán, kiểm tra QR và mở ảnh để lưu. (4) Quay về kiểm tra lịch sử và trạng thái giao dịch. Chưa kiểm tra trực tiếp trên điện thoại hoặc chuyển tiền thật trong task commit.
- Người thực hiện: Codex.

## 2026-11-07 — Sở thích nguyên liệu và mục Thích trên hồ sơ

- Kết quả: Thay Sắp có bằng phần chọn nguyên liệu yêu thích trong Hồ sơ ăn uống: tìm theo tên/tên gọi khác, chọn/bỏ qua checkbox hoặc chip, đếm tối đa 100 nguyên liệu, thông báo khi cần tìm cụ thể hơn trong danh sách dài. Gửi likedIngredientIds cùng nhóm/nguyên liệu cần tránh qua PUT /dietary/me; đọc liked ở cả hồ sơ ăn uống và cache thực đơn để thẻ hồ sơ không mất dữ liệu khi tải lại. Thêm mục Thích trên thẻ hồ sơ, hiển thị tối đa 6 chip và số còn lại. Chặn lựa chọn vừa thích vừa không ăn, trùng ID và vượt giới hạn backend; giữ lựa chọn khi lưu lỗi, hỗ trợ hủy thay đổi và ngăn chỉnh lựa chọn khi đang lưu. Đối chiếu DTO/service backend và web, dùng API sẵn có, không thêm thư viện.
- Bước kiểm tra UI: (1) Đăng nhập, mở Tôi; kiểm tra thẻ Hồ sơ ăn uống có Không ăn và Thích, tài khoản chưa chọn hiển thị Chưa chọn. (2) Mở thẻ, kéo tới Sở thích nguyên liệu, bấm Chọn nguyên liệu yêu thích, tìm tên hoặc tên gọi khác rồi chọn vài nguyên liệu; xác nhận chip và bộ đếm cập nhật. (3) Bấm chip hoặc checkbox để bỏ chọn; thử chọn nguyên liệu đã nằm trong Không ăn và xác nhận có thông báo, không bị lưu trùng. (4) Bấm Lưu hồ sơ, quay về Tôi, xác nhận mục Thích cập nhật; mở lại cấu hình và xác nhận vẫn giữ cả sở thích lẫn danh sách cần tránh. (5) Thay đổi lựa chọn rồi bấm Hủy thay đổi; thử quay lại và chọn Tiếp tục chỉnh sửa/Bỏ thay đổi trong cảnh báo. (6) Thử lưu khi mất mạng, xác nhận lựa chọn còn nguyên và lưu lại được khi có mạng; thử bỏ hết sở thích rồi lưu, kiểm tra Chưa chọn. (7) Với hơn 6 nguyên liệu, kiểm tra chip +số còn lại; kiểm tra chữ lớn và theme tối. Đây là các bước đề xuất, chưa kiểm tra trực tiếp trên thiết bị trong task này.
- Người thực hiện: Codex.

## 2026-11-07 — Làm đẹp màn chi tiết hồ sơ ăn uống

- Kết quả: Thiết kế lại phần mở đầu bằng nền xanh nhạt, sticker cà rốt trên nền kem và ba ô tóm tắt số nhóm/nguyên liệu tránh/nguyên liệu thích. Dùng sticker bơ cho phần không ăn và cà chua cho sở thích, tiêu đề thân thiện, thẻ bo góc với bộ đếm riêng, checkbox dấu tích đồng nhất thay ký tự ô chọn. Tăng vùng chạm chip/ô tìm kiếm/nút chọn, cho nhãn và hàng nút co giãn; thanh lưu có trạng thái chưa lưu và khoảng an toàn phía dưới iPhone. Màu theo theme sáng/tối, sticker trang trí không lặp nội dung cho trình đọc màn hình; dùng tài nguyên hiện có, không thêm thư viện.
- Bước kiểm tra UI: (1) Mở Tôi > Hồ sơ ăn uống, kiểm tra header, sticker cà rốt và số lượng tóm tắt. (2) Cuộn xem hai phần Những món mình tránh/Thêm một chút yêu thích, kiểm tra sticker bơ/cà chua, bộ đếm và khoảng cách các thẻ. (3) Mở từng danh sách, tìm kiếm, chọn/bỏ checkbox và chip; xác nhận số tóm tắt và bộ đếm cập nhật. (4) Kiểm tra dòng Bạn có thay đổi chưa lưu, bấm Lưu hồ sơ rồi quay lại hồ sơ để xem dữ liệu. (5) Thử Hủy thay đổi, lỗi mạng và cảnh báo rời màn khi chưa lưu. (6) Kiểm tra trên màn hình nhỏ, cỡ chữ lớn, theme tối và iPhone có thanh Home; xác nhận nút lưu không sát thanh Home và các nhãn không chồng nhau. Chưa xác nhận trực tiếp giao diện trên thiết bị trong task này.
- Người thực hiện: Codex.

## 2026-11-07 — Commit sở thích và giao diện hồ sơ ăn uống

- Kết quả: Chuẩn bị nhánh feat/dietary-preferences-and-profile-ui với commit tính năng nguyên liệu yêu thích, mục Thích trên hồ sơ và bố cục chi tiết có sticker; chỉ đưa source, kiểm tra dữ liệu và nhật ký công việc liên quan vào commit.
- Bước kiểm tra UI: (1) Mở Tôi > Hồ sơ ăn uống, kiểm tra sticker và tóm tắt lựa chọn. (2) Tìm/chọn nguyên liệu yêu thích, thử xung đột với Không ăn. (3) Lưu rồi quay lại Tôi, xác nhận mục Thích hiển thị đúng; mở lại cấu hình để kiểm tra dữ liệu. Chưa thử trực tiếp trên thiết bị trong task commit.
- Người thực hiện: Codex.

## 2026-11-07 — Trang thông tin Vedora và bốn trang nội dung

- Kết quả: Thêm màn Thông tin Vedora tại /about, bốn trang Điều khoản sử dụng, Quyền riêng tư, Tiêu chuẩn cộng đồng và Trợ năng tại /about/[slug]. Có lối vào trong tab Tôi (cả khách và đã đăng nhập) và menu tài khoản Khám phá; nội dung tĩnh đọc được không cần đăng nhập/API. Thiết kế thẻ xanh nhạt, sticker bơ/cà rốt, biểu tượng riêng cho từng mục, đoạn văn có thể chọn/sao chép, tiêu đề đánh số và các mục liên quan cuối trang; hỗ trợ theme tối, chữ co giãn, vùng chạm và safe area. Web tham chiếu hiện chỉ có href=#; theo lựa chọn của người dùng, nội dung mới là dự thảo để duyệt và được ghi rõ trên màn tổng quan lẫn từng trang, không gắn ngày hiệu lực hay coi là chính sách đã phê duyệt.
- Bước kiểm tra UI: (1) Khi chưa đăng nhập, mở Tôi > Thông tin Vedora; thử thêm lối vào từ menu avatar ở Khám phá. (2) Kiểm tra thẻ giới thiệu/sticker, nhãn Bản dự thảo để duyệt và bốn mục. (3) Mở lần lượt cả bốn trang, đọc các mục đánh số, nhấn giữ đoạn văn để chọn/sao chép. (4) Cuộn cuối trang, bấm mục liên quan và quay lại; thử mở đường dẫn slug không hợp lệ và dùng thẻ Thông tin Vedora để trở về danh sách. (5) Đăng nhập và mở lại từ Tôi, kiểm tra tính năng không yêu cầu đăng nhập lại. (6) Kiểm tra cỡ chữ lớn, màn hình nhỏ, theme tối và thanh Home; xác nhận chữ, biểu tượng và nút không chồng/cắt. Chưa xác nhận trực tiếp giao diện trên điện thoại trong task này; nội dung cần được chủ dự án duyệt trước khi sử dụng chính thức.
- Người thực hiện: Codex.

## 2026-11-07 — Mở thông tin Vedora từ cài đặt đầu hồ sơ

- Kết quả: Chuyển thẻ Thông tin Vedora trong nội dung hồ sơ thành nút bánh răng Cài đặt ở header. Nút mở trực tiếp màn Thông tin Vedora; có nhãn trợ năng rõ ràng, xuất hiện cho cả khách và tài khoản đã đăng nhập. Bỏ thẻ cũ để hồ sơ gọn hơn.
- Bước kiểm tra UI: (1) Mở tab Tôi khi chưa đăng nhập, bấm bánh răng góc trên và kiểm tra mở Thông tin Vedora. (2) Quay lại, đăng nhập và xác nhận nút bánh răng nằm trên header cùng nút đã lưu/đăng xuất. (3) Bấm bánh răng, mở từng trang thông tin rồi quay lại hồ sơ. (4) Kiểm tra không còn thẻ Thông tin Vedora trong phần nội dung hồ sơ; kiểm tra theme tối và chữ lớn. Chưa kiểm tra trực tiếp trên điện thoại trong task này.
- Người thực hiện: Codex.

## 2026-11-07 — Bỏ nhãn dự thảo và commit trang thông tin

- Kết quả: Theo yêu cầu mới của người dùng, bỏ khung Bản dự thảo để duyệt khỏi màn Thông tin Vedora và bốn trang chi tiết, xóa component/style không còn dùng. Chuẩn bị nhánh feat/information-pages với trang thông tin, nội dung, nút cài đặt đầu hồ sơ và lối vào từ menu Khám phá; rà soát tệp commit để giữ cấu hình môi trường ngoài Git.
- Bước kiểm tra UI: (1) Mở Tôi > nút bánh răng, kiểm tra màn Thông tin Vedora không còn khung dự thảo. (2) Mở lần lượt Điều khoản, Quyền riêng tư, Tiêu chuẩn cộng đồng và Trợ năng, xác nhận nội dung và liên kết liên quan vẫn hiển thị. (3) Quay lại hồ sơ, mở từ menu tài khoản Khám phá và thử khi chưa đăng nhập. Chưa kiểm tra trực tiếp trên thiết bị trong task commit.
- Người thực hiện: Codex.

## 2026-11-07 — Rà soát phần mobile còn thiếu so với web

- Kết quả: Đối chiếu source mobile hiện tại với bản web tham chiếu local và các ảnh đã nhận. Còn thiếu Google login, gửi/theo dõi yêu cầu xác minh chuyên gia, lưu/bỏ lưu công thức và đánh giá sao, bài ngắn dạng chữ/ảnh như composer web; blog mobile chưa có trình soạn thảo trực quan, tự lưu và trợ lý viết của web. Mobile vẫn ghi Sắp có ở tạo công thức, nhưng chưa coi đó là chênh lệch tính năng người dùng web vì bản tham chiếu web không có luồng tạo công thức công khai tương ứng. Các phần billing, sở thích ăn uống và trang thông tin đã có code, còn cần kiểm thử thực tế trên thiết bị.
- Bước kiểm tra UI: (1) Mở đăng nhập để đối chiếu nút Google. (2) Mở hồ sơ để kiểm tra thiếu gửi xác minh chuyên gia. (3) Mở danh sách/chi tiết công thức, đối chiếu nút lưu và đánh giá sao trên web. (4) Mở tạo nội dung, đối chiếu bài ngắn chữ/ảnh và video. (5) Mở viết blog để đối chiếu tự lưu, định dạng trực quan và trợ lý viết. Đây là kết quả rà source, chưa kiểm thử trực tiếp UI web/mobile trong task này.
- Người thực hiện: Codex.

## 2026-11-07 — Tích hợp giao diện và luồng Google trên mobile

- Kết quả: Thêm nút Tiếp tục với Google cùng logo tại Đăng nhập/Đăng ký, trạng thái chờ, thông báo lỗi mạng/cấu hình và hướng dẫn development build khi dùng Expo Go/web. Dùng hai endpoint Google OAuth/PKCE hiện có, mở trình duyệt hệ thống, kiểm tra state/callback/thời hạn, lưu phiên bằng session manager và trở về màn đích đã cho phép. Chặn gửi đồng thời form email với Google; native intent không đưa code vào route params. Không thêm dependency hay secret. Chưa hoàn tất tích hợp đầu cuối: web hiện cố định callback HTTPS và cần triển khai nhánh chuyển code về app. Đã chuẩn bị docs/GOOGLE_LOGIN.md và patch callback web kiểm tra áp dụng được; chưa sửa/triển khai repo web trong khi chờ lựa chọn phạm vi từ người dùng.
- Bước kiểm tra UI: (1) Cài development build, mở Đăng nhập và Đăng ký, kiểm tra logo/nút Google và đường phân cách. (2) Sau khi web triển khai callback, bấm Google, chọn tài khoản, kiểm tra trở về màn đích và hồ sơ đúng người; đăng xuất rồi thử tài khoản mới. (3) Đóng trình duyệt hoặc từ chối cấp quyền, xác nhận không tạo phiên và bấm lại được. (4) Thử mất mạng, máy chủ chưa bật Google, callback sai/hết hạn, đóng app giữa luồng rồi mở callback cũ; kiểm tra không đăng nhập nhầm và bắt đầu lại được. (5) Mở từ Billing/Blog yêu cầu đăng nhập, xác nhận trở lại đúng màn; kiểm tra Android/iOS, theme tối, chữ lớn và trình đọc màn hình. (6) Thử Expo Go, xác nhận thông báo cần bản cài và form email vẫn dùng được. Chưa kiểm thử Google thật hoặc giao diện trực tiếp trên thiết bị; luồng thành công cần callback web được triển khai trước.
- Người thực hiện: Codex.

## 2026-11-07 — Lưu và bỏ lưu công thức

- Kết quả: Thêm nút Lưu/Đã lưu trên thẻ công thức và màn chi tiết, bấm Đã lưu để bỏ lưu; phân biệt màu/icon, nhãn trợ năng, trạng thái đang cập nhật và lỗi mạng/phiên hết hạn/công thức đã xóa. Nút lưu tách khỏi vùng bấm mở thẻ, chặn gửi lặp cho cùng công thức. Đọc isFavorite từ API, gọi PUT/DELETE /recipes/:id/favorite, chỉ đổi trạng thái khi máy chủ xác nhận; đồng bộ các trang danh sách, chi tiết và danh sách đã lưu, làm mới sau cả lỗi để đối chiếu lại máy chủ. Chặn ghi kết quả vào cache khi phiên đăng nhập đã đổi. Thêm tab Công thức trong Đã lưu, dùng GET /recipes/favorites với phân trang, kéo làm mới, trạng thái rỗng và thử lại. Khách được dẫn tới đăng nhập khi bấm lưu; bổ sung màn Công thức/Đã lưu vào danh sách đích trở về an toàn. Dùng API và thư viện sẵn có, không thêm secret hay thay đổi backend.
- Bước kiểm tra UI: (1) Đăng nhập, mở Công thức, bấm Lưu trên một thẻ; xác nhận đổi sang Đã lưu và không mở chi tiết ngoài ý muốn. (2) Mở thẻ vừa lưu, kiểm tra nút Đã lưu ở chi tiết; bấm bỏ lưu, quay lại danh sách và xác nhận trở về Lưu. (3) Lưu vài món, mở Tôi > biểu tượng đánh dấu > Công thức; xác nhận danh sách lưu mới nhất trước, mở chi tiết từ đây và bỏ lưu; món biến mất khỏi danh sách. (4) Chuyển qua lại Bài viết/Công thức, kéo làm mới, cuộn tải thêm; thử danh sách rỗng và lỗi tải trang tiếp theo rồi bấm thử lại. (5) Tắt mạng khi bấm lưu/bỏ lưu, kiểm tra thông báo lỗi và không hiển thị thành công giả; bật mạng rồi thử lại. (6) Đăng xuất rồi bấm lưu, kiểm tra tới Đăng nhập và quay về Công thức sau đăng nhập; mở Đã lưu khi là khách, kiểm tra chỉ dẫn đăng nhập. (7) Thử bấm nhanh, đổi tài khoản, chữ lớn, theme tối và VoiceOver/TalkBack; xác nhận các trạng thái không lẫn giữa tài khoản. Chưa kiểm thử UI/API có đăng nhập trên điện thoại thật trong task này.
- Người thực hiện: Codex.

## 2026-11-07 — Làm mới giao diện trang công thức

- Kết quả: Thiết kế phần chào Bếp nhỏ Vedora nền xanh nhạt với sticker cà rốt trên nền kem, đường vào Đã lưu mở thẳng tab Công thức. Nâng ô tìm kiếm, thêm gợi ý từ khóa Nấm/Đậu hũ/Canh hoạt động thật, đổi bộ lọc thành thẻ Hợp với mình có dấu bật/tắt và mô tả rõ. Thẻ món có ảnh theo tỷ lệ, nhãn thời gian, biểu tượng khẩu phần/nguyên liệu, tiêu đề thoáng và nút Lưu công thức riêng; món chưa có ảnh dùng sticker cà chua. Màn chi tiết có khối tiêu đề/sticker, thẻ nguyên liệu với sticker bơ, từng bước nấu trong khung riêng đánh số. Thêm sticker cho danh sách rỗng, kéo làm mới và nút thử lại khi tải thêm lỗi; giữ màu theo theme, vùng chạm và nội dung co giãn. Tận dụng sticker sẵn có, không thêm thư viện hoặc API.
- Bước kiểm tra UI: (1) Mở Công thức, xem phần chào/sticker cà rốt, ô tìm và ba gợi ý; bấm Nấm rồi bấm lại để bỏ từ khóa, thử nhập/xóa tìm kiếm. (2) Bật/tắt Hợp với mình khi đăng nhập; thử khi là khách, xác nhận được dẫn tới Đăng nhập và trở về Công thức. (3) Cuộn danh sách, kiểm tra ảnh, nhãn thời gian, khẩu phần/nguyên liệu, món thiếu ảnh và nút Lưu/Đã lưu; xác nhận bấm lưu không mở nhầm chi tiết. (4) Bấm Đã lưu trên header, xác nhận vào đúng tab Công thức; mở chi tiết, xem thẻ tiêu đề, nguyên liệu và các bước nấu. (5) Thử kết quả rỗng, mất mạng, kéo làm mới, cuộn tải thêm rồi thử lại sau lỗi. (6) Kiểm tra màn hình nhỏ, cỡ chữ lớn, theme tối và trình đọc màn hình; sticker trang trí không lặp nhãn. Đã kiểm tra source/bundle; công cụ trình duyệt không kết nối được nên chưa xác nhận giao diện trực tiếp trên trình duyệt hoặc điện thoại thật.
- Người thực hiện: Codex.

## 2026-11-07 — Commit Google và trải nghiệm công thức

- Kết quả: Chuẩn bị nhánh feat/google-auth-and-recipe-experience, chia hai commit cho Google sign-in trên mobile và lưu công thức/giao diện mới. Rà tệp thay đổi để loại cấu hình môi trường và bản build; không phát hiện mẫu secret trong phần chuẩn bị commit. Google vẫn cần triển khai callback web theo tài liệu đã kèm, chưa xác nhận đăng nhập Google đầu cuối.
- Bước kiểm tra UI: (1) Mở Đăng nhập/Đăng ký, kiểm tra nút Google; chỉ thử luồng thành công sau khi triển khai callback web và cài development build. (2) Mở Công thức, kiểm tra sticker, tìm nhanh, bộ lọc và chi tiết món. (3) Lưu/bỏ lưu từ thẻ và chi tiết, mở Đã lưu > Công thức để đối chiếu trạng thái. (4) Thử lỗi mạng, tài khoản khách, chữ lớn và theme tối. Đây là các bước bàn giao, chưa kiểm thử trực tiếp trên thiết bị trong task commit.
- Người thực hiện: Codex.

## 2026-11-10 — Làm lại giao diện Trợ lý Vedora chuyên nghiệp hơn

- Kết quả: Tách header, bong bóng tin nhắn và ô nhập thành thành phần chung (`shared/components/chat`) để màn hỏi nhanh của khách và màn trợ lý của người đã đăng nhập dùng cùng một bố cục. Header căn một hàng: avatar tròn cố định, tiêu đề/phụ đề co giãn, nút phụ bên phải. Sửa mascot tràn khỏi vòng tròn; tin nhắn trợ lý có avatar, tên và bong bóng ôm vừa nội dung (không kéo giãn hết bề ngang), tin nhắn người dùng căn phải. Gợi ý, trạng thái đang trả lời và lỗi thụt lề thẳng hàng với bong bóng trợ lý. Ô nhập và nút gửi nằm cùng hàng, nút gửi tròn cố định và mờ khi chưa nhập; lời chào của người đã đăng nhập thành tin nhắn trợ lý, lối vào thực đơn mới đổi thành dải thông báo dưới header, hai nút Đăng ký/Đăng nhập chia đều bề ngang.
- Bước kiểm tra UI: (1) Chưa đăng nhập, mở tab Trợ lý Vedora: kiểm tra avatar nằm gọn trong vòng tròn, tiêu đề và nút làm mới thẳng hàng. (2) Bấm một gợi ý hoặc tự nhập câu hỏi: tin nhắn người dùng căn phải, trợ lý căn trái có avatar/tên, câu ngắn thì bong bóng ôm vừa chữ, câu dài thì xuống dòng. (3) Quan sát trạng thái "đang suy nghĩ" thẳng hàng với bong bóng trợ lý; xem ô nhập mở rộng khi gõ nhiều dòng và nút gửi vẫn nằm cuối hàng. (4) Dùng hết lượt hỏi để xem thẻ Đăng ký/Đăng nhập chia đều; bấm làm mới để bắt đầu lại. (5) Đăng nhập, mở lại tab: kiểm tra lời chào, nút bắt đầu nhanh, mở biểu mẫu rồi bấm Quay lại trò chuyện. (6) Gửi yêu cầu lên thực đơn, kiểm tra nút Xem trong Thực đơn dưới bong bóng và dải thông báo thực đơn mới. (7) Thử theme tối, chữ lớn, màn hình nhỏ và bàn phím mở. Chưa kiểm tra trực tiếp trên thiết bị trong task này.
- Người thực hiện: Claude.

## 2026-11-10 — Làm lại giao diện tab Lên thực đơn

- Kết quả: Tab Lên thực đơn dùng cùng header với tab Trợ lý (avatar sticker cà chua, tiêu đề, phụ đề) và nút/thẻ thống nhất. Thanh chọn ngày đổi từ cuộn ngang sang 7 ô chia đều bề ngang (T2–CN) có chấm báo ngày đã có món. Tiêu đề ngày kèm nhãn số món hoặc "Bản xem trước"; thẻ món căn hàng với tên món co giãn và nút Đổi món dạng viên thuốc có biểu tượng. Thẻ đề xuất mới và đề xuất chưa lưu có hai nút Lưu/Bỏ chia đều; thông báo lỗi tải có nút Thử lại cùng hàng. Màn khách và trạng thái chưa có thực đơn căn giữa, nút giãn đều (trước đây nút "Tạo tài khoản" lệch chữ). Lưới chọn bữa trong biểu mẫu yêu cầu dùng flex-basis thay cho độ rộng 48% nên hai cột luôn đều. Không đổi logic dữ liệu.
- Bước kiểm tra UI: (1) Chưa đăng nhập, mở tab Thực đơn: sticker, tiêu đề, hai nút Đăng nhập/Tạo tài khoản cùng chiều rộng, chữ căn giữa. (2) Đăng nhập khi chưa có thực đơn: thẻ trống căn giữa, bấm nút để chuyển sang tab Trợ lý. (3) Khi đã có thực đơn: thanh 7 ngày chia đều không cuộn ngang, chấm hiện ở ngày có món, chọn ngày đổi màu; xem tiêu đề ngày, nhãn số món và các bữa. (4) Bấm Đổi món trên một món, xác nhận chuyển sang chat với yêu cầu điền sẵn; thử món có tên dài, tên xuống dòng không đẩy nút ra ngoài. (5) Nhờ trợ lý tạo đề xuất: tab Thực đơn hiện thẻ Đề xuất mới, bấm Xem đề xuất; kiểm tra nhãn Bản xem trước, hai nút Lưu thực đơn/Bỏ đề xuất bằng nhau, thử lưu và bỏ. (6) Tắt mạng để xem thông báo lỗi và nút Thử lại. (7) Mở biểu mẫu yêu cầu, kiểm tra các ô chọn bữa chia hai cột đều. (8) Thử theme tối, chữ lớn, màn hình nhỏ. Chưa kiểm tra trực tiếp trên thiết bị trong task này.
- Người thực hiện: Claude.

## 2026-11-10 — Đổi tên tab Lên thực đơn thành Thực đơn của tôi

- Kết quả: Đổi tên tab (nhãn trợ năng của thanh tab) và tiêu đề màn hình thành "Thực đơn của tôi"; màn khách cũng dùng tên này. Cập nhật câu chào của Trợ lý nhắc đúng tên tab. Thanh tab chỉ hiện biểu tượng nên không ảnh hưởng bố cục.
- Bước kiểm tra UI: (1) Mở tab biểu tượng lịch, kiểm tra header ghi "Thực đơn của tôi". (2) Chưa đăng nhập, xác nhận tiêu đề màn khách là "Thực đơn của tôi". (3) Mở tab Trợ lý đã đăng nhập, đọc lời chào và xác nhận nhắc "tab Thực đơn của tôi". (4) Bật TalkBack/VoiceOver, xác nhận tab được đọc là "Thực đơn của tôi". Chưa kiểm tra trực tiếp trên thiết bị.
- Người thực hiện: Claude.

## 2026-11-10 — Tối ưu UX form Lên thực đơn

- Kết quả: Viết lại form yêu cầu thực đơn trong tab Trợ lý. Hiện sẵn các lựa chọn chính dạng nút bấm: bữa (bật/tắt), số người (1–6+), thời gian tối đa (15/30/45/60 phút hoặc không giới hạn), ưu tiên; không còn ô gõ số và đánh số mục. "Nguyên liệu đang có" và "Yêu cầu thêm" gập lại (nguyên liệu tự mở khi vào từ "Tận dụng nguyên liệu đang có"); nguyên liệu nhập một ô tên rồi Thêm/Enter thành thẻ có nút xóa, khối lượng/đơn vị mở thêm khi cần. Thực phẩm cần tránh thành thẻ ở đầu form kèm nút Chỉnh sửa mở hồ sơ ăn uống; bỏ ô tick riêng, thay bằng dòng xác nhận phía trên nút "Xác nhận và gửi" cố định ở đáy. Bấm gửi là gửi thẳng cho trợ lý và quay về khung chat; vẫn có liên kết "Xem câu gửi đi trước khi gửi" để chỉnh trong ô chat. Ẩn ô chat khi form mở; báo lỗi ngay dưới ô nguyên liệu, dưới nhóm chọn bữa hoặc trên nút gửi. Xóa màn meal-planner-screen cũ không còn được dùng.
- Bước kiểm tra UI: (1) Đăng nhập, mở tab Trợ lý, bấm "Lên thực đơn 7 ngày": form hiện thẻ thực phẩm cần tránh, các nhóm nút chọn và nút "Xác nhận và gửi" cố định ở đáy, không có ô chat. (2) Bỏ chọn hết bữa: hiện lỗi dưới nhóm bữa và nút gửi mờ; chọn lại thì hết lỗi. (3) Chọn số người, thời gian; bấm lại nút đã chọn ở số người để bỏ chọn. (4) Mở Nguyên liệu: gõ tên, bấm Thêm hoặc Enter, thấy thẻ; bấm "＋ Thêm khối lượng, đơn vị", nhập khối lượng sai (0) để thấy lỗi dưới ô; xóa thẻ bằng dấu ×. (5) Mở Yêu cầu thêm, nhập ghi chú. (6) Bấm Chỉnh sửa ở thẻ thực phẩm cần tránh, đổi hồ sơ, lưu rồi quay lại và xác nhận thẻ cập nhật. (7) Bấm "Xác nhận và gửi": form đóng, tin nhắn gửi đi ngay, trợ lý trả lời, có nút "Xem trong Thực đơn". Thử mất mạng, kiểm tra nội dung quay lại ô chat để gửi lại. (8) Vào từ "Tận dụng nguyên liệu đang có" (mục nguyên liệu tự mở) và "Mỗi bữa nấu trong 30 phút" (chip 30 phút đã chọn). (9) Bấm "Xem câu gửi đi trước khi gửi": nội dung nằm trong ô chat để sửa. (10) Thử theme tối, chữ lớn, bàn phím mở với ô ghi chú. Chưa kiểm tra trực tiếp trên thiết bị.
- Người thực hiện: Claude.

## 2026-11-10 — Làm nổi bật nút Nhờ trợ lý lên thực đơn mới

- Kết quả: Chuyển nút "Nhờ trợ lý lên thực đơn mới" từ cuối trang (dạng viền, phải cuộn mới thấy) thành nút nền xanh đậm có biểu tượng lấp lánh, cao hơn và có đổ bóng, cố định ở đáy màn Thực đơn của tôi ngay trên thanh tab. Nút chỉ hiện khi đã có thực đơn và không đang xem bản nháp, để không trùng với nút Lưu/Bỏ của bản nháp. Trạng thái chưa có thực đơn vẫn dùng nút chính trong thẻ.
- Bước kiểm tra UI: (1) Đăng nhập, mở Thực đơn của tôi khi đã có thực đơn: nút xanh đậm cố định ở đáy, không cần cuộn. (2) Cuộn danh sách món, nút vẫn đứng yên và không che nội dung cuối. (3) Bấm nút, kiểm tra mở form Lên thực đơn ở tab Trợ lý. (4) Nhờ trợ lý tạo đề xuất rồi bấm Xem đề xuất: nút ẩn khi đang xem bản nháp; Lưu hoặc Bỏ đề xuất thì nút hiện lại. (5) Khi chưa có thực đơn, không thấy nút ở đáy mà chỉ có nút trong thẻ trống. (6) Thử theme tối, chữ lớn, màn hình nhỏ. Chưa kiểm tra trực tiếp trên thiết bị.
- Người thực hiện: Claude.

## 2026-11-10 — Sửa ô nhập chat bị cao bất thường sau khi gửi

- Kết quả: Ô nhập của khung chat Trợ lý bị kẹt ở chiều cao cũ (nhiều dòng) sau khi gửi tin dài hoặc tin điền sẵn, làm chữ gợi ý nằm sát đáy ô rất cao. Nguyên nhân là TextInput nhiều dòng trên iOS không tự co lại khi nội dung bị xóa bằng code. Đã chuyển sang tự tính chiều cao theo nội dung đo được (tối thiểu một dòng, tối đa 120, vượt thì cuộn trong ô) và luôn về một dòng khi ô rỗng. Áp dụng cho cả màn khách và màn đã đăng nhập vì dùng chung ô nhập.
- Bước kiểm tra UI: (1) Trên iPhone, mở tab Trợ lý đã đăng nhập, bấm Đổi món ở một món trong Thực đơn của tôi để ô chat được điền sẵn nhiều dòng; bấm Gửi và xác nhận ô nhập co về một dòng, chữ gợi ý căn giữa, nút gửi thẳng hàng. (2) Gõ nhiều dòng, kiểm tra ô cao dần tới giới hạn rồi cuộn trong ô; xóa hết chữ, kiểm tra ô về một dòng. (3) Lặp lại ở màn khách (chưa đăng nhập) và trên Android. (4) Dùng "Xem câu gửi đi trước khi gửi" từ form, gửi và kiểm tra ô co lại. Chưa kiểm thử trực tiếp sau khi sửa.
- Người thực hiện: Claude.

## 2026-11-10 — Nhận sự kiện SSE khi thanh toán gói

- Kết quả: Màn Thanh toán không còn chỉ dựa vào polling 4 giây. Khi giao dịch còn chờ, app mở luồng SSE `GET /payment-intents/:id/events` (header Bearer, dùng `fetch` của `expo/fetch`), nhận `payment.changed` thì tải lại giao dịch và gói của bạn ngay. Mỗi lần mở hoặc mở lại luồng, và khi app quay lại nền trước, đều tải lại để bù sự kiện đã mất; mất tín hiệu quá 35 giây thì tự đóng và kết nối lại sau 2 giây; hết phiên (`session.expired`/401) thì làm mới token rồi mở lại; 403/404 không thử lại. Khi luồng khỏe, polling giãn còn 30 giây, khi luồng không sẵn sàng thì polling 4 giây như cũ. Luồng đóng khi giao dịch thành công/hủy, rời màn hình hoặc app xuống nền. Trạng thái chỉ được xác lập bởi GET, không tin sự kiện. Thêm bộ đọc SSE dùng chung `shared/api/event-stream.ts`; không thêm thư viện.
- Bước kiểm tra UI: (1) Đăng nhập, chọn gói Pro, mở màn Thanh toán có mã QR. (2) Chuyển khoản thật hoặc gọi webhook SePay thử; xác nhận màn đổi sang "Thanh toán thành công" trong khoảng 1–2 giây, không cần bấm Kiểm tra thanh toán. (3) Quay về Gói của bạn, xác nhận gói mới hiển thị. (4) Mở giao dịch chờ, bấm Hủy: màn đổi sang đã hủy. (5) Tắt mạng khi đang chờ, bật lại: màn vẫn tự cập nhật (polling 4 giây rồi kết nối lại). (6) Đưa app xuống nền, thanh toán xong rồi mở lại: trạng thái đúng ngay khi quay lại. (7) Để màn mở trên 1 phút để đảm bảo luồng không rớt và không có lỗi hiện ra. (8) Thử mở giao dịch của tài khoản khác: báo không tìm thấy, không lặp kết nối. Cần backend có Redis (`PAYMENT_REDIS_URL`); nếu thiếu, server báo stream.unavailable và app tự dùng polling 4 giây. Chưa kiểm thử thật với backend và thiết bị trong task này.
- Người thực hiện: Claude.

## 2026-11-10 — Làm lại giao diện Gói của bạn và Thanh toán

- Kết quả: Gói của bạn: thẻ "Gói hiện tại" đổi sang nền xanh đậm nổi bật với tên gói lớn, nhãn Đang có hiệu lực, hai cột Bắt đầu/Hết hạn chia đều và sticker bên phải; thẻ giao dịch đang chờ viền cam có biểu tượng đồng hồ, tiêu đề gói/giá và nút tiếp tục; mỗi gói là một thẻ xếp dọc đầy đủ chiều rộng (sticker, tên, nhãn số ngày, giá lớn, nút chọn); lịch sử giao dịch dạng hàng hai cột (tên gói + ngày ở trái, số tiền + trạng thái căn phải) có chevron, hàng cuối không còn đường kẻ. Thanh toán: tóm tắt số tiền ở thẻ giữa kèm nhãn gói; bước 1 và 2 có số thứ tự tròn thẳng hàng với tiêu đề; mã QR trong khung trắng căn giữa, nút lưu QR có biểu tượng; thông tin chuyển khoản là bảng nhãn trái/giá trị phải trong khung nền nhạt; bước chờ có vòng xoay "Đang chờ ngân hàng xác nhận…"; thông tin giao dịch gom vào thẻ riêng. Thêm thành phần dùng chung BillingStep và BillingSectionTitle, đổi BillingDetail sang hàng ngang. Không đổi logic mua, hủy hay realtime.
- Bước kiểm tra UI: (1) Mở Tôi > Gói của bạn ở tài khoản Miễn phí: thẻ xanh hiện tên gói và dòng miễn phí. (2) Mua gói Pro để có gói còn hạn, kiểm tra nhãn Đang có hiệu lực và hai cột ngày. (3) Có giao dịch chờ: thẻ viền cam, bấm Tiếp tục thanh toán. (4) Cuộn xuống chọn gói, kiểm tra thẻ gói thẳng hàng và nút Chọn mở bảng xác nhận. (5) Xem lịch sử: số tiền và trạng thái căn phải, bấm một hàng mở chi tiết, bấm Xem tất cả. (6) Màn Thanh toán đang chờ: tóm tắt số tiền, mã QR rõ, bảng thông tin chuyển khoản không bị tràn với nội dung dài, bước chờ có vòng xoay. (7) Chuyển sang trạng thái thành công và hủy để xem tóm tắt đổi màu. (8) Thử theme tối, chữ lớn, màn hình nhỏ và đăng xuất để xem màn khách. Chưa kiểm tra trực tiếp trên thiết bị.
- Người thực hiện: Claude.

## 2026-11-10 — Bỏ viền màu của các card ở Gói của bạn và Thanh toán

- Kết quả: Bỏ viền màu của các card thông báo như "Thông tin trước khi mua", "Lưu ý về thời hạn" (trước đây có vạch trái xanh/đỏ), bỏ viền cam của thẻ giao dịch đang chờ, viền của thẻ tóm tắt số tiền, khung QR và viền của các thẻ thường. Thẻ phân biệt với nền bằng màu nền và đổ bóng nhẹ; thông báo lỗi chỉ còn phân biệt bằng màu tiêu đề. Giữ lại các đường kẻ phân cách mảnh giữa hàng (lịch sử, bảng thông tin) và dưới header.
- Bước kiểm tra UI: (1) Mở Gói của bạn, kiểm tra các thẻ Thông tin trước khi mua, thẻ gói, lịch sử không còn viền hay vạch màu bên trái. (2) Tạo thông báo lỗi (ví dụ mất mạng) để xem thẻ lỗi chỉ có tiêu đề màu đỏ. (3) Có giao dịch chờ: thẻ không còn viền cam. (4) Mở Thanh toán: thẻ tóm tắt, khung QR và thẻ thông tin giao dịch không viền; bảng chuyển khoản vẫn có đường kẻ giữa hàng. (5) Mở bảng xác nhận mua và hủy, kiểm tra thẻ Lưu ý. (6) Thử theme tối để chắc thẻ vẫn tách khỏi nền. Chưa kiểm tra trực tiếp trên thiết bị.
- Người thực hiện: Claude.

## 2026-11-10 — Rà soát tiêu đề và mô tả, bỏ câu sáo rỗng

- Kết quả: Viết lại chữ ở các màn đã làm trong phiên này (Gói của bạn, Thanh toán, Thực đơn của tôi, form Lên thực đơn, Trợ lý) cho ngắn và tự nhiên hơn. Bỏ các tiêu đề kiểu khẩu hiệu ("Quản lý gói ở một nơi", "Giao dịch của riêng bạn", "Chọn gói phù hợp", "Chuyển đúng thông tin"), bớt "vui lòng", "hệ thống", "sử dụng"; gỡ chữ lặp (số ngày hiện hai lần ở thẻ gói, nút "Đăng nhập để tiếp tục" thành "Đăng nhập"); đổi nhãn nút cho khớp nội dung ("Kiểm tra thanh toán" thành "Kiểm tra lại", "Tiếp tục đến thanh toán" thành "Tiếp tục"). Lời chào của trợ lý nói rõ trợ lý làm được gì. Giữ nguyên ý nghĩa các cảnh báo về tiền, hủy giao dịch và hoàn tiền. Không đổi logic.
- Bước kiểm tra UI: (1) Mở Gói của bạn khi chưa đăng nhập và đã đăng nhập, đọc tiêu đề, thông báo, thẻ gói, bảng xác nhận mua. (2) Mở Thanh toán ở các trạng thái chờ, thành công, hủy, lỗi; đọc bước 1 và 2, thông báo và bảng hủy. (3) Mở Thực đơn của tôi khi chưa có thực đơn, có thực đơn, có bản đề xuất và bản xem trước. (4) Mở tab Trợ lý để đọc lời chào, thanh thông báo thực đơn mới và form; mở màn khách để đọc thẻ xác minh. (5) Kiểm tra không có chữ bị tràn ở chữ lớn. Chưa kiểm tra trực tiếp trên thiết bị.
- Người thực hiện: Claude.

## 2026-11-10 — Nhắn tin riêng 1:1 trên mobile

- Kết quả: Thêm tính năng nhắn tin theo hợp đồng backend (`/messaging/*`): hộp thư có hai ngăn Bạn bè / Tin nhắn lạ kèm số chưa đọc, màn chat (lịch sử phân trang, gửi tin, "Đã xem", tự đánh dấu đã đọc khi tin mới nằm trong tầm nhìn), nút Nhắn tin trên hồ sơ người khác, và lời mời theo dõi lại khi chưa gửi được. Gửi tin dùng `clientMessageId` UUID v4 và giữ nguyên khi thử lại để không gửi trùng; chỉ hiện tin sau khi API xác nhận. Nhận realtime bằng một luồng SSE `/messaging/events` cho cả app (mở khi đăng nhập, dừng khi app xuống nền); khi luồng không khỏe thì các truy vấn polling 5 giây. Theo dõi/bỏ theo dõi làm mới quyền chat. Chỗ đặt: không thêm tab thứ 6 mà đặt biểu tượng Tin nhắn có số chưa đọc cạnh chuông ở header Khám phá, thêm nút ở header hồ sơ của tôi và nút Nhắn tin trên hồ sơ người khác; màn hộp thư/chat là route riêng nên ẩn thanh tab. Tách hook SSE dùng chung `shared/api/use-event-stream.ts`, thanh toán dùng lại hook này.
- Bước kiểm tra UI: (1) Đăng nhập tài khoản A và B trên hai máy. (2) A mở hồ sơ B, bấm Nhắn tin: chat trống, chưa theo dõi thì hiện lời mời theo dõi, chưa có ô nhập. (3) A theo dõi B, ô nhập hiện; gửi tin đầu: tin hiện sau khi gửi xong, B thấy ở Tin nhắn lạ với huy hiệu chưa đọc trên biểu tượng Tin nhắn ở Khám phá. (4) B mở cuộc trò chuyện: thấy "Theo dõi lại để trả lời"; B theo dõi A rồi trả lời, cuộc trò chuyện chuyển sang Bạn bè ở cả hai máy. (5) A đang mở chat: tin của B tới trong khoảng 1–2 giây, B thấy "Đã xem" dưới tin cuối của mình. (6) Tắt mạng rồi gửi: báo lỗi, nội dung còn; bật mạng gửi lại, không bị gửi trùng. (7) Cuộn lên đầu để tải tin cũ. (8) A bỏ theo dõi B và B bỏ theo dõi A: chat còn lịch sử, ô nhập đổi thành lời mời theo dõi. (9) Đưa app xuống nền rồi mở lại: danh sách và chấm chưa đọc đúng. (10) Chưa đăng nhập: biểu tượng Tin nhắn dẫn tới màn mời đăng nhập; thử theme tối và chữ lớn. Backend cần MongoDB replica set; nếu SSE không khả dụng thì app polling. Chưa kiểm thử với backend/thiết bị thật, và phần SSE dùng chung cần thử lại thanh toán.
- Người thực hiện: Claude.

## 2026-11-10 — Bỏ nút tài khoản ở header trang chủ, đưa logo sang trái

- Kết quả: Bỏ nút chữ cái đầu (menu tài khoản) ở header trang Khám phá cùng menu thả xuống của nó; logo Vedora nằm sát trái, các biểu tượng Tìm kiếm, Tin nhắn, Thông báo nằm bên phải. Các mục trong menu cũ vẫn truy cập được ở tab Tôi: Gói của bạn (thẻ gói), Blog của tôi (tab Blog), Thông tin Vedora (bánh răng), Đăng xuất, Đăng nhập/Tạo tài khoản (khi là khách). Xóa mã và style không còn dùng.
- Bước kiểm tra UI: (1) Mở trang Khám phá: header chỉ có logo bên trái và ba biểu tượng bên phải, thẳng hàng, không bị tràn ở màn hình nhỏ. (2) Thử ở theme tối: logo vẫn có nền sáng. (3) Mở tab Tôi, kiểm tra vào được Gói của bạn, Blog của tôi, cài đặt, đăng xuất. (4) Khi chưa đăng nhập, tab Tôi có nút Đăng nhập và Tạo tài khoản. Chưa kiểm tra trực tiếp trên thiết bị.
- Người thực hiện: Claude.

## 2026-11-10 — Sắp xếp lại hành động của bài viết

- Kết quả: Thanh hành động của bài viết đổi thứ tự thành Thả mầm (like), Bình luận, Đăng lại, rồi Lượt xem và Lưu như cũ. Áp dụng cho thẻ bài viết (bảng tin, chi tiết bài, kết quả tìm kiếm, hồ sơ) và thẻ bài mẫu. Không đổi hành vi hay nhãn trợ năng.
- Bước kiểm tra UI: (1) Mở Khám phá, xem hàng hành động dưới một bài: lá thả mầm, bình luận, đăng lại, lượt xem, lưu theo đúng thứ tự trái sang phải. (2) Bấm từng nút: thả mầm đổi màu, bình luận mở chi tiết, đăng lại bật/tắt, lưu bật/tắt. (3) Xem thẻ bài mẫu khi bảng tin trống. (4) Mở chi tiết bài, trang hồ sơ người khác và tìm kiếm để chắc thứ tự giống nhau. (5) Dùng trình đọc màn hình, đọc nhãn theo thứ tự mới. Chưa kiểm tra trực tiếp trên thiết bị.
- Người thực hiện: Claude.

## 2026-11-10 — Xem video dạng lướt dọc như TikTok

- Kết quả: Thêm màn Video toàn màn hình (`/videos`) mở từ nút "Video" cạnh các tab lọc ở Khám phá. Mỗi video chiếm trọn một màn hình, vuốt lên/xuống để chuyển video (cuộn dừng đúng từng video), tự phát video đang xem, lặp lại, chạm để tạm dừng/phát, thanh tiến độ mỏng ở đáy, nút đóng và bật/tắt tiếng ở trên. Video dọc phủ kín màn hình, video ngang giữ nguyên khung. Bên phải có Thả mầm, Bình luận (mở chi tiết bài), Đăng lại, Lưu; bên trái dưới là tác giả (mở hồ sơ) và mô tả, chạm để xem thêm. Chỉ có một trình phát hoạt động tại video đang xem, video khác hiện ảnh bìa nên bộ nhớ ổn định. Dữ liệu lấy từ danh sách bài viết (`type=POST`), lọc các bài có video đã xử lý xong vì API chưa có bộ lọc riêng cho video; tự tải thêm khi còn ít hơn 3 video phía trước. Thích/lưu/đăng lại dùng lại hook của thẻ bài và yêu cầu đăng nhập như cũ. Không thêm thư viện (dùng expo-video có sẵn).
- Bước kiểm tra UI: (1) Mở Khám phá, bấm Video cạnh các tab lọc: màn đen toàn màn hình, video đầu tự phát. (2) Vuốt lên: chuyển sang video kế, video cũ dừng, video mới phát từ đầu; vuốt xuống quay lại. (3) Chạm giữa màn hình để tạm dừng (hiện nút phát) và chạm lại để phát tiếp. (4) Bấm biểu tượng loa để tắt/bật tiếng, giữ nguyên khi chuyển video. (5) Bấm Thả mầm, Đăng lại, Lưu: đổi màu và số; khi chưa đăng nhập được dẫn tới đăng nhập. (6) Bấm Bình luận mở chi tiết bài, quay lại video không chạy chồng tiếng. (7) Bấm tên tác giả mở hồ sơ. (8) Thử video ngang và video dọc, mô tả dài (chạm để mở rộng). (9) Cuộn tới cuối để kiểm tra tự tải thêm; thử khi chưa có video nào và khi mất mạng. (10) Đưa app xuống nền, tiếng phải dừng. Chưa kiểm tra trực tiếp trên thiết bị, cần thử thật với video HLS.
- Người thực hiện: Claude.

## 2026-11-10 — Sửa hàng tab Khám phá khi thêm nút Video

- Kết quả: Nút Video không còn là tab thứ tư nên các tab không bị chia bốn cột làm "Dành cho bạn" và "Đang theo dõi" xuống hai dòng và lệch hàng. Ba tab Dành cho bạn, Đang theo dõi, Blog chia đều phần chiều rộng còn lại, nhãn một dòng và tự thu nhỏ nhẹ khi hẹp; Video là nút viên thuốc nền xanh có biểu tượng phát, căn giữa theo chiều dọc ở cuối hàng, thể hiện rõ đây là chức năng mở chế độ xem riêng chứ không phải bộ lọc.
- Bước kiểm tra UI: (1) Mở Khám phá ở màn hình nhỏ và lớn: ba tab cùng một dòng, gạch chân tab đang chọn thẳng hàng, nút Video thẳng hàng với chữ tab. (2) Bấm lần lượt từng tab, đổi nội dung đúng; bấm Video mở chế độ lướt. (3) Thử chữ lớn và theme tối. Chưa kiểm tra trực tiếp trên thiết bị.
- Người thực hiện: Claude.

## 2026-11-10 — Làm lại hàng tab Khám phá: bốn cột đều

- Kết quả: Bản nút viên thuốc vẫn thấy lệch nên đổi lại thành một hàng bốn cột bằng nhau, cùng chiều cao 48, nhãn một dòng căn giữa: Dành cho bạn, Theo dõi, Blog và Video (có biểu tượng phát cùng màu nhấn, không có gạch chân vì mở màn riêng). Đổi nhãn "Đang theo dõi" thành "Theo dõi" để không phải xuống dòng; nhãn tự thu nhỏ nhẹ nếu quá hẹp. Đã xem thử bản web ở khổ điện thoại, bốn cột cùng rộng và cùng y.
- Bước kiểm tra UI: (1) Mở Khám phá trên điện thoại: bốn nhãn cùng một dòng, cách đều, gạch chân tab đang chọn thẳng hàng. (2) Bấm từng tab, nội dung đổi đúng; bấm Video mở chế độ lướt và quay lại vẫn giữ tab cũ. (3) Thử chữ lớn, theme tối, màn hình hẹp. Chưa kiểm tra trực tiếp trên thiết bị thật.
- Người thực hiện: Claude.

## 2026-11-10 — Khoảng cách đều giữa các nhãn tab Khám phá

- Kết quả: Bốn cột bằng nhau làm khoảng trống giữa các chữ không đều vì nhãn dài ngắn khác nhau. Đổi sang tab ôm theo chiều dài chữ và dàn đều bằng khoảng cách giữa các tab bằng nhau; chữ đầu và chữ cuối thẳng lề trang, gạch chân tab đang chọn vừa với chữ. Đã đo trên bản web khổ 375: khoảng cách giữa các nhãn 42, 41, 41 px, lề trái 16 và lề phải 16.
- Bước kiểm tra UI: (1) Mở Khám phá: khoảng trống giữa Dành cho bạn, Theo dõi, Blog, Video nhìn đều nhau. (2) Chọn từng tab, gạch chân ôm sát chữ. (3) Thử màn hình hẹp (360) và bật chữ lớn để chắc bốn nhãn vẫn nằm một hàng. Chưa kiểm tra trên thiết bị thật.
- Người thực hiện: Claude.

## 2026-11-10 — Tiêu đề bài video in đậm, bỏ dòng trống giữa tiêu đề và mô tả

- Kết quả: Bài video được lưu dạng "tiêu đề, dòng trống, mô tả" nên khi hiển thị có một hàng trống lớn giữa hai phần. Nay dòng đầu của bài video luôn in đậm (kể cả khi chưa có mô tả), mô tả nằm ngay bên dưới không còn hàng trống; giữ nguyên tô màu hashtag, xem thêm/thu gọn. Giảm nhẹ chiều cao dòng nội dung bài từ 23 xuống 22. Bài chữ thường không đổi cách hiển thị đoạn.
- Bước kiểm tra UI: (1) Mở Khám phá, xem bài video có cả tiêu đề và mô tả: tiêu đề đậm, mô tả sát ngay dưới, không còn dòng trống. (2) Bài video chỉ có tiêu đề: tiêu đề vẫn đậm. (3) Bài chữ thường nhiều đoạn: đoạn vẫn tách như cũ. (4) Mô tả dài: Xem thêm/Thu gọn vẫn đúng; hashtag vẫn có màu. (5) Mở chi tiết bài, trang hồ sơ và kết quả tìm kiếm để kiểm tra giống nhau. Chưa kiểm tra trực tiếp trên thiết bị.
- Người thực hiện: Claude.

## 2026-11-10 — Tiêu đề bài video: tách thành khối riêng để chắc chắn in đậm

- Kết quả: Trên điện thoại (iOS) tiêu đề bài video chưa hiện đậm dù bản web đã đúng, nên không dùng chữ lồng nhau trong cùng một đoạn nữa. Tiêu đề (dòng đầu) là một khối chữ riêng, in đậm cỡ 16, tối đa 2 dòng khi thu gọn; mô tả là khối riêng ngay bên dưới (cách 2px), tối đa 4 dòng khi thu gọn, vẫn tô màu hashtag. Xem thêm/Thu gọn vẫn hoạt động cho cả hai khối. Bài chữ thường không đổi.
- Bước kiểm tra UI: (1) Tải lại app, mở Khám phá, xem bài video như "Đậu hủ kho nấm": tiêu đề đậm, mô tả nhạt hơn ngay bên dưới. (2) Bài video chỉ có tiêu đề vẫn đậm. (3) Bài chữ thường không đậm. (4) Mô tả dài: Xem thêm mở rộng cả hai khối, Thu gọn trả về. (5) Mở chi tiết bài và hồ sơ để kiểm tra cùng cách hiển thị. Chưa kiểm tra trực tiếp trên iPhone.
- Người thực hiện: Claude.

## 2026-11-10 — Tiêu đề bài video dùng font đậm của tiêu đề

- Kết quả: Qua ảnh chụp từ Expo Go, chữ tiêu đề đã rộng hơn mô tả khoảng 14% nên bản in đậm có áp dụng nhưng Source Sans đậm ở cỡ 16 quá nhẹ so với mô tả. Đổi tiêu đề bài video sang font tiêu đề Be Vietnam Pro Bold cỡ 17 (cùng kiểu với tiêu đề blog) để thấy rõ đậm hơn hẳn mô tả.
- Bước kiểm tra UI: (1) Tải lại Expo Go, xem bài "Đậu hủ kho nấm": tiêu đề đậm rõ, lớn hơn mô tả. (2) So với tiêu đề thẻ blog, hai kiểu chữ giống nhau. (3) Bài video chỉ có tiêu đề; bài chữ thường không đậm. Chưa kiểm tra trên thiết bị sau lần đổi này.
- Người thực hiện: Claude.

## 2026-11-10 — Làm lại giao diện danh sách bình luận

- Kết quả: Danh sách bình luận dạng bong bóng: ảnh đại diện bên trái, khung nền nhạt chứa tên (đậm) và nội dung, nhãn "Tác giả" cho bình luận của chủ bài; dưới khung là hàng nhỏ gồm thời gian tương đối (Vừa xong, 5 phút, 3 giờ, 2 ngày, rồi ngày tháng), "Đã sửa" khi có chỉnh sửa, cùng nút Sửa/Xóa theo quyền. Tiêu đề "Bình luận" kèm số lượng trong nhãn tròn; trạng thái rỗng có biểu tượng và lời mời bình luận; lỗi tải có nút Thử lại; nút "Xem thêm bình luận" dạng viên thuốc căn giữa. Ô viết bình luận dùng chung ô nhập của chat (khung bo tròn, nút gửi tròn, ô tự co giãn) kèm thanh "Đang sửa bình luận" có nút Hủy và thông báo lỗi ngay trên ô; khách thấy nút "Đăng nhập để bình luận". Giữ nguyên logic sửa, xóa, phân trang. Đã xem thử trên bản web với dữ liệu giả.
- Bước kiểm tra UI: (1) Mở chi tiết một bài có bình luận: xem bong bóng, tên, nhãn Tác giả, thời gian. (2) Với bình luận của mình: có Sửa và Xóa; với bình luận của người khác trên bài của mình: chỉ có Xóa. (3) Bấm Sửa: hiện thanh Đang sửa, nội dung vào ô, Hủy thoát chế độ sửa; sửa xong có chữ Đã sửa. (4) Gửi bình luận mới, xóa một bình luận và xác nhận. (5) Bài chưa có bình luận: trạng thái rỗng. (6) Bài nhiều bình luận: Xem thêm bình luận. (7) Chưa đăng nhập: nút Đăng nhập để bình luận. (8) Bàn phím mở, ô nhập nhiều dòng, theme tối, chữ lớn. Chưa kiểm tra trực tiếp trên iPhone.
- Người thực hiện: Claude.

## 2026-11-10 — Làm lại giao diện tạo và sửa blog

- Kết quả: Đối chiếu với API blog (`POST/PATCH /blogs`: tiêu đề 1–150 ký tự, Markdown tối đa 50.000 ký tự, ảnh bìa là đường dẫn, trạng thái DRAFT/PUBLISHED, tối đa 10 công thức liên kết): giữ nguyên toàn bộ logic lưu, đăng, chuyển nháp, tải ảnh và chặn rời màn khi chưa lưu; chỉ đổi giao diện. Header có nút quay lại tròn, tiêu đề và trạng thái (chấm màu Bản nháp/Đã đăng, "Chưa lưu" khi có thay đổi), nút "Xem bài" khi đã đăng. Chuyển Soạn thảo / Xem trước dạng thanh phân đoạn. Ảnh bìa là khung nét đứt "Thêm ảnh bìa" (kèm gợi ý định dạng và dung lượng), có ảnh thì hiện tỷ lệ 16:9 với nút Đổi ảnh/Gỡ nằm trên ảnh. Tiêu đề là ô lớn không viền với bộ đếm ký tự. Khung nội dung có thanh công cụ Đề mục, Chữ đậm, Chữ nghiêng, Danh sách, Chèn ảnh: chèn tại vị trí con trỏ (trước đây ảnh luôn thêm vào cuối). Thanh hành động cố định ở đáy gồm Lưu nháp/Lưu thay đổi và Đăng blog/Chuyển về nháp, thông báo đang lưu, lỗi, thành công nằm ngay phía trên. Hộp thoại bỏ thay đổi được làm gọn. Chưa thêm chọn công thức liên kết hay tải video vào bài (API có hỗ trợ), để làm riêng nếu cần.
- Bước kiểm tra UI: (1) Mở Tôi > Blog của tôi > Viết blog: xem khung ảnh bìa, tiêu đề, thanh công cụ và thanh Lưu nháp/Đăng blog ở đáy. (2) Chọn ảnh bìa, kiểm tra tỷ lệ, bấm Đổi ảnh và Gỡ. (3) Gõ nội dung, đặt con trỏ giữa đoạn văn rồi bấm Chữ đậm, Danh sách, Đề mục: ký hiệu chèn đúng chỗ; bôi chọn chữ rồi bấm Chữ đậm để bao quanh. (4) Bấm Chèn ảnh: ảnh chèn tại con trỏ. (5) Chuyển sang Xem trước: ảnh bìa, tiêu đề và nội dung hiển thị đúng. (6) Lưu nháp, đăng blog, chuyển về nháp, sửa blog cũ; kiểm tra thông báo thành công/lỗi trên thanh đáy. (7) Có thay đổi chưa lưu rồi bấm quay lại: hiện hộp thoại bỏ thay đổi. (8) Bàn phím mở: thanh đáy nằm trên bàn phím; thử theme tối và chữ lớn. Đã xem bản web (khung soạn, thanh công cụ, nút đáy hiển thị đúng); chèn tại con trỏ cần thử trên điện thoại vì bản web không báo vị trí con trỏ sau khi gõ.
- Người thực hiện: Claude.

## 2026-11-10 — Trợ lý viết blog bằng AI trên mobile

- Kết quả: Thêm nút "Trợ lý" ở header màn viết/sửa blog, mở khung chat trượt lên theo `POST /blogs/ai/chat` (SSE) và `GET /blogs/ai/quota`. Trợ lý chỉ đề xuất: mỗi thay đổi (thay đoạn đang chọn, sửa một đoạn, chèn nội dung ở con trỏ/cuối bài/sau một đoạn, đổi tiêu đề, chèn hoặc thay ảnh) hiện thành thẻ có xem trước cũ/mới cùng nút Chấp nhận / Từ chối; chỉ khi chấp nhận mới đổi bài. App kiểm tra đoạn cần sửa xuất hiện đúng một lần, đoạn đang chọn chưa bị sửa, tối đa 50.000 ký tự và tiêu đề 150 ký tự, nếu không áp dụng được thì báo lại cho trợ lý (NO_SELECTION, NOT_FOUND, AMBIGUOUS, STALE). Khi xử lý hết đề xuất của một câu trả lời, app tự gửi lượt tiếp theo để trợ lý làm tiếp. Gửi kèm tiêu đề, nội dung hiện tại (kể cả chưa lưu), đoạn đang chọn và blogId khi bài đã lưu (404 thì gửi lại không kèm blogId). Hiện "Còn N lượt hôm nay", gợi ý nhanh theo việc có chọn đoạn hay không, bước tạo/chỉnh ảnh và tra tài liệu hiển thị tiến độ và ảnh kết quả, lỗi hết lượt/quá nhanh/quá tải/mất mạng có thông báo và nút Thử lại, cuộc trò chuyện mới. Mở rộng bộ đọc SSE chung (`shared/api/ai-stream.ts`) để trả các phần theo đúng thứ tự gồm chữ và lệnh công cụ; không đổi cách dùng của trợ lý thực đơn và hỏi đáp dinh dưỡng. Logic áp dụng đề xuất và bộ đọc luồng đã được thử bằng 17 + 8 ca kiểm tra tự động bằng script tạm (không lưu vào repo).
- Bước kiểm tra UI: (1) Đăng nhập, mở Viết blog, bấm Trợ lý: khung chat, "Còn N lượt hôm nay", gợi ý nhanh. (2) Gõ vài đoạn, bấm "Gợi ý tiêu đề hấp dẫn cho bài": thẻ Đổi tiêu đề; Chấp nhận thì đóng khung và tiêu đề đổi; Từ chối thì giữ nguyên và trợ lý hỏi lại. (3) Bôi chọn một đoạn, mở Trợ lý, nhờ viết lại: thẻ Thay đoạn bạn đã chọn, Chấp nhận thay đúng đoạn, thử sửa đoạn đó rồi mới chấp nhận để thấy bị từ chối vì đã đổi. (4) Nhờ thêm phần mở đầu/cuối bài và tạo ảnh bìa: thấy trạng thái đang tạo ảnh, ảnh kết quả, thẻ chèn ảnh. (5) Nhờ một yêu cầu có nhiều thay đổi: xử lý lần lượt từng thẻ, trợ lý tự làm tiếp. (6) Cuộc trò chuyện dài, bấm Cuộc trò chuyện mới. (7) Tắt mạng khi gửi: báo lỗi và Thử lại. (8) Dùng hết lượt (hoặc thử với tài khoản hết lượt): thông báo và khóa ô nhập. (9) Khi còn đề xuất chờ duyệt, ô nhập đổi thành lời nhắc chấp nhận hoặc từ chối trước. (10) Thử theme tối, chữ lớn, bàn phím mở. Chưa kiểm thử với backend và mô hình AI thật; cần thử trên thiết bị.
- Người thực hiện: Claude.

## 2026-11-10 — Sửa bàn phím che ô nhập trong trợ lý viết blog

- Kết quả: Trong khung trợ lý viết blog (cửa sổ trượt lên), bàn phím che ô nhập vì khung không có xử lý bàn phím. Trên iOS nay lấy chiều cao bàn phím từ sự kiện bàn phím và đẩy cả khung chat lên đúng chừng đó (không dùng KeyboardAvoidingView vì nó tính vị trí theo cửa sổ nên lệch khi nằm trong khung trượt), đồng thời bỏ khoảng đệm an toàn phía dưới khi bàn phím mở để không còn khoảng trống giữa ô nhập và bàn phím. Trên Android hệ thống tự co cửa sổ nên không cộng thêm.
- Bước kiểm tra UI: (1) iPhone: mở trợ lý trong màn viết blog, chạm ô nhập: ô nhập nằm ngay trên bàn phím, danh sách tin nhắn cuộn xuống cuối, không còn khoảng trống thừa. (2) Gõ nhiều dòng: ô cao dần, vẫn nằm trên bàn phím. (3) Gửi tin, đóng bàn phím: khung trở về bình thường. (4) Thử iPhone có tai thỏ và iPhone nhỏ, Android, xoay ngang, bật bàn phím gợi ý. Chưa kiểm tra trên thiết bị thật vì bản web không có bàn phím ảo.
- Người thực hiện: Claude.

## 2026-11-10 — Bỏ ký tự Markdown (##, \*\*...) trong đoạn xem trước của blog

- Kết quả: API trả `excerpt` là văn bản nguồn cắt ở 280 ký tự nên có cả `##`, `**`, `-`, liên kết, ảnh. Thêm hàm `plainText` (blogs/utils/markdown.ts) làm phẳng Markdown thành chữ thường: bỏ dấu đề mục, đậm/nghiêng, danh sách, trích dẫn, mã, đường kẻ, thẻ HTML; liên kết giữ chữ, ảnh bỏ hẳn, dấu bị cắt dở ở cuối đoạn cũng bỏ; giữ hashtag và các ký tự như 2\*3, snake_case. Áp dụng cho thẻ blog ở trang chính, tìm kiếm, đã lưu, hồ sơ (cùng thẻ bài) và danh sách "Blog của tôi". Trang đọc blog vẫn dùng trình hiển thị Markdown đầy đủ. Đã thử 10 ca bằng script tạm.
- Bước kiểm tra UI: (1) Viết blog có đề mục ##, chữ đậm, danh sách và ảnh rồi đăng; mở Khám phá tab Blog: đoạn mô tả không còn ##, \*\* hay dấu gạch đầu dòng, chữ liền mạch. (2) Mở Tôi > Blog của tôi: mô tả cũng sạch ký tự. (3) Mở chi tiết bài: nội dung vẫn có đề mục, đậm, danh sách đúng định dạng. (4) Blog mô tả quá ngắn hoặc chỉ có ảnh: không hiện dòng trống lạ. Chưa kiểm tra trực tiếp trên thiết bị.
- Người thực hiện: Claude.

## 2026-11-10 — Phóng to ảnh trong app và sửa ảnh tràn khung ở trợ lý viết blog

- Kết quả: Thêm trình xem ảnh toàn màn hình dùng chung (`shared/components/image-viewer.tsx`) và component `ZoomImage` thay trực tiếp cho `Image`: chạm ảnh để mở nền đen, chụm hai ngón để phóng to tới 5 lần, kéo để di chuyển khi đang phóng, chạm đôi để phóng 2,5 lần hoặc thu về, kéo ảnh xuống để đóng (nền mờ dần), nút X và cử chỉ quay lại của hệ thống đều đóng được; nhiều ảnh thì vuốt ngang để chuyển và hiện số thứ tự. Viết bằng PanResponder và Animated, không thêm thư viện, chạy giống nhau trên iOS, Android và web. Đã áp dụng cho: ảnh trong bài blog, ảnh món ở chi tiết công thức, ảnh bìa và ảnh đại diện ở hồ sơ của tôi và hồ sơ người khác, mã QR thanh toán (phóng to để quét từ máy khác), ảnh bìa trong trình soạn blog, ảnh do trợ lý viết blog tạo hoặc đề xuất. Giữ nguyên chạm để mở bài với ảnh trong thẻ danh sách (thẻ blog, thẻ công thức), ảnh đại diện nhỏ trong danh sách/bình luận/thông báo và sticker trang trí. Sửa ảnh trong trợ lý viết blog bị tràn khung: ảnh nay nằm trong cột nội dung, theo đúng tỷ lệ đã yêu cầu (1:1, 4:3, 3:4, 16:9), ảnh đề xuất chèn hiển thị trọn ảnh trong khung cao 200.
- Bước kiểm tra UI: (1) Mở một blog có ảnh trong bài, chạm ảnh: mở toàn màn hình; chụm để phóng, kéo để di chuyển, chạm đôi để thu về, kéo xuống để đóng. (2) Mở hồ sơ của tôi và hồ sơ người khác, chạm ảnh bìa và ảnh đại diện. (3) Chi tiết công thức: chạm ảnh món. (4) Màn thanh toán: chạm mã QR, phóng to. (5) Trình soạn blog: chọn ảnh bìa rồi chạm ảnh; nút Đổi ảnh và Gỡ vẫn bấm được. (6) Nhờ trợ lý tạo ảnh: ảnh không tràn khung ở cả ảnh 1:1, 3:4, 16:9; chạm để phóng. (7) Bài có nhiều ảnh: vuốt ngang và số thứ tự đổi. (8) Thử Android và iPhone, chữ lớn và xoay ngang; đảm bảo chụm hai ngón mượt, không bị cuộn trang phía sau. Đã thử mở, chạm đôi phóng, kéo xuống đóng trên bản web; chưa thử chụm hai ngón vì bản web không giả lập được.
- Người thực hiện: Claude.

## 2026-11-10 — Hộp thư tin nhắn: một danh sách duy nhất có nhãn

- Kết quả: Bỏ thanh chuyển Bạn bè / Tin nhắn lạ. Hộp thư là một danh sách chung, xếp theo hoạt động gần nhất. Mỗi hàng có nhãn cạnh tên: "Bạn bè" (nền xanh nhạt), "Tin nhắn lạ" (chữ cam, người chỉ theo dõi bạn hoặc hai bên đã bỏ theo dõi) và "Chờ phản hồi" (bạn đã nhắn nhưng họ chưa theo dõi lại), cộng một dòng gợi ý nhỏ phía dưới: "Muốn nhắn tin với bạn" hoặc "Chờ họ theo dõi lại để trả lời". API vẫn tách hai hộp nên app tải cả hai và gộp theo thời gian tin cuối; cuộn tới cuối tải thêm cả hai, kéo xuống để làm mới cả hai. Số chưa đọc ở biểu tượng Tin nhắn vẫn tính cả hai hộp. Nhãn trợ năng của mỗi hàng đọc cả loại cuộc trò chuyện. Đã xem thử trên bản web với dữ liệu giả.
- Bước kiểm tra UI: (1) Mở Tin nhắn: một danh sách, không còn hai ngăn. (2) Bạn bè có nhãn Bạn bè; người lạ nhắn tới có nhãn Tin nhắn lạ cùng dòng "Muốn nhắn tin với bạn"; tin bạn nhắn mà chưa được theo dõi lại có nhãn Chờ phản hồi. (3) Tin mới nhất nằm trên cùng, huy hiệu chưa đọc đúng. (4) Nhắn tin bằng hai tài khoản để thấy hàng chuyển từ Tin nhắn lạ sang Bạn bè khi theo dõi lại. (5) Có nhiều cuộc trò chuyện: cuộn tới cuối để tải thêm. (6) Danh sách rỗng, lỗi mạng và kéo làm mới. Chưa kiểm tra với backend thật.
- Người thực hiện: Claude.

## 2026-11-10 — Trình soạn blog theo khối: định dạng không hiện ký tự Markdown, ảnh xem trước ngay trong bài

- Kết quả: Ô nội dung blog không còn là một ô Markdown. Bài chia thành các khối: đoạn văn, đề mục, danh sách, đánh số, trích dẫn, ảnh và khối giữ nguyên (đoạn mã, đường kẻ). Khối chữ là ô nhập gốc; chữ đậm/nghiêng lưu theo từng ký tự nên chỉ hiện kiểu chữ, không hiện `**`, `*`, `##`. Bôi chọn chữ rồi bấm Chữ đậm/Chữ nghiêng để áp dụng hoặc bỏ; khi không bôi chọn thì bấm để áp dụng cho chữ gõ tiếp theo. Chữ gõ giữa đoạn đậm thì tiếp tục đậm, xóa hoặc dán không làm lệch định dạng. Enter tạo khối mới (danh sách tiếp tục mục kế, mục rỗng thì thoát danh sách), Backspace ở đầu khối đưa đề mục/danh sách về đoạn văn hoặc nối vào đoạn trên. Ảnh hiện thành khối xem trước đúng tỷ lệ (chạm để phóng to), có chú thích tùy chọn, nút chuyển lên/xuống và xóa; nút Chèn ảnh thêm khối ảnh sau khối đang chọn. Thanh công cụ (Đề mục, Đậm, Nghiêng, Danh sách, Đánh số, Trích dẫn, Chèn ảnh) nằm trên bàn phím và sáng lên theo định dạng tại con trỏ. Khi lưu, bài vẫn là Markdown như API yêu cầu; mở blog cũ thì đọc Markdown thành khối. Bản xem trước và trợ lý viết blog vẫn dùng Markdown: các thay đổi trợ lý đề xuất áp lên đúng vị trí đang chọn (quy đổi từ khối sang Markdown) rồi bài được nạp lại thành khối. Đã kiểm tra bằng 38 ca tự động (chuyển Markdown ↔ khối, gõ giữa chữ đậm, bật/tắt đậm nghiêng, tách/gộp khối, chèn ảnh, vị trí chọn cho trợ lý); trên bản web thử được Enter tách khối, đổi đề mục, danh sách và bản xem trước. Chưa thử cảm ứng thật.
- Bước kiểm tra UI: (1) Mở Viết blog, gõ vài dòng; bôi chọn một từ, bấm Chữ đậm: từ đó đậm ngay, không có ký tự `**`; bấm lại để bỏ. (2) Đặt con trỏ, bấm Chữ nghiêng rồi gõ: chữ mới nghiêng. (3) Bấm Đề mục: dòng thành đề mục lớn; bấm lại trở về đoạn văn. (4) Bấm Danh sách rồi Enter vài lần, Enter trên mục rỗng để thoát danh sách. (5) Chèn ảnh: ảnh hiện ngay trong bài, thử chạm để phóng, chú thích, chuyển lên/xuống, xóa. (6) Gõ tiếng Việt bằng Telex/VNI ở iPhone và Android, kiểm tra không lặp hay mất chữ, và con trỏ không nhảy về cuối khi sửa giữa đoạn, khi bật/tắt đậm. (7) Lưu nháp, đóng rồi mở lại: định dạng, ảnh còn nguyên, không báo "Chưa lưu". (8) Blog cũ có đề mục, danh sách, đậm, nghiêng, ảnh, đoạn mã: mở ra hiển thị đúng. (9) Xem trước và đăng: bài giống khi soạn. (10) Mở Trợ lý với một đoạn đang chọn, nhờ viết lại và chấp nhận: thay đúng đoạn; thử chèn ở con trỏ và cuối bài. (11) Chữ lớn, theme tối, bàn phím mở: thanh công cụ nằm trên bàn phím. Điểm cần soi kỹ: ô nhập nhiều khối có chữ định dạng ở ô nhập gốc trên Android/iOS (con trỏ, IME), vì chưa thử trên máy thật.
- Người thực hiện: Claude.

## 2026-11-10 — Sửa phông chữ không nạp được trên iPhone (chữ đậm không hiện)

- Kết quả: Trên Expo Go iOS, `useFonts` báo lỗi "Cannot read property 'getAssetByID' of undefined" nên toàn bộ phông tùy chỉnh (Source Sans 3, Be Vietnam Pro...) không nạp và chữ dùng phông hệ thống, vì vậy chữ đậm không hiện. Nguyên nhân: `expo-asset` lấy `AssetRegistry` từ `react-native`, còn NativeWind chuyển hướng import này sang bản bọc không có `AssetRegistry`. `metro.config.js` nay cho riêng `expo-asset` nạp `react-native` trực tiếp. Bản web không bị lỗi này. Đã xác nhận trên iPhone: phông nạp được, chữ đậm hiện.
- Bước kiểm tra UI: (1) Chạy `npx expo start -c`, tắt hẳn Expo Go rồi mở lại. (2) Màn chào: tiêu đề và nút đậm rõ, chữ thân dùng Source Sans 3. (3) Trang chính: tiêu đề bài video đậm. (4) Blog có chữ đậm hiển thị đúng; trong Viết blog, bôi chọn chữ rồi bấm Đậm: chữ đậm ngay. (5) Thử thêm Android.
- Người thực hiện: Claude.

## 2026-11-10 — Trình soạn blog: bớt khoảng cách khi Enter, sửa Backspace

- Kết quả: Mỗi lần Enter tạo một khối mới nên khoảng cách giữa các dòng bị cộng dồn (khoảng 12px ngoài chiều cao dòng); nay các khối sát nhau (khoảng 4px), chỉ đề mục có thêm khoảng trống phía trên. Sửa Backspace: sau khi Enter hoặc sau khi nối khối, ô mới nhận con trỏ ở đầu nhưng app chưa biết vị trí đó nên Backspace ở dòng trống không làm gì; nay vị trí con trỏ được ghi nhận ngay và cả khi một ô được chạm để lấy focus.
- Bước kiểm tra UI: (1) Gõ vài dòng, Enter giữa chúng: khoảng cách giống xuống dòng bình thường. (2) Enter rồi Backspace ngay ở dòng trống: dòng mất, con trỏ về cuối dòng trên. (3) Đặt con trỏ ở đầu một dòng có chữ, Backspace: dòng nối vào dòng trên, con trỏ đứng đúng chỗ nối. (4) Đề mục, danh sách: Backspace ở đầu đưa về đoạn văn. (5) Thử iPhone và Android.
- Người thực hiện: Claude.

- Bổ sung (cùng ngày): Enter nhảy hai dòng. Ô nhập có chữ định dạng giữ nguyên dấu xuống dòng vừa gõ trong ô gốc (app đã tách nó thành khối mới nhưng nội dung khối cũ không đổi nên ô không được vẽ lại), nên khối cũ thừa một dòng trống. Nay khối bị tách được dựng lại ngay sau Enter. Kiểm tra: gõ chữ, Enter ở cuối dòng và giữa dòng: con trỏ xuống đúng một dòng, dòng trên không dư dòng trống; thử chữ đậm/nghiêng trên iPhone và Android. Người thực hiện: Claude.

- Bổ sung (cùng ngày): bàn phím tắt rồi mở khi Enter hoặc Backspace về dòng trên. Nguyên nhân: ô đang gõ bị dựng lại hoặc gỡ đi nên iOS đóng bàn phím rồi mở lại khi ô khác nhận focus. Nay Enter được xử lý như phím gửi (`submitBehavior="submit"`, không chèn dấu xuống dòng) nên không cần dựng lại ô; Backspace chuyển focus sang ô phía trên trước rồi mới gỡ ô hiện tại. Kiểm tra: gõ chữ, Enter nhiều lần rồi Backspace lùi về các dòng trước: bàn phím giữ nguyên, màn hình không nháy; Enter giữa dòng vẫn tách đúng chữ; thử iPhone và Android. Người thực hiện: Claude.

- Bổ sung (cùng ngày): chữ nghiêng không hiện và dấu đầu dòng (•, 1.) lệch dòng. Nghiêng: khi phông tùy chỉnh đã nạp được, iOS không tự làm nghiêng phông không có bản nghiêng; nay nạp thêm Source Sans 3 Regular Italic, Bold Italic và Be Vietnam Pro Bold Italic, rồi chọn đúng file theo định dạng (đậm, nghiêng, đậm + nghiêng, đề mục, trích dẫn) trong trình soạn và trang đọc blog. Lệch dòng: dấu đầu dòng thiếu phần đệm trên/dưới giống ô nhập nên thấp hơn chữ cùng dòng; nay hai bên cùng đệm. Kiểm tra: bôi chọn chữ rồi bấm Nghiêng, Đậm, cả hai: chữ đổi đúng kiểu; trích dẫn nghiêng; mở bài có chữ _nghiêng_ ở trang đọc; danh sách dấu đầu dòng và số thẳng hàng với dòng chữ đầu của mục, kể cả mục dài nhiều dòng. Người thực hiện: Claude.

## 2026-11-10 — Sửa lỗi "Cannot convert BigInt to number" khi đăng video

- Kết quả: Khi tải video lên từ điện thoại, hàm báo tiến trình của `expo-file-system` có thể trả số byte dạng BigInt trên iOS, làm phép tính phần trăm (`Math.min`, chia) văng lỗi và dừng đăng. `compose.service.ts` nay ép `bytesSent`, `totalBytes` và kích thước file về số thường trước khi tính.
- Bước kiểm tra UI: (1) Mở Tạo bài, chọn một video nhỏ rồi đăng: thanh tiến trình chạy tới 100%, bài đăng thành công, không hiện lỗi đỏ. (2) Thử video lớn hơn một khối tải (chia nhiều phần): phần trăm tăng đều qua từng phần. (3) Hủy giữa chừng: tải dừng, không lỗi. (4) Thử iPhone và Android.
- Người thực hiện: Claude.

## 2026-11-10 — Gói Plus / Pro mới và hạn mức AI theo gói (đồng bộ API billing v2)

- Kết quả: Đã pull vedora-api (main mới) và đọc `subscriptions.md`, `sepay-payments.md`, `blog-ai-assistant.md`, `errors.md`. App chuyển sang catalogue v2: gói mua được là Plus (49.000 đ) và Pro (99.000 đ), mỗi gói 30 ngày; Premium chỉ còn trong lịch sử (hiện "Premium (gói cũ)"). Tạo giao dịch gửi `planVersion: 2` như API yêu cầu. Lịch sử, giao dịch chờ và màn thanh toán hiện tên gói theo `purchasedPlanName` (giữ tên lúc mua). Màn Gói của bạn có thêm: thẻ "Lượt dùng AI" với hai thanh đo (lượt hỏi trợ lý, lượt tạo ảnh) gồm đã dùng/giới hạn, còn lại và thời điểm đặt lại (Miễn phí theo ngày, Plus/Pro theo chu kỳ); so sánh ba mức Miễn phí/Plus/Pro kèm hạn mức do server trả, nhãn "Đang dùng" và nút "Mua lại"; hộp xác nhận nêu rõ thu đủ giá, gói cũ bị thay ngay và lượt chưa dùng mất khi đang có gói trả phí. Màn thanh toán thành công nêu hạn mức chu kỳ mới. Bỏ các câu "chưa kèm quyền lợi". Lỗi AI dùng chung `shared/api/ai-quota.ts`: hết lượt (429 `AI_QUOTA_EXCEEDED`) báo theo gói, có nút "Xem gói" trong trợ lý viết blog; lỗi 409 `AI_REQUEST_*` và `IDEMPOTENCY_CONFLICT` có thông báo riêng; trợ lý thực đơn dùng cùng thông báo; ảnh hết lượt (`IMAGE_QUOTA_EXCEEDED`) báo riêng. Sau mỗi lượt trợ lý blog, số liệu gói được tải lại. Chưa thử với API thật (cần API bật thanh toán và MongoDB replica set).
- Bước kiểm tra UI: (1) Đăng nhập tài khoản Miễn phí, mở Tôi > Gói của bạn: hero "Miễn phí", thẻ Lượt dùng AI có hai thanh (5 lượt/ngày, 0 ảnh), ba thẻ gói Miễn phí/Plus/Pro với hạn mức. (2) Chọn Plus: hộp xác nhận hiện giá, 30 ngày, hạn mức và lời nhắc về thời hạn; Tiếp tục ra màn QR. (3) Thanh toán thử (môi trường thử): màn tự chuyển sang thành công, hiện hạn mức chu kỳ mới; về Gói của bạn thấy "Plus", nhãn "Đang dùng", hạn mức 300/10. (4) Khi đang có Plus, chọn Pro: hộp xác nhận có khung "Bạn đang dùng Plus" nêu thu đủ 99.000 đ và mất phần còn lại; thẻ Plus có nút "Mua lại Plus". (5) Lịch sử hiện đúng tên lúc mua (gói cũ hiện "Pro (gói cũ)"/"Premium (gói cũ)"). (6) Dùng hết lượt hỏi ở Miễn phí rồi hỏi trợ lý blog: thông báo hết lượt kèm nút Xem gói mở màn Gói; thanh đo chuyển đỏ. (7) Nhờ trợ lý tạo ảnh khi hết lượt ảnh: hiện câu hết lượt tạo ảnh. (8) Thử iPhone, Android, chữ lớn, theme tối.
- Người thực hiện: Claude.

## 2026-11-10 — Sửa ô nhập tin nhắn bị đổi chiều cao liên tục

- Kết quả: Ô nhập dùng chung (`ChatComposer`, ở Trợ lý Vedora, trợ lý viết blog, chat) lấy kích thước nội dung của chính ô nhập để đặt chiều cao, nên chiều cao và kích thước nội dung kéo nhau lên xuống liên tục. Nay chiều cao đo từ một bản sao ẩn của đoạn chữ cùng phông và cùng bề rộng, không phụ thuộc vào ô nhập; ô rỗng vẫn trở về một dòng. Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Mở Trợ lý Vedora, chạm ô nhập: chiều cao đứng yên một dòng, không nháy. (2) Gõ chữ dài qua nhiều dòng: ô cao dần tới tối đa khoảng 120px rồi cuộn trong ô, không giật. (3) Xóa hết chữ hoặc gửi tin: ô về một dòng. (4) Dán đoạn nhiều dòng, xuống dòng cuối: dòng trống cuối vẫn được tính. (5) Thử trợ lý viết blog và màn chat; iPhone, Android, chữ lớn.
- Người thực hiện: Claude.

## 2026-11-10 — Thực đơn của tôi: hiện ảnh món

- Kết quả: API thực đơn (`MealRecipeDto`) trả `imageUrl` (HTTPS hoặc null) cho từng món nhưng schema của app bỏ qua trường này nên chỉ hiện chữ. Đã thêm `imageUrl` (có thể null) vào schema món trong `meal-plan.schema.ts`; mỗi món ở màn Thực đơn của tôi nay có ảnh vuông bo góc 56px bên trái tên món, món chưa có ảnh dùng hình cà chua làm ảnh tạm. Bản xem trước do trợ lý đề xuất chỉ có mã và tên món (API không trả ảnh) nên hiện ảnh tạm; sau khi lưu thì có ảnh thật. Chưa thử với API thật.
- Bước kiểm tra UI: (1) Mở Thực đơn của tôi, chọn một ngày có món: mỗi món có ảnh bên trái tên, ảnh không méo. (2) Món không có ảnh: hiện hình cà chua trên nền nhạt. (3) Nhờ trợ lý lên thực đơn, mở bản xem trước: món hiện ảnh tạm; sau khi Lưu thì ảnh thật xuất hiện. (4) Nút Đổi món vẫn bấm được, tên dài xuống dòng không đẩy nút ra ngoài. (5) Thử mạng chậm, theme tối, chữ lớn.
- Người thực hiện: Claude.

- Bổ sung (cùng ngày): ảnh món ở Thực đơn của tôi chạm để phóng to (dùng `ZoomImage` như các ảnh khác trong app). Kiểm tra: chạm ảnh món: mở toàn màn hình, chụm để phóng, chạm đôi, kéo xuống để đóng; chạm vào tên món hoặc nút Đổi món không mở ảnh; ảnh tạm (hình cà chua) không phóng. Người thực hiện: Claude.

## 2026-11-10 — Trình soạn blog: tiêu đề dài không bị cắt

- Kết quả: Ô tiêu đề đặt `numberOfLines={1}` trên ô nhiều dòng nên tiêu đề dài quá hai dòng bị giới hạn chiều cao và phần sau không thấy. Đã bỏ giới hạn đó, tắt cuộn trong ô (`scrollEnabled={false}`) để ô tự cao theo chữ; phím Enter đóng bàn phím thay vì xuống dòng vì tiêu đề chỉ có một đoạn. Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Viết blog, gõ tiêu đề dài khoảng 150 ký tự: ô cao dần, thấy đủ ba, bốn dòng, bộ đếm ký tự bên dưới không bị che. (2) Bấm Enter ở ô tiêu đề: bàn phím đóng, tiêu đề không bị chèn dòng trống. (3) Mở blog cũ có tiêu đề dài: hiện đủ. (4) Xóa bớt chữ: ô thu lại. (5) Thử iPhone, Android, chữ lớn.
- Người thực hiện: Claude.

## 2026-11-10 — Tin nhắn của trợ lý AI hiển thị Markdown đã định dạng

- Kết quả: Bong bóng chat chỉ in nguyên văn bản nên câu trả lời của trợ lý hiện cả `##`, `**`, `-`. Thêm `ChatMarkdown` (`shared/components/chat/chat-markdown.tsx`) dùng bộ đọc Markdown có sẵn của blog: đề mục, chữ đậm và nghiêng (dùng đúng file phông), danh sách gạch đầu dòng và đánh số, trích dẫn, mã, đường kẻ, liên kết bấm được; HTML thô không bị diễn giải. Dòng xuống một lần được giữ thành dòng riêng. `ChatBubble` dùng nó cho mọi tin của trợ lý nên áp dụng cho trợ lý viết blog, Trợ lý Vedora (thực đơn) và hỏi dinh dưỡng; tin của người dùng giữ chữ thường. Khi trợ lý đang trả lời vẫn hiện con trỏ nhấp nháy ở cuối. Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Trợ lý viết blog, nhờ "viết 3 gợi ý tiêu đề": danh sách hiện thành các dòng có dấu đầu dòng, không còn `-` hay `**`. (2) Nhờ trả lời có đề mục và chữ đậm: đề mục to hơn, chữ đậm đúng. (3) Trợ lý thực đơn và hỏi dinh dưỡng: tin có danh sách, đậm hiển thị gọn. (4) Trong lúc trợ lý đang gõ: chữ hiện dần, ký tự Markdown dở dang (ví dụ `**` chưa đóng) tạm hiện nguyên rồi tự định dạng khi đủ cặp. (5) Liên kết trong tin bấm mở được. (6) Tin của bạn vẫn là chữ thường. (7) Theme tối, chữ lớn.
- Người thực hiện: Claude.

- Bổ sung (cùng ngày): khung đề xuất của trợ lý viết blog ("Thêm nội dung vào bài", "Nội dung mới", "Đoạn cũ/mới") cũng hiện Markdown đã định dạng (đề mục, đậm, danh sách) thay vì ký tự `##`, `**`, `-`; tiêu đề mới vẫn là chữ thường. Nội dung thật chèn vào bài không đổi. Kiểm tra: nhờ trợ lý viết một mục có đề mục, chữ đậm, danh sách: khung đề xuất hiển thị gọn, bấm Chấp nhận thì bài có đúng định dạng. Người thực hiện: Claude.

- Bổ sung (cùng ngày): nội dung đề xuất của trợ lý viết blog dài hơn 600 ký tự bị cắt bằng "…" và không đọc hết được. Nay mỗi khối (Nội dung mới, Đoạn cũ, Đoạn mới, Thêm vào bài) có nút "Xem thêm" mở toàn bộ nội dung và "Thu gọn" để gập lại. Kiểm tra: nhờ trợ lý viết một mục dài: khung đề xuất hiện đoạn đầu kèm "Xem thêm"; bấm để đọc hết, bấm "Thu gọn" để gập; nội dung ngắn không có nút; Chấp nhận vẫn chèn đủ nội dung. Người thực hiện: Claude.

## 2026-11-10 — Trợ lý viết blog: dòng "đang xử lý" không còn biến mất giữa lượt

- Kết quả: Dòng trạng thái chỉ hiện ở hai trường hợp (chưa có gì trả về, hoặc phần cuối là chữ), nên khi một công cụ vừa xong (tra tài liệu, tạo ảnh, đề xuất đã duyệt) mà mô hình còn đang chạy thì không có gì báo, trông như đã dừng rồi bỗng có nội dung. Nay một dòng trạng thái giữ suốt lượt khi trợ lý còn chạy: "Trợ lý đang soạn…" lúc chưa có chữ hoặc ở khoảng trống sau công cụ, "Đang viết…" khi đang ra chữ; công cụ chạy trên server vẫn hiện dòng riêng ("Đang tạo ảnh…", "Đang tra tài liệu…"), và khi có đề xuất chờ duyệt thì không hiện vì đang đợi bạn. Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Gửi một yêu cầu: ngay sau khi gửi hiện "Trợ lý đang soạn…", rồi "Đang viết…" khi chữ chạy. (2) Nhờ tra tài liệu hoặc tạo ảnh: dòng "Đang tạo ảnh…" rồi khi ảnh xong vẫn còn dòng trạng thái cho tới khi trợ lý trả lời xong. (3) Chấp nhận hoặc từ chối một đề xuất: trong lúc trợ lý viết tiếp vẫn có dòng trạng thái. (4) Khi xong lượt, dòng trạng thái tắt. (5) Hủy giữa chừng hoặc lỗi: dòng tắt.
- Người thực hiện: Claude.

## 2026-11-10 — Thanh mục ở trang chủ có Công thức, Tin nhắn xuống thanh tab dưới

- Kết quả: Thanh mục ở trang chủ nay theo thứ tự Dành cho bạn, Theo dõi, Công thức, Video, Blog (`feed/components/feed-tabs.tsx`). Công thức chuyển từ tab dưới thành mục của thanh này (`RecipesList`, vẫn có tìm kiếm, bộ lọc "Hợp với mình", công thức đã lưu). Video vẫn mở màn lướt toàn màn hình. Thanh mục cuộn ngang được khi nhãn không vừa chiều rộng và có dấu hiệu để người dùng biết vuốt được: mũi tên ở phía còn mục (chạm để cuộn, che gọn nhãn bị cắt), tự trượt nhẹ một lần khi mở app để gợi ý, và tự cuộn mục vừa chọn vào giữa. Thanh tab dưới còn 5 mục: Trang chủ, Thực đơn của tôi, Trợ lý Vedora (giữa), Tin nhắn (có số chưa đọc), Tôi; biểu tượng chuông tin nhắn ở đầu trang chủ được bỏ vì đã có tab. Hộp thư thành tab (`app/(tabs)/messages.tsx`) nên bỏ nút quay lại; các màn chat vẫn mở chồng lên. Các nơi từng quay về `/recipes` nay quay về trang chủ. Chưa chạy được bản web để xem (Metro hết bộ nhớ), chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Mở app: thanh tab dưới có 5 mục như trên, không còn Công thức. (2) Trang chủ: thanh mục theo đúng thứ tự; trên máy màn hình nhỏ có mũi tên bên phải và thanh tự trượt nhẹ một lần. (3) Vuốt thanh mục sang phải/trái, chạm mũi tên: cuộn được; chạm một mục bị cắt: mục đó cuộn vào giữa. (4) Chạm Công thức: hiện kho công thức; cuộn xuống thì thanh tab dưới ẩn như các mục khác; mở một công thức rồi bấm Quay lại về đúng chỗ. (5) Chạm Video: mở màn lướt; quay lại vẫn ở mục cũ. (6) Chạm tab Tin nhắn: hộp thư hiện trong tab, huy hiệu số chưa đọc đúng; mở một cuộc trò chuyện rồi quay lại. (7) Tôi > Tin nhắn vẫn mở được hộp thư. (8) Khách chưa đăng nhập ở Công thức bấm "Hợp với mình": đăng nhập xong quay về trang chủ. (9) Thử iPhone, Android, chữ lớn, theme tối.
- Người thực hiện: Claude.

## 2026-11-18 — Hộp thư: gom tin nhắn từ người lạ vào một mục

- Kết quả: Tin nhắn người lạ (người bạn chưa theo dõi nhắn trước) không còn nằm lẫn trong hộp thư. Đầu danh sách có một dòng "Tin nhắn từ người lạ" hiện tên và tin mới nhất, tổng số tin chưa đọc và số cuộc trò chuyện; bấm vào mở màn `/messages/strangers` chỉ liệt kê các cuộc đó (kéo để làm mới, cuộn để tải thêm, nút Quay lại). Tin bạn gửi đang "Chờ phản hồi" và bạn bè vẫn ở hộp thư chính. Không đổi API. Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Dùng tài khoản B (chưa được A theo dõi) nhắn cho A. (2) Đăng nhập A, mở tab Tin nhắn: B không hiện thành dòng riêng; ở đầu danh sách có dòng "Tin nhắn từ người lạ" với "B: <nội dung>", số chưa đọc, "1 cuộc trò chuyện". (3) Bấm dòng đó: mở danh sách người lạ, có B với nhãn "Tin nhắn lạ". (4) Bấm B: mở chat; quay lại: về danh sách người lạ, số chưa đọc giảm. (5) Bấm Quay lại: về hộp thư. (6) Tài khoản không có tin người lạ: không có dòng gom. (7) A nhắn cho người chưa theo dõi lại: cuộc đó vẫn ở hộp thư chính với nhãn "Chờ phản hồi". (8) Theme tối, chữ lớn.
- Người thực hiện: Claude.

## 2026-11-18 — Video: tải sẵn video kề bên, lướt tới là phát ngay

- Kết quả: Trước đây màn Video chỉ tạo trình phát cho video đang xem nên mỗi lần lướt phải tải lại từ đầu. Nay video đang xem cùng video ngay trước và ngay sau đều có trình phát nạp sẵn (tối đa 3 cái, theo cách "Preloading videos" của `expo-video` SDK 58): video kề bên tải trước vài giây mà không hiển thị, chỉ video trên màn hình được phát. Mỗi trình phát chỉ tải trước tối đa 10 giây để không tốn dữ liệu cho video người dùng bỏ qua. Video rời màn hình vẫn dừng và quay về đầu như cũ. Chưa thử trên máy thật; chưa làm phần tải sẵn danh sách video từ trang chủ.
- Bước kiểm tra UI: (1) Mở Video: video đầu tải như trước. (2) Đợi vài giây rồi vuốt lên: video kế phát gần như ngay, không còn vòng xoay chờ. (3) Vuốt tiếp nhiều video liên tục: mỗi video đều phát nhanh; vuốt ngược lại video trước cũng phát ngay và bắt đầu từ đầu. (4) Chỉ nghe tiếng của video đang xem, không có tiếng video khác chạy ngầm. (5) Chạm để dừng/phát, bật/tắt tiếng vẫn đúng. (6) Mở bình luận rồi quay lại: video vẫn phát. (7) Lướt khoảng 30 video trên Android máy yếu: không giật, không thoát app. (8) Thử mạng 4G yếu: video kề bên vẫn phát nhanh hơn trước.
- Người thực hiện: Claude.

## 2026-11-18 — Nút thích thành trái tim, hiệu ứng tim/đăng lại giữa màn hình, chạm hai lần để thích video

- Kết quả: Biểu tượng thích (trước là lá mầm) đổi thành trái tim ở bài viết, chi tiết bài, màn Video và thẻ bài mẫu; khi đã thích tim màu đỏ, nhãn đọc màn hình là "Thích/Bỏ thích". Khi thích hoặc đăng lại, giữa màn hình bật lên trái tim đỏ lớn (hoặc vòng tròn biểu tượng đăng lại xoay vào), nảy nhẹ rồi bay lên và mờ dần, kiểu Instagram (`shared/components/reaction-burst.tsx`, gọi qua `showReactionBurst` trong `use-feed.ts` nên mọi nút thích/đăng lại đều có). Bỏ thích/bỏ đăng lại không có hiệu ứng. Ở màn Video, chạm hai lần lên video để thích (đã thích thì chỉ hiện tim, không bỏ thích); chạm một lần vẫn dừng/phát, chậm khoảng 0,25 giây để phân biệt với chạm hai lần. Khi máy bật "Giảm chuyển động" thì không hiện hiệu ứng. Chưa xem trên máy thật hay bản web.
- Bước kiểm tra UI: (1) Trang chủ: nút thích là trái tim rỗng; bấm: tim đỏ lớn bật lên giữa màn hình rồi biến mất, nút thành tim đỏ, số tăng. (2) Bấm lại để bỏ thích: không có hiệu ứng, tim trở lại rỗng. (3) Bấm Đăng lại: biểu tượng đăng lại xoay vào giữa màn hình rồi mờ đi; bỏ đăng lại không có hiệu ứng. (4) Mở chi tiết bài: thích/đăng lại hoạt động như trên. (5) Màn Video: nút thích bên phải là tim, đỏ khi đã thích. (6) Chạm hai lần nhanh lên video: tim lớn hiện giữa màn hình, nút thích đỏ; chạm hai lần nữa: chỉ hiện tim, vẫn giữ thích. (7) Chạm một lần: video dừng sau chút xíu, chạm lần nữa phát lại. (8) Chưa đăng nhập, chạm hai lần: chuyển sang đăng nhập. (9) Bật "Giảm chuyển động" trong cài đặt máy: thích vẫn hoạt động nhưng không có tim lớn. (10) Theme tối, Android và iPhone.
- Người thực hiện: Claude.

## 2026-11-18 — Ô "Chia sẻ cách nấu món chay của bạn" hiện ảnh đại diện

- Kết quả: Ô tròn cạnh ô tạo bài ở trang chủ trước chỉ hiện chữ cái đầu tên. Nay dùng `ProfileAvatar` với hồ sơ của mình (`useMyProfile`) nên hiện ảnh đại diện; chưa có ảnh thì vẫn là chữ cái đầu, khách chưa đăng nhập hiện "V". Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Đăng nhập tài khoản có ảnh đại diện, mở trang chủ: ô tròn cạnh "Chia sẻ cách nấu món chay của bạn" hiện ảnh. (2) Tôi > Sửa hồ sơ, đổi ảnh, quay lại trang chủ: ảnh mới. (3) Tài khoản chưa có ảnh: hiện chữ cái đầu tên. (4) Đăng xuất: hiện "V". (5) Theme tối.
- Người thực hiện: Claude.

## 2026-11-18 — Bỏ lựa chọn "Công thức" (biên tập công thức) khi tạo bài trên mobile

- Kết quả: Cửa sổ "Chia sẻ món chay theo cách của bạn" không còn thẻ "Công thức — Biên tập công thức đầy đủ" (đang khóa với nhãn "Sắp có"); chỉ còn Video hướng dẫn và Blog. Xem công thức vẫn như cũ.
- Bước kiểm tra UI: (1) Trang chủ, bấm "Chia sẻ cách nấu món chay của bạn": cửa sổ chỉ có hai lựa chọn Video hướng dẫn và Blog, không còn thẻ Công thức hay nhãn "Sắp có". (2) Bấm Video hướng dẫn: vào màn đăng video. (3) Bấm Blog: mở trình viết blog. (4) Mục Công thức ở trang chủ vẫn xem được công thức.
- Người thực hiện: Claude.

## 2026-11-18 — Trợ lý viết blog: khung ảnh skeleton sáng khi đang tạo ảnh

- Kết quả: Khi trợ lý đang tạo hoặc chỉnh ảnh, dưới dòng "Đang tạo ảnh…"/"Đang chỉnh ảnh…" có một khung xám đúng tỉ lệ ảnh sắp ra (vuông, 16:9…), biểu tượng ảnh ở giữa và một vệt sáng chạy chéo qua liên tục; ảnh xong thì khung được thay bằng ảnh thật ở cùng chỗ. Theme tối vệt sáng dịu hơn; bật "Giảm chuyển động" thì khung đứng yên. Hook dùng chung `hooks/use-reduce-motion.ts` (hiệu ứng tim cũng dùng). Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Mở bài blog, mở Trợ lý, nhờ "tạo ảnh bìa 16:9 cho bài": hiện "Đang tạo ảnh…" và khung chữ nhật ngang có vệt sáng chạy qua. (2) Nhờ tạo ảnh vuông: khung vuông. (3) Ảnh xong: khung biến mất, ảnh hiện đúng chỗ, không nhảy bố cục nhiều. (4) Nhờ chỉnh ảnh vừa tạo: cũng có khung với "Đang chỉnh ảnh…". (5) Hết lượt tạo ảnh hoặc lỗi: khung biến mất, hiện thông báo như cũ. (6) Theme tối: vệt sáng nhẹ, không chói. (7) Bật Giảm chuyển động: khung đứng yên.
- Người thực hiện: Claude.

## 2026-11-18 — Trợ lý viết blog: ô nhập không còn bị đẩy lên khi mở bàn phím

- Kết quả: Khi bàn phím mở, khoảng đệm cho thanh điều hướng/thanh home phía dưới vẫn được cộng thêm trên Android nên ô nhập nằm cao hơn mép bàn phím một đoạn. Nay khoảng đệm dưới chỉ áp dụng khi bàn phím đóng (giống màn chat tin nhắn). Trên iOS, chiều cao bàn phím tính từ mép trên bàn phím đến đáy màn hình để không còn khoảng trống khi bàn phím đổi kích thước hoặc đóng. Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Android: mở bài blog, mở Trợ lý, chạm ô nhập: ô nhập nằm sát ngay trên bàn phím, không có khoảng trống. (2) Đóng bàn phím: ô nhập về đáy, không bị thanh điều hướng che. (3) iPhone có thanh home: như trên; bật/tắt thanh gợi ý từ của bàn phím, đổi bàn phím emoji: ô nhập luôn sát bàn phím. (4) Đóng bàn phím bằng cách kéo danh sách tin nhắn: không còn khoảng trống ở dưới. (5) Gõ tin nhiều dòng: ô nhập cao lên, vẫn sát bàn phím.
- Người thực hiện: Claude.

## 2026-11-18 — Vòng xoay "kéo để tải lại" không còn bị kẹt khi quay lại màn hình

- Kết quả: Các danh sách đang cho vòng xoay ở đầu hiện cả khi app tự tải lại ngầm (ví dụ khi quay về màn hình hoặc mở lại app); iOS hay để vòng xoay đứng mãi sau đó và phải kéo lại mới hết. Thêm `hooks/use-pull-to-refresh.ts`: vòng xoay chỉ hiện khi người dùng tự kéo và tắt khi tải xong; tải ngầm vẫn chạy nhưng không hiện vòng xoay. Áp dụng cho trang chủ, Theo dõi, Công thức, Công thức đã lưu, Blog của tôi, Tin nhắn, Gói của bạn. Màn Thanh toán giữ nguyên vì vòng xoay ở đó báo đang kiểm tra trạng thái giao dịch. Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Trang chủ: mở một bài viết hoặc hồ sơ rồi quay lại: không có vòng xoay ở đầu danh sách, nội dung vẫn tự cập nhật. (2) Đưa app xuống nền vài phút rồi mở lại: không có vòng xoay kẹt. (3) Kéo xuống để tải lại: vòng xoay hiện, tải xong tự biến mất. (4) Lặp lại (1)–(3) ở Theo dõi, Công thức, Công thức đã lưu, Blog của tôi, Tin nhắn, Gói của bạn. (5) Tin nhắn: mở một cuộc trò chuyện rồi quay lại: không có vòng xoay kẹt. (6) Gói của bạn: đang bấm mua gói thì vẫn hiện vòng xoay như trước.
- Người thực hiện: Claude.

## 2026-11-18 — Hồ sơ: bỏ nút "Tải lại danh sách" ở tab Blog, thay bằng kéo để tải lại

- Kết quả: Tab Blog trong màn Hồ sơ có nút chữ "Tải lại danh sách" nằm ngay trên danh sách, trông lạc chỗ. Đã bỏ nút; thay vào đó cả màn Hồ sơ kéo xuống để tải lại (hồ sơ, sở thích ăn uống, bài viết và blog của tôi), vòng xoay chỉ hiện khi tự kéo. Blog vẫn tự cập nhật sau khi lưu/đăng bài như trước; nút "Thử lại" khi lỗi và "Xem thêm blog" giữ nguyên. Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Tôi > tab Blog: không còn nút "Tải lại danh sách", danh sách blog hiện ngay dưới thanh tab. (2) Kéo màn Hồ sơ xuống: vòng xoay hiện rồi tắt, danh sách blog cập nhật. (3) Ở tab Bài viết kéo xuống: bài viết và thông tin hồ sơ cập nhật. (4) Viết hoặc sửa một blog rồi quay lại tab Blog: bài mới/đã sửa hiện mà không cần kéo. (5) Tắt mạng rồi mở tab Blog: hiện "Không tải được danh sách blog" và nút Thử lại. (6) Chưa đăng nhập: màn Hồ sơ không kéo để tải lại.
- Người thực hiện: Claude.

## 2026-11-18 — Thực đơn của tôi: chạm vào món để xem công thức

- Kết quả: Mỗi món trong thực đơn trước chỉ chạm được ảnh (phóng to) và nút Đổi món. Nay chạm vào tên món (có dòng "Xem công thức ›" bên dưới) mở trang công thức của món đó (`/recipes/[id]`, id món trong thực đơn chính là id công thức ở API). Chạm ảnh vẫn phóng to, nút Đổi món giữ nguyên; bản xem trước đề xuất cũng mở được công thức. Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Mở tab Thực đơn của tôi, chọn một ngày có món: dưới tên mỗi món có "Xem công thức ›". (2) Chạm tên món: mở đúng trang công thức của món đó. (3) Bấm Quay lại: về thực đơn, vẫn ở ngày đang chọn. (4) Chạm ảnh món: ảnh phóng to như trước, không mở công thức. (5) Bấm Đổi món: vẫn nhờ trợ lý đổi món, không mở công thức. (6) Khi đang xem bản đề xuất (chưa lưu): chạm món vẫn mở công thức. (7) Tên món dài: xuống dòng gọn, không đè nút Đổi món.
- Người thực hiện: Claude.

## 2026-11-18 — Gộp tìm kiếm Công thức vào tìm kiếm chung ở header

- Kết quả: Trước có hai chỗ tìm: kính lúp ở header (chỉ tìm bài viết) và ô "Tìm món hoặc nguyên liệu..." trong mục Công thức. Nay chỉ còn kính lúp; màn tìm kiếm có hai tab Bài viết và Công thức. Đang ở mục Công thức bấm kính lúp thì mở thẳng tab Công thức, mục khác mở tab Bài viết. Tab Công thức tìm theo món/nguyên liệu như trước và có nút "Hợp với mình". Mục Công thức bỏ ô tìm, giữ bộ lọc "Hợp với mình"; các gợi ý Nấm, Đậu hũ, Canh nay mở màn tìm kiếm với từ đó. Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Trang chủ, mục Dành cho bạn: bấm kính lúp: mở tìm kiếm ở tab Bài viết, bàn phím bật, gõ từ khóa ra bài viết. (2) Chuyển sang tab Công thức: ô nhập đổi gợi ý thành "Tìm món hoặc nguyên liệu...", kết quả là công thức với từ đang gõ. (3) Quay lại, chọn mục Công thức rồi bấm kính lúp: mở thẳng tab Công thức. (4) Mục Công thức không còn ô tìm; bấm "Nấm": mở tìm kiếm tab Công thức với chữ "Nấm" và kết quả. (5) Tab Công thức, chưa gõ gì: hiện lời nhắc nhập món; bật "Hợp với mình": hiện món hợp hồ sơ; chưa đăng nhập bấm "Hợp với mình": chuyển sang đăng nhập. (6) Bộ lọc "Hợp với mình" ở mục Công thức vẫn lọc danh sách. (7) Bấm một công thức trong kết quả: mở trang công thức, Quay lại về kết quả cũ. (8) Theme tối, chữ lớn.
- Người thực hiện: Claude.

- Bổ sung (cùng ngày): chữ gợi ý trong ô tìm kiếm bị lệch so với biểu tượng kính lúp (font Source Sans có khoảng đệm riêng trên Android, ô nhập lại không cao bằng thanh). Ô nhập nay cao đúng 40, chữ căn giữa theo chiều dọc và bỏ khoảng đệm font. Kiểm tra: mở tìm kiếm ở cả hai tab: chữ gợi ý và chữ đang gõ nằm thẳng hàng với kính lúp và nút xóa, trên Android và iPhone, cả khi chữ lớn. Người thực hiện: Claude.

## 2026-11-18 — Video ở feed: loading rõ ràng, không còn chồng tiếng khi mở màn Video

- Kết quả: (1) Bấm phát video trong bài viết trước đây gỡ ảnh bìa ngay nên khung hình đen chớp lên rồi mới có hình. Nay ảnh bìa giữ nguyên, phủ lớp tối và vòng xoay lớn cho đến khi khung hình đầu tiên hiện (`onFirstFrameRender` của expo-video) thì mới biến mất. (2) Video ở feed chỉ dừng khi cuộn khỏi màn hình, nên mở tab Video (hoặc màn khác) thì tiếng feed vẫn chạy chồng lên. Nay video feed tự dừng khi rời màn hình (`useIsFocused`). Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Trang chủ: bấm ▶ trên một video: ảnh bìa vẫn hiện kèm vòng xoay, không chớp đen; khi có hình thì video phát, vòng xoay biến mất. (2) Mạng chậm: vòng xoay hiện lâu hơn nhưng không chớp. (3) Đang phát video ở feed, bấm tab "Video": chỉ nghe tiếng video ở màn Video, video feed đã dừng. (4) Đóng màn Video quay về feed: video feed vẫn dừng, bấm phát tiếp được. (5) Đang phát video, mở một bài viết hoặc hồ sơ: tiếng video feed tắt. (6) Bấm phát rồi cuộn đi ngay trước khi có hình, cuộn lại: video tiếp tục tải và phát. (7) Video lỗi: vẫn hiện "Không phát được video. Chạm để thử lại."
- Người thực hiện: Claude.

## 2026-11-18 — Thông báo khi bình luận bị chặn vì vi phạm Tiêu chuẩn cộng đồng

- Kết quả: Khi API kiểm duyệt từ chối bình luận (mã `CONTENT_REJECTED`), trước app chỉ hiện lỗi chung "Chưa gửi được bình luận…" nên người dùng tưởng lỗi mạng và gửi lại mãi. Nay hiện theo cách các app mạng xã hội hay làm: "Bình luận của bạn không được đăng vì vi phạm Tiêu chuẩn cộng đồng. Hãy sửa lại nội dung rồi gửi lại." kèm liên kết "Xem Tiêu chuẩn cộng đồng" mở trang Tiêu chuẩn cộng đồng. Nội dung vẫn giữ trong ô nhập để sửa. Áp dụng cả khi viết mới lẫn khi sửa bình luận. Lỗi khác vẫn giữ thông báo cũ. Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Mở một bài viết, gửi bình luận có lời xúc phạm (ví dụ chửi người khác): dưới ô nhập hiện thông báo vi phạm Tiêu chuẩn cộng đồng màu đỏ, bình luận không xuất hiện trong danh sách, nội dung vẫn còn trong ô nhập. (2) Chạm "Xem Tiêu chuẩn cộng đồng": mở trang Tiêu chuẩn cộng đồng; Quay lại về bài viết, nội dung vẫn còn. (3) Sửa chữ trong ô nhập: thông báo biến mất. (4) Gửi bình luận bình thường: đăng được như cũ. (5) Sửa một bình luận cũ thành lời xúc phạm rồi lưu: hiện cùng thông báo, bình luận cũ giữ nguyên. (6) Tắt mạng rồi gửi: vẫn hiện "Chưa gửi được bình luận. Nội dung vẫn được giữ để bạn thử lại." (7) Theme tối, chữ lớn: thông báo và liên kết đọc rõ.
- Người thực hiện: Claude.

## 2026-11-18 — Thông báo từ Vedora (kiểm duyệt, báo cáo bài viết) theo API mới

- Kết quả: API gửi thông báo hệ thống (`POST_PENDING_REVIEW`, `POST_APPROVED`, `POST_REJECTED`, và mới thêm `POST_REMOVED`, `REPORT_RESOLVED`, `REPORT_DISMISSED`, `REPORTED_POST_REMOVED`) với `actor = null`. App trước chỉ nhận 4 loại và bắt buộc có `actor`, nên chỉ cần một thông báo hệ thống là cả danh sách thông báo báo lỗi. Nay danh sách nhận mọi loại (loại lạ hiện "có thông báo mới cho bạn"), thông báo hệ thống đứng tên "Vedora" với chữ "V", kèm lý do và tiêu đề bài khi có. Bấm vào: blog của mình mở trình soạn blog, bài viết thường mở bài, bài đã bị gỡ thì chỉ đánh dấu đã đọc. Các thay đổi khác của API (giới hạn đọc từ env, mỗi bữa tối đa 5 món, lưu lịch sử chat thực đơn) giữ mặc định cũ hoặc do server kiểm tra, mobile chưa cần đổi. Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Đăng nhập, đăng một bài có lời lẽ vi phạm: mở Thông báo, danh sách vẫn tải được, có dòng "Vedora không duyệt bài viết của bạn vì …". (2) Bấm dòng đó: mở bài viết; nếu là blog thì mở trình soạn blog. (3) Tài khoản khác báo cáo một bài; admin bấm "Đã xử lý": người báo cáo thấy "Vedora đã xử lý báo cáo của bạn về một bài viết (lý do: …)". (4) Admin bấm "Bỏ qua" ở báo cáo khác: hiện "đã xem báo cáo của bạn và giữ lại bài viết". (5) Admin xoá một bài bị báo cáo: chủ bài thấy "Vedora đã gỡ bài viết "<tiêu đề>" của bạn", người báo cáo thấy "… mà bạn báo cáo"; bấm vào không chuyển màn, chấm chưa đọc biến mất. (6) Đang mở app khi thông báo tới: dòng mới hiện ngay đầu danh sách, số trên chuông tăng. (7) Thông báo thích, bình luận, theo dõi vẫn hiện tên, ảnh người gửi và mở đúng như cũ. (8) Theme tối, chữ lớn.
- Người thực hiện: Claude.

## 2026-11-18 — Lưu và mở lại lịch sử chat với Trợ lý Vedora (thực đơn)

- Kết quả: Trước đây cuộc trò chuyện ở tab Trợ lý chỉ nằm trong bộ nhớ, đóng app hoặc đăng nhập lại là mất. Nay mỗi cuộc trò chuyện có một mã (`threadId`) gửi kèm `POST /meal-plan/chat`, API tự lưu câu hỏi và câu trả lời. Mở tab Trợ lý sẽ tải lại cuộc trò chuyện gần nhất (`GET /meal-plan/chat/threads`), gồm cả đề xuất thực đơn và nút "Xem trong Thực đơn". Trạng thái đề xuất (đang xem, đã lưu, đã bỏ qua) được đồng bộ lên API (`PATCH /meal-plan/chat/threads/:id`); đề xuất đang xem dở chưa lưu sẽ được mời xem lại sau khi mở lại app. Header có nút "Cuộc trò chuyện mới" (chỉ hiện khi đã có tin nhắn): bắt đầu cuộc mới, cuộc cũ vẫn được lưu trên server. Chưa có màn chọn lại các cuộc cũ. Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Đăng nhập, mở tab Trợ lý, hỏi "Gợi ý món sáng nhanh": nhận câu trả lời. (2) Tắt hẳn app rồi mở lại, vào tab Trợ lý: câu hỏi và câu trả lời vẫn còn, không hiện lại các nút "Bắt đầu nhanh". (3) Nhờ lên thực đơn 7 ngày: có nút "Xem trong Thực đơn"; tắt app mở lại: nút vẫn còn, bấm mở được bản nháp ở tab Thực đơn. (4) Lưu thực đơn, tắt app mở lại: nút "Xem trong Thực đơn" của đề xuất đó không còn. (5) Bấm nút bút ở góc phải header: khung chat trống, hiện lại "Bắt đầu nhanh"; hỏi tiếp một câu; tắt app mở lại: thấy cuộc mới này. (6) Khi trợ lý đang trả lời, nút bút bị mờ, bấm không có tác dụng. (7) Đăng xuất, đăng nhập tài khoản khác: không thấy cuộc trò chuyện của tài khoản trước. (8) Tắt mạng rồi mở tab Trợ lý: vẫn chat được bình thường khi có mạng lại. (9) Theme tối, chữ lớn.
- Người thực hiện: Claude.

## 2026-11-18 — Đồng bộ code mới nhất từ GitHub

- Kết quả: Đã tải origin và cập nhật nhánh main bằng fast-forward tới 0930cdb. Toàn bộ thay đổi local chưa commit trên nhánh feat/google-auth-and-recipe-experience được giữ trong stash có tên backup-before-pull-main-2026-11-18; chưa áp dụng lại vào main.
- Các bước kiểm tra UI trên màn hình: (1) Mở ứng dụng, xác nhận màn hình chính hiển thị. (2) Chuyển qua các tab Cộng đồng, Tin nhắn và Tôi, kiểm tra điều hướng. (3) Đăng nhập, mở danh sách tin nhắn rồi vào một cuộc trò chuyện, kiểm tra nội dung tải được. Đây là hướng dẫn kiểm tra sau đồng bộ; chưa thực hiện UI trực tiếp trong task này.
- Người thực hiện: Codex.

## 2026-11-18 — Đối chiếu mobile với SRS v1.1

- Kết quả đã làm: Đọc SRS v1.1 và rà soát source mobile tại 0930cdb; ghi bảng đối chiếu trong docs/SRS_MOBILE_GAP_ANALYSIS.md với 6 nhóm thiếu luồng, 6 nhóm làm một phần/lệch yêu cầu và các điểm cần kiểm thử tích hợp. SRS dành cho Web, native mobile nằm ngoài phạm vi; báo cáo dùng nghiệp vụ Guest/Member làm chuẩn so sánh. Chưa sửa source hoặc chạy UI trực tiếp.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Đăng nhập, mở tạo bài và kiểm tra bài chỉ chữ/nhiều video. (2) Mở bài và Blog của mình, kiểm tra thao tác xóa. (3) Mở công thức, kiểm tra lưu và đánh giá sao. (4) Lưu thực đơn, tìm danh sách mua sắm và chọn ngày. (5) Vào Tôi, tìm đăng ký chuyên gia và theo dõi kết quả. (6) Soạn Blog, kiểm tra tải video và trạng thái sau kiểm duyệt. (7) Nhận nháp A, tạo đề xuất B rồi thử lưu A; thử rời luồng khi còn nháp. (8) Mở form thực đơn, kiểm tra 20 người/240 phút và bước xem lại trước khi gửi. (9) Kiểm tra lựa chọn theme/mascot. Chi tiết và kết quả mong đợi trong tài liệu đối chiếu.
- Người thực hiện: Codex.

## 2026-11-18 — Lấy code mobile mới nhất từ development

- Kết quả đã làm: Fetch origin, chuyển từ main (0930cdb) sang development theo dõi origin/development tại 2c7bbc2. Code mới sửa loading video và dừng video feed khi rời màn hình. Đã khôi phục tài liệu local, gộp xung đột docs/PLAN.md giữ cả nội dung remote và local; stash backup-before-sync-mobile-2026-11-18-srs vẫn được giữ làm bản dự phòng.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở Trang chủ, phát video và kiểm tra ảnh bìa/vòng xoay cho tới khi có hình. (2) Chuyển sang màn Video, xác nhận không còn tiếng từ feed. (3) Quay lại Trang chủ, bấm phát tiếp. (4) Mở bài viết hoặc hồ sơ khi feed đang phát, kiểm tra video feed dừng. (5) Thử mạng chậm và tải lại video lỗi.
- Người thực hiện: Codex.

## 2026-11-19 — Lịch sử trò chuyện với Trợ lý Vedora (drawer): chọn mở lại hoặc xóa cuộc cũ

- Kết quả: Trước chỉ mở lại được cuộc trò chuyện gần nhất. Nay header tab Trợ lý có nút đồng hồ "Lịch sử trò chuyện", mở drawer trượt ra từ cạnh trái (rộng 85% màn hình, tối đa 360) liệt kê các cuộc đã lưu (`GET /meal-plan/chat/threads`, mới dùng gần nhất lên đầu, cuộn xuống tải thêm), mỗi dòng có tiêu đề, đoạn tin nhắn cuối và thời gian (hiện chữ thường, đã bỏ ký hiệu Markdown như `**`, `##`, `*`, link; dùng chung `plainText` với feed, nay hàm này bỏ thêm dấu `*` gạch đầu dòng còn sót giữa câu); cuộc đang mở được tô nền và ghi "Đang mở". Đóng drawer bằng cách vuốt sang trái, chạm vùng tối bên phải, nút X hoặc nút Back của Android; drawer chỉ mở bằng nút đồng hồ để không đụng cử chỉ vuốt quay lại của hệ điều hành. Chạm một dòng tải lại toàn bộ cuộc đó (`GET /meal-plan/chat/threads/:id`) kèm đề xuất thực đơn. Nút thùng rác xóa cuộc trò chuyện sau khi xác nhận (`DELETE /meal-plan/chat/threads/:id`); xóa đúng cuộc đang mở thì khung chat chuyển sang cuộc mới trống. Chưa có đổi tên cuộc trò chuyện. Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Đăng nhập, tab Trợ lý: hỏi một câu, bấm nút bút để mở cuộc mới, hỏi câu khác. (2) Bấm nút đồng hồ: drawer "Lịch sử trò chuyện" trượt ra từ trái, nền phía sau tối dần, hiện 2 cuộc, cuộc vừa hỏi nằm trên và ghi "Đang mở". (3) Chạm cuộc còn lại: drawer trượt về, khung chat hiện đúng câu hỏi và câu trả lời của cuộc đó. (4) Hỏi tiếp một câu, mở lại lịch sử: cuộc này lên đầu danh sách. (4b) Cuộc có câu trả lời in đậm, tiêu đề, gạch đầu dòng: đoạn xem trước trong drawer không còn `**`, `##`, `*`. Ở feed, đoạn trích blog có "1 + 1" vẫn giữ dấu `+`. (5) Cuộc có đề xuất thực đơn chưa xem: mở lại thấy nút "Xem trong Thực đơn". (6) Bấm thùng rác ở một cuộc khác, chọn "Hủy": không đổi gì; bấm lại, chọn "Xóa": dòng biến mất. (7) Xóa cuộc đang mở: khung chat trống, hiện "Bắt đầu nhanh". (8) Khi trợ lý đang trả lời: các dòng và nút xóa bị khóa. (9) Tắt mạng rồi mở lịch sử: hiện "Chưa tải được lịch sử. Thử lại"; bật mạng, bấm Thử lại: danh sách hiện. (10) Mở lại drawer rồi lần lượt thử: vuốt panel sang trái quá 1/3 (hoặc vuốt nhanh): drawer đóng; vuốt ngắn rồi thả: drawer bật lại chỗ cũ; chạm vùng tối, nút X, nút Back Android: đều đóng. Cuộn dọc danh sách dài không làm drawer đóng. Trên iPhone có tai thỏ, tiêu đề không bị che. (11) Theme tối, chữ lớn.
- Người thực hiện: Claude.

## 2026-11-18 — Logo Vedora đầy đủ ở đầu trang Home

- Kết quả đã làm: Thay biểu tượng V ở đầu Home chào mừng bằng logo Vedora đầy đủ có sẵn trong assets/branding/logo.png. Logo nằm dưới vùng an toàn, trên nền sáng bo góc để đọc rõ trên ảnh bìa ở cả theme sáng và tối. Trang bảng tin đã có logo đầy đủ nên giữ nguyên.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Đăng xuất hoặc mở app khi chưa đăng nhập để vào Home chào mừng. (2) Kiểm tra logo Vedora đầy đủ ở góc trên trái ảnh bìa, không bị tai thỏ/thanh trạng thái che. (3) Đổi theme thiết bị sáng/tối, kiểm tra logo rõ và đúng tỷ lệ. (4) Kiểm tra màn nhỏ và xoay ngang, logo không đè tiêu đề. (5) Bấm Khám phá bài viết, Đăng nhập và Tạo tài khoản, kiểm tra điều hướng vẫn hoạt động.
- Người thực hiện: Codex.

## 2026-11-19 — Lời mời nhắn tin: Chấp nhận hoặc Xóa (theo API mới)

- Kết quả: API mới cho người nhận lời mời nhắn tin (hộp "Tin nhắn từ người lạ") hai thao tác thay cho việc phải theo dõi lại. Mở một lời mời đến, cuối màn chat nay có dòng "<tên> muốn nhắn tin với bạn…" kèm nút **Xóa** và **Chấp nhận** (hiện theo `canAcceptRequest`/`canDeleteRequest` do API trả). Chấp nhận (`POST /messaging/conversations/:id/accept`): cuộc trò chuyện chuyển sang Bạn bè, ô nhập tin hiện ra, không tạo quan hệ theo dõi. Xóa (`DELETE /messaging/conversations/:id/request`, gửi ID tin mới nhất đang hiển thị) hỏi xác nhận, ẩn lịch sử ở phía mình rồi quay về hộp thư; người gửi vẫn giữ lịch sử, nhắn tiếp thì lời mời hiện lại chỉ với tin mới. Tin có `sequence <= deletedThroughSequence` không bao giờ hiện lại dù còn trong bộ nhớ đệm. Nghe thêm sự kiện SSE `request.accepted`, `request.deleted`. Câu báo lỗi `MESSAGE_FOLLOW_REQUIRED` sửa theo luật mới, thêm câu cho `MESSAGE_REQUEST_RECEIVER_REQUIRED` và `MESSAGE_REQUEST_NOT_PENDING`. Dòng gợi ý lời mời đã gửi đổi thành "Chờ họ chấp nhận để trả lời". Chưa thử trên máy thật.
- Bước kiểm tra UI (2 tài khoản A, B chưa theo dõi nhau; A theo dõi B): (1) A nhắn cho B. Ở A, hộp thư hiện "Chờ họ chấp nhận để trả lời". (2) B mở mục Tin nhắn từ người lạ, mở cuộc của A: thấy tin của A và dòng "A muốn nhắn tin với bạn…" với nút Xóa và Chấp nhận, không có ô nhập. (3) B bấm Chấp nhận: nút hiện vòng xoay rồi ô nhập tin xuất hiện; B trả lời được mà không cần theo dõi A. (4) Cuộc này chuyển sang mục Bạn bè ở cả A và B (A thấy ngay nhờ SSE). (5) A bỏ theo dõi B: hai bên vẫn nhắn qua lại được. (6) Tạo lời mời mới từ tài khoản C sang B; B mở, bấm Xóa, chọn Hủy: không đổi gì; bấm Xóa lần nữa, chọn Xóa: quay về hộp thư, lời mời biến mất. (7) C vẫn thấy đủ lịch sử của mình. C nhắn tiếp: lời mời hiện lại ở B, chỉ có tin mới. (8) Mở cuộc của B ở 2 máy, xóa ở máy 1: máy 2 không còn hiện tin cũ. (9) A (người gửi) mở cuộc mình gửi: không có nút Chấp nhận/Xóa. (10) Tắt mạng rồi bấm Chấp nhận hoặc Xóa: hiện lỗi đỏ "Chưa chấp nhận được…"/"Chưa xóa được…", bấm lại khi có mạng được. (11) Theme tối, chữ lớn.
- Người thực hiện: Claude.

## 2026-11-18 — Sửa tải danh sách thông báo hệ thống

- Kết quả đã làm: Đối chiếu API và frontend main, xác nhận mobile chỉ chấp nhận 4 loại tương tác và actor bắt buộc, trong khi backend trả thêm 7 loại thông báo kiểm duyệt/báo cáo với actor null. Một phần tử như vậy làm Zod từ chối toàn bộ trang REST và bỏ qua sự kiện SSE. Cập nhật schema đúng hợp đồng, nội dung tiếng Việt cho từng loại, người gửi Vedora khi không có actor; phân biệt ghi chú quản trị viên với trích đoạn bài bị gỡ. Bấm thông báo không có bài/người gửi chỉ đánh dấu đã đọc, không truy cập actor null. Có kiểm tra hồi quy bằng payload mẫu cho danh sách hỗn hợp, SSE, nội dung và điều hướng; chưa kiểm tra trên thiết bị với tài khoản thật.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Đăng nhập tài khoản có cả thông báo tương tác và kiểm duyệt, bấm chuông, kiểm tra danh sách tải thành công. (2) Kiểm tra thông báo chờ duyệt/duyệt/từ chối Blog hiện người gửi Vedora, nội dung và ghi chú quản trị viên đúng. (3) Bấm thông báo thích/bình luận để mở bài, bấm theo dõi để mở hồ sơ. (4) Bấm thông báo bài bị gỡ: không lỗi, không mở hồ sơ không tồn tại, chấm chưa đọc tắt. (5) Giữ màn hình mở, tạo thông báo kiểm duyệt mới từ quản trị, kiểm tra thông báo xuất hiện trực tiếp. (6) Bấm Đọc tất cả, quay lại mở chuông, kiểm tra số chưa đọc và trạng thái được lưu. (7) Cuộn cuối danh sách để kiểm tra tải trang tiếp theo.
- Người thực hiện: Codex.

## 2026-11-18 — Upload ảnh Blog không giữ màn soạn ở trạng thái chờ vô hạn

- Kết quả đã làm: Người dùng báo Android xoay sau khi chọn ảnh. Rà soát cho thấy bước PUT trực tiếp lên kho ảnh không có deadline tổng hoặc tín hiệu hủy; editor giữ busy/actionLock tới khi uploader kết thúc. Đưa uploader dùng chung cho Blog và hồ sơ vào shared/api/upload-image.ts, thêm deadline 60 giây, hủy request khi quá hạn, giải phóng native task và trả thông báo để thử lại. Promise race bảo đảm UI thoát chờ kể cả khi native không xác nhận hủy. Giữ nguyên endpoint, signed headers và upload binary. Đã kiểm tra bằng mock các tình huống thành công/HTTP lỗi, treo native + thử lại, treo web. Chưa tái hiện trên máy Android, chưa có log để khẳng định nguyên nhân kho ảnh/mạng không phản hồi.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Android: mở Blog mới, nhập tiêu đề/nội dung, thêm ảnh bìa JPEG/PNG dưới 5 MB, kiểm tra ảnh hiện và vòng xoay tắt. (2) Chèn ảnh vào nội dung, lưu nháp rồi mở lại, kiểm tra ảnh còn đúng. (3) Chọn ảnh rồi ngắt mạng trong lúc tải: trong tối đa 60 giây ở bước upload kho ảnh phải hết xoay, hiển thị lỗi và vẫn giữ nội dung đang viết. (4) Bật lại mạng, chọn ảnh để thử lại: tải được và nút lưu dùng được. (5) Hủy chọn ảnh: quay về editor và không bị khóa. (6) Tôi > Sửa hồ sơ > đổi avatar/ảnh bìa để kiểm tra uploader dùng chung. (7) Nếu vẫn lỗi trên mạng bình thường, ghi lại thông báo HTTP hoặc timeout và đối chiếu log API/kho ảnh; bản sửa này chưa xác nhận tình trạng kết nối của kho ảnh thực tế.
- Người thực hiện: Codex.

## 2026-11-19 — Đồng bộ mobile từ main mới nhất

- Kết quả đã làm: Fetch origin, chuyển sang main và cập nhật fast-forward tới e8b9fec, đã bao gồm PR logo, thông báo kiểm duyệt/báo cáo, phản hồi bình luận vi phạm và lịch sử chat thực đơn. Khi khôi phục local, giữ code thông báo mới trên Git; bản sửa thông báo local cũ được lưu trong stash backup-before-sync-mobile-2026-11-19. Khôi phục sửa upload ảnh và tài liệu local, gộp PLAN giữ nội dung hai bên; điều chỉnh test schema thông báo theo hợp đồng mới chấp nhận loại chưa biết. Không đổi dependencies, không commit/push trong task này.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở app, kiểm tra Home có logo Vedora. (2) Đăng nhập, mở chuông và kiểm tra thông báo hệ thống cùng thông báo tương tác tải được. (3) Mở Trợ lý, chat rồi đóng/mở lại app để kiểm tra lịch sử. (4) Mở Blog mới, chọn ảnh và kiểm tra upload; thử ngắt mạng để kiểm tra thoát vòng xoay. (5) Mở một bài và thử bình luận, kiểm tra thông báo khi nội dung bị từ chối.
- Người thực hiện: Codex.

## 2026-11-19 — Nộp minh chứng và theo dõi xác minh chuyên gia

- Kết quả đã làm: Đối chiếu controller/DTO/service verification và form frontend main; thêm module verification, route /verification và mục Xác minh chuyên gia trong Tôi. Thành viên nhập mô tả 20–2.000 ký tự, thêm/gỡ/xem lớn 1–6 ảnh JPEG/PNG/WebP tối đa 10 MB/ảnh, tải lên kho riêng bằng signed PUT có deadline, rồi gửi proofIds cùng mô tả. Ảnh đã tải giữ lại khi gửi lỗi để thử lại không tải lại ảnh. Hiển thị yêu cầu gần nhất, số ảnh, ngày gửi/xét duyệt, ghi chú; chặn gửi trùng khi chờ duyệt hoặc đã xác minh, cho nộp lại khi bị từ chối. Tự kiểm tra kết quả mỗi 15 giây khi đang chờ, hỗ trợ kéo làm mới và tải lại khi quay về màn. Kết quả isProfessional từ server làm mới cache hồ sơ; huy hiệu xanh dương trên hồ sơ cá nhân/công khai chỉ hiện khi đã xác minh. Thêm returnTo sau đăng nhập và kiểm tra hồi quy schema/trạng thái/đường quay lại. Không thêm thư viện, không triển khai UI admin; dùng luồng duyệt đã có trên web. Chưa kiểm tra bằng tài khoản thật và thiết bị Android.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Đăng nhập, mở Tôi → Xác minh chuyên gia; tài khoản chưa nộp phải hiện form. (2) Gửi khi mô tả dưới 20 ký tự hoặc chưa có ảnh: hiện lỗi, không gửi. (3) Thêm ảnh JPEG/PNG/WebP, chạm xem lớn rồi gỡ; thử ảnh trên 10 MB/GIF: báo lỗi, ảnh cũ còn nguyên. (4) Thêm đủ 6 ảnh: không thêm được ảnh thứ 7; khi đang tải không gửi được và không bấm trùng. (5) Tắt mạng lúc tải hoặc gửi: có thông báo lỗi, nội dung/ảnh đã tải còn; bật lại mạng và gửi lại. (6) Gửi hợp lệ: hiện Chờ duyệt, ngày gửi và số ảnh, không còn form gửi trùng; đóng/mở app vẫn thấy trạng thái. (7) Admin từ chối trên web, quay lại hoặc kéo làm mới: thấy lý do, nhập thông tin/chọn ảnh mới và nộp lại. (8) Admin duyệt: trạng thái Chuyên gia đã xác minh, quay về Tôi và mở hồ sơ công khai thấy tích xanh; không hiện form nộp nữa. (9) Mở /verification khi chưa đăng nhập rồi đăng nhập: quay lại màn xác minh; đổi tài khoản không hiện nội dung tài khoản trước. (10) Kiểm tra màn nhỏ, bàn phím, theme tối và cỡ chữ lớn.
- Người thực hiện: Codex.
- Kiểm tra kỹ thuật: 8 test hồi quy đều qua; TypeScript và lint không báo lỗi; xuất bundle Android và web thành công, có route /verification. Đây là kiểm tra code/bundle, chưa thay thế kiểm thử UI với tài khoản thật.

## 2026-11-19 — Cập nhật Git và giữ tính năng chuyên gia

- Kết quả đã làm: Fetch origin và fast-forward main từ e8b9fec tới 09f799b, nhận ngăn lịch sử chat thực đơn và thao tác chấp nhận/xóa lời mời nhắn tin. Sao lưu toàn bộ thay đổi local trong stash backup-expert-before-sync-2026-11-19 rồi khôi phục. Giữ nguyên module/route chuyên gia, mục trong Tôi, tích xanh, returnTo đăng nhập, test và sửa upload ảnh; chỉ xung đột PLAN, đã gộp giữ nội dung hai bên. Không đổi dependencies, không commit/push.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Đăng nhập → Tôi → Xác minh chuyên gia, kiểm tra form/mô tả/ảnh và trạng thái còn đầy đủ. (2) Tài khoản đã được duyệt: kiểm tra tích xanh trên hồ sơ. (3) Mở Trợ lý → lịch sử chat, mở lại cuộc trò chuyện cũ. (4) Mở Tin nhắn từ người lạ, kiểm tra nút Chấp nhận/Xóa lời mời. (5) Mở soạn Blog, tải ảnh để kiểm tra phần sửa local vẫn hoạt động.
- Người thực hiện: Codex.

## 2026-11-19 — Đóng gói tính năng chuyên gia để đưa lên GitHub

- Kết quả đã làm: Đóng gói luồng xác minh chuyên gia, huy hiệu xanh và uploader dùng chung có deadline trong branch feat/expert-verification; kèm test hồi quy và tài liệu kiểm tra UI. Báo cáo đối chiếu SRS và test thông báo local ngoài phạm vi được giữ tại máy.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Chạy app từ branch feat/expert-verification. (2) Đăng nhập → Tôi → Xác minh chuyên gia → nhập mô tả và thêm ảnh → gửi yêu cầu. (3) Kiểm tra trạng thái chờ duyệt; sau admin xét duyệt, mở lại để kiểm tra ghi chú và tích xanh. (4) Kiểm tra tải ảnh Blog và thay ảnh hồ sơ.
- Người thực hiện: Codex.

## 2026-11-19 — Đối chiếu lại SRS với backend và mobile sau tính năng chuyên gia

- Kết quả đã làm: Đọc PDF SRS 67 trang, render kiểm tra các trang yêu cầu trọng tâm; đọc backend main tại f6bf6fbe và mobile a205612. Ghi báo cáo docs/SRS_BACKEND_MOBILE_REVIEW_2026-11-19.md: 12 khoảng thiếu/lệch trên mobile; backend đã có phần lớn API tương ứng. Không còn tính thông báo hệ thống và chuyên gia là chưa làm. Nêu rủi ro lưu thực đơn thiếu đối chiếu phiên bản, giới hạn 100 MB Blog cần xác minh ngoài UI, khác biệt nhắn tin acceptedAt so với SRS và nhu cầu lấy public-config. Phụ lục A loại sửa bài ngắn/video đã đăng khỏi phạm vi nên không tính là thiếu. Không sửa source ứng dụng, không commit/push; chưa nghiệm thu backend/DB/thiết bị thật.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Xuất bản Blog, kiểm tra chuyển trạng thái chờ xử lý/duyệt/từ chối. (2) Mở công thức, tìm đánh giá sao; mở thực đơn đã lưu, tìm danh sách mua sắm. (3) Tạo bài chỉ chữ/nhiều video và tìm xóa nội dung của mình. (4) Nhận nháp A rồi tạo B, thử lưu A; thử hai thiết bị cùng sửa một ngày. (5) Kiểm tra video Blog, ghi nhận views, 20 người/240 phút và cảnh báo rời nháp. (6) Kiểm tra đình chỉ tài khoản, trạng thái chuyên gia, thông báo hệ thống và quyền nhắn sau khi chấp nhận lời mời. Các bước chi tiết cùng bằng chứng có trong báo cáo.
- Người thực hiện: Codex.

## 2026-11-19 — Bổ sung trả lời bình luận theo backend

- Kết quả đã làm: Đọc lại hợp đồng main của vedora-api (f6bf6fbe): GET phản hồi dùng ID gốc, POST dùng đúng ID bình luận/phản hồi được chọn và chỉ gửi body. Mobile hiển thị hai cấp, tên người được trả lời, mở/ẩn và phân trang từng luồng; giữ sửa/xóa cho phản hồi, cảnh báo xóa toàn bộ luồng khi xóa gốc. Lấy lại commentCount từ backend, bỏ cursor cũ sau xóa. Composer hiện người đang trả lời, tự focus, khóa gửi trùng và giữ bản nháp khi lỗi/kiểm duyệt. Thông báo COMMENT_REPLY mở chi tiết bài và tìm đúng luồng bằng GET comment riêng, kể cả nằm ngoài trang đã tải; đánh dấu bình luận được nhắc đến. Không thêm thư viện, chưa commit/push.
- Kiểm tra kỹ thuật: 6 test reply và 1 test thông báo đều qua; TypeScript và lint không có lỗi/cảnh báo. Xuất bundle Android và web thành công. Chưa kiểm thử UI trên Android với tài khoản thật.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Đăng nhập → mở chi tiết bài viết hoặc Blog → nhấn Trả lời dưới bình luận, kiểm tra bàn phím và dòng Đang trả lời đúng tên. (2) Nhập nội dung → gửi, kiểm tra phản hồi hiện dưới đúng gốc và tổng bình luận tăng; nhấn nhanh Gửi nhiều lần không tạo trùng. (3) Nhấn Trả lời dưới một phản hồi, gửi và kiểm tra vẫn chỉ hai cấp, tên người được nhắc đúng. (4) Mở/ẩn phản hồi và Xem thêm trên hai luồng khác nhau, kiểm tra dữ liệu không trộn. (5) Sửa phản hồi của mình, hủy sửa/trả lời rồi gửi bình luận gốc; kiểm tra không gửi nhầm chế độ. (6) Xóa riêng một phản hồi; những phản hồi khác còn, nhắc tới phản hồi đã xóa không còn tên; xóa gốc phải có cảnh báo và toàn bộ luồng biến mất, tổng đếm đúng. (7) Tắt mạng hoặc gửi nội dung bị từ chối, kiểm tra lỗi và nội dung/người được trả lời còn; kiểm tra danh sách trước khi gửi lại. (8) Dùng tài khoản thứ hai trả lời → mở thông báo tài khoản đầu, kiểm tra đúng luồng/bình luận được đánh dấu ngay cả khi nằm ngoài trang đầu; thử trường hợp bình luận đã xóa. (9) Kiểm tra Android, web, theme tối, màn nhỏ và cỡ chữ lớn; khi chưa đăng nhập phải thấy yêu cầu đăng nhập.
- Người thực hiện: Codex.

## 2026-11-19 — Đóng gói reply comment lên GitHub

- Kết quả đã làm: Đóng gói code trả lời bình luận, thông báo trả lời và test hồi quy trên branch feat/expert-verification để commit/push theo yêu cầu. Giữ báo cáo đối chiếu SRS tại máy. Các kiểm tra kỹ thuật của tính năng đã hoàn tất ở bước triển khai.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở chi tiết bài viết trên bản code mới, nhấn Trả lời và gửi phản hồi. (2) Trả lời tiếp một phản hồi, kiểm tra đúng người và hai cấp. (3) Mở thông báo trả lời, kiểm tra đúng luồng; thử sửa/xóa phản hồi của mình.
- Người thực hiện: Codex.

## 2026-11-19 — Tạo PR reply comment vào main

- Kết quả đã làm: Đã tạo PR #34 https://github.com/WDP-FA26/vedora-mobile/pull/34 từ feat/expert-verification vào main cho commit 315f5d2. PR mô tả trả lời hai cấp, phân trang, sửa/xóa, thông báo và kết quả kiểm tra; chưa merge.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở PR #34 trên GitHub, kiểm tra branch đích main và tab Files changed. (2) Chạy app từ branch PR, mở bài viết → Trả lời → gửi phản hồi. (3) Dùng tài khoản nhận thông báo mở đúng luồng; thử sửa/xóa phản hồi.
- Người thực hiện: Codex.

## 2026-11-19 — Xóa bài viết và Blog của mình

- Kết quả đã làm: Đọc backend main tại 62f0fc6e, nối DELETE /posts/:id cho bài thường và DELETE /blogs/:id cho Blog (204 không body). Menu dấu ba chấm chỉ hiện Xóa với tài khoản tác giả; có màn xác nhận, tiêu đề/nội dung nhận diện, cảnh báo không hoàn tác và nút Hủy. Blog của tôi có menu riêng ngoài vùng chạm chỉnh sửa, áp dụng cả bản nháp và đã đăng; bản nháp không có Chia sẻ. Khóa gửi trùng và đóng hộp khi đang xóa, hiển thị lỗi quyền/không tồn tại/hết phiên/mạng. Thành công hủy request đọc cũ, xóa cache chi tiết/bình luận, reset danh sách và cursor của feed/hồ sơ/đang theo dõi/tìm kiếm/đã lưu/Blog, làm mới số bài và thông báo. Xóa từ chi tiết quay về Khám phá. Không thêm thư viện; chưa commit/push.
- Kiểm tra kỹ thuật: 6 test xóa và 6 test reply đều qua; TypeScript và Expo lint không có lỗi/cảnh báo. Xuất bundle Android/web thành công; Metro tự quét lại sau cảnh báo cache cũ. Chưa thao tác xóa nội dung thật hoặc kiểm thử trên thiết bị Android.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Đăng nhập, mở bài của mình trên feed hoặc hồ sơ → dấu ba chấm → Xóa bài viết; kiểm tra nội dung nhận diện và cảnh báo, nhấn Hủy để bảo đảm bài còn. (2) Mở lại xác nhận → Xóa vĩnh viễn, bấm nhanh nhiều lần: chỉ một yêu cầu, nút hiện Đang xóa; bài biến mất khỏi feed/hồ sơ/đã lưu/tìm kiếm. (3) Xóa trong chi tiết bài: quay về Khám phá, mở liên kết cũ không hiển thị bài đã xóa. (4) Tôi → Blog của tôi, dùng dấu ba chấm trên cả Blog nháp và đã đăng → Xóa Blog → xác nhận; kiểm tra danh sách cập nhật và nhấn menu không mở màn chỉnh sửa. (5) Mở bài hoặc Blog người khác, rồi thử khi chưa đăng nhập: không được thấy Xóa. (6) Tắt mạng lúc xác nhận: có lỗi, nội dung còn và có thể đóng/thử lại; thử nội dung đã bị xóa hoặc quyền bị backend từ chối. (7) Tải nhiều trang trước khi xóa rồi tải thêm, kiểm tra không lỗi cursor; kiểm tra Android/web, theme tối, chữ lớn và nút không bị thanh điều hướng che.
- Người thực hiện: Codex.

## 2026-11-19 — Commit chức năng xóa bài và Blog

- Kết quả đã làm: Đóng gói chức năng xóa bài/Blog của tác giả, xác nhận xóa, cập nhật cache và test hồi quy vào commit fb00be3 trên branch feat/expert-verification theo yêu cầu. Đã push lên origin và xác nhận HEAD local trùng remote. Giữ báo cáo SRS local.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở bài của mình → dấu ba chấm → Xóa → Hủy, kiểm tra bài còn. (2) Xác nhận xóa và kiểm tra bài biến mất. (3) Blog của tôi → dấu ba chấm → Xóa Blog, kiểm tra cả nháp và đã đăng.
- Người thực hiện: Codex.

## 2026-11-19 — Tạo PR xóa bài và Blog vào main

- Kết quả đã làm: Tạo PR #35 https://github.com/WDP-FA26/vedora-mobile/pull/35 từ feat/expert-verification vào main cho commit fb00be3. PR mô tả xác nhận xóa, quyền tác giả, cập nhật cache và kết quả kiểm tra; chưa merge.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở PR #35 trên GitHub, kiểm tra base main và tab Files changed. (2) Chạy app từ branch PR → mở bài của mình → dấu ba chấm → Xóa → thử Hủy rồi xác nhận. (3) Blog của tôi → thử xóa Blog nháp và đã đăng.
- Người thực hiện: Codex.

## 2026-11-19 — Lập thực đơn tuần sau vào cuối tuần

- Bàn giao: Đóng gói tính năng và kiểm thử trên branch feat/expert-verification, thực hiện commit và push theo yêu cầu người dùng. Giữ các báo cáo SRS chưa commit ở local.
- PR: Đã commit/push ce37451 và tạo PR #36 https://github.com/WDP-FA26/vedora-mobile/pull/36 từ feat/expert-verification vào main cho tính năng lập thực đơn theo tuần; chưa merge. Kiểm tra UI trên GitHub: (1) Mở PR #36, kiểm tra base main và head feat/expert-verification. (2) Mở Files changed, kiểm tra thay đổi Meal Planner. (3) Chạy app từ branch PR và thực hiện các bước kiểm tra luồng bên dưới. Người thực hiện: Codex.
- Kiểm tra kỹ thuật: 10 kiểm thử tự động (meal-weeks và dietary-profile), TypeScript, lint và export Android/web đều đạt. Chưa kiểm thử UI trên thiết bị thật hoặc tài khoản backend; các bước bên dưới là hướng dẫn kiểm tra tiếp.
- Kết quả đã làm: Đọc backend main 24a0fdc3 và hai commit meal planner ef090bae/e94efb56. Chuyển mobile từ thực đơn lặp sang tuần riêng: đọc mốc tuần/ngày/khả năng sửa do server trả, chọn tuần này/tuần sau và các tuần trong maxWeekStart, cache theo weekStart. Thứ Bảy/Chủ nhật theo ngày server có nút Lên thực đơn tuần sau mở form đúng tuần. Chat/GET/PUT/DELETE nháp mang đúng weekStart; form ghi rõ khoảng ngày, không còn yêu cầu lặp hằng tuần. Đọc thẻ từ fillSlots/editDraft, giữ đề xuất mới nhất theo từng tuần, hỗ trợ nhiều tuần trong một câu trả lời và khôi phục lịch sử. Xem trước tự mở đúng tuần, giữ riêng bản xem trước từng tuần; lưu kiểm tra lại đúng tuần, bỏ ngày đã khóa và giữ bữa không đổi; không cho lưu thẻ cũ, khóa bấm trùng trong cả bước đọc và ghi. Bỏ đề xuất gọi DELETE nháp đúng tuần; lỗi giữ đề xuất để thử lại. Ngày qua chỉ xem, không có nút đổi món. Không thêm thư viện, chưa commit/push.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Với ngày server là Thứ Bảy hoặc Chủ nhật, mở Thực đơn của tôi, kiểm tra nút Lên thực đơn tuần sau → mở form với đúng thứ Hai tuần kế tiếp và khoảng ngày. (2) Gửi yêu cầu, mở thẻ Xem thực đơn, kiểm tra tab chuyển đúng tuần; Lưu thực đơn, quay lại Tuần này bảo đảm nội dung cũ không đổi. (3) Chọn Tuần sau trực tiếp trong tab thực đơn hoặc form, thử lập/lưu kể cả ngày thường (backend cho phép lập trước tối đa 4 tuần). (4) Ở Tuần này, mở ngày đã qua: thấy Chỉ xem lại và không đổi món; lưu đề xuất cũ không sửa ngày đã qua. (5) Nhắn “lên thực đơn tuần này và tuần sau”, kiểm tra các thẻ theo tuần; đổi một tuần, thẻ mới thay thẻ cũ của tuần đó, tuần còn lại vẫn áp dụng được. (6) Xem trước ở hai tuần rồi chuyển qua lại, kiểm tra không trộn món; bỏ đề xuất một tuần không xóa tuần kia. (7) Tắt mạng lúc lưu/bỏ nháp: hiển thị lỗi và giữ nội dung; bấm Lưu nhanh nhiều lần không gửi trùng. (8) Mở lịch sử chat, kiểm tra thẻ có ngày tuần và mở đúng tuần; tạo đoạn chat mới không giữ bản xem trước cũ. (9) Kiểm tra cuối tháng/cuối năm, đổi múi giờ thiết bị, màn nhỏ, theme tối và cỡ chữ lớn; giới hạn tuần vẫn theo server.
- Người thực hiện: Codex.

## 2026-11-19 — Chia sẻ bài viết và Blog qua tin nhắn

- Kết quả đã làm: Đọc backend main 8a7ab1b0 và hợp đồng chia sẻ từ PR #50. Menu bài viết/Blog đã xuất bản có Gửi qua tin nhắn; giữ chia sẻ liên kết hiện có. Bộ chọn gộp cuộc trò chuyện ở cả hai hộp thư với người đang theo dõi, loại trùng/bản thân, lọc tên không dấu, phân trang và thử lại khi tải lỗi; vô hiệu hóa người chưa có quyền. Kiểm tra lại contact trước khi gửi, POST shared-posts chỉ gửi postId/clientMessageId, giữ UUID khi lỗi hoặc đóng/mở lại bộ chọn trên cùng menu, khóa bấm trùng và đóng khi đang gửi. Chỉ mở chat sau khi API xác nhận thành công. Chat hiển thị thẻ từ metadata backend (ảnh, tác giả, tiêu đề, trích đoạn dạng text), chạm mở chi tiết; sharedPost null hiện Bài viết không còn khả dụng và không mở link. Tin văn bản cũ vẫn hiển thị bình thường; dùng lại SSE/unread/read receipt hiện có. Xóa bài làm mới cache tin nhắn để bỏ preview cũ. Không thêm thư viện; chưa commit/push.
- Kiểm tra kỹ thuật: 13 kiểm thử tự động chia sẻ/xóa bài, TypeScript, lint và export Android/web đều đạt. Chưa kiểm thử UI trên thiết bị thật hoặc gửi tin bằng tài khoản backend.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Đăng nhập, mở bài viết hoặc Blog đã xuất bản ở Khám phá/chi tiết/Blog của tôi → dấu ba chấm → Gửi qua tin nhắn. (2) Kiểm tra người nhận từ cuộc trò chuyện và Đang theo dõi, không trùng/bản thân; lọc tên có/không dấu và username, Tải thêm người nhận; người chưa có quyền không bấm Gửi được. (3) Chọn Gửi cho một người, chờ xác nhận rồi kiểm tra chat tự mở, có đúng một thẻ bài viết; chạm thẻ mở đúng chi tiết bài/Blog. (4) Tài khoản người nhận kiểm tra tin đến, badge chưa đọc và Đã xem hoạt động như tin văn bản; tải lại lịch sử, gửi thêm tin chữ. (5) Tắt mạng/mất phản hồi lúc gửi, kiểm tra thông báo lỗi, thử lại và bấm nhanh nhiều lần không tạo tin trùng; đang gửi không đóng bộ chọn được. (6) Bỏ theo dõi hoặc đổi quyền trước khi gửi, kiểm tra thông báo lỗi và không gửi sai quyền. (7) Xóa/ẩn bài đã chia sẻ rồi tải lại chat: thẻ báo không còn khả dụng, không mở link; gửi bài chưa xuất bản báo lỗi. Blog nháp không có thao tác chia sẻ. (8) Khách chọn Gửi qua tin nhắn được đưa đến đăng nhập; chia sẻ liên kết hệ thống vẫn hoạt động. (9) Kiểm tra Android/iOS/web, màn nhỏ, bàn phím mở và theme tối.
- Người thực hiện: Codex.

## 2026-11-19 — Đổi vị trí nút chia sẻ và lưu bài viết

- Kiểm tra: 13 kiểm thử hồi quy chia sẻ/xóa bài, TypeScript và lint đều đạt. Chưa kiểm tra bố cục trên điện thoại thật.
- Kết quả đã làm: Nút chia sẻ nằm bên phải hàng tương tác cùng nút tim, mở lựa chọn gửi qua tin nhắn hoặc chia sẻ liên kết. Nút lưu chuyển lên ngoài cùng bên phải hàng tác giả, cạnh menu ba chấm; giữ trạng thái đã lưu, khóa khi đang cập nhật và yêu cầu đăng nhập. Áp dụng chung thẻ bài viết/Blog ở feed và chi tiết. Không thêm thư viện, chưa commit/push.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở Khám phá, kiểm tra nút lưu ở góc trên bên phải và nút chia sẻ ở bên phải cùng hàng nút tim. (2) Nhấn lưu/bỏ lưu, kiểm tra biểu tượng đổi trạng thái và mục Đã lưu cập nhật. (3) Nhấn chia sẻ → Gửi qua tin nhắn → chọn người nhận, kiểm tra chat mở sau khi gửi thành công; thử chia sẻ liên kết. (4) Mở chi tiết bài/Blog, kiểm tra bố cục tương tự; menu ba chấm vẫn có xóa/báo cáo đúng quyền. (5) Thử khi chưa đăng nhập, màn nhỏ, tên tác giả dài, theme tối và cỡ chữ lớn.
- Người thực hiện: Codex.

## 2026-11-19 — Đặt nút lưu trên ảnh và bỏ chia sẻ liên kết

- Ngôn ngữ bàn giao: Đã đổi tiêu đề và mô tả PR #37 sang tiếng Anh; commit 1122c8e vốn dùng tiếng Anh nên giữ nguyên. Kiểm tra UI GitHub (đề nghị, chưa thực hiện): (1) Mở PR #37, đọc tiêu đề và mô tả tiếng Anh. (2) Mở tab Commits, kiểm tra thông điệp commit tiếng Anh. Người thực hiện: Codex.
- PR: Đã commit/push 1122c8e và tạo PR #37 https://github.com/WDP-FA26/vedora-mobile/pull/37 từ feat/expert-verification vào main; chưa merge. Kiểm tra UI GitHub (đề nghị, chưa thực hiện): (1) Mở PR #37, xác nhận base main và head feat/expert-verification. (2) Xem Files changed để kiểm tra luồng chia sẻ và vị trí nút lưu trên ảnh. (3) Chạy app từ branch PR và thực hiện các bước UI bên dưới. Người thực hiện: Codex.
- Bàn giao: Thực hiện commit và push chức năng chia sẻ bài qua tin nhắn cùng bố cục nút lưu/chia sẻ trên branch feat/expert-verification theo yêu cầu người dùng. Giữ các báo cáo SRS local ngoài commit.
- Kiểm tra: 13 kiểm thử hồi quy chia sẻ/xóa bài, TypeScript và lint đều đạt. Chưa kiểm tra bố cục trên điện thoại thật.
- Kết quả đã làm: Đưa nút lưu đè lên góc trên bên phải ảnh bìa Blog trong thẻ và trang chi tiết, có nền nổi để đọc rõ trên ảnh; vùng ảnh đính kèm có vị trí lưu tương tự. Bài không có ảnh giữ nút lưu ở đầu bài. Nút lưu tách khỏi vùng chạm mở bài. Bỏ mục Chia sẻ bài viết qua hệ thống và mã Share.share; giữ Gửi qua tin nhắn theo API shared-posts của backend. Nút gửi ở hàng tương tác mở thẳng bộ chọn người nhận. Chưa commit/push.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở Blog có ảnh bìa ở Khám phá, kiểm tra nút lưu nằm trên góc phải ảnh. (2) Chạm lưu/bỏ lưu, kiểm tra không mở chi tiết và trạng thái thay đổi. (3) Mở chi tiết Blog, kiểm tra ảnh bìa có nút lưu tương tự. (4) Mở bài không có ảnh, kiểm tra nút lưu vẫn dùng được ở đầu bài. (5) Nhấn nút gửi ở hàng nút tim: mở bộ chọn người nhận; menu ba chấm không còn mục Chia sẻ bài viết. (6) Thử gửi qua tin nhắn, khách chưa đăng nhập, ảnh sáng/tối và màn nhỏ.
- Người thực hiện: Codex.

## 2026-11-19 — Hiện/ẩn mật khẩu bằng biểu tượng con mắt

- PR: Đã tạo PR #38 https://github.com/WDP-FA26/vedora-mobile/pull/38 từ feat/expert-verification vào main cho commit 9347566, tiêu đề và mô tả tiếng Anh; chưa merge. Kiểm tra UI GitHub (đề nghị, chưa thực hiện): (1) Mở PR #38, xác nhận base main và thay đổi AuthField. (2) Chạy app từ branch PR, mở Đăng nhập/Đăng ký/Đặt lại mật khẩu và thử biểu tượng hiện/ẩn từng ô. Người thực hiện: Codex.
- Bàn giao: Thực hiện commit và push trên branch feat/expert-verification theo yêu cầu người dùng; giữ các báo cáo SRS local ngoài commit.
- Kiểm tra: TypeScript và lint đều đạt. Chưa kiểm thử tương tác trên điện thoại thật.
- Kết quả đã làm: Thêm nút con mắt bên phải ô mật khẩu trong AuthField dùng chung. Mặc định ẩn, bấm để hiện/ẩn từng ô độc lập; có nhãn trợ năng và vùng chạm 44px, chừa khoảng trống tránh chữ đè biểu tượng. Áp dụng cho đăng nhập, đăng ký/nhập lại mật khẩu và đặt lại mật khẩu; giữ giá trị, autocomplete và thao tác gửi form. Không thêm thư viện, chưa commit/push.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở Đăng nhập, nhập mật khẩu và kiểm tra mặc định bị che. (2) Bấm con mắt để hiện, bấm lại để ẩn; kiểm tra mật khẩu không mất và nút đăng nhập vẫn hoạt động. (3) Mở Đăng ký, thử hiện/ẩn riêng ô mật khẩu và nhập lại mật khẩu. (4) Thử tương tự ở Đặt lại mật khẩu; ô email/tên đăng nhập/mã xác minh không có con mắt. (5) Kiểm tra Android/iOS/web, bàn phím mở, mật khẩu dài và theme tối.
- Người thực hiện: Codex.

## 2026-11-19 — Đồng bộ tích xanh chuyên gia trên các màn hình

- Kết quả đã làm: Đối chiếu PostAuthorDto backend main 7c9a1fd0; bổ sung giữ isProfessional trong schema tác giả feed/bình luận, thông báo, người đang theo dõi và bài được chia sẻ. Dùng ProfessionalBadge/ProfessionalName chung với màu BrandColors.verified, chỉ hiện khi cờ server là true; thiếu trường mặc định không xác minh. Hiển thị cạnh tên ở thẻ bài/Blog (dùng chung cho các feed, hồ sơ, tìm kiếm, Đã lưu và chi tiết), video reels, bình luận/phản hồi, gợi ý và danh sách theo dõi, danh sách người đang theo dõi, hồ sơ cá nhân/công khai, thông báo, hộp thư/chat/bộ chọn người nhận/thẻ bài chia sẻ và người đăng trong composer. Huy hiệu dữ liệu minh họa cũng dùng cùng biểu tượng xanh. Khi trạng thái xác minh đổi, làm mới các cache có thông tin tác giả; không gọi thêm API hồ sơ cho từng thẻ. Bàn giao: Commit và push phần đồng bộ tích xanh trên branch feat/expert-verification theo yêu cầu người dùng; giữ các báo cáo SRS local ngoài commit.
- Giới hạn backend: RecipePostAuthorDto của API công thức chỉ trả username/fullName, chưa có isProfessional hoặc ID tác giả; chưa gắn tích xanh cho tên tác giả trong thẻ/chi tiết công thức, tránh suy đoán hoặc gọi thêm API cho từng thẻ.
- Kiểm tra: 27/27 kiểm thử liên quan huy hiệu, giữ cờ server, cache sau duyệt/thu hồi, bình luận, thông báo, xác minh, chia sẻ và xóa bài đạt. Lint và TypeScript đạt; export Android/web sinh bundle và các trang thành công. Bộ kiểm thử toàn dự án phát hiện hai lỗi ngoài phạm vi ở fixture billing thiếu trường mới và returnTo của trang công thức; các file đó không thay đổi trong task. Chưa kiểm tra UI trên thiết bị thật hoặc tài khoản chuyên gia backend.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Với tài khoản chuyên gia đã duyệt, mở Khám phá, Đang theo dõi, tìm kiếm, Đã lưu, hồ sơ và chi tiết bài/Blog; kiểm tra tích xanh cùng màu cạnh tên. (2) Mở Video, bình luận/phản hồi của chuyên gia và danh sách/gợi ý theo dõi; kiểm tra tích không bị mất khi tên dài. (3) Mở thông báo, hộp thư, chat, bộ chọn người nhận và thẻ bài chia sẻ; kiểm tra đúng chuyên gia có tích, tài khoản thường không có. (4) Mở form tạo bài, kiểm tra tên người đăng dùng cùng huy hiệu; mở trang xác minh kiểm tra mô tả đồng bộ. (5) So sánh tài khoản chưa nộp/chờ duyệt/bị từ chối: không có tích; sau duyệt/thu hồi, tải lại trạng thái xác minh rồi quay lại feed/hồ sơ/chat để kiểm tra dữ liệu đã làm mới. (6) Kiểm tra khách, màn nhỏ, tên dài, chữ lớn và theme tối. (7) API công thức chưa có trạng thái chuyên gia nên tên tác giả công thức chưa hiển thị tích.
- Người thực hiện: Codex.

## 2026-11-19 — Tạo PR đồng bộ tích xanh chuyên gia

- Kết quả đã làm: Đã tạo PR #39 https://github.com/WDP-FA26/vedora-mobile/pull/39 từ feat/expert-verification vào main cho commit 55caaed; tiêu đề và mô tả tiếng Anh, ghi rõ kiểm tra và giới hạn API công thức. Chưa merge.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở PR #39, kiểm tra base main và thay đổi huy hiệu. (2) Chạy app từ branch PR, mở feed/hồ sơ/bình luận/thông báo/tin nhắn để kiểm tra tích xanh cạnh tên chuyên gia. (3) So sánh tài khoản thường và tài khoản chờ duyệt để bảo đảm không có tích.
- Người thực hiện: Codex.

## 2026-11-19 — Cảnh báo nguyên liệu cần tránh ngay trên món trong thực đơn

- Kết quả đã làm: Đọc lại MealPlanProblemDto và logic backend main: AVOIDED_INGREDIENT trả ngày, recipeIds và tên nguyên liệu, bao gồm lựa chọn tránh theo nhóm trong hồ sơ. Mobile giữ recipeIds và problems của bản đề xuất; hiện biểu tượng tam giác kèm “Có nguyên liệu cần tránh: …” dưới tên đúng món. Ghép theo ID và ngày, không đánh nhầm món trùng tên; hỗ trợ payload cũ thiếu ID bằng tên. Dùng cảnh báo riêng của bản xem trước để không gán cảnh báo thực đơn đã lưu sang món mới. Nhãn trợ năng đọc cả nguyên liệu; giữ nút xem công thức/đổi món. Luồng lưu hồ sơ hiện có đã invalidate thực đơn để lấy lại cảnh báo server. Không thêm API hoặc thư viện; Bàn giao: Commit và push cảnh báo nguyên liệu cần tránh trên branch feat/expert-verification, tạo PR vào main theo yêu cầu người dùng.
- Kiểm tra: 12/12 kiểm thử meal planner/hồ sơ ăn uống đạt; TypeScript và lint đạt. Chưa kiểm tra UI trên điện thoại hoặc tài khoản backend thật. Backend chỉ kiểm tra cảnh báo thực đơn đã lưu ở các ngày còn được sửa; không tự suy đoán cảnh báo cho ngày quá khứ. Bản đề xuất chỉ hiển thị được khi qua điều kiện ok hiện có của planner.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Vào Tôi → thông tin ăn uống, chọn nguyên liệu hoặc nhóm cần tránh có trong món của thực đơn ngày hôm nay/tương lai, nhấn Lưu. (2) Quay lại Thực đơn, chọn đúng tuần/ngày và kiểm tra tam giác cùng tên nguyên liệu dưới món tương ứng. (3) Kiểm tra món không chứa nguyên liệu tránh không có cảnh báo; món trùng tên nhưng khác ID không bị gán nhầm. (4) Bỏ lựa chọn tránh, Lưu rồi quay lại thực đơn, đợi tải lại và kiểm tra cảnh báo mất. (5) Chuyển ngày/tuần, mở bản xem trước và kiểm tra không mang cảnh báo của món cũ sang món mới. (6) Bấm Xem công thức/Đổi món, kiểm tra vẫn hoạt động; thử màn nhỏ, chữ lớn, theme tối và trình đọc màn hình.
- Người thực hiện: Codex.

## 2026-11-19 — Commit, push và tạo PR cảnh báo nguyên liệu cần tránh

- Kết quả đã làm: Đã commit 04f8585 và push lên feat/expert-verification; tạo PR #40 https://github.com/WDP-FA26/vedora-mobile/pull/40 vào main với tiêu đề/mô tả tiếng Anh. Giữ báo cáo SRS local ngoài commit. Chưa merge.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở PR #40, kiểm tra base main, commit và thay đổi meal planner. (2) Chạy app từ branch PR, lưu nguyên liệu cần tránh trong hồ sơ. (3) Mở thực đơn ngày còn được sửa, kiểm tra tam giác và tên nguyên liệu ở đúng món; bỏ lựa chọn tránh rồi kiểm tra cảnh báo được cập nhật.
- Người thực hiện: Codex.

## 2026-11-19 — Đánh giá công thức từ 1 đến 5 sao

- Kết quả đã làm: Đọc docs/docs-for-FE/recipe-ratings.md, DTO và controller backend main 98b41304. Thêm phần đánh giá tại trang chi tiết công thức: điểm trung bình/số lượt, trạng thái chưa có đánh giá, điểm hiện tại của mình, chọn 1–5 sao để gửi/cập nhật và gỡ đánh giá. Khách đọc summary public và có nút đăng nhập; tài khoản đọc rating riêng. Gọi đúng GET summary/GET rating/PUT rating với duy nhất value/DELETE rating, Zod kiểm tra input và response, đối chiếu recipeId. Cập nhật bằng tổng backend trả về, không tự tăng lượt; khóa thao tác khi đang gửi/tải, giữ điểm cũ khi lỗi và tải lại khi RATING_CONFLICT. Hiển thị lỗi email chưa xác minh, tự đánh giá, hết phiên và công thức đã xóa. Cache public không chứa myRating, dùng cơ chế xóa cache phiên sẵn có và chặn response/request cũ sau đổi phiên. Không thêm thư viện; Bàn giao: Commit và push phần đánh giá công thức trên branch feat/expert-verification, tạo PR vào main theo yêu cầu người dùng.
- Kiểm tra: 10/10 kiểm thử đánh giá và hồ sơ ăn uống đạt, bao gồm endpoint/body, điểm không hợp lệ, cache/quyền riêng tư, đổi phiên, lỗi, thao tác UI và trạng thái chờ. Lint và TypeScript đều đạt. Chưa thử trực tiếp trên điện thoại hoặc API tài khoản thật; backend chỉ hỗ trợ chấm sao, không có nhận xét bằng chữ/danh sách người chấm.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Chưa đăng nhập, mở chi tiết công thức: kiểm tra điểm trung bình/số lượt hoặc Chưa có đánh giá và nút đăng nhập. (2) Đăng nhập tài khoản đã xác minh email, mở lại công thức, chọn 4 sao; kiểm tra điểm của mình và tổng trả về. (3) Đổi sang 5 sao, kiểm tra không thêm lượt cho cùng tài khoản; mở lại trang để kiểm tra giữ điểm. (4) Nhấn Gỡ đánh giá của tôi, kiểm tra điểm cá nhân trống và tổng cập nhật; nếu là lượt cuối hiển thị Chưa có đánh giá. (5) Thử tài khoản chưa xác minh email và tác giả tự chấm, kiểm tra thông báo phù hợp; vẫn cho gỡ đánh giá hiện có. (6) Tắt mạng/bấm nhanh nhiều sao, kiểm tra không đổi điểm giả và khóa thao tác khi đang gửi; bật mạng thử lại. (7) Đổi tài khoản/đăng xuất trong lúc gửi, kiểm tra không lộ điểm cũ hoặc ghi điểm sang tài khoản mới. (8) Kiểm tra tải lại khi xung đột, công thức đã xóa, cỡ chữ lớn, màn nhỏ, theme tối và trình đọc màn hình.
- Người thực hiện: Codex.

## 2026-11-19 — Commit, push và tạo PR đánh giá công thức

- Kết quả đã làm: Commit 009f50a và push lên feat/expert-verification; tạo PR #41 https://github.com/WDP-FA26/vedora-mobile/pull/41 vào main với tiêu đề/mô tả tiếng Anh. Giữ báo cáo SRS local ngoài commit. Chưa merge.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở PR #41, kiểm tra base main và thay đổi đánh giá công thức. (2) Chạy app từ branch PR, mở chi tiết công thức khi chưa đăng nhập để xem tổng điểm. (3) Đăng nhập, chấm sao/đổi điểm/gỡ điểm, kiểm tra thông báo lỗi và tổng cập nhật.
- Người thực hiện: Codex.

## 2026-11-19 — Rà soát lại backend và mobile sau đánh giá công thức

- Kết quả đã làm: Đối chiếu backend main 98b41304 và mobile 009f50a; xác nhận mobile main đã merge PR #41, compare không có khác biệt nội dung file. Ghi docs/BE_MOBILE_REVIEW_UPDATED_2026-11-19.md với 16 mục phân biệt lỗi, API có nhưng chưa tích hợp, tùy chọn mở rộng và test cũ. Xác nhận lỗi trạng thái kiểm duyệt, bìa Blog khác hợp đồng, key theo access token làm reset tab, nguy cơ ghi đè thực đơn hai thiết bị và job video nền chưa gắn chủ phiên. Không còn tính xóa bài/phản hồi bình luận/tích xanh/tuần sau/cảnh báo nguyên liệu/đánh giá sao là chưa làm. Không sửa source ứng dụng, không commit/push.
- Kiểm tra: Lint và TypeScript đạt. Toàn bộ 66 test: 64 đạt, 2 lỗi cũ ở fixture billing và route công thức. Thử schema/hàm thật xác nhận các trạng thái backend bị từ chối và selector bỏ tuần cũ. Chưa chạy backend/DB/provider/thiết bị thật, chưa audit web/Admin UI hay toàn bộ SRS; không đưa phần trăm hoàn thành.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Chọn ảnh bìa Blog, lưu nháp/mở lại rồi xuất bản và theo dõi kiểm duyệt. (2) Mở nháp/form thực đơn, thử refresh phiên khi đưa app ra nền/vào lại. (3) A đăng video lỗi rồi đăng xuất, B đăng nhập kiểm tra không còn job A. (4) Hai thiết bị cùng sửa một ngày để kiểm tra chống ghi đè. (5) Sang tuần mới, tìm thực đơn tuần trước và danh sách mua sắm. (6) Thử bài chỉ chữ/nhiều video, video Blog, lượt xem và login tài khoản bị khóa. (7) Hồi quy bình luận/xóa bài/chia sẻ/tích xanh/cảnh báo nguyên liệu/chấm sao; bước chi tiết và cách sửa trong báo cáo mới.
- Người thực hiện: Codex.

## 2026-11-19 — Ghi nhận lượt xem bài viết và Blog

- Kết quả đã làm: Đối chiếu POST /posts/views, RecordViewsDto và PostViewsService backend; thêm service validate UUID v4/payload, nhận HTTP 204 không body. Ghi nhận từ feed Khám phá/Blog/Đang theo dõi, video reels, tìm kiếm, Đã lưu, hồ sơ và chi tiết bài. FlatList dùng viewability thực tế, không dùng cờ phát video hoặc render làm lượt xem; ScrollView dùng vị trí/chiều cao món bài so với viewport, có xử lý bài Blog dài. Chỉ ghi PUBLISHED sau một giây liên tục, bỏ dữ liệu minh họa. Dừng khi route mất focus, đổi bộ lọc, app xuống nền/Android blur hoặc tab web bị ẩn. Gom sau ba giây, tối đa 50 ID/lô theo mặc định BE; chống trùng trong một tracker và để server xử lý dedupe giữa các màn. Flush phần đã đủ thời gian khi rời màn, retry tối đa một lần; đổi phiên hủy request đang gửi và bỏ hàng đợi cũ. Không tự tăng viewCount vì server cộng nền; cần tải lại dữ liệu sau độ trễ backend. Không thêm thư viện, chưa commit/push.
- Kiểm tra: 25/25 kiểm thử liên quan lượt xem/xóa bài/chia sẻ đạt (12 test lượt xem mới); TypeScript và lint đạt. Đã xuất bundle Android/web; Expo báo tiến trình không tự thoát và tự kết thúc sau khi xuất xong. Chưa kiểm tra thao tác trên điện thoại thật hoặc đối chiếu counter với API/DB đang chạy. Giới hạn batch mobile đang theo mặc định BE 50; việc đọc public-config vẫn là task riêng.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở Khám phá bằng khách, giữ bài thực hiển thị ít nhất nửa viewport hoặc toàn bộ thẻ trong hơn một giây, đợi vài giây rồi tải lại để đối chiếu lượt xem; thẻ minh họa không gửi. (2) Cuộn nhanh qua bài dưới một giây, kiểm tra không có lượt xem cho bài đó; dừng đủ lâu mới tính. (3) Thử Blog, Đang theo dõi, Video, kết quả tìm kiếm và Đã lưu; kiểm tra không ghi bài chỉ tải sẵn ngoài màn hình. (4) Mở hồ sơ mình/người khác và chi tiết Blog dài, cuộn qua bài để kiểm tra đúng vùng nhìn thấy, không đếm toàn bộ danh sách ngay khi tải. (5) Rời tab/chuyển màn/đưa app xuống nền hoặc kéo thanh thông báo Android trước một giây, trở lại phải nhìn lại đủ một giây; thử ẩn tab web tương tự. (6) Đổi tài khoản trong lúc gửi, kiểm tra request/queue cũ bị hủy; mất mạng không chặn cuộn hoặc hiện lỗi gây cản trở. (7) Quay lại cùng bài hoặc xem ở màn khác, kiểm tra chống trùng theo backend; lượt hiển thị có độ trễ, không tự tăng trên UI. (8) Hồi quy phát/dừng video, tải trang tiếp, chuyển bộ lọc, xóa và chia sẻ bài.
- Người thực hiện: Codex.

## 2026-11-19 — Bàn giao ghi nhận lượt xem

- Kết quả đã làm: Đóng gói chức năng ghi nhận lượt xem trên branch feat/post-view-tracking để commit, push và tạo PR vào main theo yêu cầu. Giữ các báo cáo rà soát local ngoài commit.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở PR, kiểm tra base main và tab Files changed. (2) Chạy app từ branch PR, giữ bài trên màn hình hơn một giây rồi tải lại sau độ trễ backend để kiểm tra lượt xem. (3) Cuộn nhanh, rời màn và đưa app xuống nền để kiểm tra không tính lượt xem chưa đủ thời gian.
- Người thực hiện: Codex.

- Bàn giao thực tế: Commit 95d88b0 đã push lên origin/feat/post-view-tracking; tạo PR #42 https://github.com/WDP-FA26/vedora-mobile/pull/42 vào main với tiêu đề/mô tả tiếng Anh. Chưa merge. Người thực hiện: Codex.

## 2026-11-19 — Lý do báo cáo mới: không thuần thực vật

- Kết quả: API thêm lý do báo cáo `NOT_PLANT_BASED`. Form báo cáo bài viết có thêm lựa chọn "Món ăn hoặc nội dung không thuần thực vật" (đặt trước "Nội dung phản cảm", "Lý do khác" vẫn ở cuối). Thông báo kết quả báo cáo mang lý do này nay hiện đủ "(lý do: món ăn hoặc nội dung không thuần thực vật)" thay vì bỏ trống. Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Mở menu ⋯ của một bài người khác, chọn Báo cáo: danh sách lý do có "Món ăn hoặc nội dung không thuần thực vật". (2) Chọn lý do này, gửi: báo cáo được gửi thành công như các lý do khác. (3) Admin bấm "Đã xử lý" báo cáo đó: người báo cáo mở Thông báo thấy "Vedora đã xử lý báo cáo của bạn về một bài viết (lý do: món ăn hoặc nội dung không thuần thực vật)". (4) Admin xoá bài bị báo cáo nhiều nhất với lý do này: chủ bài thấy dòng gỡ bài kèm đúng lý do. (5) Theme tối, chữ lớn: danh sách lý do cuộn được, không bị cắt.
- Người thực hiện: Claude.

## 2026-11-19 — Bản nháp video hướng dẫn (theo API `/posts/drafts`)

- Kết quả: Video hướng dẫn nay luôn đi qua một bản nháp riêng tư trên server. Đóng form đang soạn: màn xác nhận có nút chính **Lưu nháp** (cùng "Tiếp tục chỉnh sửa", "Bỏ bài viết"); app lưu tiêu đề, mô tả và tải video lên bản nháp ở nền (banner trên bảng tin hiện "Đang lưu bản nháp…", "Đang tải video …%", rồi "Đã lưu bản nháp"). Trong Tạo nội dung có mục **Bản nháp (n)**: liệt kê bản nháp video (tiêu đề, tình trạng video, giờ lưu), chạm để mở lại và sửa tiếp (hiện video đã có trong nháp, có thể thay hoặc xóa), nút thùng rác xóa bản nháp sau khi xác nhận. Bấm **Đăng video** cũng lưu vào bản nháp trước, tải video, chờ server nhận xong video rồi mới gọi đăng (`POST /posts/drafts/:id/publish`); bài vẫn qua xử lý và kiểm duyệt như cũ. Mọi bước dùng lại cùng ID nên bấm Thử lại không tạo bài hay video trùng; video tải dở bị gỡ và tải lại từ đầu. Lỗi hiện bằng lời dễ hiểu (hết giới hạn số nháp, nháp bị sửa ở nơi khác, video lỗi cần chọn lại). Nháp bài ngắn tạo trên web không hiện trên app vì app chưa soạn được bài ngắn. Video chưa tải xong chỉ nằm trên máy đang tải: tắt hẳn app giữa chừng thì phải mở nháp và chọn lại video. Chưa thử trên máy thật.
- Bước kiểm tra UI: (1) Bảng tin › Tạo nội dung › Video hướng dẫn: nhập tiêu đề, mô tả, chọn video; bấm X › màn "Lưu bài viết thành bản nháp?" › Lưu nháp: form đóng, banner chạy "Đang lưu…" rồi "Đang tải video …%" rồi "Đã lưu bản nháp". (2) Mở lại Tạo nội dung: thấy "Bản nháp (1)"; vào xem: đúng tiêu đề, "Video đang được xử lý" hoặc "Video sẵn sàng", giờ lưu. (3) Chạm bản nháp: form "Sửa bản nháp" có sẵn tiêu đề, mô tả và khung "Video trong bản nháp"; video sẵn sàng thì phát được. (4) Sửa tiêu đề, bấm X › Lưu nháp; mở lại: tiêu đề mới. Bấm X › "Bỏ thay đổi": nháp giữ nội dung lưu lần trước. (5) Mở nháp, bấm Đăng video: banner "Đang đăng bài…" rồi "Đã nhận video, đang được xử lý"; nháp biến mất khỏi danh sách, bài hiện trên bảng tin khi xử lý xong. (6) Mở nháp, "Thay video" chọn video khác rồi Lưu nháp: nháp chỉ còn video mới. "Xóa video" rồi bấm Đăng: báo "Chọn video hướng dẫn." (7) Tắt mạng giữa lúc tải video: banner đỏ "Tải video lên thất bại…" với nút Thử lại; bật mạng, Thử lại: tải lại từ đầu và hoàn tất, không có video trùng. Bấm X trên banner lỗi: nháp vẫn còn trong danh sách. (8) Thùng rác ở một nháp › Hủy: không đổi; › Xóa: nháp biến mất. Nháp đang lưu/đăng thì không mở hay xóa được ("Đang lưu hoặc đăng…"). (9) Tạo nháp trên web rồi mở app: nháp video hiện ở danh sách. (10) Theme tối, chữ lớn.
- Người thực hiện: Claude.

## 2026-11-19 — Hiển thị bảng Markdown trong chat AI

- Kết quả đã làm: Bổ sung nhận diện và hiển thị bảng Markdown cho chat dinh dưỡng, lập thực đơn và trợ lý Blog qua ChatMarkdown dùng chung. Có hàng tiêu đề, đường kẻ, căn trái/giữa/phải, chữ đậm/nghiêng/code/link trong ô, chọn chữ và cuộn ngang khi nhiều cột; giới hạn chiều rộng theo bong bóng chat. Xử lý dấu phân cột được escape, thiếu/thừa ô và dữ liệu trả dần. Giữ nguyên đoạn mã, xuống dòng và định dạng Markdown khác; không diễn giải HTML hay link nguy hiểm. Đưa bộ đọc Markdown vào shared/utils, giữ đường import Blog tương thích và mặc định Blog không đổi. Không thêm thư viện, chưa commit/push.
- Kiểm tra: 6/6 kiểm thử parser và cây render đạt; lint và TypeScript đạt. Export web đạt; Expo có cảnh báo không tự thoát sau khi xuất xong. Chưa thao tác trên thiết bị thật hoặc gọi AI thật.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở chat dinh dưỡng, yêu cầu AI lập bảng so sánh thực phẩm gồm tên, năng lượng và protein. (2) Theo dõi lúc AI trả lời từng phần, kiểm tra bảng hiện đúng khi dòng phân cách hoàn chỉnh và dữ liệu tiếp tục vào đúng hàng/cột. (3) Vuốt ngang trên bảng nhiều cột để xem cột cuối, sau đó cuộn dọc lịch sử chat; kiểm tra bong bóng không tràn màn hình. (4) Yêu cầu bảng có chữ đậm, link và cột căn phải, kiểm tra định dạng, nhấn link và chọn chữ trong ô. (5) Thử bảng có nội dung dài, ô trống, màn hình nhỏ, cỡ chữ lớn và theme sáng/tối. (6) Mở chat lập thực đơn và trợ lý Blog, kiểm tra cùng cách hiển thị bảng; kiểm tra tiêu đề, danh sách, đoạn mã, xuống dòng và con trỏ đang trả lời. (7) Mở lại lịch sử chat và một Blog cũ để kiểm tra nội dung trước đây vẫn đọc được.
- Người thực hiện: Codex.

## 2026-11-19 — Sửa bảng AI có dòng trống giữa các hàng

- Kết quả đã làm: Đối chiếu ảnh người dùng: nội dung bảng vẫn hiện dấu phân cột do parser chỉ nhận các hàng liền nhau. Sửa nhận diện dòng tiêu đề/dòng phân cách và hàng dữ liệu khi có dòng trống xen giữa; giữ nội dung trước/sau bảng và tách hai bảng liên tiếp. Không biến tiêu đề, danh sách hoặc đoạn mã sau bảng thành hàng dữ liệu. Tái hiện nội dung đậu phụ trong ảnh thành bảng 3 cột, 2 hàng dữ liệu; kiểm tra cả các tiền tố khi trả dần. Không thay đổi API hoặc giới hạn trả lời AI; chưa commit/push.
- Kiểm tra: 8/8 kiểm thử parser và cây render đạt. Lint và TypeScript đạt. Chưa thao tác trên điện thoại thật.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Reload app đang chạy code mới, mở Trợ lý Vedora. (2) Hỏi lại câu về lượng đạm trong đậu phụ và yêu cầu bảng gồm Loại đậu phụ, Khẩu phần, Đạm. (3) Khi AI trả bảng có dòng trống giữa các hàng, kiểm tra bảng có đường kẻ, đúng 3 cột và đủ hàng, không còn hiện dòng |---|---|---|. (4) Vuốt ngang để đọc cột Đạm, kiểm tra đoạn diễn giải trước/sau bảng vẫn đủ. (5) Thử hai bảng liên tiếp, danh sách và đoạn mã sau bảng; mở lại lịch sử để kiểm tra hiển thị nhất quán.
- Người thực hiện: Codex.

## 2026-11-19 — Kẻ bảng chat AI thành lưới chữ nhật liền nét

- Kết quả đã làm: Theo làm rõ của người dùng, bảng đã có đường kẻ nhưng cần khung chữ nhật và lưới nối liền. Bỏ bo góc, tăng tương phản đường viền bằng màu mutedForeground của theme, cố định chiều rộng toàn bảng theo số cột và không cho ô co lại; các ô kéo giãn theo chiều cao hàng, không có khoảng cách để đường ngang/dọc khớp nhau. Giữ cuộn ngang trên màn nhỏ. Chưa commit/push.
- Kiểm tra: 8/8 kiểm thử parser/render đạt, gồm khung vuông, màu nét, chiều rộng và đường kẻ ô. Lint và TypeScript đạt. Chưa xác minh trực quan trên điện thoại thật; công cụ xem UI trong phiên hiện tại không khởi tạo được.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở chat AI có phản hồi bảng trên bản code mới. (2) Kiểm tra bốn cạnh khung thẳng, góc vuông, từng hàng/cột có đường kẻ nối liền. (3) Vuốt ngang tới cột cuối để kiểm tra cạnh phải và lưới không lệch. (4) Thử ô dài xuống nhiều dòng, kiểm tra đường dọc kéo hết chiều cao hàng. (5) Đổi theme sáng/tối để kiểm tra nét kẻ vẫn rõ.
- Người thực hiện: Codex.

## 2026-11-19 — Hiển thị bài đăng lại trên hồ sơ

- Kết quả đã làm: Đọc docs/docs-for-FE/post-reposts.md và PostsController backend main 95447251. Thêm tab Đăng lại trên hồ sơ mình và hồ sơ công khai; nối GET /posts/reposted-by/:userId, validate UUID/response, gửi cursor và AbortSignal. Giữ tác giả gốc, tích xanh và trạng thái tương tác của người xem qua PostCard; có chú thích người đã đăng lại, hỗ trợ cả bài thường và Blog. Phân trang theo nextCursor kể cả trang rỗng/bài bị ẩn; có tải thêm, khóa thao tác khi tải, trạng thái rỗng và thử lại lỗi trang đầu/trang tiếp theo. Đăng lại/hủy đăng lại cập nhật bản sao bài trong cache, hủy đọc cũ và reset danh sách đăng lại để không dùng cursor đã mất; chặn cập nhật sau đổi phiên. Kết nối ghi nhận lượt xem theo viewport của tab đang chọn; kéo làm mới hồ sơ mình làm mới tab Đăng lại khi đang mở. Giữ nguyên các thay đổi bảng chat AI local; không thêm thư viện, chưa commit/push.
- Kiểm tra: 39/39 kiểm thử đăng lại/lượt xem/xóa bài/chia sẻ/bảng chat đạt (6 test đăng lại mới), lint và TypeScript lượt cuối đều đạt. Chưa thử thao tác với API thật hoặc trên điện thoại thật.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Đăng nhập, mở bài của người khác ở Khám phá, nhấn Đăng lại rồi vào Tôi → Đăng lại; kiểm tra bài mới nhất đứng đầu và tên/tích xanh vẫn thuộc tác giả gốc. (2) Đăng lại một Blog, kiểm tra xuất hiện cùng tab, mở chi tiết và thử tim/lưu/bình luận. (3) Hủy đăng lại trong tab, kiểm tra bài biến mất sau tải lại, số lượt cập nhật ở feed và danh sách không lặp trang cũ. (4) Mở hồ sơ người khác → Đăng lại; thử cả khách và thành viên, kiểm tra nút Đăng lại phản ánh trạng thái người đang xem. (5) Với hơn 20 lượt, nhấn Tải thêm tới cuối; thử trang toàn bài bị ẩn vẫn còn cursor để kiểm tra còn nút tải thêm. (6) Tắt mạng khi tải trang đầu/trang tiếp theo, kiểm tra đúng nút thử lại và không mất các bài đang có; tải lại hồ sơ và kéo làm mới. (7) Đổi tài khoản khi thao tác để kiểm tra dữ liệu phiên cũ không cập nhật sang phiên mới. (8) Chuyển giữa Bài viết/Blog của tôi/Đăng lại, cuộn và rời màn để kiểm tra view không được ghi cho tab ẩn.
- Người thực hiện: Codex.

## 2026-11-19 — Đồng bộ main mới và giữ phần Đăng lại

- Kết quả đã làm: Fetch origin và fast-forward branch feat/post-view-tracking tới main cee6a0f (PR #44), nhận tính năng bản nháp video và lý do báo cáo NOT_PLANT_BASED. Sao lưu thay đổi local vào stash 49c3cb1 trước khi đồng bộ, áp lại phần Đăng lại, bảng chat AI và báo cáo local. Xử lý xung đột duy nhất ở PLAN bằng cách giữ cả nhật ký upstream và local; xác minh 16 file local ngoài PLAN trùng nội dung bản sao lưu. HEAD trùng origin/main, không còn file xung đột; thay đổi local để chưa stage, chưa tạo commit/push mới. Giữ stash dự phòng.
- Kiểm tra: 43/43 kiểm thử đăng lại, bản nháp video, bảng chat, lượt xem, xóa và chia sẻ đạt. Lint và TypeScript sau đồng bộ đều đạt. Chưa thao tác trên điện thoại thật.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Reload app, vào Tôi → Đăng lại và hồ sơ người khác → Đăng lại; kiểm tra bài vẫn hiển thị và tải thêm được. (2) Đăng lại/hủy đăng lại một bài, kiểm tra danh sách cập nhật và tác giả gốc giữ đúng. (3) Tạo video → đóng form → Lưu nháp, mở lại bản nháp, kiểm tra dữ liệu và thử đăng. (4) Mở menu báo cáo bài khác, kiểm tra lý do không thuần thực vật. (5) Mở chat AI có bảng, kiểm tra khung chữ nhật và nét liền vẫn giữ.
- Người thực hiện: Codex.

## 2026-11-19 — Bàn giao Đăng lại và bảng chat AI

- Kết quả đã làm: Đóng gói phần Đăng lại trên hồ sơ và bảng Markdown chat AI trên branch feat/profile-reposts-ai-tables từ main cee6a0f để commit, push và tạo PR vào main theo yêu cầu. Giữ các báo cáo rà soát và nhật ký cũ local ngoài commit. Kiểm tra gần nhất sau đồng bộ: 43/43 test liên quan, lint và TypeScript đạt; chưa thử thiết bị/API thật.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở PR trên GitHub, kiểm tra base main và Files changed. (2) Chạy app từ branch PR, vào Tôi/hồ sơ người khác → Đăng lại, thử tải thêm và hủy đăng lại. (3) Mở chat AI yêu cầu bảng, kiểm tra lưới chữ nhật, hàng nhiều dòng và cuộn ngang.
- Người thực hiện: Codex.

- Bàn giao thực tế: Commit 1fb5e26 đã push lên origin/feat/profile-reposts-ai-tables; tạo PR #45 https://github.com/WDP-FA26/vedora-mobile/pull/45 vào main. Tiêu đề commit/PR và mô tả PR bằng tiếng Anh; chưa merge. Người thực hiện: Codex.

## 2026-11-19 — Sửa thiếu ảnh món trong xem trước thực đơn

- Kết quả đã làm: Xác nhận MealRecipeRefDto của backend chỉ trả ID/tên/tag cho bản xem trước, không có imageUrl; mobile trước đây chỉ đọc imageUrl từ món rồi hiện sticker. Thêm MealRecipePhoto để lấy chi tiết /recipes/:id khi ref thiếu ảnh, dùng chung query key/cache và AbortSignal của useRecipe; chỉ mount cho món thuộc ngày đang xem. Món đã có URL/null không phát sinh request chi tiết; giữ ảnh của thực đơn đã lưu. Có trạng thái chờ, hình thay thế khi món không có ảnh/API lỗi hoặc URL ảnh lỗi và giữ phóng to ảnh. Không thay đổi ID món, đề xuất hay dữ liệu lưu thực đơn; không thêm thư viện, chưa commit/push.
- Kiểm tra: 16/16 kiểm thử ảnh món/tuần thực đơn/hồ sơ ăn uống đạt, gồm dedupe request, dùng cache, URL ảnh có sẵn, ảnh null, lỗi công thức/ảnh và luồng lưu đề xuất. Lint và TypeScript đạt. Chưa kiểm tra trên điện thoại thật hoặc gọi API thật.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Nhờ AI tạo thực đơn, nhấn Xem thực đơn để mở bản xem trước chưa lưu. (2) Ở ngày có món, chờ tải chi tiết, kiểm tra ảnh món hiện thay sticker; nhấn ảnh để phóng to. (3) Chuyển ngày rồi quay lại, kiểm tra đúng ảnh từng món và tận dụng cache. (4) Lưu thực đơn, kiểm tra ảnh vẫn đúng và không tải chi tiết thêm chỉ để lấy ảnh khi thực đơn đã có URL. (5) Thử món không có ảnh, tắt mạng hoặc URL ảnh không tải được; kiểm tra hình thay thế và tên món vẫn hiện, không cản thao tác lưu. (6) Kiểm tra cảnh báo nguyên liệu, đổi tuần và mở công thức vẫn hoạt động.
- Người thực hiện: Codex.

## 2026-11-19 — Bàn giao sửa ảnh xem trước thực đơn

- Kết quả đã làm: Đóng gói bản sửa ảnh xem trước thực đơn trên branch fix/meal-preview-photos từ main d19a96c để commit, push và tạo PR vào main theo yêu cầu. Giữ các báo cáo rà soát và nhật ký cũ ở local ngoài commit. Kiểm tra gần nhất: 16/16 test liên quan, lint và TypeScript đạt.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở PR trên GitHub, kiểm tra base main và Files changed. (2) Chạy app từ branch PR → nhờ AI tạo thực đơn → mở xem trước, kiểm tra ảnh món tải lên và phóng to được. (3) Chuyển ngày, lưu thực đơn và thử món không có ảnh để kiểm tra ảnh thay thế.
- Người thực hiện: Codex.

## 2026-11-24 — Nhật ký ăn uống và BMI/cân nặng (đồng bộ từ web)

- Kết quả: Thêm màn **Nhật ký ăn uống** (`/meal-log`): xem từng tuần, chọn ngày, ghi món đã ăn từ thực đơn hoặc món ngoài, nhập kcal hoặc bấm "AI tìm kcal" (có nút Hủy, hiện "~" và nhãn AI ước tính), xóa món, thấy kcal đã ghi so với mục tiêu ngày và tổng kết tuần. Thêm mục **Cơ thể & BMI** trong Hồ sơ ăn uống: nhập chiều cao, cân nặng, cân nặng mục tiêu, năm sinh, giới tính, mức vận động, mục tiêu; xem BMI chuẩn Châu Á, cân nặng hài hòa, kcal gợi ý mỗi ngày; ghi cân nặng hằng ngày kèm cảm giác và xem biểu đồ cột các lần ghi gần nhất. Bỏ mục "nguyên liệu yêu thích" vì web và API đã bỏ. Chưa làm: sửa món đã ghi, nút "Nhờ trợ lý xem lại tuần", thanh nutrition companion trên màn Thực đơn.
- Kiểm tra: (1) Đăng nhập, mở Tôi > Hồ sơ ăn uống, kéo xuống mục "Cơ thể & BMI". (2) Nhập chiều cao 160, cân nặng 55, chọn giới tính, mức vận động, mục tiêu rồi bấm "Lưu chỉ số cơ thể": thẻ BMI và kcal gợi ý xuất hiện. (3) Nhập cân nặng hôm nay, chọn cảm giác, bấm "Ghi cân nặng": ghi thêm vài ngày để thấy biểu đồ cột. (4) Nhập chiều cao 50 rồi lưu: báo lỗi số không hợp lệ. (5) Mở tab Thực đơn, bấm "Nhật ký ăn uống · Ghi món đã ăn". (6) Bấm "Ghi món đã ăn", chọn một món trong thực đơn, bấm "Lưu vào nhật ký": món hiện trong bữa kèm kcal, tổng ngày và "Còn lại" cập nhật. (7) Ghi một món ngoài, nhập tên, bấm "AI tìm kcal", chờ kết quả, lưu: kcal hiện dạng "~… kcal · AI ước tính". (8) Bấm xóa món và xác nhận: món biến mất. (9) Bấm mũi tên tuần trước: ngày cũ hiện "Đã khóa" và không có nút ghi. (10) Mở Hồ sơ ăn uống: không còn mục nguyên liệu thích; chỉ lưu nhóm và nguyên liệu không ăn.
- Người thực hiện: Claude.
- Bàn giao thực tế: Commit a65e5fc đã push lên origin/fix/meal-preview-photos; tạo PR #46 https://github.com/WDP-FA26/vedora-mobile/pull/46 vào main với tiêu đề/mô tả tiếng Anh. Chưa merge. Người thực hiện: Codex.

## 2026-11-24 — Đồng bộ code mới nhất từ GitHub

- Kết quả đã làm: Fetch origin, chuyển sang main và fast-forward tới 49eaddd (PR #48). Giữ nguyên ba báo cáo chưa theo dõi; sao lưu PLAN bằng stash codex-before-sync-20261124, khôi phục và giữ cả nhật ký local/upstream sau xung đột. HEAD trùng origin/main; không tạo commit hoặc push. Lint đạt. TypeScript báo 5 lỗi do kiểu route hiện tại chưa nhận /meal-log; chưa sửa code trong task đồng bộ.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Khởi động lại app và đăng nhập. (2) Mở Tôi → Hồ sơ ăn uống → Cơ thể & BMI, kiểm tra biểu mẫu và dữ liệu. (3) Mở Thực đơn → Nhật ký ăn uống, chọn ngày và kiểm tra danh sách món. (4) Quay lại bảng tin và hồ sơ, kiểm tra các màn mở bình thường.
- Người thực hiện: Codex.
## 2026-11-24 — Đối chiếu BE và web để lập backlog mobile

- Kết quả đã làm: Đọc bản main mới tải của vedora-api (3dfa56e), vedora-frontend (cbc0b27) và mobile (49eaddd). Rà soát controller/DTO BE, service/schema/UI web và các luồng tương ứng mobile. Ưu tiên P0: cập nhật AI thực đơn từ đề xuất/nháp sang thay đổi đã lưu trực tiếp, refresh cache theo tool output; cập nhật trạng thái kiểm duyệt bài/Blog và dữ liệu lý do vi phạm. Backlog P1: đi chợ; ghi chú dị ứng/sở thích; hỗ trợ/khiếu nại và thông báo ticket/bình luận; feed Dành cho bạn/Đang theo dõi; tạo bài chỉ chữ/nhiều video và sửa bài; sửa nhật ký, nhờ AI nhận xét tuần; nutrition companion và rewind AI. Backlog P2: khám phá nhà hàng/menu/tìm món/đánh giá; workspace, chuyển danh tính và quản lý nhà hàng; thống kê bài viết; upload video Blog và đồng bộ ảnh bìa lấy từ ảnh đầu nội dung. P3: chọn theme Sáng/Tối/Hệ thống; cân nhắc UI riêng cho API tóm tắt bài (BE đã có, chưa thấy web dùng endpoint riêng). Đã xác nhận nhiều mục trong báo cáo cũ đã có: xóa bài/Blog, sao công thức, xác minh chuyên gia, đăng lại, chia sẻ qua chat, BMI, nhật ký cơ bản và lịch sử AI. Style tham chiếu: nền #fafbf8, card #fffefa, xanh #255d32, dark #0f1a12/#17251a, Source Sans 3/Be Vietnam Pro; mobile đã có token/font tương ứng. Không sửa source ứng dụng. Lint và TypeScript đều đạt trong lần rà soát này; chưa chạy UI hoặc API thật.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Trên web mở Thực đơn, yêu cầu AI đổi món và quan sát lịch cập nhật ngay; đối chiếu mobile, kiểm tra hỏi lựa chọn/tìm web/hoàn tác. (2) Mở bài/Blog đang xử lý, bị từ chối hoặc bị gỡ; xem lý do, bằng chứng và nút khiếu nại. (3) Mở Hỗ trợ, tạo ticket có ảnh, trả lời, rút ticket và mở từ thông báo. (4) Mở Đi chợ, chọn ngày và đối chiếu tổng nguyên liệu từ thực đơn đã lưu. (5) Mở Hồ sơ ăn uống, kiểm tra ghi chú dị ứng/sở thích; mở nhật ký, sửa món và nhờ AI nhận xét tuần. (6) Trên bảng tin thử Dành cho bạn/Đang theo dõi, đăng chỉ chữ/nhiều video, sửa bài và báo cáo bình luận. (7) Mở Nhà hàng, tìm món, xem menu/đánh giá/chỉ đường; mở Trang của tôi, kiểm tra hồ sơ nhà hàng, thành viên, chuyển danh tính và quản lý menu. (8) Mở Thống kê, lọc thời gian; mở Blog thử upload video và ảnh bìa; kiểm tra theme sáng/tối/hệ thống. Các bước là checklist nghiệm thu cho backlog, không khẳng định mobile đã có các màn còn thiếu.
- Người thực hiện: Codex.

## 2026-11-24 — Xử lý P0: AI lưu thực đơn trực tiếp và trạng thái kiểm duyệt

- Kết quả đã làm: Đồng bộ chat thực đơn với BE hiện tại: nhận kết quả đã lưu của fillSlots/editPlan/autoBalancePlan/verifyMealPlanAllergies; làm mới lịch ngay khi tool lưu và khi stream kết thúc hoặc lỗi; bỏ bản nháp, bước lưu thủ công và endpoint /meal-plan/draft cũ. Lịch chỉ hiển thị dữ liệu đã lưu từ server; chat có nút xem tuần đã cập nhật. Giữ phản hồi dở khi mất kết nối, không tự gửi lại thao tác có thể đã lưu, bỏ phản hồi đến muộn từ phiên khác; khôi phục lịch sử với tool output và gửi requestId theo lượt. Bài/Blog nhận đủ DRAFT, PROCESSING, PUBLISHED, FAILED, PENDING_REVIEW, REJECTED, REMOVED; hiển thị trạng thái, lý do và bằng chứng dạng văn bản kèm thời điểm video. Blog đang xử lý/chờ duyệt tự cập nhật, không báo lỗi schema sau khi lưu; không ghi đè phần đang soạn khi polling. Khóa sửa/xóa khi bài bị gỡ hoặc có khiếu nại đang mở; ẩn tương tác công khai cho bài chưa đăng. Giữ token/font/theme hiện có, không thêm thư viện. Chưa commit/push.
- Kiểm tra kỹ thuật: Lint và TypeScript đạt; 27/27 kiểm thử liên quan đạt. Toàn bộ bộ test đạt 102/107; 5 lỗi còn lại được tái hiện trên HEAD gốc: 1 fixture billing thiếu trường mới, 3 test hồ sơ ăn uống còn kỳ vọng nguyên liệu yêu thích đã bỏ, 1 test returnTo công thức còn kỳ vọng route cũ. Chưa thao tác trên thiết bị hoặc gọi AI/API thật. Các mục P1 như thẻ câu hỏi AI, xin quyền tìm web, rewind và tạo khiếu nại chưa thuộc lần sửa này.
- Các bước kiểm tra luồng UI trên màn hình (checklist nghiệm thu, chưa thực hiện):
  1. Đăng nhập → Thực đơn → nhờ AI lên thực đơn cho tuần được phép; đọc thông báo lưu trực tiếp trước khi gửi.
  2. Chờ AI trả lời → nhấn “Đã lưu · Xem thực đơn” → kiểm tra món xuất hiện ngay, không cần nút lưu/xóa nháp; đóng mở app để xác nhận dữ liệu còn trên lịch.
  3. Chọn một món → yêu cầu đổi riêng bữa đó; kiểm tra bữa khác giữ nguyên. Thử tuần kế tiếp khi được phép và kiểm tra đúng tuần được cập nhật.
  4. Ngắt mạng sau khi AI bắt đầu lưu → kiểm tra cảnh báo thay đổi có thể đã lưu, phản hồi dở còn nguyên; bật mạng → mở lại lịch và lịch sử chat để xác nhận trước khi gửi yêu cầu tiếp, không có lượt tự gửi trùng.
  5. Mở lại một cuộc trò chuyện cũ → kiểm tra trace và tuần đã lưu; cuộc trò chuyện dùng tool nháp cũ không xuất hiện như một thay đổi vừa lưu. Đăng xuất trong lúc đang tải lịch sử → đăng nhập tài khoản khác, kiểm tra dữ liệu phiên trước không xuất hiện.
  6. Tôi → Blog của tôi → tạo Blog và bấm Đăng; với phản hồi PROCESSING/PENDING_REVIEW, kiểm tra thông báo đã lưu và trạng thái tự cập nhật, không báo lưu thất bại. Gõ thêm nội dung khi đang chờ → kiểm tra nội dung đang soạn không bị polling thay thế.
  7. Mở bài/Blog bị từ chối → đọc lý do, đoạn bị đánh dấu và thời điểm video; kiểm tra bằng chứng hiển thị như chữ, kể cả có ký tự HTML. Với Blog không bị khóa, sửa rồi gửi duyệt lại hoặc chuyển về nháp.
  8. Mở bài bị gỡ hoặc đang có khiếu nại → kiểm tra lý do/trạng thái, không sửa/xóa được; kiểm tra bài chưa công khai không có nút thích, đăng lại, lưu, chia sẻ hoặc bình luận. Thử cả theme sáng/tối và cỡ chữ lớn.
- Người thực hiện: Codex.

## 2026-11-24 — Bàn giao thay đổi thực đơn và kiểm duyệt nội dung

- Kết quả đã làm: Tạo branch feat/meal-planner-and-content-moderation từ main 49eaddd để commit, push và tạo PR vào main theo yêu cầu. Tiêu đề commit/PR và mô tả PR dùng tiếng Anh. Chỉ đưa source, test và nhật ký P0/bàn giao vào commit; giữ các báo cáo và nhật ký local cũ ngoài commit.
- Bàn giao thực tế: Đã commit c7a63fb, push branch lên origin và tạo PR #49 https://github.com/WDP-FA26/vedora-mobile/pull/49 vào main; chưa merge.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở PR trên GitHub, kiểm tra base main và head feat/meal-planner-and-content-moderation. (2) Mở Files changed, kiểm tra các thay đổi thực đơn, trạng thái bài/Blog và test. (3) Chạy app từ branch PR và thực hiện checklist P0 bên trên.
- Người thực hiện: Codex.

## 2026-11-24 — Cập nhật BE/web và rà lại phần mobile chưa hoàn thiện sau P0

- Kết quả đã làm: Fetch và fast-forward hai repo tham chiếu trong thư mục tạm: BE từ 3dfa56e lên 77eb2aa, web từ cbc0b27 lên 173ced4. Fetch mobile xác nhận origin/main eb0c5eb đã merge PR #49, gồm P0 c7a63fb đang có trong workspace. Không đổi branch hoặc source mobile. BE mới chủ yếu đổi model/provider/prompt, SDK OpenRouter, transcription và cấu trúc test; thay đổi DTO analytics chỉ đổi import, chưa thấy hợp đồng nghiệp vụ được rà soát phát sinh yêu cầu sửa P0. Web mới thêm lịch sử hệ thống cho admin, không tính thành tính năng mobile bắt buộc.
- Phần mobile còn thiếu đã đối chiếu: (1) Hiển thị question/options từ askUser, xin quyền tìm web và truyền allowWebSearch, rewind hội thoại/thực đơn. (2) Hồ sơ ăn uống chưa đọc/sửa allergyNote/preferenceNote. (3) Chưa có danh sách đi chợ từ thực đơn đã lưu. (4) Chưa có hỗ trợ/khiếu nại, ảnh đính kèm, trả lời/rút ticket; notificationSchema chưa nhận ticketId và thông báo ticket/báo cáo bình luận chưa có nội dung/điều hướng riêng. (5) Nhật ký chưa có sửa món đã ghi, nút nhờ trợ lý nhận xét tuần; lịch thiếu nutrition companion. (6) Feed vẫn gọi /posts, chưa có /posts/feed và /posts/following cho Dành cho bạn/Đang theo dõi. (7) Chưa tạo bài chỉ chữ/nhiều video, sửa bài đã đăng và báo cáo bình luận. (8) Blog còn UI ảnh bìa riêng trong khi BE lấy ảnh đầu nội dung; chưa upload video Blog. (9) Chưa khám phá nhà hàng/menu/tìm món/đánh giá, workspace/chuyển danh tính/quản lý nhà hàng và thống kê bài viết. (10) Chưa có chọn theme trong app; API tóm tắt bài riêng là tùy chọn cần chốt nhu cầu. Các API cho phần lớn mục trên đã có BE; đây là khoảng thiếu mobile, không khẳng định BE chưa triển khai.
- Giới hạn rà soát: Đọc diff, controller/DTO/service và caller mobile/web; tìm chưa thấy TODO/FIXME/NotImplemented rõ ràng trong src BE nhưng không dùng kết quả đó để kết luận BE đã hoàn thiện. Chưa chạy BE/DB, chưa kiểm thử API production hoặc UI thiết bị. Chưa commit/push lần rà soát này.
- Các bước kiểm tra luồng UI trên màn hình (checklist backlog, chưa thực hiện): (1) Trên web yêu cầu đổi món để xem câu hỏi/lựa chọn, quyền tìm web và hoàn tác; đối chiếu mobile chỉ hiện trace. (2) Mở hồ sơ ăn uống, kiểm tra ghi chú dị ứng/khẩu vị; mở Đi chợ trên web để đối chiếu nhóm nguyên liệu. (3) Mở một bài bị từ chối trên mobile, kiểm tra lý do đã có; đối chiếu web để tạo khiếu nại, nhận trả lời và mở ticket từ thông báo. (4) Nhật ký: đối chiếu sửa món và nhận xét tuần; kiểm tra thanh dinh dưỡng trên lịch web. (5) Feed: đối chiếu hai tab nguồn bài, tạo chỉ chữ/nhiều video, sửa bài và báo cáo bình luận. (6) Blog: thêm ảnh bìa riêng rồi lưu để kiểm tra BE lấy ảnh đầu nội dung; đối chiếu upload video. (7) Kiểm tra nhà hàng, workspace và thống kê trên web trước khi thiết kế các màn mobile còn thiếu. Checklist không khẳng định các màn chưa làm đã có trên mobile.
- Người thực hiện: Codex.

## 2026-11-24 — Chat thực đơn: lựa chọn, quyền tìm web và hoàn tác

- Kết quả đã làm: Hiển thị câu hỏi/lựa chọn từ askUser, hỗ trợ chọn một, chọn nhiều rồi Gửi lựa chọn, hoặc tự gõ câu trả lời. Chỉ yêu cầu cuối của lượt mới nhất được trả lời, khóa khi đang gửi. Lưu câu trả lời/quyết định lên đúng message ID do BE lưu để mở lại lịch sử vẫn thấy kết quả, không tạo bản sao tin nhắn; từ chối thao tác nếu server đã có lượt mới hơn. Giữ câu hỏi và ID món đã tìm trong context của lượt tiếp theo. Tìm web mặc định chưa được cho phép; thẻ hiển thị lý do và phạm vi cuộc trò chuyện, cho phép hoặc tiếp tục không dùng web; request gửi allowWebSearch rõ ràng, mở cuộc trò chuyện mới mặc định tắt. Tự gõ qua yêu cầu xin phép không được xem là đồng ý. Thêm Hoàn tác từ đây ở tin nhắn người dùng, hộp xác nhận tác động lên lịch/lịch sử và việc thay nội dung đang nhập; gọi API rewind, cắt hội thoại sau khi thành công, đưa tin nhắn về ô nhập, làm mới lịch mọi tuần và cả cache lịch sử gần nhất/danh sách. Báo ngày đã qua giữ nguyên và món không khôi phục được; lỗi/404 không tự xóa lịch sử local, không tự thử lại thao tác ghi. Quyết định nằm trước tin nhắn đã hoàn tác không tự cấp lại quyền khi người dùng tự gõ. Không thêm thư viện, chưa commit/push.
- Kiểm tra kỹ thuật: 22/22 test meal-weeks/planner-trace đạt, gồm parser, service, context, state và cây render câu hỏi/quyền/dialog. Toàn bộ bộ test 114/119 đạt, còn đúng 5 lỗi cũ đã xác nhận từ task P0 (billing, dietary-profile và returnTo công thức). Lint và TypeScript đạt. Export web đạt; Expo có cảnh báo tự thoát sau khi xuất xong. Chưa chạy các luồng với BE thật hoặc UI trên thiết bị.
- Các bước kiểm tra luồng UI trên màn hình (checklist nghiệm thu, chưa thực hiện):
  1. Đăng nhập với BE mới, mở tab trợ lý → cuộc trò chuyện mới. Kiểm tra dòng dưới ô nhập ghi Tìm web chưa cho phép.
  2. Gửi “Tui muốn đổi bữa tối. Hãy hỏi tui bằng các lựa chọn trước khi thay đổi thực đơn.” Khi BE gọi askUser, kiểm tra câu hỏi và các lựa chọn hiện thành nút. Chọn một → lựa chọn thành tin nhắn, thẻ cũ khóa, trợ lý tiếp tục; lịch chỉ đổi khi BE lưu. Bấm nhanh hai lần không có lượt gửi trùng.
  3. Yêu cầu “Cho tui chọn nhiều ngày cần đổi món bằng các lựa chọn.” Với câu hỏi multiple, chọn hai mục → bỏ chọn một → chọn lại → Gửi lựa chọn. Kiểm tra chưa chọn thì nút gửi bị khóa. Thử nhập câu trả lời riêng thay vì bấm nút; mở lại lịch sử phải thấy câu đã trả lời, không xuất hiện thêm bản sao trợ lý. Việc BE có phát sinh thẻ hay không phụ thuộc tool call, không phải mọi câu trả lời dạng chữ đều được chuyển thành thẻ.
  4. Trong cuộc trò chuyện mới, gửi “Tui cần tra cứu thông tin món chay mới trên web, hãy xin phép tui trước khi tìm.” Khi requestWebSearch xuất hiện, kiểm tra lý do và phạm vi quyền; bấm Tiếp tục không dùng web → dòng trạng thái vẫn chưa cho phép. Thử lại ở cuộc trò chuyện mới rồi chọn Cho phép tìm web → trạng thái đã cho phép, trợ lý tiếp tục; gửi lượt khác và mở lại lịch sử để kiểm tra quyền giữ trong cuộc trò chuyện đó. Tạo cuộc trò chuyện mới phải trở lại chưa cho phép.
  5. Ở một thẻ xin phép, nhập câu hỏi khác thay vì đồng ý → kiểm tra không tự bật quyền tìm web. Trong lúc trợ lý đang trả lời, kiểm tra các thẻ cũ và nút hoàn tác đều khóa.
  6. Tạo một yêu cầu đổi món cho ngày còn sửa được; xem và ghi nhớ lịch trước/sau. Quay lại chat → Hoàn tác từ đây ở tin nhắn đó → đọc hộp xác nhận → Hủy: hội thoại/lịch giữ nguyên. Mở lại và Xác nhận hoàn tác: tin nhắn đó cùng các tin sau biến mất, nội dung được đưa vào ô nhập, lịch trở về dữ liệu BE khôi phục. Mở lại lịch sử và tab Thực đơn để đối chiếu.
  7. Nếu hoàn tác có ngày đã qua hoặc món đã xóa/đang cần kiêng, kiểm tra thông báo phần bỏ qua, không khẳng định khôi phục toàn bộ. Hoàn tác từ tin nhắn đồng ý tìm web → kiểm tra quyền quay về chưa cho phép nếu không còn quyết định đồng ý trước đó; tự gõ lượt khác không tự cấp lại quyền.
  8. Tắt mạng khi trả lời thẻ: không mất nội dung đang nhập, không có lượt tự gửi lại. Tắt mạng lúc hoàn tác: hiện cảnh báo chưa xác nhận kết quả, không tự xóa hội thoại; bật mạng, mở lại lịch sử/lịch trước khi thử lại. Đăng xuất trong khi đang chờ phản hồi → đăng nhập tài khoản khác, dữ liệu trả muộn không được đưa vào phiên mới.
  9. Thử màn hình nhỏ, chữ lớn và theme sáng/tối: câu hỏi/lựa chọn dài xuống dòng, nút chạm được, hộp xác nhận cuộn được và nút Hủy luôn dùng được khi không đang hoàn tác.
- Người thực hiện: Codex.

## 2026-11-24 — Bàn giao tương tác chat thực đơn

- Kết quả đã làm: Tạo branch feat/meal-planner-interactions từ origin/main eb0c5eb để commit, push và tạo PR cho lựa chọn trong chat, quyền tìm web và hoàn tác. Tên branch, tiêu đề commit/PR và mô tả PR bằng tiếng Anh. Đưa source, test và riêng nhật ký tính năng/bàn giao vào commit, giữ báo cáo và nhật ký local cũ ngoài commit.
- Bàn giao thực tế: Đã commit 5277dc2, push branch lên origin và tạo PR #50 https://github.com/WDP-FA26/vedora-mobile/pull/50 vào main; chưa merge.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở PR trên GitHub, kiểm tra base main và head feat/meal-planner-interactions. (2) Mở Files changed, kiểm tra phần chat thực đơn và checklist nghiệm thu. (3) Chạy app từ branch PR, thực hiện lần lượt các bước lựa chọn, quyền tìm web và hoàn tác ở mục trên.
- Người thực hiện: Codex.

## 2026-11-24 — Bàn giao trải nghiệm chat thực đơn

- Bàn giao thực tế: Đã commit c45470f, push branch feat/meal-planner-chat-experience và tạo PR #51 https://github.com/WDP-FA26/vedora-mobile/pull/51 vào main; chưa merge.
- Kết quả đã làm: Tạo branch feat/meal-planner-chat-experience từ origin/main 867b292 sau khi PR tương tác chat trước đã được merge. Đóng gói phân loại lỗi stream/HTTP, thao tác quay lại bằng nhấn giữ/vuốt, popup xác nhận, thẻ đã lưu có sticker và chờ kết thúc câu trả lời, cùng bố cục hai lề cân đối. Kiểm tra trước khi commit phát hiện trợ lý bài viết cũng dùng chung bộ đọc stream; đã bổ sung xử lý mã MODEL_ERROR/RATE_LIMITED để giữ đúng thông báo lỗi cũ. Tên branch, commit và PR dùng tiếng Anh theo yêu cầu. Chỉ đưa source, test và nhật ký của các thay đổi này vào commit; giữ báo cáo/nhật ký local cũ ngoài PR.
- Kiểm tra kỹ thuật: Lint, TypeScript và 33/33 kiểm thử liên quan đạt, gồm hồi quy thông báo lỗi trợ lý bài viết. Bản render web đã kiểm tra hình học hai lề tại 320/390/1024 điểm trong theme sáng/tối; chưa thử chat có phiên thật hoặc cử chỉ trên thiết bị.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện trên thiết bị): (1) Mở PR trên GitHub, kiểm tra branch đích main và branch nguồn feat/meal-planner-chat-experience. (2) Chạy app từ branch mới, kiểm tra hai lề khung trả lời/thẻ thực đơn thẳng với ô nhập. (3) Nhấn giữ tin nhắn hoặc vuốt ngang rồi nhấn icon để mở popup quay lại; thử Hủy rồi xác nhận. (4) Yêu cầu đổi món, kiểm tra thẻ có sticker chỉ xuất hiện sau khi kết thúc lượt trả lời và mở đúng tuần. (5) Khi xảy ra lỗi, kiểm tra thông báo phân biệt mã lỗi với gián đoạn kết nối; thử trợ lý bài viết để kiểm tra thông báo lỗi vẫn phù hợp.
- Người thực hiện: Codex.

## 2026-11-24 — Chờ kết thúc trả lời mới hiện thẻ đã lưu

- Kết quả đã làm: Ẩn thẻ “Đã lưu thay đổi” trong lúc lượt trả lời đang stream; khi lượt trả lời kết thúc mới hiện các tuần đã được backend xác nhận lưu. Chỉ điều chỉnh hiển thị, vẫn làm mới thực đơn ngay khi backend lưu thành công. Thẻ ở lịch sử/lượt trước không bị ẩn khi gửi lượt mới. Nếu stream lỗi sau khi đã lưu, thẻ vẫn xuất hiện khi stream dừng để người dùng kiểm tra kết quả đã lưu cùng cảnh báo lỗi.
- Kiểm tra kỹ thuật: 21/21 kiểm thử hồi quy meal-weeks đạt; lint và TypeScript đạt. Chưa kiểm tra luồng chat thật trên thiết bị.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở chat thực đơn, gửi yêu cầu thêm hoặc đổi món. (2) Trong khi trợ lý đang viết, kiểm tra thẻ “Đã lưu thay đổi” của lượt này chưa xuất hiện. (3) Chờ câu trả lời kết thúc, kiểm tra thẻ xuất hiện dưới câu trả lời và mở đúng tuần khi chạm “Xem thực đơn”. (4) Gửi thêm một yêu cầu, kiểm tra thẻ của lượt cũ vẫn còn. (5) Mở lại lịch sử, kiểm tra các thẻ đã lưu hiển thị bình thường. (6) Nếu mất kết nối sau khi đã lưu thành công, kiểm tra phản hồi dở/cảnh báo vẫn còn và thẻ đã lưu có thể mở để xem kết quả.
- Người thực hiện: Codex.

## 2026-11-24 — Bỏ khoảng trống avatar bên trái nội dung

- Kết quả đã làm: Điều chỉnh theo phản hồi người dùng: cần chính khung trả lời/thẻ thực đơn có hai lề bằng nhau, không tính avatar là phần lề. Đưa avatar và tên trợ lý lên một hàng phía trên câu trả lời; bỏ cột trống 42 điểm bên trái. Xóa phần thụt lề cũ của gợi ý, trạng thái, thông báo lỗi, thẻ đề xuất và ảnh của trợ lý tại các màn hình dùng chung. Khung trả lời và thẻ đã lưu giờ thẳng cả hai mép với ô nhập, cách đều hai viền của vùng chat; tin nhắn người dùng vẫn canh phải.
- Kiểm tra kỹ thuật: Lint và TypeScript đạt; 29/29 kiểm thử chat-markdown/meal-weeks đạt. Đo component thật qua React Native Web trong Chrome xác nhận cả mép trái và mép phải khung trả lời/thẻ thực đơn trùng với ô nhập tại 320/390/1024 điểm, theme sáng/tối (6/6 trường hợp). Đã xem ảnh render; fixture dùng font dự phòng và thay lớp image/symbol cho web, chưa thử trên thiết bị thật.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện trên thiết bị): (1) Reload và mở tab Trợ lý Vedora. (2) Kiểm tra avatar và tên ở trên khung trả lời; không còn dải trống bên trái khung. (3) Kiểm tra khoảng cách từ khung trả lời và thẻ đã lưu đến hai viền màn hình đều nhau và thẳng hàng với ô nhập. (4) Thử câu trả lời ngắn/dài, câu hỏi có lựa chọn, bảng và trạng thái đang xử lý; tất cả cùng lề trái mới. (5) Thử màn hình nhỏ/rộng và theme sáng/tối; tin nhắn của bạn vẫn canh phải, thao tác quay lại vẫn hoạt động. (6) Mở trợ lý dành cho khách và trợ lý bài viết để kiểm tra các gợi ý/thẻ/ảnh không còn thụt lề cũ.
- Người thực hiện: Codex.

## 2026-11-24 — Cân đối lề khung chat

- Kết quả đã làm: Bỏ giới hạn 86% của cột trả lời khi đã có khoảng avatar cố định, cho nội dung trợ lý và các thẻ bên dưới giãn hết chiều rộng còn lại. Mép phải câu trả lời, thẻ đã lưu và tin nhắn người dùng cùng bám lề nội dung; avatar vẫn được giữ ở bên trái. Giữ tin nhắn người dùng ngắn ôm nội dung. Đồng bộ giới hạn chiều rộng ô nhập và lời nhắc với phần lịch sử trên màn hình rộng để không bị lệch 16 điểm mỗi bên. Áp dụng tại component chat dùng chung.
- Kiểm tra kỹ thuật: Lint và TypeScript đạt; 29/29 kiểm thử chat-markdown/meal-weeks đạt. Kiểm tra hình học của component thật render bằng React Native Web trong Chrome đạt cả 6 trường hợp: rộng 320/390/1024 điểm với theme sáng/tối; lề ngoài bằng nhau, mép phải ô nhập/câu trả lời/thẻ thực đơn/tin người dùng trùng nhau, tin ngắn vẫn gọn. Fixture dùng dữ liệu mẫu và thay thế lớp image/symbol bằng bản web; lưu kết quả tạm trong .expo/chat-layout-preview. Chưa kiểm tra trên thiết bị thật.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở tab Trợ lý Vedora có câu trả lời dài và thẻ thực đơn đã lưu. (2) Kiểm tra avatar và tin nhắn người dùng cách mép màn hình cùng một khoảng; mép phải câu trả lời và thẻ đã lưu thẳng với mép phải tin nhắn người dùng. (3) Gửi tin ngắn rồi tin dài để kiểm tra tin người dùng vẫn gọn và nội dung không tràn ngang. (4) Mở màn hình rộng hoặc xoay ngang, kiểm tra ô nhập nằm giữa và thẳng với hai mép vùng lịch sử. (5) Thử câu trả lời có bảng, chữ lớn và theme sáng/tối; bảng vẫn cuộn ngang trong khung riêng. (6) Vuốt tin nhắn để hiện icon quay lại, kiểm tra icon vẫn nằm bên phải và không che chữ.
- Người thực hiện: Codex.

## 2026-11-24 — Thẻ xác nhận lưu thực đơn thân thiện

- Kết quả đã làm: Thay dòng nút “Đã lưu · Xem thực đơn” bằng thẻ bo góc có sticker cà chua Vedora, dấu tích xác nhận, nội dung “Đã lưu thay đổi” và khoảng ngày của tuần. Tách phần “Xem thực đơn” kèm mũi tên thành hàng hành động cao tối thiểu 48 điểm; toàn bộ thẻ có thể chạm. Dùng màu theme sáng/tối, cho chữ và ngày xuống dòng, giữ nhãn trợ năng đầy đủ. Tuần không thuộc khoảng xem hiện tại hiển thị lý do và khóa thao tác. Dùng sticker sẵn có; giữ điều kiện chỉ hiện sau khi backend xác nhận đã lưu và mở đúng tuần như trước.
- Kiểm tra kỹ thuật: Lint và TypeScript đạt; 21/21 kiểm thử hồi quy meal-weeks đạt. Chưa kiểm tra bố cục mới và điều hướng trên thiết bị thật.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở chat thực đơn, yêu cầu thêm hoặc đổi một món và chờ lưu thành công. (2) Kiểm tra thẻ dưới câu trả lời có sticker cà chua, dấu tích, dòng “Đã lưu thay đổi” và ngày đúng tuần vừa cập nhật. (3) Nhấn vào thẻ hoặc hàng “Xem thực đơn”, kiểm tra mở tab Thực đơn ở đúng tuần. (4) Mở lại lịch sử có tuần ngoài khoảng xem hiện tại: thẻ vẫn báo đã lưu, nhưng hiện lý do không xem được và không điều hướng khi chạm. (5) Thử theme sáng/tối, màn hình nhỏ, chữ lớn và trình đọc màn hình: nội dung không bị cắt, nút dễ chạm và đọc được ngày của tuần.
- Người thực hiện: Codex.

## 2026-11-24 — Icon bên phải và popup quay lại yêu cầu

- Kết quả đã làm: Cập nhật tương tác quay lại theo yêu cầu mới: vuốt ngang hiện icon bên phải, tin nhắn dịch trái để chừa khoảng cách với icon mà không đổi chiều cao hàng. Nhấn giữ mở thẳng popup xác nhận có tiêu đề “Quay lại yêu cầu trước đó”; thao tác trợ năng mở cùng popup. Chỉ gọi xử lý quay lại sau khi xác nhận trong popup; chọn Hủy giữ nguyên cuộc trò chuyện. Mở lịch sử cũng đóng icon đang hiện.
- Kiểm tra kỹ thuật: 21/21 kiểm thử meal-weeks đạt; lint và TypeScript đạt. Đã kiểm tra logic vuốt chỉ hiện icon, nhấn giữ/trợ năng mở xác nhận, khóa lúc bận và hủy không ghi dữ liệu. Chưa thử cử chỉ/bố cục trên thiết bị thật.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở chat thực đơn có tin nhắn của bạn. (2) Vuốt ngang một tin nhắn ngắn rồi một tin dài: icon xuất hiện bên phải, không che chữ và lịch sử không tự nhảy xuống cuối. (3) Nhấn icon để mở popup “Quay lại yêu cầu trước đó”, chọn Hủy để giữ lịch sử. (4) Nhấn giữ tin nhắn khác: popup mở trực tiếp; kiểm tra nội dung cảnh báo rồi chọn Quay lại để đưa yêu cầu về ô nhập sau khi máy chủ xử lý thành công. (5) Thử cuộn dọc, mở lịch sử và lúc trợ lý đang bận để kiểm tra icon được ẩn hoặc khóa. (6) Bật trình đọc màn hình và dùng hành động “Quay lại yêu cầu trước đó”.
- Người thực hiện: Codex.

## 2026-11-24 — Hiện icon quay lại bằng cử chỉ

- Kết quả đã làm: Ẩn nút chữ dưới tin nhắn. Nhấn giữ 400 ms hoặc vuốt ngang ít nhất 40 điểm trên tin nhắn của người dùng để hiện icon quay lại hình tròn. Chỉ mở một icon mỗi lần; ẩn khi chạm tin nhắn, cuộn dọc, nhập nội dung hoặc mở hộp xác nhận. Không kích hoạt bằng cuộn dọc và không tự quay lại khi vuốt; phải nhấn icon rồi xác nhận. Khóa thao tác lúc trợ lý đang bận, giới hạn theo cuộc trò chuyện và thêm hành động cho trình đọc màn hình. Dùng API có sẵn, không thêm thư viện.
- Kiểm tra kỹ thuật: 21/21 kiểm thử meal-weeks đạt, gồm nhấn giữ, vuốt ngang hai hướng, bỏ qua vuốt ngắn/cuộn dọc, thao tác trợ năng và khóa khi bận. Lint và TypeScript đạt. Chưa kiểm tra cử chỉ trên thiết bị thật.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở chat có tin nhắn của bạn và kiểm tra mặc định không hiện nút quay lại. (2) Nhấn giữ một tin nhắn để hiện icon bên trái; nhấn tin nhắn để ẩn. (3) Vuốt ngang tin nhắn sang trái hoặc phải để hiện icon; cuộn dọc để kiểm tra lịch sử vẫn cuộn và icon được ẩn. (4) Nhấn icon, kiểm tra hộp xác nhận; chọn Hủy để giữ lịch sử hoặc Quay lại để đưa tin nhắn về ô nhập. (5) Nhấn giữ tin khác để kiểm tra chỉ có một icon; khi trợ lý đang trả lời, kiểm tra không mở được thao tác quay lại. (6) Bật trình đọc màn hình, chọn tin nhắn rồi dùng hành động “Hiện nút quay lại”.
- Người thực hiện: Codex.

## 2026-11-24 — Đổi nhãn quay lại trong chat

- Kết quả đã làm: Đổi nút “Hoàn tác từ đây” thành “Quay lại”; đồng bộ nhãn trợ năng, tiêu đề xác nhận, nút xác nhận và trạng thái đang xử lý theo cách gọi “quay lại”. Giữ nguyên hành vi quay về tin nhắn đã chọn.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Mở chat thực đơn có lịch sử. (2) Kiểm tra bên dưới tin nhắn của bạn hiện nút “Quay lại”. (3) Nhấn nút, kiểm tra hộp xác nhận hiển thị “Quay lại tin nhắn này?” và nút “Quay lại”. (4) Nhấn Hủy để giữ lịch sử; mở lại và xác nhận để kiểm tra tin nhắn được đưa về ô nhập.
- Người thực hiện: Codex.

## 2026-11-24 — Phân biệt lỗi gửi chat với gián đoạn kết nối

- Kết quả đã làm: Người dùng báo lỗi hiện ngay khi gửi tin nhắn. Xác nhận thông báo dự phòng của chat thực đơn đang che cả lỗi HTTP và mã lỗi trong SSE. Chuẩn hóa MODEL_ERROR/RATE_LIMITED từ SSE thành ApiError có code; UI phân biệt lỗi model, quá tải, HTTP 400/422, 403, 503 và lỗi server khác thay vì luôn báo mất kết nối. Giữ cảnh báo thay đổi có thể đã lưu khi stream có tool sửa thực đơn; lỗi mạng chưa rõ kết quả vẫn giữ cảnh báo và không tự gửi lại. Không hiển thị message debug thô từ BE. GET endpoint công khai tại API URL cấu hình trả HTTP 200 từ máy phát triển, không dùng kết quả đó để kết luận endpoint chat đã hoạt động. Chưa có response/log của lượt lỗi tài khoản người dùng nên chưa xác nhận nguyên nhân BE thực tế; chưa sửa BE, chưa commit/push.
- Kiểm tra kỹ thuật: 23/23 kiểm thử ai-stream-errors/meal-weeks đạt, bao gồm lỗi model trong HTTP 200 SSE, giữ phản hồi dở, phân biệt lỗi HTTP và cảnh báo khi đã gọi tool ghi. Lint và TypeScript đạt. Chưa tái hiện lượt chat lỗi với phiên đăng nhập thật.
- Các bước kiểm tra luồng UI trên màn hình (đề nghị, chưa thực hiện): (1) Reload app với code mới rồi gửi một tin ngắn trong chat thực đơn. (2) Nếu lỗi xuất hiện ngay, đọc mã MODEL_ERROR/RATE_LIMITED hoặc HTTP trong thông báo và đối chiếu response/log BE của cùng lượt. (3) Với lỗi model/quá tải trước khi gọi tool ghi, kiểm tra không bị báo nhầm thành kết nối gián đoạn hoặc đã lưu thực đơn. (4) Ngắt mạng sau khi trợ lý bắt đầu đổi món, kiểm tra phản hồi dở còn nguyên, cảnh báo có thể đã lưu và không tự gửi lại; bật mạng và mở lịch/lịch sử để xác nhận kết quả.
- Người thực hiện: Codex.

## 2026-11-24 — Đối chiếu lại mobile với BE và web sau PR chat

- Kết quả đã làm: Rà BE origin/main 0e0fece, web origin/main 173ced4 với mobile branch feat/meal-planner-chat-experience c45470f (có phần chat PR #51). Thêm báo cáo [MOBILE_PARITY_REVIEW_2026-11-24.md](MOBILE_PARITY_REVIEW_2026-11-24.md), ghi 17 nhóm backlog kèm bằng chứng BE/web/mobile và thứ tự đề nghị. P1 gồm hỗ trợ/khiếu nại, thông báo ticket/bình luận, ghi chú dị ứng/khẩu vị, đi chợ, nguồn feed, bài chỉ chữ/nhiều video/nháp POST, sửa bài đã đăng, báo cáo bình luận và ảnh bìa Blog chưa đúng hợp đồng. P2 gồm sửa/nhận xét nhật ký, dữ liệu kcal/nhóm dưỡng chất và tổng hợp tuần, xem thực đơn tuần cũ, upload video Blog, thống kê và nhà hàng. Workspace và chọn theme là P3 theo phạm vi sản phẩm. Tách riêng rủi ro job upload qua đổi phiên, remount khi refresh token, thông báo tài khoản bị khóa và API BE-only chưa có caller web. Không sửa source mobile, không commit/push.
- Các mục đã loại khỏi danh sách thiếu: askUser/lựa chọn, quyền tìm web, quay lại yêu cầu, thẻ lưu sau khi stream kết thúc, trạng thái/lý do kiểm duyệt, đánh giá sao công thức, ghi nhận lượt xem, BMI/check-in cân nặng, nhật ký thêm/xóa/ước tính kcal, tương tác bình luận và Blog cơ bản. Không mặc định đưa các màn quản trị web vào mobile.
- Kiểm tra kỹ thuật: Lint và TypeScript đạt. Đối chiếu source/DTO/caller, chưa chạy BE/DB, API đăng nhập hoặc UI trên thiết bị; không dùng kết quả đọc code để kết luận production hoặc BE đã hoàn thiện.
- Các bước kiểm tra luồng UI trên màn hình (checklist đối chiếu, chưa thực hiện): (1) Mở hồ sơ ăn uống hai bên, lưu ghi chú dị ứng/khẩu vị trên web rồi đối chiếu mobile. (2) Lưu thực đơn, mở Đi chợ trên web và kiểm tra điểm vào còn thiếu ở mobile. (3) Từ bài bị xử lý, tạo khiếu nại/đính kèm/trả lời/rút ticket và mở từ thông báo trên web, đối chiếu mobile. (4) So Dành cho bạn/Đang theo dõi, bài chỉ chữ/nhiều video, nháp POST, sửa bài và báo cáo bình luận. (5) Trên mobile đổi ảnh bìa Blog riêng, lưu/mở lại và đối chiếu ảnh đầu nội dung; xem luồng upload video Blog trên web. (6) Ghi món rồi đối chiếu sửa/nhận xét tuần; mở công thức/lịch để so kcal, nhóm dưỡng chất và xem tuần thực đơn cũ. (7) Mở thống kê, nhà hàng/menu/đánh giá và quản lý Trang trên web để chốt màn mobile cần bổ sung theo vai trò. (8) Thử refresh phiên khi đang nhập, đổi tài khoản khi upload video và tài khoản bị khóa để xác nhận các rủi ro đọc từ source. Checklist chi tiết ở báo cáo, không khẳng định các màn chưa làm đã có trên mobile.
- Người thực hiện: Codex.
