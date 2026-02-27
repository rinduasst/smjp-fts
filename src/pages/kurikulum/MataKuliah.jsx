import { useEffect, useState } from "react";
import MainLayout from "../../components/MainLayout";
import { Search, Plus, Edit, Trash2, X, Loader2} from "lucide-react";
import api from "../../api/api";
import { useAuth } from "../../hooks/useAuth";


function MataKuliah() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    kode: "",
    nama: "",
    sks: "",
    jenis: "WAJIB"
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      const res = await api.get(
        `/api/kurikulum/mata-kuliah?q=${search}&page=${page}&pageSize=${pageSize}`
      );
  
      const responseData = res.data?.data;
  
      setData(responseData?.items || []);
      setTotal(responseData?.total || 0);
    } catch (err) {
      console.error("Gagal fetch mata kuliah", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [page, search]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.kode.trim()) errors.kode = "Kode wajib diisi";
    if (!formData.nama.trim()) errors.nama = "Nama wajib diisi";
    if (!formData.sks) errors.sks = "SKS wajib diisi";
    return errors;
  };

  const resetForm = () => {
    setFormData({
      kode: "",
      nama: "",
      sks: "",
      jenis: "WAJIB"
    });
    setFormErrors({});
    setSelected(null);
  };

  const handleEdit = (row) => {
    setSelected(row);
    setFormData({
      kode: row.kode,
      nama: row.nama,
      sks: row.sks,
      jenis: row.jenis
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        kode: formData.kode.toUpperCase().trim(),
        nama: formData.nama.trim(),
        sks: Number(formData.sks),
        jenis: formData.jenis
      };

      if (selected) {
        await api.put(`/api/kurikulum/mata-kuliah/${selected.id}`, payload);
      } else {
        await api.post("/api/kurikulum/mata-kuliah", payload);
      }

      await fetchData();
      setShowModal(false);
      resetForm();
      alert("Data berhasil disimpan");
    }  catch (err) {
      console.error(err);
    
      const status = err.response?.status;
      const message = err.response?.data?.message;
    
      if (status === 400 || status === 409) {
        alert(
          message ||
          "Mata kuliah dengan kode atau nama tersebut sudah terdaftar"
        );
      } else {
        alert("Gagal menyimpan data. Silakan coba lagi.");
      }
    }
  };
    

  const handleDelete = async (row) => {
    if (!row) return;
  
    const ok = window.confirm(
      `Yakin ingin menghapus mata kuliah "${row.kode} - ${row.nama}"?`
    );
  
    if (!ok) return;
  
    try {
      setIsSubmitting(true);
  
      await api.delete(`/api/kurikulum/mata-kuliah/${row.id}`);
  
      await fetchData();
      alert("Data berhasil dihapus");
    } catch (err) {
      console.error(err);
  
      const status = err.response?.status;
      const message = err.response?.data?.message;
  
      if (status === 400 || status === 409) {
        alert(
          message ||
          "Mata kuliah tidak dapat dihapus karena sudah digunakan pada kurikulum atau jadwal."
        );
      } else {
        alert("Gagal menghapus data. Silakan coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const { user,peran } = useAuth();



  
  return (
    <MainLayout>
 <div className=" bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Data Mata Kuliah</h1>
          <p className="text-gray-600 mt-2">Daftar Data mata kuliah pada program studi</p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
          >
            <Plus size={18} />
            Tambah Mata Kuliah
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
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                placeholder="Cari Mata Kuliah..."  />
                </div>
        </div>


        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold">Daftar Mata Kuliah</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Kode</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Mata Kuliah</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">SKS</th>
                  <th className="py-4 text-left text-xs font-semibold text-gray-500 uppercase">Jenis Mata Kuliah</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                 <td colSpan="5" className="py-8 text-center">
                      <Loader2 className="animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : data.length ? (
                  data.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{row.kode}</td>
                      <td className="px-6 py-4">{row.nama}</td>
                      <td className="px-6 py-4">{row.sks}</td>
                      <td className="px-6 py-4 ">
                      <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                      ${
                        row.jenis === "WAJIB"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {row.jenis}
                    </span>

                      </td>
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
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
         {/* Table Footer */}
         <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-700">
              Menampilkan {(page - 1) * pageSize + 1} -{" "}
              {Math.min(page * pageSize, total)} dari {total} mata kuliah
            </div>
            <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-gray-200 rounded"
            >
               Prev
            </button>

            <button
              disabled={page * pageSize >= total}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Next 
            </button>
          </div>
          </div>
            </div>
          </div>


        {/* MODAL TAMBAH / EDIT */}
        {showModal && (
           <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg w-full max-w-lg">
               {/* Header */}
               <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                 <h3 className="text-lg font-semibold text-gray-900">
                  {selected ? "Edit" : "Tambah"} Mata Kuliah
                </h3>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500">
                  <X />
                </button>
              </div>
              {/* MODAL TAMBAH / EDIT MATA KULIAH */}


      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
        {/* Kode Mata Kuliah */}
        {peran === "TU_PRODI" && (
        <div className="mb-4 text-sm text-gray-600">
          Prodi: <strong>{user?.nama}</strong>
        </div>
      )}


        <div>
          <label className="block text-sm font-medium text-gray-700">
            Kode Mata Kuliah
          </label>
          <input
            type="text"
            name="kode"
            placeholder="Masukan kode mata kuliah"
            value={formData.kode}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-100 rounded 
                       focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Nama Mata Kuliah */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nama Mata Kuliah 
          </label>
          <input
            type="text"
            name="nama"
            value={formData.nama}
            onChange={handleInputChange}
            placeholder="Masukan Nama Mata Kuliah"
            className="w-full px-3 py-2 bg-gray-100 rounded 
                       focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* SKS */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            SKS
          </label>
          <input
            type="number"
            name="sks"
            value={formData.sks}
            onChange={handleInputChange}
            placeholder="Masukan SKS Mata Kuliah"
            className="w-full px-3 py-2 bg-gray-100 rounded 
                       focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Jenis Mata Kuliah */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Jenis Mata Kuliah
          </label>
          <select
            name="jenis"
            value={formData.jenis}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-100 rounded 
                       focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="WAJIB">Wajib</option>
            <option value="PILIHAN">Pilihan</option>
          </select>
        </div>

        {/* Tombol */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
            className="px-4 py-2  rounded bg-gray-200 
                       hover:bg-gray-300 transition"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded 
                       hover:bg-green-700 transition"
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

export default MataKuliah;
