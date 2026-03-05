import { createWorkbook, applyTableBorder } from "../utils/baseWorkbook";
import { saveAs } from "file-saver";

export const exportPerKelas = async (data, kelasNama) => {
  const { workbook, sheet } = createWorkbook();

  sheet.getCell("A1").value = `JADWAL KELAS ${kelasNama}`;
  sheet.getCell("A1").font = { bold: true };

  const filtered = data.filter(d => d.kelas === kelasNama);

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
  saveAs(new Blob([buffer]), `Jadwal_Kelas_${kelasNama}.xlsx`);
};