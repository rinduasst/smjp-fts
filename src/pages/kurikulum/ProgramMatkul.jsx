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
  const [selectedMatkul, setSelectedMatkul] = useState([]);
  const [programMatkulList, setProgramMatkulList] = useState([]);

  const [selectedId, setSelectedId] = useState(null);
  const [filterProdi, setFilterProdi] = useState("");
  const [filterKurikulum, setFilterKurikulum] = useState("");
  const [filterPeriode, setFilterPeriode] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [totalData, setTotalData] = useState(0);
  const { user, peran } = useAuth();

  const [form, setForm] = useState({
    prodiId: "",
    kurikulumId: "",
    periodeId: "",
    jumlahKelompokKelas: 1
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

  //fetch data
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
  useEffect(() => {
    fetchMaster();
  }, []);
  
  const toggleMatkul = (id) => {
    setSelectedMatkul((prev) => {
      const exist = prev.find((m) => m.mataKuliahId === id);
      if (exist) {
        return prev.filter((m) => m.mataKuliahId !== id);
      }
      return [
        ...prev,
        { mataKuliahId: id, jumlahKelompokKelas: 1 }
      ];
    });
  };
  const updateJumlahKelas = (id, value) => {
    setSelectedMatkul((prev) =>
      prev.map((m) =>
        m.mataKuliahId === id
          ? { ...m, jumlahKelompokKelas: Number(value) }
          : m
      )
    );
  };
  const fetchMatkulKurikulum = async (kurikulumId) => {
    try {
      const res = await api.get(`/api/kurikulum/kurikulum/${kurikulumId}`);
  
      setMataKuliahList(res.data?.data?.matkul || []);
    } catch (err) {
      console.error(err);
    }
  };
  
  useEffect(() => {
    if (form.kurikulumId) {
      fetchMatkulKurikulum(form.kurikulumId);
      setSelectedMatkul([]);
    }
  }, [form.kurikulumId]);
  useEffect(() => {
    fetchData(page);
  }, [page, searchTerm, filterProdi, filterKurikulum, filterPeriode]);
  const fetchProgramMatkul = async () => {
    try {
      const res = await api.get("/api/kurikulum/program-matkul", {
        params: {
          prodiId: form.prodiId || user?.prodiId,
          periodeId: form.periodeId,
          kurikulumId: form.kurikulumId, 
          pageSize: 50
        }
      });
  
      setProgramMatkulList(res.data?.data?.items || []);
  
    } catch (err) {
      console.error("ERROR PROGRAM MATKUL:", err.response?.data || err);
      console.log("PROGRAM:", programMatkulList);
    }
  };
  useEffect(() => {
    if ((form.prodiId || user?.prodiId) && form.periodeId) {
      fetchProgramMatkul();
    }
  }, [form.prodiId, form.periodeId, form.kurikulumId]);

  const filteredData = data.filter((d) => {
    const matchSearch =
      d.mataKuliah?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.prodi?.nama?.toLowerCase().includes(searchTerm.toLowerCase());
  
    const matchKurikulum = filterKurikulum
      ? d.kurikulum?.nama === filterKurikulum
      : true;
  
    return matchSearch && matchKurikulum;
  });
  const filteredMatkul = mataKuliahList.filter((mk) => {
    if (!mk.mataKuliah) return false;
  
    const sudahDiprogam = programMatkulList.some((pm) => {
      const pmMatkulId = pm.mataKuliahId || pm.mataKuliah?.id;
  
      return (
        pmMatkulId === mk.mataKuliah.id &&
        pm.periodeId === form.periodeId &&
        pm.prodiId === (form.prodiId || user?.prodiId)
      );
    });
  
    return !sudahDiprogam;
  });


  const resetForm = () => {
    setForm({
      prodiId: "",
      kurikulumId: "",
      periodeId: "",
    });
    setIsEdit(false);
    setSelectedId(null);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // EDIT (PATCH)
      if (isEdit) {
        await api.patch(`/api/kurikulum/program-matkul/${selectedId}`, {
          prodiId: form.prodiId,
          kurikulumId: form.kurikulumId,
          periodeId: form.periodeId,
          jumlahKelompokKelas: Number(form.jumlahKelompokKelas),
        });
  
        alert("Data berhasil diupdate");
  
        setShowEditModal(false);
        resetForm();
        fetchData();
        return;
      }

      //  TAMBAH (POST)
    
      if (selectedMatkul.length === 0) {
        alert("Pilih minimal 1 mata kuliah");
        return;
      }
  
      const requests = selectedMatkul.map((mk) =>
        api.post("/api/kurikulum/program-matkul", {
          prodiId: form.prodiId,
          kurikulumId: form.kurikulumId,
          periodeId: form.periodeId,
          mataKuliahId: mk.mataKuliahId,
          jumlahKelompokKelas: Number(mk.jumlahKelompokKelas || 1),
        })
      );
  
      await Promise.all(requests);
  
      alert("Program matkul berhasil dibuat");
  
      setShowAddModal(false);
      setSelectedMatkul([]);
      resetForm();
      fetchData();
  
    } catch (err) {
      const res = err.response?.data;
      console.error("BACKEND ERROR:", res);
  
      alert(res?.message || "Terjadi kesalahan");
  
      setSelectedMatkul([]);
    }
  };
  const handleEdit = (row) => {
    setIsEdit(true);
    setSelectedId(row.id);
    setForm({
      prodiId:
      peran === "TU_PRODI"
        ? user?.prodiId
        : row.prodiId,
      kurikulumId: row.kurikulumId,
      periodeId: row.periodeId,
      mataKuliahId: row.mataKuliahId,
      jumlahKelompokKelas: row.jumlahKelompokKelas,
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

  const filteredKurikulum = kurikulumList.filter((k) =>
  peran === "TU_PRODI"
    ? k.prodi?.id === user?.prodiId
    : true
);


  useEffect(() => {
    if (peran === "TU_PRODI" && user?.prodiId) {
      setForm((prev) => ({
        ...prev,
        prodiId: user.prodiId
      }));
    }
  }, [peran, user?.prodiId]);
  return (
    <MainLayout>
      <div className=" bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Program Mata Kuliah</h1>
          <p className="text-gray-600 mt-2">Pengelolaan mata kuliah yang dibuka pada periode akademik tertentu.</p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <button
            onClick={() => { resetForm();   setIsEdit(false);
              setShowAddModal(true);}}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
          >
            <Plus size={18} />
            Tambah Program
          </button>

        
          <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">

            {/* Filter Prodi */}
            {peran !== "TU_PRODI" && (
            <select
          value={filterProdi}
          onChange={(e) => setFilterProdi(e.target.value)}
          className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
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
              className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
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
              className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
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
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mata Kuliah</th>
          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">SKS</th>
          {peran !== "TU_PRODI" && (
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Program Studi</th>
          )}
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kurikulum</th>
          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Periode</th>
          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Kelas</th>
          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-200">
        {filteredData.map((row) => (
          <tr key={row.id} className="hover:bg-gray-50">
            <td className="px-4 py-3">{row.mataKuliah?.kode} - {row.mataKuliah?.nama}</td>
            <td className="px-4 py-3 text-center">{row.mataKuliah?.sks}</td>
            {peran !== "TU_PRODI" && (
            <td className="px-4 py-3 text-center">
              {row.prodi?.nama}
            </td>
          )}
            <td className="px-4 py-3">{row.kurikulum?.nama}</td>
            <td className="px-4 py-3 text-center">{row.periode?.nama}</td>
            <td className="px-4 py-3 text-center">{row.jumlahKelompokKelas}</td>
            <td className="px-4 py-3 flex justify-center gap-2">
              <button onClick={() => handleEdit(row)} className="text-blue-600" title="Edit">
                <Edit size={16} />
              </button>
              <button onClick={() => handleDelete(row)} className="text-red-600" title="Hapus">
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-700">
        Menampilkan <span className="font-semibold">{(page - 1) * pageSize + 1}     - {Math.min(page * pageSize, totalData)}</span> dari <span className="font-semibold">
        {totalData}   </span>Program  mata kuliah
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
         <div className="bg-white rounded-lg w-full max-w-5xl">

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

            {!isEdit ? (
              // ======================
              // 🟢 FORM TAMBAH (ASLI KAMU)
              // ======================
              <>
                {peran !== "TU_PRODI" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Program Studi
                    </label>
                    <select
                      required
                      value={form.prodiId}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          prodiId: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Pilih Program Studi</option>
                      {prodiList.map((p) => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))}
                    </select>
                  </div>
                )}

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

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Kurikulum
                  </label>
                  <select
                    required
                    value={form.kurikulumId}
                    onChange={(e) => {
                      setForm({ ...form, kurikulumId: e.target.value });
                      setSelectedMatkul([]);
                    }}
                    className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Pilih Kurikulum</option>
                    {filteredKurikulum.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama} - {k.prodi?.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TABEL MATKUL */}
                {form.kurikulumId && (
                  <div className="bg-white rounded-lg shadow border overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">

                      {mataKuliahList.length === 0 ? (
                        <div className="p-6 text-center text-red-500 text-sm">
                          Belum ada mata kuliah yang di-assign ke kurikulum ini!
                        </div>
                      ) : (
                        <>
                          {filteredMatkul.length === 0 && (
                            <div className="p-6 text-center text-yellow-600 text-sm">
                              Semua mata kuliah kurikulum ini sudah diprogram pada periode ini.
                            </div>
                          )}

                          {filteredMatkul.length > 0 && (
                            <table className="w-full text-sm border border-gray-200">
                              <thead className="bg-gray-50">
                                <tr className="text-gray-700 uppercase text-xs tracking-wide">
                                  <th>
                                    <input
                                      type="checkbox"
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedMatkul(
                                            filteredMatkul.map((mk) => ({
                                              mataKuliahId: mk.mataKuliah.id,
                                              jumlahKelompokKelas: 1
                                            }))
                                          );
                                        } else {
                                          setSelectedMatkul([]);
                                        }
                                      }}
                                    />
                                  </th>
                                  <th className="border-b px-3 py-2">Kode</th>
                                  <th className="border-b px-3 py-2">Nama</th>
                                  <th className="border-b px-3 py-2 text-center">SKS</th>
                                  <th className="border-b px-3 py-2 text-center">Semester</th>
                                  <th className="border-b px-3 py-2 text-center">Total Kelas</th>
                                </tr>
                              </thead>

                              <tbody>
                                {filteredMatkul.map((mk) => {
                                  const selected = selectedMatkul.find(
                                    (s) => s.mataKuliahId === mk.mataKuliah.id
                                  );

                                  return (
                                    <tr key={mk.mataKuliah.id} className="border-t border-gray-200">
                                      <td className="px-2 py-1 text-center">
                                        <input
                                          type="checkbox"
                                          checked={!!selected}
                                          onChange={() => toggleMatkul(mk.mataKuliah.id)}
                                        />
                                      </td>

                                      <td className="px-2 py-1 text-center">
                                        {mk.mataKuliah?.kode}
                                      </td>

                                      <td className="px-2 py-1">
                                        {mk.mataKuliah?.nama}
                                      </td>

                                      <td className="px-2 py-1 text-center">
                                        {mk.mataKuliah?.sks}
                                      </td>

                                      <td className="px-2 py-1 text-center">
                                        {mk.semester}
                                      </td>

                                      <td className="text-center">
                                        {selected && (
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            value={selected.jumlahKelompokKelas ?? ""}
                                            onChange={(e) => {
                                              const val = e.target.value.replace(/\D/g, "");
                                              updateJumlahKelas(mk.mataKuliah.id, val);
                                            }}
                                            className="w-10 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-400"
                                          />
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </>
                      )}

                    </div>
                  </div>
                )}
              </>
            ) : (
//form edit
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mata Kuliah</label>
                  <input
                    value={data.find(d => d.id === selectedId)?.mataKuliah?.nama || ""}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Periode</label>
                  <select
                    value={form.periodeId}
                    onChange={(e) =>
                      setForm({ ...form, periodeId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {periodeList.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Kurikulum</label>
                  <select
                    value={form.kurikulumId}
                    onChange={(e) =>
                      setForm({ ...form, kurikulumId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {filteredKurikulum.map((k) => (
                      <option key={k.id} value={k.id}>{k.nama}- {k.prodi?.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Jumlah Kelas</label>
                  <input
                    type="number"
                    value={form.jumlahKelompokKelas}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        jumlahKelompokKelas: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </>
            )}

            {/* TOMBOL (TETAP) */}
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
