export const SETTINGS_CATALOG = {
  platformFeePercent: { label: "Phí nền tảng", unit: "%", group: "Giá và phí", min: 0, max: 100, step: "0.01", effect: "Chụp mức phí khi đăng chuyến; không đổi phí của chuyến đã đăng." },
  minCostPerKm: { label: "Mức chia sẻ tối thiểu mỗi km", unit: "đ/km", group: "Giá và phí", min: 0.01, step: "any", effect: "Kiểm tra mức chia sẻ khi đăng chuyến mới; không sửa giá đã chốt." },
  maxCostPerKm: { label: "Mức chia sẻ tối đa mỗi km", unit: "đ/km", group: "Giá và phí", min: 0.01, step: "any", effect: "Phải lớn hơn hoặc bằng mức tối thiểu." },
  defaultSearchRadiusMeters: { label: "Bán kính tìm mặc định", unit: "m", group: "Tìm kiếm và lịch trình", min: 500, max: 5000, effect: "Dùng khi yêu cầu tìm kiếm không chỉ định bán kính; trần an toàn cố định 5.000 m." },
  defaultSearchTimeWindowMinutes: { label: "Độ lệch giờ đón tối đa", unit: "phút", group: "Tìm kiếm và lịch trình", min: 15, max: 360, effect: "Tìm trong khoảng trước và sau giờ đã chọn; không đổi giờ đón của đặt chỗ đã có." },
  bestMatchRadiusMeters: { label: "Ngưỡng Phù hợp nhất", unit: "m", group: "Tìm kiếm và lịch trình", min: 500, max: 5000, effect: "Cả điểm đón và điểm trả phải cách tuyến không quá ngưỡng này để có nhãn Phù hợp nhất. Không mở rộng bán kính tìm." },
  minDepartureLeadMinutes: { label: "Thời gian tối thiểu trước khởi hành", unit: "phút", group: "Tìm kiếm và lịch trình", min: 1, max: 1440, effect: "Kiểm tra đăng chuyến mới; không dời lịch chuyến hiện có." },
  maxWaypointDistanceMeters: { label: "Khoảng cách điểm nghỉ tối đa", unit: "m", group: "Tìm kiếm và lịch trình", min: 100, max: 5000, effect: "Kiểm tra điểm nghỉ so với tuyến gốc khi xem trước/đăng chuyến." },
  maxStopWaitMinutes: { label: "Thời gian nghỉ tối đa", unit: "phút", group: "Tìm kiếm và lịch trình", min: 1, max: 1440, effect: "Giới hạn cho lịch nghỉ mới; giữ nguyên lịch đã lưu." },
  tripScheduleChangeToleranceMinutes: { label: "Ngưỡng thay đổi giờ khởi hành", unit: "phút", group: "Tìm kiếm và lịch trình", min: 0, max: 2147483647, effect: "Backend đánh giá tác động khi sửa giờ; không tự hủy hoặc sửa chuyến." },
  activeUploadSeconds: { label: "Chu kỳ gửi vị trí", unit: "giây", group: "Vị trí chuyến đang chạy", min: 5, max: 60, effect: "Mobile sử dụng khi đồng bộ cấu hình theo dõi; không phải định vị nền." },
  activeStationarySeconds: { label: "Chu kỳ khi đứng yên", unit: "giây", group: "Vị trí chuyến đang chạy", min: 5, max: 60, effect: "Không nhỏ hơn chu kỳ đang di chuyển, phải nhỏ hơn tuổi GPS tối đa." },
  activeViewerPollSeconds: { label: "Chu kỳ tải vị trí", unit: "giây", group: "Vị trí chuyến đang chạy", min: 5, max: 60, effect: "Chu kỳ cho người có quyền xem vị trí trong chuyến đang chạy." },
  activeGpsMaxAgeSeconds: { label: "Tuổi vị trí tối đa", unit: "giây", group: "Vị trí chuyến đang chạy", min: 10, max: 120, effect: "Vị trí cũ không được dùng làm bằng chứng hiện tại." },
  activeGpsFutureSkewSeconds: { label: "Độ lệch thời gian GPS", unit: "giây", group: "Vị trí chuyến đang chạy", min: 1, max: 10, effect: "Giới hạn timestamp thiết bị đi trước giờ máy chủ." },
  activeGpsAccuracyMeters: { label: "Sai số GPS cho phép", unit: "m", group: "Vị trí chuyến đang chạy", min: 5, max: 100, effect: "Bộ lọc chất lượng vị trí; không được lớn hơn bán kính đến điểm/lệch tuyến." },
  activeProximityMeters: { label: "Khoảng cách xác nhận đến điểm", unit: "m", group: "Vị trí chuyến đang chạy", min: 50, max: 500, effect: "Kiểm tra đến điểm, lên/xuống xe và hoàn thành; không tự xác nhận lên xe." },
  activeOffRouteMeters: { label: "Ngưỡng lệch tuyến", unit: "m", group: "Vị trí chuyến đang chạy", min: 50, max: 500, effect: "Đánh giá độ tin cậy tiến độ/ETA; không kết luận vi phạm từ GPS." },
  activePassedPickupMeters: { label: "Ngưỡng qua điểm đón", unit: "m", group: "Vị trí chuyến đang chạy", min: 50, max: 500, effect: "Backend kiểm tra tiến độ và chất lượng GPS trước khi xử lý yêu cầu." },
} satisfies Record<string, { label: string; unit: string; group: string; min: number; max?: number; step?: string; effect: string }>;
export type SettingKey = keyof typeof SETTINGS_CATALOG;
export type SettingsValues = Record<SettingKey, number>;
export const SETTING_KEYS = Object.keys(SETTINGS_CATALOG) as SettingKey[];
export function validateSettings(values: SettingsValues): string | null {
  for (const key of SETTING_KEYS) {
    const rule: { min: number; max?: number; step?: string } = SETTINGS_CATALOG[key];
    const value = values[key];
    if (!Number.isFinite(value) || value < rule.min || (rule.max !== undefined && value > rule.max) || (!rule.step && !Number.isInteger(value))) return `${SETTINGS_CATALOG[key].label}: giá trị ngoài giới hạn cho phép.`;
  }
  if (Math.abs(values.platformFeePercent * 100 - Math.round(values.platformFeePercent * 100)) > 1e-7) return "Phí nền tảng chỉ được có tối đa hai chữ số thập phân.";
  if (values.minCostPerKm > values.maxCostPerKm) return "Mức chia sẻ tối thiểu không được lớn hơn tối đa.";
  if (values.activeStationarySeconds < values.activeUploadSeconds || values.activeGpsMaxAgeSeconds <= values.activeStationarySeconds) return "Chu kỳ đứng yên phải ≥ chu kỳ gửi và < tuổi GPS tối đa.";
  if (values.activeProximityMeters < values.activeGpsAccuracyMeters || values.activeOffRouteMeters < values.activeGpsAccuracyMeters) return "Bán kính đến điểm/lệch tuyến không được nhỏ hơn sai số GPS.";
  return null;
}
