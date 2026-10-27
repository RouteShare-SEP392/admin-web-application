# RouteShare Admin Web

Trang quản trị của RouteShare, nền tảng đi chung xe chia sẻ chi phí. Dành cho đội vận hành: xét duyệt tài xế và phương tiện, quản lý người dùng, giám sát chuyến đi, xử lý vi phạm và chỉnh tham số hệ thống.

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Apollo Client 4.

## Chạy thử

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở http://localhost:3001. Admin web chạy ở cổng 3001 vì backend mặc định dùng cổng 3000.

Với cấu hình mặc định (`NEXT_PUBLIC_API_MOCK=all`) không cần chạy backend. Đăng nhập bằng tài khoản mẫu:

- Tài khoản: `admin@routeshare.vn`
- Mật khẩu: `Admin@123`

## Chế độ dữ liệu mẫu

Biến `NEXT_PUBLIC_API_MOCK` trong `.env.local` quyết định dữ liệu lấy từ đâu. Đổi giá trị xong cần khởi động lại `npm run dev`.

| Giá trị | Hành vi |
| --- | --- |
| `all` | Mọi thao tác, kể cả đăng nhập, chạy trên dữ liệu mẫu. |
| `missing` | API backend đã có thì gọi thật, API chưa có thì dùng dữ liệu mẫu. |
| `off` | Mọi thao tác gọi backend. |

Ở chế độ `missing` và `off` cần backend đang chạy tại `BACKEND_GRAPHQL_URL` và một tài khoản có `role = ADMIN`.

Dữ liệu mẫu nằm trong bộ nhớ của server Next.js. Thao tác duyệt, khoá, huỷ có thay đổi dữ liệu trong phiên chạy; khởi động lại server thì trở về ban đầu.

## Các trang

| Đường dẫn | Trang | API |
| --- | --- | --- |
| `/login` | Đăng nhập | Backend đã có (`signIn`) |
| `/` | Tổng quan vận hành: chỉ số theo kỳ 7, 14, 30 ngày, biểu đồ chuyến mỗi ngày, hàng đợi cần xử lý, chuyến gần đây, xuất CSV | Đề xuất |
| `/verifications/drivers` | Duyệt CCCD và GPLX | Backend đã có |
| `/verifications/vehicles` | Duyệt giấy đăng ký xe | Backend đã có |
| `/verifications/drivers/[profileId]` | Hồ sơ tài xế: toàn bộ giấy tờ và xe của một tài xế, duyệt tại chỗ | Đề xuất (xem), backend đã có (duyệt) |
| `/verifications/history` | Lịch sử xét duyệt: giấy tờ đã duyệt hoặc từ chối | Đề xuất |
| `/users`, `/users/[id]` | Người dùng, khoá và mở khoá; lịch sử chuyến đã đăng, chuyến đã đặt, vi phạm | Đề xuất |
| `/vehicles` | Tra cứu phương tiện theo biển số, hãng xe, chủ xe | Đề xuất |
| `/trips`, `/trips/[id]` | Chuyến đi, huỷ chuyến | Đề xuất |
| `/violations` | Vi phạm tài xế, tha vi phạm | Đề xuất |
| `/bookings`, `/bookings/[id]` | Đặt chỗ: tra cứu, phần tính tiền, mốc thời gian | Đề xuất |
| `/payments` | Thanh toán và đối soát | Đề xuất |
| `/reports`, `/reports/[id]` | Báo cáo và khiếu nại: nhận xử lý, giải quyết, bác bỏ | Đề xuất |
| `/sos` | Sự cố SOS: vị trí, liên hệ khẩn cấp, đóng sự cố | Đề xuất |
| `/admins` | Quản trị viên: thêm, khoá, mở khoá | Đề xuất |
| `/settings` | Cấu hình hệ thống | Đề xuất |
| `/audit-log` | Nhật ký thao tác của quản trị viên | Đề xuất |
| `/account` | Tài khoản của tôi: thông tin, đổi mật khẩu, thao tác gần đây | `me` đã có, đổi mật khẩu đề xuất |

## Hợp đồng API cho backend

Các API "Đề xuất" là những query và mutation backend chưa có. Tên, tham số và kiểu trả về được định nghĩa tại `PROPOSED_SDL` trong [src/server/mock/schema.ts](src/server/mock/schema.ts). Backend triển khai đúng hợp đồng này thì admin web chuyển sang API thật bằng cách đặt `NEXT_PUBLIC_API_MOCK=off`, không phải sửa trang nào.

Quy tắc nghiệp vụ và kiểm tra dữ liệu của từng API nằm ở [docs/backend-constraints.md](docs/backend-constraints.md).

Hai việc backend cần làm ngoài 27 API trong hợp đồng:

- Chặn đăng nhập với tài khoản có `status = SUSPENDED`, nếu không thao tác khoá tài khoản không có tác dụng.
- Có cách tạo tài khoản quản trị đầu tiên (script seed hoặc cập nhật `role` trong cơ sở dữ liệu).

## Kiến trúc

Trình duyệt không gọi thẳng backend. Mọi request đi qua server Next.js:

- `POST /api/auth/login` gọi `signIn` của backend, kiểm tra `role = ADMIN`, rồi lưu JWT vào cookie `httpOnly`. JavaScript phía trình duyệt không đọc được token.
- `POST /api/graphql` đọc JWT từ cookie, gắn vào header `Authorization` và chuyển tiếp sang backend, hoặc trả dữ liệu mẫu tuỳ chế độ mock.
- `src/proxy.ts` chuyển người chưa đăng nhập về `/login`.

```
src/
  app/
    (dashboard)/   các trang sau đăng nhập, mỗi trang gồm page.tsx và view.tsx
    api/           đăng nhập, đăng xuất, cổng GraphQL
    login/
  components/      khung trang và component dùng chung (ui/)
  lib/             kiểu dữ liệu, câu truy vấn GraphQL, nhãn tiếng Việt, định dạng
  server/mock/     schema, dữ liệu và resolver của lớp mock
```

## Bảng màu

Dùng chung bảng màu "Rêu / Chanh" và tên token với ứng dụng mobile (`brand-*`, `accent`, `ink`, `muted`, `canvas`), khai báo trong [src/app/globals.css](src/app/globals.css). Màu trạng thái dùng thống nhất: vàng hổ phách cho chờ xử lý, xanh ngọc cho tốt, đỏ cho xấu, xanh dương cho đang diễn ra, xám cho trung tính.

## Lệnh

| Lệnh | Tác dụng |
| --- | --- |
| `npm run dev` | Chạy môi trường phát triển ở cổng 3001 |
| `npm run build` | Build bản production |
| `npm run start` | Chạy bản đã build ở cổng 3001 |
| `npm run lint` | Kiểm tra ESLint |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
