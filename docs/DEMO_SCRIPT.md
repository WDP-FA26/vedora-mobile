# Kịch bản demo mobile Vedora — buổi bảo vệ 19/11/2026

Thời lượng: **~13 phút demo + Q&A**. Hai người, hai điện thoại, kể theo một câu chuyện: *một người ăn chay mở app → khai báo hồ sơ ăn uống → nhờ AI lên thực đơn → xem công thức → lướt cộng đồng, đăng video → nhắn tin với bạn → viết blog có AI hỗ trợ → nâng cấp gói.*

| Vai | Người | Máy | Tài khoản |
|---|---|---|---|
| **A** | Vy | Máy 1 (chiếu chính) | Tài khoản A |
| **B** | Hương | Máy 2 | Tài khoản B |

Phân phần theo người đã làm (theo commit):
- **Vy**: xác thực email + refresh token, feed/video lướt dọc, chi tiết bài/bình luận/thích, đăng video chạy nền, tìm kiếm, thông báo, nhắn tin realtime, Trợ lý Vedora (stream) + tạo thực đơn, trình soạn blog theo khối + trợ lý AI viết blog, gói v2 + SSE thanh toán.
- **Hương**: đăng nhập Google, hồ sơ + hồ sơ ăn uống + sở thích nguyên liệu, công thức + yêu thích, viết blog (nháp/đăng/Blog của tôi), gói dịch vụ + thanh toán SePay, trang thông tin Vedora.

---

## 0. Chuẩn bị (tối nay + 30 phút trước giờ bảo vệ)

**Tối nay**
- [ ] Build bản chạy ổn định trên cả 2 máy (development build / bản EAS), không phụ thuộc Metro nếu được.
- [ ] API + DB thật đang chạy (MongoDB replica set cho nhắn tin/thanh toán), bật môi trường thanh toán thử.
- [ ] Tài khoản A và B: có ảnh đại diện, vài bài/video, đã có hồ sơ ăn uống.
- [ ] **B theo dõi A, A chưa theo dõi B** (để demo "Tin nhắn từ người lạ" và "theo dõi lại để trả lời"). Xoá cuộc trò chuyện cũ A–B nếu có.
- [ ] Tạo sẵn **1 thực đơn** bằng trợ lý trên A (AI có thể chậm khi demo).
- [ ] Tạo sẵn **1 blog nháp** trên B, có ảnh bìa.
- [ ] Chuẩn bị **1 video ngắn (< 30 giây)** trong thư viện ảnh của A để đăng.
- [ ] **Quay màn hình dự phòng** từng phần (nếu mạng hỏng thì chiếu video).
- [ ] Ghi mật khẩu tài khoản demo ở chỗ riêng, **không** để lộ trên màn chiếu.

**30 phút trước**
- [ ] Cắm sạc, tắt thông báo hệ thống (Không làm phiền), độ sáng tối đa, cỡ chữ mặc định.
- [ ] Chiếu màn hình máy 1 (Android: `scrcpy`; iPhone: QuickTime qua cáp). Thử chiếu máy 2 nếu được.
- [ ] Cả 2 máy chung Wi-Fi ổn định / có 4G dự phòng.
- [ ] Mở sẵn app, đã đăng nhập, đứng ở tab Trang chủ. Kéo làm mới 1 lần để nạp dữ liệu.

---

## 1. Mở đầu — Vy (30 giây)

> "Phần mobile của Vedora làm bằng Expo/React Native, chạy được trên cả Android và iOS, dùng chung API với bản web. Nhóm mobile có hai người: em và Hương. Tụi em sẽ demo theo hành trình của một người dùng ăn chay."

Chỉ nhanh 5 tab dưới: **Trang chủ · Thực đơn của tôi · Trợ lý Vedora · Tin nhắn · Tôi**.

## 2. Đăng nhập và hồ sơ ăn uống — Hương, máy 2 (2 phút)

1. (Nếu thời gian cho phép) đăng xuất → màn Chào mừng → **Tiếp tục với Google** → vào thẳng Trang chủ.
   - *Dự phòng*: Google lỗi → đăng nhập email/mật khẩu; hoặc bỏ qua bước này, nói "tài khoản đã đăng nhập sẵn".
