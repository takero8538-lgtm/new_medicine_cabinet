// src/components/SearchPanel.js

export function SearchPanel({ onExcelLoad }) {
  const wrap = document.createElement("div");
  wrap.className = "search-panel";

  // 検索UIをまとめて描画
  wrap.innerHTML = `
    <div class="file-row">
      <!-- ネイティブの file input は隠す -->
      <input type="file" id="excelFile" accept=".xlsx,.xls" class="visually-hidden-file" />
      <!-- 代わりにラベルをボタン化 -->
      <label for="excelFile" class="file-button">Excelを選択</label>
      <span id="excelStatus" class="file-status">現在の薬品データ：未設定</span>
    </div><br>

    <div id="searchBox">
      <input type="text" id="medicineInput" placeholder="薬品名を入力">
      <ul id="suggestList"></ul>
    </div><br>

    <div id="info">
      <strong>棚番号：</strong><span id="shelfName">-</span><br>
      <strong>棚内 横：</strong><span id="shelfX">-</span><br>
      <strong>棚内 縦：</strong><span id="shelfY">-</span>
    </div>
  `;

  const fileInput = wrap.querySelector("#excelFile");
  const statusEl = wrap.querySelector("#excelStatus");

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
      await onExcelLoad(file);
      statusEl.textContent = `現在の薬品データ：${file.name}`;
    }
  });

  return wrap;
}
