// src/components/Canvas/ItemRenderer.js
import { state } from "../../state.js";
import { renderLine } from "./line/LineRenderer.js";
import { renderRect } from "./rect/RectRenderer.js";

export function renderItems(svg, onUpdate, isEditable) {
  // 既存アイテム削除
  [...svg.querySelectorAll("g.item")].forEach(g => g.remove());

  // まとめて生成
  const fragment = document.createDocumentFragment();

  for (const item of state.items) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute(
      "class",
      "item" + (state.selectedId === item.id ? " selected" : "")
    );
    g.setAttribute("data-id", item.id);

    if (item.type === "line") {
      renderLine(svg, g, item, onUpdate, isEditable);
    } else {
      renderRect(svg, g, item, onUpdate, isEditable);
    }

    fragment.appendChild(g);
  }

  // 一括追加
  svg.appendChild(fragment);
}
