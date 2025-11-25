// src/components/Canvas/rect/RectRenderer.js
import { state } from "../../../state.js";
import { selectItem, createLabel } from "../helpers.js";
import { renderResize } from "./RectResize.js";
import { renderRotate } from "./RectRotate.js";

export function renderRect(svg, g, item, onUpdate, isEditable) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", item.x);
  rect.setAttribute("y", item.y);
  rect.setAttribute("width", item.width);
  rect.setAttribute("height", item.height);
  rect.setAttribute("fill", item.fill || "lightgray");
  rect.setAttribute("stroke", "black");

  // rect にも data-id を付与（検索ハイライト・編集イベント両対応）
  rect.setAttribute("data-id", item.id);

  g.appendChild(rect);

  // ラベル生成（固定サイズ）
  const label = createLabel(g, item);

  // ★ 回転を初期描画時に反映
  const cx = item.x + item.width / 2;
  const cy = item.y + item.height / 2;
  g.setAttribute(
    "transform",
    `rotate(${item.rotation || 0}, ${cx}, ${cy})`
  );

  if (isEditable) {
    // 選択イベント
    rect.addEventListener("pointerdown", ev => {
      ev.stopPropagation();
      selectItem(state, item.id, onUpdate);
    });

    // ★ リサイズ・回転の呼び出しのみ残す（移動は Canvas.js に統合済み）
    renderResize(svg, rect, label, item, g, onUpdate);
    renderRotate(svg, rect, item, g, onUpdate);
  }
}
