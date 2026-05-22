import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportAllProdi = async (
  data,
  batchInfo
) => {
  const workbook =
    new ExcelJS.Workbook();

  const fakultas =
    batchInfo?.fakultas?.nama || "";

  const periode =
    batchInfo?.periode?.nama || "";

  /* ================= LOGO ================= */

  const logoResponse = await fetch(
    "/logofts.png"
  );

  const logoBuffer =
    await logoResponse.arrayBuffer();

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

  /* ================= HELPER ================= */

  const borderAll = (cell) => {
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  };

  const mergeSafe = (
    sheet,
    ...args
  ) => {
    try {
      sheet.mergeCells(...args);
    } catch {}
  };

  const toRomawi = (num) => {
    const map = [
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

    return map[num] || num;
  };

  const sortKelas = (a, b) => {
    if (a === "KARYAWAN") return 1;
    if (b === "KARYAWAN") return -1;

    return a.localeCompare(b);
  };

  /* ================= TRANSFORM DATA ================= */

  const transformedData = {};

  data.forEach((item) => {
    const namaProdi =
      item?.namaProdi ||
      item?.prodi ||
      item?.prodiNama ||
      item?.programStudi ||
      item?.prodi?.nama ||
      "SEMUA PRODI";

    const hari =
      item?.hari || "Tanpa Hari";

    if (!transformedData[namaProdi]) {
      transformedData[namaProdi] = [];
    }

    let existingHari =
      transformedData[
        namaProdi
      ].find((h) => h.nama === hari);

    if (!existingHari) {
      existingHari = {
        nama: hari,
        slots: [],
      };

      transformedData[namaProdi].push(
        existingHari
      );
    }

    existingHari.slots.push({
      semester:
        item?.semester ||
        item?.semesterAktif ||
        item?.smt ||
        1,

      kelas: {
        kode:
          item?.kelas ||
          item?.kelasNama ||
          "A",
      },

      matkul: {
        kode:
          item?.kodeMk || "-",

        nama:
          item?.mataKuliah || "-",

        sks: item?.sks || "-",
      },

      dosen: {
        nama:
          item?.dosen || "-",
      },

      ruang: {
        nama:
          item?.ruangan || "-",
      },

      jamMulai:
        item?.jamMulai || "",

      jamSelesai:
        item?.jamSelesai || "",

      jumlahMahasiswa:
        item?.jumlahMahasiswa ||
        "-",
    });
  });

  /* ================= LOOP PRODI ================= */

  Object.entries(
    transformedData
  ).forEach(([namaProdi, hariData]) => {
    if (
      !hariData ||
      hariData.length === 0
    )
      return;

    const sheet =
      workbook.addWorksheet(
        namaProdi
          .substring(0, 31)
          .toUpperCase()
      );

    /* ================= ADD LOGO ================= */

    sheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: {
        width: 120,
        height: 120,
      },
    });

    /* ================= HEADER ================= */

    let row = 1;

    const headersInfo = [
      {
        text: `JADWAL KULIAH`,
        size: 16,
      },
      {
        text: `PROGRAM STUDI ${namaProdi.toUpperCase()}`,
        size: 16,
      },
      {
        text: fakultas.toUpperCase(),
        size: 16,
      },
      {
        text: `PERIODE ${periode.toUpperCase()}`,
        size: 16,
      },
    ];

    headersInfo.forEach(
      ({ text, size }) => {
        mergeSafe(
          sheet,
          `A${row}:I${row}`
        );

        const cell =
          sheet.getCell(`A${row}`);

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
      }
    );

    row += 2;

    /* ================= GROUPING ================= */

    const grouped = {};

    hariData.forEach((hari) => {
      hari.slots?.forEach((slot) => {
        const kelasList =
          slot.kelas?.kode
            ?.split(",")
            .map((k) => k.trim())
            .filter(Boolean) || [];

        const semester =
          Number(
            slot?.semester
          ) || 1;

        kelasList.forEach(
          (kelasKey) => {
            if (
              !grouped[semester]
            ) {
              grouped[semester] =
                {};
            }

            if (
              !grouped[semester][
                kelasKey
              ]
            ) {
              grouped[semester][
                kelasKey
              ] = [];
            }

            grouped[semester][
              kelasKey
            ].push({
              ...slot,
              hari: hari.nama,
              kelas: kelasKey,
            });
          }
        );
      });
    });

    const semesterList =
      Object.keys(grouped)
        .map(Number)
        .sort((a, b) => a - b);

    /* ================= LOOP SEMESTER ================= */

    semesterList.forEach(
      (semesterAktif) => {
        const kelasEntries =
          Object.entries(
            grouped[
              semesterAktif
            ] || {}
          ).sort(([a], [b]) =>
            sortKelas(a, b)
          );

        kelasEntries.forEach(
          ([kelas, jadwalList]) => {
            if (
              !jadwalList.length
            )
              return;

            /* ================= TITLE ================= */

            mergeSafe(
              sheet,
              `A${row}:I${row}`
            );

            const titleCell =
              sheet.getCell(
                `A${row}`
              );

            titleCell.value = `SEMESTER ${toRomawi(
              semesterAktif
            )} - KELAS ${kelas}`;

            titleCell.font = {
              bold: true,
              size: 12,
            };

            titleCell.alignment =
              {
                horizontal:
                  "center",
                vertical:
                  "middle",
              };

            titleCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb:
                  "FFD9D9D9",
              },
            };

            sheet.getRow(
              row
            ).height = 25;

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

            headers.forEach(
              (header, i) => {
                const cell =
                  sheet.getCell(
                    row,
                    i + 1
                  );

                cell.value =
                  header;

                cell.font = {
                  bold: true,
                };

                cell.alignment = {
                  horizontal:
                    "center",
                  vertical:
                    "middle",
                };

                cell.fill = {
                  type: "pattern",
                  pattern:
                    "solid",
                  fgColor: {
                    argb:
                      "FFD9D9D9",
                  },
                };

                borderAll(cell);
              }
            );

            sheet.getRow(
              row
            ).height = 22;

            row++;

            /* ================= GROUP HARI ================= */

            const hariGroup = {};

            jadwalList.forEach(
              (j) => {
                if (
                  !hariGroup[
                    j.hari
                  ]
                ) {
                  hariGroup[
                    j.hari
                  ] = [];
                }

                hariGroup[
                  j.hari
                ].push(j);
              }
            );

            /* ================= DATA ================= */

            hariUrut.forEach(
              (hari) => {
                const items =
                  hariGroup[
                    hari
                  ] || [];

                if (
                  !items.length
                )
                  return;

                const mergeStart =
                  row;

                items.forEach(
                  (item, i) => {
                    const values =
                      [
                        i === 0
                          ? hari
                          : "",

                        `${item.jamMulai} - ${item.jamSelesai}`,

                        item
                          .matkul
                          ?.kode ||
                          "-",

                        item
                          .matkul
                          ?.nama ||
                          "-",

                        item
                          .matkul
                          ?.sks ||
                          "-",

                        item
                          .dosen
                          ?.nama ||
                          "-",

                        item
                          .dosen
                          ?.nama ||
                          "-",

                        item.jumlahMahasiswa ||
                          "-",

                        item
                          .ruang
                          ?.nama ||
                          "-",
                      ];

                    values.forEach(
                      (
                        val,
                        colIndex
                      ) => {
                        const cell =
                          sheet.getCell(
                            row,
                            colIndex +
                              1
                          );

                        cell.value =
                          val;

                        cell.alignment =
                          {
                            horizontal:
                              colIndex ===
                              1
                                ? "center"
                                : "left",

                            vertical:
                              "middle",

                            wrapText:
                              true,
                          };

                        borderAll(
                          cell
                        );
                      }
                    );

                    row++;
                  }
                );

                if (
                  items.length > 1
                ) {
                  mergeSafe(
                    sheet,
                    `A${mergeStart}:A${
                      row - 1
                    }`
                  );
                }
              }
            );

            row += 2;
          }
        );
      }
    );

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
  });

  /* ================= EXPORT ================= */

  const buffer =
    await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    `Jadwal_Kuliah_${periode}.xlsx`
  );
};