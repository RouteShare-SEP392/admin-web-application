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

### Xét duyệt: lịch sử và hồ sơ tài xế

Hai query `adminPending...` hiện có chỉ trả hồ sơ `PENDING`, nên hồ sơ đã xử lý không xem lại được. Ba API dưới đây bổ sung phần đó.

| API | Ràng buộc |
| --- | --- |
| `adminDriverVerifications` | Lọc theo danh sách `statuses` (bỏ trống là mọi trạng thái) và `type`. `search` khớp họ tên, email, số điện thoại của tài xế hoặc số giấy tờ. Hồ sơ đã xử lý xếp theo `reviewedAt` mới nhất trước; hồ sơ chưa xử lý xếp theo `createdAt`. Trả kèm `reviewedBy` và `driverProfile.user`. |
| `adminVehicleVerifications` | Như trên; `search` khớp biển số, hãng xe, dòng xe hoặc họ tên chủ xe. Trả kèm `vehicle.driverProfile.user`. |
| `adminDriverProfile(id)` | `id` là id của `driver_profiles`. Trả hồ sơ kèm `user`, toàn bộ `verifications` và `vehicles`, mỗi xe kèm `verifications` của nó. Không tìm thấy: lỗi "Không tìm thấy hồ sơ tài xế." |

Quyền đọc ảnh và số giấy tờ đã giới hạn cho chủ hồ sơ và `ADMIN`; ba API này phải giữ nguyên giới hạn đó, kể cả với hồ sơ đã bị từ chối.

Trang hồ sơ tài xế cho phép duyệt giấy tờ ngay tại chỗ bằng hai mutation `adminReview...` hiện có. Hai lỗi của các mutation đó cần sửa để trang hoạt động đúng:

- **Giấy tờ xe bị kẹt khi sai hạng bằng lái.** `adminReviewVehicleVerification` lưu giấy tờ thành `APPROVED` trước rồi mới kiểm tra hạng GPLX. Khi kiểm tra thất bại, giấy tờ đã là `APPROVED` nhưng xe chưa được duyệt, và hồ sơ biến mất khỏi hàng chờ. Cần kiểm tra trước khi lưu, hoặc gói cả hai bước trong một transaction.
- **Duyệt lại hồ sơ đã xử lý.** Cả hai mutation không kiểm tra trạng thái hiện tại và nhận mọi giá trị của `VerificationStatus`. Chỉ nên nhận `APPROVED` hoặc `REJECTED`, và chỉ với hồ sơ đang `PENDING`.

### Người dùng

| API | Ràng buộc |
| --- | --- |
| `adminUsers` | Lọc theo `role`, `status`; `search` khớp họ tên, email hoặc số điện thoại. Sắp xếp mới tạo trước. Trả kèm `driverProfile.verificationStatus`. |
| `adminUser` | Không tìm thấy: lỗi "Không tìm thấy người dùng." Trả kèm hồ sơ tài xế, danh sách giấy tờ và phương tiện. |
| `adminSuspendUser` | Chỉ áp dụng cho tài khoản `ACTIVE`. Bắt buộc có lý do. Với tài khoản `ADMIN`: không tự khoá chính mình, và không khoá quản trị viên đang hoạt động cuối cùng. |
| `adminUnsuspendUser` | Chỉ áp dụng cho tài khoản `SUSPENDED`; không dùng để khôi phục tài khoản `DEACTIVATED`. |

Khoá tài khoản chỉ có ý nghĩa khi backend đồng thời:

- Từ chối `signIn` và `loginWithGoogle` với tài khoản `SUSPENDED`, kèm thông báo tiếng Việt.
- Từ chối các request dùng JWT đã cấp trước khi bị khoá. JWT hiện có hạn 7 ngày, nên cần kiểm tra `status` trong `JwtStrategy` hoặc guard.

### Phương tiện

