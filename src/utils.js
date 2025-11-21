// utils.js
import { state } from "./state.js";

// グリッドスナップ
export function snap(n, grid = state.gridSize || 20) {
  return Math.round(n / grid) * grid;
}

// 角度の直角補助（±10°で 0/90/180/270 に補正）
export function snapAngle(deg, threshold = 10) {
  const targets = [0, 90, 180, 270];
  let nearest = targets[0];
  for (const t of targets) {
    if (Math.abs(deg - t) < Math.abs(deg - nearest)) nearest = t;
  }
  return Math.abs(deg - nearest) <= threshold ? nearest : deg;
}

// 回転座標変換（中心回転）
export function rotatePoint(px, py, cx, cy, deg) {
  const rad = (deg * Math.PI) / 180;
  const s = Math.sin(rad), c = Math.cos(rad);
  const x = px - cx, y = py - cy;
  return { x: x * c - y * s + cx, y: x * s + y * c + cy };
}

// アイテムの四隅（回転考慮）
export function corners(item) {
  const cx = item.x + item.width / 2;
  const cy = item.y + item.height / 2;
  const pts = [
    { x: item.x, y: item.y },
    { x: item.x + item.width, y: item.y },
    { x: item.x + item.width, y: item.y + item.height },
    { x: item.x, y: item.y + item.height }
  ];
  return (item.rotation || 0)
    ? pts.map(p => rotatePoint(p.x, p.y, cx, cy, item.rotation))
    : pts;
}

// 全端点（接点補助用）
export function collectSnapPoints(items) {
  const pts = [];
  for (const it of items) {
    if (it.type === "line") {
      pts.push({ x: it.x1, y: it.y1 }, { x: it.x2, y: it.y2 });
    } else {
      pts.push(...corners(it));
    }
  }
  return pts;
}

// 端点に吸着
export function snapToPoints(x, y, points, threshold = 8) {
  for (const p of points) {
    if (Math.abs(x - p.x) <= threshold && Math.abs(y - p.y) <= threshold) {
      return { x: p.x, y: p.y };
    }
  }
  return { x, y };
}

// 移動時スナップ（グリッド＋端点）
export function snapMove(x, y, items) {
  // グリッドスナップ
  let nx = snap(x);
  let ny = snap(y);

  // 他アイテム端点スナップ
  const points = collectSnapPoints(items);
  const snapped = snapToPoints(nx, ny, points);

  return { x: snapped.x, y: snapped.y };
}
