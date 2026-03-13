import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportAllProdi = async (data, batchInfo) => {

  const workbook = new ExcelJS.Workbook();

  const fakultas = batchInfo?.fakultas?.nama || "";
  const prodi = data?.[0]?.prodi || "";
  const periode = batchInfo?.periode?.nama || "";

  const hariUrut = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function hitungSemester(angkatan, tahunMulai, paruh) {
  if (!angkatan || !tahunMulai) return 1;

  const tahunStudi = tahunMulai - angkatan + 1;

  if (paruh === "GANJIL") {
    return (tahunStudi * 2) - 1; // 1,3,5,7
  }

  if (paruh === "GENAP") {
    return tahunStudi * 2; // 2,4,6,8
  }

  return 1;
}

  function toRomawi(num) {
    const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
    return roman[num] || num;
  }

  const borderAll = (cell) => {
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" }
    };
  };

  /* ================= GROUP DATA ================= */
  const grouped = {};

  data.forEach((j) => {
  
    const semester = toRomawi(j.semester || 1);
  
    const kelas = j.kelas || "A";
  
    if (!grouped[semester]) grouped[semester] = {};
    if (!grouped[semester][kelas]) grouped[semester][kelas] = [];
  
    grouped[semester][kelas].push(j);
  
  });
  /* ================= LOOP SEMESTER ================= */
  const romawiToNumber = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8
  };
  
  Object.entries(grouped)
    .sort(([a], [b]) => romawiToNumber[a] - romawiToNumber[b])
    .forEach(([semester, kelasList]) => {

    const sheet = workbook.addWorksheet(`SMT ${semester}`);

    let row = 1;

    /* HEADER */

    sheet.mergeCells(`A${row}:I${row}`);
    sheet.getCell(`A${row}`).value = `JADWAL KULIAH ${periode}`;
    sheet.getCell(`A${row}`).alignment = { horizontal: "center" };
    sheet.getCell(`A${row}`).font = { bold: true, size: 14 };
    row++;

    sheet.mergeCells(`A${row}:I${row}`);
    sheet.getCell(`A${row}`).value = `PROGRAM STUDI ${prodi.toUpperCase()}`;
    sheet.getCell(`A${row}`).alignment = { horizontal: "center" };
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;

    sheet.mergeCells(`A${row}:I${row}`);
    sheet.getCell(`A${row}`).value = fakultas.toUpperCase();
    sheet.getCell(`A${row}`).alignment = { horizontal: "center" };
    sheet.getCell(`A${row}`).font = { bold: true };
    row += 2;

    /* SORT KELAS */
    const sortedKelas = Object.entries(kelasList)
      .sort(([a], [b]) => a.localeCompare(b));

    /* LOOP KELAS */

    sortedKelas.forEach(([kelas, jadwalList]) => {

      sheet.mergeCells(`A${row}:I${row}`);

      const titleCell = sheet.getCell(`A${row}`);

      titleCell.value = `SEMESTER ${semester}_${kelas} `;

      titleCell.font = { bold: true, size: 12 };

      titleCell.alignment = {
        horizontal: "center",
        vertical: "middle"
      };

      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9D9D9" }
      };

      sheet.getRow(row).height = 28;

      row++;

      const headers = [
        "HARI",
        "PUKUL",
        "KODE MK",
        "MATA KULIAH",
        "SKS",
        "DOSEN / TENAGA PENGAJAR",
        "DOSEN PENGAMPU",
        "Jml Mhs",
        "R"
      ];

      const headerRow = sheet.addRow(headers);

      headerRow.eachCell((cell) => {

        cell.font = { bold: true };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle"
        };

        borderAll(cell);

      });

      sheet.getRow(headerRow.number).height = 22;

      /* GROUP HARI */

      const groupedByHari = {};

      jadwalList.forEach((j) => {

        const hari = j.hari || "-";

        if (!groupedByHari[hari]) groupedByHari[hari] = [];

        groupedByHari[hari].push(j);

      });

      let rowIndex = sheet.lastRow.number + 1;

      hariUrut.forEach((hari) => {

        const items = groupedByHari[hari] || [];
      
        if (items.length === 0) return; // <<< penting
      
        const startRow = sheet.lastRow.number + 1;
      
        items.forEach((j) => {
      
          const rowData = sheet.addRow([
            hari,
            `${j.jamMulai} - ${j.jamSelesai}`,
            j.kodeMk || "",
            j.mataKuliah || "",
            j.sks || "",
            j.dosen || "",
            j.dosen || "",
            j.jumlahMahasiswa || "",
            j.ruangan || ""
          ]);
      
          rowData.eachCell((cell) => {
            borderAll(cell);
            cell.alignment = {
              horizontal: "left",
              vertical: "middle"
            };
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
          { width: 12 },
          { width: 15 },
          { width: 12 },
          { width: 35 },
          { width: 6 },
          { width: 35 },
          { width: 35 },
          { width: 10 },
          { width: 10 }
        ];

      });

      const buffer = await workbook.xlsx.writeBuffer();

      saveAs(new Blob([buffer]), "Jadwal_Prodi.xlsx");

    };