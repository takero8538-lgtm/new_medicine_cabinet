// src/components/Canvas/Canvas.js
import { state } from "../../state.js";
import { renderGrid } from "./GridRenderer.js";
import { renderItems } from "./ItemRenderer.js";
import { renderPreviewLine } from "./PreviewLine.js";
import { handleLineEvents } from "./LineEvents.js";
import { handleAddItemEvents } from "./AddItemEvents.js";
import { getSvgPoint, selectItem } from "./helpers.js";
import { snap, snapAngle, snapMove } from "../../utils.js";
import { renderHandles } from "./HandleRenderer.js";

export function Canvas(onUpdate, isEditable = true) {
  const wrap = document.createElement("div");
  wrap.className = "canvas-wrap scrolling"; // 初期状態はスクロール許可

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  const vbWidth = state.canvasWidth;
  const vbHeight = state.canvasHeight;

  svg.setAttribute("viewBox", `0 0 ${vbWidth} ${vbHeight}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  wrap.style.setProperty("--svg-aspect", vbWidth / vbHeight);
  svg.style.display = "block";

  const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  gridGroup.setAttribute("class", "grid");
  svg.appendChild(gridGroup);

  const itemsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  itemsGroup.setAttribute("class", "items");
  svg.appendChild(itemsGroup);

  const handleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  handleGroup.setAttribute("class", "handles");
  svg.appendChild(handleGroup);

  renderGrid(svg);

  let previewLine = null;
  let renderPending = false;

  function doRender() {
    itemsGroup.innerHTML = "";
    renderItems(svg, onUpdate, isEditable, itemsGroup);

    if (state.mode === "draw-line") {
      previewLine = renderPreviewLine(svg, previewLine, state);
    } else if (previewLine) {
      svg.removeChild(previewLine);
      previewLine = null;
    }

    renderHandles(svg, handleGroup, state, onUpdate);

    renderPending = false;
  }

  function render() {
    if (!renderPending) {
      renderPending = true;
      requestAnimationFrame(doRender);
    }
  }

  handleLineEvents(svg, render, onUpdate);
  handleAddItemEvents(svg, render, onUpdate);

  const START_THRESHOLD = 8;

  svg.addEventListener("pointerdown", (e) => {
    const g = e.target.closest("g.item");
    const rawId = g?.dataset?.id ?? null;

    const itemByRaw =
      rawId != null ? state.items.find((it) => String(it.id) === String(rawId)) : null;

    const targetId =
      itemByRaw?.id ?? (e.target.classList.contains("grip") ? state.selectedId : null);

    // 非選択状態 → スクロール許可
    if (!targetId || state.selectedId === null) {
      state.interaction = null;
      wrap.classList.add("scrolling");
      wrap.classList.remove("editing");
      return;
    }

    // まだ選択されていない場合は選択だけ
    if (state.selectedId !== targetId) {
      selectItem(state, targetId, onUpdate);
      render();
      return;
    }

    // 選択済みなら編集専用に切り替え
    e.preventDefault();
    wrap.classList.add("editing");
    wrap.classList.remove("scrolling");

    const { x, y } = getSvgPoint(e, svg);
    state.interaction = {
      type: "pending",
      id: targetId,
      startTarget: e.target,
      startX: x,
      startY: y,
      lastX: x,
      lastY: y,
      pending: false,
      started: false
    };
  }, { passive: false });

  svg.addEventListener("pointermove", (e) => {
    if (!state.interaction) return;

    if (state.interaction.type === "pending") {
      const target = state.interaction.startTarget;
      if (target.classList.contains("handle")) {
        state.interaction.type = "resize";
      } else if (target.classList.contains("rotate")) {
        state.interaction.type = "rotate";
      } else {
        state.interaction.type = "move";
      }
    }

    const { x, y } = getSvgPoint(e, svg);
    const dx = x - state.interaction.lastX;
    const dy = y - state.interaction.lastY;

    if (!state.interaction.started) {
      const totalDx = x - state.interaction.startX;
      const totalDy = y - state.interaction.startY;
      const dist = Math.hypot(totalDx, totalDy);
      if (dist < START_THRESHOLD) return;

      state.interaction.lastX = x;
      state.interaction.lastY = y;
      state.interaction.started = true;
      return;
    }

    state.interaction.lastX = x;
    state.interaction.lastY = y;

    if (!state.interaction.pending) {
      state.interaction.pending = true;
      requestAnimationFrame(() => {
        const item = state.items.find((it) => it.id == state.interaction.id);
        if (!item) {
          state.interaction.pending = false;
          return;
        }

        if (state.interaction.type === "move") {
          if (item.type === "line") {
            item.x1 += dx; item.y1 += dy;
            item.x2 += dx; item.y2 += dy;
            const lineEl = svg.querySelector(`g.item[data-id="${item.id}"] line`);
            if (lineEl) {
              lineEl.setAttribute("x1", item.x1);
              lineEl.setAttribute("y1", item.y1);
              lineEl.setAttribute("x2", item.x2);
              lineEl.setAttribute("y2", item.y2);
            }
          } else {
            item.x += dx; item.y += dy;
            const rectEl = svg.querySelector(`g.item[data-id="${item.id}"] rect`);
            if (rectEl) {
              rectEl.setAttribute("x", item.x);
              rectEl.setAttribute("y", item.y);
            }
          }
        }
        state.interaction.pending = false;
      });
    }
  }, { passive: false });

  function endInteraction(e) {
    if (!state.interaction) return;

    const item = state.items.find((it) => it.id == state.interaction.id);
    if (item && state.interaction.type === "move" && state.interaction.started) {
      if (item.type === "line") {
        item.x1 = snap(item.x1, state.gridSize);
        item.y1 = snap(item.y1, state.gridSize);
        item.x2 = snap(item.x2, state.gridSize);
        item.y2 = snap(item.y2, state.gridSize);
        const angle = Math.atan2(item.y2 - item.y1, item.x2 - item.x1) * 180 / Math.PI;
        const snapped = snapAngle(angle);
        const len = Math.hypot(item.x2 - item.x1, item.y2 - item.y1);
        item.x2 = item.x1 + len * Math.cos(snapped * Math.PI / 180);
        item.y2 = item.y1 + len * Math.sin(snapped * Math.PI / 180);
      } else {
        const s = snapMove(item.x, item.y, state.items);
        item.x = s.x; item.y = s.y;
      }
    }

    state.interaction = null;
    wrap.classList.remove("editing");
    wrap.classList.add("scrolling");
    render(); onUpdate();
  }

  svg.addEventListener("pointerup", endInteraction, { passive: false });
  svg.addEventListener("pointercancel", endInteraction, { passive: false });
  svg.addEventListener("pointerleave", endInteraction, { passive: false });

  wrap.appendChild(svg);
  return { el: wrap, render };
}
