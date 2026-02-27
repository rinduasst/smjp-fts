import { useState, useEffect } from "react";
import MainLayout from "../../components/MainLayout";
import { Search, Filter, Plus, Edit, Trash2, X, Loader2 } from "lucide-react";
import api from "../../api/api";

function PeriodeAkademik() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fakultasList, setFakultasList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterTahun, setFilterTahun] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    nama: "",
    paruh: "GANJIL",
    tahunMulai: "",
    tahunSelesai: "",
    tanggalMulai: "",
    tanggalSelesai: "",
    fakultas_id: "",
    aktif: true
  });
  


  const fetchPeriode = async () => {
    try {
      const res = await api.get("/api/master-data/periode-akademik");
      setData(res.data?.data?.items || []);
    } catch (err) {
      console.error("Gagal fetch periode:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFakultas = async () => {
    try {
      const res = await api.get("/api/master-data/fakultas");
      console.log("Fakultas response:", res.data);
  
      const items =
        res.data?.data ||        // kalau langsung array
        [];
  
      setFakultasList(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Gagal fetch fakultas:", err);
      setFakultasList([]);
    }
  };
  

  useEffect(() => {
    fetchPeriode();
    fetchFakultas();
  }, []);

  const filteredData = data.filter(item => {
    const matchSearch =
      item.nama?.toLowerCase().includes(searchTerm.toLowerCase());
  
    const matchTahun = filterTahun
      ? String(item.tahunMulai) === filterTahun
      : true;
  
    const matchSemester = filterSemester
      ? item.paruh === filterSemester
      : true;
  
    return matchSearch && matchTahun && matchSemester;
  });
  

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.tahunMulai) errors.tahunMulai = "Tahun mulai wajib diisi";
    if (!formData.tahunSelesai) errors.tahunSelesai = "Tahun selesai wajib diisi";
    if (!formData.tanggalMulai) errors.tanggalMulai = "Tanggal mulai wajib diisi";
    if (!formData.tanggalSelesai) errors.tanggalSelesai = "Tanggal selesai wajib diisi";
    if (!formData.fakultas_id) errors.fakultas_id = "Fakultas wajib dipilih";
    return errors;
  };
  
  const resetForm = () => {
    setFormData({
      nama: "",
      paruh: "GANJIL",
      tahunMulai: "",
      tahunSelesai: "",
      tanggalMulai: "",
      tanggalSelesai: "",
      fakultas_id: "",
      aktif: true
    });
    setFormErrors({});
    setSelectedItem(null);
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
        paruh: formData.paruh,
        tahunMulai: Number(formData.tahunMulai),
        tahunSelesai: Number(formData.tahunSelesai),
        tanggalMulai: new Date(formData.tanggalMulai).toISOString(),
        tanggalSelesai: new Date(formData.tanggalSelesai).toISOString(),
        aktif: formData.aktif,
        nama: `${formData.tahunMulai}/${formData.tahunSelesai} ${formData.paruh}`
      };
      
      

      if (selectedItem) {
        await api.patch(
          `/api/master-data/periode-akademik/${selectedItem.id}`,
          payload
        );
        alert("Periode akademik berhasil diperbarui!");
      } else {
        await api.post("/api/master-data/periode-akademik", payload);
        alert("Periode akademik berhasil ditambahkan!");
      }
      

      await fetchPeriode();
      setShowModal(false);
      resetForm();

    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      nama: item.nama || "",
      paruh: item.paruh || "",
      tahunMulai: item.tahunMulai || "",
      tahunSelesai: item.tahunSelesai || "",
      tanggalMulai: item.tanggalMulai || "",
      tanggalSelesai: item.tanggalSelesai || "",
      fakultas_id: item.fakultas?.id || "",
      aktif: item.aktif ?? true
    });
    setShowModal(true);
  };
  const handleDelete = async (item) => {
    const ok = window.confirm(
      `Yakin ingin menghapus periode akademik "${item.nama}"?`
    );
  
    if (!ok) return;
  
    try {
      setIsSubmitting(true);
      await api.delete(`/api/master-data/periode-akademik/${item.id}`);
      await fetchPeriode();
      alert("Periode akademik berhasil dihapus!");
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus periode akademik");
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <MainLayout>
      
        <div className=" bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Periode Akademik</h1>
        <p className="text-gray-600 mt-2">Daftar Data periode akademik yang digunakan sebagai acuan kegiatan perkuliahan  </p>
        </div>
        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
  
          {/* Left */}
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all font-medium"
          >
            <Plus size={18} />
            Tambah Periode
          </button>

          {/* Right */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

            {/* Filter Tahun */}
            <select
              value={filterTahun}
              onChange={e => setFilterTahun(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300
              rounded-lg bg-white text-gray-900 focus:outline-none
              focus:ring-2 focus:ring-green-500
              focus:border-green-500 transition"
           >
              <option value="">Semua Tahun</option>
              {[...new Set(data.map(d => d.tahunMulai))].map(th => (
                <option key={th} value={th}>{th}</option>
              ))}
            </select>

            {/* Filter Semester */}
            <select
              value={filterSemester}
              onChange={e => setFilterSemester(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300
              rounded-lg bg-white text-gray-900 focus:outline-none
              focus:ring-2 focus:ring-green-500
              focus:border-green-500 transition"
           >
              <option value="">Semua Semester</option>
              <option value="GANJIL">Ganjil</option>
              <option value="GENAP">Genap</option>
            </select>

            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
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
                  transition"
                placeholder="Cari periode..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

          </div>


      </div>


        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Periode Akademik</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
              <tr>
                  
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tahun</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fakultas</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                  <tr><td colSpan="7" className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
              ) : filteredData.length ? filteredData.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">

                 <td className="py-4 px-6">{row.paruh}</td>
                 <td className="py-4 px-6">{row.tahunMulai}/{row.tahunSelesai}</td>
                 <td className="py-4 px-6">{row.fakultas?.nama}</td>              
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
                    </span>
                  </td>
                 <td className="py-4 px-6 flex gap-2">
                        <button onClick={() => handleEdit(row)} className="text-blue-600" title="Edit"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(row)} className="text-red-600" title="Hapus"><Trash2 size={16} /></button>
            
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="p-6 text-center">Tidak ada data</td></tr>
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
            {selectedItem ? "Edit Periode Akademik" : "Tambah Periode Akademik"}
            </h3>
            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500">
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">

          {/* Paruh */}
        
          <div>
              <label className="block text-sm font-medium text-gray-700">Semester </label>
              <select
              name="paruh"
              value={formData.paruh}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="GANJIL">Ganjil</option>
              <option value="GENAP">Genap</option>
            </select>
      
          </div>

        {/* Tahun */}
        <div className="grid grid-cols-2 gap-3">
          <div>
          <label className="block text-sm font-medium text-gray-700">Tahun Mulai </label>
            <input
              type="number"
              name="tahunMulai"
              value={formData.tahunMulai}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
          <label className="block text-sm font-medium text-gray-700">Tahun Selesai </label>
            <input
              type="number"
              name="tahunSelesai"
              value={formData.tahunSelesai}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Tanggal */}
        <div className="grid grid-cols-2 gap-3">
          <div>
          <label className="block text-sm font-medium text-gray-700">Tanggal Mulai </label>
            <input
              type="date"
              name="tanggalMulai"
              value={formData.tanggalMulai}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            < label className="block text-sm font-medium text-gray-700">Tanggal Selesai </label>
            <input
              type="date"
              name="tanggalSelesai"
              value={formData.tanggalSelesai}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
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
              <option key={f.id} value={f.id}>{f.nama}</option>
            ))}
          </select>
        </div>

        {/* Status */}
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


        {/* Button */}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded">
            Batal
          </button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded">
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

export default PeriodeAkademik;
