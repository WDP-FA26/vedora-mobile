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
