import { saveAs } from "file-saver";
import ExcelJS from "exceljs";


export const exportRuangan = async (jadwalList, batch, slotMaster) => {
  const workbook = new ExcelJS.Workbook();
  const hariUrut = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  const prodiColors = {
    "teknik mesin": "FFFFF9C4", // yellow-300
    "rekayasa pertanian dan biosistem": "FFFFD54F", // yellow-500
    "ilmu lingkungan": "FF65A30D", // lime-600
    "teknik sipil": "FF4ADE80", // green-400
    "sistem informasi": "FF60A5FA", // blue-400
    "teknik informatika": "FFA855F7", // purple-500
    "teknik elektro": "FFEF4444", // red-500
    "default": "FFF3F4F6"
  };
  const formatJam = (value) => {
    if (!value) return "-";
    return value.slice(0,5);
  };
  // Grouping per hari
  const jadwalGroupedByHari = {};
  jadwalList.forEach((j) => {
    const hari = j.hari || "Tanpa Hari";
    if (!jadwalGroupedByHari[hari]) jadwalGroupedByHari[hari] = [];
    jadwalGroupedByHari[hari].push(j);
  });

  for (const hari of hariUrut) {
    const skipCell = {};
    const jadwalHari = jadwalGroupedByHari[hari];
    if (!jadwalHari?.length) continue;
    const safeHari = hari.replace(/[\\/?*[\]:]/g, "");
    const sheet = workbook.addWorksheet(safeHari);

    const ruangList = Array.from(
      new Set(jadwalHari.map((j) => j.ruangan))
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const slotList = slotMaster.map(s => ({
      jamMulai: s.jamMulai,
      jamSelesai: s.jamSelesai
    }));
    const toRomawi = (num) =>
    ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][num] || num;

  const formatKelasExcel = (jadwal) => {
    if (!jadwal.kelas) return "-";

    let romawi = "";
    if (jadwal.semester) {
      romawi = typeof jadwal.semester === "number"
        ? toRomawi(jadwal.semester)
        : jadwal.semester;
    }

    const kelasList = jadwal.kelas.split(",").map(k => k.trim());

    return kelasList
      .map(k => romawi ? `${romawi}_${k}` : k)
      .join(", ");
  };

    const fakultas = batch?.fakultas?.nama || "-";
    const tahunMulai = batch?.periode?.tahunMulai;
    const tahunSelesai = batch?.periode?.tahunSelesai;
    const paruh = batch?.periode?.paruh || "-"; // GASAL / GENAP
    
    const tahunAjaran =
      tahunMulai && tahunSelesai ? `${tahunMulai}/${tahunSelesai}` : "-";
    
    sheet.mergeCells(1, 1, 1, ruangList.length + 1);
    sheet.getCell(1, 1).value = `JADWAL RUANGAN SEMESTER ${paruh} TA ${tahunAjaran}`;
    sheet.getCell(1, 1).font = { bold: true, size: 16 };
    sheet.getCell(1, 1).alignment = { horizontal: "center" };

    sheet.mergeCells(2, 1, 2, ruangList.length + 1);
    sheet.getCell(2, 1).value = fakultas.toUpperCase();
    sheet.getCell(2, 1).font = { bold: true, size: 16 };
    sheet.getCell(2, 1).alignment = { horizontal: "center" };
    

    sheet.addRow([]);

    /* header  */
    const headerRow = sheet.addRow(["Pukul", ...ruangList]);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFBDD7EE" },
      };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    /* matrix */
    // const matrix = {};
    // jadwalHari.forEach((j) => {
    //   if (!j.jamMulai || !j.jamSelesai || !j.ruangan) return;
    //   const slotKey = `${j.jamMulai}-${j.jamSelesai}`;

    //   if (!matrix[slotKey]) matrix[slotKey] = {};
    //   const matkul = j.mataKuliah || "-";

    //       const prodiRaw = j.prodi;
    //   const prodiKey = prodiRaw ? prodiRaw.toLowerCase().trim() : "default";

    //   matrix[slotKey][j.ruangan] = {
    //     text: `${matkul}\n${j.kelas || "-"}`,
    //     prodiKey,
    //   };
    // });
    const hitungRowSpan = (mulai, selesai) => {
      const normalize = (t) => t?.slice(0,5);
    
      const start = slotList.findIndex(
        (s) => normalize(s.jamMulai) === normalize(mulai)
      );
    
      const end = slotList.findIndex(
        (s) => normalize(s.jamSelesai) === normalize(selesai)
      );
    
      // fallback kalau jam selesai tidak ketemu
      if (end === -1 && start !== -1) {
        return 1;
      }
    
      return end - start + 1;
    };
    
    /* Data*/
    slotList.forEach((slot, rowIndex) => {
      const excelRow = rowIndex + 5;
    
      const row = sheet.getRow(excelRow);
      row.height = 55;
    
      row.getCell(1).value =
        `${formatJam(slot.jamMulai)} - ${formatJam(slot.jamSelesai)}`;
    
      ruangList.forEach((ruang, colIndex) => {
        const key = `${slot.jamMulai}-${slot.jamSelesai}-${ruang}`;
    
        if (skipCell[key]) return;
    
        const jadwal = jadwalHari.find(
          (j) =>
            j.ruangan === ruang &&
            j.jamMulai.slice(0,5) === slot.jamMulai.slice(0,5)
        );
        const cell = row.getCell(colIndex + 2);
    
        if (!jadwal) {
          cell.value = "";
          return;
        }
    
        const normalize = (t) => t?.slice(0,5);

        const startIndex = slotList.findIndex(
          (s) => normalize(s.jamMulai) === normalize(jadwal.jamMulai)
        );
        
        // ❗ PENTING BANGET
        if (rowIndex !== startIndex) return;
        
        let rowspan = jadwal.sksEfektif || 1;

// ❗ BATASI BIAR GA LEWAT SLOT
if (startIndex + rowspan > slotList.length) {
  rowspan = slotList.length - startIndex;
}
    
        for (let i = 1; i < rowspan; i++) {
          const nextSlot = slotList[startIndex + i];
    
          if (nextSlot) {
            skipCell[
              `${nextSlot.jamMulai}-${nextSlot.jamSelesai}-${ruang}`
            ] = true;
          }
        }
    
        if (rowspan > 1) {
          sheet.mergeCells(
            excelRow,
            colIndex + 2,
            excelRow + rowspan - 1,
            colIndex + 2
          );
        }
    
        const prodiKey = jadwal.prodi
          ? jadwal.prodi.toLowerCase().trim()
          : "default";
    
        const color =
          prodiColors[prodiKey] || prodiColors.default;
    
          cell.value =
          `${jadwal.mataKuliah || "-"}\n${formatKelasExcel(jadwal)}`;
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
    
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: color },
        };
    
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    sheet.columns.forEach((column) => {
      column.width = 15;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), "Jadwal_Ruangan.xlsx");
};