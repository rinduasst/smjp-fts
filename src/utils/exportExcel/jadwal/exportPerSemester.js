import { createWorkbook, applyTableBorder } from "../utils/baseWorkbook";
import { saveAs } from "file-saver";

export const exportPerSemester = async (data, semester) => {
  const { workbook, sheet } = createWorkbook();

  sheet.getCell("A1").value = `JADWAL SEMESTER ${semester}`;
  sheet.getCell("A1").font = { bold: true };

  const filtered = data.filter(d => d.semester === semester);

  filtered.forEach((item) => {
    const row = sheet.addRow([
      item.hari,
      item.jam,
      item.mataKuliah,
      item.dosen,
      item.ruang,
    ]);

    applyTableBorder(row);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Jadwal_Semester_${semester}.xlsx`);
};