2. Tab **Tôi**: giới thiệu hồ sơ (ảnh, username, bài viết, Blog của tôi, mục Thích).
3. Mở **Hồ sơ ăn uống**: chế độ ăn, dị ứng, **sở thích nguyên liệu**. Sửa 1 mục → Lưu.
   > "Hồ sơ này là đầu vào cho trợ lý AI khi lên thực đơn."
4. Chạm biểu tượng cài đặt → **Thông tin Vedora** (giới thiệu, điều khoản…) — chỉ lướt 5 giây.

## 3. Trợ lý Vedora và thực đơn — Vy, máy 1 (2 phút)

1. Tab **Trợ lý Vedora**: hỏi câu ngắn, ví dụ *"Bữa sáng chay nhiều đạm cho người tập gym?"*.
   > "Câu trả lời được stream, chữ hiện dần như ChatGPT, có định dạng Markdown."
2. Bấm **Nhờ trợ lý lên thực đơn mới**, điền form ngắn → gửi. Trong lúc chờ, nói về hạn mức AI theo gói.
   - *Dự phòng*: AI chậm quá 20 giây → chuyển sang thực đơn tạo sẵn.
3. Tab **Thực đơn của tôi**: xem các bữa, ảnh món (chạm để phóng to) → **chạm vào món để mở công thức**.

## 4. Công thức và yêu thích — Hương, máy 2 (1 phút)

1. Ô tìm kiếm ở header → tab **Công thức** → gõ tên món (ví dụ "đậu hũ").
2. Mở 1 công thức: nguyên liệu, các bước → bấm **Lưu** (yêu thích).
3. Vào **Tôi → mục đã lưu** để thấy công thức vừa lưu.

## 5. Cộng đồng: feed, video, đăng bài — Vy, máy 1 (2,5 phút)

1. **Trang chủ**: tab Dành cho bạn / Đang theo dõi / Blog. Cuộn xuống: thanh tab tự ẩn.
2. Bài video: **chạm hai lần để thích** (tim bay giữa màn hình), mở bình luận, gửi 1 bình luận (ô nhập không bị bàn phím che).
3. Mở **Video**: lướt dọc kiểu reels — video kế tiếp phát ngay vì được tải trước.
4. **Đăng video**: ô "Chia sẻ cách nấu món chay của bạn" → chọn video chuẩn bị sẵn → nhập tiêu đề → Đăng → **thoát form, thanh tiến độ vẫn chạy ở trên**.
   > "Video tải lên Cloudinary theo từng phần, chạy nền, người dùng vẫn lướt app bình thường."
5. Chuông **Thông báo**: Hương thích/bình luận bài của Vy từ máy 2 trước đó để có thông báo mới.

## 6. Nhắn tin realtime hai máy — Vy + Hương (2 phút) ⭐ điểm nhấn

> Chiếu máy 1; Hương giơ máy 2 hoặc chiếu song song.

1. **Hương (B)**: mở hồ sơ A → **Nhắn tin** → gửi "Chào Vy, cho mình xin công thức đậu hũ sốt cà nha".
2. **Vy (A)**: tab **Tin nhắn** có huy hiệu chưa đọc → dòng **"Tin nhắn từ người lạ"** (vì A chưa theo dõi B) → mở → thấy **"Theo dõi lại để trả lời"**.
3. **Vy**: bấm theo dõi → ô nhập hiện → trả lời. Cuộc trò chuyện chuyển sang hộp thư chính ở cả hai máy.
4. **Hương** đang mở chat: tin tới trong 1–2 giây; **Vy** thấy **"Đã xem"**.
   > "Realtime dùng SSE, một luồng cho cả app; nếu luồng lỗi thì tự chuyển sang polling 5 giây. Mỗi tin có `clientMessageId` nên gửi lại khi mất mạng không bị trùng."

## 7. Blog và trợ lý AI viết blog — Hương rồi Vy (2 phút)

