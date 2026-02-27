import { useState, useEffect } from "react";
import MainLayout from "../../components/MainLayout";
import { Search, Plus, Edit, Trash2, X, Loader2 } from "lucide-react";
import api from "../../api/api";

function ProgramStudi() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProdi, setSelectedProdi] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    kode: "",
    nama: "",
    fakultas_id: "",
    jenjang: "S1"
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fakultasList, setFakultasList] = useState([]);

  // Fetch data
  const fetchProdi = async () => {
    try {
      const res = await api.get("/api/master-data/prodi");
  
      const items =
        res.data?.data?.items ||

        [];
  
      setData(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Gagal fetch prodi:", err);
      setData([]);
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
  
  useEffect(() => {
    fetchProdi();
    fetchFakultas();
  }, []);

  const filteredData = data.filter(item => 
    item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kode?.toLowerCase().includes(searchTerm.toLowerCase()) 
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: "" }));
  };
  
  const validateForm = () => {
    const errors = {};
    if (!formData.kode.trim()) errors.kode = "Kode program studi wajib diisi";
    else if (formData.kode.length > 10) errors.kode = "Kode maksimal 10 karakter";
    if (!formData.nama.trim()) errors.nama = "Nama program studi wajib diisi";
    if (!formData.fakultas_id) errors.fakultas_id = "Fakultas wajib dipilih";
    return errors;
  };
  const resetForm = () => {
    setFormData({
      kode: "",
      nama: "",
      fakultas_id: "",
      jenjang: "S1"
    });
    setFormErrors({});
    setSelectedProdi(null);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const payload = {
        fakultasId: formData.fakultas_id,
        nama: formData.nama.trim(),
        kode: formData.kode.toUpperCase().trim(),
        jenjang: formData.jenjang,
      };
  
      if (selectedProdi) {
        await api.patch(`/api/master-data/prodi/${selectedProdi.id}`, payload);
        alert("Program studi berhasil diperbarui!");
      } else {
        await api.post("/api/master-data/prodi", payload);
        alert("Program studi berhasil ditambahkan!");
      }
  
  
    await fetchProdi();
    resetForm();
    setShowModal(false);
  } catch (error) {
      console.error(error);
  

      if (error.response && error.response.status === 400) {
        // backend biasanya kasih pesan error di response.data.message
        const msg = error.response.data?.message || "Kode atau Nama program studi sudah ada";
        alert(msg);
      } else {
        alert("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  
  const handleEdit = (prodi) => {
    setSelectedProdi(prodi);
    setFormData({
      kode: prodi.kode || "",
      nama: prodi.nama || "",
      fakultas_id: prodi.fakultas_id || "",
      jenjang: prodi.jenjang || "S1"
    });
    setShowModal(true);
  };
  
  const handleDelete = async (prodi) => {
    const ok = window.confirm(
      `Yakin ingin menghapus Program Studi "${prodi.nama}"?`
    );
  
    if (!ok) return;
  
    try {
      setIsSubmitting(true);
      await api.delete(`/api/master-data/prodi/${prodi.id}`);
      await fetchProdi();
      alert("Program studi berhasil dihapus!");
    } catch (error) {
      console.error("Gagal hapus prodi:", error);
      alert("Gagal menghapus program studi. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };
  


  return (
    <MainLayout>
      <div className=" bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Data Program Studi</h1>
          <p className="text-gray-600 mt-2">Daftar program studi pada fakultas   </p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
          >
            <Plus size={18} />
            Tambah Prodi
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
                placeholder="Cari Program Studi..."  />
                </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Program Studi</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kode</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Prodi</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fakultas</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jenjang</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="7" className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 ">
                      <td className="py-4 px-6">{row.kode || "N/A"}</td>
                      <td className="py-4 px-6">{row.nama}</td>
                      <td className="py-4 px-6">{row.fakultas?.nama || "-"}</td>
                      <td className="py-4 px-6">{row.jenjang || "S1"}</td>  
                      <td className="py-4 px-6 flex gap-2">
                        <button onClick={() => handleEdit(row)} className="text-blue-600" title="Edit"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(row)} className="text-red-600" 
                        title="Hapus"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" className="py-8 text-center text-gray-500">Tidak ada data program studi</td></tr>
                )}
              </tbody>
            </table>
          </div>
             {/* Table Footer */}
             <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Menampilkan <span className="font-semibold">{filteredData.length}</span> dari <span className="font-semibold">{data.length}</span> fakultas
              </div>
            </div>
          </div>
        </div>
      
        
    

    {/* Modal Tambah/Edit */}
    {showModal && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedProdi ? "Edit Program Studi" : "Tambah Program Studi"}
            </h3>
            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500">
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {/* Kode Prodi */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Kode Program Studi </label>
              <input
                type="text"
                name="kode"
                value={formData.kode}
                onChange={handleInputChange}
                placeholder="Masukan Kode Prodi "
                className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Nama Prodi */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Program Studi</label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleInputChange}
                placeholder="Masukan Nama Prodi "
                className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Fakultas */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Fakultas </label>
              <select
                name="fakultas_id"
                value={formData.fakultas_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Pilih Fakultas</option>
                {fakultasList.map(f => (
                  <option key={f.id} value={f.id}> 
                    {/* Pastikan f.id  number, bukan string */}
                    {f.nama} ({f.kode})
                  </option>
                ))}
              </select>
            </div>

            {/* Jenjang */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Jenjang</label>
              <select
                name="jenjang"
                value={formData.jenjang}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {["S1"].map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>

            {/* Tombol */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2  rounded bg-gray-200 hover:bg-gray-300 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      </div>
    </MainLayout>
  );
}

export default ProgramStudi;
