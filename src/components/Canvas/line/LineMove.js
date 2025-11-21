// LineMove.js
import { getSvgPoint, selectItem } from "../helpers.js";
import { snapAngle, snap } from "../../../utils.js";
import { state } from "../../../state.js";

export function renderMove(svg, line, item, onUpdate) {
  line.onpointerdown = (e) => {
    e.stopPropagation();
    selectItem(state, item.id, onUpdate);
    let { x: lastX, y: lastY } = getSvgPoint(e, svg);

    let pending = false;

    const move = (ev) => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => {
          const { x, y } = getSvgPoint(ev, svg);
          const dx = x - lastX;
          const dy = y - lastY;
          item.x1 += dx; item.y1 += dy;
          item.x2 += dx; item.y2 += dy;
          lastX = x; lastY = y;

          line.setAttribute("x1", item.x1);
          line.setAttribute("y1", item.y1);
          line.setAttribute("x2", item.x2);
          line.setAttribute("y2", item.y2);
          pending = false;
        });
      }
    };

    const up = () => {
      svg.removeEventListener("pointermove", move);
      svg.removeEventListener("pointerup", up);

      // 両端スナップ
      item.x1 = snap(item.x1, state.gridSize);
      item.y1 = snap(item.y1, state.gridSize);
      item.x2 = snap(item.x2, state.gridSize);
      item.y2 = snap(item.y2, state.gridSize);

      // 角度スナップ（長さ維持）
      const angle = Math.atan2(item.y2 - item.y1, item.x2 - item.x1) * 180 / Math.PI;
      const snapped = snapAngle(angle);
      const len = Math.hypot(item.x2 - item.x1, item.y2 - item.y1);
      item.x2 = item.x1 + len * Math.cos(snapped * Math.PI / 180);
      item.y2 = item.y1 + len * Math.sin(snapped * Math.PI / 180);

      line.setAttribute("x1", item.x1);
      line.setAttribute("y1", item.y1);
      line.setAttribute("x2", item.x2);
      line.setAttribute("y2", item.y2);

      onUpdate();
    };

    svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerup", up);
  };
}
