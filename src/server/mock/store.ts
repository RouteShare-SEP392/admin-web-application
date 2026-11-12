import { MOCK_ADMIN_CREDENTIALS } from "@/lib/mock-mode";
import { MOCK_ADMIN_CREDENTIALS } from "@/lib/mock-mode";
import type {
  AuditLog,
  EmergencyContact,
  PaymentMethod,
  PaymentStatus,
  ReportStatus,
  SettlementStatus,
  AuditLog,
  EmergencyContact,
  PaymentMethod,
  PaymentStatus,
  ReportStatus,
  SettlementStatus,
  DriverProfile,
  DriverVerification,
  DriverViolation,
  LuggageCapacity,
  PenaltyAction,
  SystemSetting,
  Trip,
  TripBookingMilestone,
  TripStatus,
  User,
  Vehicle,
  VehicleType,
  VehicleVerification,
  VerificationStatus,
  ViolationType,
} from "@/lib/types";

/**
 * Kho dữ liệu mẫu trong bộ nhớ. Thao tác duyệt/khoá/huỷ thay đổi trực tiếp kho
 * này nên giao diện cập nhật theo; khởi động lại server thì trở về dữ liệu gốc.
 */
export interface MockStore {
  users: User[];
  driverVerifications: DriverVerification[];
  vehicles: Vehicle[];
  vehicleVerifications: VehicleVerification[];
  trips: Trip[];
  violations: DriverViolation[];
  settings: SystemSetting[];
  bookings: MockBooking[];
  auditLogs: AuditLog[];
  /** Mật khẩu của các tài khoản quản trị mẫu, theo id người dùng. */
  credentials: Record<string, string>;
  payments: MockPayment[];
  reports: MockReport[];
  sosEvents: MockSosEvent[];
  emergencyContacts: (EmergencyContact & { userId: string })[];
}

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"
  | "EXPIRED";

/** Đặt chỗ rút gọn: backend chưa có module booking, lớp mock chỉ giữ đủ để tính chỉ số. */
export interface MockBooking {
  id: string;
  /** Mã ngắn để đọc và tra cứu, ví dụ BK-20417. */
  code: string;
  tripId: string;
  passengerId: string;
  seats: number;
  status: BookingStatus;
  createdAt: number;
  respondedAt: number | null;
  /** Phần trăm lộ trình của tài xế mà khách đi cùng. */
  overlapPercent: number;
  /** Quãng đường tài xế phải đi thêm để đón và trả khách này. */
  detourKm: number;
  /** Phần chi phí khách này chia sẻ. */
  amount: number;
}

/** Thanh toán rút gọn; số tiền được suy ra từ đặt chỗ khi trả về cho giao diện. */
export interface MockPayment {
  id: string;
  bookingId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionReference: string | null;
  createdAt: number;
  paidAt: number | null;
  settlementStatus: SettlementStatus | null;
  settledAt: number | null;
}

export interface MockReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  tripId: string | null;
  type: string;
  description: string;
  status: ReportStatus;
  resolutionNote: string | null;
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface MockSosEvent {
  id: string;
  userId: string;
  tripId: string | null;
  latitude: number;
  longitude: number;
  triggeredAt: string;
  resolvedAt: string | null;
  resolvedById: string | null;
  notes: string | null;
}

/** Đặt chỗ đang giữ ghế hoặc đã đi xong. */
export function isActiveBooking(status: BookingStatus): boolean {
  return status === "PENDING" || status === "CONFIRMED" || status === "COMPLETED";
  bookings: MockBooking[];
  auditLogs: AuditLog[];
  /** Mật khẩu của các tài khoản quản trị mẫu, theo id người dùng. */
  credentials: Record<string, string>;
  payments: MockPayment[];
  reports: MockReport[];
  sosEvents: MockSosEvent[];
  emergencyContacts: (EmergencyContact & { userId: string })[];
}

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"
  | "EXPIRED";

/** Đặt chỗ rút gọn: backend chưa có module booking, lớp mock chỉ giữ đủ để tính chỉ số. */
export interface MockBooking {
  id: string;
  /** Mã ngắn để đọc và tra cứu, ví dụ BK-20417. */
  code: string;
  tripId: string;
  passengerId: string;
  seats: number;
  status: BookingStatus;
  createdAt: number;
  respondedAt: number | null;
  /** Phần trăm lộ trình của tài xế mà khách đi cùng. */
  overlapPercent: number;
  /** Quãng đường tài xế phải đi thêm để đón và trả khách này. */
  detourKm: number;
  /** Phần chi phí khách này chia sẻ. */
  amount: number;
}

/** Thanh toán rút gọn; số tiền được suy ra từ đặt chỗ khi trả về cho giao diện. */
export interface MockPayment {
  id: string;
  bookingId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionReference: string | null;
  createdAt: number;
  paidAt: number | null;
  settlementStatus: SettlementStatus | null;
  settledAt: number | null;
}

export interface MockReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  tripId: string | null;
  type: string;
  description: string;
  status: ReportStatus;
  resolutionNote: string | null;
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface MockSosEvent {
  id: string;
  userId: string;
  tripId: string | null;
  latitude: number;
  longitude: number;
  triggeredAt: string;
  resolvedAt: string | null;
  resolvedById: string | null;
  notes: string | null;
}

