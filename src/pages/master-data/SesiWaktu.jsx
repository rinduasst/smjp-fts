import { useState, useEffect } from "react";
import MainLayout from "../../components/MainLayout";
import { Search, Plus, Edit, Trash2, X, Loader2 } from "lucide-react";
import api from "../../api/api";
import ConfirmModal from "../../components/ConfirmModal";

function SlotWaktu() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    nama: "",
    jamMulaiJam: "",
    jamMulaiMenit: "",
    jamSelesaiJam: "",
    jamSelesaiMenit: "",
    slotMalam: false,
  });
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
  });
  const menitList = ["00", "10", "20", "30", "40", "50"];

  const fetchSlotWaktu = async () => {
    try {
      const res = await api.get("/api/master-data/slot-waktu");
      setData(res.data?.data.items || []);
    } catch (err) {
      console.error("Gagal fetch slot waktu:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSlotWaktu();
  }, []);

  const filteredData = data.filter(item =>
    item.nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const resetForm = () => {
    setFormData({
      nama: "",
      jamMulaiJam: "",
      jamMulaiMenit: "",
      jamSelesaiJam: "",
      jamSelesaiMenit: "",
      slotMalam: false,
    });
  
    setSelectedItem(null);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      // VALIDASI WAJIB
      if (
        !formData.nama ||
        !formData.jamMulaiJam ||
        !formData.jamMulaiMenit ||
        !formData.jamSelesaiJam ||
        !formData.jamSelesaiMenit
      ) {
        setConfirmModal({
          open: true,
          title: "Peringatan",
          message: "Lengkapi data terlebih dahulu",
          type: "error",
        });
        return;
      }
  
      const newStart = `${formData.jamMulaiJam}.${formData.jamMulaiMenit}`;
      const newEnd = `${formData.jamSelesaiJam}.${formData.jamSelesaiMenit}`;
  
      // DUPLIKAT NAMA
      const isDuplicateName = data.some(
        (d) =>
          d.nama?.toLowerCase() === formData.nama.trim().toLowerCase() &&
          d.id !== selectedItem?.id
      );
  
      // DUPLIKAT JAM
      const isDuplicateTime = data.some(
        (d) =>
          d.jamMulai === newStart &&
          d.jamSelesai === newEnd &&
          d.id !== selectedItem?.id
      );
  
      if (isDuplicateName) {
        setConfirmModal({
          open: true,
          title: "Duplikat",
          message: "Nama sudah dipakai",
          type: "error",
        });
        return;
      }
  
      if (isDuplicateTime) {
        setConfirmModal({
          open: true,
          title: "Duplikat",
          message: "Jam sudah ada",
          type: "error",
        });
        return;
      }
      const payload = {
        nama: formData.nama.trim(),
        jamMulai: `${formData.jamMulaiJam}:${formData.jamMulaiMenit}`,
        jamSelesai: `${formData.jamSelesaiJam}:${formData.jamSelesaiMenit}`,
        slotMalam: formData.slotMalam,
      };
  
      if (selectedItem) {
        await api.patch(`/api/master-data/slot-waktu/${selectedItem.id}`, payload);
      } else {
        console.log("PAYLOAD:", payload);
        console.log("HEADERS:", api.defaults.headers);
        await api.post("/api/master-data/slot-waktu", payload);
      }
  
      await fetchSlotWaktu();
  
      setFormData({
        nama: "",
        jamMulaiJam: "",
        jamMulaiMenit: "",
        jamSelesaiJam: "",
        jamSelesaiMenit: "",
        slotMalam: false,
      });
  
      setSelectedItem(null);
      setShowModal(false);
  
      setConfirmModal({
        open: true,
        title: "Berhasil",
        message: "Data berhasil disimpan",
        type: "success",
      });
  
    } catch (err) {
    
        console.log("ERROR:", err);
        console.log("RESPONSE:", err.response);
        console.log("DATA:", err.response?.data);
        console.log("DATA EXISTING:", data);
      
      setConfirmModal({
        open: true,
        title: "Gagal",
        message: "Gagal menyimpan data",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleEdit = (item) => {
    const mulaiJam = item.jamMulai?.split(".")[0] || "";
    const mulaiMenit = item.jamMulai?.split(".")[1] || "";
    
    const selesaiJam = item.jamSelesai?.split(".")[0] || "";
    const selesaiMenit = item.jamSelesai?.split(".")[1] || "";
  
    setSelectedItem(item);
    setFormData({
      nama: item.nama || "",
      jamMulaiJam: mulaiJam,
      jamMulaiMenit: mulaiMenit,
      jamSelesaiJam: selesaiJam,
      jamSelesaiMenit: selesaiMenit,
      slotMalam: item.slotMalam || false,
    });
    setShowModal(true);
  };
  const handleDelete = async () => {
    if (!selectedItem) return;
  
    setConfirmModal({
      open: true,
      title: "Hapus Waktu",
      message: `Yakin ingin menghapus "${selectedItem.nama}"?`,
      type: "delete",
    });
  };
  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
  
      await api.delete(
        `/api/master-data/slot-waktu/${selectedItem.id}`
      );
  
      await fetchSlotWaktu();
  
      setConfirmModal({
        open: true,
        title: "Berhasil",
        message: "Sesi waktu berhasil dihapus",
        type: "success",
      });
  
      setSelectedItem(null);
    } catch (error) {
      setConfirmModal({
        open: true,
        title: "Gagal",
        message: "Gagal menghapus sesi waktu",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const jamList = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);
  const closeModal = () => {
    setShowModal(false);
    resetForm();
    setIsSubmitting(false);
  };
  
  
  return (
    <MainLayout>
      <div className=" bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Sesi Waktu Perkuliahan</h1>
          <p className="text-gray-600 mt-2">Data alokasi waktu perkuliahan sebagai komponen penjadwalan</p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
          >
            <Plus size={18} />
            Tambah Sesi Waktu
          </button>

          <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
           
              <input
                className="
                block w-full
                pl-10 pr-4 py-2.5
                border border-gray-300
                rounded-lg
                bg-white
                placeholder-gray-500
                text-gray-900
                focus:border-green-500
                focus:outline-none
                transition "
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari Sesi Waktu..."  />
                </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Data Sesi Waktu</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
              <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Sesi</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jam Mulai</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jam Sellesai</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipe</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
              ) : filteredData.length ? filteredData.map(row => (
                <tr key={row.id} >
                      <td className="py-4 px-6">{row.nama}</td>
                      <td className="py-4 px-6">
                      {row.jamMulai || "-"}
                      </td>

                      <td className="py-4 px-6">
                      {row.jamSelesai || "-"}
                      </td>
                    <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                      ${
                        row.slotMalam
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {row.slotMalam ? "Malam" : "Siang"}
                    </span>
                  </td>
                      <td className="py-4 px-6 flex gap-2">
                        <button onClick={() => handleEdit(row)}      title="Edit" className="text-blue-600"><Edit size={16} /></button>
                        <button
                          onClick={() => {
                            setSelectedItem(row);
                            handleDelete();
                          }}
                          title="Hapus"
                          className="text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>

                      </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="py-8 text-center text-gray-500">Tidak ada data sesi perkuliahan</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Table Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Menampilkan <span className="font-semibold">{filteredData.length}</span> data dari <span className="font-semibold">{data.length}</span> sesi perkuliahan
              </div>
            </div>
          </div>
        </div>
        {/* Modal Tambah/Edit */}
        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold">
                  {selectedItem ? "Edit Slot Waktu" : "Tambah Slot Waktu"}
                </h3>
                <button onClick={closeModal}>
                  <X size={18}/>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Sesi</label>
                  <input
                    name="nama"
                    placeholder="Masukan nama sesi"
                    value={formData.nama}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* Jam Mulai */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Jam Mulai</label>
                      <div className="flex gap-2">
                        <select
                          value={formData.jamMulaiJam}
                          onChange={e =>
                            setFormData({ ...formData, jamMulaiJam: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Jam</option>
                          {jamList.map(j => (
                            <option key={j} value={j}>{j}</option>
                          ))}
                        </select>

                        <select
                          value={formData.jamMulaiMenit}
                          onChange={e =>
                            setFormData({ ...formData, jamMulaiMenit: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Menit</option>
                          {menitList.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Jam Selesai */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Jam Selesai</label>
                      <div className="flex gap-2">
                        <select
                          value={formData.jamSelesaiJam}
                          onChange={e =>
                            setFormData({ ...formData, jamSelesaiJam: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Jam</option>
                          {jamList.map(j => (
                            <option key={j} value={j}>{j}</option>
                          ))}
                        </select>

                        <select
                          value={formData.jamSelesaiMenit}
                          onChange={e =>
                            setFormData({ ...formData, jamSelesaiMenit: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Menit</option>
                          {menitList.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={formData.slotMalam}
                      onChange={(e) =>
                        setFormData({ ...formData, slotMalam: e.target.checked })
                      }
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Tandai sebagai sesi malam
                    </label>
                
                  </div>
                  </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200 rounded"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 text-white rounded"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


      </div>
      <ConfirmModal
      open={confirmModal.open}
      title={confirmModal.title}
      message={confirmModal.message}
      type={confirmModal.type}
      onClose={() =>
        setConfirmModal({ ...confirmModal, open: false })
      }
      onConfirm={
        confirmModal.type === "delete"
          ? confirmDelete
          : () => setConfirmModal({ ...confirmModal, open: false })
      }
    />
    </MainLayout>
  );
}

export default SlotWaktu;
