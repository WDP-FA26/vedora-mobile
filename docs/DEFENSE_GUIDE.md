# Cẩm nang trả lời hội đồng — Vedora Mobile

Tài liệu này giải thích **bằng lời thường** các công nghệ và luồng chạy trong app mobile, kèm câu trả lời mẫu. Mọi nội dung đều đối chiếu với code thật trong repo (có ghi đường dẫn file để mở ra chỉ khi bị hỏi).

Cách học nhanh: đọc **mục 1 → 3** cho chắc, rồi học **mục 4** theo phần mình demo, cuối cùng tập **mục 6** (câu hỏi khó).

---

## 1. Tóm tắt 30 giây (học thuộc)

> "App mobile Vedora viết bằng **React Native + Expo**, một bộ code chạy cả Android và iOS. App không có database riêng: mọi dữ liệu lấy từ **backend NestJS + MongoDB** qua REST API, chung API với bản web.
> Bên trong app chia 3 lớp: **màn hình** (hiển thị) → **hook** (quản lý dữ liệu bằng TanStack Query) → **service** (gọi API bằng Axios, kiểm tra dữ liệu trả về bằng Zod).
> Phần realtime (nhắn tin, thanh toán) và câu trả lời AI dùng **SSE**: server đẩy dữ liệu xuống app qua một kết nối HTTP mở sẵn."

---

## 2. Bức tranh tổng thể

```text
 ┌────────────── Điện thoại (Vedora Mobile) ──────────────┐
 │  Màn hình (components)                                  │
 │     ↓ gọi                                               │
 │  Hook (TanStack Query: cache, tải lại, phân trang)      │
 │     ↓ gọi                                               │
 │  Service (Axios + Zod kiểm tra dữ liệu)                 │
 │     ↓ HTTP + "Bearer token"                             │
 └─────┼───────────────────────────────────────────────────┘
       ▼
 ┌─ vedora-api (NestJS) ─┐──► MongoDB (dữ liệu)
 │  REST API + SSE       │──► AI (Vercel AI SDK) — trợ lý, thực đơn, viết blog
 └───────────────────────┘──► SePay (thanh toán QR, báo về bằng webhook)
                           ──► Google (đăng nhập)
 Điện thoại ──(tải video trực tiếp, có chữ ký của API)──► Cloudinary
```

Ý quan trọng: **app chỉ hiển thị và gửi yêu cầu; mọi quyết định (đúng sai mật khẩu, thanh toán thành công, hết lượt AI…) do backend quyết.**

---

## 3. Từng công nghệ — là gì, dùng để làm gì

| Công nghệ | Giải thích đời thường | Trong Vedora dùng ở đâu |
|---|---|---|
| **React Native** | Viết giao diện bằng JavaScript/React, nhưng hiện ra là **nút, chữ, danh sách native thật** của Android/iOS (không phải trang web nhúng). | Toàn bộ giao diện. |
| **Expo (SDK 58)** | Bộ công cụ đi kèm React Native: có sẵn camera, chọn ảnh, phát video, lưu bảo mật… không phải tự viết code Java/Swift. | `expo-video` (phát video), `expo-image-picker` (chọn ảnh/video), `expo-secure-store` (lưu token), `expo-file-system` (upload), `expo-web-browser` (đăng nhập Google). |
| **Expo Router** | Điều hướng **theo file**: mỗi file trong `src/app/` là một màn hình, đường dẫn giống web. | `src/app/(tabs)/explore.tsx` = tab Trang chủ; `src/app/messages/[id].tsx` = màn chat có id. |
| **TypeScript** | JavaScript có kiểu dữ liệu, bắt lỗi sai kiểu ngay khi viết code. | Toàn bộ code. |
| **Axios** | Thư viện gửi request HTTP. | Một client duy nhất `src/shared/api/api-client.ts`: tự gắn token, tự làm mới token khi hết hạn. |
| **Zod** | "Người gác cổng" dữ liệu: kiểm tra dữ liệu API trả về có đúng cấu trúc không, sai thì báo lỗi thay vì làm app crash. | Mọi response đi qua `requestJson(schema, …)` (`src/shared/api/request-json.ts`); form đăng nhập/đăng ký cũng kiểm tra bằng Zod. |
| **TanStack Query** | Quản lý **dữ liệu lấy từ server**: tự cache, tự tải lại, phân trang cuộn vô hạn, trạng thái đang tải/lỗi. | Feed, bình luận, tin nhắn, gói dịch vụ… (`features/*/hooks`). Cache "còn mới" 30 giây (`src/shared/query/query-client.ts`). |
| **Zustand** | Kho state nhỏ gọn cho **dữ liệu của riêng app** (không phải từ server). | Phiên đăng nhập (`session-store.ts`), tiến độ đăng video chạy nền (`video-publish-store.ts`), trạng thái kết nối realtime. |
| **NativeWind (Tailwind)** | Viết style bằng class kiểu Tailwind như bên web. | Giao diện, theme sáng/tối. |
| **Reanimated / Gesture Handler** | Hiệu ứng và cử chỉ mượt chạy trên luồng riêng. | Tim bay khi thích, chạm hai lần, phóng to ảnh. |
| **SSE (Server-Sent Events)** | Một kết nối HTTP **giữ mở**, server đẩy sự kiện xuống từng dòng. Một chiều server → app, nhẹ hơn WebSocket. | Nhắn tin realtime, trạng thái thanh toán, chữ AI hiện dần. |
| **EAS** | Dịch vụ của Expo để build file cài đặt (APK/IPA) trên cloud. | Build bản demo/phát hành. |

