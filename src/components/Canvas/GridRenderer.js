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

  grid.setAttribute("shape-rendering", "crispEdges");
  grid.setAttribute("pointer-events", "none");
  grid.setAttribute("vector-effect", "non-scaling-stroke");

  const vb = svg.viewBox.baseVal;
  const minX = vb.x;
  const minY = vb.y;
  const width = vb.width;
  const height = vb.height;

  const step = Number(state.gridSize) || 20;
  const EPS = 1e-6;
  const inset = 0.5;

  const startX = minX;
  const endX = minX + width - inset;
  const startY = minY;
  const endY = minY + height - inset;

  // 縦線
  {
    const firstX = Math.ceil((startX + EPS) / step) * step;
    for (let x = firstX; x <= endX + EPS; x += step) {
      const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
      l.setAttribute("x1", x);
      l.setAttribute("y1", startY);
      l.setAttribute("x2", x);
      l.setAttribute("y2", startY + height);
      grid.appendChild(l);
    }
    const rightX = minX + width - inset;
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
      const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
      l.setAttribute("x1", startX);
      l.setAttribute("y1", y);
      l.setAttribute("x2", startX + width);
      l.setAttribute("y2", y);
      grid.appendChild(l);
    }
    const bottomY = minY + height - inset;
    const bottom = document.createElementNS("http://www.w3.org/2000/svg", "line");
    bottom.setAttribute("x1", startX);
    bottom.setAttribute("y1", bottomY);
    bottom.setAttribute("x2", startX + width);
    bottom.setAttribute("y2", bottomY);
    grid.appendChild(bottom);
  }
}
