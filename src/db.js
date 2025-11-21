// db.js
// IndexedDBを使って図面データと薬データを保存・読み込みするモジュール

// DBを開く（初回は floorplans / medicines ストアを作成）
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("pharmacyAppDB", 3); // バージョンを上げる

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("floorplans")) {
        db.createObjectStore("floorplans", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("medicines")) {
        db.createObjectStore("medicines", { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// 保存処理（履歴として残す）
export async function saveFloorplan(items) {
  const db = await openDB();
  const tx = db.transaction("floorplans", "readwrite");
  const store = tx.objectStore("floorplans");

  const record = {
    id: Date.now(),
    data: items,
    savedAt: new Date()
  };

  store.put(record);
  return tx.complete;
}

// 最新データを読み込む
export async function loadLatestFloorplan() {
  const db = await openDB();
  const tx = db.transaction("floorplans", "readonly");
  const store = tx.objectStore("floorplans");

  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result;
      if (all.length === 0) {
        resolve(null);
      } else {
        const latest = all.reduce((a, b) => (a.id > b.id ? a : b));
        resolve(latest.data);
      }
    };
  });
}

// 履歴一覧を取得
export async function loadHistory() {
  const db = await openDB();
  const tx = db.transaction("floorplans", "readonly");
  const store = tx.objectStore("floorplans");

  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => {
      resolve(request.result || []);
    };
  });
}

// 全履歴取得
export async function getAllHistory() {
  const db = await openDB();
  const tx = db.transaction("floorplans", "readonly");
  const store = tx.objectStore("floorplans");
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = reject;
  });
}

// 件数取得
export async function getHistoryCount() {
  const db = await openDB();
  const tx = db.transaction("floorplans", "readonly");
  const store = tx.objectStore("floorplans");
  return new Promise((resolve, reject) => {
    const req = store.count();
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = reject;
  });
}

// ID指定削除
export async function deleteHistoryById(id) {
  const db = await openDB();
  const tx = db.transaction("floorplans", "readwrite");
  const store = tx.objectStore("floorplans");
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = reject;
  });
}

// 上限超え削除候補
export async function getExcessHistoryOverLimit(limit = 50) {
  const all = await getAllHistory();
  if (all.length <= limit) return [];
  const sortedAsc = all.sort((a, b) => a.id - b.id);
  return sortedAsc.slice(0, all.length - limit);
}

// 🔽 修正：薬データ保存（ファイル名も保持）
export async function saveMedicineData(medicineData, fileName) {
  const db = await openDB();
  const tx = db.transaction("medicines", "readwrite");
  const store = tx.objectStore("medicines");

  const record = {
    id: 1,                // 常に1件だけ保持
    data: medicineData,
    fileName: fileName || null,
    savedAt: new Date()
  };

  store.put(record);
  return tx.complete;
}

// 🔽 修正：薬データ読み込み（ファイル名も復元）
export async function loadMedicineData() {
  const db = await openDB();
  const tx = db.transaction("medicines", "readonly");
  const store = tx.objectStore("medicines");

  return new Promise((resolve) => {
    const request = store.get(1);
    request.onsuccess = () => {
      const rec = request.result;
      resolve(rec ? { data: rec.data, fileName: rec.fileName } : null);
    };
  });
}
