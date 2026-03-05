import { createWorkbook, applyTableBorder } from "../baseWorkbook";
import { saveAs } from "file-saver";

export const exportAllProdi = async (data) => {
  const { workbook, sheet } = createWorkbook();

  sheet.mergeCells("A1:H1");
  sheet.getCell("A1").value = "JADWAL SEMUA PROGRAM STUDI";
  sheet.getCell("A1").alignment = { horizontal: "center" };
  sheet.getCell("A1").font = { bold: true, size: 14 };

  let rowIndex = 3;

  data.forEach((item) => {
    const row = sheet.addRow([
      item.prodi,
      item.semester,
      item.hari,
      item.mataKuliah,
      item.dosen,
      item.ruang,
    ]);

    applyTableBorder(row);
    rowIndex++;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), "Jadwal_Semua_Prodi.xlsx");
};