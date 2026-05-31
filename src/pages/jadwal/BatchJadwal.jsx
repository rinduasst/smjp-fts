import { useEffect, useState } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { Trash2, CheckCircle, Eye, Loader2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/ConfirmModal";

const BatchJadwal = () => {
  const [batchList, setBatchList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModalEdit, setShowModalEdit] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [namaBatchBaru, setNamaBatchBaru] = useState("");

  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [actionType, setActionType] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

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

  const setAktif = (id) => {
    setSelectedBatchId(id);
    setActionType("aktif");
  
    setConfirmModal({
      open: true,
      title: "Aktifkan Batch",
      message: "Jadikan batch ini sebagai jadwal aktif?",
      type: "confirm",
    });
  };
  const hapusBatch = (id, status) => {
    // kalau batch aktif/final
    if (status === "FINAL") {
      setConfirmModal({
        open: true,
        title: "Tidak Bisa Dihapus",
        message: "Batch yang sedang aktif tidak dapat dihapus. Batalkan status final terlebih dahulu.",
        type: "error",
      });
      return;
    }
    setSelectedBatchId(id);
    setActionType("delete");
  
    setConfirmModal({
      open: true,
      title: "Hapus Batch",
      message: "Yakin ingin menghapus batch ini?",
      type: "delete",
    });
  };

  const handleConfirm = async () => {
    try {
      if (actionType === "delete") {
        await api.delete(`/api/scheduler/batch/${selectedBatchId}`);
      }
      if (actionType === "aktif") {
        await api.patch(
          `/api/scheduler/batch/${selectedBatchId}/set-final`
        );
      }
      if (actionType === "siap") {
        await api.patch(
          `/api/scheduler/batch/${selectedBatchId}/status`,
          {
            status: "SIAP",
          }
        );
      }
      fetchBatch();
      setConfirmModal({
        open: true,
        title: "Berhasil",
        message: "Perubahan berhasil disimpan",
        type: "success",
      });
    } catch (err) {
      setConfirmModal({
        open: true,
        title: "Gagal",
        message: "Terjadi kesalahan",
        type: "error",
      });
    }
  };
  const openModalEdit = (item) => {
    setSelectedBatch(item);
    setNamaBatchBaru(item.nama || "");
    setShowModalEdit(true);
  };
  const submitUbahNama = async () => {
    if (!namaBatchBaru.trim()) {
      setConfirmModal({
        open: true,
        title: "Peringatan",
        message: "Nama batch tidak boleh kosong",
        type: "error",
      });
      return;
    }
  
    try {
      await api.patch(`/api/scheduler/batch/${selectedBatch.id}/nama`, {
        namaBatch: namaBatchBaru,
      });
  
      setShowModalEdit(false);
      fetchBatch();
  
      setConfirmModal({
        open: true,
        title: "Berhasil",
        message: "Nama batch berhasil diubah",
        type: "success",
      });
  
    } catch (err) {
      setConfirmModal({
        open: true,
        title: "Gagal",
        message: "Gagal mengubah nama batch",
        type: "error",
      });
    }
  };

  const ubahKeDraft = (id) => {
    setSelectedBatchId(id);
    setActionType("siap");
  
    setConfirmModal({
      open: true,
      title: "Batalkan Final",
      message: "Ubah jadwal ini ke DRAFT?",
      type: "confirm",
    });
  };
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
  useEffect(() => {
    fetchBatch();
  }, []);
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
                    <div className="flex items-center gap-3 justify-center">

                      {/* Aktifkan */}
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

                      {/* Ubah ke Draft (hanya kalau FINAL) */}
                      {item.status === "FINAL" && (
                        <button
                          onClick={() => ubahKeDraft(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full 
                          bg-red-100 text-red-700 text-xs font-semibold
                          hover:bg-red-200 transition"
                        >
                         
                         Batalkan Final
                        </button>
                      )}
                        <button
                        onClick={() => navigate(`/scheduler/batch/${item.id}`)}
                        className="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg hover:bg-indigo-50"
                      >
                        <Eye size={18} />
                      </button>
                      {/* Detail */}
                      <button
                    onClick={() =>openModalEdit(item)}
                    className="text-yellow-600 hover:text-yellow-800 p-2 rounded-lg hover:bg-yellow-50"
                    title="Ubah Nama Batch"
                  >
                    <Edit size={18} />
                  </button>

                      {/* Hapus */}
                      <button
                        onClick={() => hapusBatch(item.id, item.status)}
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

      </div>
      {showModalEdit && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-300">
        <h3 className="text-lg font-semibold text-gray-800">
          Ubah Nama Batch
        </h3>
        <button
          onClick={() => setShowModalEdit(false)}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
      </div>

      {/* BODY */}
      <div className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Batch
          </label>
          <input
            type="text"
            value={namaBatchBaru}
            onChange={(e) => setNamaBatchBaru(e.target.value)}
            className="w-full px-3 py-2 border border-gray-400  rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Masukkan nama batch baru"
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-300 bg-gray-50">
        <button
          onClick={() => setShowModalEdit(false)}
          className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
        >
          Batal
        </button>

        <button
          onClick={submitUbahNama}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Simpan
        </button>
      </div>

    </div>
  </div>
)}
    <ConfirmModal
      open={confirmModal.open}
      title={confirmModal.title}
      message={confirmModal.message}
      type={confirmModal.type}
      onClose={() =>
        setConfirmModal((prev) => ({
          ...prev,
          open: false,
        }))
      }
      onConfirm={
        ["delete", "confirm"].includes(confirmModal.type)
          ? handleConfirm
          : undefined
      }
    />
    </MainLayout>
  );
};

export default BatchJadwal;
