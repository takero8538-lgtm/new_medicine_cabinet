// src/components/Canvas/Canvas.js
import { state } from "../../state.js";
import { renderGrid } from "./GridRenderer.js";
import { renderItems } from "./ItemRenderer.js";
import { renderPreviewLine } from "./PreviewLine.js";
import { handleLineEvents } from "./LineEvents.js";
import { handleAddItemEvents } from "./AddItemEvents.js";
import { getSvgPoint, selectItem } from "./helpers.js";
import { snap, snapAngle, snapMove } from "../../utils.js";
// 追加：非回転ハンドル描画
import { renderHandles } from "./HandleRenderer.js";

export function Canvas(onUpdate, isEditable = true) {
  const wrap = document.createElement("div");
  wrap.className = "canvas-wrap";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  // 論理サイズ（固定値）
  const vbWidth = state.canvasWidth;
  const vbHeight = state.canvasHeight;

  // viewBoxを固定
  svg.setAttribute("viewBox", `0 0 ${vbWidth} ${vbHeight}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  // CSSへ比率を渡す（横幅 ÷ 縦幅）
  wrap.style.setProperty("--svg-aspect", vbWidth / vbHeight);

  svg.style.display = "block";

  // グリッド用グループ
  const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  gridGroup.setAttribute("class", "grid");
  svg.appendChild(gridGroup);

  // アイテム用グループ
  const itemsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  itemsGroup.setAttribute("class", "items");
  svg.appendChild(itemsGroup);

  // 非回転ハンドル用グループ
  const handleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  handleGroup.setAttribute("class", "handles");
  svg.appendChild(handleGroup);

  // グリッド描画
  renderGrid(svg);

  let previewLine = null;
  let renderPending = false;

  // 描画処理
  function doRender() {
    itemsGroup.innerHTML = "";
    renderItems(svg, onUpdate, isEditable, itemsGroup);

    if (state.mode === "draw-line") {
      previewLine = renderPreviewLine(svg, previewLine, state);
    } else if (previewLine) {
      svg.removeChild(previewLine);
      previewLine = null;
    }

    // ハンドル描画
    renderHandles(svg, handleGroup, state, onUpdate);

    renderPending = false;
  }

  function render() {
    if (!renderPending) {
      renderPending = true;
      requestAnimationFrame(doRender);
    }
  }

  // イベントハンドラ登録
  handleLineEvents(svg, render, onUpdate);
  handleAddItemEvents(svg, render, onUpdate);

  // 選択→ドラッグ移動処理
  svg.addEventListener("pointerdown", (e) => {
    let g = e.target.closest("g.item");
    let id = g?.dataset?.id ? g.dataset.id : null;

    // グリップ(circle)をクリックした場合は選択中アイテムを対象にする
    if (!id && e.target.classList.contains("grip")) {
      id = state.selectedId;
    }
    if (!id) return;

    selectItem(state, id, onUpdate);

    const tag = e.target.tagName.toLowerCase();
    const isShape = ["rect", "line", "text", "tspan", "circle", "path"].includes(tag);
    if (!isShape) return;

    const { x, y } = getSvgPoint(e, svg);
    state.interaction = {
      type: "move",
      id,
      lastX: x,
      lastY: y,
      pending: false,
    };
  });

  svg.addEventListener("pointermove", (e) => {
    if (!state.interaction || state.interaction.type !== "move") return;

    const { x, y } = getSvgPoint(e, svg);
    const dx = x - state.interaction.lastX;
    const dy = y - state.interaction.lastY;
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

        if (item.type === "line") {
          item.x1 += dx; item.y1 += dy;
          item.x2 += dx; item.y2 += dy;
        } else {
          item.x += dx; item.y += dy;
        }

        state.interaction.pending = false;
        render();
      });
    }
  });

  svg.addEventListener("pointerup", () => {
    if (!state.interaction || state.interaction.type !== "move") return;

    const item = state.items.find((it) => it.id == state.interaction.id);
    if (item) {
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
    render(); onUpdate();
  });

  wrap.appendChild(svg);
  return { el: wrap, render };
}