**Phân biệt TanStack Query và Zustand** (hay bị hỏi):
- Dữ liệu **có trên server** (bài viết, tin nhắn) → TanStack Query, vì cần cache và tải lại.
- Dữ liệu **chỉ app biết** (token đang dùng, video đang upload tới 45%) → Zustand.
- Quy tắc nhóm: không chép dữ liệu server vào Zustand (`docs/AGENT_RULES.md`).

---

## 4. Các luồng chính (step by step)

### 4.1. Một request bình thường đi như thế nào (ví dụ mở feed)

1. Màn `FeedScreen` gọi hook `useFeed` (`features/feed/hooks/use-feed.ts`).
2. Hook dùng `useInfiniteQuery` → gọi service `feed.service.ts`.
3. Service gọi `requestJson(schema, { url: '/posts' … })`.
4. Axios tự gắn header `Authorization: Bearer <access token>`.
5. API trả JSON → **Zod kiểm tra** → đúng thì lưu vào cache → màn hình hiện.
6. Cuộn tới cuối → Query tự tải trang tiếp theo (phân trang bằng `cursor`).
7. Kéo xuống để làm mới → Query tải lại.

> Trả lời mẫu: *"Mỗi tính năng là một module trong `src/features`, chia components / hooks / services / types. Màn hình không gọi API trực tiếp mà qua hook và service, nên dễ sửa và dễ kiểm tra."*

### 4.2. Đăng nhập email và giữ phiên (refresh token)

```text
Đăng nhập ──► API trả: accessToken (ngắn hạn) + refreshToken (dài hạn)
  accessToken  → giữ trong bộ nhớ (Zustand), mất khi tắt app
  refreshToken → lưu trong SecureStore (Keychain iOS / Keystore Android, được mã hóa)
```

1. Người dùng nhập tài khoản/mật khẩu + vượt **Cloudflare Turnstile** (chống bot, giống CAPTCHA nhưng thường tự qua) → `login-screen.tsx`.
2. API trả 2 token → `acceptSession` (`shared/session/session-manager.ts`) lưu như trên.
3. **Access token hết hạn** → API trả lỗi **401** → Axios chặn lỗi đó, gọi `/auth/refresh` lấy token mới, **gửi lại request cũ** → người dùng không thấy gì.
   - Nếu 5 request cùng bị 401 một lúc, app **chỉ refresh 1 lần**, cả 5 dùng chung kết quả.
   - Refresh token **xoay vòng**: mỗi lần refresh nhận refresh token mới, cái cũ bỏ.
   - Refresh bị từ chối → xóa phiên → về màn đăng nhập.
4. **Mở lại app**: đọc refresh token trong SecureStore → refresh → vào thẳng app (`hydrateSession`).
5. Đổi tài khoản → xóa cache Query để không lộ dữ liệu người trước.

> Vì sao 2 token? *"Access token ngắn hạn nên lộ cũng ít hại; refresh token dài hạn được cất trong vùng mã hóa của hệ điều hành, không lưu ở AsyncStorage thường."*

### 4.3. Đăng nhập Google (OAuth + PKCE)

