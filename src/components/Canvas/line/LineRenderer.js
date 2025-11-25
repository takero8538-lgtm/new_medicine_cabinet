// LineRenderer.js
import { state } from "../../../state.js";
import { selectItem } from "../helpers.js";
import { renderHandles } from "./LineHandles.js";

export function renderLine(svg, g, item, onUpdate, isEditable) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", item.x1);
  line.setAttribute("y1", item.y1);
  line.setAttribute("x2", item.x2);
  line.setAttribute("y2", item.y2);
  line.setAttribute("stroke", item.stroke || "#333");
  line.setAttribute("stroke-width", item.strokeWidth || 3);
  line.setAttribute("data-id", item.id);

  g.appendChild(line);

  if (isEditable) {
    // ★ 移動は Canvas.js に統合済みなので削除
    renderHandles(svg, line, item, g, onUpdate);
  }
}
