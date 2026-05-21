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

  // FIX PENTING:
  // jangan ambil huruf terakhir
  // jangan ubah kelas
  // biarkan asli dari backend
  const normalizeKelas = (kelas) => {
    if (!kelas) return ["A"];

    return kelas
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  };

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

      /* ================= LOGO ================= */

      sheet.addImage(logoId, {
        tl: { col: 0, row: 0 },
        ext: { width: 120, height: 120 },
      });

      /* ================= HEADER ================= */

      const headersInfo = [
        {
          row: 1,
          text: `JADWAL KULIAH`,
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

      let currentRow = 6;

      /* ================= GROUP SEMESTER ================= */

      const groupedSemester = {};

      prodiData.forEach((j) => {
        const semester = toRomawi(j.semester || 1);

        groupedSemester[semester] ??= {};

        const kelasUtama = (j.kelas || "")
        .split(",")[0]
        .trim();
      
      groupedSemester[semester][kelasUtama] ??= [];
      groupedSemester[semester][kelasUtama].push(j);
      });

      /* ================= LOOP SEMESTER ================= */

      Object.entries(groupedSemester)
        .sort(
          ([a], [b]) =>
            romawiToNumber[a] - romawiToNumber[b]
        )
        .forEach(([semester, kelasList]) => {
          Object.entries(kelasList)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([kelas, jadwalList]) => {

              let row = currentRow;

              /* ================= TITLE ================= */

              mergeSafe(sheet, row, 1, row, 9);

              const titleCell = sheet.getCell(row, 1);

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
                "RUANG",
              ];

              headers.forEach((header, i) => {
                const cell = sheet.getCell(row, i + 1);

                cell.value = header;

                cell.font = {
                  bold: true,
                };

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

              jadwalList.forEach((j) => {
                const hari = j.hari || "-";

                groupedByHari[hari] ??= [];
                groupedByHari[hari].push(j);
              });

              /* ================= DATA ================= */

              hariUrut.forEach((hari) => {
                const items = groupedByHari[hari] || [];

                if (!items.length) return;

                const mergeStart = row;

                items.forEach((j, index) => {
                  const values = [
                    index === 0 ? hari : "",
                    `${j.jamMulai || ""} - ${j.jamSelesai || ""}`,
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
                      i + 1
                    );

                    cell.value = val;

                    cell.alignment = {
                      horizontal: "left",
                      vertical: "middle",
                      wrapText: true,
                    };

                    borderAll(cell);
                  });

                  row++;
                });

                if (items.length > 1) {
                  mergeSafe(
                    sheet,
                    mergeStart,
                    1,
                    row - 1,
                    1
                  );
                }
              });

              currentRow = row + 3;
            });
        });

      /* ================= WIDTH ================= */

      sheet.columns = [
        { width: 12 },
        { width: 18 },
        { width: 14 },
        { width: 40 },
        { width: 8 },
        { width: 35 },
        { width: 35 },
        { width: 12 },
        { width: 14 },
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