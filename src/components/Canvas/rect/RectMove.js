// RectMove.js
import { getSvgPoint, selectItem } from "../helpers.js";
import { state } from "../../../state.js";
import { snapMove } from "../../../utils.js";

export function renderMove(svg, rect, label, item, onUpdate) {
  rect.onpointerdown = (e) => {
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
          item.x += dx;
          item.y += dy;
          lastX = x; lastY = y;

          rect.setAttribute("x", item.x);
          rect.setAttribute("y", item.y);
          rect.setAttribute(
            "transform",
            `rotate(${item.rotation || 0}, ${item.x + item.width / 2}, ${item.y + item.height / 2})`
          );

          pending = false;
        });
      }
    };

    const up = () => {
      svg.removeEventListener("pointermove", move);
      svg.removeEventListener("pointerup", up);

      const snapped = snapMove(item.x, item.y, state.items);
      item.x = snapped.x;
      item.y = snapped.y;

      rect.setAttribute("x", item.x);
      rect.setAttribute("y", item.y);

      onUpdate();
    };

    svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerup", up);
  };
}
