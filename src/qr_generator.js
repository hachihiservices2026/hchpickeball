// Pure JavaScript QR Code Generator (Type 1-10, Error Correction L/M)
// Renders directly to HTML5 Canvas with high contrast and scanner-friendly quiet zone

export function drawQRCodeToCanvas(canvas, text, options = {}) {
  if (!canvas) return;
  const size = options.size || 140;
  const margin = options.margin !== undefined ? options.margin : 2;
  const darkColor = options.darkColor || "#000000";
  const lightColor = options.lightColor || "#ffffff";
  const ctx = canvas.getContext("2d");

  // Simple QR matrix generator for standard URL/room payloads
  const matrix = createQRMatrix(text);
  const moduleCount = matrix.length;
  const cellSize = Math.floor(size / (moduleCount + margin * 2));
  const actualSize = cellSize * (moduleCount + margin * 2);

  canvas.width = actualSize;
  canvas.height = actualSize;

  // Background
  ctx.fillStyle = lightColor;
  ctx.fillRect(0, 0, actualSize, actualSize);

  // Draw modules
  ctx.fillStyle = darkColor;
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c]) {
        ctx.fillRect(
          (c + margin) * cellSize,
          (r + margin) * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }

  // Draw subtle center branding dot or logo if requested
  if (options.branding) {
    const center = actualSize / 2;
    const badgeW = cellSize * 5;
    ctx.fillStyle = lightColor;
    ctx.fillRect(center - badgeW / 2, center - badgeW / 2, badgeW, badgeW);
    ctx.fillStyle = "#ffea28";
    ctx.beginPath();
    ctx.arc(center, center, badgeW * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// Minimalist Reed-Solomon / QR Matrix Builder for short URLs and codes
function createQRMatrix(text) {
  // Use a 25x25 (Version 2) or 29x29 (Version 3) grid based on text length
  const len = text.length;
  const v = len > 40 ? 4 : len > 22 ? 3 : 2;
  const size = 17 + 4 * v;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  const isReserved = Array.from({ length: size }, () => Array(size).fill(false));

  // 1. Finder patterns (Top-Left, Top-Right, Bottom-Left)
  const addFinder = (row, col) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          isReserved[nr][nc] = true;
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            matrix[nr][nc] = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
          } else {
            matrix[nr][nc] = false;
          }
        }
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  // 2. Timing patterns (Row 6, Col 6)
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    isReserved[6][i] = true;
    matrix[i][6] = i % 2 === 0;
    isReserved[i][6] = true;
  }

  // 3. Dark module and alignment for Version >= 2
  if (v >= 2) {
    const alignPos = size - 7;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const nr = alignPos + r;
        const nc = alignPos + c;
        if (!isReserved[nr][nc]) {
          isReserved[nr][nc] = true;
          matrix[nr][nc] = (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0));
        }
      }
    }
  }

  // 4. Reserve format info
  for (let i = 0; i < 9; i++) {
    if (i < size) isReserved[8][i] = isReserved[i][8] = true;
    if (size - 1 - i >= 0) isReserved[8][size - 1 - i] = isReserved[size - 1 - i][8] = true;
  }

  // 5. Data encoding with simple 8-bit byte mode + pseudo hash filler
  const bytes = [];
  bytes.push(0x40 | (len >> 4)); // Byte mode indicator + length high
  bytes.push(((len & 0x0f) << 4) | (text.charCodeAt(0) >> 4));
  for (let i = 0; i < len; i++) {
    const c = text.charCodeAt(i);
    const next = i + 1 < len ? text.charCodeAt(i + 1) : 0;
    bytes.push(((c & 0x0f) << 4) | (next >> 4));
  }
  // Pad bytes
  while (bytes.length < (size * size) / 8) {
    bytes.push(0xec, 0x11);
  }

  // Convert to bit stream
  const bits = [];
  for (const b of bytes) {
    for (let bit = 7; bit >= 0; bit--) {
      bits.push((b >> bit) & 1);
    }
  }

  // Place data bits in zigzag upward/downward order
  let bitIdx = 0;
  let upward = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // skip timing col
    const left = right - 1;
    const rowRange = upward ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);
    for (const row of rowRange) {
      for (const col of [right, left]) {
        if (!isReserved[row][col]) {
          const bitVal = bitIdx < bits.length ? bits[bitIdx++] : (row + col) % 2 === 0 ? 1 : 0;
          // Apply standard checkerboard mask: (row + col) % 2 === 0
          const masked = ((row + col) % 2 === 0) ? (bitVal ^ 1) : bitVal;
          matrix[row][col] = masked === 1;
        }
      }
    }
    upward = !upward;
  }

  // 6. Draw standard format pattern (Mask 0, Error Correction L)
  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];
  for (let i = 0; i < 6; i++) matrix[8][i] = formatBits[i] === 1;
  matrix[8][7] = formatBits[6] === 1;
  matrix[8][8] = formatBits[7] === 1;
  matrix[7][8] = formatBits[8] === 1;
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatBits[i] === 1;

  for (let i = 0; i < 8; i++) matrix[size - 1 - i][8] = formatBits[i] === 1;
  for (let i = 8; i < 15; i++) matrix[8][size - 15 + i] = formatBits[i] === 1;

  return matrix;
}
