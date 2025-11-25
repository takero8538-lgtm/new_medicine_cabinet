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
  wrap.className = "canvas-wrap";

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

  // 初動ノイズ除去しきい値（スマホ向けは少し大きめでも可）
  const START_THRESHOLD = 8;

  // --- 選択と操作を分離 + 非選択時はスクロール専用 ---
  svg.addEventListener("pointerdown", (e) => {
    const g = e.target.closest("g.item");
    const rawId = g?.dataset?.id ?? null;

    const itemByRaw =
      rawId != null ? state.items.find((it) => String(it.id) === String(rawId)) : null;

    const targetId =
      itemByRaw?.id ?? (e.target.classList.contains("grip") ? state.selectedId : null);

    // 非選択状態 → スクロール専用
    if (!targetId || state.selectedId === null) {
      state.interaction = null;
      svg.style.touchAction = "auto"; // スクロール許可
      return;
    }

    // まだ選択されていない場合は「選択だけ」（このタップでは編集開始しない）
    if (state.selectedId !== targetId) {
      selectItem(state, targetId, onUpdate);
      render();
      return;
    }

    // 選択済みならこのpointerdown直後からスクロール禁止に固定する
    // ← 混在回避のため、最初のドラッグ前に禁止しておく
    svg.style.touchAction = "none";
    e.preventDefault?.();

    // 操作待ち（このタッチ系列で編集開始しうる）
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
      started: false // しきい値を超えて編集が確定したか
    };
  }, { passive: false });

  svg.addEventListener("pointermove", (e) => {
    if (!state.interaction) return;

    // 操作種別の仮確定（この時点では種類判定のみ）
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

    // 初動しきい値：距離が閾値未満なら編集開始しない（指ブレや座標ノイズを無視）
    if (!state.interaction.started) {
      const totalDx = x - state.interaction.startX;
      const totalDy = y - state.interaction.startY;
      const dist = Math.hypot(totalDx, totalDy);
      if (dist < START_THRESHOLD) {
        return;
      }
      // 編集確定：座標を再キャプチャして基準リセット（初動ズレを吸収）
      const { x: nx, y: ny } = getSvgPoint(e, svg);
      state.interaction.lastX = nx;
      state.interaction.lastY = ny;
      state.interaction.started = true;
      return;
    }

    state.interaction.lastX = x;
    state.interaction.lastY = y;

    // 軽量化：操作中は対象アイテムのみDOM更新（全体renderはしない）
    if (!state.interaction.pending) {
      state.interaction.pending = true;
      requestAnimationFrame(() => {
        const item = state.items.find((it) => it.id == state.interaction.id);
        if (!item) {
          state.interaction.pending = false;
          return;
        }

        if (state.interaction.type === "move") {
          const ddx = dx;
          const ddy = dy;
          if (item.type === "line") {
            item.x1 += ddx; item.y1 += ddy;
            item.x2 += ddx; item.y2 += ddy;
            const lineEl = svg.querySelector(`g.item[data-id="${item.id}"] line`);
            if (lineEl) {
              lineEl.setAttribute("x1", item.x1);
              lineEl.setAttribute("y1", item.y1);
              lineEl.setAttribute("x2", item.x2);
              lineEl.setAttribute("y2", item.y2);
            }
          } else {
            item.x += ddx; item.y += ddy;
            const rectEl = svg.querySelector(`g.item[data-id="${item.id}"] rect`);
            if (rectEl) {
              rectEl.setAttribute("x", item.x);
              rectEl.setAttribute("y", item.y);
            }
          }
        }
        // resize/rotate は各ファイル側でDOM更新しているためここでは何もしない
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

    // 操作終了時にスクロール許可へ戻す
    svg.style.touchAction = "auto";

    // pointer captureの明示解除は不安定要因になりうるため呼ばない
    // try { e.target.releasePointerCapture?.(e.pointerId); } catch (_) {}
    // try { svg.releasePointerCapture?.(e.pointerId); } catch (_) {}

    state.interaction = null;
    render(); onUpdate(); // 終了時に全体再描画（ハンドル・ラベル更新）
  }

  svg.addEventListener("pointerup", endInteraction, { passive: false });
  svg.addEventListener("pointercancel", endInteraction, { passive: false });
  svg.addEventListener("pointerleave", endInteraction, { passive: false });

  wrap.appendChild(svg);
  return { el: wrap, render };
}
