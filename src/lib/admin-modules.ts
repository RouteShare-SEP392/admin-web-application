export type AdminCapability = "backend" | "proposed" | "design";
export interface AdminModule {
  slug: string;
  title: string;
  capability: AdminCapability;
  description: string;
  tabs: { title: string; fields: string[] }[];
  safeguards: string[];
}

export const ADMIN_MODULES: AdminModule[] = [
  {
    slug: "bookings", title: "Đặt chỗ", capability: "design",
    description: "Tra cứu từng đặt chỗ của hành khách, nối với chuyến, giá chốt và các mốc đón/trả.",
    tabs: [
      { title: "Danh sách đặt chỗ", fields: ["Mã đặt chỗ, hành khách, tài xế, chuyến liên quan", "Đoạn đón → trả, số ghế, giờ hẹn đã lưu", "Chờ duyệt, xác nhận, hủy, từ chối, hết hạn và các trạng thái thực tế từ Backend"] },
      { title: "Lịch sử và sự kiện", fields: ["Thời điểm gửi/duyệt/hủy và người thực hiện", "Đến điểm đón, lên xe, xuống xe, báo vắng", "Trả sớm có đồng thuận và sự cố; không suy ra lỗi từ trạng thái"] },
      { title: "Giá và khoản thu", fields: ["Giá ước tính tách riêng giá đã chốt", "Phân bổ theo đoạn, phí nền tảng đã lưu", "Khoản chưa thu, tiền mặt, online và liên kết giao dịch"] },
    ],
    safeguards: ["Admin không nhập mã lên xe hoặc xác nhận lên/xuống xe thay người tham gia.", "Không ghi đè giá chốt hoặc sự kiện lịch sử. API mobile chỉ dành chủ sở hữu không được dùng làm API admin."],
  },
  {
    slug: "payments", title: "Thu tiền & đối soát", capability: "design",
    description: "Theo dõi thu khách độc lập với khoản tài xế được nhận và lệnh chi tài xế.",
    tabs: [
      { title: "Giao dịch thu", fields: ["Booking, người trả, số tiền VND, kênh tiền mặt/payOS/ZaloPay cũ", "Từng lần thử thanh toán, mã đơn, hạn thanh toán", "Trạng thái nhận tiền từ Backend/provider, không dựa vào redirect"] },
      { title: "Đối soát", fields: ["Giao dịch pending, quá hạn, chưa rõ kết quả hoặc lệch số tiền", "Lần tra cứu gần nhất, kết quả chữ ký và mã tham chiếu an toàn", "Giữ lịch sử provider cũ; không tạo đơn thu mới nếu khoản đã thanh toán"] },
      { title: "Khoản phải trả tài xế", fields: ["Khoản online đã thu và chuyến đủ điều kiện", "Phí đã lưu, có thể rút, đang giữ, đã chi", "Liên kết yêu cầu rút; tiền mặt không tạo chi trả trùng"] },
    ],
    safeguards: ["Không có nút tự đánh dấu đã thanh toán/hoàn tiền/đã chi.", "Tiền thu về ngân hàng không đồng nghĩa ví Bảo Kim đã có nguồn chi. Chỉ báo hoàn tiền sau khi có luồng và xác nhận provider hợp lệ."],
  },
  {
    slug: "reviews", title: "Đánh giá hành trình", capability: "design",
    description: "Tra cứu đánh giá hai chiều và kiểm tra bằng chứng khi có phản ánh; không tự sửa điểm sao.",
    tabs: [
      { title: "Đánh giá đã gửi", fields: ["Người đánh giá, người được đánh giá, vai trò và booking", "Điểm sao, nội dung, ngày gửi", "Tìm theo người dùng, chuyến; lọc vai trò, điểm sao, khoảng thời gian"] },
      { title: "Chất lượng dịch vụ", fields: ["Số đánh giá thực tế theo từng vai trò", "Đánh giá thấp 1–2 sao và lý do đã lưu", "Liên kết chi tiết hành trình; không suy ra điểm từ số chuyến"] },
    ],
    safeguards: ["API lịch sử đánh giá cá nhân không phải API admin toàn hệ thống.", "Chính sách ẩn/gỡ đánh giá chưa được duyệt; chưa cung cấp nút xóa, sửa sao hoặc viết đánh giá thay người dùng."],
  },
  {
    slug: "notifications", title: "Thông báo & giao nhận", capability: "design",
    description: "Theo dõi thông báo trong app và tiến trình gửi push theo sự kiện nghiệp vụ.",
    tabs: [
      { title: "Lịch sử thông báo", fields: ["Người nhận, loại sự kiện, tiêu đề, thực thể liên quan", "Thời điểm ghi inbox, trạng thái đã đọc thực tế", "Lọc theo thời gian/người nhận và booking/chuyến"] },
      { title: "Giao nhận push", fields: ["Outbox, đang đợi, retry, thất bại, provider đã nhận", "Lần thử, thời gian gửi, lỗi đã che thông tin nhạy cảm", "Không hiển thị FCM token hoặc bí mật nhà cung cấp"] },
    ],
    safeguards: ["Provider nhận push không có nghĩa điện thoại đã nhận hoặc người dùng đã đọc.", "Gửi thông báo hàng loạt và retry thủ công cần chính sách quyền hạn, giới hạn tần suất, chống trùng và audit trước khi bật."],
  },
  {
    slug: "support", title: "Hỗ trợ & phản ánh", capability: "design",
    description: "Đề xuất bổ sung tiếp nhận phản ánh gắn với người dùng và hành trình; Backend hiện chưa có module ticket.",
    tabs: [
      { title: "Hồ sơ phản ánh", fields: ["Mã hồ sơ, người gửi, booking/chuyến và loại vấn đề", "Nội dung, bằng chứng được phép truy cập", "Mới tiếp nhận, đang xử lý, cần bổ sung, đã giải quyết"] },
      { title: "Xử lý và kết luận", fields: ["Người phụ trách, ghi chú nội bộ và lịch sử liên hệ", "Kết luận, lý do và thời gian xử lý", "Liên kết vi phạm hoặc đối soát; không tự áp lỗi/hoàn tiền"] },
    ],
    safeguards: ["Đây là đề xuất sản phẩm mới, chưa có kênh gửi phản ánh trên mobile hoặc cơ chế khẩn cấp đã xác minh.", "Không đọc tin nhắn riêng, danh bạ khẩn cấp hay GPS lịch sử hàng loạt để thay cho bằng chứng có quyền truy cập."],
  },
  {
    slug: "audit", title: "Nhật ký quản trị", capability: "design",
    description: "Theo dõi ai đã thực hiện thao tác quản trị nào, trên dữ liệu nào và vì lý do gì.",
    tabs: [
      { title: "Thao tác quản trị", fields: ["Admin, hành động, thực thể, thời điểm và correlation ID", "Giá trị trước/sau đã che dữ liệu nhạy cảm và lý do", "Lọc theo admin, hành động, thực thể, khoảng thời gian"] },
      { title: "Thao tác nhạy cảm", fields: ["Duyệt KYC, thay đổi cấu hình, khóa/mở tài khoản", "Duyệt/từ chối rút và tham chiếu lệnh chi", "Lưu bằng chứng truy cập có kiểm soát; không chứa token, OTP, số giấy tờ thô"] },
    ],
    safeguards: ["Chưa có kho nhật ký quản trị tổng hợp; lịch sử thay đổi chuyến hiện có chỉ là một phần.", "Không cung cấp sửa/xóa audit log hoặc phân quyền mới ngoài ADMIN/USER khi chưa có thiết kế Backend tương ứng."],
  },
];
