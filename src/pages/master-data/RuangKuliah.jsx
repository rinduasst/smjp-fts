import { useState, useEffect } from "react";
import MainLayout from "../../components/MainLayout";
import { Search, Plus, Edit, Trash2, X, Loader2 } from "lucide-react";
import api from "../../api/api";

function RuangKuliah() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterJenis, setFilterJenis] = useState("");
  const [filterLantai, setFilterLantai] = useState("");


  const [formData, setFormData] = useState({
    kode: "",
    nama: "",
    kapasitas: "",
    jenis: "TEORI",
    lokasi: "",
    fakultasId: "",
    aktif: true,
    khususKelasGabungan: false
  });

  const [fakultasList, setFakultasList] = useState([]);

  const fetchRuang = async () => {
    try {
      const res = await api.get("/api/master-data/ruang");
      setData(res.data?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFakultas = async () => {
    const res = await api.get("/api/master-data/fakultas");
    setFakultasList(res.data?.data || []);
  };

  useEffect(() => {
    fetchRuang();
    fetchFakultas();
  }, []);


  const filteredData = data.filter(r => {
    const matchSearch =
      r.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.kode?.toLowerCase().includes(searchTerm.toLowerCase());
  
    const matchJenis =
      filterJenis ? r.jenis === filterJenis : true;
  
    const matchLantai =
      filterLantai
        ? r.lokasi?.toLowerCase().includes(filterLantai.toLowerCase())
        : true;
  
    return matchSearch && matchJenis && matchLantai;
  });
  const lantaiList = [...new Set(
    data
      .map(r => r.lokasi)
      .filter(l => l && l !== "")
  )];
  
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      kode: "",
      nama: "",
      kapasitas: "",
      jenis: "TEORI",
      lokasi: "",
      fakultasId: "",
      aktif: true,
      khususKelasGabungan: false
    });
    setSelectedItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      if (selectedItem) {
        await api.patch(`/api/master-data/ruang/${selectedItem.id}`, formData);
        alert("Ruang berhasil diperbarui");
      } else {
        await api.post("/api/master-data/ruang", formData);
        alert("Ruang berhasil ditambahkan");
      }
  
      fetchRuang();
      closeModal();
  
    } catch (err) {
      console.error("Gagal menyimpan ruang:", err);
  
      if (err.response?.status === 400 || err.response?.status === 409) {
        alert(
          err.response?.data?.message ||
          "Kode atau nama ruang sudah digunakan!"
        );
      } else {
        alert("Terjadi kesalahan. Silakan coba lagi.");
      }

      closeModal();
    }
  };
  
  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      kode: item.kode || "",
      nama: item.nama || "",
      kapasitas: item.kapasitas || "",
      jenis: item.jenis || "TEORI",
      lokasi: item.lokasi || "",
      fakultasId: item.fakultasId || "",
      aktif: item.aktif ?? true,
      khususKelasGabungan: item.khususKelasGabungan ?? false
    });
    setShowModal(true);
  };

  
  const handleDelete = async (item) => {
    const ok = window.confirm(
      `Yakin ingin menghapus ruang "${item.nama}"?`
    );
    if (!ok) return;
  
    try {
      setIsSubmitting(true);
      await api.delete(`/api/master-data/ruang/${item.id}`);
      await fetchRuang();
      alert("Ruang berhasil dihapus!");
    } catch (error) {
      alert("Gagal menghapus ruang.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  
  
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
          <h1 className="text-2xl font-bold text-gray-900">Data Ruang Kuliah</h1>
          <p className="text-gray-600 mt-2">Data ruang perkuliahan yang digunakan dalam kegiatan akademik</p>
        </div>

       {/* Action Bar */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
          >
            <Plus size={18} />
            Tambah Ruang
          </button>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300
           rounded-lg bg-white text-gray-900 focus:outline-none
           focus:ring-2 focus:ring-green-500
           focus:border-green-500 transition"
        >
            <option value="">Semua Jenis</option>
            <option value="TEORI">Teori</option>
            <option value="LAB">Lab</option>
          </select>
          <select
          value={filterLantai}
          onChange={(e) => setFilterLantai(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300
          rounded-lg bg-white text-gray-900 focus:outline-none
          focus:ring-2 focus:ring-green-500
          focus:border-green-500 transition"
       >
          <option value="">Semua Lantai</option>
          {lantaiList.map((lantai) => (
            <option key={lantai} value={lantai}>
               {lantai}
            </option>
          ))}
        </select>
        <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
          <input type="text"
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
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari Ruangan ..."  />
                </div>
                </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Ruang Perkuliahan</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kode </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Ruang</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kapasitas</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jenis Ruang</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lantai</th>
                  <th className="py-4 px-6 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas Gabungan</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="p-6 text-center">
                  <Loader2 className="animate-spin mx-auto"/>
                </td></tr>
              ) : filteredData.length ? filteredData.map(row => (
                <tr key={row.id} >
                      <td className="py-4 px-6">{row.kode}</td>
                      <td className="py-4 px-6">{row.nama}</td>
                      <td className="py-4 px-6">{row.kapasitas}</td>
                      <td className="py-4 px-6">{row.jenis}</td>
                      <td className="py-4 px-6">{row.lokasi}</td>
                      <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium
                        ${
                          row.khususKelasGabungan
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {row.khususKelasGabungan ? "Ya" : "Tidak"}
                      </span>
                    </td>
                      <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium 
                      ${row.aktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mr-2 
                        ${row.aktif ? 'bg-green-500' : 'bg-red-500'}`}
                      ></div>
                      {row.aktif ? 'Aktif' : 'Tidak Aktif'}
                    </span></td>
                      <td className="py-4 px-6 flex gap-2">
                        <button onClick={() => handleEdit(row)} className="text-blue-600" title="Edit"><Edit size={16} /></button>
                        <button onClick={() =>  handleDelete(row)} className="text-red-600" title="Hapus"><Trash2 size={16} /></button>
                  
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="py-8 text-center text-gray-500">Tidak ada data ruangan</td></tr>
              )}
            </tbody>
          </table>
        </div>
             {/* Table Footer */}
             <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Menampilkan <span className="font-semibold">{filteredData.length}</span> dari <span className="font-semibold">{data.length}</span> Ruangan
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
                  {selectedItem ? "Edit Ruang" : "Tambah Ruang"}
                </h3>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500">
                  <X size={18}/>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
              <label className="block text-sm font-medium text-gray-700">Kode Ruangan </label>
              <input
                type="text"
                name="kode"
                value={formData.kode}
                onChange={handleChange}
                placeholder="Masukan Kode Ruang "
                className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Ruangan</label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                placeholder="Masukan Nama Ruang "
                className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Kapasitas</label>
              <input
                type="number"
                name="kapasitas"
                value={formData.kapasitas}
                onChange={handleChange}
                placeholder="Masukan Kapasitas Ruangan "
                className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Jenis Ruangan </label>
              <select
                name="jenis"
                value={formData.jenis}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
               <option value="TEORI">Teori</option>
                  <option value="LAB">Lab</option>
          
              </select>
            </div>
         
            <div>
              <label className="block text-sm font-medium text-gray-700">Lantai Ruangan</label>
              <input
                type="text"
                name="lokasi"
                value={formData.lokasi}
                onChange={handleChange}
                placeholder="Masukan Lokasi Ruangan "
                className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fakultas </label>
              <select
                name="fakultasId"
                value={formData.fakultasId}
                onChange={handleChange}
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
           
                
            <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="aktif"
              value={formData.aktif ? "true" : "false"}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  aktif: e.target.value === "true"
                }))
              }
              className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="true">Aktif</option>
              <option value="false">Tidak Aktif</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="khususKelasGabungan"
              checked={formData.khususKelasGabungan}
              onChange={handleChange}
            />
            <label className="text-sm font-medium text-gray-700">
              Khusus untuk kelas gabungan
            </label>
          </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded">
                    Batal
                  </button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
                    Simpan
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

export default RuangKuliah;
