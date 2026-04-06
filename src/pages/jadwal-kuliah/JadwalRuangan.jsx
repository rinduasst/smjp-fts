import React, { useEffect, useState } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { Loader2, ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { exportRuangan } from "../../utils/exportExcel/jadwal/exportRuangan.js";

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
    return warnaProdi[namaProdi.toLowerCase()] || "bg-gray-200 text-gray-700";
  };

  const fetchFinalBatch = async () => {
    try {
      const res = await api.get("/api/scheduler/batch", {
        params: { status: "FINAL", page: 1, pageSize: 100 },
      });
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
      const res = await api.get("/api/view-jadwal/all", {
        params: {
          periodeAkademikId: batch.periodeId,
          statusBatch: "FINAL",
          page: 1,
          pageSize: 500,
          sortBy: "hari",
          sortOrder: "asc",
        },
      });
      setJadwalList(res.data?.data?.items || []);
    } catch (err) {
      console.error("Gagal ambil jadwal", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFinalBatch(); }, []);
  useEffect(() => { if (batch) fetchAllJadwal(); }, [batch]);
  const toRomawi = (num) => ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][num] || num;
  const formatKelas = (jadwal) => {
    if (!jadwal.kelas) return "-";
  
    // Ambil semester, ubah ke romawi
    let romawi = "";
    if (jadwal.semester) {
      romawi = typeof jadwal.semester === "number" ? toRomawi(jadwal.semester) : jadwal.semester;
    }
    // Pisah kelas, trim
    const kelasList = jadwal.kelas.split(",").map(k => k.trim());
    // Tambahkan romawi + REG ke semua kelas
    return kelasList.map(k => romawi ? `${romawi}_${k}` : k).join(", ");
  };
  // Grouping per hari
  const jadwalGroupedByHari = {};
  jadwalList.forEach(j => {
    const hari = j.hari || "Tanpa Hari";
    if (!jadwalGroupedByHari[hari]) jadwalGroupedByHari[hari] = [];
    jadwalGroupedByHari[hari].push(j);
  });

  const sesiList = [
    "08.00-08.50",
    "08.50-09.40",
    "09.40-10.30",
    "10.30-11.20",
    "13.00-13.50",
    "13.50-14.40",
    "14.40-15.30",
    "16.00-16.50",
    "16.50-17.40",
    "18.30-19.20",
    "19.20-20.10",
    "20.10-21.00",
    "21.00-21.50"
  ];
  const hitungRowSpan = (mulai, selesai) => {
    const start = sesiList.findIndex(s => s.startsWith(mulai));
    const end = sesiList.findIndex(s => s.endsWith(selesai));
    return end - start + 1;
  };
  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Jadwal Ruangan</h1>
          <p className="text-sm text-gray-600">Daftar jadwal per ruangan dan slot waktu</p>
        </div>
        {/* Keterangan Warna Prodi */}
        <div className="mb-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Keterangan Warna Program Studi
            </h3>
            <p className="text-sm text-gray-500">
              Setiap warna menunjukkan program studi yang menggunakan ruangan pada jadwal berikut.
            </p>
          </div>

          {/* Button export */}
          <button
            onClick={() => exportRuangan(jadwalList, batch)}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
          >
            <Download size={16} /> Export File
          </button>

        </div>

        {/* Garis pemisah */}
        <hr className="border-gray-200 mb-4" />

        {/* Legend warna */}
        <div className="flex flex-wrap gap-4">
          {Object.entries(warnaProdi).map(([nama, warna]) => (
            <div key={nama} className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded border ${warna.split(" ")[0]}`}></span>
              <span className="text-sm text-gray-700 capitalize">{nama}</span>
            </div>
          ))}
        </div>
        </div>

        {/* Matrix Jadwal */}
        {hariUrut.map(hari => {
          const jadwalHari = jadwalGroupedByHari[hari] || [];
          if (!jadwalHari.length) return null;

          // Buat list ruangan dan slot
          // const ruangList = Array.from(new Set(jadwalHari.map(j => j.ruangan)));
          // const slotList = Array.from(new Set(jadwalHari.map(j => `${j.jamMulai}-${j.jamSelesai}`)))
          //   .sort((a,b) => a.localeCompare(b));
          const ruangList = Array.from(new Set(jadwalHari.map(j => j.ruangan)));
          const slotList = sesiList;
          // Matrix
          const matrix = {};
          const skipCell = {};

          jadwalHari.forEach(j => {
            const startIndex = sesiList.findIndex(s => s.startsWith(j.jamMulai));

            const slotKey = sesiList[startIndex]; // pakai slot asli

            if (!matrix[slotKey]) matrix[slotKey] = {};

            matrix[slotKey][j.ruangan] = {
              matkul: j.mataKuliah,
              kelas: formatKelas(j),
              warna: getWarnaProdi(j.prodi),
              jamMulai: j.jamMulai,
              rowspan: hitungRowSpan(j.jamMulai, j.jamSelesai)
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
                      {ruangList.map(r => <th key={r} className="p-2 border text-center">{r}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {slotList.map(slotKey => (
                      <tr key={slotKey} className="hover:bg-gray-50">
                        <td className="p-2 border font-medium whitespace-nowrap">
                        {slotKey}
                          </td>
                          {ruangList.map(ruang => {
                          const key = `${slotKey}-${ruang}`;
                          if (skipCell[key]) return null;
                          const jadwal = matrix[slotKey]?.[ruang];
                          if (!jadwal) {
                            return <td key={ruang} className="p-2 border text-center"></td>;
                          }
                          // tandai slot berikutnya supaya tidak dirender
                          const startIndex = sesiList.findIndex(s => s.startsWith(jadwal.jamMulai));
                          for (let i = 1; i < jadwal.rowspan; i++) {
                            const nextSlot = sesiList[startIndex + i];
                            skipCell[`${nextSlot}-${ruang}`] = true;
                          }
                          return (
                            <td
                          key={ruang}
                          rowSpan={jadwal.rowspan}
                          className={`p-2 border text-center align-top ${jadwal.warna}`}
                        >
                          <div className="font-medium">{jadwal.matkul}</div>
                          <div className="text-[11px]">{jadwal.kelas}</div>
                        </td>
                      );
                      })}           
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-sm text-gray-600 border-t border-gray-200 pt-2">
                Total Jadwal: <span className="font-semibold">{jadwalHari.length}</span>
              </div>
            </div>
          );
        })}

        {/* Tombol Kembali */}
        <div className="flex mt-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
          >
            <ArrowLeft size={18} /> Kembali
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default JadwalRuangan;