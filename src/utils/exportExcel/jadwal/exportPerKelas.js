import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportPerKelas = async (
  groupedData,
  batchInfo,
  user,
  filterKelas,
  semesterAktif
) => {
  const workbook = new ExcelJS.Workbook();

  const fakultas = batchInfo?.fakultas?.nama || "";
  const periode = batchInfo?.periode?.nama || "";
  const firstKelas = Object.values(groupedData)[0] || [];
  const firstItem = firstKelas[0];
  
  const prodiNama =
    firstItem?.prodi?.nama ||
    batchInfo?.prodi?.nama ||
    "-";

  const hariUrut = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  const borderAll = (cell) => {
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  };
  const logoResponse = await fetch("/logofts.png");
  const logoBuffer = await logoResponse.arrayBuffer();
  
  const logoId = workbook.addImage({
    buffer: logoBuffer,
    extension: "png",
  });

  const sheet = workbook.addWorksheet(`SMT ${String(semesterAktif).toUpperCase()}`);

  sheet.addImage(logoId, {
    tl: { col: 0, row: 0 },
    ext: { width: 120, height: 120 },
  });


  let row = 1;

sheet.mergeCells(`A${row}:E${row}`);
sheet.getCell(`A${row}`).value = `JADWAL KULIAH ${periode.toUpperCase()}`;
sheet.getCell(`A${row}`).alignment = { horizontal: "center" };
sheet.getCell(`A${row}`).font = {
  name: "Times New Roman",
  bold: true,
  size: 16,
};
row++;

sheet.mergeCells(`A${row}:E${row}`);
sheet.getCell(`A${row}`).value = `PROGRAM STUDI ${prodiNama.toUpperCase()}`;
sheet.getCell(`A${row}`).alignment = { horizontal: "center" };
sheet.getCell(`A${row}`).font = {
  name: "Times New Roman",
  bold: true,
  size: 16,
};
row++;

sheet.mergeCells(`A${row}:E${row}`);
sheet.getCell(`A${row}`).value = `${fakultas.toUpperCase()}`;
sheet.getCell(`A${row}`).alignment = { horizontal: "center" };
sheet.getCell(`A${row}`).font = {
  name: "Times New Roman",
  bold: true,
  size: 16,
};
row++;

sheet.mergeCells(`A${row}:E${row}`);
sheet.getCell(`A${row}`).value = `SEMESTER ${semesterAktif}`;
sheet.getCell(`A${row}`).alignment = { horizontal: "center" };
sheet.getCell(`A${row}`).font = {
  name: "Times New Roman",
  bold: true,
  size: 16,
};

row += 2;

  const kelasList =
    filterKelas === "ALL"
      ? Object.keys(groupedData)
      : [filterKelas];

  kelasList.forEach((kelas) => {
    const jadwalList = groupedData[kelas] || [];

    if (jadwalList.length === 0) return;

    sheet.mergeCells(`A${row}:E${row}`);
    const title = sheet.getCell(`A${row}`);
    title.value = `KELAS ${kelas}`;
    title.alignment = {
      horizontal: "center",
      vertical: "middle"
    };
    
    title.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" }
    };
  
    title.font = { bold: true, size: 12 };

    row++;
    const headerRow = sheet.addRow([
      "Hari",
      "Jam",
      "Mata Kuliah",
      "Dosen",
      "Ruangan",
    ]);
    headerRow.eachCell((cell) => {
      cell.alignment = {
        horizontal: "center",
        vertical: "middle"
      };
    
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9D9D9" }
      };
    
      borderAll(cell);
    
    });

    /* GROUP HARI */
    const hariGroup = {};

    jadwalList.forEach((j) => {
      if (!hariGroup[j.hari]) hariGroup[j.hari] = [];
      hariGroup[j.hari].push(j);
    });

    hariUrut.forEach((hari) => {
      const items = hariGroup[hari] || [];
      if (items.length === 0) return;

      const startRow = sheet.lastRow.number + 1;

      items.forEach((item, i) => {
        const r = sheet.addRow([
          i === 0 ? hari : "",
          `${item.jamMulai} - ${item.jamSelesai}`,
          item.matkul?.nama || "-",
          item.dosen?.nama || "-",
          item.ruang?.nama || "-",
        ]);

        r.eachCell((cell) => {
          borderAll(cell);
          cell.alignment = { vertical: "middle" };
        });
      });

      const endRow = sheet.lastRow.number;

      if (endRow > startRow) {
        sheet.mergeCells(`A${startRow}:A${endRow}`);
      }
    });

    row = sheet.lastRow.number + 2;
  });

  sheet.columns = [
    { width: 15 },
    { width: 20 },
    { width: 35 },
    { width: 30 },
    { width: 18 },
  ];
  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    `Jadwal_SMT_${semesterAktif}_${filterKelas}.xlsx`
  );
};