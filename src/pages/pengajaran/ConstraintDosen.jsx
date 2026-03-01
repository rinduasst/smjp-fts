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
    tipe: "HARD",
    prioritas: "",
    constraints: {
      WAJIB_HARI: "",
      WAJIB_RUANG: "",
      WAJIB_LANTAI: "",
      HINDARI_SLOT: "",
      MAKS_SESI_PERHARI: "",
    }
  });
  // fetch master
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

  // form
  const resetForm = () => {
    setFormData({
      dosenId: "",
      tipe: "HARD",
      prioritas: "",
      constraints: {
        WAJIB_HARI: null,
        WAJIB_RUANG: null,
        WAJIB_LANTAI: null,
        HINDARI_SLOT: null,
        MAKS_SESI_PERHARI: null,
      }
    });
    setIsEdit(false);
    setSelectedId(null);
  };

  const handleEdit = (row) => {
    setFormData({
      dosenId: row.dosenId,
      tipe: row.isHard ? "HARD" : "SOFT",
      prioritas: row.prioritas || ""
    });
    setSelectedId(row.id);
    setIsEdit(true);
    setShowModal(true);
  };
  
  const handleSubmit = async () => {
    const payload = Object.entries(formData.constraints)
      .filter(([_, v]) => v !== null && v !== "")
      .map(([jenis, nilai]) => ({
        dosenId: formData.dosenId,
        jenisConstraint: jenis,
        nilaiConstraint: nilai,
        isHard: formData.tipe === "HARD",
        prioritas: formData.tipe === "SOFT" ? Number(formData.prioritas) : null
      }));
  
    if (!payload.length) {
      alert("Minimal pilih 1 aturan");
      return;
    }
  
    try {
      await Promise.all(
        payload.map(item =>
          api.post("/api/pengajaran/constraint-dosen", item)
        )
      );
  
      alert("Berhasil menyimpan aturan");
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Gagal simpan data");
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
    return data.filter((item) => {
      const matchSearch =
        item.dosen?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mapJenisConstraint(item.jenisConstraint)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
  
      const matchJenis =
        filterJenis === "" || item.jenisConstraint === filterJenis;
  
      return matchSearch && matchJenis;
    });
  }, [data, searchTerm, filterJenis]);
  const jenisList = [
    "WAJIB_HARI",
    "WAJIB_RUANG",
    "WAJIB_LANTAI",
    "HINDARI_SLOT",
    "MAKS_SESI_PERHARI"
  ];
  const getDisplayNilai = (row) => {
    switch (row.jenisConstraint) {
      case "WAJIB_HARI":
        return hariList.find(h => h.id === row.nilaiConstraint)?.nama || "-";
  
      case "WAJIB_RUANG":
        const ruang = ruangList.find(r => r.id === row.nilaiConstraint);
        return ruang ? `${ruang.nama} (${ruang.lokasi})` : "-";
  
      case "HINDARI_SLOT":
        const jam = jamList.find(j => j.id === row.nilaiConstraint);
        return jam ? `${jam.nama} (${jam.jamMulai}-${jam.jamSelesai})` : "-";
  
      case "WAJIB_LANTAI":
        return row.nilaiConstraint;
  
      case "MAKS_SESI_PERHARI":
        return `${row.nilaiConstraint} sesi`;
  
      default:
        return "-";
    }
  };
  const renderInputByJenis = (jenis) => {
    switch (jenis) {
      case "WAJIB_HARI":
        return (
          <select
          className="w-full px-3 py-2 mt-1 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={formData.constraints.WAJIB_HARI}
            onChange={(e) =>
              setFormData(prev => ({
                ...prev,
                constraints: {
                  ...prev.constraints,
                  WAJIB_HARI: e.target.value
                }
              }))
            }
          >
            <option value="">Pilih Hari</option>
            {hariList.map(h => (
              <option key={h.id} value={h.id}>{h.nama}</option>
            ))}
          </select>
        );
  
      case "WAJIB_RUANG":
        return (
          <select
          className="w-full px-3 py-2 mt-1 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={formData.constraints.WAJIB_RUANG}
            onChange={(e) =>
              setFormData(prev => ({
                ...prev,
                constraints: {
                  ...prev.constraints,
                  WAJIB_RUANG: e.target.value
                }
              }))
            }
          >
            <option value="">Pilih Ruang</option>
            {ruangList.map(r => (
              <option key={r.id} value={r.id}>{r.nama}</option>
            ))}
          </select>
        );
  
      case "HINDARI_SLOT":
        return (
          <select
          className="w-full px-3 py-2 mt-1 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={formData.constraints.HINDARI_SLOT}
            onChange={(e) =>
              setFormData(prev => ({
                ...prev,
                constraints: {
                  ...prev.constraints,
                  HINDARI_SLOT: e.target.value
                }
              }))
            }
          >
            <option value="">Pilih Sesi</option>
            {jamList.map(j => (
              <option key={j.id} value={j.id}>
                {j.nama} ({j.jamMulai}-{j.jamSelesai})
              </option>
            ))}
          </select>
        );
  
      case "WAJIB_LANTAI":
        return (
          <select
          className="w-full px-3 py-2 mt-1 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={formData.constraints.WAJIB_LANTAI}
            onChange={(e) =>
              setFormData(prev => ({
                ...prev,
                constraints: {
                  ...prev.constraints,
                  WAJIB_LANTAI: e.target.value
                }
              }))
            }
          >
            <option value="">Pilih Lantai</option>
            {[...new Set(
              ruangList.map(r => r.lokasi)
                .filter(l => l?.toLowerCase().includes("lantai"))
            )].map(lantai => (
              <option key={lantai} value={lantai}>{lantai}</option>
            ))}
          </select>
        );
  
      case "MAKS_SESI_PERHARI":
        return (
          <select
          className="w-full px-3 py-2 mt-1 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={formData.constraints.MAKS_SESI_PERHARI}
            onChange={(e) =>
              setFormData(prev => ({
                ...prev,
                constraints: {
                  ...prev.constraints,
                  MAKS_SESI_PERHARI: e.target.value
                }
              }))
            }
          >
            <option value="">Pilih</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        );
  
      default:
        return null;
    }
  };
  // render
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
                      {getDisplayNilai(row)}
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
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">

          {/* HEADER */}
          <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {isEdit ? "Edit" : "Tambah"} Aturan Mengajar Dosen
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X />
            </button>
          </div>

          {/* BODY */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex-1 overflow-y-auto p-6 space-y-2"
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
                className="w-full px-3 py-2 mt-1 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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

        {/* ATURAN MENGAJAR */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Aturan Mengajar
          </label>

          {jenisList.map(jenis => (
            <div
              key={jenis}
              className={`p-3 rounded-lg border space-y-2
                ${formData.constraints[jenis] !== null
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200 bg-white"
                }
              `}
            >
              {/* HEADER CHECKBOX */}
             <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <input
                  type="checkbox"
                  checked={formData.constraints[jenis] !== null}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      constraints: {
                        ...prev.constraints,
                        [jenis]: e.target.checked ? "" : null
                      }
                    }))
                  }
                  className="w-4 h-4"
                />

                <span className="text-sm font-medium">
                  {mapJenisConstraint(jenis)}
                </span>
              </div>

              {/* INPUT DI BAWAH */}
              {formData.constraints[jenis] !== null && (
                <div  >
                  {renderInputByJenis(jenis)}
                </div>
              )}
            </div>
          ))}
        </div>
      {/* TIPE */}
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
          className="w-full px-3 py-2 mt-1 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Pilih Tipe</option>
          <option value="HARD">Hard</option>
          <option value="SOFT">Soft</option>
        </select>

        {formData.tipe === "HARD" && (
          <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            <b>Catatan:</b>
            <p>
              Aturan <strong>Hard</strong> aturan utama yang selalu diutamakan sistem dan tidak boleh dilanggar.
            </p>
          </div>
        )}

        {formData.tipe === "SOFT" && (
          <div className="mt-3">
             <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            <b>Catatan:</b>
            <p>
              Aturan <strong>Soft</strong> adalah aturan preferensi yang bisa dilanggar jika terjadi konflik jadwal.
            </p>
          </div>
          <label className="block text-sm font-medium text-gray-700">
          Prioritas
        </label>

        <p className="text-xs text-gray-500 mt-1">
          Menentukan tingkat kepentingan aturan ini dalam proses penjadwalan.
        </p>

        <select
          value={formData.prioritas}
          onChange={(e) =>
            setFormData({ ...formData, prioritas: e.target.value })
          }
          className="w-full px-3 py-2 mt-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        >
          <option value="300">Rendah</option>
          <option value="500">Normal (Default)</option>
          <option value="700">Tinggi</option>
          <option value="990">Utama</option>
        </select>

        {/* <p className="mt-1 text-xs text-gray-400 italic">
          Contoh: Prioritas <b>Utama</b> akan lebih diutamakan dibanding <b>Normal</b>.
        </p> */}

          </div>
        )}
  </div>
      </form>

            {/* FOOTER */}
            <div className="px-6 py-4 border-t  border-gray-300 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Simpan
              </button>
            </div>

          </div>
        </div>
      )}
    </div>

    </MainLayout>
  );
};

export default ConstraintDosen;
