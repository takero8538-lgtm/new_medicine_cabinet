// src/state.js
import { saveFloorplan, loadLatestFloorplan, saveMedicineData, loadMedicineData } from "./db.js";
import { getHistoryCount } from "./db.js";

export const state = {
  items: [],             // {id, type, name, x, y, width, height, rotation ...}
  selectedId: null,      // 選択中ID
  gridSize: 25,          // グリッドピッチ
  mode: "select",        // select | draw-line
  tempLine: null,        // 線仮置き

  // 操作状態を追加
  interaction: null,     // { type: 'move'|'resize'|'rotate', id, startX, startY, lastX, lastY }

  // キャンバスサイズ（唯一の定義箇所）
  canvasWidth: 1200,
  canvasHeight: 900,

  // Excelから読み込んだ薬データを保持
  medicineData: null,
  medicineMeta: null     // { fileName, updatedAt }
};

// 棚用：数値連番
export function nextShelfId(items) {
  const used = items
    .filter(i => i.type === "shelf" && !isNaN(Number(i.id)))
    .map(i => Number(i.id));
  let id = 1;
  while (used.includes(id)) id++;
  return id;
}

// その他用：アルファベット＋連番
export function nextAlphaId(items, prefix) {
  const used = items
    .filter(i => typeof i.id === "string" && i.id.startsWith(prefix))
    .map(i => Number(i.id.slice(prefix.length)));
  let num = 1;
  while (used.includes(num)) num++;
  return `${prefix}${num}`;
}

// 保存処理：IndexedDBに履歴として保存
export async function save() {
  state.items.forEach(it => {
    if (it.id == null || it.id === "") {
      if (it.type === "shelf") {
        it.id = nextShelfId(state.items);
      } else if (it.type === "equipment") {
        it.id = nextAlphaId(state.items, "E");
      } else if (it.type === "door") {
        it.id = nextAlphaId(state.items, "D");
      } else if (it.type === "line") {
        it.id = nextAlphaId(state.items, "L");
      } else {
        it.id = nextAlphaId(state.items, "X");
      }
    }
  });
  await saveFloorplan(state.items);

  if (state.medicineData) {
    await saveMedicineData(state.medicineData, state.medicineMeta?.fileName);
  }
}

// 読み込み処理
export async function load() {
  const latest = await loadLatestFloorplan();
  if (latest && Array.isArray(latest)) {
    state.items = latest;
  }

  const med = await loadMedicineData();
  if (med && Array.isArray(med.data)) {
    state.medicineData = med.data;
    state.medicineMeta = { fileName: med.fileName, updatedAt: med.savedAt };
  }
}

// 履歴件数チェック
export async function needsHistoryTrim(limit = 50) {
  const count = await getHistoryCount();
  return count > limit;
}
