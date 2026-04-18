import { useEffect, useState } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { useAuth } from "../../hooks/useAuth";
import { Download, Loader2 } from "lucide-react";
import { exportPerSemester } from "../../utils/exportExcel/jadwal/exportPerSemester.js";
const JadwalKelas = () => {
  const { user } = useAuth();

  const [data, setData] = useState([]);
  const [batchInfo, setBatchInfo] = useState(null);
  const [semesterAktif, setSemesterAktif] = useState(null);
  const [loading, setLoading] = useState(false);
  // ambil batch final
  console.log("USER LOGIN:", user);
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

  const sortKelas = (a, b) => {
    if (a === "KARYAWAN") return 1;
    if (b === "KARYAWAN") return -1;
  
    return a.localeCompare(b);
  };
  const handleExport = () => {
    exportPerSemester(data, batchInfo, user?.nama);
  };
  const toRomawi = (num) => {
    const map = ["","I","II","III","IV","V","VI","VII","VIII"];
    return map[num] || num;
  };
  
  const hitungSemester = (angkatan, tahunMulai, paruh) => {
    if (!angkatan || !tahunMulai) return 0;
    return (tahunMulai - angkatan) * 2 + (paruh === "GENAP" ? 2 : 1);
  };
  const semesterSet = new Set();
  data.forEach((hari) => {
    hari.slots.forEach((slot) => {
      const kelasList = Array.isArray(slot.kelas)
        ? slot.kelas
        : slot.kelas
        ? [slot.kelas]
        : [];
  
      kelasList.forEach((k) => {
        const semester = hitungSemester(
          k.angkatan,
          batchInfo?.periode?.tahunMulai,
          batchInfo?.periode?.paruh
        );
        semesterSet.add(semester);
      });
    });
  });

const semesterList = Array.from(semesterSet).sort((a, b) => a - b);
  const semuaKelas = new Set();
  data.forEach((hari) => {
    hari.slots.forEach((slot) => {
      const kelasList = Array.isArray(slot.kelas)
        ? slot.kelas
        : slot.kelas
        ? [slot.kelas]
        : [];
  
      kelasList.forEach((k) => {
        semuaKelas.add(k.kode);
      });
    });
  });
  const groupedSemester = {};
  data.forEach((hari) => {
    hari.slots.forEach((slot) => {
      const kelasList = Array.isArray(slot.kelas)
        ? slot.kelas
        : slot.kelas
        ? [slot.kelas]
        : [];
  
      kelasList.forEach((k) => {
        const semesterAngka = hitungSemester(
          k.angkatan,
          batchInfo?.periode?.tahunMulai,
          batchInfo?.periode?.paruh
        );
  
        if (!groupedSemester[semesterAngka]) {
          groupedSemester[semesterAngka] = {};
        }
  
        const kelasKey =
          k.kode?.toLowerCase() === "karyawan"
            ? "KARYAWAN"
            : `REG_${k.kode}`;
  
        if (!groupedSemester[semesterAngka][kelasKey]) {
          groupedSemester[semesterAngka][kelasKey] = [];
        }
  
        groupedSemester[semesterAngka][kelasKey].push({
          ...slot,
          hari: hari.nama,
        });
      });
    });
  });
  useEffect(() => {
    if (semesterList.length > 0 && !semesterAktif) {
      setSemesterAktif(semesterList[0]);
    }
  }, [semesterList]);

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

        {/* Tombol Export */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <p className="text-sm text-gray-600">
          Lihat daftar jadwal perkuliahan yang telah disusun untuk periode akademik saat ini.
        </p>
            <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
            >
            <Download size={18} />
            Export Excel
            </button>
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
        {Object.entries(groupedSemester[semesterAktif] || {})
            .sort(([a], [b]) => sortKelas(a, b))
            .map(([kelas, jadwal]) => (
            <div key={kelas} className="mb-8 last:mb-0">

                <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left border ">
                    
                    <thead className=" uppercase text-xs bg-gray-200">
                    <tr>
                        <th
                        colSpan="5"
                        className="text-center font-semibold text-base py-3 "
                        >
                        Semester {toRomawi(semesterAktif)} - {kelas}
                        </th>
                    </tr>

                    <tr className="bg-gray-200">
                        <th className="border px-4 py-2">Hari</th>
                        <th className="border px-4 py-2">Jam</th>
                        <th className="border px-4 py-2">Mata Kuliah</th>
                        <th className="border px-4 py-2">Dosen</th>
                        <th className="border px-4 py-2">Ruangan</th>
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
        </div>
    </MainLayout>
  );
};

export default JadwalKelas;