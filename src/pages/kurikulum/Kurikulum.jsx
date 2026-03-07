import { Search, Plus, Edit, Trash2, X, Loader2,Eye, CheckSquare } from "lucide-react";
import MainLayout from "../../components/MainLayout";
import { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import {useAuth} from "../../hooks/useAuth"


function Kurikulum() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterProdi, setFilterProdi] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    prodiId: "",
    nama: "",
    angkatanMulai: "",
    angkatanSelesai: "",
    aktif: true,
  });
  
  const [prodiList, setProdiList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // contoh data prodi (nanti dari API)
  const fetchKurikulum = async () => {
    setLoading(true);
  
    const effectiveProdiId =
      peran === "TU_PRODI" ? user?.prodiId : filterProdi;
  
    try {
      const res = await api.get("/api/kurikulum/kurikulum", {
        params: {
          ...(effectiveProdiId && { prodiId: effectiveProdiId }),
        },
      });
  
      setData(res.data?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProdi = async () => {
    try {
      const res = await api.get("/api/master-data/prodi");
      setProdiList(res.data?.data?.items || []);
    } catch (err) {
      console.error("Gagal fetch prodi:", err);
    }
  };
  
    // fetch prodi cuma sekali
    useEffect(() => {
      fetchProdi();
    }, []);

    // fetch kurikulum kalau filter berubah
    useEffect(() => {
      fetchKurikulum();
    }, [filterProdi]);
  
 
    const filteredData = data.filter(item =>
      item.nama?.toLowerCase().includes(searchTerm.toLowerCase())
    );


  const resetForm = () => {
    setFormData({
      prodiId: "",
      nama: "",
      angkatanMulai: "",
      angkatanSelesai: "",
      aktif: true,
    });
    setSelected(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "radio" ? value === "true" : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // cek duplikat: nama + prodi + angkatanMulai + angkatanSelesai
    const isDuplicate = data.some(item =>
      item.nama.toLowerCase() === formData.nama.toLowerCase() &&
      item.prodi?.id === formData.prodiId &&
      Number(item.angkatanMulai) === Number(formData.angkatanMulai) &&
      Number(item.angkatanSelesai) === Number(formData.angkatanSelesai) &&
      item.id !== selected?.id // biar gak ketemu sendiri saat edit
    );
  
    if (isDuplicate) {
      alert("Kurikulum dengan Nama, Prodi, dan Tahun yang sama sudah ada!");
      return; // stop submit
    }
  
    setIsSubmitting(true);
  
    const payload = {
      prodiId: peran === "TU_PRODI" ? user?.prodiId : formData.prodiId,
      nama: formData.nama.trim(),
      angkatanMulai: Number(formData.angkatanMulai),
   angkatanSelesai: formData.angkatanSelesai
  ? Number(formData.angkatanSelesai)
  : null,
      aktif: formData.aktif,
    };
  
    try {
      if (selected) {
        await api.patch(`/api/kurikulum/kurikulum/${selected.id}`, payload);
      } else {
        await api.post("/api/kurikulum/kurikulum", payload);
      }
  
      await fetchKurikulum();
      setShowModal(false);
      resetForm();
    
      // kasih alert sukses
      alert("Data kurikulum berhasil disimpan!");
    } catch (err) {
      console.error("Gagal simpan kurikulum:", err);
      if (err.response?.status === 400) {
        alert(err.response.data?.message || "Gagal simpan kurikulum");
      } else {
        alert("Gagal menyimpan data");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEdit = (row) => {
    setSelected(row);
    setFormData({
      prodiId: row.prodiId || row.prodi?.id || "",
      nama: row.nama || "",
      angkatanMulai: row.angkatanMulai || "",
      angkatanSelesai: row.angkatanSelesai || "",
      aktif: row.aktif ?? true,
    });
    setShowModal(true);
  };

  
  const handleDelete = async (row) => {
    if (!row) return;
  
    const ok = window.confirm(
      `Yakin ingin menghapus kurikulum "${row.nama}"?`
    );
    if (!ok) return;
  
    try {
      setIsSubmitting(true);
      await api.delete(`/api/kurikulum/kurikulum/${row.id}`);
      await fetchKurikulum();
      alert("Kurikulum berhasil dihapus");
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus kurikulum");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { user,peran } = useAuth();
  useEffect(() => {
    if (peran === "TU_PRODI" && user?.prodiId) {
      setFormData((prev) => ({
        ...prev,
        prodiId: user.prodiId
      }));
    }
  }, [peran, user]);
  return (
    <MainLayout>
      <div className=" bg-gray-50 min-h-screen">
  
        {/* HEADER */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Data Kurikulum</h1>
          <p className="text-gray-600 mt-2">
          Data kurikulum sebagai dasar penyusunan struktur mata kuliah
          </p>
        </div>
  
        {/* ACTION BAR */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6
          flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
  
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600
            text-white px-5 py-2.5 rounded-lg shadow-sm
            hover:from-green-600 hover:to-green-700 transition-all font-medium"
          >
            <Plus size={18} />
            Tambah Kurikulum
          </button>
  
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

          {/* Filter prodi */}
          {peran !== "TU_PRODI" && (
          <select
            value={filterProdi}
            onChange={e => setFilterProdi(e.target.value)}
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
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Kurikulum..."
              
            />
          </div>
        </div>
        </div>
  
        {/* TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold">Daftar Kurikulum</h3>
          </div>
  
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Nama
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Tahun
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase"> 
                    Program Studi
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
  
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  
                  <tr>
                    <td colSpan="5" className="py-8 text-center">
                      <Loader2 className="animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredData.length ? (
                  filteredData.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{row.nama}</td>
                      <td className="px-6 py-4">
                      {row.angkatanMulai} - {row.angkatanSelesai ?? "Sekarang"}
                    </td>
                      <td className="px-6 py-4">
                        {row.prodi?.nama || "-"}
                      </td>

                      <td className="px-2 py-2">
                      <div className="flex flex-col  items-center gap-1">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium 
                      ${row.aktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mr-2 
                        ${row.aktif ? 'bg-green-500' : 'bg-red-500'}`}
                      ></div>
                      {row.aktif ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                </td>
                      <td className="px-6 py-4 flex gap-3">
                      <button
                        onClick={() => navigate(`/kurikulum/${row.id}/assignMatkul`)}
                        className="inline-flex items-center gap-2 px-3 py-2 
                        bg-green-500 text-white text-sm font-semibold 
                        rounded-lg shadow-sm
                        hover:bg-green-600 hover:shadow-md
                        transition-all"
                      >
                        <CheckSquare size={16} />
                        Kelola Mata Kuliah
                      </button>
                        <button
                          onClick={() => handleEdit(row)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit data"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="text-red-600 hover:text-red-800"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                          <button
                          onClick={() => navigate(`/kurikulum/${row.id}`)}
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
                    <td colSpan="5" className="py-8 text-center text-gray-500">
                      Tidak ada data kurikulum
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
  
          {/* TABLE FOOTER */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-700">
              Menampilkan{" "}
              <span className="font-semibold">{filteredData.length}</span> dari{" "}
              <span className="font-semibold">{data.length}</span> kurikulum
            </div>
          </div>
        </div>
  
        {/* MODAL TAMBAH / EDIT */}
        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg">
  
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {selected ? "Edit" : "Tambah"} Kurikulum
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-500"
                >
                  <X />
                </button>
              </div>
  
              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
  
                {/* Nama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nama Kurikulum
                  </label>
                  <input
                    type="text"
                    name="nama"
                    placeholder="Masukan Nama Kurikulum"
                    value={formData.nama}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-100 rounded
                    focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
  
                {/* Prodi */}
                {peran !== "TU_PRODI" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Program Studi
                  </label>
                  <select
                    name="prodiId"
                    value={formData.prodiId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-100 rounded
                    focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Pilih Program Studi</option>
                    {prodiList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}
  
                {/* Angkatan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tahun
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      name="angkatanMulai"
                      value={formData.angkatanMulai} 
                      onChange={handleInputChange}
                      placeholder="Mulai"
                      className="px-3 py-2 bg-gray-100 rounded
                      focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <input
                      type="number"
                      name="angkatanSelesai"
                      value={formData.angkatanSelesai}
                      onChange={handleInputChange}
                      placeholder="Selesai"
                      className="px-3 py-2 bg-gray-100 rounded
                      focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>
  
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status Kurikulum
                  </label>
                  <div className="flex gap-6 mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="aktif"
                        value="true"
                        checked={formData.aktif === true}
                        onChange={handleInputChange}
                      />
                      Aktif
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="aktif"
                        value="false"
                        checked={formData.aktif === false}
                        onChange={handleInputChange}
                      />
                      Non Aktif
                    </label>
                  </div>
                </div>
  
                {/* BUTTON */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 text-white rounded
                    hover:bg-green-700"
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

export default Kurikulum;
