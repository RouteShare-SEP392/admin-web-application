import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, PageHeader } from "@/components/ui/misc";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { ADMIN_MODULES } from "@/lib/admin-modules";

const EXISTING = [
  { title: "Tổng quan", href: "/", status: "API đề xuất / dữ liệu mẫu", detail: "Cần thống kê từ Backend, lọc theo thời gian; không cộng số liệu mẫu vào báo cáo thật." },
  { title: "Người dùng, tài xế và phương tiện", href: "/users", status: "API quản lý đề xuất", detail: "Chi tiết hồ sơ đã có giao diện; danh sách/khóa tài khoản cần API admin và kiểm tra chặn đăng nhập thực tế." },
  { title: "Duyệt hồ sơ tài xế", href: "/verifications/drivers", status: "Có API Backend", detail: "Danh sách chờ duyệt và approve/reject; lịch sử toàn bộ hồ sơ đã duyệt cần bổ sung API." },
  { title: "Duyệt hồ sơ phương tiện", href: "/verifications/vehicles", status: "Có API Backend", detail: "Xét duyệt giấy đăng ký; danh mục toàn bộ xe và lịch sử review chưa đủ." },
  { title: "Chuyến đi", href: "/trips", status: "API admin đề xuất", detail: "Danh sách/chi tiết và milestone trên web không chứng minh adminTrips/adminTrip đã tồn tại ở Backend." },
  { title: "Lịch sử hành trình", href: "/journey-history", status: "Giao diện dùng API chuyến đề xuất", detail: "Tab hoàn thành/hủy/hết hạn, tìm kiếm và phân trang; không bao gồm mọi lịch sử booking cá nhân." },
  { title: "Lịch định kỳ và thay đổi chuyến", href: "/trip-operations", status: "Một phần có API Backend", detail: "adminTripChanges/adminRecurringTemplates/adminRecurringBatchAttempts đã tìm thấy. Cần rà soát riêng các panel/field khác trước khi bật toàn bộ." },
  { title: "Vi phạm", href: "/violations", status: "API quản lý đề xuất", detail: "Backend có nghiệp vụ strike; danh sách và tha vi phạm trên web chưa đồng nghĩa có endpoint admin." },
  { title: "Chi trả tài xế", href: "/payouts", status: "Bản thiết kế tương tác", detail: "Chưa có yêu cầu rút/duyệt/dispatch thật; không chuyển tiền. Ví nguồn chi độc lập ngân hàng thu." },
  { title: "Cấu hình", href: "/settings", status: "Một phần có API Backend", detail: "API typed adminSystemSettings/updateSystemSettings có trong resolver; cần đối chiếu hợp đồng web và catalog từng trường, không mặc định mọi setting hoạt động." },
];

export default function Page() {
  return <>
    <PageHeader title="Phạm vi quản trị & kết nối API" description="Đối chiếu mã nguồn mobile, Backend và web ngày 15/11/2026. Đây là trạng thái khảo sát, không phải kết quả kiểm thử cloud hay thiết bị." />
    <p className="mb-5 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm">Cập nhật sau khảo sát: đã bổ sung code API đọc tổng quan, người dùng, chuyến, booking, thu payOS, đánh giá và thông báo; cấu hình đã đổi sang hợp đồng typed. Các API mới cần chạy Backend phiên bản mới và kiểm thử tích hợp. Bảng khảo sát ban đầu bên dưới ghi nhận khoảng trống trước lượt bổ sung này; chi tiết tiến độ nằm trong docs/admin-coverage.md.</p>
    <Card>
      <CardHeader title="Các phân hệ hiện có" description="Có API Backend vẫn cần cấu hình mock=off/missing, xác thực ADMIN và kiểm thử tích hợp." />
      <Table><thead><tr><Th>Phân hệ</Th><Th>Mức tích hợp</Th><Th>Còn cần hoàn thiện</Th></tr></thead>
        <tbody>{EXISTING.map((item) => <Tr key={item.href}><Td><Link href={item.href} className="font-medium text-brand-700">{item.title}</Link></Td><Td><Badge tone={item.status === "Có API Backend" ? "active" : "pending"}>{item.status}</Badge></Td><Td className="min-w-80 text-muted">{item.detail}</Td></Tr>)}</tbody>
      </Table>
    </Card>
    <Card className="mt-6">
      <CardHeader title="Phân hệ bổ sung từ chức năng mobile" description="Đã có cấu trúc thiết kế; chưa có API admin tổng hợp, không hiển thị dữ liệu giả thành dữ liệu thật." />
      <div className="grid gap-4 p-5 sm:grid-cols-2">{ADMIN_MODULES.map((module) => <Link key={module.slug} href={`/operations/${module.slug}`} className="rounded-xl border border-line p-4 hover:bg-brand-50"><h2 className="font-semibold">{module.title}</h2><p className="mt-2 text-sm text-muted">{module.description}</p><p className="mt-3 text-xs text-amber-800">Thiết kế · cần API và kiểm thử phân quyền</p></Link>)}</div>
    </Card>
    <Card className="mt-6"><CardHeader title="Thứ tự hoàn thiện đề xuất" /><ol className="list-decimal space-y-3 p-6 pl-10 text-sm">
      <li>API admin chỉ đọc cho người dùng, xe/tài xế, chuyến, booking và lịch sử; thêm lọc khoảng thời gian và phân trang phía server.</li>
      <li>Khoản thu/giá chốt/phí đã lưu → khoản phải trả → yêu cầu rút → admin duyệt → chi và đối soát.</li>
      <li>Đánh giá, inbox/push, lịch sử KYC và nhật ký thao tác admin.</li>
      <li>Phản ánh/hỗ trợ, báo cáo theo kỳ và thao tác xử lý mới sau khi chốt chính sách và quyền dữ liệu.</li>
    </ol></Card>
  </>;
}
