import { useState, useEffect } from "react";
import MainLayout from "../../components/MainLayout";
import { Search, Plus, Edit, Trash2, X, Loader2, Eye } from "lucide-react";
import api from "../../api/api";
import { useAuth } from "../../hooks/useAuth";

function PenugasanMengajar() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [filterKelas, setFilterKelas] = useState("");
  const { peran } = useAuth();

  const [formData, setFormData] = useState({
    dosenId: "",
    programMatkulId: "",
    kelompokKelasId: [""],
    jumlahSesiPerMinggu: 1,
    preferensiRuangJenis: "TEORI",
    butuhLab: false,
    status: "DRAF",
    isKelasGabungan: false
  });
  const isFakultas =
  peran === "ADMIN" ||
  peran === "TU_FAKULTAS";

  const isProdi =
  peran === "TU_PRODI";
  const useSearchDosen =
  peran === "ADMIN" ||
  peran === "TU_FAKULTAS";

  const useSearchProgramMatkul =
  peran === "ADMIN" ||
  peran === "TU_FAKULTAS";  


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dosenList, setDosenList] = useState([]);
  const [programMatkulList, setProgramMatkulList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalData, setTotalData] = useState(0);

  const [filterJenisKelas, setFilterJenisKelas] = useState("");
  const [filterAngkatan, setFilterAngkatan] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterKode, setFilterKode] = useState("");

  const fetchData = async (
    currentPage = page,
    currentPageSize = pageSize
  ) => {
    try {
      setLoading(true);
  
      const res = await api.get("/api/pengajaran/penugasan-mengajar", {
        params: {
          page: currentPage,
          pageSize: currentPageSize,
          jenisKelas: filterJenisKelas || undefined,
          angkatan: filterAngkatan || undefined,
          q: searchTerm || undefined
        }
      });
      const response = res.data?.data;
      setData(response?.items || []);
      setTotalData(response?.total || 0);
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setPage(1);
    fetchData(1, pageSize, searchTerm, filterKelas);
  }, [searchTerm, filterKelas]);
  useEffect(() => {
    fetchData(page, pageSize, searchTerm, filterKelas);
  }, [page, pageSize]);

  const totalPage = Math.ceil(totalData / pageSize);
  const fetchDropdown = async () => {
    try {
  
      const promises = [
        api.get("/api/kurikulum/program-matkul"),
        api.get("/api/master-data/kelompok-kelas")
      ];
  
      // hanya fetch dosen kalau SELECT mode
      if (!useSearchDosen) {
        promises.unshift(api.get("/api/master-data/dosen"));
      }
      const results = await Promise.all(promises);
      if (!useSearchDosen) {
        setDosenList(results[0].data?.data?.items || []);
        setProgramMatkulList(results[1].data?.data?.items || []);
        setKelasList(results[2].data?.data?.items || []);
      } else {
        setProgramMatkulList(results[0].data?.data?.items || []);
        setKelasList(results[1].data?.data?.items || []);
      }
  
    } catch (err) {
      console.error(err);
    }
  };
  const fetchProgramMatkul = async () => {
    const res = await api.get("/api/kurikulum/program-matkul", {
      params: {
        page: 1,
        pageSize: 200 // ambil semua
      }
    });
    setProgramMatkulList(res.data.data.items);
  };
  
  useEffect(() => {
    fetchData();
    fetchDropdown();
  }, []);

  const resetForm = () => {
    setFormData({
      dosenId: "",
      programMatkulId: "",
      kelompokKelasId: [""],
      jumlahSesiPerMinggu: 1,
      preferensiRuangJenis: "TEORI",
      butuhLab: false,
      status: "DRAF",
      isKelasGabungan: false
    });
    setSelectedItem(null);
  };

  const handleEdit = (row) => {
    setSelectedItem(row);
    setFormData({
      dosenId: row.dosenId,
      programMatkulId: row.programMatkulId,
      kelompokKelasId: row.kelompokKelasId || [],
      jumlahSesiPerMinggu: row.jumlahSesiPerMinggu,
      preferensiRuangJenis: row.preferensiRuangJenis,
      butuhLab: row.butuhLab,
      status: row.status,
      isKelasGabungan: row.isKelasGabungan ?? false
    });
    setShowModal(true);
  };
  
  
  const isDuplicate = () => {
    return data.some((item) =>
      item.dosenId === formData.dosenId &&
      item.programMatkulId === formData.programMatkulId &&
      JSON.stringify(item.kelompokKelasId?.sort()) ===
        JSON.stringify(formData.kelompokKelasId.filter(Boolean).sort()) &&
      (!selectedItem || item.id !== selectedItem.id)
    );
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    // ngecek duplikat
    if (isDuplicate()) {
      alert("Data penugasan mengajar sudah ada!");
      setShowModal(false);   // auto close
      resetForm();
      setIsSubmitting(false);
      return;
    }
    console.log("PAYLOAD:", formData);
    try {
      const payload = {
        dosenId: formData.dosenId,
        programMatkulId: formData.programMatkulId,
        kelompokKelasIds: formData.kelompokKelasId.filter(Boolean),
        jumlahSesiPerMinggu: Number(formData.jumlahSesiPerMinggu),
        preferensiRuangJenis: formData.preferensiRuangJenis,
        butuhLab: formData.preferensiRuangJenis === "LAB",
        status: formData.status || "DRAF",
        isKelasGabungan: formData.isKelasGabungan
      };
      if (selectedItem) {
        await api.patch(
          `/api/pengajaran/penugasan-mengajar/${selectedItem.id}`,
          payload
        );
        alert("Data penugasan mengajar berhasil diperbarui");
      } else {
        await api.post("/api/pengajaran/penugasan-mengajar", payload);
        alert("Data penugasan mengajar berhasil ditambahkan");
      }
  
      await fetchData();
  
      // ✅ AUTO CLOSE MODAL
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Gagal menyimpan data penugasan mengajar");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  

  const handleDelete = async () => {
    if (!selectedItem) return;
  
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus penugasan mengajar dosen ${selectedItem.dosen?.nama}?`
    );
  
    if (!confirmDelete) {
      setSelectedItem(null);
      return;
    }
  
    try {
      setIsSubmitting(true);
      await api.delete(
        `/api/pengajaran/penugasan-mengajar/${selectedItem.id}`
      );
      alert("Data penugasan mengajar berhasil dihapus");
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus data");
    } finally {
      setIsSubmitting(false);
      setSelectedItem(null);
    }
  };
  //untuk filter dara
  //ambil list angkatan
  const angkatanList = [
    ...new Set(data.flatMap(item => 
      item.kelasList?.map(k => k.kelompokKelas.angkatan)
    ).filter(Boolean))
  ].sort((a,b) => a - b);
  //ambil list jenis kelas
  const jenisKelasList = [
    ...new Set(data.flatMap(item => 
      item.kelasList?.map(k => k.kelompokKelas.jenisKelas)
    ).filter(Boolean))
  ];
  //ambil kode kelas
  const kodeKelasList = [
    ...new Set(data.flatMap(item => 
      item.kelasList?.map(k => k.kelompokKelas.kode)
    ).filter(Boolean))
  ];  
  const filteredData = data.filter(item => {
    const matchAngkatan = !filterAngkatan || item.kelasList?.some(k => k.kelompokKelas.angkatan === Number(filterAngkatan));
    const matchJenis = !filterJenis || item.kelasList?.some(k => k.kelompokKelas.jenisKelas === filterJenis);
    const matchKode   = !filterKode || item.kelasList?.some(k => k.kelompokKelas.kode === filterKode);
  
    const matchSearch =
      item.dosen?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.programMatkul?.mataKuliah?.nama?.toLowerCase().includes(searchTerm.toLowerCase());
  
    return matchAngkatan && matchJenis && matchKode && matchSearch;
  });
  
  
  //carii dosen form tambah
  const [inputDosen, setInputDosen] = useState("");
  const [dosenDropdown, setDosenDropdown] = useState([]);
  const [showDosenDropdown, setShowDosenDropdown] = useState(false);
  const [selectedDosen, setSelectedDosen] = useState(null);
  const [loadingDosen, setLoadingDosen] = useState(false);
  //Buat Function Search Dosen

  const searchDosen = async (keyword) => {
    try {
      setLoadingDosen(true);
  
      const res = await api.get("/api/master-data/dosen", {
        params: { q: keyword, page: 1, pageSize: 10 }
      });
  
      setDosenDropdown(res.data?.data?.items || []);
    } catch (err) {
      console.error("Gagal search dosen:", err);
    } finally {
      setLoadingDosen(false);
    }
  };
  const [programMatkulDropdown, setProgramMatkulDropdown] = useState([]);
  const [inputProgramMatkul, setInputProgramMatkul] = useState("");
  const [selectedProgramMatkul, setSelectedProgramMatkul] = useState(null);
  const [showProgramMatkulDropdown, setShowProgramMatkulDropdown] = useState(false);
  const [kelasList, setKelasList] = useState([]);

  const [showPilihProgramMatkul, setShowPilihProgramMatkul] = useState(false);  
  const [loadingProgramMatkul, setLoadingProgramMatkul] = useState(false);

  const searchProgramMatkul = async (keyword) => {
    try {
      setLoadingProgramMatkul(true);
      const res = await api.get("/api/kurikulum/program-matkul", {
        params: {
          q: keyword,       
          page: 1,
          pageSize: 30      // cukup 10 saja
        }
      });
      setProgramMatkulDropdown(res.data?.data?.items || []);
    } catch (err) {
      console.error("Gagal search program matkul:", err.response?.data || err);
    } finally {
      setLoadingProgramMatkul(false);
    }
  };


    //helper hitung semester + romawi
  //ubah angaktan ke romawi dan semester 
  const toRomawi = (num) => {
    const map = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
    return map[num] || num;
  };
  
  const hitungSemester = (angkatan, tahunMulai, paruh) => {
    return (tahunMulai - angkatan) * 2 + (paruh === "GENAP" ? 2 : 1);
  };
  return (
    <MainLayout>
      <div className=" bg-gray-50 min-h-screen">

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Penugasan Mengajar</h1>
          <p className="text-gray-600 mt-2">
          Penetapan dosen pengampu pada mata kuliah dan kelas tertentu
          </p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row justify-between gap-4">
        {peran === "TU_PRODI" && (
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition"
          >
            <Plus size={18} /> Tambah Penugasan
          </button>)}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <select  className="w-full px-3 py-2.5 border border-gray-300
           rounded-lg bg-white text-gray-900 focus:outline-none
           focus:ring-2 focus:ring-green-500
           focus:border-green-500 transition"
            value={filterJenis} onChange={e => setFilterJenis(e.target.value)}>
            <option value="">Semua Jenis</option>
            {jenisKelasList.map(jenis => (
              <option key={jenis} value={jenis}>{jenis}</option>
            ))}
          </select>

          <select  className="w-full px-3 py-2.5 border
           border-gray-300
            rounded-lg bg-white text-gray-900
             focus:outline-none
                    focus:ring-2 focus:ring-green-500
                    focus:border-green-500 transition"
                    
                value={filterKode} onChange={e => setFilterKode(e.target.value)}>
            <option value="">Semua Kode</option>
            {kodeKelasList.map(kode => (
              <option key={kode} value={kode}>{kode}</option>
            ))}
          </select>

          <select className="w-full px-3 py-2.5 border border-gray-300
                  rounded-lg bg-white text-gray-900 focus:outline-none
                  focus:ring-2 focus:ring-green-500
                  focus:border-green-500 transition"
             value={filterAngkatan} onChange={e => setFilterAngkatan(e.target.value)}>
            <option value="">Semua Angkatan</option>
            {angkatanList.map(tahun => (
              <option key={tahun} value={tahun}>{tahun}</option>
            ))}
          </select>
    
          <div className="relative w-full sm:max-w-sm">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
          />
        </div>

          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Penugasan Mengajar</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Dosen", "Mata Kuliah", "Kelas", "Jumlah Sesi", "Jenis Ruang","Status Pengajuan", "Aksi"].map(h => (
                    <th key={h} className="py-3 px-2 text-center text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center">
                      <Loader2 className="animate-spin mx-auto" />
                    </td>
                  </tr>
           ):   filteredData.length ? (
                filteredData.map(row => (
                    <tr key={row.id}>
                      <td className="py-2 px-6 text-left ">{row.dosen?.nama}</td>
                      <td className="py-2 px-2 text-left">{row.programMatkul?.mataKuliah?.nama}</td>
                      <td className="text-center">
                      {row.kelasList?.map(k => {
                      const periode = row.programMatkul?.periode;
                      if (!periode) return "-";

                      const smt = hitungSemester(
                        k.kelompokKelas.angkatan,
                        periode.tahunMulai,
                        periode.paruh
                      );

                      return `${toRomawi(smt)}_${k.kelompokKelas.jenisKelas === "REGULER" ? "REG" : "KAR"}_${k.kelompokKelas.kode}`;
                    }).join("dan ")}
                    </td>
                      <td className="text-center">{row.jumlahSesiPerMinggu}</td>
                      <td className="text-center">                  
                      {row.preferensiRuangJenis ?? (row.butuhLab ? "LAB" : "TEORI")}
                    </td>


                      <td className="py-2 px-3 text-center">
                      <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                      ${row.status === 'SIAP'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-600'}`}
                    >
                      {row.status}
                    </span>

                    </td>
                      <td className="py-4 px-6 flex gap-2">
                        <button onClick={() => handleEdit(row)} title="Edit" className="text-blue-600">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => { setSelectedItem(row); handleDelete(); }} title="Hapus" className="text-red-600">
                          <Trash2 size={16} />
                        </button>
                        <button
                       onClick={() => {
                        setSelectedItem(row);
                        setShowDetail(true);
                      }}
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
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-700">
            Menampilkan {(page - 1) * pageSize + 1} -
          {Math.min(page * pageSize, totalData)} dari {totalData} data penugasan
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
              disabled={page === totalPage}
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
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                  {selectedItem ? "Edit" : "Tambah"} Penugasan Mengajar
                </h3>
                <button onClick={() => setShowModal(false)}>
                  <X />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* DOSEN */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Dosen
              </label>
              {useSearchDosen ? (
                // MODE SEARCH (FAKULTAS)
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari Dosen..."
                    value={selectedDosen ? selectedDosen.nama : inputDosen}
                    onChange={(e) => {
                      setInputDosen(e.target.value);
                      setShowDosenDropdown(true);
                      setSelectedDosen(null);
                      if (e.target.value.trim() !== "")
                        searchDosen(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-gray-100 rounded"
                    required
                  />
                  {showDosenDropdown && (
                    <div className="absolute z-50 w-full bg-white border max-h-60 overflow-y-auto rounded shadow">
                      {dosenDropdown.map(d => (
                        <div
                          key={d.id}
                          onClick={() => {
                            setSelectedDosen(d);
                            setFormData(prev => ({
                              ...prev,
                              dosenId: d.id
                            }));
                            setInputDosen("");
                            setShowDosenDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {d.nama}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                  ) : (
                    // MODE SELECT (PRODI)
                    <select
                      value={formData.dosenId}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          dosenId: e.target.value
                        }))
                      }
                      className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Pilih Dosen</option>
                      {dosenList.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.nama}
                        </option>
                      ))}
                    </select>
                  )}
              {/* MATA KULIAH */}
              <label className="block text-sm font-medium text-gray-700 mb-1">
                 Mata Kuliah
              </label>
                {useSearchProgramMatkul ? (
                  // SEARCH MODE (ADMIN & TU_FAKULTAS)
                  <div className="relative">
                
                    <button
                      type="button"
                      onClick={async () => {
                        setShowPilihProgramMatkul(true);
                        await fetchProgramMatkul();
                      }}
                      className="flex-1 px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {selectedProgramMatkul
                        ? `${selectedProgramMatkul.mataKuliah.kode} - ${selectedProgramMatkul.mataKuliah.nama}`
                        : "Pilih Program Mata Kuliah"}
                    </button>
                  </div>
                ) : (
                // SELECT MODE (TU_PRODI)
                <select
                  value={formData.programMatkulId}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      programMatkulId: e.target.value
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Pilih Program Mata Kuliah</option>
                  {programMatkulList.map(pm => (
                    <option key={pm.id} value={pm.id}>
                      {pm.mataKuliah.kode} - {pm.mataKuliah.nama}
                    </option>
                  ))}
                </select>
                )}
              {/* KELAS GABUNGAN (MULTI SELECT) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kelas
                </label>
                <div className="space-y-2">
                  {formData.kelompokKelasId.map((val, idx) => (
                    <div key={idx} className="flex gap-2">
                      <select
                        value={val}
                        onChange={(e) => {
                          const updated = [...formData.kelompokKelasId];
                          updated[idx] = e.target.value;

                          setFormData(prev => ({
                            ...prev,
                            kelompokKelasId: updated
                          }));
                        }}
                        className="flex-1 px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="">Pilih Kelas</option>
                        {kelasList.map(item => (
                          <option key={item.id} value={item.id}>
                            Kelas {item.kode} -  {item.angkatan} 
                          </option>
                        ))}
                      </select>
                      

                      {formData.kelompokKelasId.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.kelompokKelasId.filter((_, i) => i !== idx);
                            setFormData(prev => ({
                              ...prev,
                              kelompokKelasId: updated
                            }));
                          }}
                          className="px-3 bg-red-500 text-white rounded"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
              <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isKelasGabungan}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    isKelasGabungan: e.target.checked,
                    // kalau uncheck, reset jadi 1 kelas saja
                    kelompokKelasId: e.target.checked ? prev.kelompokKelasId : [""]
                  }))
                }
              />
              <label className="text-sm font-medium text-gray-700">
                Kelas Gabungan
              </label>
            </div>

            {/* Muncul hanya jika dicentang */}
            {formData.isKelasGabungan && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      kelompokKelasId: [...prev.kelompokKelasId, ""]
                    }))
                  }
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-all duration-200"
                >
                  <Plus size={14} />
                  Tambah Kelas Gabungan
                </button>

                <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
                  <b>Catatan:</b> Tambah kelas hanya digunakan apabila mata kuliah diselenggarakan 
                  sebagai <b>kelas gabungan</b>.
                </div>
              </>
            )}
            </div>

              </div>
        
              <div>
              <label className="block text-sm font-medium text-gray-700">Masukan Sesi</label>
              <input
                  type="number"
                  min="1"
                  value={formData.jumlahSesiPerMinggu}
                  onChange={e => setFormData({ ...formData, jumlahSesiPerMinggu: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700">Pilih Jenis Preferensi </label>
              <select
                  value={formData.preferensiRuangJenis}
                  onChange={e => setFormData({ ...formData, preferensiRuangJenis: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                  <option value="TEORI">TEORI</option>
                  <option value="LAB">LAB</option>
                </select>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="DRAF">DRAF</option>
                  <option value="SIAP">SIAP</option>
                </select>
              </div>


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
              {showDetail && selectedItem && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl">
            
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Detail Penugasan Mengajar</h3>
              <button onClick={() => setShowDetail(false)}>
                <X />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4 text-sm">

              <div>
                <p className="text-gray-500">Dosen</p>
                <p className="font-medium">{selectedItem.dosen?.nama}</p>
              </div>

              <div>
                <p className="text-gray-500">Mata Kuliah</p>
                <p className="font-medium">
                  {selectedItem.programMatkul?.mataKuliah?.kode} - {selectedItem.programMatkul?.mataKuliah?.nama}
                </p>
              </div>

              <div>
                <p className="text-gray-500">SKS</p>
                <p className="font-medium">
                  {selectedItem.programMatkul?.mataKuliah?.sks}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Prodi</p>
                <p className="font-medium">
                  {selectedItem.programMatkul?.prodi?.nama}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Periode</p>
                <p className="font-medium">
                  {selectedItem.programMatkul?.periode?.nama}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Preferensi Ruang</p>
                <p className="font-medium">
                  {selectedItem.butuhLab ? "LAB" : "TEORI"}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-gray-500">Kelas</p>
                <p className="font-medium">
                  {selectedItem.kelasList?.map(k =>
                    `${k.kelompokKelas.kode} - ${k.kelompokKelas.angkatan}`
                  ).join(" , ")}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Jumlah Sesi dalam Seminggu</p>
                <p className="font-medium">{selectedItem.jumlahSesiPerMinggu}</p>
              </div>

              <div>
                <p className="text-gray-500">Status Mengajar</p>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold
                  ${selectedItem.status === "SIAP"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-700"}
                `}>
                  {selectedItem.status}
                </span>
              </div>

            </div>
                {/* Footer */}
        <div className="px-6 py-4 border-gray-200 flex justify-end bg-white">
          <button
            onClick={() => setShowDetail(false)}
            className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition"
          >
            Tutup
          </button>
        </div>
          </div>
        </div>
      )}
      </div>
      {/* MODAL PILIH PROGRAM MATKUL */}
          {showPilihProgramMatkul && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-5xl">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    Pilih Program Mata Kuliah
                  </h3>
                  <button onClick={() => setShowPilihProgramMatkul(false)}>
                    <X />
                  </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">

                  {loadingProgramMatkul ? (
                    <div className="text-center py-4">
                      <Loader2 className="animate-spin mx-auto" />
                    </div>
                  ) : (

                    <table className="w-full text-sm border">

                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border px-3 py-2">Kode</th>
                          <th className="border px-3 py-2">Nama</th>
                          <th className="border px-3 py-2">Prodi</th>
                          <th className="border px-3 py-2">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {programMatkulList.map(pm => (
                          <tr key={pm.id} className="hover:bg-gray-50">
                            <td className="border px-3 py-2">
                              {pm.mataKuliah?.kode}
                            </td>
                            <td className="border px-3 py-2">
                              {pm.mataKuliah?.nama}
                            </td>
                            <td className="border px-3 py-2">
                              {pm.prodi?.nama}
                            </td>
                            <td className="border px-3 py-2 text-center">
                              <button
                                onClick={() => {
                                  setSelectedProgramMatkul(pm);
                                  setFormData(prev => ({
                                    ...prev,
                                    programMatkulId: pm.id
                                  }));
                                  setShowPilihProgramMatkul(false);
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Pilih
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
    </MainLayout>
  );
}

export default PenugasanMengajar;