| API | Ràng buộc |
| --- | --- |
| `adminVehicles` | Lọc theo `vehicleType`, `verificationStatus`. `search` khớp biển số, hãng xe, dòng xe hoặc họ tên chủ xe. Sắp xếp mới đăng ký trước. Trả kèm `driverProfile.user`. Thấy được xe ở mọi trạng thái, kể cả xe chủ xe đã tắt (`isActive = false`). |

### Lịch sử của một người dùng

Trang chi tiết người dùng hiển thị ba bảng lịch sử, mỗi bảng 5 dòng một trang.

| Bảng | API | Ràng buộc |
| --- | --- | --- |
| Chuyến đã đăng | `adminTrips` với `driverId` | `driverId` là id của `users`. |
| Vi phạm | `adminDriverViolations` với `driverId` | Trả cả vi phạm đã tha. |
| Chuyến đã đặt | `adminBookings` với `passengerId` | Xem mục Đặt chỗ. |

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
| `safety` | `pendingVerifications` khớp với tổng số phần tử của hai query danh sách chờ duyệt. `overdueVerifications` là hồ sơ chờ quá 24 giờ. `openReports` là báo cáo `OPEN`, `overdueReports` là báo cáo `OPEN` quá 24 giờ, `unresolvedSos` là sự cố chưa có `resolvedAt`. |

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

### Đặt chỗ

Phụ thuộc module đặt chỗ chưa có. Tên trường của `AdminBooking` bám theo bảng `bookings` trong DBML; nếu thiết kế thật khác đi thì báo để admin web sửa theo.

| API | Ràng buộc |
| --- | --- |
| `adminBookings` | Lọc theo `status`, `tripId`, `passengerId`. `search` khớp mã đặt chỗ, mã chuyến hoặc họ tên hành khách. Mới đặt trước. Trả mọi trạng thái, kể cả bị từ chối và hết hạn. |
| `adminBooking` | Trả kèm `passenger`, `trip`, `pickupStop`, `dropoffStop` và `payment` (null nếu chưa có). |

- `pickupStop` và `dropoffStop` là điểm lên và xuống của khách, không phải điểm đầu và cuối của chuyến.
- Phần tiền phải thoả đúng công thức trong tài liệu kiến trúc: `totalAmount = baseAmount - discountAmount`, `platformFee` tính trên `baseAmount`, `driverEarnings = totalAmount - platformFee`. Admin web hiển thị cả năm số và không tự tính lại.
- `fareStatus = ESTIMATED` cho tới khi chuyến kết thúc; sau đó là `FINALIZED` và các số tiền không đổi nữa.
- Quản trị viên chỉ xem. Không có API đặt, sửa hay huỷ đặt chỗ thay người dùng.

### Thanh toán

| Hạng mục | Ràng buộc của `adminPayments` |
| --- | --- |
| Bộ lọc | `status`, `method`. `search` khớp mã đặt chỗ, mã giao dịch hoặc họ tên người trả. Mới tạo trước. |
| `summary` | Tính trên toàn bộ kết quả lọc, không chỉ trang đang xem. `paidAmount` và `platformFee` chỉ cộng giao dịch `PAID`. |
| Đối soát | `settlementStatus` lấy từ bảng `settlements`; null với tiền mặt vì khách đưa thẳng cho tài xế. |
| Thao tác | Chỉ xem. Tài liệu kiến trúc ghi rõ không có ví nội bộ, nên không có API hoàn tiền hay sửa giao dịch. |

### Báo cáo và khiếu nại

| API | Ràng buộc |
| --- | --- |
| `adminReports` | Lọc theo `status`. `search` khớp loại báo cáo, họ tên người báo cáo hoặc người bị báo cáo. `overdueOnly = true` chỉ trả báo cáo `OPEN` gửi quá 24 giờ, cùng mốc với `overdueReports`. Mới gửi trước. |
| `adminReport` | Trả kèm `reporter`, `reportedUser` (có `status` để biết đã bị khoá chưa), `trip`. |
| `adminUpdateReportStatus` | Xem bảng chuyển trạng thái bên dưới. |

