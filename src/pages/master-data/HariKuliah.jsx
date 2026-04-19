import { useState, useEffect } from "react";
import MainLayout from "../../components/MainLayout";
import { Search, Plus, Edit, Trash2, X, Loader2 } from "lucide-react";
import api from "../../api/api";

function HariKuliah() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedHari, setSelectedHari] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    nama: "",
    urutan: ""
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchHari = async () => {
    try {
      const res = await api.get("/api/master-data/hari");

      const items =
        res.data?.data?.data ||
        res.data?.data ||
        [];

      setData(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Gagal fetch hari:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHari();
  }, []);


  const filteredData = data
    .filter(item =>
      item.nama?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.urutan - b.urutan);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nama.trim()) errors.nama = "Nama hari wajib diisi";
    if (!formData.urutan) errors.urutan = "Nomer Hari wajib diisi";
    return errors;
  };

  const resetForm = () => {
    setFormData({
      nama: "",
      urutan: ""
    });
    setFormErrors({});
    setSelectedHari(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
  
    const urutanNumber = parseInt(formData.urutan);
  
    console.log("DATA:", data);
    const isDuplicate = data.some(
      d => d.urutan === urutanNumber && d.id !== selectedHari?.id
    );
  
    if (isDuplicate) {
      alert("Nomer Hari sudah digunakan!");
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const payload = {
        nama: formData.nama.trim(),
        urutan: urutanNumber
      };
  
      if (selectedHari) {
        await api.patch(`/api/master-data/hari/${selectedHari.id}`, payload);
        alert("Hari berhasil diperbarui!");
      } else {
        await api.post("/api/master-data/hari", payload);
        alert("Hari berhasil ditambahkan!");
      }
  
      await fetchHari();
      resetForm();
      setShowModal(false);
  
    } catch (error) {
      console.log("ERROR DETAIL:", error.response?.data);
      alert(error.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleEdit = (hari) => {
    setSelectedHari(hari);
    setFormData({
      nama: hari.nama || "",
      urutan: hari.urutan || ""
    });
    setShowModal(true);
  };
  const handleDelete = async (hari) => {
    const ok = window.confirm(`Yakin ingin menghapus "${hari.nama}"?`);
    if (!ok) return;

    try {
      setIsSubmitting(true);
      await api.delete(`/api/master-data/hari/${hari.id}`);
      await fetchHari();
      alert("Hari berhasil dihapus!");
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
     <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Data Hari Kuliah </h1>
          <p className="text-gray-600 mt-2">Daftar hari aktif dalam sistem penjadwalan </p>
        </div>
        

        {/* ACTION BAR */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg"
          >
            <Plus size={18} />
            Tambah Hari
          </button>

          <div className="relative max-w-sm w-full">
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
              placeholder="Cari hari..."
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Hari Perkuliahan</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-4 text-left text-xs">No</th>
                <th className="px-6 py-4 text-left text-xs">Nama</th>
                <th className="px-6 py-4 text-left text-xs">Hari ke-</th>
                <th className="px-6 py-4 text-left text-xs">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="4" className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((row, i) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{i + 1}</td>
                    <td className="px-6 py-4">{row.nama}</td>
                    <td className="px-6 py-4">{row.urutan}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => handleEdit(row)} className="text-blue-600">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(row)} className="text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="text-center py-6 text-gray-500">Tidak ada data</td></tr>
              )}
            </tbody>
          </table>

          {/* FOOTER */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Menampilkan <span className="font-semibold">{filteredData.length}</span> dari <span className="font-semibold">{data.length}</span> hari
        </div>
        </div>
        </div>
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                  {selectedHari ? "Edit Hari" : "Tambah Hari"}
                </h3>
                <button onClick={() => { setShowModal(false); resetForm(); }}>
                  <X />
                </button>
              </div>
              

              <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                 Nama Hari
                </label>
                <input
                  name="nama"
                  value={formData.nama}
                  onChange={handleInputChange}
                  placeholder="Nama Hari"
                  className="w-full px-3  py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div>
                <label className="block text-sm font-medium text-gray-700 p-2">
                  Hari ke-
                </label>
                <input
                  type="number"
                  name="urutan"
                  value={formData.urutan}
                  onChange={handleInputChange}
                  placeholder="Contoh: 1 untuk Senin"
                  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
                    {isSubmitting ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
              
            </div>
          </div>
        )}
      </div>
      </div>
    </MainLayout>
  );
}

export default HariKuliah;