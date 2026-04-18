import { X, Plus, Trash } from "lucide-react";
import api from "../../api/api";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";

function PenugasanFormModal({
  showModal,
  setShowModal,
  handleSubmit,
  isSubmitting,
  isEdit = false,
  selectedItem,
  dataPenugasan
}) {

  const [selectedDosen, setSelectedDosen] = useState(null);
  const [inputDosen, setInputDosen] = useState("");
  const [dosenDropdown, setDosenDropdown] = useState([]);
  const [showDosenDropdown, setShowDosenDropdown] = useState(false);
  const [loadingDosen, setLoadingDosen] = useState(false);

  const [inputMatkul, setInputMatkul] = useState("");
  const [matkulDropdown, setMatkulDropdown] = useState([]);
  const [showMatkulDropdown, setShowMatkulDropdown] = useState(false);

  const [pengajaranList, setPengajaranList] = useState([]);
  const [prodiList, setProdiList] = useState([]);
  const [selectedProdi, setSelectedProdi] = useState(null);

  const timeoutRef = useRef(null);
  const { user, peran } = useAuth();
  const [periodeList, setPeriodeList] = useState([]);

  //  FETCH PRODI + RESET
  useEffect(() => {
    if (!showModal) {
      setPengajaranList([]);
      setSelectedDosen(null);
      setInputDosen("");
      setInputMatkul("");
      return;
    }
  
    fetchProdi();
    fetchPeriode(); 
  
    if (peran === "TU_PRODI") {
      setSelectedProdi(user?.prodi);
    }
  
  }, [showModal]);
  //  FETCH PRODI
  const fetchProdi = async () => {
    try {
      const res = await api.get("/api/master-data/prodi");
      setProdiList(res.data?.data?.items || []);
    } catch (err) {
      console.error("ERROR PRODI:", err);
    }
  };

  // SEARCH DOSEN
  const searchDosen = async (keyword) => {
    try {
      setLoadingDosen(true);

      const res = await api.get("/api/master-data/dosen", {
        params: { q: keyword, page: 1, pageSize: 50 }
      });

      setDosenDropdown(res.data?.data?.items || []);
    } catch (err) {
      console.error("ERROR DOSEN:", err);
    } finally {
      setLoadingDosen(false);
    }
  };

  // SEARCH MATKUL (WAJIB ADA PRODI)
  const searchMatkul = async (keyword) => {
    if (!selectedProdi) return;

    try {
      const res = await api.get("/api/kurikulum/program-matkul", {
        params: {
          q: keyword,
          page: 1,
          pageSize: 10,
          prodiId: selectedProdi.id
        }
      });

      setMatkulDropdown(res.data?.data?.items || []);
    } catch (err) {
      console.error("ERROR MATKUL:", err);
    }
  };

  //  FETCH KELAS
  const fetchKelas = async (programMatkulId) => {
    try {
      const res = await api.get("/api/master-data/kelompok-kelas", {
        params: {
          programMatkulId,
          page: 1,
          pageSize: 100,
          prodiId: selectedProdi?.id
        }
      });

      return res.data?.data?.items || [];
    } catch (err) {
      console.error("ERROR KELAS:", err);
      return [];
    }
  };
  const fetchPeriode = async () => {
    try {
      const res = await api.get("/api/master-data/periode-akademik"); 
      setPeriodeList(res.data?.data?.items || []);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // TAMBAH MATKUL
  const tambahPengajaran = async (pm) => {
    const kelas = await fetchKelas(pm.id);

    setPengajaranList((prev) => {
      const sudahAda = prev.find(p => p.programMatkulId === pm.id);
      if (sudahAda) return prev;

      return [
        ...prev,
        {
          programMatkulId: pm.id,
          namaMatkul: `${pm.mataKuliah.kode} - ${pm.mataKuliah.nama}`,
          kelasList: kelas,
          kelasGabungan: [""],
          periode: pm.periode,
          jumlahSesiPerMinggu: 1,
          preferensiRuangJenis: "TEORI",
          status: "SIAP"
        }
      ];
    });
  };

  //  UPDATE
  const updateRow = (index, field, value) => {
    const updated = [...pengajaranList];
    updated[index][field] = value;
    setPengajaranList(updated);
  };

  const updateKelas = (rowIndex, kelasIndex, value) => {
    const updated = [...pengajaranList];
    updated[rowIndex].kelasGabungan[kelasIndex] = value;
    setPengajaranList(updated);
  };

  const gabungKelas = (rowIndex) => {
    const updated = [...pengajaranList];
    updated[rowIndex].kelasGabungan.push("");
    setPengajaranList(updated);
  };

  const hapusKelas = (rowIndex, kelasIndex) => {
    const updated = [...pengajaranList];
    updated[rowIndex].kelasGabungan.splice(kelasIndex, 1);

    if (updated[rowIndex].kelasGabungan.length === 0) {
      updated.splice(rowIndex, 1);
    }

    setPengajaranList(updated);
  };
const tambahKelas = (row) => {
  setPengajaranList(prev => [
    ...prev,
    {
      programMatkulId: row.programMatkulId,
      namaMatkul: row.namaMatkul,
      kelasList: row.kelasList,
      kelasGabungan: [""], // default 1 kelas
      periode: row.periode,
      jumlahSesiPerMinggu: row.jumlahSesiPerMinggu,
      preferensiRuangJenis: row.preferensiRuangJenis,
      status: row.status
    }
  ]);
};
  //  SUBMIT
  const submitForm = (e) => {
    e.preventDefault();
  
    if (!selectedDosen) {
      alert("Pilih dosen terlebih dahulu");
      return;
    }
  
    if (isEdit) {
      const payload = [{
        id: selectedItem.id,
        dosenId: selectedDosen.id,
        programMatkulId: selectedItem.programMatkul?.id,
        kelompokKelasIds: editForm.kelasGabungan.filter(k => k !== ""),
        jumlahSesiPerMinggu: editForm.jumlahSesiPerMinggu,
        preferensiRuangJenis: editForm.preferensiRuangJenis,
        status: editForm.status,
        prodiId: selectedProdi?.id
      }];
    
      handleSubmit(payload);
    } else {
      const payload = pengajaranList.map((p) => ({
        dosenId: selectedDosen.id,
        programMatkulId: p.programMatkulId,
        kelompokKelasIds: p.kelasGabungan.filter(k => k !== ""),
        jumlahSesiPerMinggu: p.jumlahSesiPerMinggu,
        preferensiRuangJenis: p.preferensiRuangJenis,
        status: p.status,
        prodiId: selectedProdi?.id
      }));
  
      handleSubmit(payload);
    }
  };
  useEffect(() => {
    if (isEdit && selectedItem) {
      setSelectedDosen(selectedItem.dosen);
  
      setEditForm({
        periodeId: selectedItem.programMatkul?.periode?.id || "",
        kurikulumId: selectedItem.programMatkul?.kurikulum?.id || "",
        jumlahKelompokKelas: selectedItem.kelasList?.length || 1,
        kelasGabungan: selectedItem.kelasList?.map(k => k.kelompokKelas.id) || [""],
        jumlahSesiPerMinggu: selectedItem.jumlahSesiPerMinggu,
        preferensiRuangJenis: selectedItem.preferensiRuangJenis,
        status: selectedItem.status
      });
    }
  }, [isEdit, selectedItem]);
  const [editForm, setEditForm] = useState({
    periodeId: "",
    kurikulumId: "",
    jumlahKelompokKelas: 1,
    kelasGabungan: [""],
    jumlahSesiPerMinggu: 1,
    preferensiRuangJenis: "TEORI",
    status: "SIAP"
  });

  // WAJIB DI SINI (SETELAH SEMUA HOOKS)
  if (!showModal) return null;
  const toRomawi = (num) => {
    const map = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
    return map[num] || num;
  };
  
  const hitungSemester = (angkatan, tahunMulai, paruh) => {
    return (tahunMulai - angkatan) * 2 + (paruh === "GENAP" ? 2 : 1);
  };
  
  const formatKelas = (kelas, periode) => {
    if (!periode) return kelas.kode;
  
    const semester = hitungSemester(
      kelas.angkatan,
      periode.tahunMulai,
      periode.paruh
    );
  
    const romawi = toRomawi(semester);
    const jenis = kelas.jenisKelas === "REGULER" ? "REG" : "KAR";
  
    return `${romawi}_${jenis}_${kelas.kode}`;
  };

  
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl">
        <div className="px-6 py-4 border-b border-gray-400 flex justify-between items-center">
        <h3 className="text-lg font-semibold">
        {isEdit ? "Edit Penugasan Mengajar" : "Tambah Penugasan Mengajar"}
      </h3>
          <button onClick={() => setShowModal(false)}>
            <X />
          </button>
        </div>
        <form onSubmit={submitForm} className="p-6 space-y-6">

        {!isEdit ? (
          // ======================
          // 🟢 TAMBAH
          // ======================
          <>
            {/* PRODI */}
            {(peran === "ADMIN" || peran === "TU_FAKULTAS") && (
              <div>
                <label className="text-sm font-medium">Program Studi</label>
                <select
                  value={selectedProdi?.id || ""}
                  onChange={(e) => {
                    const prodi = prodiList.find(p => p.id === e.target.value);
                    setSelectedProdi(prodi);
                    setPengajaranList([]);
                    
                  }}
                  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  
                >
                  <option value="">Pilih Prodi</option>
                  {prodiList.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              </div>
            )}

            {/* DOSEN */}
            <div>
              <label className="text-sm font-medium">Dosen</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari dosen..."
                  value={selectedDosen ? selectedDosen.nama : inputDosen}
                  onChange={(e) => {
                    const value = e.target.value;

                    setSelectedDosen(null);
                    setInputDosen(value);
                    setShowDosenDropdown(true);

                    if (timeoutRef.current) clearTimeout(timeoutRef.current);

                    timeoutRef.current = setTimeout(() => {
                      if (value.trim().length >= 2) {
                        searchDosen(value);
                      }
                    }, 300);
                  }}
                  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                {showDosenDropdown && (
                  <div className="absolute w-full bg-white shadow max-h-60 overflow-y-auto z-50">
                    {loadingDosen && <div className="px-3 py-2">Loading...</div>}

                    {!loadingDosen && dosenDropdown.length === 0 && (
                      <div className="px-3 py-2">Dosen tidak ditemukan</div>
                    )}

                    {dosenDropdown.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          setSelectedDosen(d);
                          setShowDosenDropdown(false);
                          setInputDosen("");
                        }}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {d.nama}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SEARCH MATKUL */}
            <div className="relative">
          <label className="text-sm font-medium">Tambah Mata Kuliah</label>

          <input
            type="text"
            placeholder="Cari mata kuliah..."
            value={inputMatkul}
            onChange={(e) => {
              const value = e.target.value;
              setInputMatkul(value);
              setShowMatkulDropdown(true);

              if (value.trim() !== "") {
                searchMatkul(value);
              }
            }}
            className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  
          />

          {showMatkulDropdown && (
             <div className="absolute w-full bg-white shadow max-h-60 overflow-y-auto z-50">
              {matkulDropdown.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Tidak ditemukan
                </div>
              ) : (
                matkulDropdown.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      tambahPengajaran(m);
                      setShowMatkulDropdown(false);
                      setInputMatkul("");
                    }}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {m.mataKuliah.kode} - {m.mataKuliah.nama}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

          </>
        ) : (
          // ======================
          // 🔵 EDIT
          // ======================
          <>
          <div>
            <label className="text-sm font-medium">Dosen</label>
            <input
              value={selectedDosen?.nama || ""}
              disabled
              className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        
          <div>
            <label className="text-sm font-medium">Mata Kuliah</label>
            <input
              value={selectedItem?.programMatkul?.mataKuliah?.nama || ""}
              disabled
              className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        
          <div>
            <label className="text-sm font-medium">Periode</label>
            <select
              value={editForm.periodeId}
              onChange={(e) =>
                setEditForm({ ...editForm, periodeId: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {periodeList.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>
        
          <div>
            <label className="text-sm font-medium">Jumlah Sesi</label>
            <input
              type="number"
              value={editForm.jumlahSesiPerMinggu}
              onChange={(e) =>
                setEditForm({ ...editForm, jumlahSesiPerMinggu: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        
          <div>
            <label className="text-sm font-medium">Jenis Ruang</label>
            <select
              value={editForm.preferensiRuangJenis}
              onChange={(e) =>
                setEditForm({ ...editForm, preferensiRuangJenis: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="TEORI">TEORI</option>
              <option value="LAB">LAB</option>
            </select>
          </div>
        
          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              value={editForm.status}
              onChange={(e) =>
                setEditForm({ ...editForm, status: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-100 rounded"
            >
              <option value="DRAF">DRAF</option>
              <option value="SIAP">SIAP</option>
            </select>
          </div>
        </>
        )}

        {/* ======================
            TABEL (BOTH)
        ====================== */}
       {!isEdit && pengajaranList.length > 0 && (
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-50 text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2">Mata Kuliah</th>
                    <th className="px-3 py-2 text-center">Kelas</th>
                    <th className="px-3 py-2 text-center">Jumlah</th>
                    <th className="px-3 py-2 text-center">Jenis</th>
                    <th className="px-3 py-2 text-center">Status</th>

                    {!isEdit && <th className="px-3 py-2 text-center">Aksi</th>}
                  </tr>
                </thead>

                <tbody>
                  {pengajaranList.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t">

                      {/* ================= MATKUL ================= */}
                      <td className="px-2 py-1">
                      <div className="flex items-center justify-between gap-2">
                        
                        {/* Nama matkul */}
                        <div className="font-medium text-gray-800">
                          {row.namaMatkul}
                        </div>

                        {/* tombol tambah kelas */}
                        {!isEdit && (
                          <button
                            type="button"
                            onClick={() => tambahKelas(row)}
                            className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
                          >
                            + Tambah Kelas
                          </button>
                        )}

                      </div>
                    </td>

                      {/* ================= KELAS (GABUNG + HAPUS) ================= */}
                     <td className="px-2 py-1">
                    {(row.kelasGabungan || []).map((k, i) => (
                      <div key={i} className="flex items-center gap-1 mb-1">

                        <select
                          value={k}
                          onChange={(e) => updateKelas(rowIndex, i, e.target.value)}
                          className="border px-2 py-1 text-xs rounded"
                        >
                          <option value="">Pilih kelas</option>

                          {(row.kelasList || []).map((kelas) => (
                            <option key={kelas.id} value={kelas.id}>
                              {formatKelas(kelas, row.periode)}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => hapusKelas(rowIndex, i)}
                          className="text-red-500 text-xs"
                        >
                          <Trash size={12} />
                        </button>

                      </div>
                    ))}

                    {/* GABUNG KELAS */}
                    <button
                    type="button"
                    onClick={() => gabungKelas(rowIndex)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-1 transition"
                  >
                    <Plus size={12} />
                    Gabung Kelas
                  </button>
                  </td>

                      {/* ================= JUMLAH ================= */}
                      <td className="text-center">
                        <input
                          type="number"
                          value={row.jumlahSesiPerMinggu}
                          onChange={(e) =>
                            updateRow(rowIndex, "jumlahSesiPerMinggu", e.target.value)
                          }
                          className="w-14 text-center border rounded"
                        />
                      </td>

                      {/* ================= JENIS ================= */}
                      <td className="text-center">
                        <select
                          value={row.preferensiRuangJenis}
                          onChange={(e) =>
                            updateRow(rowIndex, "preferensiRuangJenis", e.target.value)
                          }
                          className="border px-2 py-1 rounded"
                        >
                          <option value="TEORI">TEORI</option>
                          <option value="LAB">LAB</option>
                        </select>
                      </td>

                      {/* ================= STATUS ================= */}
                      <td className="text-center">
                        <select
                          value={row.status}
                          onChange={(e) =>
                            updateRow(rowIndex, "status", e.target.value)
                          }
                          className="border px-2 py-1 rounded"
                        >
                          <option value="DRAF">DRAF</option>
                          <option value="SIAP">SIAP</option>
                        </select>
                      </td>

                      {/* ================= DELETE ROW ================= */}
                      {!isEdit && (
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setPengajaranList(prev =>
                                prev.filter((_, i) => i !== rowIndex)
                              )
                            }
                            className="text-red-500"
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                      )}

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* BUTTON */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              (!isEdit && pengajaranList.length === 0)
            }
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>

        </form>
        </div>
     </div>
      );
  }

export default PenugasanFormModal;