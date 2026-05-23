import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

  export const exportProdi = async (data, batchInfo, prodi) => {

    const workbook = new ExcelJS.Workbook();
  
    const fakultas = batchInfo?.fakultas?.nama || "";
    const periode = batchInfo?.periode?.nama || "";
  const hariUrut = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

  const urutanKelas = ["A","B","C","D","E","F","KARYAWAN"];

  const borderAll = (cell) => {
    cell.border = {
      top:{style:"thin"},
      bottom:{style:"thin"},
      left:{style:"thin"},
      right:{style:"thin"}
    };
  };
  const logoResponse = await fetch("/logofts.png");
  const logoBuffer = await logoResponse.arrayBuffer();
  
  const logoId = workbook.addImage({
    buffer: logoBuffer,
    extension: "png"
  });
  const prodiNama =
  prodi ||
  data?.[0]?.slots?.[0]?.prodi?.nama ||
  batchInfo?.prodi?.nama ||
  "-";
  const sheet = workbook.addWorksheet(`Jadwal Prodi`);

  // LOGO
  sheet.addImage(logoId, {
    tl: { col: 0, row: 0 },
    ext: { width: 120, height: 120 }
  });

  const periodeNama = batchInfo?.periode?.nama || "";
  
  // Baris 1
  sheet.mergeCells("B1:G1");
  sheet.getCell("B1").value = "JADWAL PERKULIAHAN";
  sheet.getCell("B1").font = {
    name: "Times New Roman",
    size: 20,
    bold: true
  };
  sheet.getCell("B1").alignment = {
    horizontal: "center",
    vertical: "middle"
  };
  
  // Baris 2
  sheet.mergeCells("B2:G2");
  sheet.getCell("B2").value = `PROGRAM STUDI ${prodiNama.toUpperCase()}`;
  sheet.getCell("B2").font = {
    name: "Times New Roman",
    size: 16,
    bold: true
  };
  sheet.getCell("B2").alignment = {
    horizontal: "center"
  };
  
  // Baris 3
  sheet.mergeCells("B3:G3");
  sheet.getCell("B3").value = `${fakultas.toUpperCase()}`;
  sheet.getCell("B3").font = {
    name: "Times New Roman",
    size: 16,
    bold: true
  };
  sheet.getCell("B3").alignment = {
    horizontal: "center"
  };
  
  // Baris 4
  sheet.mergeCells("B4:G4");
  sheet.getCell("B4").value = `PERIODE ${periodeNama.toUpperCase()}`;
  sheet.getCell("B4").font = {
    name: "Times New Roman",
    size: 14,
    bold: true
  };
  sheet.getCell("B4").alignment = {
    horizontal: "center"
  };

  let row = 6;

  /* HEADER TABLE */
  const headerRow = sheet.addRow([
    "Hari",
    "Jam",
    "Mata Kuliah",
    "SKS",
    "Dosen",
    "Kelas",
    "Ruangan"
  ]);

  headerRow.eachCell((cell)=>{
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" }
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    borderAll(cell);
  });

  /* GROUP HARI */
  const formatKelasString = (slot) => {
    const kelas = slot?.kelas;
    if (!kelas) return "-";

    const toRomawi = (num) => ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][num] || num;
    const hitungSemester = (angkatan, tahunMulai, paruh) => {
      if (!angkatan || !tahunMulai) return 0;
      return (tahunMulai - angkatan) * 2 + (paruh === "GENAP" ? 2 : 1);
    };

    if (Array.isArray(kelas)) {
      return kelas.map((k) => {
        const romawi = toRomawi(hitungSemester(k.angkatan, batchInfo?.periode?.tahunMulai, batchInfo?.periode?.paruh));
        if (k.kode?.toLowerCase() === "karyawan") return `${romawi}_KARYAWAN`;
        return `${romawi}_REG_${k.kode}`;
      }).join(", ");
    }
    if (typeof kelas === "object") {
      const romawi = toRomawi(hitungSemester(kelas.angkatan, batchInfo?.periode?.tahunMulai, batchInfo?.periode?.paruh));
      if (kelas.kode?.toLowerCase() === "karyawan") return `${romawi}_KARYAWAN`;
      return `${romawi}_REG_${kelas.kode}`;
    }
    return String(kelas);
  };

  data.forEach((hari) => {
    if (!hari.slots || hari.slots.length === 0) return;

    const startRow = sheet.lastRow.number + 1;

    hari.slots.forEach((slot, i) => {
      const r = sheet.addRow([
        i === 0 ? hari.nama : "",
        `${slot.jamMulai} - ${slot.jamSelesai}`,
        slot.matkul?.nama || "-",
        slot.sksEfektif || "-",
        slot.dosen?.nama || "-",
        formatKelasString(slot),
        slot.ruang?.nama || "-"
      ]);

      r.eachCell((cell, colNumber) => {
        borderAll(cell);
        if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 6) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
        } else {
            cell.alignment = { vertical: "middle", wrapText: true };
        }
      });
    });

    const endRow = sheet.lastRow.number;
    if (endRow > startRow) {
      sheet.mergeCells(`A${startRow}:A${endRow}`);
    }
  });

  sheet.columns = [
    { width: 15 }, // Hari
    { width: 20 }, // Jam
    { width: 40 }, // Mata Kuliah
    { width: 8 },  // SKS
    { width: 35 }, // Dosen
    { width: 25 }, // Kelas
    { width: 20 }  // Ruangan
  ];

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    `Jadwal_Prodi_${prodiNama}_${periode}.xlsx`
  );

};