import { useEffect, useState } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { Trash2, CheckCircle, Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BatchJadwal = () => {
  const [batchList, setBatchList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fakultasList, setFakultasList] = useState([]);
  const navigate = useNavigate();
  const fetchBatch = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/scheduler/batch");
      setBatchList(res.data?.data?.items || []);
    } catch (err) {
      console.error("Gagal mengambil data batch", err);
    } finally {
      setLoading(false);
    }
  };
  const fetchFakultas = async () => {
    try {
      const res = await api.get("/api/master-data/fakultas");
      setFakultasList(res.data?.data || []);
    } catch (err) {
      console.error("Gagal fetch fakultas:", err);
    }
  };

  const ubahKeSiap = async (id) => {
    try {
      await api.patch(`/api/scheduler/batch/${id}/status`, {
        status: "SIAP",
      });
      fetchBatch();
    } catch (err) {
      alert("Gagal mengubah status ke SIAP");
    }
  };

  const setAktif = async (id) => {
    if (!confirm("Jadikan batch ini sebagai jadwal aktif?")) return;

    try {
      await api.patch(`/api/scheduler/batch/${id}/set-final`);
      fetchBatch();
    } catch (err) {
      alert("Gagal mengaktifkan batch");
    }
  };

  const hapusBatch = async (id) => {
    if (!confirm("Yakin ingin menghapus batch ini?")) return;

    try {
      await api.delete(`/api/scheduler/batch/${id}`);
      fetchBatch();
    } catch (err) {
      alert("Gagal menghapus batch");
    }
  };

  useEffect(() => {
    fetchBatch();
  }, []);
  const formatNamaBatch = (nama, index) => {
    if (!nama) return `Batch ${index + 1}`;
  
    // ambil bagian tanggal setelah kata "Batch "
    const match = nama.match(/Batch (.+)/);
    if (!match) return nama;
  
    const isoDate = match[1];
    const date = new Date(isoDate);
  
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
  const getKualitasJadwal = (successRate) => {
    if (!successRate) return { label: "-", color: "gray", value: 0 };
  
    const persen = parseFloat(successRate); // "86.7%" → 86.7
  
    if (persen >= 90)
      return { label: "Sangat Baik", color: "green", value: persen };
  
    if (persen >= 80)
      return { label: "Baik", color: "blue", value: persen };
  
    if (persen >= 70)
      return { label: "Cukup", color: "yellow", value: persen };
  
    return { label: "Kurang", color: "red", value: persen };
  };
  return (
    <MainLayout>
      <div className=" bg-gray-50 min-h-screen">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Batch Penjadwalan
            </h1>
            <p className="text-gray-600 text-sm">
              Daftar hasil generate jadwal kuliah
            </p>
          </div>
        </div>

       {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Daftar Batch Jadwal</h3>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nama Batch
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Periode
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Fakultas
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Kualitas Jadwal
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-4 px-6 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center">
                  <Loader2 className="animate-spin mx-auto" />
                </td>
              </tr>
            ) : Array.isArray(batchList) && batchList.length > 0 ? (
              batchList.map((item, i) => {
                const kualitas = getKualitasJadwal(item.successRate);
                return (
                  <tr
                    key={item.id || i}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    {/* Nama Batch */}
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-gray-900">
                        {formatNamaBatch(item.nama, i)}
                      </div>
                    </td>

                    {/* Periode */}
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {item.periode?.nama || "-"}
                    </td>

                    {/* Fakultas */}
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {item.fakultas?.nama || "-"}
                    </td>

                    {/* Kualitas */}
                    <td className="py-4 px-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold
                        ${
                          kualitas.color === "green"
                            ? "bg-green-100 text-green-700"
                            : kualitas.color === "blue"
                            ? "bg-blue-100 text-blue-700"
                            : kualitas.color === "red"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                       { kualitas.label } ({kualitas.value}%)
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                        ${
                          item.status === "FINAL"
                            ? "bg-green-100 text-green-700"
                            : item.status === "SIAP"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-6 ">
                      <div className="flex items-center  gap-3 justify-center">
                        {item.status !== "FINAL" && (
                        <button
                        onClick={() => setAktif(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full 
                        bg-green-100 text-green-700 text-xs font-semibold
                        hover:bg-green-200 transition"
                      >
                        <CheckCircle size={12} />
                        Aktifkan
                      </button>
                        )}

                        <button
                          onClick={() => navigate(`/scheduler/batch/${item.id}`)}
                          className="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg hover:bg-indigo-50"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => hapusBatch(item.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  Tidak ada data batch jadwal
                </td>
              </tr>
            )}
          </tbody>
    </table>
  </div>

      {/* Table Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-700">
          Menampilkan{" "}
          <span className="font-semibold">{batchList.length}</span> batch jadwal
        </div>
      </div>
    </div>


        <div className="mt-4 text-xs text-gray-500">
          Batch aktif akan digunakan sebagai jadwal resmi.
        </div>
      </div>
    </MainLayout>
  );
};

export default BatchJadwal;
