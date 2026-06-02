import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportPdfDosen = async (data, formatKelas, batchInfo) => {
  const doc = new jsPDF("landscape");

  const fakultas = batchInfo?.fakultas?.nama || "-";
  const periode = batchInfo?.periode?.nama || "-";
  const prodiNama =
    batchInfo?.prodi?.nama ||
    data?.[0]?.jadwal?.[0]?.prodi ||
    "-";

  // ================= LOGO =================
  const logoBlob = await (await fetch("/logofts.png")).blob();
  const logofts = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(logoBlob);
  });

  doc.addImage(logofts, "PNG", 16, 8, 28, 28);

  // ================= HEADER =================
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(12);
  doc.text("BEBAN MENGAJAR DOSEN", pageWidth / 2, 23, { align: "center" });
  doc.text(fakultas.toUpperCase(), pageWidth / 2, 30, { align: "center" });
  doc.text(`PERIODE ${periode.toUpperCase()}`, pageWidth / 2, 37, { align: "center" });

  // ================= TABLE DATA =================
  const body = data.flatMap((dosen, idx) => {
    const totalSKS = dosen.jadwal.reduce((a, j) => a + (j.sksEfektif || 0), 0);

    return dosen.jadwal.map((j, i) => ([
      i === 0 ? idx + 1 : "",
      i === 0 ? dosen.nama : "",
      j.mataKuliah || "-",
      formatKelas(j),
      j.sksEfektif || "-",
      j.hari || "-",
      `${j.jamMulai} - ${j.jamSelesai}`,
      j.ruangan || "-",
      i === 0 ? totalSKS : ""
    ]));
  });

  // ================= TABLE =================
  autoTable(doc, {
    startY: 45,
    head: [[
      "NO","NAMA DOSEN","MATA KULIAH","KELAS","SKS","HARI","WAKTU","RUANG","TOTAL SKS"
    ]],
    body,
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 2, valign: "middle" },
    headStyles: { fillColor: [22,163,74], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 52 },
      2: { cellWidth: 62 },
      3: { cellWidth: 32 },
      4: { cellWidth: 12 },
      5: { cellWidth: 22 },
      6: { cellWidth: 32 },
      7: { cellWidth: 20 },
      8: { cellWidth: 18 },
    },
    didParseCell: ({ column, cell }) => {
      if ([0,1,8].includes(column.index) && cell.raw === "") {
        cell.styles.lineWidth = { top: 0, bottom: 0, left: 0.1, right: 0.1 };
      }
    }
  });

  doc.save(`Jadwal_Dosen_${periode}.pdf`);
};