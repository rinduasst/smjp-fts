import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportJadwalDosenExcel = async (data, formatKelas) => {

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Jadwal Dosen");

  // =================
  // LOGO
  // =================

  const logo = await fetch("/logofts.png").then(res => res.arrayBuffer());

  const imageId = workbook.addImage({
    buffer: logo,
    extension: "png",
  });

  worksheet.addImage(imageId, {
    tl: { col: 0, row: 0 },
    ext: { width: 120, height: 120 }
  });

    // =================
    // JUDUL
    // =================

    // Baris 1
    worksheet.mergeCells("B1:I1");
    worksheet.getCell("B1").value = "BEBAN KERJA DOSEN";
    worksheet.getCell("B1").font = {
    name: "Times New Roman",
    size: 20,
    bold: true
    };
    worksheet.getCell("B1").alignment = {
    horizontal: "center",
    vertical: "middle"
    };

    // Baris 2
    worksheet.mergeCells("B2:I2");
    worksheet.getCell("B2").value = "PROGRAM STUDI TEKNIK INFORMATIKA";
    worksheet.getCell("B2").font = {
    name: "Times New Roman",
    size: 16,
    bold: true
    };
    worksheet.getCell("B2").alignment = {
    horizontal: "center"
    };

    // Baris 3
    worksheet.mergeCells("B3:I3");
    worksheet.getCell("B3").value = "FAKULTAS TEKNIK & SAINS";
    worksheet.getCell("B3").font = {
    name: "Times New Roman",
    size: 16,
    bold: true
    };
    worksheet.getCell("B3").alignment = {
    horizontal: "center"
    };

    // Baris 4
    worksheet.mergeCells("B4:I4");
    worksheet.getCell("B4").value = "PERIODE GANJIL 2025/2026";
    worksheet.getCell("B4").font = {
    name: "Times New Roman",
    size: 14,
    bold: true
    };
    worksheet.getCell("B4").alignment = {
    horizontal: "center"
    };

    // kasih jarak setelah judul
    worksheet.addRow([]);

    // HEADER TABEL
    const headerRow = worksheet.addRow([
    "NO",
    "NAMA DOSEN",
    "MATA KULIAH",
    "KELAS",
    "SKS",
    "HARI",
    "WAKTU",
    "RUANG",
    "TOTAL SKS"
    ]);
  headerRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4CAF50" }
    };
    cell.alignment = { horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" }
    };
  });
//data

let startRow = worksheet.lastRow.number + 1;

data.forEach((dosen, idx) => {

  const totalSKS = dosen.jadwal.reduce((acc, j) => acc + (j.sks || 0), 0);
  const dosenStart = startRow;

  dosen.jadwal.forEach((j) => {

    const row = worksheet.addRow([
      idx + 1,
      dosen.nama,
      j.mataKuliah,
      formatKelas(j),
      j.sks,
      j.hari,
      `${j.jamMulai} - ${j.jamSelesai}`,
      j.ruangan,
      totalSKS
    ]);

    row.eachCell(cell => {
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: "center"
      };
    });

    startRow++;

  });

  const dosenEnd = startRow - 1;

  // merge NO
  worksheet.mergeCells(`A${dosenStart}:A${dosenEnd}`);

  // merge NAMA DOSEN
  worksheet.mergeCells(`B${dosenStart}:B${dosenEnd}`);

  // merge TOTAL SKS
  worksheet.mergeCells(`I${dosenStart}:I${dosenEnd}`);

});
  // =================
  // WIDTH
  // =================

  worksheet.columns = [
    { width: 6 },
    { width: 40},
    { width: 50 },
    { width: 25 },
    { width: 6 },
    { width: 12 },
    { width: 18 },
    { width: 10 },
    { width: 10 }
  ];

  // =================
  // DOWNLOAD
  // =================

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  saveAs(blob, "Jadwal_Dosen.xlsx");
};