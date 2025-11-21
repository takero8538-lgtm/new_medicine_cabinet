// RectRotate.js
import { rotatePoint, snapAngle } from "../../../utils.js";
import { getSvgPoint, selectItem } from "../helpers.js";
import { state } from "../../../state.js";

export function renderRotate(svg, rect, item, g, onUpdate) {
  const cx = item.x + item.width / 2;
  const cy = item.y + item.height / 2;

  // 回転ハンドル生成
  const rotHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  const topBase = { x: cx, y: item.y - 30 };
  const topInit = rotatePoint(topBase.x, topBase.y, cx, cy, item.rotation || 0);
  rotHandle.setAttribute("cx", topInit.x);
  rotHandle.setAttribute("cy", topInit.y);
  rotHandle.setAttribute("r", 6);
  rotHandle.setAttribute("class", "rotate");
  // iPad/Androidでスクロール誤動作防止
  rotHandle.style.touchAction = "none";
  g.appendChild(rotHandle);

  rotHandle.onpointerdown = (e) => {
    e.stopPropagation();
    selectItem(state, item.id, onUpdate);

    const startAngle = item.rotation || 0;
    const { x: sx, y: sy } = getSvgPoint(e, svg);
    const startDeg = Math.atan2(sy - cy, sx - cx) * 180 / Math.PI;

    let pending = false;

    const move = (ev) => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => {
          const { x, y } = getSvgPoint(ev, svg);
          const currentDeg = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
          const delta = currentDeg - startDeg;

          // 回転値更新
          item.rotation = snapAngle(startAngle + delta);

          // g に transform をかけて全体を回す（ラベルも含めて回転）
          g.setAttribute(
            "transform",
            `rotate(${item.rotation}, ${cx}, ${cy})`
          );

          // ハンドル位置更新
          const topNow = rotatePoint(topBase.x, topBase.y, cx, cy, item.rotation);
          rotHandle.setAttribute("cx", topNow.x);
          rotHandle.setAttribute("cy", topNow.y);

          pending = false;
        });
      }
    };

    const up = () => {
      svg.removeEventListener("pointermove", move);
      svg.removeEventListener("pointerup", up);

      // ★ ラベルはここで直接更新せず、onUpdate() に任せて再生成
      onUpdate();
    };

    svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerup", up);
  };
}
