import React, { useState, useEffect } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { useAuth } from "../../hooks/useAuth";
import { Download, Search, Loader2 } from "lucide-react";
import { exportJadwalDosenExcel } from "../../utils/exportExcel/dosen/exportBkd.js";
import { exportPdfDosen } from "../../utils/exportPdf/exportPdfDosen.js";

const JadwalDosen = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [batchInfo, setBatchInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [showExportModal, setShowExportModal] = useState(false);
const [exportType, setExportType] = useState("");

  const toRomawi = (num) => {
    if (!num || num <= 0) return "";
    const map = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
    return map[num] || num;
  };

  const formatKelas = (jadwal) => {
    let semester = jadwal?.semester;
  
    // fallback manual
    if (!semester) {
      semester = 7;
    }
  
    const romawi = toRomawi(Number(semester));
  
    const kelasList = (jadwal?.kelas || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  
    return kelasList
      .map((k) => {
        if (jadwal?.jenisKelas === "KARYAWAN") {
          return `${romawi}_KAR_KARYAWAN`;
        }
  
        return `${romawi}_REG_${k}`;
      })
      .join(", ");
  };
  const fetchFinalBatch = async () => {
    try {
      const res = await api.get("/api/scheduler/batch", {
        params: { status: "FINAL", page: 1, pageSize: 100 },
      });
  
      const finalBatch = res.data?.data?.items.find(
        b => b.status === "FINAL"
      );
  
      if (finalBatch) {
        setBatchInfo(finalBatch);
      }
  
    } catch (err) {
      console.error("Gagal mengambil batch", err);
    }
  };

  const fetchJadwalDosen = async () => {
    if (!user?.prodiId) return;
    setLoading(true);
    try {
      const periodeId = batchInfo.periodeId;
      if (!periodeId) return;

      const res = await api.get("/api/view-jadwal/all", {
        params: {
          periodeAkademikId: periodeId,
          prodiId: user.prodiId,
          statusBatch: "FINAL",
          page: 1,
          pageSize: 200,
          sortBy: "hari",
          sortOrder: "asc",
        },
      });

      const items = res.data?.data?.items || [];
      const grouped = items.reduce((acc, item) => {
        if (!acc[item.dosen]) acc[item.dosen] = { nama: item.dosen, jadwal: [] };
        acc[item.dosen].jadwal.push(item);
        return acc;
      }, {});

      setData(
        Object.values(grouped).sort((a, b) =>
          a.nama.localeCompare(b.nama, "id", {
            sensitivity: "base",
          })
        )
      );
    } catch (err) {
      console.error("Gagal ambil jadwal dosen", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinalBatch();
  }, []);
  
  useEffect(() => {
    if (batchInfo && user?.prodiId) {
      fetchJadwalDosen();
    }
  }, [batchInfo, user?.prodiId]);
  // Filter berdasarkan search
  const filteredData = data.map(dosen => ({
    ...dosen,
    jadwal: dosen.jadwal.filter(j => j.dosen.toLowerCase().includes(searchTerm.toLowerCase()))
  })).filter(dosen => dosen.jadwal.length > 0);

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen ">
        <h1 className="text-2xl font-bold mb-2">Jadwal Dosen</h1>
        <p className="text-sm text-gray-600 mb-4">
          Daftar jadwal perkuliahan dosen pada periode akademik saat ini.
        </p>

                {/* Kontrol Export + Search */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
        <button 
          disabled={loading}
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
        >
          <Download size={18} />
          Export File
        </button>
          <div className="relative w-full sm:w-64">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input 
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-500 text-gray-900 focus:border-green-500 focus:outline-none transition"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Dosen..."
            />
          </div>
        </div>
        </div>
        {/* Tabel */}
           <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-300">
              <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="border px-3 py-2">NO</th>
                  <th className="border px-3 py-2">Nama</th>
                  <th className="border px-3 py-2">Mata Kuliah</th>
                  <th className="border px-3 py-2">Kelas</th>
                  <th className="border px-3 py-2">SKS</th>
                  <th className="border px-3 py-2">Hari</th>
                  <th className="border px-3 py-2">Waktu</th>
                  <th className="border px-3 py-2">Ruang</th>
                  <th className="border px-3 py-2">Total SKS</th>
                </tr>
              </thead>
              <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="text-sm">Memuat jadwal dosen...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-gray-500">
                    Tidak ada data jadwal dosen
                  </td>
                </tr>
              ) : (
                filteredData.map((dosen, idx) => {
                  const totalSKS = dosen.jadwal.reduce((acc, j) => acc + (j.sksEfektif || 0), 0);

                  return dosen.jadwal.map((j, i) => (
                    <tr key={`${dosen.nama}-${i}`}>
                      {i === 0 && (
                        <>
                          <td rowSpan={dosen.jadwal.length} className="border px-3 py-2 text-center">
                            {idx + 1}
                          </td>
                          <td rowSpan={dosen.jadwal.length} className="border px-3 py-2 font-medium">
                            {dosen.nama}
                          </td>
                        </>
                      )}

                      <td className="border px-3 py-2">{j.mataKuliah}</td>
                      <td className="px-3 py-2 border text-center whitespace-normal break-words max-w-[160px]">
                        {formatKelas(j)}
                      </td>
                      <td className="border px-3 py-2 text-center">{j.sksEfektif}</td>
                      <td className="border px-3 py-2">{j.hari}</td>
                      <td className="border px-3 py-2 whitespace-nowrap">
                        {j.jamMulai} - {j.jamSelesai}
                      </td>
                      <td className="border px-3 py-2">{j.ruangan}</td>

                      {i === 0 && (
                        <td rowSpan={dosen.jadwal.length} className="border px-3 py-2 text-center font-semibold">
                          {totalSKS}
                        </td>
                      )}
                    </tr>
                  ));
                })
              )}
              </tbody>
            </table>
        </div>
      </div>
      {/* MODAL EXPORT */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">

            {/* CLOSE */}
            <button
              onClick={() => {
                if (!exportType) {
                  setShowExportModal(false);
                }
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Export Jadwal Dosen
            </h2>

            <p className="text-sm text-gray-500 mb-6">
              Pilih format file yang ingin diunduh
            </p>

            <div className="flex flex-col gap-3">

              {/* EXCEL */}
              <button
                disabled={exportType !== ""}
                onClick={async () => {
                  try {
                    setExportType("excel");

                    await exportJadwalDosenExcel(
                      filteredData,
                      formatKelas,
                      batchInfo
                    );

                    setShowExportModal(false);

                  } catch (err) {
                    console.error(err);
                  } finally {
                    setExportType("");
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {exportType === "excel" ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  "Export Excel"
                )}
              </button>

              {/* PDF */}
              <button
                disabled={exportType !== ""}
                onClick={async () => {
                  try {
                    setExportType("pdf");

                    await exportPdfDosen(
                      filteredData,
                      formatKelas,
                      batchInfo
                    );

                    setShowExportModal(false);

                  } catch (err) {
                    console.error(err);
                  } finally {
                    setExportType("");
                  }
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {exportType === "pdf" ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  "Export PDF"
                )}
              </button>

              {/* BATAL */}
              <button
                disabled={exportType !== ""}
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

export default JadwalDosen;