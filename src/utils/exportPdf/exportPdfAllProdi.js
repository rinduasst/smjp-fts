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

  return roman[num] || num;
};

export const exportPdfAllProdi = async (data, batchInfo) => {
  const doc = new jsPDF("landscape");

  const fakultas = batchInfo?.fakultas?.nama || "";
  const periode = batchInfo?.periode?.nama || "";
  const logoResponse = await fetch("/logofts.png");
const logoBlob = await logoResponse.blob();

const logofts = await new Promise((resolve) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.readAsDataURL(logoBlob);
});

  // ================= LOGO =================
  doc.addImage(logofts, "PNG", 16, 8,28, 28);

  // ================= TITLE ======================

// font Times New Roman bold
doc.setFont("times new roman", "bold");
// ambil lebar halaman
const pageWidth = doc.internal.pageSize.getWidth();

// Judul
doc.setFontSize(16);
doc.text("JADWAL PERKULIAHAN", pageWidth / 2, 15, {
  align: "center",
});

// Fakultas
doc.setFontSize(12);
doc.text(fakultas.toUpperCase(), pageWidth / 2, 23, {
  align: "center",
});

// Periode
doc.text(`PERIODE ${periode.toUpperCase()}`, pageWidth / 2, 30, {
  align: "center",
});

 
// ================= TABLE DATA =================
const tableData = data.map((j) => {
  // ambil semester langsung dari data
  const semesterRomawi = j.semester
    ? toRomawi(j.semester)
    : "-";

  // format kelas
  const kelasFormatted = j.kelas
    ? [
        ...new Set(
          j.kelas
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        ),
      ]
        .map((k) => {
          if (k.toLowerCase() === "karyawan") {
            return `${semesterRomawi}_KARYAWAN`;
          }

          return `${semesterRomawi}_REG_${k}`;
        })
        .join(", ")
    : "-";

  return [
    j.hari || "-",
    `${j.jamMulai} - ${j.jamSelesai}`,
    j.mataKuliah || "-",
    j.sksEfektif || "-",
    kelasFormatted,
    j.prodi || "-",
    j.dosen || "-",
    j.ruangan || "-",
  ];
});
  // ================= TABLE =================
  autoTable(doc, {
    startY: 40,
    head: [
      [
        "Hari",
        "Jam",
        "Mata Kuliah",
        "SKS",
        "Kelas",
        "Program Studi",
        "Dosen",
        "Ruangan",
      ],
    ],
    body: tableData,

    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
    },

    headStyles: {
      fillColor: [22, 163, 74],
    },

    columnStyles: {
      0: { cellWidth: 20 }, // Hari
      1: { cellWidth: 30 }, // Jam
      2: { cellWidth: 50 }, // Mata kuliah
      3: { cellWidth: 12 }, // SKS
      4: { cellWidth: 25 }, // Kelas
      5: { cellWidth: 45 }, // Prodi
      6: { cellWidth: 50 }, // Dosen
      7: { cellWidth: 25 }, // Ruangan
    },
  });

  // ================= SAVE =================
  doc.save(`Jadwal_Kuliah_${periode}.pdf`);
};