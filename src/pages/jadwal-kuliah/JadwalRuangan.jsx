import React, { useEffect, useState } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { Loader2, ArrowLeft, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const JadwalRuangan = () => {
  const [batch, setBatch] = useState(null);
  const [jadwalList, setJadwalList] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const hariUrut = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

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

  const fetchFinalBatch = async () => {
    try {
      const res = await api.get("/api/scheduler/batch");
      const finalBatch = res.data?.data?.items.find((b) => b.status === "FINAL");
      if (finalBatch) setBatch(finalBatch);
    } catch (err) {
      console.error("Gagal ambil batch", err);
    }
  };

  const fetchAllJadwal = async () => {
    if (!batch) return;
    setLoading(true);
    try {
      let page = 1;
      let allItems = [];
      let hasMore = true;
      while (hasMore) {
        const res = await api.get("/api/scheduler/jadwal", {
          params: { batchId: batch.id, page, pageSize: 200 },
        });
        const items = res.data?.data?.items || [];
        allItems = [...allItems, ...items];
        if (items.length < 200) hasMore = false;
        else page++;
      }
      setJadwalList(allItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinalBatch();
  }, []);

  useEffect(() => {
    if (batch) fetchAllJadwal();
  }, [batch]);

  const formatJam = (time) => {
    if (!time) return "-";
    if (time.includes("T")) return time.slice(11, 16);
    if (time.length >= 5) return time.slice(0, 5);
    return time;
  };

  const toRomawi = (num) => ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][num] || num;
  const hitungSemester = (angkatan, tahunMulai, paruh) => (tahunMulai - angkatan) * 2 + (paruh === "GENAP" ? 2 : 1);

  // Grouping jadwal per hari → matrix
  const jadwalGroupedByHari = {};
  jadwalList.forEach((j) => {
    const hari = j.hari?.nama || "Tanpa Hari";
    if (!jadwalGroupedByHari[hari]) jadwalGroupedByHari[hari] = [];
    jadwalGroupedByHari[hari].push(j);
  });

  // Total konflik dummy, bisa disesuaikan API
  const totalKonflik = jadwalList.filter(j => j.konflik).length;

  if (loading || !batch) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-6">
          <Loader2 className="animate-spin mr-2" /> Memuat data...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Jadwal Ruangan
        </h1>
        <p className="text-sm text-gray-600">
          Daftar jadwal perkuliahan yang telah disusun, diurutkan per ruangan dan slot waktu 
        </p>
      </div>
     

         

        {/* Keterangan Warna Prodi */}
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold mb-3 text-gray-800">Keterangan Warna Program Studi</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {Object.entries(warnaProdi).map(([nama, warna]) => (
              <div key={nama} className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded border ${warna.split(" ")[0]}`}></span>
                <span className="text-sm text-gray-700">{nama}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Matrix Jadwal */}
        {!loading &&
          hariUrut.map((hari) => {
            const jadwalHari = jadwalGroupedByHari[hari] || [];
            if (!jadwalHari.length) return null;

            const ruangListHari = Array.from(
              new Map(jadwalHari.map((j) => [j.ruang?.id, j.ruang])).values()
            );
            const slotListHari = Array.from(
              new Map(jadwalHari.map((j) => [j.slotWaktu?.id, j.slotWaktu])).values()
            ).sort((a, b) => new Date(a.jamMulai) - new Date(b.jamMulai));

            const matrixHari = {};
            jadwalHari.forEach((j) => {
              if (!j.slotWaktu?.id || !j.ruang?.id) return;
              if (!matrixHari[j.slotWaktu.id]) matrixHari[j.slotWaktu.id] = {};
              const angkatan = j.penugasanMengajar?.kelasList?.[0]?.kelompokKelas?.angkatan;
              const tahunMulai = batch?.periode?.tahunMulai;
              const paruh = batch?.periode?.paruh;
              const semesterRomawi = angkatan && tahunMulai && paruh ? toRomawi(hitungSemester(angkatan, tahunMulai, paruh)) : "-";
              const prodiNama = j.penugasanMengajar?.programMatkul?.prodi?.nama || "";
              const warna = getWarnaProdi(prodiNama);
              matrixHari[j.slotWaktu.id][j.ruang.id] = {
                matkul: j.penugasanMengajar?.programMatkul?.mataKuliah?.nama || "-",
                kelas: j.penugasanMengajar?.kelasList?.map(k => k.kelompokKelas?.kode).join(", ") || "-",
                semester: semesterRomawi,
                warna
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
                        {ruangListHari.map((r) => (
                          <th key={r.id} className="p-2 border text-center">{r.nama}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slotListHari.map((slot) => (
                        <tr key={slot.id} className="hover:bg-gray-50">
                          <td className="p-2 border font-medium whitespace-nowrap">
                            {formatJam(slot.jamMulai)} - {formatJam(slot.jamSelesai)}
                          </td>
                          {ruangListHari.map((ruang) => {
                            const jadwal = matrixHari[slot.id]?.[ruang.id];
                            return (
                              <td key={ruang.id} className={`p-2 border text-center align-top ${jadwal ? jadwal.warna : ""}`}>
                                {jadwal ? (
                                  <div className="space-y-1">
                                    <div className="font-medium">{jadwal.matkul}</div>
                                    <div className="text-[11px] opacity-90">{jadwal.semester}_{jadwal.kelas}</div>
                                  </div>
                                ) : <span className="text-gray-300">-</span>}
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

        {/* Tombol Kembali */}
        <div className="flex mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default JadwalRuangan;