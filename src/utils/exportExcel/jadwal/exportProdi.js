import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

  export const exportProdi = async (data, batchInfo, prodi) => {

    const workbook = new ExcelJS.Workbook();
  
    const fakultas = batchInfo?.fakultas?.nama || "";
    const periode = batchInfo?.periode?.nama || "";
  const hariUrut = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

  const urutanKelas = ["A","B","C","D","E","F","KARYAWAN"];

  const borderAll = (cell) => {
    cell.border = {
      top:{style:"thin"},
      bottom:{style:"thin"},
      left:{style:"thin"},
      right:{style:"thin"}
    };
  };
  const logoResponse = await fetch("/logofts.png");
  const logoBuffer = await logoResponse.arrayBuffer();
  
  const logoId = workbook.addImage({
    buffer: logoBuffer,
    extension: "png"
  });
  const prodiNama =
  prodi ||
  data?.[0]?.slots?.[0]?.prodi?.nama ||
  batchInfo?.prodi?.nama ||
  "-";
  /* ================= GROUP SEMESTER ================= */

  const semesterGroup = {};

  data.forEach((hari)=>{

    hari.slots?.forEach((slot)=>{

        const kelasObj = slot.kelas;

        if (!kelasObj) return;
        
        // ambil kode dan split
        const kodeList = (kelasObj.kode || "A")
          .split(",")
          .map(k => k.trim().toUpperCase());
        
        const angkatan = kelasObj.angkatan;
        
        const semester =
          (batchInfo?.periode?.tahunMulai - angkatan) * 2 +
          (batchInfo?.periode?.paruh === "GENAP" ? 2 : 1);
        
        //  LOOP PER KELAS (INI KUNCI)
        kodeList.forEach((kelas) => {
        
          if (!semesterGroup[semester]) semesterGroup[semester] = {};
          if (!semesterGroup[semester][kelas]) semesterGroup[semester][kelas] = [];
        
          semesterGroup[semester][kelas].push({
            hari: hari.nama,
            jamMulai: slot.jamMulai,
            jamSelesai: slot.jamSelesai,
            matkul: slot.matkul?.nama,
            dosen: slot.dosen?.nama,
            ruang: slot.ruang?.nama
          });
        
        });

    });

  });

  /* ================= LOOP SEMESTER ================= */

  Object.keys(semesterGroup)
  .map(Number)
  .sort((a, b) => a - b)
  .forEach((semester) => {
    const kelasList = semesterGroup[semester];

    const sheet = workbook.addWorksheet(` SMT ${semester}`);
// LOGO

sheet.addImage(logoId, {
    tl: { col: 0, row: 0 },
    ext: { width: 120, height: 120 }
  });

  const periodeNama = batchInfo?.periode?.nama || "";
  
  // Baris 1
  sheet.mergeCells("B1:E1");
  sheet.getCell("B1").value = "JADWAL KULIAH";
  sheet.getCell("B1").font = {
    name: "Times New Roman",
    size: 20,
    bold: true
  };
  sheet.getCell("B1").alignment = {
    horizontal: "center",
    vertical: "middle"
  };
  
  // Baris 2
  sheet.mergeCells("B2:E2");
  sheet.getCell("B2").value = `PROGRAM STUDI ${prodiNama.toUpperCase()}`;
  sheet.getCell("B2").font = {
    name: "Times New Roman",
    size: 16,
    bold: true
  };
  sheet.getCell("B2").alignment = {
    horizontal: "center"
  };
  
  // Baris 3
  sheet.mergeCells("B3:E3");
  sheet.getCell("B3").value = `${fakultas.toUpperCase()}`;
  sheet.getCell("B3").font = {
    name: "Times New Roman",
    size: 16,
    bold: true
  };
  sheet.getCell("B3").alignment = {
    horizontal: "center"
  };
  
  // Baris 4
  sheet.mergeCells("B4:E4");
  sheet.getCell("B4").value = `PERIODE ${periodeNama.toUpperCase()}`;
  sheet.getCell("B4").font = {
    name: "Times New Roman",
    size: 14,
    bold: true
  };
  sheet.getCell("B4").alignment = {
    horizontal: "center"
  };
  
  // spacing
  let row = 6;

    /* ================= SORT KELAS ================= */
    const sortedKelas = Object.keys(kelasList).sort((a, b) => {
      const ambilKelas = (val) => {
        return val.trim().toUpperCase().split(/[\s_]+/).pop();
      };
    
      const kelasA = ambilKelas(a);
      const kelasB = ambilKelas(b);
    
      const ia = urutanKelas.indexOf(kelasA);
      const ib = urutanKelas.indexOf(kelasB);
    
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    /* ================= LOOP KELAS ================= */

    sortedKelas.forEach((kelas)=>{

      const jadwalList = kelasList[kelas];
      jadwalList.sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));

      sheet.mergeCells(`A${row}:E${row}`);

      const titleCell = sheet.getCell(`A${row}`);
      titleCell.value = `SEMESTER ${semester} - KELAS ${kelas}`;
      titleCell.font  = {bold: true }
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "D3D3D3" }
      };
      titleCell.alignment = { horizontal: "center" };
      titleCell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      };
    
      row++;
  

      /* HEADER TABLE */

      const headerRow = sheet.addRow([
        "Hari",
        "Jam",
        "Mata Kuliah",
        "Dosen",
        "Ruangan"
      ]);

      headerRow.eachCell((cell)=>{
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "D3D3D3" }
        };
        cell.alignment = { horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        };
      });

      /* GROUP HARI */

      const hariGroup = {};

      jadwalList.forEach((j)=>{
        if(!hariGroup[j.hari]) hariGroup[j.hari] = [];
        hariGroup[j.hari].push(j);
      });

      hariUrut.forEach((hari)=>{

        const items = hariGroup[hari] || [];
        if(items.length === 0) return;

        const startRow = sheet.lastRow.number + 1;

        items.forEach((item,i)=>{

          const r = sheet.addRow([
            i === 0 ? hari : "",
            `${item.jamMulai} - ${item.jamSelesai}`,
            item.matkul,
            item.dosen,
            item.ruang
          ]);

          r.eachCell((cell)=>{
            cell.font = {  };
            borderAll(cell);
          });

        });

        const endRow = sheet.lastRow.number;

        if(endRow > startRow){
          sheet.mergeCells(`A${startRow}:A${endRow}`);
        }

      });

      row = sheet.lastRow.number + 2;

    });

    sheet.columns = [
        { width:15 },
        { width:20 },
        { width:40 },
        { width:30 },
        { width:20 }
      ];

  });

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    `Jadwal_Prodi_${prodiNama}_${periode}.xlsx`
  );

};