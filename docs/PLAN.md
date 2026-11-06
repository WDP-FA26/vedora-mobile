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
