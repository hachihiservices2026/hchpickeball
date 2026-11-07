// Pickleball BOT Difficulty Configurations
// Tham số điều chỉnh rõ ràng cho 3 cấp độ: Easy, Normal, Hard
// Không tạo cảm giác gian lận, mô phỏng phản xạ và độ chính xác của con người thật

export const BOT_DIFFICULTY_PRESETS = {
  easy: {
    id: "easy",
    name: "Người mới (Easy)",
    nameVi: "Dễ / Người mới",
    description: "Đánh bóng bền, phản xạ đều đặn, tỉ lệ bóng vào sân cao giúp người chơi làm quen nhịp đấu",
    reactionDelaySeconds: 0.10,    // Phản xạ mượt mà, không bị khựng
    movementSpeedMultiplier: 0.96,  // Di chuyển bao quát sân tốt
    anticipationAccuracy: 0.92,    // Đoán điểm rơi chuẩn xác
    errorProbability: 0.035,       // Rất ít khi tự đánh hỏng sơ đẳng
    sweetSpotChance: 0.78,         // Cú đánh ổn định
    dinkTendency: 0.22,            // Biết dink khi cần
    smashTendency: 0.60,           // Đập bóng khi có cơ hội
    spinIntensity: 12,             // Độ xoáy bóng vừa phải
    shotSpeedMaxKmH: 140,          // Tốc độ bóng ổn định
    cooldownBetweenShots: 0.20
  },
  normal: {
    id: "normal",
    name: "Vừa sức (Normal)",
    nameVi: "Vừa sức / CLB",
    description: "Di chuyển thông minh, rally bền bỉ, biết phối hợp bếp (Kitchen) và phản công sắc bén",
    reactionDelaySeconds: 0.05,
    movementSpeedMultiplier: 1.08,
    anticipationAccuracy: 0.96,
    errorProbability: 0.012,       // Chỉ lỗi khi bị ép vào thế cực kỳ hiểm
    sweetSpotChance: 0.92,
    dinkTendency: 0.42,            // Thường xuyên thả bóng vào Bếp (Kitchen) khi đối thủ lùi sâu
    smashTendency: 0.82,           // Đập bóng dứt khoát khi bóng cao hơn lưới
    spinIntensity: 18,
    shotSpeedMaxKmH: 168,
    cooldownBetweenShots: 0.15
  },
  hard: {
    id: "hard",
    name: "Cao thủ (Hard)",
    nameVi: "Chuyên nghiệp / Hard",
    description: "Đẳng cấp kiện tướng: rally không mắc lỗi, bao quát sân toàn diện, tấn công và phòng thủ đỉnh cao",
    reactionDelaySeconds: 0.015,   // Phản xạ cực nhanh
    movementSpeedMultiplier: 1.22, // Tốc độ di chuyển nhanh, bao quát sân tối ưu
    anticipationAccuracy: 0.99,    // Dự đoán chính xác 100% vị trí bóng nảy
    errorProbability: 0.003,       // Gần như không bao giờ tự đánh hỏng
    sweetSpotChance: 0.98,         // Cú đánh luôn chạm điểm ngọt tâm vợt
    dinkTendency: 0.55,            // Dink hiểm hóc sát mép lưới
    smashTendency: 0.96,           // Smash hiểm hóc vào góc trống
    spinIntensity: 24,             // Xoáy topspin / slice mạnh
    shotSpeedMaxKmH: 198,
    cooldownBetweenShots: 0.10
  }
};

export function getBotDifficultyConfig(level = "normal") {
  const key = String(level || "normal").toLowerCase();
  return BOT_DIFFICULTY_PRESETS[key] || BOT_DIFFICULTY_PRESETS.normal;
}
