// RectResize.js
import { getSvgPoint, selectItem } from "../helpers.js";
import { state } from "../../../state.js";
import { snap } from "../../../utils.js";

export function renderResize(svg, rect, label, item, g, onUpdate) {
  // 四隅ハンドルの定義
  const corners = ["tl", "tr", "bl", "br"];

  // 端末判定（タッチ対応なら大きめ）
  const isTouch = navigator.maxTouchPoints > 0;
  const HANDLE_SIZE = isTouch ? 20 : 10; // ← 座標系単位で指定

  corners.forEach(pos => {
    const handle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    handle.setAttribute("width", HANDLE_SIZE);
    handle.setAttribute("height", HANDLE_SIZE);
    handle.setAttribute("class", "handle");
    updateHandlePosition(handle, item, pos, HANDLE_SIZE);
    // iPad/Androidでスクロール誤動作防止
    handle.style.touchAction = "none";
    g.appendChild(handle);

    handle.onpointerdown = (e) => {
      // ★ スクロール誤発火防止
      e.preventDefault();
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
            lastX = x; lastY = y;

            // 位置とサイズ更新
            if (pos.includes("l")) {
              item.x += dx;
              item.width -= dx;
            }
            if (pos.includes("r")) {
              item.width += dx;
            }
            if (pos.includes("t")) {
              item.y += dy;
              item.height -= dy;
            }
            if (pos.includes("b")) {
              item.height += dy;
            }

            // DOM更新（矩形のみ）
            rect.setAttribute("x", item.x);
            rect.setAttribute("y", item.y);
            rect.setAttribute("width", item.width);
            rect.setAttribute("height", item.height);

            updateHandlePosition(handle, item, pos, HANDLE_SIZE);
            pending = false;
          });
        }
      };

      const up = () => {
        svg.removeEventListener("pointermove", move);
        svg.removeEventListener("pointerup", up);

        // スナップ処理（矩形全体をグリッドに合わせる）
        const snappedX = snap(item.x, state.gridSize);
        const snappedY = snap(item.y, state.gridSize);
        const snappedW = snap(item.x + item.width, state.gridSize) - snappedX;
        const snappedH = snap(item.y + item.height, state.gridSize) - snappedY;
        item.x = snappedX;
        item.y = snappedY;
        item.width = Math.max(0, snappedW);
        item.height = Math.max(0, snappedH);

        rect.setAttribute("x", item.x);
        rect.setAttribute("y", item.y);
        rect.setAttribute("width", item.width);
        rect.setAttribute("height", item.height);

        updateHandlePosition(handle, item, pos, HANDLE_SIZE);

        // ★ ラベルはここで直接更新せず、onUpdate() に任せて再生成
        onUpdate();
      };

      svg.addEventListener("pointermove", move);
      svg.addEventListener("pointerup", up);
    };
  });
}

// ハンドル位置更新関数
function updateHandlePosition(handle, item, pos, size) {
  let x = item.x;
  let y = item.y;
  if (pos.includes("r")) x = item.x + item.width - size;
  if (pos.includes("b")) y = item.y + item.height - size;
  handle.setAttribute("x", x);
  handle.setAttribute("y", y);
}
