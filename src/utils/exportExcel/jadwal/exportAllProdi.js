import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportAllProdi = async (data, batchInfo) => {
  const workbook = new ExcelJS.Workbook();

  const fakultas = batchInfo?.fakultas?.nama || "";
  const periode = batchInfo?.periode?.nama || "";

  /* ================= LOGO ================= */

  const logoResponse = await fetch("/logofts.png");
  const logoBuffer = await logoResponse.arrayBuffer();

  const logoId = workbook.addImage({
    buffer: logoBuffer,
    extension: "png",
  });

  const hariUrut = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  const romawiToNumber = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
  };
  /* ================= HELPER ================= */

  const borderAll = (cell) => {
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  };

  const mergeSafe = (sheet, ...args) => {
    try {
      sheet.mergeCells(...args);
    } catch {}
  };

  const toRomawi = (num) => {
    const map = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
    return map[num] || num;
  };

  const hitungSemester = (angkatan, tahunMulai, paruh) => {
    if (!angkatan || !tahunMulai) return 0;
    return (tahunMulai - angkatan) * 2 + (paruh === "GENAP" ? 2 : 1);
  };

  const sortKelas = (a, b) => {
    if (a === "KARYAWAN") return 1;
    if (b === "KARYAWAN") return -1;
    return a.localeCompare(b);
  };

  /* ================= LOOP PRODI ================= */

  Object.entries(data).forEach(([namaProdi, hariData]) => {
    if (!hariData || hariData.length === 0) return;

    const sheet = workbook.addWorksheet(
      namaProdi.substring(0, 31).toUpperCase()
    );

    /* ================= ADD LOGO ================= */

    sheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 120, height: 120 },
    });

    /* ================= HEADER ================= */

    let row = 1;

    const headersInfo = [
      { text: `JADWAL KULIAH`, size: 16 },
      { text: `PROGRAM STUDI ${namaProdi.toUpperCase()}`, size: 16 },
      { text: fakultas.toUpperCase(), size: 16 },
      { text: `PERIODE ${periode.toUpperCase()}`, size: 16 },
    ];

    headersInfo.forEach(({ text, size }) => {
      mergeSafe(sheet, `A${row}:E${row}`);
      const cell = sheet.getCell(`A${row}`);
      cell.value = text;
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      cell.font = {
        bold: true,
        size,
        name: "Times New Roman",
      };
      row++;
    });

    row += 2;

    /* ================= GROUPING LIKE JadwalKelas.jsx ================= */

    const grouped = {};

    hariData.forEach((hari) => {
      hari.slots?.forEach((slot) => {
        const kelasList = slot.kelas?.kode
          ?.split(",")
          .map((k) => k.trim())
          .map((k) => {
            const parts = k.split(" ");
            return parts[parts.length - 1]; // ambil A/B/C/KARYAWAN
          })
          .filter(Boolean) || [];

        const semester = hitungSemester(
          slot.kelas?.angkatan,
          batchInfo?.periode?.tahunMulai,
          batchInfo?.periode?.paruh
        );

        kelasList.forEach((kelasKey) => {
          if (!grouped[semester]) grouped[semester] = {};
          if (!grouped[semester][kelasKey]) grouped[semester][kelasKey] = [];

          grouped[semester][kelasKey].push({
            ...slot,
            hari: hari.nama,
            kelas: kelasKey,
          });
        });
      });
    });

    const semesterList = Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b);

    /* ================= LOOP SEMESTER & KELAS ================= */

    semesterList.forEach((semesterAktif) => {
      const kelasEntries = Object.entries(grouped[semesterAktif] || {}).sort(
        ([a], [b]) => sortKelas(a, b)
      );

      kelasEntries.forEach(([kelas, jadwalList]) => {
        if (!jadwalList.length) return;

        /* ================= TITLE ================= */

        mergeSafe(sheet, `A${row}:E${row}`);
        const titleCell = sheet.getCell(`A${row}`);
        titleCell.value = `SEMESTER ${toRomawi(semesterAktif)} - KELAS ${kelas}`;
        titleCell.font = { bold: true, size: 12 };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        titleCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9D9D9" },
        };
        sheet.getRow(row).height = 25;
        row++;

        /* ================= HEADER TABLE ================= */

        const headers = ["Hari", "Jam", "Mata Kuliah", "Dosen", "Ruangan"];
        headers.forEach((header, i) => {
          const cell = sheet.getCell(row, i + 1);
          cell.value = header;
          cell.font = { bold: true };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9D9D9" },
          };
          borderAll(cell);
        });
        sheet.getRow(row).height = 22;
        row++;

        /* ================= GROUP HARI ================= */

        const hariGroup = {};
        jadwalList.forEach((j) => {
          if (!hariGroup[j.hari]) hariGroup[j.hari] = [];
          hariGroup[j.hari].push(j);
        });

        /* ================= DATA ================= */

        hariUrut.forEach((hari) => {
          const items = hariGroup[hari] || [];
          if (!items.length) return;

          const mergeStart = row;

          items.forEach((item, i) => {
            const values = [
              i === 0 ? hari : "",
              `${item.jamMulai} - ${item.jamSelesai}`,
              item.matkul?.nama || "-",
              item.dosen?.nama || "-",
              item.ruang?.nama || "-",
            ];

            values.forEach((val, colIndex) => {
              const cell = sheet.getCell(row, colIndex + 1);
              cell.value = val;
              cell.alignment = {
                horizontal: colIndex === 1 ? "center" : "left",
                vertical: "middle",
              };
              borderAll(cell);
            });

            row++;
          });

          if (items.length > 1) {
            mergeSafe(sheet, `A${mergeStart}:A${row - 1}`);
          }
        });

        row += 2;
      });
    });

    /* ================= WIDTH ================= */

    sheet.columns = [
      { width: 15 },
      { width: 20 },
      { width: 35 },
      { width: 30 },
      { width: 18 },
    ];
  });

  /* ================= EXPORT ================= */

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    `Jadwal_Kuliah_${periode}.xlsx`
  );
};