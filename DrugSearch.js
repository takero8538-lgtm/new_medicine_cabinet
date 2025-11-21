// src/components/Canvas/DrugSearch.js
import { state } from "../state.js";

export function setupSearch(medicineData) {
  const input = document.getElementById("medicineInput");
  const suggestList = document.getElementById("suggestList");

  // ひらがな→カタカナ変換
  function hiraToKana(str) {
    return str.replace(/[\u3041-\u3096]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) + 0x60)
    );
  }

  input.addEventListener("input", () => {
    const query = input.value.trim();
    suggestList.innerHTML = "";

    if (!query) return;

    // 入力を正規化（ひらがな→カタカナ）
    const normalizedQuery = hiraToKana(query);

    // 検索対象は薬品名（A列）を正規化して比較
    const matches = medicineData.filter(m => {
      const normalizedName = hiraToKana(m.name);
      return normalizedName.includes(normalizedQuery);
    });

    matches.forEach(med => {
      const li = document.createElement("li");
      // 表示は元の薬品名をそのまま使う
      li.textContent = med.name;
      li.addEventListener("click", () => {
        input.value = med.name;
        suggestList.innerHTML = "";
        highlightShelf(med);
      });
      suggestList.appendChild(li);
    });
  });

  // 全角数字を半角に変換
  function toHalfWidth(str) {
    return str.replace(/[０-９]/g, s =>
      String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
    );
  }

  function highlightShelf(med) {
    // 既存ハイライト解除
    document.querySelectorAll("svg .highlight").forEach(el => {
      el.classList.remove("highlight");
    });

    const shelfIdStr = med.shelfId ? toHalfWidth(med.shelfId).trim() : "";
    const shelfIdNum = Number(shelfIdStr);

    let shelfItem = null;

    if (!isNaN(shelfIdNum)) {
      // 数字なら state.items から探す
      shelfItem = state.items.find(
        i => i.type === "shelf" && Number(i.id) === shelfIdNum
      );
    }

    if (shelfItem) {
      // rect は g.item 内にあるのでそこから取得
      const g = document.querySelector(`svg g.item[data-id="${shelfItem.id}"]`);
      if (g) {
        const rect = g.querySelector("rect");
        if (rect) rect.classList.add("highlight");
      }
      document.getElementById("shelfName").textContent =
        shelfItem.name || `棚 ${shelfItem.id}`;
    } else {
      // 見つからない場合はそのまま表示
      document.getElementById("shelfName").textContent =
        med.shelfId ? med.shelfId : "(該当棚なし)";
    }

    document.getElementById("shelfX").textContent = med.x;
    document.getElementById("shelfY").textContent = med.y;
  }
}
