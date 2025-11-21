// AddItemEvents.js
import { state, nextShelfId, nextAlphaId } from "../../state.js";
import { getSvgPoint } from "./helpers.js";

export function handleAddItemEvents(svg, render, onUpdate) {
  svg.addEventListener("pointerdown", (e) => {
    const { x, y } = getSvgPoint(e, svg);

    if (state.mode === "add-shelf") {
      const id = nextShelfId(state.items);
      state.items.push({
        id,
        type: "shelf",
        name: `棚${id}`,
        x, y,
        width: 120,
        height: 60,
        rotation: 0,
        fill: "#ddd",
        fontSize: 14   // ← 初期値追加
      });
      state.selectedId = id;
      state.mode = "select";
      render(); onUpdate();

    } else if (state.mode === "add-equipment") {
      const id = nextAlphaId(state.items, "E");
      state.items.push({
        id,
        type: "equipment",
        name: "設備",
        x, y,
        width: 140,
        height: 70,
        rotation: 0,
        fill: "#ddd",
        fontSize: 14   // ← 初期値追加
      });
      state.selectedId = id;
      state.mode = "select";
      render(); onUpdate();

    } else if (state.mode === "add-door") {
      const id = nextAlphaId(state.items, "D");
      state.items.push({
        id,
        type: "door",
        name: "入口",
        x, y,
        width: 60,
        height: 12,
        rotation: 0,
        fill: "#aaf",
        fontSize: 14   // ← 初期値追加
      });
      state.selectedId = id;
      state.mode = "select";
      render(); onUpdate();
    }
  });
}
