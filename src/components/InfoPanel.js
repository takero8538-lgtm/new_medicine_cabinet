// src/components/InfoPanel.js
import { state } from "../state.js";

// フォントサイズの最小・最大値を定数化して一元管理
const FONT_MIN = 6;
const FONT_MAX = 80;

export function InfoPanel(onUpdate) {
  const el = document.createElement("div");
  el.className = "infopanel";

  function render() {
    el.innerHTML = "";
    const item = state.items.find(i => i.id === state.selectedId);
    if (!item) { el.textContent = "選択中なし"; return; }

    // タイトル（棚だけID表示）
    const title = document.createElement("h3");
    title.textContent = item.name || "";
    el.appendChild(title);

    // 名称編集（全タイプ共通）
    const nameInput = document.createElement("input");
    nameInput.value = item.name || "";
    nameInput.placeholder = "名称";
    nameInput.oninput = (e) => {
      item.name = e.target.value;
      const label = document.querySelector("svg g.item.selected text");
      if (label) label.textContent = item.name;
    };
    el.appendChild(nameInput);

    // 🔽 文字サイズ編集（ラベル付きタイプのみ）
    if (item.type !== "line") {
      const fontSizeWrap = document.createElement("div");
      fontSizeWrap.innerHTML = `
        <label>文字サイズ: 
          <input type="number" min="${FONT_MIN}" max="${FONT_MAX}" step="1" value="${item.fontSize || 14}" />
        </label>
      `;
      const fontSizeInput = fontSizeWrap.querySelector("input");
      fontSizeInput.onchange = (e) => {
        const v = Number(e.target.value);
        if (!Number.isNaN(v)) {
          item.fontSize = Math.min(FONT_MAX, Math.max(FONT_MIN, v));
          onUpdate();
        }
      };
      el.appendChild(fontSizeWrap);
    }

    // ID編集（棚のみ、重複チェック付き）
    if (item.type === "shelf") {
      const idWrap = document.createElement("div");
      idWrap.innerHTML = `
        <label>ID: <input type="number" value="${item.id}" /></label>
      `;
      const idInput = idWrap.querySelector("input");
      idInput.onchange = (e) => {
        const newId = Number(e.target.value);
        if (!Number.isNaN(newId)) {
          const isDuplicate = state.items.some(i =>
            i.type === "shelf" && i.id === newId && i !== item
          );
          if (isDuplicate) {
            alert("このIDはすでに使われています");
            idInput.value = item.id;
          } else {
            item.id = newId;
            state.selectedId = newId;
            onUpdate();
          }
        }
      };
      el.appendChild(idWrap);
    }

    if (item.type !== "line") {
      // サイズ編集
      const size = document.createElement("div");
      size.innerHTML = `
        <label>W: <input type="number" value="${item.width}" /></label>
        <label>H: <input type="number" value="${item.height}" /></label>
      `;
      const [wInput, hInput] = size.querySelectorAll("input");
      wInput.onchange = (e) => { item.width = Number(e.target.value); onUpdate(); };
      hInput.onchange = (e) => { item.height = Number(e.target.value); onUpdate(); };
      el.appendChild(size);

      // 角度編集
      const rot = document.createElement("div");
      rot.innerHTML = `
        <label>角度: <input type="number" value="${item.rotation || 0}" /></label>
      `;
      const rotInput = rot.querySelector("input");
      rotInput.onchange = (e) => { item.rotation = Number(e.target.value); onUpdate(); };
      el.appendChild(rot);

    } else {
      // 線の終点・太さ編集
      const line2 = document.createElement("div");
      line2.innerHTML = `
        <label>X2: <input type="number" value="${item.x2}" /></label>
        <label>Y2: <input type="number" value="${item.y2}" /></label>
      `;
      const [x2, y2] = line2.querySelectorAll("input");
      x2.onchange = (e) => { item.x2 = Number(e.target.value); onUpdate(); };
      y2.onchange = (e) => { item.y2 = Number(e.target.value); onUpdate(); };
      el.appendChild(line2);

      const sw = document.createElement("div");
      sw.innerHTML = `
        <label>線の太さ: <input type="number" value="${item.strokeWidth || 3}" /></label>
      `;
      const swInput = sw.querySelector("input");
      swInput.onchange = (e) => { item.strokeWidth = Number(e.target.value); onUpdate(); };
      el.appendChild(sw);
    }

    // 削除ボタン
    const del = document.createElement("button");
    del.textContent = "削除";
    del.onclick = () => {
      state.items = state.items.filter(i => i !== item);
      state.selectedId = null;
      onUpdate();
    };
    el.appendChild(del);
  }

  return { el, render };
}
