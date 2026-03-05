import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { ArrowLeft,Eye,CheckCircle,Loader2 } from "lucide-react";



const BatchJadwalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [batch, setBatch] = useState(null);
  const [jadwalList, setJadwalList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [prodiId, setProdiId] = useState("");
  const [hariId, setHariId] = useState("");
  const [dosenId, setDosenId] = useState("");

  const [prodiList, setProdiList] = useState([]);
  const [hariList, setHariList] = useState([]);
  const [dosenList, setDosenList] = useState([]);
  const [conflictData, setConflictData] = useState(null);
  const fetchMaster = async () => {
    try {
      const [prodiRes, hariRes, dosenRes] = await Promise.all([
        api.get("/api/master-data/prodi"),
        api.get("/api/master-data/hari"),
        api.get("/api/master-data/dosen"),
      ]);

      setProdiList(prodiRes.data?.data?.items || []);
      setHariList(hariRes.data?.data?.items || []);
      setDosenList(dosenRes.data?.data?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  // fetch data
  const fetchAllJadwal = async () => {
    let page = 1;
    let allItems = [];
    let hasMore = true;

    while (hasMore) {
      const res = await api.get(`/api/scheduler/jadwal`, {
        params: {
          batchId: id,
          page,
          pageSize: 200,
          prodiId: prodiId || undefined,
          hariId: hariId || undefined,
          dosenId: dosenId || undefined,
        },
      });

      const items = res.data?.data?.items || [];
      allItems = [...allItems, ...items];

      if (items.length < 200) {
        hasMore = false;
      } else {
        page++;
      }
    }

    setJadwalList(allItems);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
  
      const batchRes = await api.get(`/api/scheduler/batch/${id}`);
      setBatch(batchRes.data?.data);
  
      const conflictRes = await api.get(
        `/api/scheduler/batch/${id}/conflicts`
      );
  
      setConflictData(conflictRes.data?.data);
  
      await fetchAllJadwal();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaster();
  }, []);

  useEffect(() => {
    fetchData();
  }, [id, prodiId, hariId, dosenId]);
  
  const handleSetAktif = async () => {
    try {
      await api.patch(`/api/scheduler/batch/${batch.id}/set-final`);
      alert("Batch berhasil dijadikan jadwal aktif");
  
      // langsung kembali ke halaman batch jadwal
      navigate("/scheduler/batch"); 
    } catch (err) {
      console.error(err);
      alert("Gagal mengaktifkan batch");
    }
  };

  const filteredJadwal = jadwalList.filter((item) => {
    const matkul =
      item.penugasanMengajar?.programMatkul?.mataKuliah?.nama?.toLowerCase() ||
      "";
    const dosen =
      item.penugasanMengajar?.dosen?.nama?.toLowerCase() || "";

    return (
      matkul.includes(search.toLowerCase()) ||
      dosen.includes(search.toLowerCase())
    );
  });

  const formatNamaBatch = (nama) => {
    if (!nama) return "-";
    const match = nama.match(/Batch (.+)/);
    if (!match) return nama;

    const date = new Date(match[1]);
    if (isNaN(date)) return nama;

    return `Batch ${date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })} - ${date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };
      //hitung konflik dari id batch 
      const totalKonflik =
      (conflictData?.conflicts?.dosen?.count || 0) +
      (conflictData?.conflicts?.kelas?.count || 0) +
      (conflictData?.conflicts?.ruang?.count || 0);

  const hariUrut = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  const jadwalGroupedByHari = filteredJadwal.reduce((acc, item) => {
    const hari = item.hari?.nama || "Tanpa Hari";
    if (!acc[hari]) acc[hari] = [];
    acc[hari].push(item);
    return acc;
  }, {});

  const formatJam = (time) => {
    if (!time) return "-";
  
    // kalau format ISO
    if (time.includes("T")) {
      return time.slice(11, 16);
    }
  
    // kalau format "07:00:00"
    if (time.length >= 5) {
      return time.slice(0, 5);
    }
  
    return time;
  };
    //ubah ke romawi
    const toRomawi = (num) => {
      const map = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
      return map[num] || num;
    };
    
    const hitungSemester = (angkatan, tahunMulai, paruh) => {
      return (tahunMulai - angkatan) * 2 + (paruh === "GENAP" ? 2 : 1);
    };
    //buat warna prdi

    const warnaProdi = {
      "teknik mesin": "bg-yellow-300 text-black",
      "rekayasa pertanian dan biosistem": "bg-yellow-500 text-white",
      "ilmu lingkungan": "bg-lime-600 text-white",
      "teknik sipil": "bg-green-400 text-black",
      "sistem informasi": "bg-blue-400 text-white",
      "teknik informatika": "bg-purple-500 text-white",
      "teknik elektro": "bg-red-500 text-white",
    };
    const getWarnaProdi = (namaProdi) => {
      if (!namaProdi) return "bg-gray-200 text-gray-700";
      const key = namaProdi.toLowerCase().trim();
      return warnaProdi[key] || "bg-gray-200 text-gray-700";
    };
      return (
        <MainLayout>
          <div className="bg-gray-50 min-h-screen">
            <div className="mb-4">
              <h1 className="text-2xl font-bold">Detail Batch Jadwal</h1>
              <p className="text-sm text-gray-600">
                {formatNamaBatch(batch?.nama)} | Periode {batch?.periode?.nama}
              </p>
            </div>
             {/* CARD STATISTIK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

            {/* Status */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <p className="text-lg font-semibold text-gray-800">
                {batch?.status}
              </p>
            </div>

            {/* Success Rate */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">
                Tingkat Kualitas Jadwal
              </p>
              <p className="text-lg font-semibold text-green-600">
                {batch?.successRate}
              </p>
            </div>

         {/* Jumlah Pelanggaran */}
       {/* Jumlah Pelanggaran / Status Konflik */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">
            Status Konflik Jadwal
          </p>

            <div className="flex items-center justify-between mt-1">
              {totalKonflik > 0 ? (
                <>
                  <p className="text-lg font-semibold text-red-600">
                    {totalKonflik}
                  </p>

                  <button
                    onClick={() =>
                      navigate(`/scheduler/batch/${batch.id}/conflicts`)
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 
                              bg-red-600 text-white text-xs font-medium 
                              rounded-lg hover:bg-red-700 transition"
                  >
                    <Eye size={16} />
                    Detail Konflik
                  </button>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-green-600">
                    100%
                  </p>

                  <span className="inline-flex items-center gap-1 px-3 py-1.5 
                                  bg-green-100 text-green-700 text-xs font-medium 
                                  rounded-lg">
                    <CheckCircle size={14} />
                    Jadwal Optimal
                  </span>
                </>
              )}
            </div>
          </div>
            {/* Tanggal */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">
                Tanggal Generate
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {new Date(batch?.tanggalGenerate)
                  .toLocaleDateString("id-ID")}
              </p>
            </div>
            </div>
            {/* CARD KETERANGAN WARNA PRODI */}
            <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold mb-3 text-gray-800">
              Keterangan Warna Program Studi
            </h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {Object.entries(warnaProdi).map(([nama, warna]) => (
                <div key={nama} className="flex items-center gap-2">
                  <span
                    className={`w-4 h-4 rounded border ${warna.split(" ")[0]}`}
                  ></span>
                  <span className="text-sm text-gray-700">
                    {nama}
                  </span>
                </div>
              ))}
        </div>
      </div>

      {loading && (
          <div className="flex flex-col justify-center items-center gap-2">
              <Loader2 className="animate-spin text-gray-500" size={24} />
              <p className="text-gray-500">Memuat data Jadwal..</p>
            </div>
      )}
          {!loading &&
            hariUrut.map((hari) => {
              const jadwalHari = jadwalGroupedByHari[hari] || [];
              if (jadwalHari.length === 0) return null;
                  // Ambil ruang dan slot untuk hari ini
                  const ruangListHari = Array.from(
                    new Map(jadwalHari.map(j => [j.ruang?.id, j.ruang])).values()
                  );
                  const slotListHari = Array.from(
                    new Map(jadwalHari.map(j => [j.slotWaktu?.id, j.slotWaktu])).values()
                  ).sort((a, b) => new Date(a.jamMulai) - new Date(b.jamMulai));
              
                // Matrix hari
              const matrixHari = {};
              jadwalHari.forEach(j => {
                if (!j.slotWaktu?.id || !j.ruang?.id) return;
                if (!matrixHari[j.slotWaktu.id])
                  matrixHari[j.slotWaktu.id] = {};
                // hitung semester dulu
                const angkatan =
                j.penugasanMengajar?.kelasList?.[0]?.kelompokKelas?.angkatan;
                const tahunMulai = batch?.periode?.tahunMulai;
                const paruh = batch?.periode?.paruh;
                let semesterRomawi = "-";
                if (angkatan && tahunMulai && paruh) {
                  const semester = hitungSemester(angkatan, tahunMulai, paruh);
                  semesterRomawi = toRomawi(semester);
                }
                const prodiNama =
                j.penugasanMengajar?.programMatkul?.prodi?.nama || "";
              const warna = getWarnaProdi(prodiNama);
              matrixHari[j.slotWaktu.id][j.ruang.id] = {
                matkul:
                  j.penugasanMengajar?.programMatkul?.mataKuliah?.nama || "-",
                kelas:
                  j.penugasanMengajar?.kelasList
                    ?.map(k => k.kelompokKelas?.kode)
                    .join(", ") || "-",
                semester: semesterRomawi,
                kode: j.penugasanMengajar?.kode || "-",
                prodi: prodiNama,
                warna: warna,
              };
              });
              return (
                <div key={hari} className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h2 className="text-lg font-semibold mb-2">{hari}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 border w-[140px]">Pukul</th>
                          {ruangListHari.map(r => (
                            <th key={r.id} className="p-2 border text-center">{r.nama}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {slotListHari.map(slot => (
                          <tr key={slot.id} className="hover:bg-gray-50">
                            <td className="p-2 border font-medium whitespace-nowrap">
                              {formatJam(slot.jamMulai)} - {formatJam(slot.jamSelesai)}
                            </td>
                            {ruangListHari.map(ruang => {
                              const jadwal = matrixHari[slot.id]?.[ruang.id];
                              return (
                                <td
                                key={ruang.id}
                                className={`p-2 border text-center align-top ${
                                  jadwal ? jadwal.warna : ""
                                }`}
                              >
                                {jadwal ? (
                                  <div className="space-y-1">
                                    <div className="font-medium">{jadwal.matkul}</div>
                                    <div className="text-[11px] opacity-90">
                                      {jadwal.semester}_{jadwal.kelas}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                                  
                                    
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
          
                  {/* Total Data per Hari */}
                  <div className="mt-2 text-sm text-gray-600 border-t border-gray-200 pt-2">
                    Total Jadwal: <span className="font-semibold">{jadwalHari.length}</span>
                  </div>
                </div>
              );
            })}
         
    
             </div>
            {/* kiri */}
            <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-3 py-2 
              rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
            >
              <ArrowLeft size={18} />
              Kembali
            </button>

            {/* kanan */}
            <button
              onClick={handleSetAktif}
              className="inline-flex items-center gap-2 px-4 py-2
              rounded-lg bg-green-600 text-white text-sm font-medium
              hover:bg-green-700 transition"
            >
              <CheckCircle size={18} />
              Jadikan Jadwal Aktif
            </button>
              </div>
         
          
        </MainLayout>
      );
    };
   export default BatchJadwalDetail;