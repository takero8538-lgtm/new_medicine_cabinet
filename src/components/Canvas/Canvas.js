// src/components/Canvas/Canvas.js
import { state } from "../../state.js";
import { renderGrid } from "./GridRenderer.js";
import { renderItems } from "./ItemRenderer.js";
import { renderPreviewLine } from "./PreviewLine.js";
import { handleLineEvents } from "./LineEvents.js";
import { handleAddItemEvents } from "./AddItemEvents.js";
import { getSvgPoint } from "./helpers.js";
import { snap, snapAngle, snapMove } from "../../utils.js";

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

  // グリッド用グループを作成して追加
  const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  gridGroup.setAttribute("class", "grid");
  svg.appendChild(gridGroup);

  // グリッド描画（初期化時のみ）
  renderGrid(svg);

  let previewLine = null;
  let renderPending = false;

  // 実際の描画処理
  function doRender() {
    renderItems(svg, onUpdate, isEditable);

    // プレビュー線は draw-line モードのときだけ更新
    if (state.mode === "draw-line") {
      previewLine = renderPreviewLine(svg, previewLine, state);
    } else if (previewLine) {
      svg.removeChild(previewLine);
      previewLine = null;
    }

    renderPending = false;
  }

  // スケジューラ関数（イベントから呼ばれる）
  function render() {
    if (!renderPending) {
      renderPending = true;
      requestAnimationFrame(doRender);
    }
  }

  // イベントハンドラ登録
  handleLineEvents(svg, render, onUpdate);
  handleAddItemEvents(svg, render, onUpdate);

  // ★ 選択後ドラッグで移動する処理を追加（ログ付き）
  svg.addEventListener("pointerdown", (e) => {
    console.log("pointerdown", e.target.tagName, "selectedId:", state.selectedId);

    const g = e.target.closest("g.item");
    const id = g?.dataset?.id ? g.dataset.id : null;
    if (!id || id !== state.selectedId) return;

    const isShape = ["rect", "line", "text", "tspan"].includes(e.target.tagName);
    if (!isShape) return;


    const { x, y } = getSvgPoint(e, svg);
    state.interaction = {
      type: "move",
      id,
      startX: x,
      startY: y,
      lastX: x,
      lastY: y,
    };
  });

  svg.addEventListener("pointermove", (e) => {
    if (!state.interaction || state.interaction.type !== "move") return;
    const { x, y } = getSvgPoint(e, svg);
    const dx = x - state.interaction.lastX;
    const dy = y - state.interaction.lastY;
    state.interaction.lastX = x;
    state.interaction.lastY = y;

    console.log("pointermove", "dx:", dx, "dy:", dy, "interaction:", state.interaction);

    const item = state.items.find((it) => it.id == state.interaction.id);
    if (!item) return;
    if (item.type === "line") {
      item.x1 += dx; item.y1 += dy;
      item.x2 += dx; item.y2 += dy;
    } else {
      item.x += dx; item.y += dy;
    }
    render();
  });

  svg.addEventListener("pointerup", () => {
    if (!state.interaction || state.interaction.type !== "move") return;

    console.log("pointerup", "interaction:", state.interaction);

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