| Từ | Sang | Điều kiện |
| --- | --- | --- |
| `OPEN` | `UNDER_REVIEW` | Không cần ghi chú. |
| `OPEN`, `UNDER_REVIEW` | `RESOLVED`, `REJECTED` | Bắt buộc `note` tối thiểu 5 ký tự. Ghi `resolvedBy`, `resolvedAt`. |
| `RESOLVED`, `REJECTED` | bất kỳ | Từ chối: "Báo cáo này đã được đóng." |

- Cần thêm cột ghi chú xử lý vào bảng `reports` (admin web gọi là `resolutionNote`); DBML hiện chưa có.
- Đóng báo cáo không tự động khoá tài khoản. Quản trị viên khoá riêng ở trang người dùng, để hai quyết định có hai dòng nhật ký riêng.
- Cột `type` trong DBML là `varchar` tự do. Nếu app mobile cho chọn từ danh sách cố định thì nên đổi thành enum để lọc và thống kê được.

### SOS

| API | Ràng buộc |
| --- | --- |
| `adminSosEvents` | `resolved` lọc theo đã hoặc chưa xử lý. Sự cố chưa xử lý luôn xếp trên cùng, sau đó mới theo thời gian. Trả kèm `user`, `trip` (có `driver`), và `emergencyContacts` đang bật của người bấm. |
| `adminResolveSosEvent` | Bắt buộc `notes` tối thiểu 5 ký tự. Sự cố đã đóng thì báo lỗi "Sự cố này đã được xử lý." Ghi `resolvedAt` và người xử lý. |

- Cần thêm cột người xử lý vào `sos_events` (admin web gọi là `resolvedBy`); DBML hiện chỉ có `resolved_at` và `notes`.
- `latitude`, `longitude` tách từ `current_location`. Admin web hiện toạ độ và link Google Maps, chưa có bản đồ nhúng.
- Admin web hỏi lại danh sách mỗi 30 giây. Khi có sự cố mới, backend nên gửi thêm thông báo đẩy cho quản trị viên; không nên chỉ dựa vào việc có người đang mở trang.
- Số điện thoại của người dùng, tài xế và liên hệ khẩn cấp được trả đầy đủ ở API này, vì quản trị viên phải gọi ngay.

### Quản trị viên

Danh sách dùng `adminUsers` với `role = ADMIN`; khoá và mở khoá dùng `adminSuspendUser`, `adminUnsuspendUser`.

| Hạng mục | Ràng buộc của `adminCreateAdmin` |
| --- | --- |
| Kiểm tra | Họ tên tối thiểu 2 ký tự. Email đúng định dạng và chưa được dùng: lỗi "Email này đã được dùng cho một tài khoản khác." Mật khẩu tối thiểu 8 ký tự. |
| Kết quả | Tạo tài khoản `role = ADMIN`, `status = ACTIVE`. Không gửi mật khẩu qua email; quản trị viên tạo tự chuyển cho người mới. |
| Nhật ký | Ghi `ADMIN_CREATED`, không ghi mật khẩu. |

Nên buộc người mới đổi mật khẩu ở lần đăng nhập đầu; admin web chưa có luồng này.

### Nhật ký thao tác

`adminAuditLogs` trả các dòng nhật ký, mới nhất trước. Lọc theo `action`, `actorId`; `search` khớp tên đối tượng, tên người thực hiện và chi tiết.

| Hạng mục | Ràng buộc |
| --- | --- |
| Thời điểm ghi | Trong cùng transaction với thao tác. Thao tác thất bại thì không có dòng nhật ký; thao tác thành công thì luôn có. |
| Bất biến | Chỉ thêm. Không có API sửa hay xoá, kể cả cho `ADMIN`. |
| Người thực hiện | Lấy từ `@CurrentUser()`, không nhận từ client. |
| `targetLabel` | Lưu tên đối tượng tại thời điểm thao tác (ví dụ "GPLX của Nguyễn Văn An"), để nhật ký vẫn đọc được khi đối tượng bị đổi tên hoặc xoá. |
| `detail` | Lý do với thao tác có lý do; "giá trị cũ → giá trị mới" với sửa cấu hình; kỳ, bộ lọc và số dòng với xuất dữ liệu. Không ghi mật khẩu, token hay số giấy tờ. |

