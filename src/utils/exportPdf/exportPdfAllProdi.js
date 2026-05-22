import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const hitungSemester = (angkatan, tahunMulai, paruh) => {
  if (!angkatan || !tahunMulai) return 0;
  return (tahunMulai - angkatan) * 2 + (paruh === "GENAP" ? 2 : 1);
};

const toRomawi = (num) => {
  const map = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  return map[num] || num;
};

const sortKelas = (a, b) => {
  if (a === "KARYAWAN") return 1;
  if (b === "KARYAWAN") return -1;
  return a.localeCompare(b);
};

export const exportPdfAllProdi = async (allProdiData, batchInfo) => {
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

  const pageWidth = doc.internal.pageSize.getWidth();
  let isFirstPage = true;

  Object.entries(allProdiData).forEach(([namaProdi, hariData]) => {
    if (!hariData || hariData.length === 0) return;

    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;

    // Header
    doc.addImage(logofts, "PNG", 16, 8, 28, 28);
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text("JADWAL PERKULIAHAN", pageWidth / 2, 15, { align: "center" });
    doc.text(`PROGRAM STUDI ${namaProdi.toUpperCase()}`, pageWidth / 2, 23, { align: "center" });
    doc.setFontSize(12);
    doc.text(fakultas.toUpperCase(), pageWidth / 2, 31, { align: "center" });
    doc.text(`PERIODE ${periode.toUpperCase()}`, pageWidth / 2, 38, { align: "center" });

    let finalY = 45;

    // Grouping
    const grouped = {};
    hariData.forEach((hari) => {
      hari.slots?.forEach((slot) => {
        const kelasList = slot.kelas?.kode?.split(",").map((k) => k.trim()).filter(Boolean) || [];
        const semester = hitungSemester(slot.kelas?.angkatan, batchInfo?.periode?.tahunMulai, batchInfo?.periode?.paruh);
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

    const semesterList = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    const hariUrut = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    semesterList.forEach((semesterAktif) => {
      const kelasEntries = Object.entries(grouped[semesterAktif] || {}).sort(([a], [b]) => sortKelas(a, b));

      kelasEntries.forEach(([kelas, jadwalList]) => {
        if (!jadwalList.length) return;

        const title = `SEMESTER ${toRomawi(semesterAktif)} - KELAS ${kelas}`;

        // Group by Hari inside
        const hariGroup = {};
        jadwalList.forEach((j) => {
          if (!hariGroup[j.hari]) hariGroup[j.hari] = [];
          hariGroup[j.hari].push(j);
        });

        const tableBody = [];
        hariUrut.forEach((hari) => {
          const items = hariGroup[hari] || [];
          items.forEach((item, i) => {
            tableBody.push([
              i === 0 ? hari : "",
              `${item.jamMulai} - ${item.jamSelesai}`,
              item.matkul?.nama || "-",
              item.dosen?.nama || "-",
              item.ruang?.nama || "-",
            ]);
          });
        });

        // Add autoTable
        autoTable(doc, {
          startY: finalY + 5,
          head: [
            [{ content: title, colSpan: 5, styles: { halign: 'center', fillColor: [217, 217, 217], textColor: [0, 0, 0] } }],
            ["Hari", "Jam", "Mata Kuliah", "Dosen", "Ruangan"]
          ],
          body: tableBody,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 2,
            valign: "middle",
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [217, 217, 217],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 35, halign: 'center' },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 60 },
            4: { cellWidth: 40 },
          },
        });

        finalY = doc.lastAutoTable.finalY + 2;
      });
    });
  });

  doc.save(`Jadwal_Kuliah_${periode}.pdf`);
};