// src/components/Canvas/Canvas.js
import { state } from "../../state.js";
import { renderGrid } from "./GridRenderer.js";
import { renderItems } from "./ItemRenderer.js";
import { renderPreviewLine } from "./PreviewLine.js";
import { handleLineEvents } from "./LineEvents.js";
import { handleAddItemEvents } from "./AddItemEvents.js";

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

    // 将来的に gridSize を変更可能にする場合はここで条件付き再描画
    // if (state.gridSizeChanged) {
    //   renderGrid(svg);
    //   state.gridSizeChanged = false;
    // }

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

  wrap.appendChild(svg);
  return { el: wrap, render };
}
