import React, { useEffect, useState } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, X} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
const TabelPerubahan = () => {

  const navigate = useNavigate();
  const [prodiList, setProdiList] = useState([]);
  const [jadwalList, setJadwalList] = useState([]);
  const [hariList, setHariList] = useState([]);
  const [slotList, setSlotList] = useState([]);

  const [selectedJadwal, setSelectedJadwal] = useState(null);
  const [hariBaru, setHariBaru] = useState("");
  const [slotBaru, setSlotBaru] = useState("");
  const [ruangBaru, setRuangBaru] = useState("");
  const [alasan, setAlasan] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState(null);

  const [selectedProdi, setSelectedProdi] = useState("")
  const [selectedHari, setSelectedHari] = useState("")
  const [search, setSearch] = useState("")

  const [availableData, setAvailableData] = useState([]);
  const [selectedSlotGroup, setSelectedSlotGroup] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const { user } = useAuth();
  const fetchJadwal = async () => {
    if (!activeBatchId) return;
  
    try {
      setLoading(true);
  
      const params = {
        periodeAkademikId: activeBatchId,
        statusBatch: "FINAL",
        page: 1,
        pageSize: 200,
      };
  
     //filter role
      if (user?.peran === "TU_PRODI") {
        params.prodiId = user.prodiId;
      }
  
      if (user?.peran === "TU_FAKULTAS") {
        params.fakultasId = user.fakultasId;
      }
  
      const res = await api.get("/api/view-jadwal/all", { params });
  
      setJadwalList(res.data?.data?.items || []);
      setHasFetched(true);
    } catch (err) {
      console.error("Gagal ambil jadwal", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user?.peran === "TU_PRODI") {
      setSelectedProdi(user.prodiNama);
    }
  }, [user]);
  const fetchFinalBatch = async () => {
    try {
      const res = await api.get("/api/scheduler/batch", {
        params: { status: "FINAL", page: 1, pageSize: 10 }
      });
      const finalBatch = res.data?.data?.items.find(b => b.status === "FINAL");
      if (finalBatch) {
        setActiveBatchId(finalBatch.periodeId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  
  useEffect(() => {
    if (activeBatchId) {
      fetchJadwal();
    }
  }, [activeBatchId]);

  const fetchHari = async () => {
    try {
      const res = await api.get("/api/master-data/hari");
      setHariList(res.data?.data?.data || []);
    } catch (err) {
      console.error("Gagal ambil hari", err);
    }
  };
  const fetchSlot = async () => {
    try {
      const res = await api.get("/api/master-data/slot-waktu");
      setSlotList(res.data?.data?.items || []);
    } catch (err) {
      console.error("Gagal ambil slot", err);
    }
  };
  useEffect(() => {
    fetchFinalBatch();
    fetchProdi();
    fetchHari();
    fetchSlot(); 
  }, []);
  const handleSubmit = async () => {

    // validasi kosong
    if (!selectedJadwal || !hariBaru || !slotBaru || !ruangBaru || !alasan) {
      alert("Lengkapi data dulu");
      return;
    }

    if (alasan.trim().length < 5) {
      alert("Alasan minimal 5 karakter");
      return;
    }
  
    // payload
    const payload = {
      jadwalKuliahId: selectedJadwal.id,
      hariBaruId: hariBaru,
      slotWaktuBaruId: selectedSlotGroup?.slotIds[0],
      ruangBaruId: ruangBaru,
      alasanPengaju: alasan
    };
  
    console.log("=== DATA YANG DIKIRIM ===");
    console.log("PAYLOAD FINAL:", JSON.stringify(payload, null, 2));
    console.log(payload);
  
    try {
      const res = await api.post("/api/pengajuan-perubahan-jadwal", payload);
  
      console.log("=== RESPONSE SUCCESS ===");
      console.log(res.data);
  
      alert("Pengajuan berhasil");
      navigate("/perubahan-jadwal");
    } catch (err) {
      console.log("=== ERROR DETAIL ===");
      console.log("STATUS:", err.response?.status);
      console.log("DATA:", err.response?.data);
      console.log("ERRORS:", err.response?.data?.errors);
  
      if (err.response) {
        console.log("STATUS:", err.response.status);
        console.log("DATA:", err.response.data);
      } else {
        console.log(err);
      }
    }
  };
  const fetchProdi = async () => {
    try {
      const res = await api.get("/api/master-data/prodi")
      setProdiList(res.data?.data?.items || [])
    } catch (err) {
      console.error("Gagal ambil prodi", err)
    }
  }

  const slotFiltered =
  availableData.find(d => d.hariId === hariBaru)?.slots ?? [];
  const selectedSlot = slotFiltered.find(s => s.slotId === slotBaru);
  const ruangTersedia = selectedSlot?.rooms || [];
  
  const filteredJadwal = jadwalList.filter((j) => {

    const matchProdi =
      !selectedProdi ||
      j.prodi?.toLowerCase() === selectedProdi.toLowerCase()
  
      const matchHari =
      !selectedHari ||
      j.hariId === selectedHari;
  
    const matchSearch =
      !search ||
      j.mataKuliah?.toLowerCase().includes(search.toLowerCase()) ||
      j.dosen?.toLowerCase().includes(search.toLowerCase())
  
    return matchProdi && matchHari && matchSearch
  })
  const resetForm = () => {
    setSelectedJadwal(null);
    setHariBaru("");
    setSlotBaru("");
    setRuangBaru("");
    setAlasan("");
  };
  
  const fetchAvailableSlots = async (slotWaktuId) => {
    try {
      const res = await api.get("/api/view-jadwal/available-slots", {
        params: {
          periodeAkademikId: activeBatchId,
          slotWaktuId
        }
      });
  
      setAvailableData(res.data?.data?.availableByDay || []);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    if (hariBaru && selectedJadwal?.slotWaktuId) {
      fetchAvailableSlots(selectedJadwal.slotWaktuId);
    }
  }, [hariBaru]);

  const toRomawi = (num) => {
    if (!num || num <= 0) return "";
    const map = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
    return map[num] || num;
  };

  const formatKelas = (jadwal) => {
    const romawi = toRomawi(jadwal.semester);
    if (!romawi) return jadwal.kelas;
    const kelasList = jadwal.kelas.split(",").map(k => k.trim());
    return kelasList
      .map(k => {
        if (k.toLowerCase() === "karyawan") {
          return `${romawi}_KARYAWAN`; 
          // atau `${romawi}_KRY`
        }
        return `${romawi}_REG_${k}`;
      })
      .join(", ");
  };
  const handlePilihJadwal = (jadwal) => {
    setSelectedJadwal(jadwal);
    fetchAvailableSlots(jadwal.slotWaktuId);
  };
  const groupedByHariFiltered = filteredJadwal.reduce((acc, item) => {
    const hari = item.hari || "Tanpa Hari"
    if (!acc[hari]) acc[hari] = []
    acc[hari].push(item)
    return acc  
  }, {})
  const formatJam = (jam) => {
    if (!jam) return "-";
  
    if (jam.includes("T")) {
      return new Date(jam).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      });
    }
  
    return jam.replace(".", ":");
  };
  const sks = selectedJadwal?.sks || 1;
  const generateSlotRange = () => {
    if (!slotList.length) return [];
  
    const sortedSlot = [...slotList].sort((a, b) => {
      const jamA = new Date(`1970-01-01T${a.jamMulai.replace(".", ":")}:00`);
      const jamB = new Date(`1970-01-01T${b.jamMulai.replace(".", ":")}:00`);
      return jamA - jamB;
    });
  
    const result = [];
  
    for (let i = 0; i <= sortedSlot.length - sks; i++) {
      const group = sortedSlot.slice(i, i + sks);
  
      result.push({
        startId: group[0].id,
        slotIds: group.map(s => s.id), // 🔥 INI PENTING
        label: `${formatJam(group[0].jamMulai)} - ${formatJam(group[group.length - 1].jamSelesai)}`
      });
    }
  
    return result;
  };
 
  const getRoomsForSelectedGroup = () => {
    if (!selectedSlotGroup || !availableData.length) return [];
  
    const hariData = availableData.find(d => d.hariId === hariBaru);
    if (!hariData) return [];
  
    const selectedSlots = hariData.slots.filter(slot =>
      selectedSlotGroup.slotIds.includes(slot.slotId)
    );
  
    if (selectedSlots.length === 0) return [];
  
    let commonRooms = selectedSlots[0].rooms;
  
    for (let i = 1; i < selectedSlots.length; i++) {
      commonRooms = commonRooms.filter(room =>
        selectedSlots[i].rooms.some(r => r.id === room.id)
      );
    }
  
    return commonRooms;
  };
  const ruangFinal = getRoomsForSelectedGroup();
  return (
    <MainLayout>

      <div className="bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold mb-2">
          Ajukan Perubahan Jadwal
        </h1>
        <p className="text-gray-600 text-sm mb-4">
        Tabel berikut menampilkan daftar jadwal perkuliahan yang dapat diajukan untuk perubahan jadwal.
        </p>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-end gap-4">
        <div className="flex flex-col lg:flex-row gap-3">

            {/* FILTER PRODI */}
            <select
            value={selectedProdi}
            onChange={(e) => setSelectedProdi(e.target.value)}
            className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
          >
            <option value="">Semua Prodi</option>

            {prodiList.map((prodi) => (
             <option key={prodi.id} value={prodi.nama}>
             {prodi.nama}
           </option>
            ))}
            </select>

            {/* FILTER HARI */}
            <select
            value={selectedHari}
            onChange={(e) => setSelectedHari(e.target.value)}
            className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
          >
            <option value="">Semua Hari</option>

            {hariList.map((hari) => (
                <option key={hari.id} value={hari.nama}>
                {hari.nama}
                </option>
            ))}
            </select>
            {/* SEARCH */}
            <div className="relative w-full sm:max-w-sm">
            <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          
            <input
            type="text"
            placeholder="Cari mata kuliah/Dosen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
            />
            </div>

        </div>
        </div>
        {/* TABEL JADWAL */}
        <div className="bg-white shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left border border-gray-300 bg-white">
        <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
            <tr>
            <th className="px-3 py-2 border">Hari</th>
            <th className="px-3 py-2 border text-center">Jam</th>
            <th className="px-3 py-2 border">Mata Kuliah</th>
            <th className="px-3 py-2 border">SKS</th>
            <th className="px-3 py-2 border text-center">Kelas</th>
            <th className="px-3 py-2 border">Program Studi</th>
            <th className="px-3 py-2 border">Dosen</th>
            <th className="px-3 py-2 border">Ruangan</th>
            <th className="px-3 py-2 border text-center">Aksi</th>
            </tr>
        </thead>

        <tbody>
            {loading ? (
            <tr>
                <td colSpan="9" className="p-8">
                <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="animate-spin" size={24} />
                    <span className="text-sm">Memuat data jadwal...</span>
                </div>
                </td>
            </tr>
            ) : hasFetched && filteredJadwal.length === 0 ? (
            <tr>
                <td colSpan="9" className="text-center py-4">
                Tidak ada data
                </td>
            </tr>
            ) : (
                Object.entries(groupedByHariFiltered).map(([hari, items]) =>
                items.map((jadwal, index) => (
                    <tr key={`${jadwal.id}-${index}`} className="hover:bg-gray-50">
                    {index === 0 && (
                    <td
                        rowSpan={items.length}
                        className="px-3 py-2 border font-medium"
                    >
                        {hari}
                    </td>
                    )}
                    <td className="px-1 py-2 border whitespace-nowrap">
                    {jadwal.jamMulai} - {jadwal.jamSelesai}
                    </td>

                    <td className="px-3 py-2 border">
                    {jadwal.mataKuliah}
                    </td>

                    <td className="px-3 py-2 border text-center">
                    {jadwal.sks}
                    </td>

                    <td className="px-3 py-2 border text-center">
                    {formatKelas(jadwal)}
                    </td>

                    <td className="px-3 py-2 border">
                    {jadwal.prodi}
                    </td>

                    <td className="px-3 py-2 border">
                    {jadwal.dosen}
                    </td>

                    <td className="px-3 py-2 border">
                    {jadwal.ruangan}
                    </td>

                    <td className="px-3 py-2 border text-center">
                    <button
                        onClick={() => handlePilihJadwal(jadwal)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                    >
                        Ajukan Perubahan
                    </button>
                    </td>

                </tr>
                ))
            )
            )}
        </tbody>
        </table>
        </div>
        </div>

        {/* FORM PERUBAHAN */}

        {selectedJadwal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg">
            {/* HEADER */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                Pengajuan Perubahan Jadwal
                </h3>
                <button
                onClick={() => setSelectedJadwal(null)}
                className="text-gray-500"
                >
                <X />
                </button>
            </div>
            {/* CONTENT */}
            <div className="px-6 py-4 space-y-4">
                {/* Jadwal Lama */}
                <div className="bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium text-gray-700 mb-1">
                    Jadwal Saat Ini
                </p>
                <p>
                    {selectedJadwal.hari} | {selectedJadwal.jamMulai} - {selectedJadwal.jamSelesai}
                </p>
                <p>
                    {selectedJadwal.mataKuliah} - {selectedJadwal.ruangan}
                </p>
                </div>
                {/* Hari */}
                <div>
                <label className="block text-sm font-medium text-gray-700">
                    Hari Baru
                </label>
                <select
                    value={hariBaru}
                    onChange={(e) => {
                      setHariBaru(e.target.value);
                      setSlotBaru("");
                      setRuangBaru("");
                    }}
                    className="w-full px-3 py-2 bg-gray-100 rounded
                            focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    <option value="">Pilih Hari</option>
                    {hariList.map(hari => (
                    <option key={hari.id} value={hari.id}>
                        {hari.nama}
                    </option>
                    ))}
                </select>
                </div>
                {/* Jam */}
                {hariBaru && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                    Jam Kuliah
                    </label>
                    <select
                    value={slotBaru}
                    onChange={(e) => {
                      const selected = generateSlotRange().find(s => s.startId === e.target.value);
                  
                      setSlotBaru(e.target.value);
                      setSelectedSlotGroup(selected); // 🔥 INI WAJIB
                      setRuangBaru("");
                    }}
                    className="w-full px-3 py-2 bg-gray-100 rounded
                                focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                    <option value="">Pilih Jam</option>
                    {generateSlotRange().map(slot => (
                    <option key={slot.startId} value={slot.startId}>
                      {slot.label}
                    </option>
                  ))}
                    </select>
                </div>
                )}
                {/* Ruang */}
                {slotBaru && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                    Ruangan
                    </label>
                    <select
                   value={ruangBaru}
                   onChange={(e) => setRuangBaru(e.target.value)}
                 
                    className="w-full px-3 py-2 bg-gray-100 rounded
                                focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                  
                    <option value="">Pilih Ruang</option>
                  {ruangFinal.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.kode} - {r.nama}
                    </option>
                  ))}

                    </select>
                </div>
                )}
                {/* Alasan */}
                <div>
                <label className="block text-sm font-medium text-gray-700">
                    Alasan Perubahan
                </label>
                <textarea
                    value={alasan}
                    onChange={(e) => {
                      const text = e.target.value;
                    
                      setAlasan(
                        text.charAt(0).toUpperCase() + text.slice(1)
                      );
                    }}
                    placeholder="Masukan alasan perubahan jadwal"
                    className="w-full px-3 py-2 bg-gray-100 rounded
                            focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                </div>
            </div>
            {/* FOOTER */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                onClick={() => setSelectedJadwal(null)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
                >
                Batal
                </button>
                <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                Simpan Pengajuan
                </button>
            </div>
            </div>
        </div>
        )}
        </div>
    </MainLayout>
  );
};

export default TabelPerubahan;