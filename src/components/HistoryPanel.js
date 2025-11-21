// src/components/HistoryPanel.js
import { loadHistory } from "../db.js";
import { state } from "../state.js";

export function HistoryPanel(onUpdate) {
  const wrap = document.createElement("div");
  wrap.className = "history-panel";

  const body = document.createElement("div");
  body.className = "history-panel__body";
  wrap.appendChild(body);

  async function render() {
    body.innerHTML = "";
    const history = await loadHistory();

    if (!history || history.length === 0) {
      body.innerHTML = "<p>履歴がありません</p>";
      return;
    }

    const list = document.createElement("ul");
    list.className = "history-list";

    history
      .sort((a, b) => b.id - a.id) // 新しい順
      .forEach((h) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.className = "history-item";
        const dateStr = new Date(h.savedAt).toLocaleString();
        btn.textContent = dateStr;

        btn.onclick = () => {
          state.items = h.data;
          state.selectedId = null;
          onUpdate();
        };

        li.appendChild(btn);
        list.appendChild(li);
      });

    body.appendChild(list);
  }

  render();
  return wrap;
}