/** Đặt chỗ đang giữ ghế hoặc đã đi xong. */
export function isActiveBooking(status: BookingStatus): boolean {
  return status === "PENDING" || status === "CONFIRMED" || status === "COMPLETED";
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
export const VN_OFFSET = 7 * HOUR;
export const VN_OFFSET = 7 * HOUR;

const NAMES = [
  "Nguyễn Văn An",
  "Trần Thị Bích",
  "Lê Hoàng Cường",
  "Phạm Thu Dung",
  "Hoàng Minh Đức",
  "Vũ Thị Giang",
  "Đặng Quốc Hải",
  "Bùi Thanh Hương",
  "Đỗ Gia Khánh",
  "Ngô Thị Lan",
  "Dương Tuấn Minh",
  "Lý Thảo Nguyên",
  "Phan Đình Phúc",
  "Trịnh Mai Quỳnh",
  "Hồ Anh Sơn",
  "Đinh Thị Tâm",
  "Mai Xuân Trường",
  "Cao Thùy Uyên",
  "Lâm Chí Vinh",
  "Tạ Hải Yến",
  "Võ Nhật Huy",
  "Châu Ngọc Ánh",
  "Tô Bảo Long",
  "Kiều Diễm My",
  "Quách Thành Nam",
  "La Phương Thảo",
  "Thái Đức Thịnh",
];

// Trạng thái hồ sơ tài xế của 12 người dùng đầu tiên.
const DRIVER_STATUSES: VerificationStatus[] = [
  "APPROVED",
  "APPROVED",
  "APPROVED",
  "APPROVED",
  "APPROVED",
  "APPROVED",
  "APPROVED",
  "PENDING",
  "PENDING",
  "PENDING",
  "REJECTED",
  "PENDING",
];

const VEHICLE_MODELS: [string, string, string, VehicleType, number][] = [
  ["Toyota", "Vios", "Trắng", "CAR_4_SEATS", 4],
  ["VinFast", "VF 8", "Xanh rêu", "CAR_4_SEATS", 4],
  ["Mitsubishi", "Xpander", "Bạc", "CAR_7_SEATS", 7],
  ["Honda", "City", "Đen", "CAR_4_SEATS", 4],
  ["Kia", "Carnival", "Xám", "CAR_7_SEATS", 7],
  ["Hyundai", "Accent", "Đỏ", "CAR_4_SEATS", 4],
  ["Mazda", "CX-5", "Trắng", "CAR_4_SEATS", 4],
  ["Toyota", "Innova", "Nâu", "CAR_7_SEATS", 7],
  ["VinFast", "VF 5", "Vàng", "CAR_4_SEATS", 4],
  ["Ford", "Everest", "Đen", "CAR_7_SEATS", 7],
  ["Honda", "Wave Alpha", "Đỏ", "MOTORBIKE", 2],
  ["Hyundai", "Santa Fe", "Xanh đen", "CAR_7_SEATS", 7],
];

type RouteStop = [name: string, address: string, lat: number, lng: number];

const ROUTES: { km: number; minutes: number; stops: RouteStop[] }[] = [
  {
    km: 96,
    minutes: 125,
    stops: [
      ["Landmark 81", "720A Điện Biên Phủ, Bình Thạnh, TP.HCM", 10.7949, 106.7219],
      ["Ngã tư Vũng Tàu", "Quốc lộ 51, Biên Hòa, Đồng Nai", 10.904, 106.848],
      ["Bà Rịa", "Cách Mạng Tháng Tám, TP. Bà Rịa", 10.4963, 107.1684],
      ["Bãi Sau", "Thùy Vân, TP. Vũng Tàu", 10.334, 107.0843],
    ],
  },
  {
    km: 308,
    minutes: 420,
    stops: [
      ["Bến xe Miền Đông", "292 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM", 10.8148, 106.7107],
      ["Ngã ba Dầu Giây", "Quốc lộ 1A, Thống Nhất, Đồng Nai", 10.942, 107.141],
      ["Bảo Lộc", "Trần Phú, TP. Bảo Lộc, Lâm Đồng", 11.548, 107.8077],
      ["Chợ Đà Lạt", "Nguyễn Thị Minh Khai, TP. Đà Lạt", 11.9428, 108.437],
    ],
  },
  {
    km: 120,
    minutes: 110,
    stops: [
      ["Bến xe Mỹ Đình", "20 Phạm Hùng, Nam Từ Liêm, Hà Nội", 21.0285, 105.778],
      ["Hải Dương", "Đại lộ Võ Nguyên Giáp, TP. Hải Dương", 20.9373, 106.3146],
      ["Nhà hát lớn Hải Phòng", "Quang Trung, Hồng Bàng, Hải Phòng", 20.861, 106.683],
    ],
  },
  {
    km: 95,
    minutes: 130,
    stops: [
      ["Cầu Rồng", "Nguyễn Văn Linh, Hải Châu, Đà Nẵng", 16.061, 108.227],
      ["Lăng Cô", "Quốc lộ 1A, Phú Lộc, Thừa Thiên Huế", 16.229, 108.083],
      ["Đại Nội Huế", "Đường 23 Tháng 8, TP. Huế", 16.469, 107.579],
    ],
  },
  {
    km: 165,
    minutes: 200,
    stops: [
      ["Bến xe Miền Tây", "395 Kinh Dương Vương, Bình Tân, TP.HCM", 10.7405, 106.619],
      ["Mỹ Tho", "Ấp Bắc, TP. Mỹ Tho, Tiền Giang", 10.36, 106.36],
      ["Vĩnh Long", "Phạm Thái Bường, TP. Vĩnh Long", 10.253, 105.972],
      ["Bến Ninh Kiều", "Hai Bà Trưng, Ninh Kiều, Cần Thơ", 10.034, 105.788],
    ],
  },
  {
    km: 93,
    minutes: 100,
    stops: [
      ["Bến xe Giáp Bát", "Giải Phóng, Hoàng Mai, Hà Nội", 20.9805, 105.8412],
      ["Phủ Lý", "Lê Hoàn, TP. Phủ Lý, Hà Nam", 20.541, 105.914],
      ["Tràng An", "Trường Yên, Hoa Lư, Ninh Bình", 20.253, 105.918],
    ],
  },
  {
    km: 32,
    minutes: 60,
    stops: [
      ["Vincom Biên Hòa", "1096 Phạm Văn Thuận, Biên Hòa, Đồng Nai", 10.951, 106.823],
      ["Suối Tiên", "Xa lộ Hà Nội, TP. Thủ Đức, TP.HCM", 10.866, 106.803],
      ["Chợ Bến Thành", "Lê Lợi, Quận 1, TP.HCM", 10.7725, 106.698],
    ],
  },
];

const DRIVER_NOTES = [
  "Xe sạch, không hút thuốc. Vui lòng có mặt trước giờ đi 5 phút.",
  "Đi cao tốc, có dừng nghỉ 10 phút ở trạm.",
  "Nhận hành lý vừa, không chở thú cưng.",
  null,
  "Mình đi công tác hằng tuần, bạn nào tiện đường thì đi chung.",
  null,
];

/** Bộ sinh số giả ngẫu nhiên có hạt giống để dữ liệu mẫu ổn định giữa các lần chạy. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stripDiacritics(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

function mockId(prefix: string, index: number): string {
  return `${prefix}-0000-4000-8000-${pad(index, 12)}`;
}

function createStore(): MockStore {
  const rand = mulberry32(20261010);
  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];
  const between = (min: number, max: number) =>
    Math.floor(min + rand() * (max - min + 1));

  const admin: User = {
    id: mockId("a0000000", 1),
    fullName: "Quản trị viên RouteShare",
    email: "admin@routeshare.vn",
    phone: "0900000001",
    avatarUrl: null,
    bio: null,
    dateOfBirth: null,
    gender: null,
    role: "ADMIN",
    status: "ACTIVE",
    isPhoneVerified: true,
    isIdentityVerified: true,
    isDriverApproved: false,
    ratingAsDriver: 5,
    ratingAsPassenger: 5,
    totalRidesAsDriver: 0,
    totalRidesAsPassenger: 0,
    createdAt: iso(now - 120 * DAY),
    updatedAt: iso(now - 120 * DAY),
    driverProfile: null,
  };

  const users: User[] = [admin];
  const driverVerifications: DriverVerification[] = [];
  const vehicles: Vehicle[] = [];
  const vehicleVerifications: VehicleVerification[] = [];

  NAMES.forEach((fullName, i) => {
    const parts = stripDiacritics(fullName).toLowerCase().split(" ");
    // Sáu người cuối đăng ký trong 7 ngày gần nhất để biểu đồ có dữ liệu.
    const createdAt =
      i >= NAMES.length - 6
        ? now - between(0, 6) * DAY - between(1, 20) * HOUR
        : now - between(8, 90) * DAY - between(0, 23) * HOUR;
    const isDriver = i < DRIVER_STATUSES.length;
    const user: User = {
      id: mockId("u0000000", i + 1),
      fullName,
      email: `${parts[parts.length - 1]}.${parts[0]}${i + 1}@gmail.com`,
      phone: i % 9 === 8 ? null : `09${pad(10000000 + between(0, 89999999), 8)}`,
      avatarUrl: null,
      bio: null,
      dateOfBirth: `${between(1978, 2003)}-${pad(between(1, 12), 2)}-${pad(between(1, 28), 2)}`,
      gender: i % 2 === 0 ? "MALE" : "FEMALE",
      role: "USER",
      status: i === 14 || i === 19 ? "SUSPENDED" : i === 22 ? "DEACTIVATED" : "ACTIVE",
      isPhoneVerified: i % 9 !== 8,
      isIdentityVerified: isDriver && DRIVER_STATUSES[i] === "APPROVED",
      isDriverApproved: isDriver && DRIVER_STATUSES[i] === "APPROVED",
      ratingAsDriver: 5,
      ratingAsPassenger: Number((4.2 + rand() * 0.8).toFixed(2)),
      totalRidesAsDriver: 0,
      totalRidesAsPassenger: between(0, 24),
      createdAt: iso(createdAt),
      updatedAt: iso(createdAt),
      driverProfile: null,
    };
    users.push(user);
    if (!isDriver) return;

    const status = DRIVER_STATUSES[i];
    const profileCreatedAt = createdAt + between(1, 30) * HOUR;
    const profile: DriverProfile = {
      id: mockId("d0000000", i + 1),
      bio: null,
      experienceYears: between(1, 15),
      noShowStrikeCount: 0,
      rejectionReason:
        status === "REJECTED" ? "Ảnh giấy phép lái xe bị mờ, không đọc được số." : null,
      suspendedUntil: null,
      verificationStatus: status,
      verifiedAt: status === "APPROVED" ? iso(profileCreatedAt + DAY) : null,
      createdAt: iso(profileCreatedAt),
      updatedAt: iso(profileCreatedAt),
      user,
      vehicles: [],
      verifications: [],
    };
    user.driverProfile = profile;

    // Tài xế thứ 12 mới nộp CCCD; tài xế thứ 10 đã được duyệt CCCD, còn chờ GPLX.
    const docTypes =
      i === 11
        ? (["IDENTITY_CARD"] as const)
        : (["IDENTITY_CARD", "DRIVER_LICENSE"] as const);
    docTypes.forEach((type, d) => {
      let docStatus: VerificationStatus = status;
      if (i === 9 && type === "IDENTITY_CARD") docStatus = "APPROVED";
      if (status === "REJECTED" && type === "IDENTITY_CARD") docStatus = "APPROVED";
      const submittedAt =
        docStatus === "PENDING"
          ? now - between(2, 70) * HOUR
          : profileCreatedAt + 2 * HOUR;
      const reviewed = docStatus === "APPROVED" || docStatus === "REJECTED";
      const doc: DriverVerification = {
        id: mockId("dv000000", i * 2 + d + 1),
        type,
        licenseClass:
          type === "DRIVER_LICENSE" ? pick(["B1", "B2", "B", "C", "D"]) : null,
        documentNumber:
          type === "IDENTITY_CARD"
            ? `0${pad(between(10000000000, 99999999999), 11)}`
            : `${pad(between(100000000000, 999999999999), 12)}`,
        frontPhotoUrl: "/mock/document-front.svg",
        backPhotoUrl: "/mock/document-back.svg",
        status: docStatus,
        rejectReason: docStatus === "REJECTED" ? profile.rejectionReason : null,
        reviewedAt: reviewed ? iso(submittedAt + 20 * HOUR) : null,
        reviewedBy: reviewed ? admin : null,
        createdAt: iso(submittedAt),
        updatedAt: iso(submittedAt),
        driverProfile: profile,
      };
      driverVerifications.push(doc);
      profile.verifications!.push(doc);
    });
  });

  const addVehicle = (
    driverIndex: number,
    modelIndex: number,
    status: VerificationStatus,
  ) => {
    const profile = users[driverIndex + 1].driverProfile!;
    const [make, model, color, vehicleType, seatCapacity] =
      VEHICLE_MODELS[modelIndex];
    const index = vehicles.length + 1;
    const submittedAt =
      status === "PENDING"
        ? now - between(3, 60) * HOUR
        : Date.parse(profile.createdAt) + 5 * HOUR;
    const reviewed = status === "APPROVED" || status === "REJECTED";
    const rejectReason =
      status === "REJECTED"
        ? "Biển số trên giấy đăng ký không khớp với biển số đã khai báo."
        : null;
    const vehicle: Vehicle = {
      id: mockId("v0000000", index),
      make,
      model,
      color,
      year: between(2016, 2025),
      plateNumber: `${pick(["51H", "51K", "30G", "43A", "60A", "29A"])}-${pad(between(100, 999), 3)}.${pad(between(0, 99), 2)}`,
      vehicleType,
      seatCapacity,
      photoUrl: null,
      comfortFeatures: ["Máy lạnh", "Cổng sạc USB"],
      isActive: status === "APPROVED",
      verificationStatus: status,
      rejectReason,
      verifiedAt: status === "APPROVED" ? iso(submittedAt + 12 * HOUR) : null,
      createdAt: iso(submittedAt),
      updatedAt: iso(submittedAt),
      driverProfile: profile,
      verifications: [],
    };
    const doc: VehicleVerification = {
      id: mockId("vv000000", index),
      documentType: "VEHICLE_REGISTRATION",
      documentNumber: pad(between(100000, 999999), 6),
      frontPhotoUrl: "/mock/document-front.svg",
      backPhotoUrl: "/mock/document-back.svg",
      status,
      rejectReason,
      reviewedAt: reviewed ? iso(submittedAt + 12 * HOUR) : null,
      reviewedBy: reviewed ? admin : null,
      createdAt: iso(submittedAt),
      updatedAt: iso(submittedAt),
      vehicle,
    };
    vehicle.verifications!.push(doc);
    profile.vehicles!.push(vehicle);
    vehicles.push(vehicle);
    vehicleVerifications.push(doc);
  };

  for (let i = 0; i < 7; i++) addVehicle(i, i, "APPROVED");
  addVehicle(0, 10, "PENDING");
  addVehicle(2, 7, "PENDING");
  addVehicle(4, 8, "REJECTED");
  addVehicle(7, 9, "PENDING");
  addVehicle(8, 11, "PENDING");

  const trips: Trip[] = [];
  const bookings: MockBooking[] = [];
  // users[0] là admin, users[1..12] có hồ sơ tài xế, phần còn lại đóng vai hành khách.
  const passengerIds = users.slice(13).map((u) => u.id);
  const startOfToday = Math.floor((now + VN_OFFSET) / DAY) * DAY - VN_OFFSET;

  const addTrip = (departure: number) => {
    const i = trips.length;
  const bookings: MockBooking[] = [];
  // users[0] là admin, users[1..12] có hồ sơ tài xế, phần còn lại đóng vai hành khách.
  const passengerIds = users.slice(13).map((u) => u.id);
  const startOfToday = Math.floor((now + VN_OFFSET) / DAY) * DAY - VN_OFFSET;

  const addTrip = (departure: number) => {
    const i = trips.length;
    const driverIndex = i % 7;
    const driver = users[driverIndex + 1];
    const vehicle = vehicles[driverIndex];
    const route = pick(ROUTES);
    const stops = rand() < 0.4 ? [...route.stops].reverse() : route.stops;
    const route = pick(ROUTES);
    const stops = rand() < 0.4 ? [...route.stops].reverse() : route.stops;
    const arrival = departure + route.minutes * 60_000;

    const roll = rand();
    const roll = rand();
    let status: TripStatus;
    if (arrival < now) {
      status = roll < 0.07 ? "CANCELLED" : roll < 0.11 ? "EXPIRED" : "COMPLETED";
      status = roll < 0.07 ? "CANCELLED" : roll < 0.11 ? "EXPIRED" : "COMPLETED";
    } else if (departure <= now) {
      status = "IN_PROGRESS";
    } else {
      status = roll < 0.06 ? "DRAFT" : roll < 0.12 ? "CANCELLED" : "PUBLISHED";
      status = roll < 0.06 ? "DRAFT" : roll < 0.12 ? "CANCELLED" : "PUBLISHED";
    }

    const totalSeatsOffered = between(1, vehicle.seatCapacity - 1);
    const costPerKm = between(8, 25) * 100;
    const createdAt = Math.min(
      departure - between(1, 5) * DAY - between(0, 10) * HOUR,
      now - between(5, 600) * 60_000,
    );

    // Đặt chỗ của chuyến: nguồn dữ liệu cho các chỉ số ghép tuyến ở trang tổng quan.
    const requestCount =
      status === "DRAFT" || status === "EXPIRED"
        ? 0
        : status === "PUBLISHED"
          ? between(0, totalSeatsOffered)
          : status === "CANCELLED"
            ? between(0, Math.min(2, totalSeatsOffered))
            : between(1, totalSeatsOffered);
    const tripBookings: MockBooking[] = [];
    for (let b = 0; b < requestCount; b++) {
      const r = rand();
      const bookingStatus: BookingStatus =
        status === "COMPLETED"
          ? r < 0.8 ? "COMPLETED" : r < 0.9 ? "CANCELLED" : "REJECTED"
          : status === "IN_PROGRESS"
            ? "CONFIRMED"
            : status === "CANCELLED"
              ? "CANCELLED"
              : r < 0.6 ? "CONFIRMED" : r < 0.85 ? "PENDING" : r < 0.93 ? "REJECTED" : "CANCELLED";
      const requestedAt =
        createdAt + rand() * (Math.min(departure, now) - createdAt);
      const responseMinutes = rand() < 0.78 ? between(1, 14) : between(16, 180);
      tripBookings.push({
        id: mockId("b0000000", bookings.length + tripBookings.length + 1),
        code: `BK-${20001 + bookings.length + tripBookings.length}`,
        tripId: mockId("t0000000", i + 1),
        passengerId: pick(passengerIds),
        seats: 1,
        status: bookingStatus,
        createdAt: requestedAt,
        respondedAt:
          bookingStatus === "PENDING" ? null : requestedAt + responseMinutes * 60_000,
        overlapPercent: between(55, 98),
        detourKm: Number((0.3 + rand() * 2.7).toFixed(1)),
        amount: 0,
      });
    }
    const active = tripBookings.filter((b) => isActiveBooking(b.status));
    for (const booking of active) {
      // Chia đều chi phí đoạn đi chung cho tài xế và các khách, làm tròn nghìn đồng.
      booking.amount =
        Math.round(
          (route.km * (booking.overlapPercent / 100) * costPerKm) /
            (1 + active.length) /
            1000,
        ) * 1000;
    }
    bookings.push(...tripBookings);
    const bookedSeats = active.reduce((sum, b) => sum + b.seats, 0);

    const createdAt = Math.min(
      departure - between(1, 5) * DAY - between(0, 10) * HOUR,
      now - between(5, 600) * 60_000,
    );

    // Đặt chỗ của chuyến: nguồn dữ liệu cho các chỉ số ghép tuyến ở trang tổng quan.
    const requestCount =
      status === "DRAFT" || status === "EXPIRED"
        ? 0
        : status === "PUBLISHED"
          ? between(0, totalSeatsOffered)
          : status === "CANCELLED"
            ? between(0, Math.min(2, totalSeatsOffered))
            : between(1, totalSeatsOffered);
    const tripBookings: MockBooking[] = [];
    for (let b = 0; b < requestCount; b++) {
      const r = rand();
      const bookingStatus: BookingStatus =
        status === "COMPLETED"
          ? r < 0.8 ? "COMPLETED" : r < 0.9 ? "CANCELLED" : "REJECTED"
          : status === "IN_PROGRESS"
            ? "CONFIRMED"
            : status === "CANCELLED"
              ? "CANCELLED"
              : r < 0.6 ? "CONFIRMED" : r < 0.85 ? "PENDING" : r < 0.93 ? "REJECTED" : "CANCELLED";
      const requestedAt =
        createdAt + rand() * (Math.min(departure, now) - createdAt);
      const responseMinutes = rand() < 0.78 ? between(1, 14) : between(16, 180);
      tripBookings.push({
        id: mockId("b0000000", bookings.length + tripBookings.length + 1),
        code: `BK-${20001 + bookings.length + tripBookings.length}`,
        tripId: mockId("t0000000", i + 1),
        passengerId: pick(passengerIds),
        seats: 1,
        status: bookingStatus,
        createdAt: requestedAt,
        respondedAt:
          bookingStatus === "PENDING" ? null : requestedAt + responseMinutes * 60_000,
        overlapPercent: between(55, 98),
        detourKm: Number((0.3 + rand() * 2.7).toFixed(1)),
        amount: 0,
      });
    }
    const active = tripBookings.filter((b) => isActiveBooking(b.status));
    for (const booking of active) {
      // Chia đều chi phí đoạn đi chung cho tài xế và các khách, làm tròn nghìn đồng.
      booking.amount =
        Math.round(
          (route.km * (booking.overlapPercent / 100) * costPerKm) /
            (1 + active.length) /
            1000,
        ) * 1000;
    }
    bookings.push(...tripBookings);
    const bookedSeats = active.reduce((sum, b) => sum + b.seats, 0);

    const cancelled = status === "CANCELLED";

    let actualStartedAt: string | null = null;
    let actualCompletedAt: string | null = null;
    let startVarianceMinutes = 0;
    if (status === "IN_PROGRESS" || status === "COMPLETED") {
      startVarianceMinutes = i % 5 === 0 ? -5 : i % 5 === 1 ? 2 : i % 5 === 2 ? 14 : i % 5 === 3 ? 25 : 0;
      actualStartedAt = iso(departure + startVarianceMinutes * 60_000);
      if (status === "COMPLETED") {
        actualCompletedAt = iso(arrival + (startVarianceMinutes + between(-3, 8)) * 60_000);
      }
    }

    const tripStops = stops.map(([stopName, stopAddress, latitude, longitude], s) => {
      const at = departure + (s / (stops.length - 1)) * route.minutes * 60_000;
      return {
        id: mockId("ts000000", i * 10 + s + 1),
        stopName,
        stopAddress,
        stopType:
          s === 0
            ? "ORIGIN" as const
            : s === stops.length - 1
              ? "DESTINATION" as const
              : "INTERMEDIATE_STOP" as const,
        sequenceOrder: s,
        latitude,
        longitude,
        plannedArrivalTime: iso(at),
        plannedDepartureTime: iso(at + (s === 0 ? 0 : 5 * 60_000)),
      };
    });

    const milestoneBookings: TripBookingMilestone[] = [];
    if (status !== "DRAFT" && !cancelled) {
      const passengerCount = between(1, Math.min(3, totalSeatsOffered));
      for (let b = 0; b < passengerCount; b++) {
        const passengerUser = users[(i * 2 + b + 8) % users.length];
        const pickIdx = 0;
        const dropIdx = tripStops.length - 1;
        const plannedPick = Date.parse(tripStops[pickIdx].plannedDepartureTime);
        const plannedDrop = Date.parse(tripStops[dropIdx].plannedArrivalTime);

        let arrivedAt: string | null = null;
        let boardedAt: string | null = null;
        let alightedAt: string | null = null;

        if (status === "IN_PROGRESS" || status === "COMPLETED") {
          const pickDelayMin = (b === 0 ? startVarianceMinutes : startVarianceMinutes + between(-2, 8));
          const arrTime = plannedPick + pickDelayMin * 60_000;
          arrivedAt = iso(arrTime);
          // Wait time 3-9 mins before passenger boards
          boardedAt = iso(arrTime + between(3, 9) * 60_000);
          if (status === "COMPLETED") {
            alightedAt = iso(plannedDrop + (startVarianceMinutes + between(0, 10)) * 60_000);
          }
        }

        milestoneBookings.push({
          id: mockId("bk000000", i * 10 + b + 1),
          passengerId: passengerUser.id,
          passengerName: passengerUser.fullName,
          passengerPhone: passengerUser.phone,
          seatsBooked: 1,
          pickupLabel: tripStops[pickIdx].stopName,
          plannedPickupTime: iso(plannedPick),
          arrivedAt,
          boardedAt,
          dropoffLabel: tripStops[dropIdx].stopName,
          plannedDropoffTime: iso(plannedDrop),
          alightedAt,
          status: status === "COMPLETED" ? "COMPLETED" : "CONFIRMED",
          totalAmount: `${Math.round(costPerKm * route.km * 0.9)}`,
        });
      }
    }

    trips.push({
      id: mockId("t0000000", i + 1),
      tripCode: "",
      tripCode: "",
      status,
      driverId: driver.id,
      driver,
      vehicleId: vehicle.id,
      vehicle,
      departureTime: iso(departure),
      actualStartedAt,
      actualCompletedAt,
      originalDepartureTime: iso(departure),
      estimatedArrivalTime: iso(arrival),
      totalDistanceKm: route.km,
      totalDurationMinutes: route.minutes,
      totalSeatsOffered,
      availableSeats:
        status === "PUBLISHED" || status === "DRAFT" ? totalSeatsOffered - bookedSeats : 0,
      bookedSeats,
      averageMatchPercent: active.length
        ? Math.round(active.reduce((sum, b) => sum + b.overlapPercent, 0) / active.length)
        : null,
      sharedCostTotal: active.length
        ? active.reduce((sum, b) => sum + b.amount, 0)
        : null,
        status === "PUBLISHED" || status === "DRAFT" ? totalSeatsOffered - bookedSeats : 0,
      bookedSeats,
      averageMatchPercent: active.length
        ? Math.round(active.reduce((sum, b) => sum + b.overlapPercent, 0) / active.length)
        : null,
      sharedCostTotal: active.length
        ? active.reduce((sum, b) => sum + b.amount, 0)
        : null,
      isInstantBooking: i % 4 === 0,
      luggageAllowed: pick<LuggageCapacity>(["NO_LUGGAGE", "SMALL", "MEDIUM", "LARGE"]),
      driverNotes: DRIVER_NOTES[i % DRIVER_NOTES.length],
      routePolyline: null,
      cancellationReason: cancelled ? "Tài xế có việc đột xuất." : null,
      cancelledBy: cancelled ? driver.id : null,
      pricing: {
        id: mockId("tp000000", i + 1),
        baseCostPerKm: costPerKm,
        totalEstimatedFare: Math.round(route.km * costPerKm),
      },
      stops: tripStops,
      bookings: milestoneBookings,
      createdAt: iso(createdAt),
      updatedAt: iso(Math.min(arrival, now)),
    });
    if (status === "COMPLETED") driver.totalRidesAsDriver += 1;
  };

  // 62 ngày trước đến 6 ngày tới: đủ để so sánh kỳ 30 ngày với kỳ liền trước.
  const DEPARTURE_HOURS = [6, 6, 7, 7, 8, 9, 12, 16, 17, 17, 18, 20];
  for (let day = -62; day <= 6; day++) {
    const dayStart = startOfToday + day * DAY;
    const weekday = new Date(dayStart + VN_OFFSET).getUTCDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const count = (isWeekend ? 4 : 6) + between(0, 2) + (day > -20 ? 1 : 0);
    for (let n = 0; n < count; n++) {
      addTrip(dayStart + pick(DEPARTURE_HOURS) * HOUR + between(0, 59) * 60_000);
    }
  }
  // Hai chuyến vừa khởi hành để luôn có dữ liệu "đang chạy".
  addTrip(now - 40 * 60_000);
  addTrip(now - 15 * 60_000);

  // Số chuyến đã đi của mỗi hành khách khớp với lịch sử đặt chỗ của họ.
  for (const user of users) {
    if (passengerIds.includes(user.id)) {
      user.totalRidesAsPassenger = bookings.filter(
        (b) => b.passengerId === user.id && b.status === "COMPLETED",
      ).length;
    }
  }

  [...trips]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .forEach((trip, order) => {
      trip.tripCode = `RS-${4400 + order}`;
    });
  };

  // 62 ngày trước đến 6 ngày tới: đủ để so sánh kỳ 30 ngày với kỳ liền trước.
  const DEPARTURE_HOURS = [6, 6, 7, 7, 8, 9, 12, 16, 17, 17, 18, 20];
  for (let day = -62; day <= 6; day++) {
    const dayStart = startOfToday + day * DAY;
    const weekday = new Date(dayStart + VN_OFFSET).getUTCDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const count = (isWeekend ? 4 : 6) + between(0, 2) + (day > -20 ? 1 : 0);
    for (let n = 0; n < count; n++) {
      addTrip(dayStart + pick(DEPARTURE_HOURS) * HOUR + between(0, 59) * 60_000);
    }
  }
  // Hai chuyến vừa khởi hành để luôn có dữ liệu "đang chạy".
  addTrip(now - 40 * 60_000);
  addTrip(now - 15 * 60_000);

  // Số chuyến đã đi của mỗi hành khách khớp với lịch sử đặt chỗ của họ.
  for (const user of users) {
    if (passengerIds.includes(user.id)) {
      user.totalRidesAsPassenger = bookings.filter(
        (b) => b.passengerId === user.id && b.status === "COMPLETED",
      ).length;
    }
  }

  [...trips]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .forEach((trip, order) => {
      trip.tripCode = `RS-${4400 + order}`;
    });
  for (let i = 0; i < 7; i++) {
    users[i + 1].ratingAsDriver = Number((4.3 + rand() * 0.7).toFixed(2));
  }

  const VIOLATION_PLAN: [ViolationType, PenaltyAction, number][] = [
    ["NO_SHOW_WITH_PASSENGERS", "SUSPENDED_24H", 2],
    ["EXPIRED_WITHOUT_PASSENGERS", "NONE", 0],
    ["LATE_CANCELLATION", "WARNING_SENT", 1],
    ["PASSENGER_REPORT", "WARNING_SENT", 1],
    ["NO_SHOW_WITH_PASSENGERS", "SUSPENDED_72H", 3],
    ["EXPIRED_WITHOUT_PASSENGERS", "WARNING_SENT", 0],
    ["LATE_CANCELLATION", "SUSPENDED_24H", 2],
    ["PASSENGER_REPORT", "NONE", 1],
    ["NO_SHOW_WITH_PASSENGERS", "REVOKED_DRIVER_LICENSE", 4],
  ];
  const pastTrips = trips.filter((t) => Date.parse(t.estimatedArrivalTime) < now);
  const violations: DriverViolation[] = VIOLATION_PLAN.map(
    ([violationType, penaltyAction, affectedPassengersCount], i) => {
      // Lấy các chuyến đã kết thúc gần đây nhất để vi phạm không quá cũ.
      const trip = pastTrips[pastTrips.length - 2 - i * 9];
      // Lấy các chuyến đã kết thúc gần đây nhất để vi phạm không quá cũ.
      const trip = pastTrips[pastTrips.length - 2 - i * 9];
      const createdAt = Date.parse(trip.estimatedArrivalTime) + 2 * HOUR;
      const suspendHours =
        penaltyAction === "SUSPENDED_24H"
          ? 24
          : penaltyAction === "SUSPENDED_72H"
            ? 72
            : 0;
      const isForgiven = i === 1 || i === 3;
      if (violationType === "NO_SHOW_WITH_PASSENGERS" && !isForgiven) {
        trip.driver!.driverProfile!.noShowStrikeCount += 1;
      }
      return {
        id: mockId("dx000000", i + 1),
        driverId: trip.driverId,
        tripId: trip.id,
        violationType,
        penaltyAction,
        affectedPassengersCount,
        penaltyUntil: suspendHours ? iso(createdAt + suspendHours * HOUR) : null,
        isForgiven,
        forgivenBy: isForgiven ? admin.id : null,
        forgivenReason: isForgiven
          ? "Tài xế cung cấp bằng chứng xe hỏng trên đường."
          : null,
        createdAt: iso(createdAt),
        driver: trip.driver!,
        trip,
      };
    },
  );

  // ----- Thanh toán: mỗi đặt chỗ đã đi xong có một lần thanh toán sau chuyến -----
  const tripsById = new Map(trips.map((trip) => [trip.id, trip]));
  const payments: MockPayment[] = [];
  for (const booking of bookings) {
    if (booking.status !== "COMPLETED") continue;
    const arrival = Date.parse(tripsById.get(booking.tripId)!.estimatedArrivalTime);
    const createdAt = arrival + 5 * 60_000;
    const method = pick<PaymentMethod>(["VIETQR", "VIETQR", "MOMO", "CASH"]);
    const roll = rand();
    const status: PaymentStatus =
      roll < 0.03 ? "FAILED" : arrival > now - 6 * HOUR && roll < 0.5 ? "PENDING" : "PAID";
    const paidAt = status === "PAID" ? createdAt + between(1, 90) * 60_000 : null;
    const settled = paidAt !== null && method !== "CASH" && paidAt < now - DAY;
    payments.push({
      id: mockId("p0000000", payments.length + 1),
      bookingId: booking.id,
      method,
      status,
      transactionReference:
        method === "CASH" ? null : `${method}${pad(between(1, 99999999), 8)}`,
      createdAt,
      paidAt,
      settlementStatus:
        method === "CASH" || paidAt === null ? null : settled ? "SETTLED" : "PENDING",
      settledAt: settled ? paidAt! + DAY : null,
    });
  }

  // ----- Báo cáo của người dùng -----
  const REPORT_PLAN: [ReportStatus, number, string, string, boolean][] = [
    ["OPEN", 2, "Lái xe không an toàn", "Tài xế vượt ẩu và dùng điện thoại khi đang chạy trên cao tốc.", false],
    ["OPEN", 5, "Đến trễ", "Tài xế đến điểm đón trễ hơn 30 phút và không báo trước.", false],
    ["OPEN", 9, "Thái độ không phù hợp", "Hành khách to tiếng và đòi dừng xe ngoài điểm đã hẹn.", true],
    ["OPEN", 30, "Yêu cầu trả thêm tiền", "Tài xế yêu cầu trả thêm tiền mặt ngoài số tiền trên ứng dụng.", false],
    ["OPEN", 50, "Không đến điểm đón", "Tôi chờ ở điểm đón 40 phút nhưng tài xế không tới và không nghe máy.", false],
    ["UNDER_REVIEW", 28, "Lái xe không an toàn", "Xe chạy quá tốc độ suốt chặng, tôi đã nhắc nhưng tài xế không giảm.", false],
    ["UNDER_REVIEW", 40, "Huỷ sát giờ", "Hành khách huỷ khi tôi đã tới điểm đón.", true],
    ["RESOLVED", 96, "Yêu cầu trả thêm tiền", "Tài xế thu thêm 50.000đ tiền gửi xe.", false],
    ["RESOLVED", 150, "Thái độ không phù hợp", "Tài xế nói chuyện thiếu tôn trọng với hành khách nữ.", false],
    ["RESOLVED", 220, "Đến trễ", "Tài xế tới trễ 20 phút.", false],
    ["REJECTED", 130, "Xe không đúng mô tả", "Xe tới đón khác màu so với thông tin trên ứng dụng.", false],
    ["REJECTED", 300, "Thái độ không phù hợp", "Hành khách không chào hỏi.", true],
  ];
  const reportable = bookings.filter((b) => b.status === "COMPLETED").slice(-80);
  const reports: MockReport[] = REPORT_PLAN.map(
    ([status, hoursAgo, type, description, byDriver], i) => {
      const booking = reportable[(i * 7 + 3) % reportable.length];
      const trip = tripsById.get(booking.tripId)!;
      const createdAt = now - hoursAgo * HOUR;
      const closed = status === "RESOLVED" || status === "REJECTED";
      return {
        id: mockId("r0000000", i + 1),
        reporterId: byDriver ? trip.driverId : booking.passengerId,
        reportedUserId: byDriver ? booking.passengerId : trip.driverId,
        tripId: trip.id,
        type,
        description,
        status,
        resolutionNote: !closed
          ? null
          : status === "RESOLVED"
            ? "Đã liên hệ hai bên, xác nhận đúng sự việc và nhắc nhở người bị báo cáo."
            : "Không đủ căn cứ: nội dung báo cáo không vi phạm quy định của nền tảng.",
        resolvedById: closed ? admin.id : null,
        resolvedAt: closed ? iso(createdAt + 20 * HOUR) : null,
        createdAt: iso(createdAt),
      };
    },
  );

  // ----- Sự cố SOS và liên hệ khẩn cấp -----
  const RELATIONSHIPS = ["Mẹ", "Bố", "Vợ", "Chồng", "Anh trai", "Chị gái", "Bạn thân"];
  const emergencyContacts = users.slice(1).flatMap((user, i) =>
    Array.from({ length: 1 + (i % 2) }, (_, n) => ({
      id: mockId("ec000000", i * 2 + n + 1),
      userId: user.id,
      name: NAMES[(i * 3 + n * 5 + 7) % NAMES.length],
      phone: `09${pad(10000000 + between(0, 89999999), 8)}`,
      relationship: RELATIONSHIPS[(i + n * 3) % RELATIONSHIPS.length],
    })),
  );
  const runningTrip = trips.find((t) => t.status === "IN_PROGRESS" && t.bookedSeats > 0);
  const SOS_PLAN: [number, string | null][] = [
    [12, null],
    [26 * 60, "Đã gọi cho hành khách: xe bị thủng lốp trên cao tốc, tài xế đã thay lốp và đi tiếp an toàn."],
    [4 * 24 * 60, "Hành khách bấm nhầm khi cất điện thoại. Đã gọi xác nhận, không có sự cố."],
    [9 * 24 * 60, "Va chạm nhẹ với xe máy, không ai bị thương. Đã liên hệ cả tài xế và người thân của hành khách."],
  ];
  const sosEvents: MockSosEvent[] = SOS_PLAN.map(([minutesAgo, notes], i) => {
    const trip = i === 0 && runningTrip ? runningTrip : tripsById.get(reportable[i * 11].tripId)!;
    const rider = bookings.find((b) => b.tripId === trip.id && isActiveBooking(b.status));
    // Vị trí nằm giữa hai điểm dừng đầu của chuyến.
    const [from, to] = trip.stops;
    const progress = 0.3 + i * 0.15;
    const triggeredAt = now - minutesAgo * 60_000;
    return {
      id: mockId("so000000", i + 1),
      userId: rider?.passengerId ?? trip.driverId,
      tripId: trip.id,
      latitude: Number((from.latitude + (to.latitude - from.latitude) * progress).toFixed(5)),
      longitude: Number((from.longitude + (to.longitude - from.longitude) * progress).toFixed(5)),
      triggeredAt: iso(triggeredAt),
      resolvedAt: notes ? iso(triggeredAt + 25 * 60_000) : null,
      resolvedById: notes ? admin.id : null,
      notes,
    };
  });

  // ----- Thanh toán: mỗi đặt chỗ đã đi xong có một lần thanh toán sau chuyến -----
  const tripsById = new Map(trips.map((trip) => [trip.id, trip]));
  const payments: MockPayment[] = [];
  for (const booking of bookings) {
    if (booking.status !== "COMPLETED") continue;
    const arrival = Date.parse(tripsById.get(booking.tripId)!.estimatedArrivalTime);
    const createdAt = arrival + 5 * 60_000;
    const method = pick<PaymentMethod>(["VIETQR", "VIETQR", "MOMO", "CASH"]);
    const roll = rand();
    const status: PaymentStatus =
      roll < 0.03 ? "FAILED" : arrival > now - 6 * HOUR && roll < 0.5 ? "PENDING" : "PAID";
    const paidAt = status === "PAID" ? createdAt + between(1, 90) * 60_000 : null;
    const settled = paidAt !== null && method !== "CASH" && paidAt < now - DAY;
    payments.push({
      id: mockId("p0000000", payments.length + 1),
      bookingId: booking.id,
      method,
      status,
      transactionReference:
        method === "CASH" ? null : `${method}${pad(between(1, 99999999), 8)}`,
      createdAt,
      paidAt,
      settlementStatus:
        method === "CASH" || paidAt === null ? null : settled ? "SETTLED" : "PENDING",
      settledAt: settled ? paidAt! + DAY : null,
    });
  }

  // ----- Báo cáo của người dùng -----
  const REPORT_PLAN: [ReportStatus, number, string, string, boolean][] = [
    ["OPEN", 2, "Lái xe không an toàn", "Tài xế vượt ẩu và dùng điện thoại khi đang chạy trên cao tốc.", false],
    ["OPEN", 5, "Đến trễ", "Tài xế đến điểm đón trễ hơn 30 phút và không báo trước.", false],
    ["OPEN", 9, "Thái độ không phù hợp", "Hành khách to tiếng và đòi dừng xe ngoài điểm đã hẹn.", true],
    ["OPEN", 30, "Yêu cầu trả thêm tiền", "Tài xế yêu cầu trả thêm tiền mặt ngoài số tiền trên ứng dụng.", false],
    ["OPEN", 50, "Không đến điểm đón", "Tôi chờ ở điểm đón 40 phút nhưng tài xế không tới và không nghe máy.", false],
    ["UNDER_REVIEW", 28, "Lái xe không an toàn", "Xe chạy quá tốc độ suốt chặng, tôi đã nhắc nhưng tài xế không giảm.", false],
    ["UNDER_REVIEW", 40, "Huỷ sát giờ", "Hành khách huỷ khi tôi đã tới điểm đón.", true],
    ["RESOLVED", 96, "Yêu cầu trả thêm tiền", "Tài xế thu thêm 50.000đ tiền gửi xe.", false],
    ["RESOLVED", 150, "Thái độ không phù hợp", "Tài xế nói chuyện thiếu tôn trọng với hành khách nữ.", false],
    ["RESOLVED", 220, "Đến trễ", "Tài xế tới trễ 20 phút.", false],
    ["REJECTED", 130, "Xe không đúng mô tả", "Xe tới đón khác màu so với thông tin trên ứng dụng.", false],
    ["REJECTED", 300, "Thái độ không phù hợp", "Hành khách không chào hỏi.", true],
  ];
  const reportable = bookings.filter((b) => b.status === "COMPLETED").slice(-80);
  const reports: MockReport[] = REPORT_PLAN.map(
    ([status, hoursAgo, type, description, byDriver], i) => {
      const booking = reportable[(i * 7 + 3) % reportable.length];
      const trip = tripsById.get(booking.tripId)!;
      const createdAt = now - hoursAgo * HOUR;
      const closed = status === "RESOLVED" || status === "REJECTED";
      return {
        id: mockId("r0000000", i + 1),
        reporterId: byDriver ? trip.driverId : booking.passengerId,
        reportedUserId: byDriver ? booking.passengerId : trip.driverId,
        tripId: trip.id,
        type,
        description,
        status,
        resolutionNote: !closed
          ? null
          : status === "RESOLVED"
            ? "Đã liên hệ hai bên, xác nhận đúng sự việc và nhắc nhở người bị báo cáo."
            : "Không đủ căn cứ: nội dung báo cáo không vi phạm quy định của nền tảng.",
        resolvedById: closed ? admin.id : null,
        resolvedAt: closed ? iso(createdAt + 20 * HOUR) : null,
        createdAt: iso(createdAt),
      };
    },
  );

  // ----- Sự cố SOS và liên hệ khẩn cấp -----
  const RELATIONSHIPS = ["Mẹ", "Bố", "Vợ", "Chồng", "Anh trai", "Chị gái", "Bạn thân"];
  const emergencyContacts = users.slice(1).flatMap((user, i) =>
    Array.from({ length: 1 + (i % 2) }, (_, n) => ({
      id: mockId("ec000000", i * 2 + n + 1),
      userId: user.id,
      name: NAMES[(i * 3 + n * 5 + 7) % NAMES.length],
      phone: `09${pad(10000000 + between(0, 89999999), 8)}`,
      relationship: RELATIONSHIPS[(i + n * 3) % RELATIONSHIPS.length],
    })),
  );
  const runningTrip = trips.find((t) => t.status === "IN_PROGRESS" && t.bookedSeats > 0);
  const SOS_PLAN: [number, string | null][] = [
    [12, null],
    [26 * 60, "Đã gọi cho hành khách: xe bị thủng lốp trên cao tốc, tài xế đã thay lốp và đi tiếp an toàn."],
    [4 * 24 * 60, "Hành khách bấm nhầm khi cất điện thoại. Đã gọi xác nhận, không có sự cố."],
    [9 * 24 * 60, "Va chạm nhẹ với xe máy, không ai bị thương. Đã liên hệ cả tài xế và người thân của hành khách."],
  ];
  const sosEvents: MockSosEvent[] = SOS_PLAN.map(([minutesAgo, notes], i) => {
    const trip = i === 0 && runningTrip ? runningTrip : tripsById.get(reportable[i * 11].tripId)!;
    const rider = bookings.find((b) => b.tripId === trip.id && isActiveBooking(b.status));
    // Vị trí nằm giữa hai điểm dừng đầu của chuyến.
    const [from, to] = trip.stops;
    const progress = 0.3 + i * 0.15;
    const triggeredAt = now - minutesAgo * 60_000;
    return {
      id: mockId("so000000", i + 1),
      userId: rider?.passengerId ?? trip.driverId,
      tripId: trip.id,
      latitude: Number((from.latitude + (to.latitude - from.latitude) * progress).toFixed(5)),
      longitude: Number((from.longitude + (to.longitude - from.longitude) * progress).toFixed(5)),
      triggeredAt: iso(triggeredAt),
      resolvedAt: notes ? iso(triggeredAt + 25 * 60_000) : null,
      resolvedById: notes ? admin.id : null,
      notes,
    };
  });

  const settingRows: [string, string, string][] = [
    ["PLATFORM_FEE_PERCENT", "10", "Phí nền tảng tính trên giá gốc, trừ vào phần của tài xế"],
    ["MIN_COST_PER_KM", "800", "Giá sàn chia sẻ chi phí cho mỗi km, mỗi ghế"],
    ["MAX_COST_PER_KM", "2500", "Giá trần phi thương mại cho mỗi km, mỗi ghế"],
    ["SEARCH_RADIUS_METERS", "3000", "Bán kính tìm điểm đón và điểm trả quanh vị trí hành khách"],
    ["MIN_DEPARTURE_LEAD_MINUTES", "15", "Chuyến phải khởi hành sau thời điểm tạo ít nhất chừng này phút"],
    ["BOOKING_EXPIRY_MINUTES", "30", "Yêu cầu đặt chỗ tự hết hạn nếu tài xế không phản hồi"],
    ["NO_SHOW_STRIKE_LIMIT", "3", "Số lần bỏ chuyến trước khi thu hồi quyền tài xế"],
  ];
  const settings: SystemSetting[] = settingRows.map(
    ([settingKey, settingValue, description], i) => ({
      id: mockId("s0000000", i + 1),
      settingKey,
      settingValue,
      description,
      updatedAt: iso(now - 30 * DAY),
    }),
  );

  return {
    users,
    driverVerifications,
    vehicles,
    vehicleVerifications,
    trips,
    violations,
    settings,
    bookings,
    auditLogs: seedAuditLogs(admin, driverVerifications, vehicleVerifications, violations, users),
    credentials: { [admin.id]: MOCK_ADMIN_CREDENTIALS.password },
    payments,
    reports,
    sosEvents,
    emergencyContacts,
  };
}

/** Dựng nhật ký ban đầu từ các quyết định đã có sẵn trong dữ liệu mẫu. */
function seedAuditLogs(
  admin: User,
  driverDocs: DriverVerification[],
  vehicleDocs: VehicleVerification[],
  violations: DriverViolation[],
  users: User[],
): AuditLog[] {
  const entries: Omit<AuditLog, "id" | "actor">[] = [];
  for (const doc of driverDocs) {
    if (!doc.reviewedAt) continue;
    const kind = doc.type === "IDENTITY_CARD" ? "CCCD" : "GPLX";
    entries.push({
      action: doc.status === "REJECTED" ? "DRIVER_DOCUMENT_REJECTED" : "DRIVER_DOCUMENT_APPROVED",
      targetType: "DRIVER_PROFILE",
      targetId: doc.driverProfile.id,
      targetLabel: `${kind} của ${doc.driverProfile.user.fullName}`,
      detail: doc.rejectReason,
      createdAt: doc.reviewedAt,
    });
  }
  for (const doc of vehicleDocs) {
    if (!doc.reviewedAt) continue;
    entries.push({
      action:
        doc.status === "REJECTED" ? "VEHICLE_DOCUMENT_REJECTED" : "VEHICLE_DOCUMENT_APPROVED",
      targetType: "DRIVER_PROFILE",
      targetId: doc.vehicle.driverProfile.id,
      targetLabel: `Giấy đăng ký xe ${doc.vehicle.plateNumber}`,
      detail: doc.rejectReason,
      createdAt: doc.reviewedAt,
    });
  }
  for (const violation of violations) {
    if (!violation.isForgiven) continue;
    entries.push({
      action: "VIOLATION_FORGIVEN",
      targetType: "VIOLATION",
      targetId: violation.id,
      targetLabel: `Vi phạm của ${violation.driver.fullName}`,
      detail: violation.forgivenReason,
      // Dữ liệu mẫu không lưu thời điểm tha: lấy một ngày sau khi ghi nhận vi phạm.
      createdAt: new Date(Date.parse(violation.createdAt) + DAY).toISOString(),
    });
  }
  for (const user of users) {
    if (user.status !== "SUSPENDED") continue;
    const suspendedAt = new Date(Date.parse(user.createdAt) + 6 * DAY).toISOString();
    user.updatedAt = suspendedAt;
    entries.push({
      action: "USER_SUSPENDED",
      targetType: "USER",
      targetId: user.id,
      targetLabel: user.fullName,
      detail: "Nhiều hành khách phản ánh thái độ không phù hợp.",
      createdAt: suspendedAt,
    });
  }
  return entries
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((entry, index) => ({ ...entry, id: mockId("al000000", index + 1), actor: admin }));
    bookings,
    auditLogs: seedAuditLogs(admin, driverVerifications, vehicleVerifications, violations, users),
    credentials: { [admin.id]: MOCK_ADMIN_CREDENTIALS.password },
    payments,
    reports,
    sosEvents,
    emergencyContacts,
  };
}

