# Ràng buộc backend cho trang quản trị

Tài liệu này liệt kê những gì backend cần đảm bảo để admin web chạy được với API thật. Tên query, mutation và kiểu dữ liệu nằm ở `PROPOSED_SDL` trong [src/server/mock/schema.ts](../src/server/mock/schema.ts); tài liệu này bổ sung phần schema không diễn tả được: quy tắc nghiệp vụ, kiểm tra dữ liệu và thông báo lỗi.

Hành vi mẫu của từng API có thể xem ở [src/server/mock/resolvers.ts](../src/server/mock/resolvers.ts). Admin web hiện chạy đúng theo hành vi đó.

## 1. Ràng buộc chung cho mọi API admin

| Hạng mục | Ràng buộc |
| --- | --- |
| Phân quyền | Mọi API có tiền tố `admin` dùng `GqlJwtGuard` rồi `RolesGuard` với `@Roles(UserRole.ADMIN)`, giống bốn API duyệt KYC hiện có. |
| Người thao tác | Lấy từ `@CurrentUser()`. Không nhận `adminId` từ client. |
| Thông báo lỗi | Tiếng Việt, đặt ở `message` của lỗi GraphQL. Admin web hiển thị nguyên văn `errors[0].message` cho quản trị viên. |
| Lỗi nghiệp vụ | Trả mã 4xx (`BadRequestException`, `NotFoundException`) để `AppGqlExceptionFilter` không che thông báo. |
| Hết phiên | Trả lỗi có `extensions.status = 401`. Admin web dựa vào đó để xoá cookie và đưa về trang đăng nhập. |
| Phân trang | `page` bắt đầu từ 1, mặc định 1. `pageSize` mặc định 10, tối đa 100. Luôn trả `total` là tổng số bản ghi khớp bộ lọc, không phải số bản ghi của trang. |
| Lý do | Các mutation có trường `reason` hoặc `rejectionReason`: cắt khoảng trắng hai đầu, yêu cầu tối thiểu 5 ký tự. |
| Tìm kiếm | Không phân biệt hoa thường và không phân biệt dấu tiếng Việt ("nguyen" khớp "Nguyễn"). |

## 2. Cấu hình hệ thống

### 2.1 Dữ liệu

Bảng `system_settings` theo DBML trong `ROUTESHARE_MASTER_CONTEXT.md`: `id`, `setting_key` (duy nhất), `setting_value` (text), `description`, `updated_by`, `created_at`, `updated_at`.

- Các khoá được tạo sẵn bằng migration hoặc seed. Admin chỉ sửa giá trị, không thêm hay xoá khoá.
- `updated_by` ghi id của admin thực hiện lần sửa gần nhất.

### 2.2 Danh sách khoá và ràng buộc giá trị

| Khoá | Kiểu | Khoảng hợp lệ | Ràng buộc chéo |
| --- | --- | --- | --- |
| `PLATFORM_FEE_PERCENT` | Số thập phân | 0 đến 100 | |
| `MIN_COST_PER_KM` | Số nguyên (đồng) | Lớn hơn 0 | Không lớn hơn `MAX_COST_PER_KM` |
| `MAX_COST_PER_KM` | Số nguyên (đồng) | Lớn hơn 0 | Không nhỏ hơn `MIN_COST_PER_KM` |
| `SEARCH_RADIUS_METERS` | Số nguyên (mét) | 500 đến 50.000 | |
| `MIN_DEPARTURE_LEAD_MINUTES` | Số nguyên (phút) | 0 trở lên | |
| `BOOKING_EXPIRY_MINUTES` | Số nguyên (phút) | 1 trở lên | |
| `NO_SHOW_STRIKE_LIMIT` | Số nguyên (lần) | 1 trở lên | |

Khoảng 500 đến 50.000 mét lấy theo giới hạn `@Min(0.5)` và `@Max(50)` (km) đang có trong `search-trips.input.ts`.

### 2.3 Ràng buộc của API

`adminSystemSettings`
- Trả đủ mọi khoá theo một thứ tự cố định.

