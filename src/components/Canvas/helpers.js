// src/components/Canvas/helpers.js

export function getSvgPoint(ev, svg) {
  const pt = svg.createSVGPoint();
  pt.x = ev.clientX;
  pt.y = ev.clientY;
  const ctm = svg.getScreenCTM();
  if (ctm && typeof ctm.inverse === "function") {
    const svgP = pt.matrixTransform(ctm.inverse());
    return { x: svgP.x, y: svgP.y };
  }
  const rect = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const scaleX = vb.width / rect.width;
  const scaleY = vb.height / rect.height;
  const x = (ev.clientX - rect.left) * scaleX + vb.x;
  const y = (ev.clientY - rect.top) * scaleY + vb.y;
  return { x, y };
}

// 選択確定（スクロール禁止の切り替えは Canvas.js 側で行う）
export function selectItem(state, id, onUpdate) {
  state.selectedId = id;
  onUpdate();
}

// 選択解除（スクロール許可の切り替えは Canvas.js 側で行う）
export function deselectItem(state, onUpdate) {
  state.selectedId = null;
  onUpdate();
}

// ラベル生成（折り返し対応）
export function createLabel(g, item) {
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("dominant-baseline", "text-before-edge");

  const fontSize = Number(item.fontSize) || 14;
  label.setAttribute("font-size", fontSize);

  const lineHeight = 1.3; // 行間倍率
  const widthCoeff = 0.6; // 文字幅係数（英数基準、日本語は広めに調整可）
  const maxCharsPerLine = Math.max(1, Math.floor(item.width / (fontSize * widthCoeff)));

  const text = item.name || "";
  const lines = [];
  for (let i = 0; i < text.length; i += maxCharsPerLine) {
    lines.push(text.slice(i, i + maxCharsPerLine));
  }

  // 高さ制約（矩形高さの90%まで使用）
  const maxHeight = item.height * 0.9;
  const totalHeight = lines.length * fontSize * lineHeight;

  let yStart = item.y + (item.height - Math.min(totalHeight, maxHeight)) / 2;

  lines.forEach((line, idx) => {
    // 高さ制約を超える場合は省略記号を付けて打ち切り
    const currentY = yStart + idx * fontSize * lineHeight;
    if (currentY + fontSize > item.y + item.height * 1.05) {
      const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      tspan.textContent = "…";
      tspan.setAttribute("x", item.x + item.width / 2);
      tspan.setAttribute("y", currentY);
      label.appendChild(tspan);
      return;
    }
    const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    tspan.textContent = line;
    tspan.setAttribute("x", item.x + item.width / 2);
    tspan.setAttribute("y", currentY);
    label.appendChild(tspan);
  });

  g.appendChild(label);
  return label;
}