1. App gọi `POST /auth/google/authorize` → API trả link Google + `state` + `codeVerifier`.
2. App mở trình duyệt hệ thống (`openAuthSessionAsync`) → người dùng chọn tài khoản Google.
3. Google chuyển hướng về `vedoramobile://google-callback?code=…` (deep link mở lại app).
4. App kiểm tra `state` khớp (chống giả mạo), lấy `code` → gửi `POST /auth/google` kèm `codeVerifier`.
5. API đổi code lấy thông tin Google, trả token Vedora → vào app như đăng nhập thường.

File: `features/auth/services/google-auth.service.ts`, `features/auth/utils/google-oauth.ts`.
Lưu ý: chạy được trên **bản build riêng**, không chạy trong Expo Go.

> PKCE là gì? *"Một mã bí mật (`codeVerifier`) chỉ app và server biết; dù ai bắt được `code` trên đường về cũng không đổi được thành token."*

### 4.4. Thích / lưu / đăng lại bài

1. Chạm tim (hoặc chạm hai lần vào video) → hiện hiệu ứng tim ngay.
2. Gửi request lên API → API trả số like mới → app **sửa đúng bài đó trong cache** (`patchCachedPost`) ở mọi danh sách đang hiện, không tải lại cả feed.

### 4.5. Đăng video (chạy nền, upload thẳng lên Cloudinary)

```text
App ──1. xin chỗ upload──► API ──trả URL + chữ ký Cloudinary
App ──2. gửi file video──────────────────────► Cloudinary   (không đi qua server Vedora)
App ──3. tạo bài với mediaId──► API
```

1. Chọn video (`expo-image-picker`), nhập tiêu đề.
2. `POST /media/uploads` → API trả địa chỉ Cloudinary + **chữ ký** (để chỉ app được phép upload).
3. App gửi file **thẳng lên Cloudinary**. Video lớn được **chia khối** (mỗi khối có `Content-Range`), Android/iOS upload bằng tác vụ native nên không làm đơ app.
4. Xong → `POST /posts` kèm `mediaId` → bài xuất hiện.
5. Tiến độ lưu trong Zustand (`video-publish-store.ts`) nên **đóng form vẫn thấy thanh %**; lỗi thì thử lại chỉ cần tạo bài, không upload lại.

File: `features/feed/services/compose.service.ts`.

> Vì sao không gửi qua server? *"Đỡ tốn băng thông và tài nguyên server; Cloudinary còn tự nén/chuyển định dạng để phát mượt."*

### 4.6. Xem video lướt dọc (reels)

- Dùng `expo-video`. Video **kề trước/kề sau được tải sẵn** nên lướt tới là phát ngay.
- Rời màn hình → dừng video để không chồng tiếng.

### 4.7. Nhắn tin realtime ⭐

**Quy tắc nghiệp vụ** (backend quyết):
- Muốn nhắn được thì **phải theo dõi** người kia.
- Nếu A nhắn B mà B chưa theo dõi A → với B đó là **tin nhắn lạ**, gom vào dòng "Tin nhắn từ người lạ". B **theo dõi lại** thì mới trả lời được, cuộc trò chuyện chuyển sang hộp thư chính.

**Gửi tin**:
1. App tạo một mã `clientMessageId` (UUID) cho tin.
2. `POST /messaging/.../messages` gửi nội dung + mã đó.
3. Mất mạng → báo lỗi, giữ nội dung; bấm gửi lại dùng **đúng mã cũ** → server thấy trùng mã nên **không tạo tin thứ hai** (gọi là *idempotent*).

**Nhận tin (realtime)**:
1. Khi đăng nhập, app mở **1 kết nối SSE** `GET /messaging/events` cho cả app (`use-messaging-stream.ts`).
2. Có tin mới → server đẩy sự kiện `message.created` (chỉ là "tín hiệu", không chứa nội dung).
3. App nhận tín hiệu → **tải lại** hộp thư/cuộc chat qua API thường → tin hiện ra.
4. Server gửi `ping` mỗi 15 giây; **im lặng quá 35 giây** → coi như rớt kết nối → tự nối lại sau 2 giây.
5. Khi SSE không chạy được → app **tự chuyển sang polling** (5 giây hỏi server 1 lần). SSE chạy lại thì tắt polling.
6. App xuống nền → đóng kết nối cho đỡ pin; mở lại → nối lại và tải lại.
7. "Đã xem": khi tin mới nằm trong màn hình, app gọi `PUT .../read`.

File: `shared/api/use-event-stream.ts`, `features/messaging/*`.

