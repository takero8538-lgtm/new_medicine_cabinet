// src/components/Toolbar.js
import { state, save, needsHistoryTrim } from "../state.js";
import { HistoryPanel } from "./HistoryPanel.js";
import { getAllHistory, deleteHistoryById } from "../db.js";

export function Toolbar(onUpdate) {
  const wrap = document.createElement("div");
  wrap.className = "toolbar";

  // 🔽 最上段：保存・読み込み・クリアボタン
  const topBar = document.createElement("div");
  topBar.className = "toolbar-top";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "保存";
  saveBtn.onclick = async () => {
    await save();
    alert("保存しました");

    // 50件超過チェック
    const over = await needsHistoryTrim();
    if (!over) return;

    // 削除モーダル生成
    const trimModal = document.createElement("div");
    trimModal.className = "fp-modal";
    trimModal.setAttribute("aria-hidden", "false");
    trimModal.innerHTML = `
      <div class="fp-modal__dialog">
        <h2 class="fp-modal__title">履歴が50件を超えました</h2>
        <p class="fp-modal__text">削除する履歴を選んでください（古い順）。</p>
        <div class="fp-modal__body"></div>
        <div class="fp-modal__actions">
          <button class="fp-btn fp-btn--secondary">閉じる</button>
        </div>
      </div>
    `;
    wrap.appendChild(trimModal);

    const body = trimModal.querySelector(".fp-modal__body");
    const closeBtn = trimModal.querySelector(".fp-btn--secondary");

    // 履歴読み込み（古い順）
    let history = (await getAllHistory()).sort((a, b) => a.id - b.id);

    const renderList = () => {
      body.innerHTML = "";
      const ul = document.createElement("ul");
      ul.style.listStyle = "none";
      ul.style.margin = "0";
      ul.style.padding = "0";

      history.forEach((h) => {
        const li = document.createElement("li");
        li.style.marginTop = "6px";

        const btn = document.createElement("button");
        btn.style.width = "100%";
        btn.style.textAlign = "left";
        btn.style.padding = "6px 8px";
        btn.style.border = "1px solid #ddd";
        btn.style.borderRadius = "4px";
        btn.style.background = "#fafafa";
        btn.textContent = new Date(h.savedAt).toLocaleString();

        btn.onclick = async () => {
          await deleteHistoryById(h.id);
          history = history.filter(x => x.id !== h.id);
          renderList();

          // 50件以内になったら自動で閉じる
          if (history.length <= 50) {
            trimModal.remove();
          }
        };

        li.appendChild(btn);
        ul.appendChild(li);
      });

      body.appendChild(ul);
    };

    // スクロール付与
    body.style.maxHeight = "300px";
    body.style.overflowY = "auto";

    renderList();

    // 閉じる
    closeBtn.onclick = () => {
      trimModal.remove();
    };
  };

  const loadBtn = document.createElement("button");
  loadBtn.textContent = "読み込み";
  loadBtn.onclick = () => {
    // 履歴モーダルを生成
    const histModal = document.createElement("div");
    histModal.className = "fp-modal";
    histModal.setAttribute("aria-hidden", "false");
    histModal.innerHTML = `
      <div class="fp-modal__dialog">
        <h2 class="fp-modal__title">保存履歴</h2>
        <div class="fp-modal__body"></div>
        <div class="fp-modal__actions">
          <button class="fp-btn fp-btn--secondary">閉じる</button>
        </div>
      </div>
    `;
    wrap.appendChild(histModal);

    const body = histModal.querySelector(".fp-modal__body");
    const closeBtn = histModal.querySelector(".fp-btn--secondary");

    // 履歴パネルをモーダル内に埋め込む
    const panel = HistoryPanel(onUpdate);
    body.appendChild(panel);

    // 閉じる
    closeBtn.onclick = () => {
      histModal.remove();
    };
  };

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "クリア";

  // --- カスタムモーダル生成（編集モード専用：クリア確認） ---
  const modal = document.createElement("div");
  modal.className = "fp-modal fp-hidden";
  modal.innerHTML = `
    <div class="fp-modal__dialog">
      <h2 class="fp-modal__title">図をクリアしますか？</h2>
      <p class="fp-modal__text">すべての図形が削除されます。</p>
      <div class="fp-modal__actions">
        <button class="fp-btn fp-btn--secondary">キャンセル</button>
        <button class="fp-btn fp-btn--danger">クリアする</button>
      </div>
    </div>
  `;
  wrap.appendChild(modal);

  const cancelBtn = modal.querySelector(".fp-btn--secondary");
  const okBtn = modal.querySelector(".fp-btn--danger");

  const openModal = () => {
    modal.classList.remove("fp-hidden");
    modal.setAttribute("aria-hidden", "false");
  };
  const closeModal = () => {
    modal.classList.add("fp-hidden");
    modal.setAttribute("aria-hidden", "true");
  };

  clearBtn.onclick = () => {
    openModal();
  };
  cancelBtn.onclick = () => {
    closeModal();
  };
  okBtn.onclick = () => {
    // 全消去
    state.items = [];
    state.selectedId = null;
    closeModal();
    onUpdate();
  };

  topBar.appendChild(saveBtn);
  topBar.appendChild(loadBtn);
  topBar.appendChild(clearBtn);

  // 🔽 少しスペースを空けて配置ボタン群
  const polygonBar = document.createElement("div");
  polygonBar.className = "toolbar-polygon";
  polygonBar.style.marginTop = "12px"; // ← スペースを確保

  const addShelf = () => {
    state.mode = "add-shelf";
    state.selectedId = null;
    onUpdate();
  };

  const addEquipment = () => {
    state.mode = "add-equipment";
    state.selectedId = null;
    onUpdate();
  };

  const addDoor = () => {
    state.mode = "add-door";
    state.selectedId = null;
    onUpdate();
  };

  const startLine = () => {
    const id = `L${Date.now()}`;
    state.mode = "draw-line";
    state.tempLine = {
      id,
      type: "line",
      name: "壁線",
      x1: null,
      y1: null,
      x2: null,
      y2: null,
      strokeWidth: 3,
      stroke: "#333"
    };
    state.selectedId = id;
    onUpdate();
  };

  [
    ["棚（クリックで配置）", addShelf],
    ["設備（クリックで配置）", addEquipment],
    ["入口/扉（クリックで配置）", addDoor],
    ["壁線（クリック2点）", startLine],
  ].forEach(([label, fn]) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.onclick = fn;
    polygonBar.appendChild(b);
  });

  // 組み立て：保存・読み込み・クリア → 配置ボタン群
  wrap.appendChild(topBar);
  wrap.appendChild(polygonBar);

  return wrap;
}
