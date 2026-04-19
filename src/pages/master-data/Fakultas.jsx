import { useState, useEffect } from "react";
import MainLayout from "../../components/MainLayout";
import { Search, Plus, Edit, Trash2, X, Loader2 } from "lucide-react";
import api from "../../api/api"; 

function Fakultas() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFakultas, setSelectedFakultas] = useState(null);
  
  const [formData, setFormData] = useState({
    kode: "",
    nama: "",
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchFakultas = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/master-data/fakultas");
      setData(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Gagal fetch fakultas:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  

  // Filter data berdasarkan search term
  const filteredData = Array.isArray(data)
  ? data.filter(item =>
      item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  : [];


  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.kode.trim()) {
      errors.kode = "Kode fakultas wajib diisi";
    } else if (formData.kode.length > 10) {
      errors.kode = "Kode maksimal 10 karakter";
    }
    
    if (!formData.nama.trim()) {
      errors.nama = "Nama fakultas wajib diisi";
    }
    
   
    return errors;
  };

  // Handle form submit (Add)
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
        kode: formData.kode.toUpperCase(),
        nama: formData.nama,
      };
      
      
      if (selectedFakultas) {
        // Edit existing fakultas
        await api.patch(`/api/master-data/fakultas/${selectedFakultas.id}`, payload);
        alert("Fakultas berhasil diperbarui!");
      } else {
        // Add new fakultas
        await api.post("/api/master-data/fakultas", payload);
        alert("Fakultas berhasil ditambahkan!");
      }
      
      // Refresh data
      await fetchFakultas();
      
      // Reset form dan tutup modal
      resetForm();
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedFakultas(null);
      
    }  catch (error) {
      console.error("Gagal menyimpan fakultas:", error);
    
      const message =
        error.response?.data?.message || "Terjadi kesalahan";
    
      if (error.response?.status === 400) {
        alert("Kode atau nama fakultas sudah terdaftar!");
      } else {
        alert("Gagal menyimpan fakultas. Silakan coba lagi.");
      }
    
      // buat tutup modal dan reset
      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
    }
  };    

  // Handle Edit
  const handleEdit = (fakultas) => {
    setSelectedFakultas(fakultas);
    setFormData({
      kode: fakultas.kode || "",
      nama: fakultas.nama || ""
    });
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    if (!selectedFakultas) return;
  
    const ok = window.confirm(
      `Yakin ingin menghapus fakultas "${selectedFakultas.nama}"?`
    );
  
    if (!ok) return;
  
    try {
      setIsSubmitting(true);
      await api.delete(`/api/master-data/fakultas/${selectedFakultas.id}`);
      await fetchFakultas();
      alert("Fakultas berhasil dihapus!");
      setSelectedFakultas(null);
    } catch (error) {
      console.error("Gagal menghapus fakultas:", error);
      alert("Gagal menghapus fakultas. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };
  

  // Reset form
  const resetForm = () => {
    setFormData({
      kode: "",
      nama: ""
    });
    setFormErrors({});
    setSelectedFakultas(null);
  };

  useEffect(() => {
    fetchFakultas();
  }, []);
  return (
    <MainLayout>
      <div className=" bg-gray-50 min-h-screen">
        {/* Header Section */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Data Fakultas</h1>
          <p className="text-gray-600 mt-2">Data fakultas dalam Sistem Manajemen Jadwal Perkuliahan</p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <button 
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
              >
                <Plus size={18} />
                Tambah Fakultas
              </button>
            </div>

            {/* Right Side - Search & Filter */}
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
                  placeholder="Cari fakultas..."
                   />
              </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Fakultas</h3>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Kode
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nama Fakultas
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                
                {Array.isArray(filteredData) && filteredData.length > 0 ? (
                  filteredData.map((row, i) => (
                    <tr 
                      key={i} 
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="">
                          {row.kode || "-"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className=" ">{row.nama}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleEdit(row)}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 p-1.5 rounded-lg hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedFakultas(row);
                              handleDelete();
                            }}
                            
                            className="text-red-600 hover:text-red-800 transition-colors duration-200 p-1.5 rounded-lg hover:bg-red-50"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 px-6 text-center">
                      {loading ? (
                        <div className="flex justify-center">
                        <Loader2 className="animate-spin mx-auto" />
                      </div>
                      ) : searchTerm ? (
                        `Tidak ditemukan fakultas dengan kata kunci "${searchTerm}"`
                      ) : (
                        "Tidak ada data fakultas"
                      )}
                    </td>
                  </tr>
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

        {/* Modal Tambah/Edit Fakultas */}
        {(showAddModal || showEditModal) && (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg w-full max-w-lg">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {selectedFakultas ? "Edit Fakultas" : "Tambah Fakultas"}
        </h3>
        <button
          onClick={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            resetForm();
          }}
          className="text-gray-500"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
        
        {/* Kode Fakultas */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Kode Fakultas
          </label>
          <input
            type="text"
            name="kode"
            value={formData.kode}
            onChange={handleInputChange}
            placeholder="Masukan Kode Fakultas"
            className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Nama Fakultas */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nama Fakultas
          </label>
          <input
            type="text"
            name="nama"
            value={formData.nama}
            onChange={handleInputChange}
            placeholder="Masukan Nama Fakultas "
            className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Tombol */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              resetForm();
            }}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
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

export default Fakultas;