/** Dựng nhật ký ban đầu từ các quyết định đã có sẵn trong dữ liệu mẫu. */
function seedAuditLogs(
  admin: User,
  driverDocs: DriverVerification[],
  vehicleDocs: VehicleVerification[],
  violations: DriverViolation[],
  users: User[],
): AuditLog[] {
  const entries: Omit<AuditLog, "id" | "actor">[] = [];
  for (const doc of driverDocs) {
    if (!doc.reviewedAt) continue;
    const kind = doc.type === "IDENTITY_CARD" ? "CCCD" : "GPLX";
    entries.push({
      action: doc.status === "REJECTED" ? "DRIVER_DOCUMENT_REJECTED" : "DRIVER_DOCUMENT_APPROVED",
      targetType: "DRIVER_PROFILE",
      targetId: doc.driverProfile.id,
      targetLabel: `${kind} của ${doc.driverProfile.user.fullName}`,
      detail: doc.rejectReason,
      createdAt: doc.reviewedAt,
    });
  }
  for (const doc of vehicleDocs) {
    if (!doc.reviewedAt) continue;
    entries.push({
      action:
        doc.status === "REJECTED" ? "VEHICLE_DOCUMENT_REJECTED" : "VEHICLE_DOCUMENT_APPROVED",
      targetType: "DRIVER_PROFILE",
      targetId: doc.vehicle.driverProfile.id,
      targetLabel: `Giấy đăng ký xe ${doc.vehicle.plateNumber}`,
      detail: doc.rejectReason,
      createdAt: doc.reviewedAt,
    });
  }
  for (const violation of violations) {
    if (!violation.isForgiven) continue;
    entries.push({
      action: "VIOLATION_FORGIVEN",
      targetType: "VIOLATION",
      targetId: violation.id,
      targetLabel: `Vi phạm của ${violation.driver.fullName}`,
      detail: violation.forgivenReason,
      // Dữ liệu mẫu không lưu thời điểm tha: lấy một ngày sau khi ghi nhận vi phạm.
      createdAt: new Date(Date.parse(violation.createdAt) + DAY).toISOString(),
    });
  }
  for (const user of users) {
    if (user.status !== "SUSPENDED") continue;
    const suspendedAt = new Date(Date.parse(user.createdAt) + 6 * DAY).toISOString();
    user.updatedAt = suspendedAt;
    entries.push({
      action: "USER_SUSPENDED",
      targetType: "USER",
      targetId: user.id,
      targetLabel: user.fullName,
      detail: "Nhiều hành khách phản ánh thái độ không phù hợp.",
      createdAt: suspendedAt,
    });
  }
  return entries
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((entry, index) => ({ ...entry, id: mockId("al000000", index + 1), actor: admin }));
}

// Giữ kho trên globalThis để không bị tạo lại mỗi lần Next.js biên dịch lại module.
// Tăng SEED_VERSION khi đổi cấu trúc dữ liệu mẫu, để server dev đang chạy tạo kho mới.
const SEED_VERSION = 5;
// Tăng SEED_VERSION khi đổi cấu trúc dữ liệu mẫu, để server dev đang chạy tạo kho mới.
const SEED_VERSION = 5;
const globalStore = globalThis as typeof globalThis & {
  __routeshareMockStore?: { version: number; store: MockStore };
  __routeshareMockStore?: { version: number; store: MockStore };
};

export function getStore(): MockStore {
  if (globalStore.__routeshareMockStore?.version !== SEED_VERSION) {
    globalStore.__routeshareMockStore = { version: SEED_VERSION, store: createStore() };
  }
  return globalStore.__routeshareMockStore.store;
  if (globalStore.__routeshareMockStore?.version !== SEED_VERSION) {
    globalStore.__routeshareMockStore = { version: SEED_VERSION, store: createStore() };
  }
  return globalStore.__routeshareMockStore.store;
}
