import { saveAs } from "file-saver";
import ExcelJS from "exceljs";

export const exportRuangan = async (jadwalList, batch) => {
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

  // Grouping per hari
  const jadwalGroupedByHari = {};
  jadwalList.forEach((j) => {
    const hari = j.hari?.nama || "Tanpa Hari";
    if (!jadwalGroupedByHari[hari]) jadwalGroupedByHari[hari] = [];
    jadwalGroupedByHari[hari].push(j);
  });

  for (const hari of hariUrut) {
    const jadwalHari = jadwalGroupedByHari[hari];
    if (!jadwalHari?.length) continue;

    const sheet = workbook.addWorksheet(hari);

    const ruangList = Array.from(
      new Map(jadwalHari.map((j) => [j.ruang?.id, j.ruang])).values()
    );

    const slotList = Array.from(
      new Map(jadwalHari.map((j) => [j.slotWaktu?.id, j.slotWaktu])).values()
    ).sort((a, b) => new Date(a.jamMulai) - new Date(b.jamMulai));

    const formatJam = (value) => {
      if (!value) return "-";
      if (value.length <= 5) return value;
      if (value.length <= 8) return value.slice(0, 5);
      const date = new Date(value);
      if (!isNaN(date)) {
        return date.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      }
      return "-";
    };
    const toRomawi = (num) =>
  ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][num] || num;

const hitungSemester = (angkatan, tahunMulai, paruh) =>
  (tahunMulai - angkatan) * 2 + (paruh === "GENAP" ? 2 : 1);

    /* ================= TITLE ================= */
    sheet.mergeCells(1, 1, 1, ruangList.length + 1);
    sheet.getCell(1, 1).value = "JADWAL RUANGAN";
    sheet.getCell(1, 1).font = { bold: true, size: 16 };
    sheet.getCell(1, 1).alignment = { horizontal: "center" };

    sheet.mergeCells(2, 1, 2, ruangList.length + 1);
    sheet.getCell(2, 1).value = `Hari: ${hari} | Batch: ${batch || "-"}`;
    sheet.getCell(2, 1).alignment = { horizontal: "center" };
    sheet.getCell(2, 1).font = { italic: true };

    sheet.addRow([]);

    /* ================= HEADER ================= */
    const headerRow = sheet.addRow(["Pukul", ...ruangList.map((r) => r.nama)]);
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
    const matrix = {};
    jadwalHari.forEach((j) => {
      if (!j.slotWaktu?.id || !j.ruang?.id) return;

      if (!matrix[j.slotWaktu.id]) matrix[j.slotWaktu.id] = {};

      const matkul =
        j.penugasanMengajar?.programMatkul?.mataKuliah?.nama || "-";

      const angkatan =
      j.penugasanMengajar?.kelasList?.[0]?.kelompokKelas?.angkatan;
      const tahunMulai = batch?.periode?.tahunMulai;
      const paruh = batch?.periode?.paruh;
      const semesterRomawi =
        angkatan && tahunMulai && paruh
          ? toRomawi(hitungSemester(angkatan, tahunMulai, paruh))
          : "-";
      const kelas =
        j.penugasanMengajar?.kelasList
          ?.map((k) => k.kelompokKelas?.kode)
          .join(", ") || "-";

      const prodiRaw = j.penugasanMengajar?.programMatkul?.prodi?.nama;
      const prodiKey = prodiRaw ? prodiRaw.toLowerCase().trim() : "default";

      matrix[j.slotWaktu.id][j.ruang.id] = {
        text: `${matkul}\n${semesterRomawi}_${kelas}`,
        prodiKey,
      };
    });

    /* Data*/
    slotList.forEach((slot) => {
      const row = sheet.addRow([`${formatJam(slot.jamMulai)} - ${formatJam(slot.jamSelesai)}`]);

      ruangList.forEach((ruang, index) => {
        const cellData = matrix[slot.id]?.[ruang.id];
        const cell = row.getCell(index + 2);

        if (cellData) {
          cell.value = cellData.text;

          const color = prodiColors[cellData.prodiKey] || prodiColors["default"];
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: color },
          };
        } else {
          cell.value = "";
        }

        cell.alignment = { wrapText: true, vertical: "top" };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });

      row.getCell(1).font = { bold: true };
    });

    sheet.columns.forEach((column) => {
      column.width = 15;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), "Jadwal_Ruangan.xlsx");
};