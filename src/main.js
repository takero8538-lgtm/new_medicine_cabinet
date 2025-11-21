// src/main.js
import { state, save, load } from "./state.js";
import { Toolbar } from "./components/Toolbar.js";
import { Canvas } from "./components/Canvas/Canvas.js";
import { InfoPanel } from "./components/InfoPanel.js";
import { SearchPanel } from "./components/SearchPanel.js";
import { loadExcel } from "./search/ExcelLoader.js";
import { setupSearch } from "./search/DrugSearch.js";
import { saveMedicineData } from "./db.js"; // 薬データの永続化

async function renderApp() {
  const app = document.getElementById("app");
  const modeSwitch = document.getElementById("modeSwitch");

  // 初期化
  app.innerHTML = "";
  modeSwitch.innerHTML = "";

  // 上部にモード切り替えボタンを配置
  const searchBtn = document.createElement("button");
  searchBtn.textContent = "検索モード";
  searchBtn.onclick = () => {
    state.viewMode = "search";
    app.className = "search-mode"; // CSS 切り替え
    renderApp();
  };

  const editBtn = document.createElement("button");
  editBtn.textContent = "編集モード";
  editBtn.onclick = () => {
    state.viewMode = "edit";
    app.className = "edit-mode"; // CSS 切り替え
    renderApp();
  };

  // 並び順：検索モード → 編集モード
  modeSwitch.appendChild(searchBtn);
  modeSwitch.appendChild(editBtn);

  // 現在のモードに応じてアクティブボタンを明示（黄色ハイライト用）
  searchBtn.classList.toggle("active", state.viewMode === "search");
  editBtn.classList.toggle("active", state.viewMode === "edit");

  // モードごとのUI描画
  if (state.viewMode === "edit") {
    let canvas, infopanel;

    function update() {
      canvas.render();
      infopanel.render();
    }

    const toolbar = Toolbar(update);
    canvas = Canvas(update, true);
    infopanel = InfoPanel(update);

    app.appendChild(toolbar);
    app.appendChild(canvas.el);
    app.appendChild(infopanel.el);

    await load();
    update();

    document.addEventListener("click", (e) => {
      const inSvg = e.target.closest("svg");
      const inPanel = e.target.closest(".infopanel");
      const inToolbar = e.target.closest(".toolbar");
      if (!inSvg && !inPanel && !inToolbar) {
        state.selectedId = null;
        update();
      }
    });

  } else if (state.viewMode === "search") {
    // 検索モードUI
    const searchUI = SearchPanel({
      onExcelLoad: async (file) => {
        const { medicineData } = await loadExcel(file);
        state.medicineData = medicineData;
        state.medicineMeta = { fileName: file.name, updatedAt: Date.now() }; // ファイル名保存
        await saveMedicineData(medicineData, file.name); // ← 修正済み
        setupSearch(medicineData);

        // ファイル選択後は状態表示を更新
        const statusEl = document.getElementById("excelStatus");
        if (statusEl) statusEl.textContent = `現在の薬品データ：${file.name}`;
      }
    });
    searchUI.classList.add("search-panel");
    app.appendChild(searchUI);

    // 最新図面を読み込み＆描画（編集不可）
    await load();

    // 復元済みの薬データがあれば検索セットアップ
    if (state.medicineData && Array.isArray(state.medicineData) && state.medicineData.length > 0) {
      setupSearch(state.medicineData);

      // 復元時の状態表示
      const statusEl = document.getElementById("excelStatus");
      if (statusEl) {
        const name = state.medicineMeta?.fileName;
        statusEl.textContent = name
          ? `現在の薬品データ：${name}`
          : `現在の薬品データ：不明`;
      }
    }

    const canvas = Canvas(() => {}, false);
    canvas.el.classList.add("canvas-wrap");
    app.appendChild(canvas.el);
    canvas.render();
  }
}

// 起動時は検索モード
window.addEventListener("DOMContentLoaded", () => {
  state.viewMode = "search";
  const app = document.getElementById("app");
  app.className = "search-mode";
  renderApp();
});
