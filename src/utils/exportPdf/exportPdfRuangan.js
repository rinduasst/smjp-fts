import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportPdfRuangan = async (
  jadwalList,
  batch,
  slotMaster
) => {

  const doc = new jsPDF("landscape", "mm", "a3");
  const logoResponse = await fetch("/logofts.png");
const logoBlob = await logoResponse.blob();

const logofts = await new Promise((resolve) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.readAsDataURL(logoBlob);
});

  const hariUrut = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  const fakultas = batch?.fakultas?.nama || "-";

  const tahunMulai = batch?.periode?.tahunMulai;
  const tahunSelesai = batch?.periode?.tahunSelesai;
  const paruh = batch?.periode?.paruh || "-";

  const tahunAjaran =
    tahunMulai && tahunSelesai
      ? `${tahunMulai}/${tahunSelesai}`
      : "-";

  const formatJam = (value) => {
    if (!value) return "-";
    return value.slice(0, 5);
  };

  const toRomawi = (num) =>
    ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][num] || num;

  const formatKelas = (jadwal) => {
    if (!jadwal.kelas) return "-";

    let romawi = "";

    if (jadwal.semester) {
      romawi =
        typeof jadwal.semester === "number"
          ? toRomawi(jadwal.semester)
          : jadwal.semester;
    }

    return jadwal.kelas
      .split(",")
      .map((k) => k.trim())
      .map((k) => (romawi ? `${romawi}_${k}` : k))
      .join(", ");
  };

  for (let i = 0; i < hariUrut.length; i++) {

    const hari = hariUrut[i];

    const jadwalHari = jadwalList.filter(
      (j) => j.hari === hari
    );

    if (!jadwalHari.length) continue;

    if (i !== 0) doc.addPage();

// ================= LOGO =================
doc.addImage(logofts, "PNG", 16, 8,28, 28);

// ================= HEADER =================
doc.setFont("times", "bold");

const pageWidth = doc.internal.pageSize.getWidth();

// Judul utama
doc.setFontSize(18);
doc.text(
  "JADWAL PENGGUNAAN RUANGAN",
  pageWidth / 2,
  14,
  { align: "center" }
);

// Hari
doc.setFontSize(14);
doc.text(
  `SEMESTER ${paruh} TA ${tahunAjaran}`,
  pageWidth / 2,
  22,
  { align: "center" }
);
// Fakultas
doc.setFontSize(12);
doc.text(
  fakultas.toUpperCase(),
  pageWidth / 2,
  29,
  { align: "center" }
);

// Semester + TA
doc.text(
  `${hari.toUpperCase()}`,
  pageWidth / 2,
  35,
  { align: "center" }
);
    /* ================= RUANG LIST ================= */

    const ruangList = Array.from(
      new Set(jadwalHari.map((j) => j.ruangan))
    ).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );

    /* ================= SLOT ================= */

    const slotList = slotMaster.map((s) => ({
      jamMulai: s.jamMulai,
      jamSelesai: s.jamSelesai,
    }));

    /* ================= MATRIX ================= */

    const body = [];

    const skipCell = {};
    
    slotList.forEach((slot, rowIndex) => {
    
      const row = [];
    
      // kolom jam
      row.push({
        content: `${formatJam(slot.jamMulai)} - ${formatJam(slot.jamSelesai)}`,
        styles: {
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
        },
      });
    
      ruangList.forEach((ruang) => {
    
        const skipKey =
          `${slot.jamMulai}-${slot.jamSelesai}-${ruang}`;
    
        if (skipCell[skipKey]) {
          return;
        }
    
        const jadwal = jadwalHari.find(
          (j) =>
            j.ruangan === ruang &&
            j.jamMulai.slice(0,5) === slot.jamMulai.slice(0,5)
        );
    
        // kosong
        if (!jadwal) {
          row.push({
            content: "",
          });
    
          return;
        }
    
        // cari rowspan
        const startIndex = slotList.findIndex(
          (s) =>
            s.jamMulai.slice(0,5) ===
            jadwal.jamMulai.slice(0,5)
        );
    
        let rowspan = jadwal.sksEfektif || 1;
    
        if (startIndex + rowspan > slotList.length) {
          rowspan = slotList.length - startIndex;
        }
    
        // tandai skip
        for (let i = 1; i < rowspan; i++) {
    
          const nextSlot = slotList[startIndex + i];
    
          if (nextSlot) {
    
            skipCell[
              `${nextSlot.jamMulai}-${nextSlot.jamSelesai}-${ruang}`
            ] = true;
          }
        }
    
        let fillColor = [243, 244, 246];
        let textColor = [0, 0, 0];
        
        const prodi = jadwal.prodi?.toLowerCase();
        
        if (prodi?.includes("teknik mesin")) {
          fillColor = [253, 224, 71]; // yellow-300
          textColor = [0, 0, 0];
        }
        
        else if (prodi?.includes("rekayasa pertanian")) {
          fillColor = [234, 179, 8]; // yellow-500
          textColor = [255, 255, 255];
        }
        
        else if (prodi?.includes("ilmu lingkungan")) {
          fillColor = [101, 163, 13]; // lime-600
          textColor = [255, 255, 255];
        }
        
        else if (prodi?.includes("teknik sipil")) {
          fillColor = [74, 222, 128]; // green-400
          textColor = [0, 0, 0];
        }
        
        else if (prodi?.includes("sistem informasi")) {
          fillColor = [96, 165, 250]; // blue-400
          textColor = [255, 255, 255];
        }
        
        else if (prodi?.includes("teknik informatika")) {
          fillColor = [168, 85, 247]; // purple-500
          textColor = [255, 255, 255];
        }
        
        else if (prodi?.includes("teknik elektro")) {
          fillColor = [239, 68, 68]; // red-500
          textColor = [255, 255, 255];
        }
    
        row.push({
          content:
            `${jadwal.mataKuliah}\n${formatKelas(jadwal)}`,
        
          rowSpan: rowspan,
        
          styles: {
            fillColor,
            textColor, 
            halign: "center",
            valign: "middle",
            fontSize: 7,
            cellPadding: 2,
            lineWidth: 0.2,
            lineColor: [180, 180, 180],
          },
        });
      });
    
      body.push(row);
    });

    /* ================= TABLE ================= */

    autoTable(doc, {
      startY: 32,

      head: [
        ["Pukul", ...ruangList]
      ],

      body,
      tableLineWidth: 0.3,
      tableLineColor: [120, 120, 120],
      styles: {
        fontSize: 7,
        cellPadding: 2,
        halign: "center",
        valign: "middle",
        overflow: "linebreak",
        lineWidth: 0.2,      
        lineColor: [180, 180, 180], // abu-abu
      },
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: 255,
        fontStyle: "bold",
      },

      bodyStyles: {
        minCellHeight: 18,
      },

      columnStyles: {
        0: {
          cellWidth: 28,
          fontStyle: "bold",
        },
      },

      didParseCell: function (data) {

        if (data.section !== "body") return;

        const text = data.cell.text?.join(" ") || "";

        const lower = text.toLowerCase();

        if (lower.includes("teknik mesin")) {
          data.cell.styles.fillColor = [253, 224, 71];
        }

        else if (lower.includes("teknik sipil")) {
          data.cell.styles.fillColor = [74, 222, 128];
        }

        else if (lower.includes("teknik informatika")) {
          data.cell.styles.fillColor = [168, 85, 247];
        }

        else if (lower.includes("sistem informasi")) {
          data.cell.styles.fillColor = [96, 165, 250];
        }

        else if (lower.includes("teknik elektro")) {
          data.cell.styles.fillColor = [239, 68, 68];
          data.cell.styles.textColor = 255;
        }
      },
    });
  }

  doc.save("Jadwal_Ruangan.pdf");
};