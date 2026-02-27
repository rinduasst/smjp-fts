import { useState, useEffect, useMemo } from "react";
import api from "../../api/api";
import MainLayout from "../../components/MainLayout";
import { Plus, Search, Edit, Trash2, Loader2, X } from "lucide-react";

const ConstraintDosen = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [dosenList, setDosenList] = useState([]);
  const [hariList, setHariList] = useState([]);
  const [jamList, setJamList] = useState([]);
  const [ruangList, setRuangList] = useState([]);
  const [filterJenis, setFilterJenis] = useState("");


  const [formData, setFormData] = useState({
    dosenId: "",
    jenisConstraint: "",
    nilaiConstraint: "",
    tipe: "HARD",
    prioritas: ""
  });

  // ================= FETCH MASTER =================
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [dosenRes, hariRes, jamRes, ruangRes] = await Promise.all([
          api.get("/api/master-data/dosen"),
          api.get("/api/master-data/hari"),
          api.get("/api/master-data/slot-waktu"),
          api.get("/api/master-data/ruang") 
        ]);

        setDosenList(dosenRes.data?.data?.items || []);
        setHariList(hariRes.data?.data || []);
        setJamList(jamRes.data?.data?.items || []);
        setRuangList(ruangRes.data?.data?.items|| []);
      } catch (err) {
        console.error("Gagal ambil master data", err);
      }
    };

    fetchMaster();
  }, []);

  // ================= FETCH DATA =================
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/pengajaran/constraint-dosen");
      setData(res.data?.data?.items || []);
    } catch (err) {
      console.error("Gagal ambil constraint", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= FORM =================
  const resetForm = () => {
    setFormData({
      dosenId: "",
      jenisConstraint: "",
      nilaiConstraint: "",
      tipe: "HARD",
      prioritas : ""
    });
    setIsEdit(false);
    setSelectedId(null);
  };

  const handleEdit = (row) => {
    setFormData({
      dosenId: row.dosenId,
      jenisConstraint: row.jenisConstraint,
      nilaiConstraint: row.nilaiConstraint,
      tipe: row.isHard ? "HARD" : "SOFT",
      prioritas: row.prioritas || ""
    });
    setSelectedId(row.id);
    setIsEdit(true);
    setShowModal(true);
  };

  const isDuplicate = () => {
    return data.some(item =>
      item.dosenId === formData.dosenId &&
      item.jenisConstraint === formData.jenisConstraint &&
      (!isEdit || item.id !== selectedId)
    );
  };
  
  const handleSubmit = async () => {
    if (isDuplicate()) {
      alert("Aturan ini sudah ada untuk dosen tersebut!");
      return;
    }
  
    const payload = {
      dosenId: formData.dosenId,
      jenisConstraint: formData.jenisConstraint,
      nilaiConstraint: formData.nilaiConstraint,
      isHard: formData.tipe === "HARD"
    };
  
    if (!payload.isHard) {
      payload.prioritas = Number(formData.prioritas);
    }
  
    try {
        if (isEdit) {
          await api.patch(`/api/pengajaran/constraint-dosen/${selectedId}`, payload);
          alert("Data berhasil diperbarui");
        } else {
          await api.post("/api/pengajaran/constraint-dosen", payload);
          alert("Data berhasil ditambahkan");
        }
      
  
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Gagal simpan constraint", err.response?.data || err);
      alert("Gagal menyimpan data");
    }
  };
  

  const handleDelete = async (row) => {
    if (!window.confirm("Yakin hapus Aturan ini?")) return;
    try {
      await api.delete(`/api/pengajaran/constraint-dosen/${row.id}`);
      fetchData();
    } catch (err) {
      console.error("Gagal hapus Aturan ini", err);
    }
  };
  const mapJenisConstraint = (jenis) => {
    switch (jenis) {
      case "WAJIB_HARI":
        return "Wajib Hari";
      case "WAJIB_RUANG":
        return "Wajib Ruang";
      case "WAJIB_LANTAI":
        return "Wajib Lantai";
      case "HINDARI_SLOT":
        return "Hindari Slot";
      case "MAKS_SESI_PERHARI":
        return "Maks. Sesi / Hari";
      default:
        return jenis;
    }
  };
  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.dosen?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapJenisConstraint(item.jenisConstraint)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);
  
  // ================= RENDER =================
  return (
      <MainLayout>
          <div className=" bg-gray-50 min-h-screen">
      {/* HEADER */} 
       <div className="mb-4"> 
        <h1 className="text-2xl font-bold text-gray-900"> Aturan Mengajar Dosen </h1>
         <p className="text-gray-600 mt-2"> Aturan dan batasan mengajar dosen untuk proses penjadwalan </p> 
         </div>
        
       {/* ACTION BAR */} 
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"> 
       <button 
       onClick={() => { resetForm(); setShowModal(true); }} 
       className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 
       rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition font-medium" > 
       <Plus size={18} /> Tambah Aturan </button>
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
        <option value="WAJIB_HARI">Wajib Hari</option>
        <option value="HINDARI_SLOT">Hindari Waktu</option>
        <option value="WAJIB_RUANG">Wajib Ruang</option>
        <option value="WAJIB_LANTAI">Wajib Lantai</option>
        <option value="MAKS_SESI_PERHARI">Maks. Sesi / Hari</option>
      </select>
     
        <div className="relative w-full sm:max-w-sm">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} /> 
         <input type="text" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
           className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" />
           </div>
           </div>
            </div>

         {/* TABLE */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900"> Daftar Aturan Mengajar Dosen </h3>
           </div> 
           <div className="overflow-x-auto"> 
           <table className="w-full">
             <thead className="bg-gray-50"> 
             <tr>
               <th  className="py-3 px-2 text-center text-xs font-semibold text-gray-500 uppercase">Dosen</th>
                <th className="py-3 px-2 text-center text-xs font-semibold text-gray-500 uppercase">Jenis</th>
                <th className="py-3 px-2 text-center text-xs font-semibold text-gray-500 uppercase">Nilai</th>
                <th className="py-3 px-2 text-center text-xs font-semibold text-gray-500 uppercase">Tipe</th>
                <th className="py-3 px-2 text-center text-xs font-semibold text-gray-500 uppercase">Prioritas</th>
                <th className="py-3 px-2 text-center text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center">
                    <Loader2 className="animate-spin mx-auto" />
                  </td>
                  </tr>
              ) : filteredData.length ? (
                filteredData.map((row) => (
                  <tr key={row.id}>
                    <td className="p-4 text-left">{row.dosen?.nama}</td>
                    <td className="p-4 text-center">{mapJenisConstraint(row.jenisConstraint)}</td>
                    <td className="p-4 text-center">
                    {(() => {
                      if (row.jenisConstraint === "WAJIB_HARI") {
                        return hariList.find(h => h.id === row.nilaiConstraint)?.nama || row.nilaiConstraint;
                      }

                      if (row.jenisConstraint === "WAJIB_RUANG") {
                        return ruangList.find(r => r.id === row.nilaiConstraint)?.nama || row.nilaiConstraint;
                      }

                      if (row.jenisConstraint === "HINDARI_SLOT") {
                        return jamList.find(j => j.id === row.nilaiConstraint)?.nama || row.nilaiConstraint;
                      }

                      return row.nilaiConstraint;
                    })()}
                  </td>

                    <td className="p-4 text-center">
                    <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                        ${row.isHard ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-600'}`}
                      >
                      
                      {row.isHard ? "Hard" : "Soft"}
                      </span></td>
                    <td className="p-4 text-center">{row.isHard ? "-" : row.prioritas}</td>
                    <td className="p-4 flex gap-2 text-center">
                      <button onClick={() => handleEdit(row)} title="Edit" className="text-blue-600">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(row)} title="Hapus" className="text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-d bg-gray-50 text-sm">
            Menampilkan <b>{filteredData.length}</b> dari <b>{data.length}</b> data
          </div>
        </div>

        {showModal && (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg w-full max-w-lg">

      {/* HEADER */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {isEdit ? "Edit" : "Tambah"} Aturan Mengajar Dosen
        </h3>
        <button onClick={() => setShowModal(false)}>
          <X />
        </button>
      </div>

      {/* BODY */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="p-6 space-y-4"
      >

        {/* DOSEN */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Dosen
          </label>
          <select
            value={formData.dosenId}
            onChange={(e) =>
              setFormData({ ...formData, dosenId: e.target.value })
            }
            className="w-full px-3 py-2 mt-1 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Pilih Dosen</option>
            {dosenList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama}
              </option>
            ))}
          </select>
        </div>

        {/* JENIS ATURAN */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Jenis Aturan
          </label>
          <p className="text-xs text-gray-500 mt-1">
          Pilih jenis aturan untuk mengatur jadwal mengajar dosen agar sesuai dengan kebutuhan.
        </p>
          <select
            value={formData.jenisConstraint}
            onChange={(e) =>
              setFormData({
                ...formData,
                jenisConstraint: e.target.value,
                nilaiConstraint: ""
              })
            }
            className="w-full px-3 py-2 mt-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Pilih Jenis Aturan</option>
            <option value="WAJIB_HARI">Wajib Hari</option>
            <option value="HINDARI_SLOT">Hindari Waktu</option>
            <option value="WAJIB_RUANG">Wajib Ruang</option>
            <option value="WAJIB_LANTAI">Wajib Lantai</option>
            <option value="MAKS_SESI_PERHARI">Maksimal Sesi / Hari</option>
          </select>
        </div>

        {/* NILAI ATURAN */}
        {formData.jenisConstraint && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nilai Aturan
            </label>

            {/* PENJELASAN DINAMIS NILAI */}
            <p className="text-xs text-gray-500 mt-1">
              {formData.jenisConstraint === "WAJIB_HARI" &&
                "Dosen hanya boleh dijadwalkan mengajar pada hari yang dipilih."}

              {formData.jenisConstraint === "HINDARI_SLOT" &&
                "Dosen sebisa mungkin tidak dijadwalkan pada waktu ini."}

              {formData.jenisConstraint === "WAJIB_RUANG" &&
                "Dosen harus mengajar di ruang yang dipilih."}

              {formData.jenisConstraint === "WAJIB_LANTAI" &&
                "Dosen harus mengajar di lantai yang dipilih."}

              {formData.jenisConstraint === "MAKS_SESI_PERHARI" &&
                "Batas maksimal jumlah sesi mengajar dosen dalam satu hari."}
            </p>

            <select
              value={formData.nilaiConstraint}
              onChange={(e) =>
                setFormData({ ...formData, nilaiConstraint: e.target.value })
              }
              className="w-full px-3 py-2 mt-1 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Pilih Nilai</option>

              {formData.jenisConstraint === "WAJIB_HARI" &&
                hariList.map(h => (
                  <option key={h.id} value={h.id}>{h.nama}</option>
                ))
              }

              {formData.jenisConstraint === "HINDARI_SLOT" &&
                jamList.map(j => (
                  <option key={j.id} value={j.id}>{j.nama}</option>
                ))
              }

              {formData.jenisConstraint === "WAJIB_RUANG" &&
                ruangList.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.nama} ({r.lokasi})
                  </option>
                ))
              }

              {formData.jenisConstraint === "WAJIB_LANTAI" &&
                [...new Set(
                  ruangList
                    .map(r => r.lokasi)
                    .filter(l => l?.toLowerCase().includes("lantai"))
                )].map(lantai => (
                  <option key={lantai} value={lantai}>{lantai}</option>
                ))
              }

              {formData.jenisConstraint === "MAKS_SESI_PERHARI" && (
                <>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </>
              )}
            </select>
          </div>
        )}

        {/* TIPE CONSTRAINT */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tipe Constraint
          </label>
          <select
            value={formData.tipe}
            onChange={(e) =>
              setFormData({
                ...formData,
                tipe: e.target.value,
                prioritas: e.target.value === "HARD" ? "" : formData.prioritas
              })
            }
            className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Pilih Tipe</option>
            <option value="HARD">Hard</option>
            <option value="SOFT">Soft</option>
          </select>

          {/* PENJELASAN TIPE (MUNCUL SETELAH DIPILIH) */}
          {formData.tipe === "HARD" && (
              <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-500">
           <b>Catatan:</b>
            <p>
            Aturan <strong>Hard</strong> adalah aturan wajib dalam penjadwalan. 
            Sistem akan menyusun jadwal berdasarkan penugasan mengajar yang telah ditetapkan.
          </p>

            </div>
          )}

          {formData.tipe === "SOFT" && (
              <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
                <b>Catatan:</b>
            <p>
              Aturan <strong>Soft</strong> bersifat preferensi. Sistem akan mempertimbangkan aturan ini berdasarkan nilai prioritas. 
                Semakin tinggi nilai prioritas, semakin diutamakan dalam proses penjadwalan.
                Namun aturan ini tetap dapat diabaikan apabila terjadi konflik jadwal.

            </p>
            </div>
          )}
        </div>

        {/* PRIORITAS */}
        {formData.tipe === "SOFT" && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Prioritas
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Digunakan untuk menentukan tingkat kepentingan aturan ini.  
              Semakin tinggi nilainya, semakin diutamakan oleh sistem saat menyusun jadwal.
            </p>
            <input
              type="number"
              min="0"
              max="1000"
              value={formData.prioritas}
              onChange={(e) =>
                setFormData({ ...formData, prioritas: e.target.value })
              }
              className="w-full px-3 py-2 mt-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
              <p className="mt-1 text-xs text-gray-500 italic">
              Contoh: Prioritas 900 lebih diutamakan dibanding prioritas 300.
        </p>
          </div>
          
        )}
      



        {/* FOOTER */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
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
};

export default ConstraintDosen;