`adminUpdateSystemSetting(input: { settingKey, settingValue })`
- Khoá không tồn tại: lỗi "Không tìm thấy cấu hình."
- Giá trị rỗng, không phải số, hoặc âm: lỗi "Giá trị phải là số không âm."
- Vi phạm khoảng hợp lệ hoặc ràng buộc chéo ở mục 2.2: trả lỗi nêu rõ quy tắc bị vi phạm, ví dụ "Giá sàn không được lớn hơn giá trần."
- Lưu giá trị đã chuẩn hoá (`"012"` thành `"12"`) và trả về bản ghi sau khi lưu, gồm `updatedAt` mới.
- Kiểm tra ràng buộc chéo và ghi trong cùng một transaction, để hai admin sửa giá sàn và giá trần cùng lúc không tạo ra trạng thái sàn lớn hơn trần.

### 2.4 Nghiệp vụ phải đọc giá trị từ cấu hình

Đây là phần quyết định trang Cấu hình có tác dụng hay không. Các giá trị dưới đây hiện đang viết cứng trong code:

| Khoá | Vị trí đang viết cứng | Giá trị hiện tại |
| --- | --- | --- |
| `MIN_COST_PER_KM`, `MAX_COST_PER_KM` | `trips/dto/create-trip.input.ts`, `@Min(500)` và `@Max(3000)` trên `costPerKm` | 500 và 3.000 |
| `MIN_DEPARTURE_LEAD_MINUTES` | `trips/trips.service.ts`, `minDepartureTime = now + 15 * 60000` | 15 |
| `SEARCH_RADIUS_METERS` | `trips/trips.service.ts`, `DEFAULT_SEARCH_RADIUS_KM` | 5 km |
| `NO_SHOW_STRIKE_LIMIT` | `drivers/driver-violation.service.ts`, `noShowStrikeCount < 3` | 3 |
| `PLATFORM_FEE_PERCENT` | Chưa có, dùng khi làm module thanh toán | |
| `BOOKING_EXPIRY_MINUTES` | Chưa có, dùng khi làm module đặt chỗ | |

Ràng buộc khi chuyển sang đọc từ cấu hình:

- Giá sàn và giá trần không còn kiểm tra được bằng decorator tĩnh trên DTO; phải kiểm tra trong service sau khi đọc cấu hình.
- Thay đổi chỉ áp dụng cho chuyến và đặt chỗ tạo sau thời điểm sửa. Chuyến đã đăng giữ nguyên giá, kể cả khi giá đó nằm ngoài khoảng mới.
- Phí nền tảng của một đặt chỗ phải được chốt và lưu lại tại thời điểm tính tiền, không tính lại theo cấu hình hiện hành khi xem lại sau này.
- Nếu có cache cấu hình thì phải xoá cache ngay khi `adminUpdateSystemSetting` thành công.

## 3. Ràng buộc các API admin còn lại

### Người dùng

| API | Ràng buộc |
| --- | --- |
| `adminUsers` | Lọc theo `role`, `status`; `search` khớp họ tên, email hoặc số điện thoại. Sắp xếp mới tạo trước. Trả kèm `driverProfile.verificationStatus`. |
| `adminUser` | Không tìm thấy: lỗi "Không tìm thấy người dùng." Trả kèm hồ sơ tài xế, danh sách giấy tờ và phương tiện. |
| `adminSuspendUser` | Chỉ áp dụng cho tài khoản `ACTIVE`. Không khoá được tài khoản `ADMIN`. Bắt buộc có lý do. |
| `adminUnsuspendUser` | Chỉ áp dụng cho tài khoản `SUSPENDED`; không dùng để khôi phục tài khoản `DEACTIVATED`. |

Khoá tài khoản chỉ có ý nghĩa khi backend đồng thời:

- Từ chối `signIn` và `loginWithGoogle` với tài khoản `SUSPENDED`, kèm thông báo tiếng Việt.
- Từ chối các request dùng JWT đã cấp trước khi bị khoá. JWT hiện có hạn 7 ngày, nên cần kiểm tra `status` trong `JwtStrategy` hoặc guard.

