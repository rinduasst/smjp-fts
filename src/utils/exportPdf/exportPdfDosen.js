import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportPdfDosen = async (
  data,
  formatKelas,
  batchInfo
) => {
  const doc = new jsPDF("landscape");

  const fakultas =
    batchInfo?.fakultas?.nama || "-";

  const periode =
    batchInfo?.periode?.nama || "-";

  const prodiNama =
    batchInfo?.prodi?.nama ||
    data?.[0]?.jadwal?.[0]?.prodi ||
    "-";

  // ================= LOGO =================
  const logoResponse = await fetch(
    "/logofts.png"
  );

  const logoBlob =
    await logoResponse.blob();

  const logofts =
    await new Promise((resolve) => {
      const reader =
        new FileReader();

      reader.onloadend = () =>
        resolve(reader.result);

      reader.readAsDataURL(
        logoBlob
      );
    });

  doc.addImage(
    logofts,
    "PNG",
    16,
    8,
    28,
    28
  );

  // ================= TITLE =================
  const pageWidth =
    doc.internal.pageSize.getWidth();

  doc.setFont(
    "times",
    "bold"
  );

  doc.setFontSize(16);

  doc.text(
    "BEBAN KERJA DOSEN",
    pageWidth / 2,
    15,
    {
      align: "center",
    }
  );

  doc.setFontSize(12);

  doc.text(
    `PROGRAM STUDI ${prodiNama.toUpperCase()}`,
    pageWidth / 2,
    23,
    {
      align: "center",
    }
  );

  doc.text(
    fakultas.toUpperCase(),
    pageWidth / 2,
    30,
    {
      align: "center",
    }
  );

  doc.text(
    `PERIODE ${periode.toUpperCase()}`,
    pageWidth / 2,
    37,
    {
      align: "center",
    }
  );

  // ================= TABLE DATA =================
  const body = [];

  data.forEach(
    (dosen, idx) => {
      const totalSKS =
        dosen.jadwal.reduce(
          (acc, j) =>
            acc +
            (j.sksEfektif || 0),
          0
        );

      dosen.jadwal.forEach(
        (j, i) => {
          body.push([
            i === 0
              ? idx + 1
              : "",
            i === 0
              ? dosen.nama
              : "",
            j.mataKuliah ||
              "-",
            formatKelas(j),
            j.sksEfektif ||
              "-",
            j.hari || "-",
            `${j.jamMulai} - ${j.jamSelesai}`,
            j.ruangan ||
              "-",
            i === 0
              ? totalSKS
              : "",
          ]);
        }
      );
    }
  );

  // ================= TABLE =================
  autoTable(doc, {
    startY: 45,

    head: [[
      "NO",
      "NAMA DOSEN",
      "MATA KULIAH",
      "KELAS",
      "SKS",
      "HARI",
      "WAKTU",
      "RUANG",
      "TOTAL SKS",
    ]],

    body,

    theme: "striped",

    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
    },

    headStyles: {
      fillColor: [
        22, 163, 74,
      ],
      textColor: 255,
      fontStyle: "bold",
    },

    columnStyles: {
      0: {
        cellWidth: 12,
      },
      1: {
        cellWidth: 52,
      },
      2: {
        cellWidth: 62,
      },
      3: {
        cellWidth: 32,
      },
      4: {
        cellWidth: 12,
      },
      5: {
        cellWidth: 22,
      },
      6: {
        cellWidth: 32,
      },
      7: {
        cellWidth: 20,
      },
      8: {
        cellWidth: 18,
      },
    },

    didParseCell: function (
      dataCell
    ) {
      // visual merge NO
      if (
        dataCell.column
          .index === 0 &&
        dataCell.cell.raw ===
          ""
      ) {
        dataCell.cell.styles
          .lineWidth = {
          top: 0,
          bottom: 0,
          left: 0.1,
          right: 0.1,
        };
      }

      // visual merge DOSEN
      if (
        dataCell.column
          .index === 1 &&
        dataCell.cell.raw ===
          ""
      ) {
        dataCell.cell.styles
          .lineWidth = {
          top: 0,
          bottom: 0,
          left: 0.1,
          right: 0.1,
        };
      }

      // visual merge TOTAL SKS
      if (
        dataCell.column
          .index === 8 &&
        dataCell.cell.raw ===
          ""
      ) {
        dataCell.cell.styles
          .lineWidth = {
          top: 0,
          bottom: 0,
          left: 0.1,
          right: 0.1,
        };
      }
    },
  });

  // ================= SAVE =================
  doc.save(
    `Jadwal_Dosen_${periode}.pdf`
  );
};