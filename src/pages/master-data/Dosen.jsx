import { useState, useEffect } from "react";
import MainLayout from "../../components/MainLayout";
import { Search, Plus, Edit, Trash2, X, Loader2 } from "lucide-react";
import api from "../../api/api";
import { useAuth } from "../../hooks/useAuth";

function Dosen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedDosen, setSelectedDosen] = useState(null);
  const [filterProdi, setFilterProdi] = useState("");

  const [formData, setFormData] = useState({
    nama: "",
    nidn: "",
    prodiId: "",
    bebanMengajarMaks: "",
  });

  const [prodiList, setProdiList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalData, setTotalData] = useState(0);

  // Fetch dosen
  const fetchDosen = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/master-data/dosen", {
        params: {
          page,
          pageSize,
          q: searchTerm,
          prodiId: filterProdi
        },
      });
  
      setData(res.data.data.items);
      setTotalData(res.data.data.total);
  
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch prodi
  const fetchProdi = async () => {
    try {
      const res = await api.get("/api/master-data/prodi");
      setProdiList(res.data?.data?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDosen();
    
  }, [page,searchTerm, filterProdi]);
useEffect(() => {
  fetchProdi();
}, []);

  const resetForm = () => {
    setFormData({ nama: "", nidn: "", prodiId: "", bebanMengajarMaks: "" });
    setSelectedDosen(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      const payload = {
        nama: formData.nama,
        nidn: formData.nidn,
        ...(peran === "TU_PRODI"
        ? { prodiId: user?.prodiId }
        : { prodiId: formData.prodiId}),
        bebanMengajarMaks: Number(formData.bebanMengajarMaks),
      };
  
      if (selectedDosen) {
        await api.patch(`/api/master-data/dosen/${selectedDosen.id}`, payload);
        alert("Data dosen berhasil diperbarui");
      } else {
        await api.post("/api/master-data/dosen", payload);
        alert("Data dosen berhasil ditambahkan");
      }
  
      fetchDosen();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Gagal simpan dosen", err);
  
      if (err.response?.status === 400) {
        alert("Nama atau NIDN dosen sudah terdaftar!");
      } else {
        alert("Gagal menyimpan data dosen. Silakan coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const handleEdit = (dosen) => {
    setSelectedDosen(dosen);
    setFormData({
      nama: dosen.nama || "",
      nidn: dosen.nidn || "",
      prodiId: dosen.prodiId || "",
      bebanMengajarMaks: dosen.bebanMengajarMaks || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (dosen) => {
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus dosen "${dosen.nama}"?`
    );
  
    if (!confirmDelete) return;
  
    setIsSubmitting(true);
    try {
      await api.delete(`/api/master-data/dosen/${dosen.id}`);
      fetchDosen();
      alert("Data dosen berhasil dihapus");
      setShowModal(false);
      resetForm();
      setSelectedDosen(null);
    } catch (err) {
      console.error("Gagal hapus dosen", err);
      alert("Gagal menghapus data dosen. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const { user, peran } = useAuth();
  useEffect(() => {
    if (
      peran === "TU_PRODI" &&
      user?.prodiId &&
      formData.prodiId !== user.prodiId
    ) {
      setFormData((prev) => ({
        ...prev,
        prodiId: user.prodiId
      }));
    }
  }, [peran, user?.prodiId, formData.prodiId]);
  
  

  return (
    <MainLayout>
      <div className=" bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Data Dosen</h1>
          <p className="text-gray-600 mt-2">Pengelolaan data dosen untuk kegiatan perkuliahan</p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg"
          >
            <Plus size={18} /> Tambah Dosen
          </button>

            {/* Right */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

            {/* Filter prodi */}
            {peran !== "TU_PRODI" && (
            <select
              value={filterProdi}
              onChange={(e) => {
                setFilterProdi(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 border border-gray-300
           rounded-lg bg-white text-gray-900 focus:outline-none
           focus:ring-2 focus:ring-green-500
           focus:border-green-500 transition"
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
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
          <input 
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-500 text-gray-900 focus:border-green-500 focus:outline-none transition"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Cari Dosen..."
            />
          </div>
          </div>
          </div>
          
        

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Dosen</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Dosen</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">NIDN</th>
                  {peran !== "TU_PRODI" && (
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Program Studi</th>)}
                  <th className="py-4 px-6 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Beban Mengajar Maks</th>
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
                ) : data.length > 0 ? (
                  data.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="py-4 px-6">{row.nama}</td>
                      <td className="py-4 px-6">{row.nidn}</td>
                      {peran !== "TU_PRODI" && (
                      <td className="py-4 px-6">{row.prodi?.nama}</td>)}
                      <td className="py-4 px-6 text-center">{row.bebanMengajarMaks}</td>
                      <td className="py-4 px-6 flex gap-2">
                        <button onClick={() => handleEdit(row)} title="Edit" className="text-blue-600">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(row)} title="Hapus"className="text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">Tidak ada data dosen</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-700">
            Menampilkan {(page - 1) * pageSize + 1} -{" "} <span className="font-semibold">
              {Math.min(page * pageSize, totalData)}</span> dari<span className="font-semibold"> {totalData}  </span> data dosen
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
          disabled={page >= Math.ceil(totalData / pageSize)}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          Next
        </button>
        </div>
        </div>
          </div>
        </div>

        {/* Modal Tambah/Edit */}
        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDosen ? "Edit Dosen" : "Tambah Dosen"}
                </h3>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                <div>
                  <label className="text-sm font-medium">Nama Dosen</label>
                  <input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleInputChange}
                    placeholder="Masukan Nama Dosen"
                    className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">NIDN</label>
                  <input
                    type="number"
                    name="nidn"
                    value={formData.nidn}
                    onChange={handleInputChange}
                    placeholder="Masukan NIDN"
                    className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                {(peran === "ADMIN" || peran === "TU_FAKULTAS") && (
                <div>
                  <label className="text-sm font-medium">Program Studi</label>
                  <select
                    name="prodiId"
                    value={formData.prodiId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Pilih Prodi</option>
                    {prodiList.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>
                )}
                <div>
                  <label className="text-sm font-medium">Beban Mengajar Maks</label>
                  <input
                    type="number"
                    name="bebanMengajarMaks"
                    value={formData.bebanMengajarMaks}
                    onChange={handleInputChange}
                    placeholder="Masukan Beban Maks"
                    className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
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


      </div>
    </MainLayout>
  );
}

export default Dosen;
