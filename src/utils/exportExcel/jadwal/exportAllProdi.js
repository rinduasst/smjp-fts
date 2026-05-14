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
  const posisiSemester = [
    { col: 1, row: 6 },
    { col: 11, row: 6 },
    { col: 1, row: 40 },
    { col: 11, row: 40 },
  ];
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
    const roman = [
      "",
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
    ];

    return roman[num] || num;
  };

  const normalizeKelas = (kelas) =>
    !kelas
      ? ["A"]
      : kelas
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean);

  /* ================= GROUP PRODI ================= */

  const groupedProdi = {};

  data.forEach((j) => {
    const namaProdi =
      j?.prodi?.nama ||
      j?.prodiNama ||
      j?.prodi ||
      "SEMUA PRODI";

    groupedProdi[namaProdi] ??= [];
    groupedProdi[namaProdi].push(j);
  });

  /* ================= LOOP SHEET ================= */

  Object.entries(groupedProdi).forEach(
    ([namaProdi, prodiData]) => {
      const sheet = workbook.addWorksheet(
        namaProdi.substring(0, 31).toUpperCase()
      );

      /* ================= ADD LOGO ================= */

      sheet.addImage(logoId, {
        tl: { col: 0, row: 0 },
        ext: { width: 120, height: 120 },
      });

      /* ================= HEADER ================= */

      const headersInfo = [
        {
          row: 1,
          text: `JADWAL KULIAH `,
          size: 16,
        },
        {
          row: 2,
          text: `PROGRAM STUDI ${namaProdi.toUpperCase()}`,
          size: 14,
        },
        {
          row: 3,
          text: fakultas.toUpperCase(),
          size: 14,
        },
        {
          row: 4,
          text: `PERIODE ${periode.toUpperCase()}`,
          size: 14,
        },
      ];

      headersInfo.forEach(({ row, text, size }) => {
        mergeSafe(sheet, `B${row}:I${row}`);

        const cell = sheet.getCell(`B${row}`);

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
      });

      /* ================= GROUP SEMESTER ================= */

      const groupedSemester = {};

      prodiData.forEach((j) => {
        const semester = toRomawi(j.semester || 1);

        groupedSemester[semester] ??= {};

        normalizeKelas(j.kelas).forEach((kelas) => {
          groupedSemester[semester][kelas] ??= [];
          groupedSemester[semester][kelas].push(j);
        });
      });

      /* ================= LOOP SEMESTER ================= */

      Object.entries(groupedSemester)
        .sort(
          ([a], [b]) =>
            romawiToNumber[a] - romawiToNumber[b]
        )
        .forEach(([semester, kelasList], index) => {
          const { col: startCol, row: startRow } =
            posisiSemester[index % posisiSemester.length];

          let baseRow = startRow;

          Object.entries(kelasList)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([kelasRaw, jadwalList]) => {
              normalizeKelas(kelasRaw).forEach((kelas) => {
                const dataKelas = jadwalList.filter((j) =>
                  (j.kelas || "").includes(kelas)
                );

                if (!dataKelas.length) return;

                let row = baseRow + 1;

                /* ================= TITLE ================= */

                mergeSafe(
                  sheet,
                  row,
                  startCol,
                  row,
                  startCol + 8
                );

                const titleCell = sheet.getCell(
                  row,
                  startCol
                );

                titleCell.value = `SEMESTER ${semester} - KELAS ${kelas}`;

                titleCell.font = {
                  bold: true,
                  size: 12,
                };

                titleCell.alignment = {
                  horizontal: "center",
                  vertical: "middle",
                };

                titleCell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFD9D9D9" },
                };

                sheet.getRow(row).height = 25;

                row++;

                /* ================= HEADER TABLE ================= */

                const headers = [
                  "HARI",
                  "PUKUL",
                  "KODE MK",
                  "MATA KULIAH",
                  "SKS",
                  "DOSEN / TENAGA PENGAJAR",
                  "DOSEN PENGAMPU",
                  "JML MHS",
                  "R",
                ];

                headers.forEach((header, i) => {
                  const cell = sheet.getCell(
                    row,
                    startCol + i
                  );

                  cell.value = header;

                  cell.font = { bold: true };

                  cell.alignment = {
                    horizontal: "center",
                    vertical: "middle",
                  };

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

                const groupedByHari = {};

                dataKelas.forEach((j) => {
                  const hari = j.hari || "-";

                  groupedByHari[hari] ??= [];
                  groupedByHari[hari].push(j);
                });

                /* ================= DATA ================= */

                hariUrut.forEach((hari) => {
                  const items =
                    groupedByHari[hari] || [];

                  if (!items.length) return;

                  const mergeStart = row;

                  items.forEach((j, index) => {
                    const values = [
                      index === 0 ? hari : "",
                      `${j.jamMulai} - ${j.jamSelesai}`,
                      j.kodeMk || "",
                      j.mataKuliah || "",
                      j.sks || "",
                      j.dosen || "",
                      j.dosen || "",
                      j.jumlahMahasiswa || "",
                      j.ruangan || "",
                    ];

                    values.forEach((val, i) => {
                      const cell = sheet.getCell(
                        row,
                        startCol + i
                      );

                      cell.value = val;

                      cell.alignment = {
                        horizontal: "left",
                        vertical: "middle",
                      };

                      borderAll(cell);
                    });

                    row++;
                  });

                  if (items.length > 1) {
                    mergeSafe(
                      sheet,
                      mergeStart,
                      startCol,
                      row - 1,
                      startCol
                    );
                  }
                });

                baseRow = row + 2;
              });
            });
        });

      /* ================= WIDTH ================= */

      sheet.columns = [
        { width: 12 },
        { width: 15 },
        { width: 12 },
        { width: 35 },
        { width: 6 },
        { width: 35 },
        { width: 35 },
        { width: 10 },
        { width: 10 },

        { width: 5 },

        { width: 12 },
        { width: 15 },
        { width: 12 },
        { width: 35 },
        { width: 6 },
        { width: 35 },
        { width: 35 },
        { width: 10 },
        { width: 10 },
      ];
    }
  );

  /* ================= EXPORT ================= */

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    `Jadwal_Kuliah_${periode}.xlsx`
  );
};