# Kế hoạch và kết quả công việc

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

## 2026-11-10 — Bỏ ký tự Markdown (##, **...) trong đoạn xem trước của blog

- Kết quả: API trả `excerpt` là văn bản nguồn cắt ở 280 ký tự nên có cả `##`, `**`, `-`, liên kết, ảnh. Thêm hàm `plainText` (blogs/utils/markdown.ts) làm phẳng Markdown thành chữ thường: bỏ dấu đề mục, đậm/nghiêng, danh sách, trích dẫn, mã, đường kẻ, thẻ HTML; liên kết giữ chữ, ảnh bỏ hẳn, dấu bị cắt dở ở cuối đoạn cũng bỏ; giữ hashtag và các ký tự như 2*3, snake_case. Áp dụng cho thẻ blog ở trang chính, tìm kiếm, đã lưu, hồ sơ (cùng thẻ bài) và danh sách "Blog của tôi". Trang đọc blog vẫn dùng trình hiển thị Markdown đầy đủ. Đã thử 10 ca bằng script tạm.
- Bước kiểm tra UI: (1) Viết blog có đề mục ##, chữ đậm, danh sách và ảnh rồi đăng; mở Khám phá tab Blog: đoạn mô tả không còn ##, ** hay dấu gạch đầu dòng, chữ liền mạch. (2) Mở Tôi > Blog của tôi: mô tả cũng sạch ký tự. (3) Mở chi tiết bài: nội dung vẫn có đề mục, đậm, danh sách đúng định dạng. (4) Blog mô tả quá ngắn hoặc chỉ có ảnh: không hiện dòng trống lạ. Chưa kiểm tra trực tiếp trên thiết bị.
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

- Bổ sung (cùng ngày): chữ nghiêng không hiện và dấu đầu dòng (•, 1.) lệch dòng. Nghiêng: khi phông tùy chỉnh đã nạp được, iOS không tự làm nghiêng phông không có bản nghiêng; nay nạp thêm Source Sans 3 Regular Italic, Bold Italic và Be Vietnam Pro Bold Italic, rồi chọn đúng file theo định dạng (đậm, nghiêng, đậm + nghiêng, đề mục, trích dẫn) trong trình soạn và trang đọc blog. Lệch dòng: dấu đầu dòng thiếu phần đệm trên/dưới giống ô nhập nên thấp hơn chữ cùng dòng; nay hai bên cùng đệm. Kiểm tra: bôi chọn chữ rồi bấm Nghiêng, Đậm, cả hai: chữ đổi đúng kiểu; trích dẫn nghiêng; mở bài có chữ *nghiêng* ở trang đọc; danh sách dấu đầu dòng và số thẳng hàng với dòng chữ đầu của mục, kể cả mục dài nhiều dòng. Người thực hiện: Claude.
