# Vedora Mobile — quy tắc làm việc

Đọc cùng với `AGENTS.md` trước khi sửa source. Quy tắc Expo SDK và lệnh kiểm tra trong `AGENTS.md` vẫn áp dụng.

## Cấu trúc module

```text
src/
  app/                         Expo Router: route và layout, chỉ ghép các module
  features/<feature>/
    components/                UI của feature
    hooks/                     useQuery, useMutation và logic React của feature
    services/                  hàm gọi API và nghiệp vụ ngoài React
    types/                     Zod schemas, kiểu suy ra từ schema, hợp đồng dữ liệu
    utils/                     hàm thuần, format/transform riêng của feature
    data/                      query keys, dữ liệu tĩnh/fixtures riêng của feature
    stores/                    Zustand state riêng của feature nếu thực sự cần
  shared/
    api/                       Axios client, lỗi API, helper response validation
    config/                    biến môi trường và cấu hình chung
    query/                     QueryClient, provider, trạng thái mạng/foreground
    stores/                    Zustand state dùng chung toàn ứng dụng
    types/                     kiểu dùng chung toàn ứng dụng
  components/, hooks/, constants/  nền dùng chung hiện có của Expo/theme
```

- Mỗi chức năng nghiệp vụ thuộc một `features/<feature>`; chỉ tạo các thư mục con khi có nội dung thật. Không gom nhiều feature vào một `services` hay `types` chung.
- `src/app` chỉ khai báo route/layout và ghép feature. Không gọi Axios, viết schema hay giữ business logic trực tiếp trong route.
- Hướng phụ thuộc: `app` → `features` → `shared`. `shared` không import từ `features`. Khi hai feature cần dùng chung một hợp đồng, chuyển hợp đồng đó vào `shared` hoặc công khai qua API rõ ràng của module sở hữu.
- `components` chỉ xử lý hiển thị/tương tác. `hooks` kết nối UI với Query/store. `services` thực hiện I/O và trả dữ liệu đã xác thực. `types` giữ schema và kiểu. `utils` không có side effect. `data` giữ query keys và dữ liệu tĩnh; không chứa dữ liệu server đang thay đổi.
- Không tạo barrel `index.ts` chỉ để che đường dẫn nội bộ. Khi cần import xuyên feature, định nghĩa public API có chủ đích và tránh vòng phụ thuộc.

## API, cache và state

- Base URL lấy từ `EXPO_PUBLIC_API_URL` trong `src/shared/config/env.ts`. Mọi HTTP request dùng `src/shared/api/api-client.ts`; không tạo Axios instance hoặc gọi `fetch` rải rác trong màn hình.
- Service truyền `signal` từ TanStack Query xuống Axios khi có thể. Dùng `requestJson(schema, config)` để Zod kiểm tra payload API trước khi đưa vào cache/UI. Validate input ở ranh giới form/service và suy ra kiểu bằng `z.infer`/`z.output`, tránh viết type song song với schema.
- Lỗi HTTP được chuẩn hóa thành `ApiError` với `status`, `code`, `message`. UI xử lý theo `status`/`code`, không dựa vào chuỗi message. Request bị hủy giữ nguyên cancellation.
- TanStack Query sở hữu dữ liệu server: query key đặt trong `data/`, query/mutation hook trong `hooks/`, API call trong `services/`. Mutation phải cập nhật/invalidate key liên quan. Không sao chép response Query vào Zustand.
- Zustand chỉ giữ state client hoặc state toàn cục thực sự cần chia sẻ. Chọn selector hẹp trong component; action nằm trong store. Access token ở bộ nhớ; refresh token được lưu bằng Expo SecureStore trên Android/iOS và chỉ ở bộ nhớ trên web. Không lưu token vào AsyncStorage hay biến `EXPO_PUBLIC_*`.
- Query cache được xóa khi access token đổi để tránh hiện dữ liệu giữa các phiên. Refresh token xoay vòng trong `shared/session/session-manager.ts`: mọi request 401 cùng dùng một lần refresh, chỉ retry một lần, và xóa phiên khi backend từ chối refresh.

## Kiểm tra trước khi hoàn tất

- Chạy `npx tsc --noEmit` và `npx expo lint`.
- Với thay đổi Metro, thư viện native, routing hoặc cấu hình nền, kiểm tra bundle nền tảng bị ảnh hưởng bằng `npx expo export --platform android` và/hoặc `--platform web`.
- Kiểm tra hợp đồng endpoint trong `vedora-api` và cách frontend dùng API trước khi thêm service mới. Giữ URL, Bearer token và mã lỗi khớp backend.