### Chuyến đi

| API | Ràng buộc |
| --- | --- |
| `adminTrips` | Lọc theo `status`; `search` khớp tên tài xế hoặc tên điểm dừng. Sắp xếp theo giờ khởi hành, mới nhất trước. Thấy được chuyến của mọi tài xế ở mọi trạng thái. |
| `adminTrip` | Trả `stops` theo `sequenceOrder`, kèm `driver`, `vehicle`, `pricing`. |
| `adminCancelTrip` | Chỉ huỷ được chuyến `PUBLISHED`, theo state machine của chuyến đi. Đặt `status = CANCELLED`, `cancellationReason`, `cancelledBy` là id của admin. Bắt buộc có lý do. |

Khi huỷ chuyến do admin thực hiện:

- Không ghi vi phạm `LATE_CANCELLATION` cho tài xế.
- Huỷ các job nhắc giờ và phát hiện bỏ chuyến đã lên lịch cho chuyến đó.
- Khi có module đặt chỗ: chuyển các đặt chỗ `PENDING` và `CONFIRMED` sang `CANCELLED` và thông báo cho hành khách.

### Vi phạm tài xế

| API | Ràng buộc |
| --- | --- |
| `adminDriverViolations` | Lọc theo `violationType`, `isForgiven`. Sắp xếp mới ghi nhận trước. Cần thêm `@Field` cho `driver` và `trip` trên entity `DriverViolation`. |
| `adminForgiveViolation` | Vi phạm đã tha thì báo lỗi "Vi phạm này đã được tha." Đặt `isForgiven = true`, `forgivenBy` là id của admin, `forgivenReason`. Bắt buộc có lý do. |

Tha một vi phạm `NO_SHOW_WITH_PASSENGERS` phải hoàn tác hậu quả của nó trong cùng transaction, nếu không thao tác tha chỉ đổi nhãn:

- Giảm `noShowStrikeCount` đi 1, không xuống dưới 0.
- Tính lại `suspendedUntil` theo các vi phạm còn hiệu lực.
- Nếu vi phạm đó đã dẫn tới thu hồi quyền tài xế (`REVOKED_DRIVER_LICENSE`) thì khôi phục `verificationStatus = APPROVED`.

### Tổng quan vận hành

`adminOperationsOverview(rangeDays)` thay cho `adminDashboardStats` trong bản hợp đồng trước.

| Hạng mục | Ràng buộc |
| --- | --- |
| `rangeDays` | Chỉ nhận 7, 14 hoặc 30. |
| Kỳ so sánh | Mọi `delta` so kỳ `rangeDays` ngày gần nhất với kỳ liền trước cùng độ dài. Riêng `TRIPS_TODAY` so hôm nay với hôm qua. Kỳ trước bằng 0 thì trả `delta = null`, không trả vô cực hay 0. |
| `kpis` | Đủ 8 phần tử theo thứ tự của `AdminOverviewKpiKey`. `series` luôn có 10 giá trị, cũ trước mới sau. |
| Người dùng | Chỉ đếm tài khoản `role = USER`. |
| Chuyến | Không tính chuyến `DRAFT`. Chuyến được xếp vào ngày theo giờ khởi hành, múi giờ `Asia/Ho_Chi_Minh`. |
| `dailyTrips` | Đúng `rangeDays` phần tử, ngày không có chuyến trả 0. |
| Đặt chỗ | "Đã xác nhận" gồm `CONFIRMED` và `COMPLETED`. "Phản hồi dưới 15 phút" tính từ lúc khách gửi yêu cầu đến lúc tài xế duyệt hoặc từ chối. |
| `safety` | `pendingVerifications` khớp với tổng số phần tử của hai query danh sách chờ duyệt. `overdueVerifications` là hồ sơ chờ quá 24 giờ. |

Các số liệu backend chưa có nguồn dữ liệu:

