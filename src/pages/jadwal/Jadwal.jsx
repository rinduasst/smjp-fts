import { useEffect, useState } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Download,Loader2 } from "lucide-react";

const Jadwal = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(200);
  const [total, setTotal] = useState(0);
  const [selectedProdi, setSelectedProdi] = useState("");
  const [prodiList, setProdiList] = useState([]);

  const totalPages = Math.ceil(total / pageSize);
  const [batchInfo, setBatchInfo] = useState(null);
  //loading
  const [hasFetched, setHasFetched] = useState(false);

  // Ambil batch FINAL
  const fetchFinalBatch = async () => {
    try {
      const res = await api.get("/api/scheduler/batch");
  
      const finalBatch = res.data?.data?.items.find(
        (b) => b.status === "FINAL"
      );
  
      if (finalBatch) {
        setActiveBatchId(finalBatch.id);
        setBatchInfo(finalBatch); 
      } else {
        console.warn("Tidak ada batch FINAL");
      }
    } catch (err) {
      console.error("Gagal mengambil batch", err);
    }
  };
  // Ambil Jadwal berdasarkan batch FINAL
  const fetchJadwal = async () => {
    if (!activeBatchId) return;
  
    setLoading(true);
    setHasFetched(false);
  
    try {
      const res = await api.get("/api/scheduler/jadwal", {
        params: {
          batchId: activeBatchId,
          page,
          pageSize,
          prodiId: selectedProdi || undefined,
        },
      });
  
      setData(res.data?.data?.items || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err) {
      console.error("Gagal mengambil jadwal", err);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  };

  useEffect(() => {
    fetchFinalBatch();
    fetchProdi();
  }, []);

  useEffect(() => {
    if (activeBatchId) {
      fetchJadwal();
    }
  }, [activeBatchId, page, selectedProdi]);
  const fetchProdi = async () => {
    try {
      const res = await api.get("/api/master-data/prodi");
      setProdiList(res.data?.data?.items || []);
    } catch (err) {
      console.error("Gagal mengambil prodi", err);
    }
  };
  const fakultas = batchInfo?.fakultas?.nama || "";
  const periode = batchInfo?.periode?.nama || "";
  const handleExportExcel = () => {
    if (!data || data.length === 0) return;
  
    const wb = XLSX.utils.book_new();
  
    const titleRows = [
      ["JADWAL PERKULIAHAN"],
      [`Fakultas ${fakultas}`],
      [periode],
      [],
    ];

    const tableHeader = [
      "Hari",
      "Pukul",
      "Mata Kuliah",
      "SKS",
      "Prodi",
      "Dosen",
      "Kelas",
      "Ruangan",
    ];
  
    const rows = [];
    const merges = [];
  
    let rowIndex = titleRows.length + 1; // offset karena ada judul
  
    Object.entries(groupedByHari).forEach(([hari, items]) => {
      items.forEach((jadwal, index) => {
        rows.push([
          index === 0 ? hari : "",
          `${jadwal.slotWaktu?.jamMulai?.trim()} - ${jadwal.slotWaktu?.jamSelesai?.trim()}`,
          jadwal.penugasanMengajar?.programMatkul?.mataKuliah?.nama,
          jadwal.penugasanMengajar?.programMatkul?.mataKuliah?.sks,
          jadwal.penugasanMengajar?.programMatkul?.prodi?.nama,
          jadwal.penugasanMengajar?.dosen?.nama,
          jadwal.penugasanMengajar?.kelasList?.length > 0
          ? jadwal.penugasanMengajar.kelasList
          .map((k) => {
            const periode =
            jadwal.penugasanMengajar?.programMatkul?.periode;
          
          const semesterNumber = hitungSemester(
            k.kelompokKelas?.angkatan,
            periode?.tahunMulai,
            periode?.paruh
          );
          
            const semester = toRomawi(semesterNumber);
            const jenis =
            k.kelompokKelas?.jenisKelas === "REGULER"
              ? "REG"
              : "KAR";
            const kode = k.kelompokKelas?.kode || "";
          
            return `${semester}_${jenis}_${kode}`;
          })
          .join(", ")
      : "-",
          jadwal.ruang?.nama || "-",
        ]);
      });
  
      if (items.length > 1) {
        merges.push({
          s: { r: rowIndex, c: 0 },
          e: { r: rowIndex + items.length - 1, c: 0 },
        });
      }
      rowIndex += items.length;
    });
    const ws = XLSX.utils.aoa_to_sheet([
      ...titleRows,
      tableHeader,
      ...rows,
    ]);
  
    // ====== MERGE JUDUL ======
    merges.push(
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }
    );
    ws["!merges"] = merges;
  
    // ====== AUTO WIDTH KOLOM ======
    const colWidths = tableHeader.map((_, colIndex) => {
      const maxLength = Math.max(
        tableHeader[colIndex].length,
        ...rows.map(row => (row[colIndex] ? row[colIndex].toString().length : 0))
      );
      return { wch: maxLength + 4 };
    });
    ws["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, "Jadwal");
    XLSX.writeFile(
      wb,
      `Jadwal_${periode.replace(/\s/g, "_")}.xlsx`
    );
  };
  const toRomawi = (num) => {
    const map = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
    return map[num] || num;
  };
  
  const hitungSemester = (angkatan, tahunMulai, paruh) => {
    if (!angkatan || !tahunMulai) return 0;
    return (tahunMulai - angkatan) * 2 + (paruh === "GENAP" ? 2 : 1);
  };

  //grouping by hari
  const groupedByHari = data.reduce((acc, item) => {
    const hari = item.hari?.nama || "-";
  
    if (!acc[hari]) {
      acc[hari] = [];
    }
  
    acc[hari].push(item);
    return acc;
  }, {});
  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Jadwal Perkuliahan
          </h1>
          <p className="text-sm text-gray-600">
          Daftar jadwal perkuliahan yang telah disusun untuk periode aktif.
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 bg-gradient-to-r
           from-green-500 to-green-600 text-white px-5 py-2.5
            rounded-lg shadow-sm hover:from-green-600
             hover:to-green-700 transition-all duration-200 font-medium"
          >
         <Download size={18} />
          Export Excel
        </button>
        <div className="flex flex-col lg:flex-row gap-3">
          <select 
          value={selectedProdi}
          onChange={(e) => {
            setPage(1);
            setSelectedProdi(e.target.value);
          }}
          className="w-full px-3 py-2.5 border border-gray-300
          rounded-lg bg-white text-gray-900 focus:outline-none
          focus:ring-2 focus:ring-green-500
          focus:border-green-500 transition"
        >
          <option value="">Semua Prodi</option>

          {prodiList.map((prodi) => (
            <option key={prodi.id} value={prodi.id}>
              {prodi.nama}
            </option>
          ))}
        </select>
         
        </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border border-gray-300">
          <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 border">Hari</th>
              <th className="px-4 py-3 border">Jam</th>
              <th className="px-4 py-3 border">Mata Kuliah</th>
              <th className="px-4 py-3 border text-center">SKS</th>
              <th className="px-4 py-3 border">Prodi</th>
              <th className="px-4 py-3 border">Dosen</th>
              <th className="px-4 py-3 border text-center">Kelas</th>
              <th className="px-4 py-3 border">Ruangan</th>
            </tr>
          </thead>

          <tbody>
          {loading ? (
            <tr>
              <td colSpan="8" className="h-40">
                <div className="flex items-center justify-center h-full gap-2 text-gray-600">
                  <Loader2 className="animate-spin w-6 h-6" />
                  <span>Memuat jadwal...</span>
                </div>
              </td>
            </tr>
          ) : hasFetched && data.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-6 text-gray-500">
                Tidak ada jadwal
              </td>
            </tr>
          ) : (
            Object.entries(groupedByHari).map(([hari, items]) =>
              items.map((jadwal, index) => (
                <tr key={jadwal.id} className="hover:bg-gray-50">
                  {index === 0 && (
                    <td
                      rowSpan={items.length}
                      className="px-4 py-3 border align-top"
                    >
                      {hari}
                    </td>
                  )}

                  <td className="px-4 py-3 border whitespace-nowrap">
                    {jadwal.slotWaktu?.jamMulai?.trim()} -{" "}
                    {jadwal.slotWaktu?.jamSelesai?.trim()}
                  </td>

                  <td className="px-4 py-3 border font-medium">
                    {jadwal.penugasanMengajar?.programMatkul?.mataKuliah?.nama}
                  </td>

                  <td className="px-4 py-3 border text-center">
                    {jadwal.penugasanMengajar?.programMatkul?.mataKuliah?.sks}
                  </td>

                  <td className="px-4 py-3 border">
                    {jadwal.penugasanMengajar?.programMatkul?.prodi?.nama}
                  </td>

                  <td className="px-4 py-3 border">
                    {jadwal.penugasanMengajar?.dosen?.nama}
                  </td>

                  <td className="px-4 py-3 border">
                    {jadwal.penugasanMengajar?.kelasList?.length > 0
                      ? jadwal.penugasanMengajar.kelasList
                          .map((k) => {
                            const periode =
                              jadwal.penugasanMengajar?.programMatkul?.periode;

                            const semesterAngka = hitungSemester(
                              k.kelompokKelas?.angkatan,
                              periode?.tahunMulai,
                              periode?.paruh
                            );

                            const romawi = toRomawi(semesterAngka);

                            const jenis =
                              k.kelompokKelas?.jenisKelas === "REGULER"
                                ? "REG"
                                : "KAR";

                            const kode = k.kelompokKelas?.kode;

                            return `${romawi}_${jenis}_${kode}`;
                          })
                          .join(", ")
                      : "-"}
                  </td>

                  <td className="px-4 py-3 border whitespace-nowrap">
                    {jadwal.ruang?.nama || "-"}
                  </td>
                </tr>
              ))
            )
          )}
        </tbody>
        </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-gray-50 flex justify-between items-center text-sm">
          <div>
            Halaman {page} dari {totalPages} | Total {total} data
          </div>

            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Jadwal;