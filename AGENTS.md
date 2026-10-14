# Quy tắc Vedora Mobile

Ứng dụng dùng Expo/React Native. Ưu tiên trải nghiệm di động, hiệu năng và tương thích đa nền tảng.

## Quy tắc dự án

- Đọc [docs/AGENT_RULES.md](docs/AGENT_RULES.md) trước khi thêm hoặc sửa tính năng. Tài liệu này quy định cấu trúc module và cách dùng Axios, TanStack Query, Zustand, Zod.
- Sau mỗi task/tính năng, cập nhật [docs/PLAN.md](docs/PLAN.md) trước khi báo hoàn tất. Ghi ngắn gọn bằng tiếng Việt: **kết quả đã làm**, **các bước kiểm tra luồng trên UI**, **người thực hiện**.

## Kiểm tra tài liệu Expo

Expo có thể thay đổi API qua mỗi phiên bản SDK. Trước khi viết code dùng API của Expo, EAS hoặc React Native:

1. Xem phiên bản chính của `expo` trong `package.json`.
2. Đọc tài liệu đúng phiên bản tại `https://docs.expo.dev/versions/v<major>.0.0/`.
3. Với nội dung khác, tra `https://docs.expo.dev/llms.txt` rồi mở trang liên quan; không dựa vào trí nhớ.

## Lệnh thường dùng

Nếu dự án có `bun.lock`, dùng `bunx` thay cho `npx`.

```bash
npx expo install <package>  # Cài phiên bản tương thích SDK; không dùng npm/yarn/pnpm/bun add
npx expo start              # Chạy môi trường phát triển
npx expo lint               # Kiểm tra lint
npx tsc --noEmit            # Kiểm tra kiểu dữ liệu
npx expo-doctor             # Chẩn đoán cấu hình và thư viện
npx expo install --fix      # Sửa phiên bản thư viện không tương thích
```

Chạy lint và kiểm tra kiểu dữ liệu trước khi kết thúc task.

## Điều hướng

- Dùng **Expo Router** cho mọi điều hướng. `src/app/` chỉ chứa route và layout; để components, hooks, utils ngoài thư mục này.
- Import `Link`, `router`, `useLocalSearchParams` từ `expo-router`.
- Tài liệu: https://docs.expo.dev/router/introduction.md

## Build với EAS

Dùng EAS để build, ký, gửi ứng dụng (`eas build`, `eas submit`) và cập nhật OTA (`eas update`). Chạy CLI bằng `bunx eas-cli <command>` nếu dùng Bun, hoặc `npx eas-cli@latest <command>` trong trường hợp khác.

Tài liệu: https://docs.expo.dev/eas/index.md

## Quy tắc native

- Nếu chưa có `ios/` và `android/`, đây là thư mục được sinh tự động. Không tạo hoặc sửa thủ công; cấu hình qua `app.json` và config plugin.
- Sau khi thêm thư viện có mã native, tạo development build bằng `npx expo run:ios|android` hoặc `eas build --profile development`.
- Ưu tiên module do Expo đề xuất và kiểm tra skill sẵn có trước khi thêm thư viện. Tài liệu: https://docs.expo.dev/versions/latest/index.md