| Số liệu | Cần bổ sung |
| --- | --- |
| Đặt chỗ, khách hoạt động, ghế đã đặt, chi phí chia sẻ | Module đặt chỗ (`bookings`, `booking_segments`). |
| Tỷ lệ trùng tuyến của một đặt chỗ | Tổng độ dài các chặng khách đi chia cho tổng độ dài lộ trình của chuyến, lưu lại lúc tạo đặt chỗ. |
| Quãng đường đi vòng | Chỉ có nghĩa nếu tài xế được đón trả ngoài các điểm dừng đã khai báo. Với mô hình ghép theo điểm dừng hiện tại, số này luôn bằng 0; nhóm cần quyết định giữ hay bỏ chỉ số. |
| Lượt tìm chuyến, lượt tìm có kết quả | Ghi log mỗi lần gọi `searchTrips` kèm số kết quả trả về. Admin web đang hiển thị số ước lượng cho hai bậc này. |

Bảng "Chuyến gần đây" dùng `adminTrips` với `sortBy = CREATED_AT` và ba bộ lọc `lowMatchOnly`, `hasViolation`, `todayOnly`. Type `Trip` cần thêm bốn trường: `tripCode`, `bookedSeats`, `averageMatchPercent`, `sharedCostTotal`.

### Xuất CSV

Admin web hiện tự tạo file từ dữ liệu mẫu tại `GET /api/export/trips`. Khi nối backend thật, việc xuất phải do backend thực hiện để kiểm soát được quyền và nhật ký.

| Hạng mục | Ràng buộc |
| --- | --- |
| Phạm vi | Xuất đúng kỳ và bộ lọc đang chọn trên trang: `rangeDays` và một trong `all`, `lowMatch`, `hasViolation`, `today`. |
| Dữ liệu cá nhân | Không xuất số điện thoại, email, địa chỉ, ảnh hay số giấy tờ. Điểm đi và điểm đến chỉ ghi tên điểm dừng. |
| Che thông tin | Họ tên giữ họ và viết tắt phần còn lại ("Nguyễn V. A."). Biển số giữ mã tỉnh và hai số cuối ("51H-***.45"). |
| Nhật ký | Mỗi lần xuất ghi lại: admin thực hiện, thời điểm, bộ lọc, số dòng. Ghi cả khi file rỗng. |
| Quyền | Chỉ `ADMIN`. Nếu sau này có nhiều cấp quản trị, quyền xuất tách riêng khỏi quyền xem. |
| File lớn | Trên một ngưỡng số dòng do nhóm chốt, không trả file trực tiếp mà gửi qua email công ty của admin. Admin web chưa làm nhánh này. |
| Định dạng | UTF-8 có BOM để Excel đọc đúng tiếng Việt. Ô bắt đầu bằng `=`, `+`, `-`, `@` phải được thêm dấu nháy đơn phía trước để không bị hiểu là công thức. |

## 4. Điểm cần nhóm chốt

1. **Khoảng giá mỗi km.** Tài liệu kiến trúc ghi 800 đến 2.500 đồng, code đang cho phép 500 đến 3.000. Giá trị seed cho `MIN_COST_PER_KM` và `MAX_COST_PER_KM` theo bên nào?
2. **Bán kính tìm chuyến.** Admin web đang để mẫu 3.000 mét, code dùng mặc định 5 km. Ngoài ra `searchTrips` đang nhận `maxPickupRadiusKm` và `maxDropoffRadiusKm` từ client; cấu hình là giá trị mặc định hay giới hạn trên?
3. **Mức phạt theo số lần bỏ chuyến.** Hiện là tạm khoá 24 giờ ở lần 1, 72 giờ ở lần 2, thu hồi ở lần 3. Nếu `NO_SHOW_STRIKE_LIMIT` đổi thành 5 thì các lần 3 và 4 xử lý thế nào?
4. **Nhật ký thao tác.** Lý do khoá tài khoản hiện không có cột nào lưu, và xuất CSV bắt buộc phải có nhật ký. Nhóm có làm một bảng nhật ký chung cho khoá tài khoản, huỷ chuyến, sửa cấu hình và xuất dữ liệu không?
5. **Chỉ số đi vòng.** Giữ hay bỏ, theo giải thích ở mục Tổng quan vận hành.
