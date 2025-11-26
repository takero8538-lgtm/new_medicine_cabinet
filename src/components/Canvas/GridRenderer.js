// src/components/Canvas/GridRenderer.js
import { state } from "../../state.js";

export function renderGrid(svg) {
  // 既存のグリッドグループを取得
  let grid = svg.querySelector("g.grid");
  if (!grid) {
    grid = document.createElementNS("http://www.w3.org/2000/svg", "g");
    grid.setAttribute("class", "grid");
    svg.insertBefore(grid, svg.firstChild); // 常に最背面に配置
  }

  // 中身をクリア
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }

  // 属性設定（線が消えにくいように調整）
  grid.setAttribute("shape-rendering", "geometricPrecision");
  grid.setAttribute("pointer-events", "none");
  grid.removeAttribute("vector-effect"); // non-scaling-strokeは外す

  const vb = svg.viewBox.baseVal;
  const minX = vb.x;
  const minY = vb.y;
  const width = vb.width;
  const height = vb.height;

  const step = Number(state.gridSize) || 20;
  const EPS = 1e-6;

  const startX = minX;
  const endX = minX + width;
  const startY = minY;
  const endY = minY + height;

  // 縦線
  {
    const firstX = Math.ceil((startX + EPS) / step) * step;
    for (let x = firstX; x <= endX + EPS; x += step) {
      const ix = Math.round(x); // 整数に揃える
      const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
      l.setAttribute("x1", ix);
      l.setAttribute("y1", startY);
      l.setAttribute("x2", ix);
      l.setAttribute("y2", startY + height);
      grid.appendChild(l);
    }
    const rightX = Math.round(endX);
    const right = document.createElementNS("http://www.w3.org/2000/svg", "line");
    right.setAttribute("x1", rightX);
    right.setAttribute("y1", startY);
    right.setAttribute("x2", rightX);
    right.setAttribute("y2", startY + height);
    grid.appendChild(right);
  }

  // 横線
  {
    const firstY = Math.ceil((startY + EPS) / step) * step;
    for (let y = firstY; y <= endY + EPS; y += step) {
      const iy = Math.round(y); // 整数に揃える
      const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
      l.setAttribute("x1", startX);
      l.setAttribute("y1", iy);
      l.setAttribute("x2", startX + width);
      l.setAttribute("y2", iy);
      grid.appendChild(l);
    }
    const bottomY = Math.round(endY);
    const bottom = document.createElementNS("http://www.w3.org/2000/svg", "line");
    bottom.setAttribute("x1", startX);
    bottom.setAttribute("y1", bottomY);
    bottom.setAttribute("x2", startX + width);
    bottom.setAttribute("y2", bottomY);
    grid.appendChild(bottom);
  }
}
