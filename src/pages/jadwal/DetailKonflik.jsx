import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";

const DetailKonflik = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKonflik();
  }, []);

  const fetchKonflik = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/scheduler/batch/${id}/conflicts`);
      setData(res.data.data);
    } catch (err) {
      console.error("Gagal fetch konflik:", err);
    } finally {
      setLoading(false);
    }
  };
  const konflikKelas = data?.conflicts?.kelas?.items || [];
  const totalKonflik = data?.conflicts?.kelas?.count || 0;
  
  const jumlahSlotBentrok = konflikKelas.length;
  
  const jumlahJadwalBentrok = konflikKelas.reduce(
    (acc, item) => acc + item.conflictingSchedules.length,
    0
  );

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">

          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-xl font-bold">
              Detail Konflik Jadwal
            </h1>
            <p className="text-sm text-gray-600">
              {data?.batchNama}
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
         <p className="text-xs text-gray-500 mb-1">Waktu yang Bermasalah</p>
        <div className="flex items-center justify-between mt-1">
        <p className="text-lg font-semibold text-red-600">
            {jumlahSlotBentrok}
        </p>
        </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
         <p className="text-xs text-gray-500 mb-1">Jumlah Jadwal yang Bertabrakan</p>
        <p className="text-xl font-bold text-orange-600">
            {jumlahJadwalBentrok}
        </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Bentrok Jadwal</p>
        <p className="text-xl font-bold text-red-700">
            {totalKonflik}
        </p>
        </div>
        </div>
        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="animate-spin" size={18} />
            Memuat data konflik...
          </div>
        )}

        {/* Empty State */}
        {!loading && totalKonflik === 0 && (
          <div className="bg-white border rounded-xl p-6 text-center">
            <AlertTriangle className="mx-auto mb-2 text-green-500" size={32} />
            <p className="font-semibold text-green-600">
              Tidak ada konflik
            </p>
            <p className="text-sm text-gray-500">
              Jadwal batch ini tidak memiliki konflik kelas
            </p>
          </div>
        )}


        {/* List Konflik */}
        <div className="space-y-4">
          {konflikKelas.map((item, index) => (
            <div
              key={index}
              className="bg-white border-gray-200 rounded-xl p-4 shadow-sm"
            >

              {/* Info waktu */}
              <div className="mb-2">
                <p className="font-semibold text-gray-800">
                  {item.hari.nama} Pukul {item.slotWaktu.jamMulai} - {item.slotWaktu.jamSelesai}
                </p>

                <p className="text-sm text-gray-600">
                  Kelas: {item.kelas.kode} ({item.kelas.angkatan})
                </p>
              </div>


              {/* Jadwal konflik */}
              <div className="border-t pt-2 space-y-2">

                {item.conflictingSchedules.map((jadwal, i) => (
                  <div
                    key={i}
                    className="bg-red-50 border border-red-200 rounded-lg p-3"
                  >

                    <p className="font-medium text-red-700">
                      {jadwal.matkul.kode} — {jadwal.matkul.nama}
                    </p>

                    <p className="text-sm text-gray-600">
                      Dosen: {jadwal.dosen.nama}
                    </p>

                  </div>
                ))}

              </div>

            </div>
          ))}
        </div>

      </div>
        {/* kiri */}
        <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-3 py-2 
              rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
            >
              <ArrowLeft size={18} />
              Kembali
            </button>
        </div>
    </MainLayout>
    
  );
};

export default DetailKonflik;