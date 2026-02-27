import { useState, useEffect } from "react";
import MainLayout from "../../components/MainLayout";
import { Search, Plus, Edit, Trash2, X, Loader2, Eye } from "lucide-react";
import api from "../../api/api";

function PreferensiDosen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dosenList, setDosenList] = useState([]);
  const [hariList, setHariList] = useState([]);
  const [slotList, setSlotList] = useState([]);  
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [formData, setFormData] = useState({
    dosenId: "",
    hariId: "",
    slotWaktuId: "",
    bolehMengajar: true,
    prioritas: 1,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ================= FETCH ================= */
  const fetchData = async () => {
    try {
      const res = await api.get("/api/pengajaran/preferensi-dosen");
      setData(res.data?.data?.items || []);
    } catch (err) {
      console.error("Gagal fetch preferensi:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaster = async () => {
  try {
    const [dosenRes, hariRes, slotRes] = await Promise.all([
      api.get("/api/master-data/dosen"),
      api.get("/api/master-data/hari"),
      api.get("/api/master-data/slot-waktu"),
    ]);

    setDosenList(dosenRes.data?.data?.items || []);
    setHariList(hariRes.data?.data|| []);
    setSlotList(slotRes.data?.data.items || []);
  } catch (err) {
    console.error("Gagal fetch master:", err);
  }
};

  useEffect(() => {
    fetchData();
    fetchMaster();
  }, []);

  const filteredData = data.filter(item =>
    item.dosen?.nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      dosenId: "",
      hariId: "",
      slotWaktuId: "",
      bolehMengajar: true,
      prioritas: 1,
    });
    setSelectedItem(null);
  };

  const handleEdit = (row) => {
    setSelectedItem(row);
    setFormData({
      dosenId: row.dosenId,
      hariId: row.hariId,
      slotWaktuId: row.slotWaktuId,
      bolehMengajar: row.bolehMengajar,
      prioritas: row.prioritas,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        prioritas: Number(formData.prioritas),
      };

      if (selectedItem) {
        await api.patch(
          `/api/pengajaran/preferensi-dosen/${selectedItem.id}`,
          payload
        );
      } else {
        await api.post("/api/pengajaran/preferensi-dosen", payload);
      }

      await fetchData();
      resetForm();
      setShowModal(false);
    } catch (err) {
      console.error("Gagal simpan:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (row) => {
    setSelectedItem(row);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/api/pengajaran/preferensi-dosen/${selectedItem.id}`);
      await fetchData();
      setShowDeleteModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error("Gagal hapus:", err);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <MainLayout>
      <div className=" bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Preferensi Dosen</h1>
          <p className="text-gray-600 mt-2">
          Pengaturan preferensi waktu dan ketersediaan dosen dalam proses penjadwalan
          </p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition font-medium"
          >
            <Plus size={18} />
            Tambah Preferensi
          </button>

          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari dosen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Daftar Preferensi Dosen
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase">Dosen</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase">Hari</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase"> Waktu</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase">Prioritas</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase">Status Mengajar</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center">
                      <Loader2 className="animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">{row.dosen?.nama}</td>
                      <td className="py-4 px-6">{row.hari?.nama}</td>
                      <td className="py-4 px-6">
                      
                      {row.slotWaktu?.jamMulai
                        ? new Date(row.slotWaktu.jamMulai).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Jakarta",
                          })
                        : "-"}
                      {" - "}
                      {row.slotWaktu?.jamSelesai
                        ? new Date(row.slotWaktu.jamSelesai).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Jakarta",
                          })
                        : "-"}
                      
                    </td>
                      <td className="py-4 px-6">{row.prioritas}</td>
                      <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                        ${row.bolehMengajar
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"}`}
                      >
                       
                        {row.bolehMengajar ? "Diizinkan" : "Tidak Diizinkan"}
                      </span>
                    </td>

                      <td className="py-4 px-6 flex gap-2">
                        <button onClick={() => handleEdit(row)} title="Edit" className="text-blue-600">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => confirmDelete(row)} title="Hapus" className="text-red-600">
                          <Trash2 size={16} />
                        </button>
                        <button
                       onClick={() => {
                        setSelectedItem(row);
                        setShowDetail(true);
                      }}
                        className="text-green-600 hover:text-green-800"
                        title="Detail"
                        >
                        <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      Tidak ada data preferensi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4  bg-gray-50 text-sm text-gray-700">
            Menampilkan <b>{filteredData.length}</b> dari <b>{data.length}</b> data
          </div>
        </div>

        {/* Modal Tambah/Edit */}
    {showModal && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedItem ? "Edit Preferensi" : "Tambah Preferensi"}
                </h3>
                <button onClick={() => { setShowModal(false); resetForm(); }}>
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">

              {/* Dosen */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dosen
                </label>
                <select
                  value={formData.dosenId}
                  onChange={(e) =>
                    setFormData({ ...formData, dosenId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-100 rounded
                            focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Pilih Dosen</option>
                  {dosenList.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hari */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Hari
                </label>
                <select
                  value={formData.hariId}
                  onChange={(e) =>
                    setFormData({ ...formData, hariId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-100 rounded
                            focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Pilih Hari</option>
                  {hariList.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Slot Waktu */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Slot Waktu
                </label>
                <select
                value={formData.slotWaktuId}
                onChange={(e) =>
                  setFormData({ ...formData, slotWaktuId: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-100 rounded
                          focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Pilih Slot Waktu</option>

                {slotList.map(s => (
                  <option key={s.id} value={s.id}>
                   {s.nama} (
                    {new Date(s.jamMulai).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Jakarta",
                    })}
                    {" - "}
                    {new Date(s.jamSelesai).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Jakarta",
                    })}
                  )
                  </option>
                ))}
              </select>
              </div>

              {/* Prioritas */}
              <div>
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                Prioritas
              </label>

              <select
                value={formData.prioritas}
                onChange={(e) =>
                  setFormData({ ...formData, prioritas: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-gray-100 rounded
                          focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Pilih Prioritas</option>

                {[...Array(10)].map((_, i) => {
                  const value = i + 1;
                  return (
                    <option key={value} value={value}>
                       {value}
                    </option>
                  );
                })}
              </select>

              <p className="mt-1 text-xs text-gray-500 italic">
                Contoh: Prioritas 1 lebih diutamakan dibanding prioritas 10.
              </p>

              <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
                <b>Catatan:</b>
                <ul className="list-disc ml-4 mt-1 space-y-1">
                  <li>Rentang nilai prioritas adalah 1 – 10.</li>
                  <li>Semakin kecil nilainya, semakin diprioritaskan dalam proses penjadwalan.</li>
                  <li>Nilai tinggi berarti preferensi bersifat fleksibel.</li>
                  <li>Sistem tetap menyesuaikan dengan ketersediaan ruang, jadwal dosen lain, dan aturan akademik.</li>
                </ul>
              </div>
              </div>

              <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Mengajar
            </label>
            <select
              value={formData.bolehMengajar ? "1" : "0"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bolehMengajar: e.target.value === "1",
                })
              }
              className="w-full px-3 py-2 bg-gray-100 rounded
                        focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="1">Diizinkan</option>
              <option value="0">Tidak Diizinkan</option>
            </select>
          </div>

              {/* Tombol */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>

            </form>


            </div>
          </div>
        )}

        {/* Modal Hapus */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 rounded-md w-full max-w-sm">
              <p className="mb-4">Anda yakin mau menghapus data ini?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowDeleteModal(false)} className="px-3 py-1 bg-gray-200 rounded">
                  Batal
                </button>
                <button onClick={handleDelete} className="px-3 py-1 bg-red-600 text-white rounded">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
        {showDetail && selectedItem && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-xl">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Detail Preferensi Dosen</h3>
              <button onClick={() => setShowDetail(false)}>
                <X />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 grid grid-cols-2 gap-4 text-sm">

              <div>
                <p className="text-gray-500">Dosen</p>
                <p className="font-medium">{selectedItem.dosen?.nama}</p>
              </div>

              <div>
                <p className="text-gray-500">Hari</p>
                <p className="font-medium">{selectedItem.hari?.nama}</p>
              </div>

              <div>
                <p className="text-gray-500">Slot Waktu</p>
                <p className="font-medium">
                  {selectedItem.slotWaktu?.nama}
                  <span className="text-xs text-gray-500 ml-1">
                    ({selectedItem.slotWaktu?.jamMulai?.slice(11,16)} - {selectedItem.slotWaktu?.jamSelesai?.slice(11,16)})
                  </span>
                </p>
              </div>

              <div>
                <p className="text-gray-500">Durasi</p>
                <p className="font-medium">
                  {selectedItem.slotWaktu?.durasiMenit} menit
                </p>
              </div>

              <div>
                <p className="text-gray-500">Prioritas</p>
                <p className="font-medium">{selectedItem.prioritas}</p>
              </div>

              <div>
                <p className="text-gray-500">Status Mengajar</p>
                <span
                  className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold
                    ${selectedItem.bolehMengajar
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"}`}
                >
                  {selectedItem.bolehMengajar ? "Diizinkan" : "Tidak Diizinkan"}
                </span>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-white">
              <button
                onClick={() => setShowDetail(false)}
                className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}


      </div>
    </MainLayout>
  );
}

export default PreferensiDosen;