1. **Hương (máy 2)**: Tôi → **Blog của tôi** → mở bản nháp → sửa vài dòng (đậm, nghiêng, danh sách) → **Xem trước** → **Đăng blog** → bài hiện ở feed Blog.
2. **Vy (máy 1)**: Viết blog mới → mở **trợ lý AI**, yêu cầu *"Viết đoạn mở bài về lợi ích của ăn chay"* → xem khung đề xuất → **Chấp nhận** → nội dung chèn vào bài, đúng định dạng.
   - Nếu còn lượt ảnh: nhờ tạo ảnh minh hoạ (có khung skeleton khi đang tạo).
   > "Trình soạn theo khối, không lộ ký tự Markdown cho người dùng."

## 8. Gói dịch vụ và thanh toán — Hương, Vy bổ sung (1,5 phút)

1. **Hương**: Tôi → **Gói của bạn**: gói hiện tại, thẻ **Lượt dùng AI** (hai thanh đo), so sánh Miễn phí / Plus 49.000đ / Pro 99.000đ.
2. Chọn **Plus** → hộp xác nhận → màn **QR SePay** (ngân hàng, số tiền, nội dung chuyển khoản).
3. **Vy**: *(nếu có giao dịch thử được backend xác nhận)* màn tự chuyển sang **thành công** mà không cần bấm.
   > "Trạng thái thanh toán nhận qua SSE, dùng chung hook với nhắn tin."
   - *Không có giao dịch thử* → bấm **Hủy** giao dịch, nói cơ chế; **không** chuyển tiền thật.

## 9. Kết — Hương (30 giây)

> "Mobile đã đồng bộ gần như đầy đủ tính năng web: xác thực, cộng đồng, AI, thực đơn, công thức, nhắn tin realtime và thanh toán. Cảm ơn thầy/cô, tụi em sẵn sàng trả lời câu hỏi."

---

## Q&A có thể gặp

| Câu hỏi | Người trả lời | Ý chính |
|---|---|---|
| Stack mobile là gì? | Vy | Expo SDK 58, React Native 0.88, Expo Router (điều hướng theo file), TanStack Query (dữ liệu server), Zustand (state cục bộ), Zod (kiểm tra dữ liệu API), Axios, NativeWind. Cấu trúc theo module `src/features/*`. |
| Giữ phiên đăng nhập thế nào? | Vy | Access token ngắn hạn + refresh token lưu trong `expo-secure-store`; Axios tự làm mới token khi hết hạn, mở lại app vẫn còn phiên. |
| Realtime nhắn tin? | Vy | SSE `/messaging/events`, một kết nối cho cả app, dừng khi app xuống nền; dự phòng polling 5 giây. Chống gửi trùng bằng `clientMessageId` UUID. |
| Upload video lớn? | Vy | Tải thẳng lên Cloudinary theo từng phần, chạy nền, có thanh tiến độ, hủy được. |
| Đăng nhập Google trên mobile? | Hương | Mở trang xác thực của backend, nhận callback qua deep link về app. |
| Thanh toán có an toàn không? | Hương | App chỉ hiển thị QR SePay và trạng thái do backend xác nhận qua webhook; app không tự báo thành công. |
| AI giới hạn ra sao? | Hương | Hạn mức theo gói do server trả (Miễn phí theo ngày, Plus/Pro theo chu kỳ 30 ngày); hết lượt có nút Xem gói. |
| Sao không dùng web view? | Vy | Cần trải nghiệm native: video lướt dọc, bàn phím, ảnh phóng to, chạy nền. |

## Nếu có sự cố

- **Mất mạng / API chết** → chiếu video quay sẵn của phần đó, nói tiếp lời thoại.
- **App văng** → mở lại (phiên vẫn còn), đi tiếp từ bước kế.
- **AI chậm** → dùng thực đơn/blog đã tạo sẵn.
- **Tin nhắn không tới realtime** → đợi 5 giây (polling) rồi nói về cơ chế dự phòng.
- Luôn để **người còn lại** nói khi người kia đang thao tác chậm, tránh im lặng.
