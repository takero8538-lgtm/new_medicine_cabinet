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

  // 未選択状態ではスクロール・ピンチを許可
  svg.style.touchAction = "auto";

  // 選択・ドラッグ移動処理
  svg.addEventListener("pointerdown", (e) => {
    // アイテムまたはグリップにヒットしているか
    let g = e.target.closest("g.item");
    let id = g?.dataset?.id ? g.dataset.id : null;

    if (!id && e.target.classList.contains("grip")) {
      id = state.selectedId;
    }

    // 空白タップなら選択解除＋スクロール許可
    if (!id) {
      if (state.selectedId != null) {
        state.selectedId = null;
        svg.style.touchAction = "auto"; // 選択解除で元に戻す
        render(); onUpdate();
      }
      return;
    }

    // 選択確定（選択した瞬間にスクロール・ピンチ禁止へ）
    selectItem(state, id, onUpdate);
    svg.style.touchAction = "none";

    const tag = e.target.tagName.toLowerCase();
    const isShape = ["rect", "line", "text", "tspan", "circle", "path"].includes(tag);
    if (!isShape) return;

    // ドラッグ開始時のブラウザ既定挙動も抑制＋キャプチャ
    try {
      e.target.setPointerCapture?.(e.pointerId);
    } catch (_) {}
    e.preventDefault();

    const { x, y } = getSvgPoint(e, svg);
    state.interaction = {
      type: "move",
      id,
      lastX: x,
      lastY: y,
      pending: false,
    };
  }, { passive: false });

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
  }, { passive: false });

  function endInteraction(e) {
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

    // 操作終了後も「選択中」である限りはスクロール禁止を維持
    svg.style.touchAction = state.selectedId != null ? "none" : "auto";

    try {
      e.target.releasePointerCapture?.(e.pointerId);
    } catch (_) {}

    state.interaction = null;
    render(); onUpdate();
  }

  svg.addEventListener("pointerup", endInteraction, { passive: false });
  svg.addEventListener("pointercancel", endInteraction, { passive: false });
  svg.addEventListener("pointerleave", endInteraction, { passive: false });

  wrap.appendChild(svg);
  return { el: wrap, render };
}
