import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

  export const exportPerSemester = async (data, batchInfo, prodi) => {

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

  /* ================= LOAD LOGO ================= */

  const logoResponse = await fetch("/logofts.png");
  const logoBuffer = await logoResponse.arrayBuffer();

  const logoId = workbook.addImage({
    buffer: logoBuffer,
    extension: "png"
  });

  /* ================= GROUP SEMESTER ================= */

  const semesterGroup = {};

  data.forEach((hari)=>{

    hari.slots?.forEach((slot)=>{

      slot.kelas?.forEach((k)=>{

        const angkatan = k.angkatan;

        const semester =
          (batchInfo?.periode?.tahunMulai - angkatan) * 2 +
          (batchInfo?.periode?.paruh === "GENAP" ? 2 : 1);

        const kelas = (k.kode || "A").toUpperCase();

        if(!semesterGroup[semester]) semesterGroup[semester] = {};
        if(!semesterGroup[semester][kelas]) semesterGroup[semester][kelas] = [];

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

  Object.entries(semesterGroup).forEach(([semester, kelasList])=>{

    const sheet = workbook.addWorksheet(` SMT ${semester}`);

    /* LOGO */

    sheet.addImage(logoId,{
      tl:{ col:0, row:0 },
      ext:{ width:120, height:120 }
    });

    let row = 1;

    /* HEADER */

    sheet.mergeCells(`A${row}:E${row}`);
    const title = sheet.getCell(`A${row}`);
    title.value = `JADWAL KULIAH ${periode}`;
    title.alignment = { horizontal:"center" };
    title.font = {
      name:"Times New Roman",
      bold:true,
      size:16
    };
    

    row++;

    sheet.mergeCells(`A${row}:E${row}`);
    const fakultasCell = sheet.getCell(`A${row}`);
    fakultasCell.value = `FAKULTAS ${fakultas}`;
    fakultasCell.alignment = { horizontal:"center" };
    fakultasCell.font = {
      name:"Times New Roman",
      bold:true,
      size:14
    };
    
    row++;

    const prodiNama =
    prodi ||
    batchInfo?.prodi?.nama ||
    (typeof window !== "undefined"
      ? localStorage.getItem("prodiNama")
      : null) ||
    "-";
    sheet.mergeCells(`A${row}:E${row}`);
    const prodiCell = sheet.getCell(`A${row}`);
    prodiCell.value = `PROGRAM STUDI ${prodiNama}`;
    prodiCell.alignment = { horizontal: "center" };
    prodiCell.font = {
      name: "Times New Roman",
      bold: true,
      size: 14
    };
    
    row++;
    row += 2;

    /* ================= SORT KELAS ================= */

    const sortedKelas = Object.keys(kelasList).sort((a,b)=>{
      const ia = urutanKelas.indexOf(a);
      const ib = urutanKelas.indexOf(b);
      return ia - ib;
    });

    /* ================= LOOP KELAS ================= */

    sortedKelas.forEach((kelas)=>{

      const jadwalList = kelasList[kelas];

      sheet.mergeCells(`A${row}:E${row}`);

      const titleCell = sheet.getCell(`A${row}`);
      titleCell.value = `SEMESTER ${semester} - KELAS ${kelas}`;
      titleCell.font = {
        name:"Times New Roman",
        bold:true,
        size:12
      };
      titleCell.alignment = { horizontal:"center" };

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
        cell.font = {
          name:"Times New Roman",
          bold:true
        };
        cell.alignment = { horizontal:"center" };
        borderAll(cell);
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
            cell.font = { name:"Times New Roman" };
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
      { width:35 },
      { width:30 },
      { width:18 }
    ];

  });

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    `Jadwal_Kelas_${periode}.xlsx`
  );

};