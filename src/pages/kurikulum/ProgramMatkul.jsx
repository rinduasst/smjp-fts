import { useEffect, useState } from "react";
import { Search, Plus, X, Edit, Trash2 } from "lucide-react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { useAuth } from "../../hooks/useAuth";

function ProgramMatkul() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [mataKuliahList, setMataKuliahList] = useState([]);

  const [selectedId, setSelectedId] = useState(null);
  const [filterProdi, setFilterProdi] = useState("");
  const [filterKurikulum, setFilterKurikulum] = useState("");
  const [filterPeriode, setFilterPeriode] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [totalData, setTotalData] = useState(0);

  const [form, setForm] = useState({
    prodiId: "",
    kurikulumId: "",
    periodeId: "",
    jenis: "WAJIB",
    jumlahKelompokKelas: 1,
    kode: "",
    nama: "",
    sks: "",
  });

  const [prodiList, setProdiList] = useState([]);
  const [kurikulumList, setKurikulumList] = useState([]);
  const [periodeList, setPeriodeList] = useState([]);

  const totalPages = Math.ceil(totalData / pageSize);
  const uniqueKurikulum = [
    ...new Map(
      kurikulumList.map((k) => [k.nama, k])
    ).values()
  ];

  // ================= FETCH DATA =================
  const fetchData = async (currentPage = page) => {
    try {
      const res = await api.get("/api/kurikulum/program-matkul", {
        params: {
          page: currentPage,
          pageSize,
          prodiId: filterProdi || undefined,
          periodeId: filterPeriode || undefined,
        },
      });

      const response = res.data?.data;
      setData(response?.items || []);
      setTotalData(response?.total || 0);
    } catch (err) {
      console.error("FETCH ERROR:", err.response?.data || err);
    }
  };

  const fetchMaster = async () => {
    try {
      const [prodi, kurikulum, periode] = await Promise.all([
        api.get("/api/master-data/prodi"),
        api.get("/api/kurikulum/kurikulum"),
        api.get("/api/master-data/periode-akademik"),
      ]);

      setProdiList(prodi.data?.data?.items || []);
      setKurikulumList(kurikulum.data?.data?.items || []);
      setPeriodeList(periode.data?.data?.items || []);
    } catch (err) {
      console.error("Error fetching master data:", err);
    }
  };

  const fetchMataKuliah = async () => {
    const res = await api.get("/api/kurikulum/mata-kuliah");
    setMataKuliahList(res.data?.data?.items || []);
  };

  useEffect(() => {
    fetchMaster();
    fetchMataKuliah();
  }, []);

  useEffect(() => {
    fetchData(page);
  }, [page]);

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [searchTerm, filterProdi, filterKurikulum, filterPeriode]);

  const filteredData = data.filter((d) => {
    const matchSearch =
      d.mataKuliah?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.prodi?.nama?.toLowerCase().includes(searchTerm.toLowerCase());
  
    const matchKurikulum = filterKurikulum
      ? d.kurikulum?.nama === filterKurikulum
      : true;
  
    return matchSearch && matchKurikulum;
  });

  const resetForm = () => {
    setForm({
      prodiId: "",
      kurikulumId: "",
      periodeId: "",
      jenis: "WAJIB",
      jumlahKelompokKelas: 1,
      kode: "",
      nama: "",
      sks: "",
    });
    setIsEdit(false);
    setSelectedId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.put(`/api/kurikulum/program-matkul/${selectedId}`, {
          prodiId: form.prodiId,
          kurikulumId: form.kurikulumId,
          periodeId: form.periodeId,
          jumlahKelompokKelas: Number(form.jumlahKelompokKelas),
        });

        alert("Program matkul berhasil diupdate");
        fetchData();
        return;
      }
      const normalizedKode = form.kode.trim().toUpperCase();
      let mataKuliahId = null;
      try {
        const check = await api.get(
          `/api/kurikulum/mata-kuliah?kode=${normalizedKode}`
        );
      
        const items = check.data?.data?.items || [];
        const exactMatch = items.find(
          (mk) => mk.kode === normalizedKode
        );
        if (exactMatch) {
          mataKuliahId = exactMatch.id;
        }
      } catch (err) {
        console.error("CHECK MK ERROR:", err.response?.data || err);
      }
      if (!mataKuliahId) {
        const mkRes = await api.post("/api/kurikulum/mata-kuliah", {
          kode: normalizedKode,
          nama: form.nama,
          jenis: "WAJIB",
          sks: Number(form.sks),
        });
        mataKuliahId = mkRes.data?.data?.id;
      }

      if (!mataKuliahId) {
        throw new Error("Mata kuliah tidak berhasil dibuat.");
      }

      const existingProgram = await api.get(
        "/api/kurikulum/program-matkul",
        {
          params: {
            prodiId: form.prodiId,
            kurikulumId: form.kurikulumId,
            periodeId: form.periodeId,
            mataKuliahId,
          },
        }
      );

      if (existingProgram.data?.data?.items?.length > 0) {
        alert("Program mata kuliah sudah ada.");
        return;
      }

      await api.post("/api/kurikulum/program-matkul", {
        prodiId: form.prodiId,
        kurikulumId: form.kurikulumId,
        periodeId: form.periodeId,
        jumlahKelompokKelas: Number(form.jumlahKelompokKelas),
        mataKuliahId,
      });

      alert("Berhasil tambah dan assign mata kuliah!");
      fetchData();
      resetForm();
      setShowAddModal(false);
      setShowEditModal(false);
    } catch (err) {
      console.error("ERROR:", err.response?.data || err);
      alert("Terjadi kesalahan, cek console.");
    }
  };
  

  const handleEdit = (row) => {
    setIsEdit(true);
    setSelectedId(row.id);
    setForm({
      prodiId: row.prodiId,
      kurikulumId: row.kurikulumId,
      periodeId: row.periodeId,
      jumlahKelompokKelas: row.jumlahKelompokKelas,
      kode: row.mataKuliah?.kode || "",
      nama: row.mataKuliah?.nama || "",
      sks: row.mataKuliah?.sks || "",
    });
    setShowEditModal(true);
  };

  const handleDelete = async (row) => {
    if (
      !window.confirm(
        `Yakin ingin menghapus program mata kuliah ${row.mataKuliah?.nama}?`
      )
    )
      return;

    try {
      await api.delete(`/api/kurikulum/program-matkul/${row.id}`);
      alert("Data berhasil dihapus");
      fetchData();
    } catch (error) {
      console.error(error.response?.data || error);
      alert("Gagal menghapus data");
    }
  };

  const { user, peran } = useAuth();
  useEffect(() => {
    if (peran === "TU_PRODI" && user?.prodiId) {
      setFilterProdi(user.prodiId);
    }
  }, [peran, user]);

  return (
    <MainLayout>
      <div className=" bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Data Mata Kuliah</h1>
          <p className="text-gray-600 mt-2">Pengelolaan mata kuliah pada program studi berdasarkan kurikulum dan periode akademik.</p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <button
            onClick={() => { resetForm();   setIsEdit(false);
              setShowAddModal(true);}}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
          >
            <Plus size={18} />
            Tambah Mata Kuliah
          </button>

        
          <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">

            {/* Filter Prodi */}
            {peran !== "TU_PRODI" && (
            <select
          value={filterProdi}
          onChange={(e) => setFilterProdi(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300
           rounded-lg bg-white text-gray-900 focus:outline-none
           focus:ring-2 focus:ring-green-500
           focus:border-green-500 transition"
        >
          <option value="">Semua Prodi</option>
          {prodiList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </select>
            )}

            {/* Filter Kurikulum */}
            <select
              value={filterKurikulum}
              onChange={(e) => setFilterKurikulum(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300
           rounded-lg bg-white text-gray-900 focus:outline-none
           focus:ring-2 focus:ring-green-500
           focus:border-green-500 transition"
        >

            <option value="">Semua Kurikulum</option>
              {uniqueKurikulum.map((k) => (
                <option key={k.nama} value={k.nama}>
                  {k.nama}
                </option>
              ))}
            </select>

            {/* Filter Periode */}
            <select
              value={filterPeriode}
              onChange={(e) => setFilterPeriode(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300
              rounded-lg bg-white text-gray-900 focus:outline-none
              focus:ring-2 focus:ring-green-500
              focus:border-green-500 transition"
           >
              <option value="">Semua Periode</option>
              {periodeList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>

            <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
          <input type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Mata Kuliah ..." 
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Program Mata Kuliah</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mata Kuliah</th>
                  {peran !== "TU_PRODI" && (
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Program Studi</th>)}
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kurikulum</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Periode</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Kelas</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
              {filteredData.map((row) => (
                  <tr key={row.id} className="border- hover:bg-gray-50">
                    <td className="px-6 py-4">{row.mataKuliah?.kode} - {row.mataKuliah?.nama}</td>
                    {peran !== "TU_PRODI" && (
                    <td className="px-6 py-4">{row.prodi?.nama}</td> )}
                    <td className="px-6 py-4">{row.kurikulum?.nama}</td>
                    <td className="px-6 py-4">{row.periode?.nama}</td>
                    <td className="px-6 py-4">{row.jumlahKelompokKelas}</td>
                    <td className="py-4 px-6 flex gap-2">
                      <button onClick={() => handleEdit(row)} className="text-blue-600" title="Edit "><Edit size={16} /></button>
                      <button onClick={() => handleDelete(row)} className="text-red-600" title="Hapus"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-700">
        Menampilkan {(page - 1) * pageSize + 1}     - {Math.min(page * pageSize, totalData)} dari {totalData} data program matkul
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
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Next
            </button>
          </div>
        </div>
        </div>
        </div>


        {/* MODAL TAMBAH/EDIT */}
        {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEdit ? "Edit Program Matkul" : "Tambah Program Matkul"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}                
                className="text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">

              {/* Prodi */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Program Studi
                </label>
                <select
                  required
                  value={form.prodiId}
                  onChange={(e) => setForm({ ...form, prodiId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Pilih Program Studi</option>
                  {prodiList.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              </div>

              {/* Kurikulum */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kurikulum
                </label>
                <select
                  required
                  value={form.kurikulumId}
                  onChange={(e) => setForm({ ...form, kurikulumId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Pilih Kurikulum</option>
                  {kurikulumList.map((k) => (
                   <option key={k.id} value={k.id}>
                   {k.nama} - {k.prodi?.nama}
                 </option>
                  ))}
                </select>
              </div>

            {/* Mata Kuliah */}
       
              {/* Kode Mata Kuliah */}
              <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode Mata Kuliah</label>
                  <input
                    required
                    className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={form.kode}
                    onChange={(e) => setForm({ ...form, kode: e.target.value })}
                    placeholder="Masukan Kode Mata Kuliah"
                  />
                </div>

                {/* Nama Mata Kuliah */}
                <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Mata Kuliah</label>
                  <input
                    required
                    className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    placeholder="Masukan Nama Mata Kuliah"
                  />
                </div>

                {/* SKS */}
                <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">SKS</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    value={form.sks}
                    onChange={(e) => setForm({ ...form, sks: Number(e.target.value) })}
                    placeholder="Masukan Jumlah SKS Mata Kuliah"
                  />
                </div>
           

              {/* Periode */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Periode
                </label>
                <select
                  required
                  value={form.periodeId}
                  onChange={(e) => setForm({ ...form, periodeId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Pilih Periode</option>
                  {periodeList.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              </div>

              {/* Jumlah Kelompok */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Jumlah Kelompok Kelas
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.jumlahKelompokKelas}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      jumlahKelompokKelas: e.target.value === ""
                        ? ""
                        : Number(e.target.value),
                    })
                  }
                  
                  placeholder="Masukan Jumlah kelompok kelas"
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
                  }}
                  
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
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
}

export default ProgramMatkul;
