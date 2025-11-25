import { state } from "../../state.js";

/**
 * 選択中アイテムに対して非回転の補助バー（4方向矢印アイコン＋中央四角形）を描画
 * @param {SVGElement} svg - SVGルート
 * @param {SVGGElement} handleGroup - ハンドル用グループ
 * @param {object} state - 全体状態
 * @param {function} onUpdate - 更新コールバック
 */
export function renderHandles(svg, handleGroup, state, onUpdate) {
  // 前回のハンドルをクリア
  handleGroup.innerHTML = "";

  const item = state.items.find(i => i.id === state.selectedId);
  if (!item) return;

  if (item.type === "line") {
    const len = Math.hypot(item.x2 - item.x1, item.y2 - item.y1);
    if (len < 80) {
      const mx = (item.x1 + item.x2) / 2;
      const my = (item.y1 + item.y2) / 2;
      const cy = my + 14;
      drawGrip(handleGroup, mx, cy);
    }
  } else {
    const isSmall = item.width < 60 || item.height < 40;
    if (isSmall) {
      const cx = item.x + item.width / 2;
      const cy = item.y + item.height + 14;
      drawGrip(handleGroup, cx, cy);
    }
  }
}

/**
 * 4方向矢印＋中央四角形を描画
 */
function drawGrip(group, cx, cy) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

  // サイズ調整（スマホ対応）
  const len = 28; // 軸線の長さを少し長めに
  const aw = 12;  // 矢印の幅
  const ah = 14;  // 矢印の高さ

  // 位置調整：少し下にずらす
  const offsetY = 10;
  cy += offsetY;

  const d = `
    M ${cx} ${cy - len} L ${cx} ${cy - ah}
    M ${cx - aw} ${cy - ah} L ${cx} ${cy - len} L ${cx + aw} ${cy - ah}

    M ${cx} ${cy + len} L ${cx} ${cy + ah}
    M ${cx - aw} ${cy + ah} L ${cx} ${cy + len} L ${cx + aw} ${cy + ah}

    M ${cx - len} ${cy} L ${cx - ah} ${cy}
    M ${cx - ah} ${cy - aw} L ${cx - len} ${cy} L ${cx - ah} ${cy + aw}

    M ${cx + len} ${cy} L ${cx + ah} ${cy}
    M ${cx + ah} ${cy - aw} L ${cx + len} ${cy} L ${cx + ah} ${cy + aw}
  `;

  path.setAttribute("d", d.trim());
  path.setAttribute("stroke", "#333");
  path.setAttribute("stroke-width", "4");     // 太めにしてヒット領域拡大
  path.setAttribute("fill", "none");
  path.setAttribute("class", "grip");
  path.style.pointerEvents = "auto";
  path.style.touchAction = "none";
  group.appendChild(path);

  // 中央四角形（見た目＋ヒット判定）
  const center = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  const size = 28; // 四角形のサイズ（スマホでも触れる大きさ）
  center.setAttribute("x", cx - size / 2);
  center.setAttribute("y", cy - size / 2);
  center.setAttribute("width", size);
  center.setAttribute("height", size);
  center.setAttribute("rx", 4); // 角丸（任意）
  center.setAttribute("fill", "#aaa");
  center.setAttribute("stroke", "#666");
  center.setAttribute("stroke-width", "1.5");
  center.setAttribute("class", "grip");
  center.style.pointerEvents = "auto";
  center.style.touchAction = "none";
  group.appendChild(center);
}
