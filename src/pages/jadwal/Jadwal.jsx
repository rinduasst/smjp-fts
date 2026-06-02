import { useEffect, useState } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { Download,Loader2 } from "lucide-react";
import { exportAllProdi } from "../../utils/exportExcel/jadwal/exportAllProdi.js";
import { exportPdfAllProdi } from "../../utils/exportPdf/exportPdfAllProdi.js";

const Jadwal = () => {
  const [data, setData] = useState([]);
  const [batchInfo, setBatchInfo] = useState(null);
  const [prodiList, setProdiList] = useState([]);

  const [selectedProdi, setSelectedProdi] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(200);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);

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
  // Ambil semua jadwal (showConflictsOnly = false)
  const fetchJadwal = async () => {
    if (!batchInfo) return;
    setLoading(true);
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
    }
  };
  const fetchProdi = async () => {
    try {
      const res = await api.get("/api/master-data/prodi");
      setProdiList(res.data?.data?.items || []);
    } catch (err) {
      console.error("Gagal mengambil prodi", err);
    }
  };
  const handleExportExcel = async () => {
    if (!batchInfo) return;
  
    try {
      const prodiDataMap = {};
      const prodisToFetch = selectedProdi 
        ? prodiList.filter(p => p.id === selectedProdi)
        : prodiList;

      for (const prodi of prodisToFetch) {
        const res = await api.get("/api/view-jadwal/prodi", {
          params: {
            periodeAkademikId: batchInfo.periodeId,
            prodiId: prodi.id,
            statusBatch: "FINAL",
          },
        });
        const hariData = res.data?.data?.hari || [];
        if (hariData.length > 0) {
          prodiDataMap[prodi.nama] = hariData;
        }
      }

      await exportAllProdi(prodiDataMap, batchInfo);
    } catch (err) {
      console.error("Gagal export", err);
    }
  };
  const handleExportPdf = async () => {
    if (!batchInfo) return;
  
    try {
      const prodiDataMap = {};
      const prodisToFetch = selectedProdi 
        ? prodiList.filter(p => p.id === selectedProdi)
        : prodiList;

      for (const prodi of prodisToFetch) {
        const res = await api.get("/api/view-jadwal/prodi", {
          params: {
            periodeAkademikId: batchInfo.periodeId,
            prodiId: prodi.id,
            statusBatch: "FINAL",
          },
        });
        const hariData = res.data?.data?.hari || [];
        if (hariData.length > 0) {
          prodiDataMap[prodi.nama] = hariData;
        }
      }

      await exportPdfAllProdi(prodiDataMap, batchInfo);
    } catch (err) {
      console.error("Gagal export PDF", err);
    }
  };
  const toRomawi = (num) => {
    if (!num || num <= 0) return "";
    const map = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
    return map[num] || num;
  };

  const formatKelas = (jadwal) => {
    const semester = Number(jadwal?.semester);
    const romawi = toRomawi(semester);
    const kelasList = String(jadwal?.kelas || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  
    return kelasList
      .map((k) => {
        if (
          jadwal?.jenisKelas?.toLowerCase() === "karyawan"
        ) {
          return `${romawi}_KAR_KARYAWAN`;
        }
  
        return `${romawi}_REG_${k}`;
      })
      .join(", ");
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
  
  const totalPages = Math.ceil(total / pageSize);
  const groupedByHari = data.reduce((acc, item) => {
    const hari = item.hari || "-";
    if (!acc[hari]) acc[hari] = [];
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
          Daftar jadwal perkuliahan program studi yang telah disusun untuk periode aktif.
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-end gap-4">
        <div className="flex flex-col lg:flex-row gap-3">
        <button
        onClick={() => setShowExportModal(true)}
        className="flex items-center gap-2 bg-gradient-to-r
        from-green-500 to-green-600 text-white px-5 py-2.5
        rounded-lg shadow-sm hover:from-green-600
        hover:to-green-700 transition-all duration-200 font-medium"
      >
        <Download size={18} />
        Export File
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
                        {jadwal.sksEfektif}
                      </td>
                      <td className="px-3 py-2 border text-center whitespace-normal break-words max-w-[160px]">
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
          {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in-95 duration-200">

            {/* Tombol X */}
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Export Jadwal
            </h2>

            <p className="text-sm text-gray-500 mb-6">
              Pilih format file yang ingin diunduh
            </p>

            <div className="flex flex-col gap-3">
       {/* EXCEL */}
        <button
          disabled={exportLoading !== ""}
          onClick={async () => {
            try {
              setExportLoading("excel");

              await handleExportExcel();

              setShowExportModal(false);
            } catch (err) {
              console.error(err);
            } finally {
              setExportLoading("");
            }
          }}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {exportLoading === "excel" ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            "Export Excel"
          )}
        </button>
            {/* PDF */}
            <button
              disabled={exportLoading !== ""}
              onClick={async () => {
                try {
                  setExportLoading("pdf");

                  await handleExportPdf();

                  setShowExportModal(false);
                } catch (err) {
                  console.error(err);
                } finally {
                  setExportLoading("");
                }
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {exportLoading === "pdf" ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Export PDF"
              )}
            </button>

              {/* CANCEL */}
              <button
                onClick={() => setShowExportModal(false)}
                className="w-full border border-gray-300 hover:bg-gray-100 py-3 rounded-lg font-medium transition"
              >
                Batal
              </button>

            </div>
          </div>
        </div>
      )}
    
    </MainLayout>
  );
};

export default Jadwal;