> Vì sao SSE mà không WebSocket? *"Nhắn tin chỉ cần server báo xuống, còn gửi tin đã có REST. SSE chạy trên HTTP thường, gắn token như request khác, đơn giản hơn. Dùng chung một hook cho cả nhắn tin và thanh toán."*
> Vì sao sự kiện không chứa nội dung tin? *"Để dữ liệu luôn lấy từ một nguồn là API; lỡ mất sự kiện thì lần tải lại sau vẫn đúng."*

### 4.8. Trợ lý Vedora (chữ hiện dần)

1. Gửi câu hỏi → `POST /meal-plan/chat` (đã đăng nhập) hoặc hỏi nhanh với tư cách khách (phải qua Turnstile, nhận token khách ngắn hạn).
2. Server dùng **Vercel AI SDK** gọi mô hình AI, trả về dạng **stream SSE**: mỗi dòng là một mẩu chữ (`text-delta`).
3. App ghép dần các mẩu → chữ hiện từng đoạn như ChatGPT, có định dạng Markdown (`shared/api/ai-stream.ts`).
4. App chỉ gửi **10 tin gần nhất** làm ngữ cảnh.

### 4.9. AI lên thực đơn

1. Điền form (số ngày, bữa…) → gửi cho trợ lý; trợ lý biết **hồ sơ ăn uống** của người dùng (server tự lấy).
2. AI không chỉ trả lời chữ mà **gọi công cụ** `proposeMealPlan` → trả về thực đơn dạng dữ liệu có cấu trúc.
3. App hiện **bản đề xuất để xem trước**; người dùng đồng ý → `PUT /meal-plan/days` lưu vào **Thực đơn của tôi**.
4. Chạm vào món → mở công thức.

File: `features/meal-plan/hooks/meal-planner-provider.tsx`.

> *"AI chỉ đề xuất, người dùng duyệt rồi mới lưu, nên không bao giờ tự ghi đè thực đơn."*

### 4.10. Viết blog có trợ lý AI

1. Trình soạn **theo khối** (mỗi đoạn/tiêu đề/danh sách/ảnh là một khối), người dùng không thấy ký tự Markdown.
2. Mở trợ lý → app gửi **cuộc trò chuyện + nội dung bài hiện tại + đoạn đang bôi chọn** lên `POST /blogs/ai/chat` (server không lưu hội thoại).
3. AI trả về **đề xuất sửa bài** (thêm đoạn, thay đoạn, tạo ảnh) → hiện khung so sánh → **Chấp nhận** mới chèn vào bài.
4. Lưu nháp / đăng: `blogs.service.ts`.

### 4.11. Gói dịch vụ và thanh toán SePay

```text
App ──tạo giao dịch (Idempotency-Key)──► API ──► trả QR + nội dung CK
Người dùng chuyển khoản bằng app ngân hàng
Ngân hàng ──► SePay ──webhook──► API (xác nhận) ──SSE payment.changed──► App ──► "Thành công"
```

1. Chọn gói Plus (49.000đ) / Pro (99.000đ), 30 ngày → `POST /billing/payment-intents` kèm header **`Idempotency-Key`** (bấm 2 lần không tạo 2 giao dịch).
2. API trả **QR + số tài khoản + nội dung chuyển khoản**.
3. App mở SSE `GET /payment-intents/:id/events` chờ kết quả.
4. Tiền về → SePay báo backend (webhook) → backend xác nhận → đẩy `payment.changed` → app tải lại → màn **thành công**, không cần bấm.
5. Nút "Tôi đã thanh toán" chỉ là **hỏi lại server**, app **không bao giờ tự báo thành công**.
6. Hạn mức AI (lượt hỏi, lượt tạo ảnh) do server trả theo gói; hết lượt → API trả lỗi 429 → app hiện nút "Xem gói".

---

## 5. Thuật ngữ nhanh

| Từ | Nghĩa ngắn |
|---|---|
| **API / REST** | Cách app nói chuyện với server qua các đường dẫn như `GET /feed`, `POST /posts`. |
| **Token / Bearer** | "Vé" chứng minh đã đăng nhập, gửi kèm mọi request. |
| **401 / 403 / 429** | Chưa đăng nhập hoặc token hết hạn / không có quyền / gửi quá nhiều (hết lượt). |
| **Cache** | Bản lưu tạm dữ liệu đã tải để hiện ngay, không tải lại. |
| **Cursor pagination** | Tải từng trang bằng "mốc" của bài cuối, thay vì số trang. |
| **SSE** | Server đẩy sự kiện xuống qua kết nối HTTP mở sẵn. |
| **Polling** | App cứ vài giây hỏi server "có gì mới không". Dùng làm dự phòng. |
| **Idempotent** | Gửi lại nhiều lần cũng chỉ có một kết quả (không trùng tin, không trùng giao dịch). |
| **Webhook** | Dịch vụ ngoài (SePay) chủ động gọi vào server mình để báo tin. |
| **Deep link** | Đường dẫn mở thẳng vào app (`vedoramobile://…`). |
| **OAuth / PKCE** | Chuẩn đăng nhập bằng tài khoản bên thứ ba / lớp bảo vệ thêm cho app di động. |
| **Native** | Thành phần thật của Android/iOS, không phải web. |
| **Expo Go / Development build** | App thử nghiệm có sẵn của Expo / bản build riêng của mình (cần cho Google login). |

