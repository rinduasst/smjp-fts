import { useEffect, useState } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { useAuth } from "../../hooks/useAuth";
import { Download, Loader2,Search } from "lucide-react";
import { exportPerKelas } from "../../utils/exportExcel/jadwal/exportPerKelas.js";
import { exportPdfKelas } from "../../utils/exportPdf/exportPdfKelas.js";
const JadwalKelas = () => {
  const { user } = useAuth();

  const [data, setData] = useState([]);
  const [batchInfo, setBatchInfo] = useState(null);
  const [semesterAktif, setSemesterAktif] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState("");

  const [filterKelas, setFilterKelas] = useState("ALL");
  // ambil batch final
  const fetchFinalBatch = async () => {

    try {
      const res = await api.get("/api/scheduler/batch", {
        params: { status: "FINAL", page: 1, pageSize: 100 },
      });

      const finalBatch = res.data?.data?.items.find((b) => b.status === "FINAL");

      if (finalBatch) {
        setBatchInfo(finalBatch);
      }
    } catch (err) {
      console.error("Gagal ambil batch", err);
    }
  };

  // ambil jadwal
  const fetchJadwal = async () => {
    if (!batchInfo || !user?.prodiId) return;
  
    setLoading(true);
  
    try {
      const res = await api.get("/api/view-jadwal/prodi", {
        params: {
          periodeAkademikId: batchInfo.periodeId,
          prodiId: user.prodiId,
          statusBatch: "FINAL",
        },
      });
  
      setData(res.data?.data?.hari || []);
    } catch (err) {
      console.error("Gagal ambil jadwal", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinalBatch();
  }, []);

  useEffect(() => {
    if (batchInfo) fetchJadwal();
  }, [batchInfo]);

  const toRomawi = (num) => {
    const map = ["","I","II","III","IV","V","VI","VII","VIII"];
    return map[num] || num;
  };
  
  const hitungSemester = (angkatan, tahunMulai, paruh) => {
    if (!angkatan || !tahunMulai) return 0;
    return (tahunMulai - angkatan) * 2 + (paruh === "GENAP" ? 2 : 1);
  };

  const grouped = {};

  data.forEach((hari) => {
    hari.slots?.forEach((slot) => {
  
      const kelasList = slot.kelas?.kode
      ?.split(",")
      .map((k) => {
        const parts = k.trim().split(" ");
        return parts[parts.length - 1]; // ambil A/B/C
      }) || [];
  
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
  const semesterList = Object.keys(grouped)
  .map(Number)
  .sort((a, b) => a - b);
  useEffect(() => {
    if (semesterList.length > 0 && !semesterAktif) {
      setSemesterAktif(semesterList[0]);
    }
  }, [semesterList]);
  const sortKelas = (a, b) => {
    if (a === "KARYAWAN") return 1;
    if (b === "KARYAWAN") return -1;
  
    return a.localeCompare(b);
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">

        <div className="mb-">
        {/* Judul dan deskripsi */}
        <div className="mb-6">
        {/* Judul */}
        <h1 className="text-2xl font-bold text-gray-800">
          Jadwal Perkuliahan Semester Aktif
        </h1>
      {/* Keterangan dinamis singkat */}
      <div className="mt-2 text-sm text-gray-600">
        <span className="font-semibold">
          {batchInfo?.fakultas?.nama || "-"}  - Periode {batchInfo?.periode?.nama || "-"} ({batchInfo?.periode?.tahunMulai || "-"} / {batchInfo?.periode?.tahunSelesai || "-"})
        </span>
      </div>
      </div>
{/* Toolbar */}
<div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

    {/* Text */}
    <p className="text-sm text-gray-600">
      Lihat daftar jadwal perkuliahan yang telah disusun untuk periode akademik saat ini.
    </p>

    {/* Action */}
    <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">

      {/* Filter */}
      <div className="relative w-full sm:w-56">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <select
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          className="
            w-full
            pl-9 pr-3 py-2
            border border-gray-300
            rounded-md
            text-sm
            focus:outline-none
            focus:border-green-500
          "
        >
          <option value="ALL">Semua Kelas</option>

          {Object.keys(grouped[semesterAktif] || {}).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      {/* Export Button */}
      <button
        disabled={loading}
        onClick={() => setShowExportModal(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
        >
      
        <Download size={16} />
        Export File
      </button>
    </div>
  </div>
</div>
          </div>
 
        
        {/* TABEL */}
        <div className="bg-white p-6 rounded-lg shadow min-h-[300px] relative">
        <div className="flex justify-around border-b border-gray-200 mb-6">
        {semesterList.map((semester, idx) => (
            <button
            key={semester}
            onClick={() => setSemesterAktif(semester)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200
                ${
                semesterAktif === semester
                    ? "text-green-600 after:absolute after:-bottom-px after:left-0 after:w-full after:h-0.5 after:bg-green-600"
                    : "text-gray-500 hover:text-gray-600"
                }
            `}
            >
            Semester {toRomawi(semester)}
            </button>
        ))}
        </div>
         {  Object.entries(grouped[semesterAktif] || {})
        .filter(([kelas]) => {
          if (filterKelas === "ALL") return true;
          return kelas === filterKelas;
        })
            .sort(([a], [b]) => sortKelas(a, b))
            .map(([kelas, jadwal]) => (
            <div key={kelas} className="mb-8 last:mb-0">

            <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
            <table className="min-w-full text-sm border border-black-300">
              <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
                    <tr>
                        <th
                        colSpan="5"
                        className="text-center font-semibold text-base py-3 "
                        >
                        Semester {toRomawi(semesterAktif)} - Kelas {kelas}
                        </th>
                    </tr>

                    <tr className="bg-gray-200">
                        <th className="border px-4 py-2 text-center">Hari</th>
                        <th className="border px-4 py-2 text-center">Jam</th>
                        <th className="border px-4 py-2 text-center">Mata Kuliah</th>
                        <th className="border px-4 py-2 text-center">Dosen</th>
                        <th className="border px-4 py-2 text-center">Ruangan</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-500">
                            <Loader2 className="animate-spin" size={24} />
                            <span className="text-sm">Memuat jadwal...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      (() => {
                        const hariGroup = {};

                        jadwal.forEach((j) => {
                          if (!hariGroup[j.hari]) {
                            hariGroup[j.hari] = [];
                          }
                          hariGroup[j.hari].push(j);
                        });

                        return Object.entries(hariGroup).map(([hari, items]) =>
                          items.map((item, i) => (
                            <tr key={`${hari}-${i}`}>
                              {i === 0 && (
                                <td
                                  rowSpan={items.length}
                                  className="border px-4 py-2 font-medium text-center"
                                >
                                  {hari}
                                </td>
                              )}

                              <td className="border px-4 py-2">
                                {item.jamMulai} - {item.jamSelesai}
                              </td>

                              <td className="border px-4 py-2">
                                {item.matkul?.nama}
                              </td>

                              <td className="border px-4 py-2">
                                {item.dosen?.nama}
                              </td>

                              <td className="border px-4 py-2">
                                {item.ruang?.nama}
                              </td>
                            </tr>
                          ))
                        );
                      })()
                    )}
                    </tbody>
                </table>
                </div>
            </div>
            ))}
        </div>
       
        {/* MODAL EXPORT */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in-95 duration-200">

            {/* Tombol X */}
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
              Export Jadwal Kelas
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

                    const dataSemesterAktif =
                      grouped[semesterAktif] || {};

                    await exportPerKelas(
                      dataSemesterAktif,
                      batchInfo,
                      user,
                      filterKelas,
                      semesterAktif
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

                    const dataSemesterAktif =
                      grouped[semesterAktif] || {};

                    await exportPdfKelas(
                      dataSemesterAktif,
                      batchInfo,
                      user,
                      filterKelas,
                      semesterAktif
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
       </div>
    </MainLayout>
  );
};

export default JadwalKelas;