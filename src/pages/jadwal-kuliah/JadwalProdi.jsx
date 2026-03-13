import { useEffect, useState } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { Download, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";


const JadwalProdi = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState(null);
 
  const [batchInfo, setBatchInfo] = useState(null);
  const { user, peran } = useAuth();
//ambil batch final
  const fetchFinalBatch = async () => {
    try {
      const res = await api.get("/api/scheduler/batch", {
        params: { status: "FINAL", page: 1, pageSize: 100 },
      });
  
      const finalBatch = res.data?.data?.items.find(b => b.status === "FINAL");
  
      if (finalBatch) {
        setBatchInfo(finalBatch);
      }
  
    } catch (err) {
      console.error("Gagal mengambil batch", err);
    }
  };
//Fetch jadwal prodi pakai endpoint baru
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
    console.error("Gagal mengambil jadwal", err);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchFinalBatch();
  }, []);

  useEffect(() => {
    if (batchInfo && user?.prodiId) {
      fetchJadwal();
    }
  }, [batchInfo, user?.prodiId]);

  const toRomawi = (num) => {
    if (!num || num <= 0) return "";
    const map = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
    return map[num] || num;
  };


  const hitungSemester = (angkatan, tahunMulai, paruh) => {
    if (!angkatan || !tahunMulai) return 0;
    return (tahunMulai - angkatan) * 2 + (paruh === "GENAP" ? 2 : 1);
  };

  const formatKelas = (slot) => {
    if (!slot.kelas) return "-";
  
    return slot.kelas
      .map((k) => {
        const romawi = toRomawi(
          hitungSemester(
            k.angkatan,
            batchInfo?.periode?.tahunMulai,
            batchInfo?.periode?.paruh
          )
        );
  
        if (k.kode?.toLowerCase() === "karyawan") {
          return `${romawi}_KARYAWAN`;
        }
  
        return `${romawi}_REG_${k.kode}`;
      })
      .join(", ");
  };
  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Jadwal Perkuliahan</h1>
          <p className="text-sm text-gray-600">Daftar jadwal perkuliahan yang telah disusun untuk periode aktif.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-end gap-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <button
            onClick={() => exportAllProdi(data, batchInfo)}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
          >
            <Download size={18} />
            Export Excel
          </button>
        </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border border-gray-300 bg-white">
            <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
              <tr>
              <th className="px-4 py-3 border">Hari</th>
                <th className="px-4 py-3 border">Jam</th>
                <th className="px-4 py-3 border">Mata Kuliah</th>
                <th className="px-4 py-3 border text-center">SKS</th>
                <th className="px-4 py-3 border">Dosen</th>
                <th className="px-4 py-3 border">Kelas</th>
                <th className="px-4 py-3 border">Ruangan</th>
              </tr>
            </thead>
            <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8">
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="animate-spin" size={24} />
                    <span className="text-sm">Memuat data jadwal...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-500">
                  Tidak ada jadwal
                </td>
              </tr>
            ) : (
              data.map((hari) =>
                hari.slots.map((slot, idx) => (
                  <tr key={`${hari.id}-${idx}`} className="hover:bg-gray-50">
                    {idx === 0 && (
                      <td
                        rowSpan={hari.slots.length}
                        className="px-4 py-2 border font-medium text-center"
                      >
                        {hari.nama}
                      </td>
                    )}

                    <td className="border px-4 py-2 whitespace-nowrap">
                      {slot.jamMulai} - {slot.jamSelesai}
                    </td>

                    <td className="border px-4 py-2">
                      {slot.matkul?.nama}
                    </td>

                    <td className="border px-4 py-2 text-center">
                      {slot.matkul?.sksTotal}
                    </td>

                    <td className="border px-4 py-2">
                      {slot.dosen?.nama}
                    </td>

                    <td className="border px-4 py-2">
                      {formatKelas(slot)}
                    </td>

                    <td className="border px-4 py-2">
                      {slot.ruang?.nama}
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
          </table>
        </div>
      </div>

    
    </MainLayout>
  );
};

export default JadwalProdi;