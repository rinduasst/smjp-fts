import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  return roman[num] || "";
};

const formatKelas = (
  slot,
  batchInfo
) => {
  const kelasObj = slot.kelas;

  if (!kelasObj?.kode) return "-";

  // hitung semester dari angkatan
  const angkatan =
    kelasObj.angkatan;

  const semester =
    (batchInfo?.periode
      ?.tahunMulai -
      angkatan) *
      2 +
    (batchInfo?.periode
      ?.paruh === "GENAP"
      ? 2
      : 1);

  const semesterRomawi =
    toRomawi(semester);

  const kelasList = [
    ...new Set(
      kelasObj.kode
        .split(",")
        .map((k) =>
          k.trim()
        )
        .filter(Boolean)
    ),
  ];

  return kelasList
    .map((k) => {
      if (
        k.toLowerCase() ===
        "karyawan"
      ) {
        return `${semesterRomawi}_KARYAWAN`;
      }

      return `${semesterRomawi}_REG_${k}`;
    })
    .join(", ");
};

export const exportPdfProdi = async (
  data,
  batchInfo
) => {
  const doc = new jsPDF("landscape");

  const fakultas =
    batchInfo?.fakultas?.nama || "";

  const periode =
    batchInfo?.periode?.nama || "";

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
  doc.setFont(
    "times",
    "bold"
  );

  const pageWidth =
    doc.internal.pageSize.getWidth();

  doc.setFontSize(16);

  doc.text(
    "JADWAL PERKULIAHAN",
    pageWidth / 2,
    15,
    {
      align: "center",
    }
  );

  doc.setFontSize(12);

  doc.text(
    fakultas.toUpperCase(),
    pageWidth / 2,
    23,
    {
      align: "center",
    }
  );

  doc.text(
    `PERIODE ${periode.toUpperCase()}`,
    pageWidth / 2,
    30,
    {
      align: "center",
    }
  );

  // ================= TABLE DATA =================
  const tableData = [];

  data.forEach((hari) => {
    if (
      !hari.slots ||
      hari.slots.length === 0
    )
      return;

    hari.slots.forEach(
      (slot, index) => {
        tableData.push([
          hari.nama,
          `${slot.jamMulai} - ${slot.jamSelesai}`,
          slot.matkul?.nama ||
            "-",
          slot.sksEfektif ||
            "-",
          slot.dosen?.nama ||
            "-",
            formatKelas(
              slot,
              batchInfo
            ),
          slot.ruang?.nama ||
            "-",
        ]);
      }
    );
  });

  // ================= TABLE =================
  autoTable(doc, {
    startY: 40,
  
    head: [[
      "Hari",
      "Jam",
      "Mata Kuliah",
      "SKS",
      "Dosen",
      "Kelas",
      "Ruangan",
    ]],
  
    body: tableData,
  
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
    },
  
    headStyles: {
      fillColor: [22, 163, 74],
    },
  
    tableWidth: "auto",
  });
  // ================= SAVE =================
  doc.save(
    `Jadwal_Prodi_${periode}.pdf`
  );
};