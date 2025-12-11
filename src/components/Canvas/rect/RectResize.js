// RectResize.js
import { getSvgPoint, selectItem } from "../helpers.js";
import { state } from "../../../state.js";
import { snap } from "../../../utils.js";

export function renderResize(svg, rect, label, item, g, onUpdate) {
  // 四隅ハンドルの定義
  const corners = ["tl", "tr", "bl", "br"];

  // 端末判定（タッチ対応ならヒット判定を大きめ）
  const isTouch = navigator.maxTouchPoints > 0;
  const VISUAL_RADIUS = 10;                  // 見た目用の半径
  const HIT_RADIUS = isTouch ? 80 : 40;      // ヒット判定用の半径

  corners.forEach(pos => {
    // 見た目用の円（小さめ）
    const visual = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    visual.setAttribute("r", VISUAL_RADIUS);
    visual.setAttribute("class", "handle");
    updateHandlePositionCircle(visual, item, pos);
    visual.style.pointerEvents = "none"; // 判定には使わない
    g.appendChild(visual);

    // ヒット判定用の透明円（大きめ）
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    hit.setAttribute("r", HIT_RADIUS);
    updateHandlePositionCircle(hit, item, pos);
    // 完全に透明化（CSSの.handleを上書き）
    hit.setAttribute("fill", "transparent");
    hit.setAttribute("stroke", "transparent");
    hit.setAttribute("class", "handle-hit");
    hit.style.pointerEvents = "auto"; // 判定はこちら
    hit.style.touchAction = "none";
    g.appendChild(hit);

    hit.onpointerdown = (e) => {
      // スクロール誤発火防止
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

            updateHandlePositionCircle(visual, item, pos);
            updateHandlePositionCircle(hit, item, pos);
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

        updateHandlePositionCircle(visual, item, pos);
        updateHandlePositionCircle(hit, item, pos);

        // ラベルはここで直接更新せず、onUpdate() に任せて再生成
        onUpdate();
      };

      svg.addEventListener("pointermove", move);
      svg.addEventListener("pointerup", up);
    };
  });
}

// 円ハンドル位置更新関数
function updateHandlePositionCircle(handle, item, pos) {
  let cx = item.x;
  let cy = item.y;
  if (pos.includes("r")) cx = item.x + item.width;
  if (pos.includes("b")) cy = item.y + item.height;
  handle.setAttribute("cx", cx);
  handle.setAttribute("cy", cy);
}

