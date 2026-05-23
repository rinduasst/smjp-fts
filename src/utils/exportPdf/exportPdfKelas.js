import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportPdfKelas = async (
  groupedData,
  batchInfo,
  user,
  filterKelas,
  semesterAktif
) => {
  const doc = new jsPDF("portrait", "mm", "a4");

  const fakultas = batchInfo?.fakultas?.nama || "";
  const periode = batchInfo?.periode?.nama || "";

  const firstKelas = Object.values(groupedData)[0] || [];
  const firstItem = firstKelas[0];

  const prodiNama =
    firstItem?.prodi?.nama ||
    batchInfo?.prodi?.nama ||
    "-";

  const hariUrut = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  /* ================= LOGO ================= */
  const logoResponse = await fetch("/logofts.png");
  const logoBlob = await logoResponse.blob();

  const logofts = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve(reader.result);
    reader.readAsDataURL(logoBlob);
  });

  doc.addImage(
    logofts,
    "PNG",
    16,
    8,
    28,
    28
  );

  /* ================= HEADER ================= */
  const pageWidth =
    doc.internal.pageSize.getWidth();

  doc.setFont("times", "bold");

  doc.setFontSize(16);
  doc.text(
    "JADWAL PERKULIAHAN",
    pageWidth / 2,
    15,
    { align: "center" }
  );

  doc.setFontSize(12);
  doc.text(
    `PROGRAM STUDI ${prodiNama.toUpperCase()}`,
    pageWidth / 2,
    23,
    { align: "center" }
  );

  doc.text(
    fakultas.toUpperCase(),
    pageWidth / 2,
    30,
    { align: "center" }
  );

  doc.text(
    `PERIODE ${periode.toUpperCase()}`,
    pageWidth / 2,
    37,
    { align: "center" }
  );

  doc.text(
    `SEMESTER ${semesterAktif}`,
    pageWidth / 2,
    44,
    { align: "center" }
  );

  let startY = 52;

  /* ================= FILTER KELAS ================= */
  const kelasList =
    filterKelas === "ALL"
      ? Object.keys(groupedData)
      : [filterKelas];

  kelasList.forEach((kelas, index) => {
    const jadwalList =
      groupedData[kelas] || [];

    if (!jadwalList.length) return;
    /* ================= GROUP HARI ================= */
    const body = [];
    const hariGroup = {};

    jadwalList.forEach((j) => {
      if (!hariGroup[j.hari]) {
        hariGroup[j.hari] = [];
      }

      hariGroup[j.hari].push(j);
    });

    hariUrut.forEach((hari) => {
      const items = hariGroup[hari] || [];
      if (!items.length) return;
    
      items.forEach((item, i) => {
        const rowData = [];
        
        if (i === 0) {
          rowData.push({
            content: hari,
            rowSpan: items.length,
            styles: {
              halign: "center",
              valign: "middle",
              fontStyle: "bold",
            },
          });
        }
        
        rowData.push(
          {
            content: `${item.jamMulai} - ${item.jamSelesai}`,
          },
          {
            content: item.matkul?.nama || "-",
          },
          {
            content: item.dosen?.nama || "-",
          },
          {
            content: item.ruang?.nama || "-",
          }
        );
        body.push(rowData);
      });
    });
    autoTable(doc, {
      startY: startY,
    
      head: [
        [
          {
            content: `KELAS ${kelas}`,
            colSpan: 5,
            styles: {
              halign: "center",
              fontStyle: "bold",
              fillColor: [217, 217, 217], // abu
              textColor: 0,
            },
          },
        ],
        [
          "HARI",
          "JAM",
          "MATA KULIAH",
          "DOSEN",
          "RUANGAN",
        ],
      ],
    
      body,
    
      theme: "grid",
    
      styles: {
        fontSize: 9,
        cellPadding: 2,
        valign: "middle",
      },
      headStyles: {
        fillColor: [217, 217, 217],
        textColor: 0, // hitam
        halign: "center",
        fontStyle: "bold",
     
      
      },
    
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 32 },
        2: { cellWidth: 55 },
        3: { cellWidth: 45 },
        4: { cellWidth: 28 },
      },
    
      didParseCell: function (data) {
        // bikin baris pertama (KELAS A) jadi abu, bukan hijau
        if (data.section === "head" && data.row.index === 0) {
          data.cell.styles.fillColor = [217, 217, 217];
          data.cell.styles.textColor = 0;
        }
      },
    });

    startY =
      doc.lastAutoTable.finalY +
      10;

    /* ================= NEW PAGE ================= */
    if (
      startY > 240 &&
      index !==
        kelasList.length - 1
    ) {
      doc.addPage();
      startY = 20;
    }
  });

  /* ================= SAVE ================= */
  doc.save(
    `Jadwal_SMT_${semesterAktif}_${filterKelas}.pdf`
  );
};