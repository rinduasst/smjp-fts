import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const hitungSemester = (angkatan, tahunMulai, paruh) => {
  if (!angkatan || !tahunMulai) return 0;
  return (tahunMulai - angkatan) * 2 + (paruh === "GENAP" ? 2 : 1);
};

const toRomawi = (num) => {
  const map = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return map[num] || num;
};

const sortKelas = (a, b) => {
  if (a === "KARYAWAN") return 1;
  if (b === "KARYAWAN") return -1;
  return a.localeCompare(b);
};

// data = flat array dari API /view-jadwal/all
// Setiap item: { prodi, hari, mataKuliah, dosen, ruangan, kelas, angkatan, semester, jamMulai, jamSelesai, sksEfektif }
export const exportPdfAllProdi = async (data, batchInfo) => {
  const doc = new jsPDF("landscape");

  const fakultas = batchInfo?.fakultas?.nama || "";
  const periode  = batchInfo?.periode?.nama || "";

  const logoResponse = await fetch("/logofts.png");
  const logoBlob     = await logoResponse.blob();
  const logofts      = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(logoBlob);
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const hariUrut  = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  /* ================= LOOP PER PRODI → SATU HALAMAN ================= */
  let isFirstPage = true;

  Object.entries(data).forEach(([namaProdi, hariData]) => {
    if (!hariData || hariData.length === 0) return;

    if (!isFirstPage) doc.addPage();
    isFirstPage = false;

    /* HEADER */
    doc.addImage(logofts, "PNG", 16, 8, 28, 28);
    doc.setFont("times", "bold");

    doc.setFontSize(16);
    doc.text("JADWAL PERKULIAHAN", pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(12);
    doc.text(`PROGRAM STUDI ${namaProdi.toUpperCase()}`, pageWidth / 2, 23, { align: "center" });
    doc.text(fakultas.toUpperCase(),                      pageWidth / 2, 31, { align: "center" });
    doc.text(`PERIODE ${periode.toUpperCase()}`,           pageWidth / 2, 38, { align: "center" });

    /* ================= GROUPING ================= */
    const grouped = {}; // { semester: { kelasKey: [ item, ... ] } }

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

    const semesterList = Object.keys(grouped).map(Number).sort((a, b) => a - b);

    let finalY = 44;

    /* ================= LOOP SEMESTER → KELAS ================= */
    semesterList.forEach((semesterAktif) => {
      const kelasEntries = Object.entries(grouped[semesterAktif] || {})
        .sort(([a], [b]) => sortKelas(a, b));

      kelasEntries.forEach(([kelas, jadwalList]) => {
        if (!jadwalList.length) return;

        /* GROUP HARI */
        const hariGroup = {};
        jadwalList.forEach((j) => {
          if (!hariGroup[j.hari]) hariGroup[j.hari] = [];
          hariGroup[j.hari].push(j);
        });

        /* BUILD BODY dengan rowSpan pada kolom Hari */
        const body = [];
        hariUrut.forEach((hari) => {
          const itms = hariGroup[hari] || [];
          if (!itms.length) return;

          itms.forEach((item, i) => {
            const rowData = [];
            if (i === 0) {
              rowData.push({
                content: hari,
                rowSpan: itms.length,
                styles: { halign: "center", valign: "middle", fontStyle: "bold" },
              });
            }
            rowData.push(
              { content: `${item.jamMulai} - ${item.jamSelesai}`, styles: { halign: "center" } },
              { content: item.matkul?.nama || "-" },
              { content: item.dosen?.nama || "-" },
              { content: item.ruang?.nama || "-" }
            );
            body.push(rowData);
          });
        });

        /* AUTOTABLE PER KELAS */
        autoTable(doc, {
          startY: finalY + 4,

          head: [
            [{
              content: `SEMESTER ${toRomawi(semesterAktif)} - KELAS ${kelas}`,
              colSpan: 5,
              styles: { halign: "center", fontStyle: "bold", fillColor: [217, 217, 217], textColor: [0, 0, 0] },
            }],
            [
              { content: "Hari",        styles: { halign: "center" } },
              { content: "Jam",         styles: { halign: "center" } },
              { content: "Mata Kuliah" },
              { content: "Dosen" },
              { content: "Ruangan" },
            ],
          ],

          body,
          theme: "grid",

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
            fontStyle: "bold",
          },

          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 35 },
            2: { cellWidth: "auto" },
            3: { cellWidth: 60 },
            4: { cellWidth: 35 },
          },

          didParseCell: (d) => {
            if (d.section === "head" && d.row.index === 0) {
              d.cell.styles.fillColor = [217, 217, 217];
              d.cell.styles.textColor = [0, 0, 0];
            }
          },
        });

        finalY = doc.lastAutoTable.finalY + 4;

        // Halaman baru dalam prodi yang sama jika sudah mepet
        if (finalY > 170) {
          doc.addPage();

          doc.addImage(logofts, "PNG", 16, 8, 28, 28);
          doc.setFont("times", "bold");
          
          doc.setFontSize(16);
          doc.text("JADWAL PERKULIAHAN", pageWidth / 2, 15, {
            align: "center",
          });
          
          doc.setFontSize(12);
          doc.text(
            `PROGRAM STUDI ${namaProdi.toUpperCase()} `,
            pageWidth / 2,
            23,
            { align: "center" }
          );
          
          doc.text(
            fakultas.toUpperCase(),
            pageWidth / 2,
            31,
            { align: "center" }
          );
          
          doc.text(
            `PERIODE ${periode.toUpperCase()}`,
            pageWidth / 2,
            38,
            { align: "center" }
          );
          
          finalY = 44;
        }
      });
    });
  });

  doc.save(`Jadwal_Kuliah_${periode}.pdf`);
};