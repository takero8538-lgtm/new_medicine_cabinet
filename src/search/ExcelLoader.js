import { state } from "../state.js";
import { saveMedicineData } from "../db.js";

export async function loadExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // --- 薬品シートのみ読み込み ---
        const sheetMed = workbook.Sheets["薬品"];
        const rowsMed = XLSX.utils.sheet_to_json(sheetMed, { header: 1 });

        const medicineData = [];

        // 全角→半角変換関数
        function toHalfWidth(str) {
          return str.replace(/[０-９]/g, s =>
            String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
          );
        }

        for (let i = 1; i < rowsMed.length; i++) {
          const row = rowsMed[i];
          const name = row[0];     // A列：薬品名
          let shelfId = row[1];    // B列：棚番号
          const x = row[3];        // D列：棚横番号
          const y = row[5];        // F列：棚縦番号

          if (!name) continue;

          if (shelfId) {
            shelfId = toHalfWidth(String(shelfId).trim());
          } else {
            shelfId = "";
          }

          const entry = {
            name: String(name).trim(),
            shelfId,
            x: x ? String(x).trim() : "",
            y: y ? String(y).trim() : ""
          };

          medicineData.push(entry);
        }

        // 🔽 ここが追加ポイント
        state.medicineData = medicineData;       // グローバルに保持
        await saveMedicineData(medicineData);    // IndexedDBに永続化

        resolve({ medicineData });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
