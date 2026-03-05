import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from "lucide-react";

const DetailKonflik = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [changes, setChanges] = useState([]);
  const [loadingResolve, setLoadingResolve] = useState(false);
  const [isResolved, setIsResolved] = useState(false);

  const [activeTab, setActiveTab] = useState("konflik");

  useEffect(() => {
    fetchKonflik();
  }, []);

  useEffect(() => {
    if (isResolved) {
      setActiveTab("riwayat");
    }
  }, [isResolved]);

  const fetchKonflik = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/scheduler/batch/${id}/conflicts`);
      setData(res.data.data);

      // kalau konflik sudah 0 langsung buka riwayat
      console.log("DATA FETCH:", res.data.data);
      if ((res.data.data?.conflicts?.ruang?.count || 0) === 0) {
        setActiveTab("riwayat");
      }
    } catch (err) {
      console.error("Gagal fetch konflik:", err);
    } finally {
      setLoading(false);
    }
  };

  const konflikRuang = data?.conflicts?.ruang?.items || [];
  const totalKonflik = data?.conflicts?.ruang?.count || 0;

  const jumlahSlotBentrok = konflikRuang.length;

  const jumlahJadwalBentrok = konflikRuang.reduce(
    (acc, item) => acc + item.conflictingSchedules.length,
    0
  );

  const handleResolveAll = async () => {
    try {
      setLoadingResolve(true);

      const res = await api.post(
        `/api/scheduler/batch/${id}/resolve-conflicts`
      );

      setChanges(res.data.data.moves || []);
      setIsResolved(true);
    } catch (err) {
      console.error(err);
      alert("Gagal resolve konflik");
    } finally {
      setLoadingResolve(false);
    }
  };
  const formatNamaBatch = (nama) => {
    if (!nama) return "-";
    const match = nama.match(/Batch (.+)/);
    if (!match) return nama;

    const date = new Date(match[1]);
    if (isNaN(date)) return nama;

    return `Batch ${date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })} - ${date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">

        {/* HEADER */}
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
                {formatNamaBatch(data?.batchNama)} 
              </p>
        </div>
        </div>

        {/* summary*/}
        {!loading && totalKonflik > 0 && changes.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Total bentrok waktu</p>
              <p className="text-lg font-semibold text-red-600">
                {jumlahSlotBentrok}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Total Jadwal Bentrok</p>
              <p className="text-xl font-bold text-orange-600">
                {jumlahJadwalBentrok}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Total Bentrok Ruangan
                  </p>
                  <p className="text-xl font-bold text-red-600">
                    {totalKonflik}
                  </p>
                </div>

                <button
                  onClick={handleResolveAll}
                  disabled={loadingResolve}
                  className="inline-flex items-center gap-1 px-3 py-2
                  bg-green-600 text-white text-xs font-medium 
                  rounded-lg hover:bg-green-700 transition
                  disabled:opacity-50"
                >
                  <CheckCircle size={14} />
                  {loadingResolve ? "Proses..." : "Resolve konflik jadwal"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* loading */}
        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="animate-spin" size={18} />
            Memuat data konflik...
          </div>
        )}

        {/*  EMPTY STATE */}
        {!loading && totalKonflik === 0 && changes.length === 0 && (
        <div className="bg-white rounded-xl p-40 shadow-sm text-center">
          
          <div className="flex justify-center mb-4">
            <AlertTriangle size={40} className="text-green-500" />
          </div>

          <h2 className="text-lg font-semibold text-green-700">
            Tidak Ada Konflik Jadwal
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Jadwal sudah dalam kondisi optimal dan tidak ditemukan bentrok ruangan maupun waktu.
          </p>

        </div>
      )}

      {/* ================= TAB SECTION ================= */}
      {!loading && (totalKonflik > 0 || isResolved) && (
        <>
          {/* TAB NAVIGATION */}
          <div className="mb-6">
            <div className="inline-flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("konflik")}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${
                    activeTab === "konflik"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Konflik Aktif
              </button>

              <button
                onClick={() => setActiveTab("riwayat")}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${
                    activeTab === "riwayat"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Riwayat Perubahan
              </button>
            </div>
          </div>
          {isResolved && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          
          <div>
            <p className="text-green-700 font-semibold">
              Konflik Berhasil Diselesaikan
            </p>
            <p className="text-sm text-green-600">
              Semua jadwal telah dipindahkan dan tidak terdapat bentrok.
            </p>
          </div>

          <button
            onClick={() => navigate(`/scheduler/batch/${id}`)}
            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Lihat Batch Jadwal Final
          </button>

        </div>
      )}
    {/* TAB CONTENT */}
     {/* konflik */}
     {activeTab === "konflik" && (
              <div className="space-y-4">
                {konflikRuang.map((item, index) => (
                  <div
                    key={index}
                    className={`rounded-xl p-4 shadow-sm border ${
                      isResolved
                        ? "rounded-xl p-4 shadow-sm border bg-white border-gray-200"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="mb-2">
                      <p className="font-semibold text-gray-800">
                        {item.hari.nama} Pukul {item.slotWaktu.jamMulai} -{" "}
                        {item.slotWaktu.jamSelesai}
                      </p>

                      <p className="text-sm text-gray-600">
                        Ruang: {item.ruang.nama}
                      </p>
                    </div>

                    <div className="border-t border-gray-200 pt-2 space-y-2">
                      {item.conflictingSchedules.map((jadwal, i) => (
                        <div
                          key={i}
                          className={`rounded-lg p-3 border ${
                            isResolved
                              ? "bg-gray-50 border-gray-300"
                              : "bg-red-50 border-red-200"
                          }`}
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
            )}

        {activeTab === "riwayat" && (
          <div className="space-y-4">
            {changes.length === 0 ? (
              <div className="rounded-xl p-4 shadow-sm border bg-white border-gray-200">
                <p className="text-sm text-gray-500">
                  Belum ada riwayat perubahan.
                </p>
              </div>
            ) : (
              changes.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl p-4 shadow-sm border bg-white border-gray-200"
                >
                  {/* HEADER (sama struktur kayak konflik) */}
                  <div className="mb-2">
                    <p className="font-semibold text-gray-800">
                      {item.mataKuliah}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.kelas} — {item.dosen}
                    </p>
                  </div>

                  {/* ISI */}
                  <div className="border-t border-gray-200 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    {/* SEBELUM */}
                    <div className="rounded-lg p-3 border bg-red-50 border-red-200">
                      <p className="text-xs font-medium text-red-600 mb-1">
                        Sebelum
                      </p>
                      <p className="text-sm text-red-700">
                        {item.from.hari} | {item.from.slot}
                      </p>
                      <p className="text-sm text-red-700">
                        Ruang: {item.from.ruang}
                      </p>
                    </div>

                    {/* SESUDAH */}
                    <div className="rounded-lg p-3 border bg-green-50 border-green-200">
                      <p className="text-xs font-medium text-green-600 mb-1">
                        Sesudah
                      </p>
                      <p className="text-sm text-green-700">
                        {item.to.hari} | {item.to.slot}
                      </p>
                      <p className="text-sm text-green-700">
                        Ruang: {item.to.ruang}
                      </p>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        )}
          </>
        )}
        {/* FOOTER BUTTON */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-2 
              rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default DetailKonflik;