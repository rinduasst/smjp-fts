import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { ArrowLeft, CheckCircle, Loader2, Eye } from "lucide-react";

const BatchJadwalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [batch, setBatch] = useState(null);
  const [jadwalList, setJadwalList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [slotList, setSlotList] = useState([]);
  const [conflictCount, setConflictCount] = useState(0);
  const totalKonflik = conflictCount;
  const warnaProdi = {
    "teknik mesin": "bg-yellow-300 text-black",
    "rekayasa pertanian dan biosistem": "bg-yellow-500 text-white",
    "ilmu lingkungan": "bg-lime-600 text-white",
    "teknik sipil": "bg-green-400 text-black",
    "sistem informasi": "bg-blue-400 text-white",
    "teknik informatika": "bg-purple-500 text-white",
    "teknik elektro": "bg-red-500 text-white",
  };

  const getWarnaProdi = (nama) => {
    if (!nama) return "";
    return warnaProdi[nama.toLowerCase()] || "";
  };

  const formatNamaBatch = (nama) => {
    if (!nama) return "-";
    return nama;
  };

  const fetchBatch = async () => {
    try {
      const res = await api.get(`/api/scheduler/batch/${id}`);
      return res.data?.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const batchData = await fetchBatch();
      setBatch(batchData);

      const res = await api.get("/api/view-jadwal/all", {
        params: {
          batchId: id,
          periodeAkademikId: batchData?.periode?.id,
          page: 1,
          pageSize: 500,
          sortBy: "hari",
          sortOrder: "asc",
        },
      });

      setJadwalList(res.data?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  console.log(jadwalList.filter(i => i.hasConflict));
  const fetchSlotWaktu = async () => {
    try {
      const res = await api.get("/api/master-data/slot-waktu");
      const data = res.data?.data?.items || [];
  
      const urutanSesi = {
        PAGI: 1,
        SIANG: 2,
        MALAM: 3,
      };
  
      const sorted = data.sort((a, b) => {
        if (urutanSesi[a.sesi] !== urutanSesi[b.sesi]) {
          return urutanSesi[a.sesi] - urutanSesi[b.sesi];
        }
        return a.urutanDalamSesi - b.urutanDalamSesi;
      });
  
      setSlotList(sorted);
    } catch (err) {
      console.error("ERROR SLOT:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSlotWaktu();
    fetchConflictCount();
  }, [id]);
  const handleSetAktif = async () => {
    try {
      await api.patch(`/api/scheduler/batch/${id}/set-final`);
      alert("Batch diaktifkan");
      navigate("/scheduler/batch");
    } catch (err) {
      console.error(err);
    }
  };

  // const totalKonflik = jadwalList.filter((i) => i.hasConflict).length;
  const fetchConflictCount = async () => {
    try {
      const res = await api.get(`/api/scheduler/batch/${id}/conflicts`);
      const count = res.data?.data?.conflicts?.ruang?.count || 0;
  
      // kalau masih ada konflik, coba cek ulang (delay)
      if (count > 0) {
        setTimeout(fetchConflictCount, 1000); // retry 1 detik
      }
  
      setConflictCount(count);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = jadwalList.filter((i) =>
    i.mataKuliah?.toLowerCase().includes(search.toLowerCase()) ||
    i.dosen?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, item) => {
    const h = item.hari || "Tanpa Hari";
    if (!acc[h]) acc[h] = [];
    acc[h].push(item);
    return acc;
  }, {});

  const hariUrut = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const sesiList = slotList.map((s) => ({
    id: s.id,
    label: `${s.jamMulai}-${s.jamSelesai}`,
    mulai: s.jamMulai,
    selesai: s.jamSelesai,
  }));
  const hitungRowSpan = (mulai, selesai) => {
    const start = sesiList.findIndex((s) => s.mulai === mulai);
    const end = sesiList.findIndex((s) => s.selesai === selesai);
  
    if (start === -1 || end === -1) return 1;
  
    return end - start + 1;
  };
  const toRomawi = (num) =>
  ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][num] || num;

const formatKelas = (jadwal) => {
  if (!jadwal?.kelas) return "-";

  let romawi = "";

  if (jadwal.semester) {
    romawi =
      typeof jadwal.semester === "number"
        ? toRomawi(jadwal.semester)
        : jadwal.semester;
  }

  const kelasList = jadwal.kelas.split(",").map((k) => k.trim());

  return kelasList
    .map((k) => (romawi ? `${romawi}_${k}` : k))
    .join(", ");
};
const ruangListGlobal = React.useMemo(() => {
  return [...new Set(jadwalList.map(i => i.ruangan))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}, [jadwalList]);
const normalize = (val) => val?.toString().trim().toLowerCase();
const matrix = React.useMemo(() => {
  const m = {};

  jadwalList.forEach(j => {
    const slotIndex = sesiList.findIndex(s => s.mulai === j.jamMulai);
    if (slotIndex === -1) return;

    const slot = sesiList[slotIndex];
    const key = `${j.hari}-${slot.label}`;

    if (!m[key]) m[key] = {};

    m[key][j.ruangan] = {
      ...j,
      rowspan: hitungRowSpan(j.jamMulai, j.jamSelesai),
      startIndex: slotIndex
    };
  });

  return m;
}, [jadwalList, sesiList]);

  return (
    <MainLayout>
     <div className="bg-gray-50 min-h-screen">
            <div className="mb-4 ">
              <h1 className="text-2xl font-bold">Detail Batch Jadwal</h1>
              <p className="text-sm text-gray-600 py-2">
          {formatNamaBatch(batch?.nama)} | {batch?.periode?.nama}
        </p>

        {/* CARD STAT */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <p className="text-xs text-gray-500 mb-1">Status</p>
              <p className="text-lg font-semibold text-gray-800">{batch?.status || "-"}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">
                Tingkat Kualitas Jadwal
                </p>
              <p className="text-lg font-semibold text-green-600">{batch?.successRate || "-"}</p>
          </div>

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
            </div>
            <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold mb-3 text-gray-800">
                Keterangan Warna Program Studi
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.entries(warnaProdi).map(([nama, warna]) => (
                  <div key={nama} className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded border ${warna.split(" ")[0]}`}
                    ></span>
                    <span className="text-sm text-gray-700">{nama}</span>
                  </div>
                ))}
            </div>
            
        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col justify-center items-center gap-2">
              <Loader2 className="animate-spin text-gray-500" size={24} />
              <p className="text-gray-500">Memuat data Jadwal..</p>
            </div>
      )}

        {/* TABLE */}
      {/* TABLE */}
{!loading &&
  hariUrut.map((hari) => {
    const list = grouped[hari] || [];
    if (!list.length) return null;
    const skipCell = {};
    

    return (
      <div key={hari} className="bg-white border  border-gray-300 rounded-xl p-4 mb-4">
        <h2 className="font-bold mb-2">{hari}</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            
            {/* HEADER */}
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Jam</th>
                {ruangListGlobal.map((r) => (
                  <th key={r} className="border p-2">{r}</th>
                ))}
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
  {sesiList.map((slot, index) => {
    const slotKey = `${hari}-${slot.label}`;

    return (
      <tr key={slot.id}>
        <td className="p-2 border font-medium whitespace-nowrap">
          {slot.label}
        </td>

        {ruangListGlobal.map((ruang) => {
          const skipKey = `${slot.label}-${ruang}`;
          if (skipCell[skipKey]) return null;

          const jadwal = matrix[slotKey]?.[ruang];

          if (!jadwal) {
            return <td key={ruang} className="p-2 border" />;
          }

          // tandai slot berikutnya biar tidak dirender
          for (let i = 1; i < jadwal.rowspan; i++) {
            const nextSlot = sesiList[jadwal.startIndex + i];
            if (nextSlot) {
              skipCell[`${nextSlot.label}-${ruang}`] = true;
            }
          }

          return (
            <td
              key={ruang}
              rowSpan={jadwal.rowspan}
              className={`p-2 border text-center align-top ${getWarnaProdi(jadwal.prodi)}`}
            >
              <div className="font-medium">{jadwal.mataKuliah}</div>
              <div className="text-[11px]">{formatKelas(jadwal)}</div>
            </td>
          );
        })}
      </tr>
    );
  })}
</tbody>

          </table>
        </div>
      </div>
    );
  })}

        {/* BACK */}
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
       

      </div>
      </div>
    </MainLayout>
  );
};

export default BatchJadwalDetail;