Các thao tác phải ghi nhật ký, theo `AdminAuditAction`:

| Thao tác | `targetType` | `targetId` |
| --- | --- | --- |
| Duyệt, từ chối giấy tờ tài xế | `DRIVER_PROFILE` | id hồ sơ tài xế |
| Duyệt, từ chối giấy tờ xe | `DRIVER_PROFILE` | id hồ sơ tài xế của chủ xe |
| Khoá, mở khoá tài khoản | `USER` | id người dùng |
| Huỷ chuyến | `TRIP` | id chuyến |
| Tha vi phạm | `VIOLATION` | id vi phạm |
| Sửa cấu hình | `SETTING` | id cấu hình |
| Xuất dữ liệu | `EXPORT` | null |
| Đổi mật khẩu | `ACCOUNT` | null |
| Nhận, giải quyết, bác bỏ báo cáo | `REPORT` | id báo cáo |
| Đóng sự cố SOS | `SOS` | id sự cố |
| Thêm quản trị viên | `USER` | id tài khoản mới |

Bốn mutation duyệt KYC hiện có cũng cần ghi nhật ký; hiện chúng chỉ lưu `reviewedBy` trên giấy tờ.

### Tài khoản của tôi

Trang dùng `me` (đã có) và `changePassword` (chưa có; backend hiện chỉ có luồng đặt lại mật khẩu qua OTP email).

| Hạng mục | Ràng buộc của `changePassword` |
| --- | --- |
| Phạm vi | Đổi mật khẩu của chính người đang đăng nhập; dùng được cho mọi vai trò, không riêng `ADMIN`. |
| Kiểm tra | Mật khẩu hiện tại phải đúng: lỗi "Mật khẩu hiện tại không đúng." Mật khẩu mới tối thiểu 8 ký tự và khác mật khẩu hiện tại. |
| Chống dò | Giới hạn số lần thử sai mật khẩu hiện tại, tương tự giới hạn OTP đang có. |
| Phiên cũ | Sau khi đổi, các JWT cấp trước đó nên mất hiệu lực. Hiện backend không có cơ chế thu hồi token, đây là điểm cần làm cùng lúc. |
| Tài khoản Google | Tài khoản tạo bằng Google không có mật khẩu: trả lỗi nêu rõ thay vì báo sai mật khẩu. |
| Nhật ký | Ghi `PASSWORD_CHANGED`, không ghi mật khẩu. |

## 4. Điểm cần nhóm chốt

1. **Khoảng giá mỗi km.** Tài liệu kiến trúc ghi 800 đến 2.500 đồng, code đang cho phép 500 đến 3.000. Giá trị seed cho `MIN_COST_PER_KM` và `MAX_COST_PER_KM` theo bên nào?
2. **Bán kính tìm chuyến.** Admin web đang để mẫu 3.000 mét, code dùng mặc định 5 km. Ngoài ra `searchTrips` đang nhận `maxPickupRadiusKm` và `maxDropoffRadiusKm` từ client; cấu hình là giá trị mặc định hay giới hạn trên?
3. **Mức phạt theo số lần bỏ chuyến.** Hiện là tạm khoá 24 giờ ở lần 1, 72 giờ ở lần 2, thu hồi ở lần 3. Nếu `NO_SHOW_STRIKE_LIMIT` đổi thành 5 thì các lần 3 và 4 xử lý thế nào?
4. **Nhật ký thao tác.** Lý do khoá tài khoản hiện không có cột nào lưu, và xuất CSV bắt buộc phải có nhật ký. Admin web đã có trang Nhật ký với hợp đồng `adminAuditLogs`; nhóm xác nhận làm một bảng nhật ký chung theo hợp đồng đó, hay đề xuất cấu trúc khác?
5. **Chỉ số đi vòng.** Giữ hay bỏ, theo giải thích ở mục Tổng quan vận hành.
