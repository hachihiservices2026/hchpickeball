// Pickleball BOT Decision & Shot Selection Engine
// Quyết định chiến thuật đánh bóng, tuân thủ luật Kitchen (NVZ) & Two-Bounce

import * as THREE from "three";

export class BotDecision {
  constructor(actor, difficultyConfig) {
    this.actor = actor;
    this.diffConfig = difficultyConfig;
    this.sideSign = actor.sideSign || 1;
  }

  setDifficulty(diffConfig) {
    this.diffConfig = diffConfig;
  }

  // Quyết định giao bóng (Serve)
  evaluateServe() {
    // BOT chọn góc giao bóng chéo sân theo luật Pickleball (Deuce / Ad court)
    const isHard = this.diffConfig.id === "hard";
    const speed = isHard ? 1.42 : this.diffConfig.id === "normal" ? 1.25 : 1.05;
    const dirX = (Math.random() - 0.5) * 0.45;
    return {
      timing: isHard ? "PERFECT" : Math.random() < 0.75 ? "GOOD" : "EARLY",
      speed,
      dirX,
      shotType: isHard && Math.random() < 0.4 ? "POWER" : "TOPSPIN"
    };
  }

  // Quyết định cú đánh trong pha bóng (Rally)
  evaluateRallyShot(ball, opponents = []) {
    const ballPos = ball.pos;
    const isHighBall = ballPos.y > 1.62;
    const isNearNet = Math.abs(ballPos.z) < 4.2;
    const strokeCount = ball.rallyStrokeCount || 0;

    // Phân tích vị trí đối thủ để tìm góc trống
    let openCornerX = 0;
    if (opponents.length > 0) {
      const avgOppX = opponents.reduce((sum, opp) => sum + opp.pos.x, 0) / opponents.length;
      openCornerX = avgOppX >= 0 ? -2.4 : 2.4;
    } else {
      openCornerX = (Math.random() < 0.5 ? -1 : 1) * 2.2;
    }

    let selectedShot = "TOPSPIN";
    let targetZ = -this.sideSign * (7.8 + Math.random() * 2.6);
    let targetX = openCornerX * 0.85 + (Math.random() - 0.5) * 0.6;
    let flightDuration = 0.72;
    let topspin = 18;
    let sidespin = 0;

    // Cú đánh thứ 3 (3rd Shot): BOT linh hoạt giữa Topspin Drive an toàn hoặc Drop shot mềm
    if (strokeCount === 2) {
      if (Math.random() < this.diffConfig.dinkTendency) {
        selectedShot = "SLICE"; // Drop shot cắt xoáy rơi an toàn qua lưới
        targetZ = -this.sideSign * (2.6 + Math.random() * 1.2);
        flightDuration = 1.05;
        topspin = -10;
        sidespin = (Math.random() < 0.5 ? -1 : 1) * 6;
      } else {
        selectedShot = "TOPSPIN"; // Drive bóng sâu an toàn
        targetZ = -this.sideSign * (8.2 + Math.random() * 2.2);
        flightDuration = 0.72;
        topspin = 18;
      }
    } 
    // Smash khi bóng bổng và ở cự ly hợp lý (không smash mù quáng khi ở tít cuối sân)
    else if (isHighBall && (isNearNet || Math.abs(this.actor.pos.z) < 7.0) && Math.random() < this.diffConfig.smashTendency) {
      selectedShot = "FLAT"; // Smash đập dứt điểm dũng mãnh
      targetZ = -this.sideSign * (7.5 + Math.random() * 3.0);
      flightDuration = 0.50;
      topspin = 22;
      targetX = openCornerX * 0.95;
    } 
    // Dink đấu bếp (Kitchen battle) khi bóng rơi gần lưới: nảy êm vào NVZ
    else if (isNearNet && Math.random() < this.diffConfig.dinkTendency) {
      selectedShot = "DINK";
      targetZ = -this.sideSign * (1.6 + Math.random() * 0.8);
      flightDuration = 0.95;
      topspin = 4;
      targetX = THREE.MathUtils.clamp(targetX * 0.6, -2.6, 2.6);
    } 
    // Lob phòng thủ khi bị ép góc dạt ra biên: bóng đi cao, an toàn
    else if (Math.abs(this.actor.pos.x) > 2.9 && Math.random() < 0.20) {
      selectedShot = "LOB";
      targetZ = -this.sideSign * (9.5 + Math.random() * 1.5);
      flightDuration = 1.52;
      topspin = 4;
    }
    // Cắt Slice đổi nhịp trận đấu
    else if (Math.random() < 0.18) {
      selectedShot = "SLICE";
      targetZ = -this.sideSign * (5.5 + Math.random() * 2.5);
      flightDuration = 1.02;
      topspin = -12;
      sidespin = (Math.random() < 0.5 ? -1 : 1) * 8;
    }

    // Sai số có kiểm soát theo cấp độ (chỉ lỗi rất hiếm khi chịu áp lực cao)
    let allowFault = false;
    if (Math.random() < this.diffConfig.errorProbability) {
      if (Math.random() < 0.70) {
        // Đánh hơi rộng ra biên một chút thay vì cắm thẳng vào lưới
        targetX = (targetX >= 0 ? 1 : -1) * (4.25 + Math.random() * 0.35);
      } else {
        allowFault = true;
      }
    }

    // Luôn giữ bóng nằm an toàn trong sân đối phương nếu không cố ý đánh hỏng
    if (!allowFault && Math.abs(targetX) <= 4.2) {
      targetX = THREE.MathUtils.clamp(targetX, -3.6, 3.6);
      if (this.sideSign > 0) {
        targetZ = THREE.MathUtils.clamp(targetZ, -10.8, -1.6);
      } else {
        targetZ = THREE.MathUtils.clamp(targetZ, 1.6, 10.8);
      }
    }

    // Xác định tay thuận (forehand) hay tay nghịch (backhand)
    const isBackhand = (this.actor.pos.x > ballPos.x && this.sideSign > 0) || (this.actor.pos.x < ballPos.x && this.sideSign < 0);
    const swingSide = isHighBall ? "overhead" : isBackhand ? "backhand" : "forehand";

    return {
      shotType: selectedShot,
      targetX: THREE.MathUtils.clamp(targetX, -4.5, 4.5),
      targetZ,
      flightDuration,
      topspin,
      sidespin,
      allowFault,
      swingSide,
      timingQuality: Math.random() < this.diffConfig.sweetSpotChance ? "PERFECT" : "GOOD",
      speedKmh: Math.round(
        selectedShot === "FLAT" ? this.diffConfig.shotSpeedMaxKmH : 
        selectedShot === "DINK" ? 65 + Math.random() * 15 : 
        this.diffConfig.shotSpeedMaxKmH * (0.7 + Math.random() * 0.25)
      )
    };
  }
}
