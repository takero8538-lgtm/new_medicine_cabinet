// LineEvents.js
import { state } from "../../state.js";
import { snap, collectSnapPoints, snapToPoints } from "../../utils.js";
import { getSvgPoint } from "./helpers.js";

export function handleLineEvents(svg, render, onUpdate) {
  svg.addEventListener("pointermove", (e) => {
    if (state.mode === "draw-line" && state.tempLine && state.tempLine.x1 != null) {
      const points = collectSnapPoints(state.items);
      const { x, y } = getSvgPoint(e, svg);
      let nx = snap(x, state.gridSize);
      let ny = snap(y, state.gridSize);
      ({ x: nx, y: ny } = snapToPoints(nx, ny, points));
      state.tempLine.x2 = nx;
      state.tempLine.y2 = ny;
      render();
    }
  });

  svg.addEventListener("pointerdown", (e) => {
    if (state.mode !== "draw-line") return;
    const points = collectSnapPoints(state.items);
    const { x, y } = getSvgPoint(e, svg);
    let nx = snap(x, state.gridSize);
    let ny = snap(y, state.gridSize);
    ({ x: nx, y: ny } = snapToPoints(nx, ny, points));

    if (state.tempLine.x1 == null) {
      // 始点を設定
      state.tempLine.x1 = nx;
      state.tempLine.y1 = ny;
    } else {
      // 終点を設定して確定
      state.tempLine.x2 = nx;
      state.tempLine.y2 = ny;
      state.items.push({ ...state.tempLine });
      state.mode = "select";
      state.tempLine = null;
    }
    render();
    onUpdate();
  });
}
