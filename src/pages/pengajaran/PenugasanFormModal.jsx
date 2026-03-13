import { X, Plus, Trash } from "lucide-react";
import api from "../../api/api";
import { useState, useEffect } from "react";
function PenugasanFormModal({
  showModal,
  setShowModal,
  handleSubmit,
  isSubmitting,
  dataPenugasan
}) {

  const [selectedDosen, setSelectedDosen] = useState(null);
  const [inputDosen, setInputDosen] = useState("");
  const [dosenDropdown, setDosenDropdown] = useState([]);
  const [showDosenDropdown, setShowDosenDropdown] = useState(false);

  const [inputMatkul, setInputMatkul] = useState("");
  const [matkulDropdown, setMatkulDropdown] = useState([]);
  const [showMatkulDropdown, setShowMatkulDropdown] = useState(false);

  const [pengajaranList, setPengajaranList] = useState([]);

  useEffect(() => {
    if (showModal) {
      setPengajaranList([]);
      setSelectedDosen(null);
    }
  }, [showModal]);
  if (!showModal) {
    return null;
  }
  const searchDosen = async (keyword) => {
    const res = await api.get("/api/master-data/dosen", {
      params: { q: keyword, page: 1, pageSize: 10 }
    });
    setDosenDropdown(res.data?.data?.items || []);
  };
  const searchMatkul = async (keyword) => {
    const res = await api.get("/api/kurikulum/program-matkul", {
      params: { q: keyword, page: 1, pageSize: 10 }
    });
    setMatkulDropdown(res.data?.data?.items || []);
  };

  const fetchKelas = async (programMatkulId) => {
    const res = await api.get("/api/master-data/kelompok-kelas", {
      params: { programMatkulId, page: 1, pageSize: 100 }
    });
    return res.data?.data?.items || [];
  };

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
          jumlahSesiPerMinggu: 1,
          preferensiRuangJenis: "TEORI",
          status: "SIAP"
        }
      ];
    });
  };


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

  const tambahKelas = (rowIndex) => {
    const row = pengajaranList[rowIndex];
    setPengajaranList((prev) => [
      ...prev,
      {
        ...row,
        kelasGabungan: [""]
      }
    ]);
  };
  // GABUNG KELAS = SELECT SAMPING
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
  
  const submitForm = (e) => {
    e.preventDefault();
    if (!selectedDosen) {
      alert("Pilih dosen terlebih dahulu");
      return;
    }
    const payload = pengajaranList.map((p) => ({
      dosenId: selectedDosen.id,
      programMatkulId: p.programMatkulId,
      namaMatkul: p.namaMatkul, 
      kelompokKelasIds: p.kelasGabungan.filter(k => k !== ""),
      jumlahSesiPerMinggu: p.jumlahSesiPerMinggu,
      preferensiRuangJenis: p.preferensiRuangJenis,
      status: p.status
    }));
    for (const item of payload) {

      if (isDuplicate(item)) {
        alert(
          `Penugasan sudah ada!\n\n` +
          `Dosen: ${selectedDosen.nama}\n` +
          `Mata Kuliah: ${item.namaMatkul}`
        );
        setShowModal(false);
        return;
      }
    
    }
    handleSubmit(payload);

  };
  const isDuplicate = (item) => {
    return dataPenugasan.some((d) => {
  
      const kelasExisting = d.kelasList?.map(k => k.kelompokKelas?.id) || [];
  
      const sameKelas = item.kelompokKelasIds.some(id =>
        kelasExisting.includes(id)
      );
  
      return (
        d.dosen?.id === item.dosenId &&
        d.programMatkul?.id === item.programMatkulId &&
        sameKelas
      );
  
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl">
        <div className="px-6 py-4 border-b border-gray-400 flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Tambah Penugasan Mengajar
          </h3>
          <button onClick={() => setShowModal(false)}>
            <X />
          </button>
        </div>
        <form onSubmit={submitForm} className="p-6 space-y-6">
          {/* DOSEN */}
          <div>
            <label className="text-sm font-medium">Dosen</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari dosen..."
                value={selectedDosen ? selectedDosen.nama : inputDosen}
                onChange={(e) => {
                  setSelectedDosen(null);
                  setInputDosen(e.target.value);
                  setShowDosenDropdown(true);
                  if (e.target.value.trim() !== "") {
                    searchDosen(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {showDosenDropdown && (
                <div className="absolute w-full bg-white shadow max-h-60 overflow-y-auto z-50">
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
          <div>
            <label className="text-sm font-medium">
              Tambah Mata Kuliah
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari mata kuliah..."
                value={inputMatkul}
                onChange={(e) => {
                  setInputMatkul(e.target.value);
                  setShowMatkulDropdown(true);
                  if (e.target.value.trim() !== "") {
                    searchMatkul(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {showMatkulDropdown && (
                <div className="absolute w-full bg-white shadow max-h-60 overflow-y-auto z-50">
                  {matkulDropdown.map((pm) => (
                    <div
                      key={pm.id}
                      onClick={() => {
                        tambahPengajaran(pm);
                        setInputMatkul("");
                        setShowMatkulDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {pm.mataKuliah.kode} - {pm.mataKuliah.nama}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* TABEL */}
          {pengajaranList.length > 0 && (
            <div className="bg-white rounded-lg shadow border overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr className="text-gray-700 uppercase text-xs tracking-wide">
                      <th className="border-b px-3 py-2">Mata Kuliah</th>
                      <th className="border-b px-3 py-2 text-center">Kelas</th>
                      <th className="border-b px-3 text-center">Jumlah Pertemuan</th>
                      <th className="border-b px-3 py-2 text-center">Jenis</th>
                      <th className="border-b px-3 py-2 text-center">Status</th>
                      <th className="border-b px-3 py-2 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pengajaranList.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-gray-200">
                        <td className="px-2 py-1 align-top font-medium">
                          {row.namaMatkul}
                          <button
                            type="button"
                            onClick={() => tambahKelas(rowIndex)}
                            className="text-xs text-green-600  bg-green-200 px-5 py-1 flex-wrap rounded"
                          >
                           
                           +  Tambah Kelas
                          </button>
                        </td>
                        <td className="px-2 py-1">
                        <div className="flex items-center gap-2">

                          {row.kelasGabungan.map((k, kelasIndex) => (
                            <div key={kelasIndex} className="flex items-center gap-1">

                              <select
                                value={k}
                                onChange={(e) => updateKelas(rowIndex, kelasIndex, e.target.value)}
                                className="border border-gray-300 rounded-md px-2 py-1 text-xs"
                              >
                                <option value="">Pilih kelas</option>

                                {row.kelasList.map((kelas) => (
                                  <option key={kelas.id} value={kelas.id}>
                                    {kelas.kode}
                                  </option>
                                ))}

                              </select>

                              <button
                                type="button"
                                onClick={() => hapusKelas(rowIndex, kelasIndex)}
                                className="text-red-500"
                              >
                                <Trash size={14} />
                              </button>

                              {/* tombol gabung tepat setelah icon hapus */}
                              {kelasIndex === row.kelasGabungan.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => gabungKelas(rowIndex)}
                                  className="text-xs text-blue-600 bg-blue-200 py-2 px-1 rounded ml-1 "
                                >
                                  +Gabung
                                </button>
                              )}

                            </div>
                          ))}

                        </div>
                      </td>
                        <td className="px-2 py-1 text-center">
                          <input
                            type="number"
                            value={row.jumlahSesiPerMinggu}
                            onChange={(e) => updateRow(rowIndex, "jumlahSesiPerMinggu", e.target.value)}
                            className="w-12 text-center border border-gray-300 rounded-md"
                          />
                        </td>
                        <td className="px-2 py-1 text-center">
                          <select
                            value={row.preferensiRuangJenis}
                            onChange={(e) => updateRow(rowIndex, "preferensiRuangJenis", e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1"
                          >
                            <option value="TEORI">TEORI</option>
                            <option value="LAB">LAB</option>
                          </select>
                        </td>
                        <td className="px-2 py-1 text-center">
                          <select
                            value={row.status}
                            onChange={(e) => updateRow(rowIndex, "status", e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1"
                          >
                            <option value="DRAF">DRAF</option>
                            <option value="SIAP">SIAP</option>
                          </select>
                        </td>
                        <td className="px-2 py-1 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = pengajaranList.filter((_, i) => i !== rowIndex);
                              setPengajaranList(updated);
                            }}
                            className="text-red-500"
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
            disabled={isSubmitting || pengajaranList.length === 0}
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