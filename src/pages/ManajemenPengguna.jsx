import { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  Plus,
  X,
  Search,
  Loader2,
} from "lucide-react";
import MainLayout from "../components/MainLayout";
import api from "../api/api";

function ManajemenPengguna() {

  const [data, setData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeran, setFilterPeran] = useState("");

  const [fakultasList, setFakultasList] = useState([]);
  const [prodiList, setProdiList] = useState([]);
  const [peranList, setPeranList] = useState([]);

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    password: "",
    peran: "",
    fakultasId: "",
    prodiId: "",
  });

  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  
  const fetchPengguna = async () => {
    try {
      setLoading(true);  
      const params = new URLSearchParams();
      if (searchTerm) params.append("q", searchTerm);
      if (filterPeran) params.append("peran", filterPeran);
      params.append("page", page);
      params.append("pageSize", pageSize);
      const res = await api.get(`/api/pengguna?${params.toString()}`);
      const responseData = res.data?.data;
      setData(responseData?.items || []);
      setTotal(responseData?.total || 0);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPengguna();
  }, [page, searchTerm, filterPeran]);

  const fetchFakultas = async () => {
    const res = await api.get("/api/master-data/fakultas");
    setFakultasList(res.data?.data || []);
  };

  const fetchProdi = async () => {
    const res = await api.get("/api/master-data/prodi");
    setProdiList(res.data?.data?.items || []);
  };

  useEffect(() => {
    fetchFakultas();
    fetchProdi();
  }, []);

  // untuk filter data
  const filteredData = data.filter((u) => {
    const matchSearch =
      u.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchPeran =
      filterPeran ? u.peran === filterPeran : true;

    return matchSearch && matchPeran;
  });

  // handle chane

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // open modal
  const openAddModal = () => {

    setSelectedItem(null);

    setFormData({
      nama: "",
      email: "",
      password: "",
      peran: "",
      fakultasId: "",
      prodiId: "",
    });
    setShowModal(true);
  };
  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormData({
      nama: item.nama || "",
      email: item.email || "",
      password: "",
      peran: item.peran || "",
      fakultasId: item.fakultasId || "",
      prodiId: item.prodiId || "",
    });
    setShowModal(true);
  };

  //submit
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validasi password
    if (!selectedItem && (!formData.password || formData.password.length < 6)) {
      alert("Password minimal 6 karakter");
      return;
    }
  
    try {
      if (selectedItem) {
        await api.patch(`/api/pengguna/${selectedItem.id}`, formData);
        alert("Pengguna berhasil diperbarui");
      } else {
        await api.post("/api/pengguna", formData);
        alert("Pengguna berhasil ditambahkan");
      }
      fetchPengguna();
      setShowModal(false);
    } catch (err) {
      alert("Gagal menyimpan pengguna. Pastikan password memenuhi aturan.");
      console.error(err);
    }
  };
  //delete
  const handleDelete = async (item) => {
    const confirmDelete = window.confirm(`Hapus pengguna ${item.nama}?`);
    if (!confirmDelete) return;
    try {
      await api.delete(`/api/pengguna/${item.id}`);
      alert("Data berhasil dihapus");
      fetchPengguna();
    } catch {
      alert("Gagal menghapus");
    }
  };

  return (

    <MainLayout>

      <div className=" bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Data Pengguna
            </h1>
            <p className="text-gray-600 mt-2">
              Kelola data akun pengguna sistem
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
          >
              <Plus size={18} />
              Tambah Pengguna
            </button>

            {/* FILTER */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <select
              className="w-full px-3 py-2.5 border border-gray-300
              rounded-lg bg-white text-gray-900 focus:outline-none
              focus:ring-2 focus:ring-green-500
              focus:border-green-500 transition"
              
            value={filterPeran}
            onChange={(e) => setFilterPeran(e.target.value)}
          >
            <option value="">Semua Role</option>
            <option value="ADMIN">Admin</option>
            <option value="TU_FAKULTAS">TU Fakultas</option>
            <option value="TU_PRODI">TU Prodi</option>
            <option value="DOSEN">Dosen</option>
          </select>
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
          <input type="text"
                placeholder="Cari Pengguna.."
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
                value={searchTerm}
                onChange={(e)=>setSearchTerm(e.target.value)}
              />
          </div>
          </div>

        </div>

        {/* tabel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">

            <h3 className="text-lg font-semibold">
              Daftar Pengguna
            </h3>

          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Nama</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Peran</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Fakultas</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Prodi</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center">
                      <Loader2 className="animate-spin mx-auto"/>
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row)=>(
                    <tr key={row.id} className="border-gray-200">
                      <td className="px-6 py-4">{row.nama}</td>
                      <td className="px-6 py-4">{row.email}</td>
                      <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          {
                            ADMIN: "bg-red-100 text-red-800",
                            TU_FAKULTAS: "bg-blue-100 text-blue-800",
                            TU_PRODI: "bg-yellow-100 text-yellow-800",
                            DOSEN: "bg-gray-100 text-gray-800",
                          }[row.peran] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {row.peran}
                      </span>
                      </td>
                      <td className="px-6 py-4">
                        {row.fakultas?.nama || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {row.prodi?.nama || "-"}
                      </td>
                      <td className="px-3 py-4">
                        <button
                          onClick={()=>openEditModal(row)}
                          className="text-blue-600 mr-2"
                        >
                          <Pencil size={16}/>
                        </button>
                        <button
                          onClick={()=>handleDelete(row)}
                          className="text-red-600"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
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
            {Math.min(page * pageSize, total)} dari {total} pengguna
          </div>

          <div className="flex gap-2">

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

        {/* MODAL tetap sama */}
        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedItem ? "Edit" : "Tambah"} Pengguna
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500"
                >
                  <X />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                {/* Nama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama</label>
                  <input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    placeholder="Masukkan nama"
                    className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Masukkan email"
                    className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password {selectedItem && "(kosongkan jika tidak diubah)"}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Masukkan password"
                    className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    {...(!selectedItem && { required: true })}
                  />
                </div>
                {/* Peran */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    name="peran"
                    value={formData.peran}
                    onChange={(e) => handleChange(e)}
                    className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Pilih Role</option>
                    <option value="ADMIN">Admin</option>
                    <option value="TU_FAKULTAS">TU Fakultas</option>
                    <option value="TU_PRODI">TU Prodi</option>
                    <option value="DOSEN">Dosen</option>
                  </select>
                </div>
                {/* Fakultas */}
                {(formData.peran === "TU_FAKULTAS" || formData.peran === "TU_PRODI" || formData.peran === "DOSEN") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fakultas</label>
                    <select
                      name="fakultasId"
                      value={formData.fakultasId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Pilih Fakultas</option>
                      {Array.isArray(fakultasList) && fakultasList.map(f => (
                        <option key={f.id} value={f.id}>{f.nama}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Prodi */}
                {(formData.peran === "TU_PRODI" || formData.peran ==="DOSEN") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prodi</label>
                    <select
                      name="prodiId"
                      value={formData.prodiId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Pilih Prodi</option>
                      {Array.isArray(prodiList) && prodiList.map(p => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Tombol */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                  >
                    {selectedItem ? "Update" : "Simpan"}
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

export default ManajemenPengguna;