---

## 6. Câu hỏi khó và cách trả lời

**"Vì sao chọn React Native/Expo mà không Flutter hay native?"**
> Nhóm đã dùng React/TypeScript cho web, nên dùng lại kiến thức, kiểu dữ liệu và cách gọi API; một code cho cả Android và iOS. Expo có sẵn module (video, upload, lưu bảo mật) và EAS để build.

**"Mobile và web có dùng chung gì?"**
> Chung backend và API, chung quy tắc nghiệp vụ. Code giao diện tách riêng vì mobile cần trải nghiệm native.

**"Bảo mật trong app?"**
> Token lưu SecureStore (mã hóa), access token ngắn hạn, refresh xoay vòng; Turnstile chống bot; Google dùng PKCE + kiểm tra `state`; dữ liệu API được Zod kiểm tra; thanh toán chỉ tin xác nhận từ server.

**"Mất mạng thì sao?"**
> Query tự thử lại (trừ lỗi 4xx), tin nhắn giữ nội dung để gửi lại không trùng, kết nối realtime tự nối lại và có polling dự phòng, app mở lại thì tải lại dữ liệu.

**"Có offline không?"** → Chưa hỗ trợ offline đầy đủ; chỉ có cache tạm trong phiên. Đây là hướng phát triển.

**"Có test không?"** → Kiểm tra kiểu (`tsc`) và lint trước mỗi task, kiểm thử thủ công theo kịch bản ghi trong `docs/PLAN.md`. Chưa có test tự động — nói thật, đưa vào hướng phát triển.

**"Push notification?"** → Hiện thông báo trong app (màn Thông báo, huy hiệu chưa đọc); chưa có push khi app tắt. Hướng phát triển: `expo-notifications`.

**"Nhóm có dùng AI để code không?"** — trả lời **thật**:
> Có dùng AI hỗ trợ viết code. Nhóm đặt quy tắc kiến trúc (`docs/AGENT_RULES.md`), đối chiếu hợp đồng API với backend, mỗi tính năng đều chạy kiểm tra kiểu/lint, kiểm thử trên máy và ghi lại kết quả trong `docs/PLAN.md`. Nhóm chịu trách nhiệm hiểu và kiểm tra những gì đưa vào sản phẩm.

**Khi không biết câu trả lời**
- Đừng bịa. Nói: *"Phần này em nắm ở mức luồng là …, chi tiết cài đặt em xin phép kiểm tra lại code và bổ sung sau."*
- Kéo về thứ mình chắc: chỉ ra file và giải thích theo các bước ở mục 4.
- Câu hỏi về backend → "Phần đó do backend xử lý, phía mobile em gọi API … và nhận …".

---

## 7. Bản đồ file (để mở code khi bị hỏi)

| Hỏi về | Mở file |
|---|---|
| Gọi API, gắn token, tự refresh | `src/shared/api/api-client.ts` |
| Lưu và xoay vòng token | `src/shared/session/session-manager.ts` |
| Kiểm tra dữ liệu bằng Zod | `src/shared/api/request-json.ts` |
| Cấu hình cache | `src/shared/query/query-client.ts` |
| SSE dùng chung | `src/shared/api/use-event-stream.ts`, `event-stream.ts` |
| Chữ AI hiện dần | `src/shared/api/ai-stream.ts` |
| Nhắn tin | `src/features/messaging/` |
| Upload video | `src/features/feed/services/compose.service.ts` |
| Google login | `src/features/auth/services/google-auth.service.ts` |
| Thanh toán | `src/features/billing/` |
| AI thực đơn | `src/features/meal-plan/hooks/meal-planner-provider.tsx` |
| Trợ lý viết blog | `src/features/blogs/services/blog-ai.service.ts` |
| Danh sách màn hình | `src/app/` |
