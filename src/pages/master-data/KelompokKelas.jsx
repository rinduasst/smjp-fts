import { useState, useEffect } from "react";
import MainLayout from "../../components/MainLayout";
import { Search, Plus, Edit, Trash2, X, Loader2} from "lucide-react";
import api from "../../api/api";
import { useAuth } from "../../hooks/useAuth";

function KelompokKelas() {
  const [data, setData] = useState([]);
  const [prodiList, setProdiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterProdi, setFilterProdi] = useState("");
  const [formData, setFormData] = useState({
    kode: "",
    angkatan: "",
    prodiId: "",
    kapasitas: "",
    jenisKelas:""
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50); 
  const [totalData, setTotalData] = useState(0);
  const [filterJenis, setFilterJenis] = useState("");
  const [filterAngkatan, setFilterAngkatan] = useState("");

  const fetchKelompokKelas = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/master-data/kelompok-kelas", {
        params: {
          page,
          pageSize,
          q: searchTerm,
          prodiId: filterProdi || undefined,
          jenisKelas: filterJenis || undefined,
          angkatan: filterAngkatan || undefined, 
        }
      });
      setData(res.data.data.items);
      setTotalData(res.data.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKelompokKelas();
  }, [page, searchTerm, filterProdi, filterJenis, filterAngkatan]);

  const fetchProdi = async () => {
    try {
      const res = await api.get("/api/master-data/prodi");
  
      const items =
        res.data?.data?.items ||
        [];
  
      setProdiList(items);
  
    } catch (err) {
      console.error("Error fetch prodi:", err);
    }
  };
  useEffect(() => {
    fetchProdi();
  }, []);


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.kode.trim()) errors.kode = "Kode kelas wajib diisi";
    if (!formData.angkatan) errors.angkatan = "Angkatan wajib diisi";
    if (!formData.prodiId) errors.prodiId = "Program studi wajib dipilih";
    if (!formData.kapasitas) errors.kapasitas = "Kapasitas wajib diisi";
    return errors;
  };

  const resetForm = () => {
    setFormData({
      kode: "",
      angkatan: "",
      prodiId: peran === "TU_PRODI" ? user?.prodiId || "" : "",
      kapasitas: ""
    });
    setFormErrors({});
    setSelected(null);
  };

  const handleEdit = (row) => {
    setSelected(row);
    setFormData({
      kode: row.kode,
      angkatan: row.angkatan,
      prodiId:
        peran === "TU_PRODI"
          ? user?.prodiId
          : row.prodiId,
      kapasitas: row.kapasitas,
      jenisKelas: row.jenisKelas
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
        angkatan: Number(formData.angkatan),
        ...(peran === "TU_PRODI"
        ?{ prodiId: user?.prodiId }
        :{ prodiId: formData.prodiId}),
        kapasitas: Number(formData.kapasitas),
        jenisKelas: formData.jenisKelas
      };



      if (selected) {
        await api.patch(
          `/api/master-data/kelompok-kelas/${selected.id}`,
          payload
        );
      } else {
        await api.post("/api/master-data/kelompok-kelas", payload);
      }

      await fetchKelompokKelas();
      setShowModal(false);
      resetForm();
      alert("Data berhasil disimpan");
    } catch (err) {
      console.error(err);
      alert("Kelas dengan kode, angkatan, dan program studi tersebut sudah terdaftar");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDelete = async () => {
    if (!selected) return;
    const ok = window.confirm(
      `Yakin ingin menghapus kelas "${selected.kode} Angkatan ${selected.angkatan}"?`
    );
    if (!ok) return;
    try {
      setIsSubmitting(true);
  
      await api.delete(`/api/master-data/kelompok-kelas/${selected.id}`);
      await fetchKelompokKelas();
  
      alert("Data berhasil dihapus");
      setShowDeleteModal(false);
      setSelected(null);
    } catch (err) {
      console.error(err);
  
      const status = err.response?.status;
      const message = err.response?.data?.message;
  
      if (status === 400 || status === 409) {
        alert(
          message ||
          "Kelas tidak dapat dihapus karena sudah digunakan pada jadwal atau penugasan."
        );
      } else {
        alert("Gagal menghapus data. Silakan coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const { user, peran } = useAuth();


  return (
    <MainLayout>
        <div className=" bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900"> 
            Data Kelas
        </h1>
          <p className="text-gray-600 mt-2">Kelola Data Kelpompok Kelas Berdasaekan Program Studi</p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <button
           onClick={() => {
            resetForm();
          
            if (peran === "TU_PRODI" && user?.prodiId) {
              setFormData((prev) => ({
                ...prev,
                prodiId: user.prodiId
              }));
            }
          
            setShowModal(true);
          }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
          >
            <Plus size={18} />
            Tambah Kelas
          </button>

            {/* Right */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

        {/* Filter Angkatan */}
        <select
            value={filterAngkatan}
            onChange={(e) => {
              setFilterAngkatan(e.target.value);
              setPage(1);
            }}
            className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
          >
            <option value="">Tahun</option>
            {Array.from({ length: 6}, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
          {/* Filter jenis */}
       <select className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
            value={filterJenis}
            onChange={(e) => {
              setFilterJenis(e.target.value);
              setPage(1);
            }}>
           
            <option value="">Semua Jenis</option>
            <option value="REGULER">REGULER</option>
            <option value="KARYAWAN">KARYAWAN</option>
          </select>
            {/* Filter prodi */}
            {peran !== "TU_PRODI" && (
             <select className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              value={filterProdi}
              onChange={(e) => {
                setFilterProdi(e.target.value);
                setPage(1);
              }}
             
           >
              <option value="">Semua Prodi</option>
               {prodiList.map((prodi) => (
              <option key={prodi.id} value={prodi.id}>
                {prodi.nama}
              </option>
            ))}
            </select>
            )}
                <div className="relative w-full sm:max-w-sm">
            
            <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari Kelas..."  />
                </div>
                </div>
       
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Kelompok Kelas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jenis</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tahun</th>
                  {peran !== "TU_PRODI" && (
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Program Studi</th>)}
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">kapasitas</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
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
                     <td className="py-4 px-6">{row.jenisKelas}</td>
                     <td className="py-4 px-6">{row.kode}</td>
                      <td className="py-4 px-6">{row.angkatan}</td>
                      {peran !== "TU_PRODI" && (
                      <td className="py-4 px-6">{row.prodi?.nama}</td> )}
                      <td className="py-4 px-6">{row.kapasitas}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => handleEdit(row)} className="text-blue-600" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() =>  {setSelected(row);
                                              handleDelete(row);
                        }}
                         className="text-red-600" title="Hapus">
                          
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
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
              <div>
                Menampilkan {(page - 1) * pageSize + 1} -{" "}<span className="font-semibold">
                {Math.min(page * pageSize, totalData)}</span> dari <span className="font-semibold">{totalData} data kelas </span>
              </div>      </div>

              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 bg-gray-200 rounded"
                >
                  Prev
                </button>

                <button
                  disabled={page >= Math.ceil(totalData / pageSize)}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 bg-gray-200 rounded"
                >
                  Next
                </button>
      
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
                  {selected ? "Edit" : "Tambah"} Kelompok Kelas
                  </h3>
            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500">
              <X size={20} />
            </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
              <label className="block text-sm font-medium text-gray-700">Kode Kelas </label>
              <input
                  name="kode"
                  placeholder="Masukan Kode Kelas"
                  value={formData.kode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Angkatan </label>
              <input
                  type="number"
                  name="angkatan"
                  placeholder="Masukan Tahun Angkatan"
                  value={formData.angkatan}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
             </div>
             {(peran === "ADMIN" || peran === "TU_FAKULTAS") && (
             <div>
            <label className="block text-sm font-medium text-gray-700">Program Studi </label>
                <select
                  name="prodiId"
                  value={formData.prodiId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Pilih Prodi</option>
                  {prodiList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nama}
                    </option>
                  ))}
                </select>
                </div>
             )}
                <div>
              <label className="block text-sm font-medium text-gray-700">
                Jenis Kelas
              </label>

              <select
                name="jenisKelas"
                value={formData.jenisKelas}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="REGULER">REGULER</option>
                <option value="KARYAWAN">KARYAWAN</option>
              </select>
            </div>

                <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kapasitas
                </label>
                <input
                  type="number"
                  name="kapasitas"
                  placeholder="Masukkan kapasitas kelas"
                  value={formData.kapasitas}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>



                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {setShowModal(false)
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-200 rounded"
                  >
                    Batal
                  </button>
                  <button
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
      </div>
    </MainLayout>
  );
}

export default KelompokKelas;
