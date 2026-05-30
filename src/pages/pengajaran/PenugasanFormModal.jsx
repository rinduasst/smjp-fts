import { X, Plus, Trash } from "lucide-react";
import api from "../../api/api";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import ConfirmModal from "../../components/ConfirmModal";

function PenugasanFormModal({
  showModal,
  setShowModal,
  handleSubmit,
  isSubmitting,
  isEdit = false,
  selectedItem,
  dataPenugasan
}) {
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
    onConfirm: null,
  });

  const [selectedDosen, setSelectedDosen] = useState(null);
  const [inputDosen, setInputDosen] = useState("");
  const [dosenDropdown, setDosenDropdown] = useState([]);
  const [showDosenDropdown, setShowDosenDropdown] = useState(false);
  const [loadingDosen, setLoadingDosen] = useState(false);
  const [selectedPeriode, setSelectedPeriode] = useState("");

  const [inputMatkul, setInputMatkul] = useState("");
  const [matkulDropdown, setMatkulDropdown] = useState([]);
  const [showMatkulDropdown, setShowMatkulDropdown] = useState(false);

  const [pengajaranList, setPengajaranList] = useState([]);
  const [prodiList, setProdiList] = useState([]);
  const [selectedProdi, setSelectedProdi] = useState(null);

  const timeoutRef = useRef(null);
  const { user, peran } = useAuth();
  const [periodeList, setPeriodeList] = useState([]);

  const [showJadwalModal, setShowJadwalModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [hariList, setHariList] = useState([]);
  const [slotList, setSlotList] = useState([]);
  const [ruangList, setRuangList] = useState([]);
  //  FETCH PRODI + RESET
useEffect(() => {
  if (!showModal) return;

  fetchProdi();
  fetchPeriode();

  if (peran === "TU_PRODI") {
    setSelectedProdi({
      id: user?.prodiId
    });
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
          prodiId: selectedProdi.id,
          periodeId: selectedPeriode
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
          butuhLab: false,
          jumlahSesiPerMinggu: 1,
          preferensiRuangJenis: "TEORI",
          status: "SIAP"
        }
      ];
    });
  };
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [hari, slot, ruang] = await Promise.all([
          api.get("/api/master-data/hari"),
          api.get("/api/master-data/slot-waktu"),
          api.get("/api/master-data/ruang"),
        ]);
  
        setHariList(hari.data?.data?.data || []);
        setSlotList(slot.data?.data?.items || []);
        setRuangList(ruang.data?.data?.items || []);
  
      } catch (err) {
        console.error("MASTER DATA ERROR:", err);
      }
    };
  
    fetchMaster();
  }, []);
  const [jadwalMku, setJadwalMku] = useState({
    hariId: "",
    slotId: "",
    ruangId: "",
  });
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
        butuhLab: row.butuhLab,
        jumlahSesiPerMinggu: row.jumlahSesiPerMinggu,
        preferensiRuangJenis: row.preferensiRuangJenis,
        status: row.status
      }
    ]);
  };
  //  SUBMIT
  const submitForm = (e) => {
    e.preventDefault();
  
    // cek dosen
    if (!selectedDosen) {
      setConfirmModal({
        open: true,
        title: "Peringatan",
        message: "Lengkapi data terlebih dahulu",
        type: "error",
      });
      return;
    }
  
    // cek data tabel
    if (!isEdit) {
      const adaDataKosong = pengajaranList.some((p) =>
        p.kelasGabungan.some((k) => !k) ||
        !p.jumlahSesiPerMinggu ||
        !p.preferensiRuangJenis
      );
  
      if (adaDataKosong) {
        setConfirmModal({
          open: true,
          title: "Peringatan",
          message: "Lengkapi semua data penugasan terlebih dahulu",
          type: "error",
        });
        return;
      }
    }
  
    if (isEdit) {
      const payload = {
        dosenId: selectedDosen.id,
        programMatkulId: selectedItem.programMatkul.id,
      
        kelompokKelasIds:
          selectedItem.kelasList?.map(k => k.kelompokKelas.id) || [],
      
        butuhLab: editForm.butuhLab,
        jumlahSesiPerMinggu: Number(editForm.jumlahSesiPerMinggu),
        preferensiRuangJenis: editForm.preferensiRuangJenis,
        status: editForm.status,
      
        jadwalTetap: {
          hariId: editForm.jadwalMku?.hariId || null,
          slotWaktuId: editForm.jadwalMku?.slotId || null,
          ruangId: editForm.jadwalMku?.ruangId || null,
        }
      };
      
      console.log("PAYLOAD EDIT:", payload);
     handleSubmit(payload);

      resetForm();
      setShowModal(false);
  
      
  
    } else {
      const payload = pengajaranList.map((p) => ({
        dosenId: selectedDosen.id,
        programMatkulId: p.programMatkulId,
      
        kelompokKelasIds: p.kelasGabungan.filter(k => k !== ""),
      
        butuhLab: p.butuhLab,
        jumlahSesiPerMinggu: p.jumlahSesiPerMinggu,
        preferensiRuangJenis: p.preferensiRuangJenis,
        status: p.status,
        prodiId: selectedProdi?.id,
      
        jadwalTetap: p.jadwalMku
          ? {
              hariId: p.jadwalMku.hariId,
              slotWaktuId: p.jadwalMku.slotId,
              ruangId: p.jadwalMku.ruangId,
            }
          : null,
      }));
       handleSubmit(payload);

      resetForm();
      setShowModal(false);
  
      
    }
  };
  useEffect(() => {
    if (isEdit && selectedItem) {
      console.log("SELECTED ITEM:", selectedItem);
  
      setSelectedDosen(selectedItem.dosen);
  
      // TAMBAH INI
      setSelectedProdi({
        id: selectedItem.prodi?.id
      });
  
      setEditForm({
        kelasGabungan:
          selectedItem.kelasList?.map(k => k.kelompokKelas.id) || [""],
  
        butuhLab: selectedItem.butuhLab ?? false,
        jumlahSesiPerMinggu: selectedItem.jumlahSesiPerMinggu,
        preferensiRuangJenis:
          selectedItem.preferensiRuangJenis || "TEORI",
  
        status: selectedItem.status,
  
        jadwalMku: {
          hariId: selectedItem.jadwalTetap?.hari?.id || "",
          slotId: selectedItem.jadwalTetap?.slotWaktu?.id || "",
          ruangId: selectedItem.jadwalTetap?.ruang?.id || "",
        }
      });
    }
  }, [isEdit, selectedItem]);
  const [editForm, setEditForm] = useState({
    kelasGabungan: [""],
    butuhLab: false,
    jumlahSesiPerMinggu: 1,
    preferensiRuangJenis: "TEORI",
    status: "SIAP",
  
    jadwalMku: {
      hariId: "",
      slotId: "",
      ruangId: "",
    }
  });
  const resetForm = () => {
    setPengajaranList([]);
    setSelectedDosen(null);
    setInputDosen("");
    setInputMatkul("");
    setDosenDropdown([]);
    setMatkulDropdown([]);
    setShowDosenDropdown(false);
    setShowMatkulDropdown(false);
    setSelectedRow(null);
    setSelectedPeriode("");
    setSelectedProdi(null);
    setJadwalMku({
      hariId: "",
      slotId: "",
      ruangId: "",
    });
    setEditForm({
      periodeId: "",
      kurikulumId: "",
      jumlahKelompokKelas: 1,
      kelasGabungan: [""],
      jumlahSesiPerMinggu: 1,
      preferensiRuangJenis: "TEORI",
      status: "SIAP"
    });
  };

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
     <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-400 flex justify-between items-center">
        <h3 className="text-lg font-semibold">
        {isEdit ? "Edit Penugasan Mengajar" : "Tambah Penugasan Mengajar"}
      </h3>
      <button
        onClick={() => {
          resetForm();
          setShowModal(false);
        }}
      >
        <X />
      </button>
        </div>
        <form
        onSubmit={submitForm}
        className="p-6 space-y-2 overflow-y-auto"
      >

        {!isEdit ? (
          // ======================
          // TAMBAH
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
            {/* PERIODE */}
            <div>
              <label className="text-sm font-medium">
                Periode Akademik
              </label>

              <select
                value={selectedPeriode}
                onChange={(e) => {
                  setSelectedPeriode(e.target.value);

                  // reset matkul saat periode berubah
                  setPengajaranList([]);
                  setInputMatkul("");
                }}
                className="w-full px-3 py-2 bg-gray-100 rounded
                focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Pilih Periode</option>

                {periodeList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
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
          <div className="space-y-2">

            {/* DOSEN */}
            <div>
              <label className="block text-sm font-medium mb-1">Dosen</label>
              <input
                value={selectedDosen?.nama || ""}
                disabled
                className="w-full px-3 py-2 bg-gray-100  rounded text-sm"
              />
            </div>

            {/* MATKUL */}
            <div>
              <label className="block text-sm font-medium mb-1">Mata Kuliah</label>
              <input
                value={selectedItem?.programMatkul?.mataKuliah?.nama || ""}
                disabled
                className="w-full px-3 py-2 bg-gray-100  rounded text-sm"
              />
            </div>

            {/* PERIODE */}
            <div>
              <label className="block text-sm font-medium mb-1">Periode</label>
              <input
              disabled
              value={selectedItem?.programMatkul?.periode?.nama || ""}
              className="w-full px-3 py-2 bg-gray-100  rounded text-sm"
            />
             
            </div>

            {/* JUMLAH SESI */}
            <div>
              <label className="block text-sm font-medium mb-1">Jumlah Sesi</label>
              <input
                type="number"
                min={1}
                value={editForm.jumlahSesiPerMinggu}
                onChange={(e) =>
                  setEditForm({ ...editForm, jumlahSesiPerMinggu: e.target.value })
                }
                className="w-full px-3 py-2 border  border-gray-400 rounded text-sm
                focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {/* JENIS RUANG */}
            <div>
              <label className="block text-sm font-medium mb-1">Jenis Ruang</label>
              <select
                value={editForm.preferensiRuangJenis}
                onChange={(e) =>
                  setEditForm({ ...editForm, preferensiRuangJenis: e.target.value })
                }
                className="w-full px-3 py-2 border  border-gray-400 rounded text-sm
                focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="TEORI">TEORI</option>
                <option value="LAB">LAB</option>
              </select>
            </div>

           

            {/* STATUS */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({ ...editForm, status: e.target.value })
                }
                className="w-full px-3 py-2 border  border-gray-400 rounded text-sm
                focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="DRAF">DRAF</option>
                <option value="SIAP">SIAP</option>
              </select>
            </div>
              {/* PRAKTIKUM */}
              <div>
          <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-4 py-3">
            
            <div>
              <p className="text-sm font-medium text-gray-800">
                Kelas Praktikum
              </p>
              <p className="text-xs text-gray-500">
                Aktifkan jika mata kuliah membutuhkan praktikum
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setEditForm({
                  ...editForm,
                  butuhLab: !editForm.butuhLab
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition
                ${editForm.butuhLab ? "bg-green-600" : "bg-gray-300"}
              `}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition
                  ${editForm.butuhLab ? "translate-x-6" : "translate-x-1"}
                `}
              />
            </button>

          </div>
        </div>
          {/* JADWAL MKU */}
          {selectedItem?.jadwalTetap && (
            <div className="mt-3 p-3 rounded-lg border border-gray-400 bg-gray-50 space-y-2">

              <p className="text-xs font-semibold text-gray-700">
                Jadwal MKU
              </p>

              {/* HARI */}
              <label className="block text-sm font-medium mb-1">Hari</label>
              <select
                value={editForm.jadwalMku?.hariId || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    jadwalMku: {
                      ...editForm.jadwalMku,
                      hariId: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border  border-gray-400 rounded text-sm
                focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Pilih Hari</option>

                {hariList.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nama}
                  </option>
                ))}
              </select>

              <label className="block text-sm font-medium mb-1">Sesi Waktu</label>
              <select
                value={editForm.jadwalMku?.slotId || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    jadwalMku: {
                      ...editForm.jadwalMku,
                      slotId: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border  border-gray-400 rounded text-sm
                focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Pilih Slot</option>

                {slotList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.jamMulai})
                  </option>
                ))}
              </select>

              <label className="block text-sm font-medium mb-1">Ruangan</label>
              <select
                value={editForm.jadwalMku?.ruangId || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    jadwalMku: {
                      ...editForm.jadwalMku,
                      ruangId: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border  border-gray-400 rounded text-sm
                focus:outline-none focus:ring-1 focus:ring-green-500">
                <option value="">Pilih Ruangan</option>

                {ruangList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nama}
                  </option>
                ))}
              </select>
            </div>
          )}
          </div>
        </>
        )}

        {/* ======================
            TABEL (BOTH)
        ====================== */}
     {!isEdit && pengajaranList.length > 0 && (
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">

            {/* ===== HEADER ===== */}
            <thead className="bg-gray-100 text-xs uppercase text-gray-600 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left">Mata Kuliah</th>
                <th className="px-4 py-3 text-center">Kelas</th>
                <th className="px-4 py-3 text-center">Pertemuan</th>
                <th className="px-4 py-3 text-center">Ruangan</th>
                <th className="px-4 py-3 text-center">Praktikum</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>

            {/* ===== BODY ===== */}
            <tbody className="divide-y">
              {pengajaranList.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <tr className="hover:bg-gray-50 align-top">
                  {/* ===== MATKUL ===== */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <span className="font-semibold text-gray-800 leading-tight">
                        {row.namaMatkul}
                      </span>

                      {!isEdit && (
                        <button
                          type="button"
                          onClick={() => tambahKelas(row)}
                          className="w-fit text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-200"
                        >
                          + Tambah Kelas
                        </button>
                      )}
                    </div>
                  </td>

                  {/* ===== KELAS ===== */}
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      {(row.kelasGabungan || []).map((k, i) => (
                        <div key={i} className="flex items-center gap-2">

                          <select
                            value={k}
                            onChange={(e) =>
                              updateKelas(rowIndex, i, e.target.value)
                            }
                            className=" px-2 py-1 text-xs rounded border border-gray-500 transition bg-gray-100  focus:outline-none focus:border-green-400"
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
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash size={14} />
                          </button>

                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => gabungKelas(rowIndex)}
                        className="text-xs px-2 py-1 border rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        + Gabung Kelas
                      </button>
                    </div>
                  </td>

                  {/* ===== PERTEMUAN ===== */}
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min={1}
                      value={row.jumlahSesiPerMinggu}
                      onChange={(e) =>
                        updateRow(rowIndex, "jumlahSesiPerMinggu", e.target.value)
                      }
                      className=" px-2 py-1 text-xs rounded border border-gray-500 transition bg-gray-100  w-16 focus:outline-none focus:border-green-400"
                    />
                  </td>

                  {/* ===== RUANG ===== */}
                  <td className="px-4 py-3 text-center">
                    <select
                      value={row.preferensiRuangJenis}
                      onChange={(e) =>
                        updateRow(rowIndex, "preferensiRuangJenis", e.target.value)
                      }
                      className=" px-2 py-1 text-xs rounded border border-gray-500 transition bg-gray-100  focus:outline-none focus:border-green-400"
                    >
                      <option value="TEORI">TEORI</option>
                      <option value="LAB">LAB</option>
                    </select>
                  </td>

                  {/* ===== PRAKTIKUM ===== */}
                  <td className="px-4 py-3 text-center">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={row.butuhLab}
                  onChange={() =>
                    updateRow(rowIndex, "butuhLab", !row.butuhLab)
                  }
                  className="w-4 h-4 accent-green-600 cursor-pointer"
                />
                
                <span className="text-xs text-gray-700">
                  {row.butuhLab ? "Ya" : "Tidak"}
                </span>
              </label>
            </td>

                  {/* ===== STATUS ===== */}
                  <td className="px-4 py-3 text-center">
                  <select
                    value={row.status}
                    onChange={(e) =>
                      updateRow(rowIndex, "status", e.target.value)
                    }
                    className=" px-2 py-1 text-xs rounded border border-gray-500 transition bg-gray-100  focus:outline-none focus:border-green-400"
                    >
                    <option value="DRAF">DRAFT</option>
                    <option value="SIAP">SIAP</option>
                  </select>
                </td>

              {/* ===== AKSI ===== */}
            <td className="px-4 py-3 text-center">
              <div className="flex justify-center items-center gap-2">

                <button
                  type="button"
                  onClick={() => {
                    const belumPilihKelas = row.kelasGabungan.some(k => !k);
                    const belumIsiSesi = !row.jumlahSesiPerMinggu;
                    const belumPilihRuang = !row.preferensiRuangJenis;

                    if (belumPilihKelas || belumIsiSesi || belumPilihRuang) {
                      setConfirmModal({
                        open: true,
                        title: "Peringatan",
                        message: "Isi dulu data kelas, jumlah pertemuan, dan jenis ruang.",
                        type: "error",
                      });
                      return;
                    }

                    setSelectedRow(row);

                    setJadwalMku({
                      hariId: row.jadwalMku?.hariId || "",
                      slotId: row.jadwalMku?.slotId || "",
                      ruangId: row.jadwalMku?.ruangId || "",
                    });

                    setShowJadwalModal(true);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-md border transition
                    ${
                      row.jadwalMku
                        ? "border-green-300 bg-green-500 text-white"
                        : "border-blue-300 bg-blue-500 text-white hover:bg-blue-300"
                    }
                  `}
                >
                  {row.jadwalMku ? "Lihat Jadwal MKU" : "Atur Jadwal MKU"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPengajaranList((prev) =>
                      prev.filter((_, i) => i !== rowIndex)
                    )
                  }
                  className="p-1.5 text-red-500 "
                >
                  <Trash size={15} />
                </button>

              </div>
            </td>
            </tr>
            </React.Fragment>
              ))}
            {showJadwalModal && selectedRow && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                <div className="bg-white w-[420px] rounded-xl shadow-lg overflow-hidden">

                  {/* HEADER */}
                  <div className="px-6 py-4 border-b border-gray-400">
                    <h2 className="font-semibold text-lg text-gray-800">
                      Jadwal MKU
                    </h2>
                    <p className="text-xs text-gray-500">
                      {selectedRow.namaMatkul}
                    </p>
                  </div>

                  {/* BODY */}
                  <div className="p-6 space-y-4">

                    {/* HARI */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Hari
                      </label>
                      <select  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={jadwalMku.hariId}
                      onChange={(e) =>
                        setJadwalMku({
                          ...jadwalMku,
                          hariId: e.target.value,
                        })
                      }>
                        <option value="">Pilih Hari</option>
                        {hariList.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.nama}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* SLOT */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Slot Waktu
                      </label>
                      <select  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={jadwalMku.slotId}
                      onChange={(e) =>
                        setJadwalMku({
                          ...jadwalMku,
                          slotId: e.target.value,
                        })
                      }
                    >
                        <option value="">Pilih Slot</option>
                        {slotList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nama} ({s.jamMulai})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* RUANG */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Ruangan
                      </label>
                      <select  className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={jadwalMku.ruangId}
                      onChange={(e) =>
                        setJadwalMku({
                          ...jadwalMku,
                          ruangId: e.target.value,
                        })
                      }
                    >
                        <option value="">Pilih Ruangan</option>
                        {ruangList
                      .filter((r) => {
                        const isGabungan = selectedRow?.kelasGabungan?.length > 1;

                        return isGabungan
                          ? r.khususKelasGabungan === true
                          : r.khususKelasGabungan === false;
                      })
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nama}
                        </option>
                    ))}
                      </select>
                    </div>
                
                  </div>

                  {/* FOOTER */}
                  <div className="px-6 py-4 border-t border-gray-400 flex justify-end gap-2 bg-gray-50">

                  <button
                  type="button"
                  onClick={() => {
                    setShowJadwalModal(false);
                  }}
                  className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Batal
                </button>
                    <button
              type="button"
              onClick={() => {
                if (
                  !jadwalMku.hariId ||
                  !jadwalMku.slotId ||
                  !jadwalMku.ruangId
                ) {
                  setConfirmModal({
                    open: true,
                    title: "Peringatan",
                    message: "Lengkapi Jadwal MKU dulu",
                    type: "error",
                  });
                  return;
                }
                setPengajaranList((prev) =>
                  prev.map((item) =>
                    item === selectedRow
                      ? {
                          ...item,
                          jadwalMku: jadwalMku,
                        }
                      : item
                  )
                );

                setShowJadwalModal(false);
              }}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Simpan
            </button>

                  </div>

                </div>

              </div>
            )}
            </tbody>

          </table>
        </div>
      </div>
    )}

        {/* BUTTON */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowModal(false);
            }}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Batal
          </button>

          <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </button>
        </div>

        </form>
        </div>
        <ConfirmModal
  open={confirmModal.open}
  title={confirmModal.title}
  message={confirmModal.message}
  type={confirmModal.type}
  onClose={() =>
    setConfirmModal((prev) => ({
      ...prev,
      open: false,
    }))
  }
  onConfirm={() => {
    if (confirmModal.onConfirm) {
      confirmModal.onConfirm();
    }

    setConfirmModal((prev) => ({
      ...prev,
      open: false,
    }));
  }}
/>
     </div>
     
      );
  }

export default PenugasanFormModal;