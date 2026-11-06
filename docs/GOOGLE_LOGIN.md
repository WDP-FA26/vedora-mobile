# Đăng nhập Google trên mobile

## Trạng thái tích hợp

Mobile có nút Google tại đăng nhập/đăng ký, mở trình duyệt hệ thống, kiểm tra state/callback và đổi authorization code qua API hiện có. **Chưa thể chạy trọn luồng với web hiện tại:** callback web phải triển khai nhánh chuyển về app bên dưới. Chưa chỉnh hoặc triển khai repo web trong task mobile này; chưa kiểm thử tài khoản Google thật.

## API và cấu hình

- `POST /auth/google/authorize`, body `{}` → `{url, state, codeVerifier}`.
- `POST /auth/google`, body `{code, codeVerifier}` → phiên đăng nhập chuẩn của Vedora.
- Backend giữ `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`. Không đưa secret vào mobile. Giữ callback HTTPS đang đăng ký với Google, ví dụ `https://<web>/auth/google`.
- Mobile dùng scheme đã có `vedoramobile`. Chạy development build hoặc bản phát hành; Expo Go và bản web của repo mobile không hỗ trợ luồng này. Không thêm thư viện native.
- Verifier chỉ ở bộ nhớ trong một lần đăng nhập, không ghi URL/log/storage. Token trả qua API và lưu bằng session manager hiện có. Callback chỉ chuyển code/state, không chuyển access/refresh token.

## Thay đổi bắt buộc tại repo web

Đã chuẩn bị [patch cho repo web](google-web-callback.patch), kiểm tra áp dụng được với checkout `C:/vedora` hiện tại nhưng chưa áp dụng. Trong `app/auth/google/route.ts`, đặt nhánh sau ở đầu `GET`, trước khi gọi `finish`/`start`. Không đổi luồng cookie hiện có của web, không nhận redirect URL tùy ý từ query:

```ts
const state = request.nextUrl.searchParams.get("state")
const params = request.nextUrl.searchParams
if (state && /^mobile\.[A-Za-z0-9_-]{43}$/.test(state) &&
    (params.has("code") || params.has("error"))) {
  const callback = new URL("vedoramobile://google-callback")
  callback.searchParams.set("state", state)
  const code = params.get("code")
  if (params.has("error")) {
    callback.searchParams.set("error", "access_denied")
  } else if (params.getAll("code").length === 1 && code && code.length <= 2048 &&
             params.getAll("state").length === 1) {
    callback.searchParams.set("code", code)
  } else {
    callback.searchParams.set("error", "invalid_callback")
  }
  const response = NextResponse.redirect(callback)
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("Referrer-Policy", "no-referrer")
  return response
}
```

Mobile gắn tiền tố `mobile.` vào nonce do API tạo để web nhận diện. Mobile tự kiểm tra state khớp và thời hạn 10 phút trước khi gửi code cùng verifier tới API; web không đổi code lấy token cho nhánh này. PKCE ngăn ứng dụng khác chỉ có code tự đổi lấy phiên. Nếu app bị đóng trong lúc xác thực, người dùng bắt đầu lại; không khôi phục verifier từ đường dẫn.

## Kiểm tra trên thiết bị

1. Triển khai nhánh callback web và bật Google OAuth trên backend; cài development build có scheme Vedora.
2. Mở Đăng nhập > Tiếp tục với Google, chọn tài khoản; xác nhận trình duyệt đóng, app trở lại đúng màn đích và hồ sơ hiển thị đúng người.
3. Đăng xuất, thử nút Google tại Đăng ký; kiểm tra tài khoản mới và email đã tồn tại được backend xử lý đúng.
4. Đóng trình duyệt hoặc từ chối Google; xác nhận không đăng nhập nhầm và có thể bấm lại.
5. Thử mất mạng trước/sau xác thực, backend chưa cấu hình, callback sai state/hết hạn; không tạo phiên và hiển thị hướng dẫn thử lại.
6. Mở từ luồng yêu cầu đăng nhập ở Billing/Blog; xác nhận trở lại màn đích. Thử Android đang mở app và iOS, đóng app giữa luồng rồi mở callback cũ; yêu cầu bắt đầu lại.
7. Thử Expo Go: hiển thị hướng dẫn dùng bản cài, vẫn đăng nhập email được. Kiểm tra theme tối, chữ lớn và VoiceOver/TalkBack.

Tài liệu: [Expo WebBrowser SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/webbrowser/), [Native intent](https://docs.expo.dev/router/advanced/native-intent/).
