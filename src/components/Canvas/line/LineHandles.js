// LineHandles.js
import { getSvgPoint, selectItem } from "../helpers.js";
import { state } from "../../../state.js";
import { snap } from "../../../utils.js";

export function renderHandles(svg, line, item, g, onUpdate) {
  const handle1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  handle1.setAttribute("cx", item.x1);
  handle1.setAttribute("cy", item.y1);
  handle1.setAttribute("r", 5);
  handle1.setAttribute("class", "handle");
  handle1.style.touchAction = "none"; // スクロール誤動作防止
  g.appendChild(handle1);

  const handle2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  handle2.setAttribute("cx", item.x2);
  handle2.setAttribute("cy", item.y2);
  handle2.setAttribute("r", 5);
  handle2.setAttribute("class", "handle");
  handle2.style.touchAction = "none";
  g.appendChild(handle2);

  function attachHandleDrag(handle, pointKeyX, pointKeyY) {
    handle.onpointerdown = (e) => {
      // ★ スクロール誤発火防止
      e.preventDefault();
      e.stopPropagation();

      selectItem(state, item.id, onUpdate);

      let pending = false;

      const move = (ev) => {
        if (!pending) {
          pending = true;
          requestAnimationFrame(() => {
            const { x, y } = getSvgPoint(ev, svg);
            item[pointKeyX] = x;
            item[pointKeyY] = y;
            line.setAttribute("x1", item.x1);
            line.setAttribute("y1", item.y1);
            line.setAttribute("x2", item.x2);
            line.setAttribute("y2", item.y2);
            handle.setAttribute("cx", x);
            handle.setAttribute("cy", y);
            pending = false;
          });
        }
      };

      const up = () => {
        svg.removeEventListener("pointermove", move);
        svg.removeEventListener("pointerup", up);

        // スナップ
        item[pointKeyX] = snap(item[pointKeyX], state.gridSize);
        item[pointKeyY] = snap(item[pointKeyY], state.gridSize);

        line.setAttribute("x1", item.x1);
        line.setAttribute("y1", item.y1);
        line.setAttribute("x2", item.x2);
        line.setAttribute("y2", item.y2);
        handle.setAttribute("cx", item[pointKeyX]);
        handle.setAttribute("cy", item[pointKeyY]);

        onUpdate();
      };

      svg.addEventListener("pointermove", move);
      svg.addEventListener("pointerup", up);
    };
  }

  attachHandleDrag(handle1, "x1", "y1");
  attachHandleDrag(handle2, "x2", "y2");
}
