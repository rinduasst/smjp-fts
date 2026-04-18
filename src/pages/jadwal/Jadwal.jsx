import { useEffect, useState } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { Download,Loader2 } from "lucide-react";
import { exportAllProdi } from "../../utils/exportExcel/jadwal/exportAllProdi.js";

const Jadwal = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchInfo, setBatchInfo] = useState(null);
  const [prodiList, setProdiList] = useState([]);
  const [selectedProdi, setSelectedProdi] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(200);
  const [total, setTotal] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);

  const totalPages = Math.ceil(total / pageSize);

  // Ambil batch FINAL
  const fetchFinalBatch = async () => {
    try {
      const res = await api.get("/api/scheduler/batch", {
        params: { status: "FINAL", page: 1, pageSize: 100 },
      });
      const finalBatch = res.data?.data?.items.find(b => b.status === "FINAL");
      if (finalBatch) setBatchInfo(finalBatch);
    } catch (err) {
      console.error("Gagal mengambil batch", err);
    }
  };

  // Ambil daftar prodi
  const fetchProdi = async () => {
    try {
      const res = await api.get("/api/master-data/prodi");
      setProdiList(res.data?.data?.items || []);
    } catch (err) {
      console.error("Gagal mengambil prodi", err);
    }
  };

  // Ambil semua jadwal (showConflictsOnly = false)
  const fetchJadwal = async () => {
    if (!batchInfo) return;
    setLoading(true);
    setHasFetched(false);
  
    try {
      const params = {
        periodeAkademikId: batchInfo.periodeId,
        statusBatch: "FINAL",
        page,
        pageSize,
        sortBy: "hari",
        sortOrder: "asc",
      };
  
      // Tambahkan prodiId hanya kalau ada
      if (selectedProdi) params.prodiId = selectedProdi;
      const res = await api.get("/api/view-jadwal/all", { params });
      setData(res.data?.data?.items || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err) {
      console.error("Gagal mengambil jadwal", err);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  };

  // useEffect init batch & prodi
  useEffect(() => {
    const init = async () => {
      await fetchFinalBatch();
      await fetchProdi();
    };
    init();
  }, []);

  // useEffect fetch jadwal saat batch, prodi, atau page berubah
  useEffect(() => {
    fetchJadwal();
  }, [batchInfo, selectedProdi, page]);

  // Grouping berdasarkan hari
  const groupedByHari = data.reduce((acc, item) => {
    const hari = item.hari || "-";
    if (!acc[hari]) acc[hari] = [];
    acc[hari].push(item);
    return acc;
  }, {});

  const toRomawi = (num) => {
    if (!num || num <= 0) return "";
    const map = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
    return map[num] || num;
  };

  const formatKelas = (jadwal) => {
    const romawi = toRomawi(jadwal.semester);
    if (!romawi) return jadwal.kelas;
    const kelasList = jadwal.kelas.split(",").map(k => k.trim());
    return kelasList
      .map(k => {
        if (k.toLowerCase() === "karyawan") {
          return `${romawi}_KARYAWAN`; 
          // atau `${romawi}_KRY`
        }
        return `${romawi}_REG_${k}`;
      })
      .join(", ");
  };
  const handleExportExcel = async () => {
    if (!batchInfo) return;
  
    try {
      const res = await api.get("/api/view-jadwal/all", {
        params: {
          periodeAkademikId: batchInfo.periodeId,
          statusBatch: "FINAL",
          page: 1,
          pageSize: 200, // ambil semua
          sortBy: "hari",
          sortOrder: "asc",
        },
      });
      const items = res.data?.data?.items || [];
      await exportAllProdi(items, batchInfo);
    } catch (err) {
      console.error("Gagal export", err);
    }
  };
  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Jadwal Perkuliahan
          </h1>
          <p className="text-sm text-gray-600">
          Daftar jadwal perkuliahan program studi yang telah disusun untuk periode aktif.
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-end gap-4">
        <div className="flex flex-col lg:flex-row gap-3">
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
          className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
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
        </div>

        <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-300">
              <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
                <tr>
                <th className="px-3 py-2 border">Hari</th>
                <th className="px-3 py-2 border text-center">Jam</th>
                <th className="px-3 py-2 border">Mata Kuliah</th>
                <th className="px-3 py-2 border">SKS</th>
                <th className="px-3 py-2 border text-center">Kelas</th>
                <th className="px-3 py-2 border">Program Studi</th>
                <th className="px-3 py-2 border">Dosen</th>
                <th className="px-3 py-2 border">Ruangan</th>
              </tr>
            </thead>
            <tbody>
            {loading ? (
                <tr>
                  <td colSpan="8" className="p-8">
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="text-sm">Memuat data jadwal...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-500">
                    Tidak ada jadwal
                  </td>
                </tr>
              ) : (
                Object.entries(groupedByHari).map(([hari, items]) =>
                  items.map((jadwal, index) => (
                    <tr key={jadwal.id} className="hover:bg-gray-50">
                      
                      {index === 0 && (
                        <td rowSpan={items.length} className="px-3 py-2 border font-medium">
                          {hari}
                        </td>
                      )}

                      <td className="px-1 py-2 border whitespace-nowrap">
                        {jadwal.jamMulai} - {jadwal.jamSelesai}
                      </td>
                      <td className="px-3 py-2 border">
                        {jadwal.mataKuliah}
                      </td>
                      <td className="px-3 py-2 border text-center">
                        {jadwal.sks}
                      </td>
                      <td className="px-3 py-2 border text-center">
                      {formatKelas(jadwal)}
                    </td>
                      <td className="px-3 py-2 border">
                        {jadwal.prodi}
                      </td>

                      <td className="px-3 py-2 border">
                        {jadwal.dosen}
                      </td>

                      <td className="px-3 py-2 border">
                        {jadwal.ruangan}
                      </td>

                    </tr>
                  ))
                )
              )}
            </tbody>

          </table>
        </div>
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
    
    </MainLayout>
  );
};

export default Jadwal;