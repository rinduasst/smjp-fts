import React, { useEffect, useState } from "react";
import MainLayout from "../components/MainLayout";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import {Users,  Calendar,  Building,  BookOpen, CheckCircle, Wand2, Layers, CalendarDays, Building2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
const DashboardSMJP = () => {
  const [stats, setStats] = useState({
    totalMatakuliah: 0,
    totalDosen: 0,
    totalRuangan: 0,
    totalJadwal: 0,
  });

  const [jadwalList, setJadwalList] = useState([]);
  const [pengajuanList, setPengajuanList] = useState([])
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState(null);
  const navigate = useNavigate();
  const {user, peran} = useAuth()

  const fetchFinalBatch = async () => {
    try {
      const res = await api.get("/api/scheduler/batch", {
        params: { status: "FINAL", page: 1, pageSize: 100 },
      });
  
      const finalBatch = res.data?.data?.items.find(
        (b) => b.status === "FINAL"
      );
  
      if (finalBatch) setBatch(finalBatch);
    } catch (err) {
      console.error("Gagal ambil batch:", err);
    }
  };
  const fetchDashboardData = async () => {
    if (!batch) return;
  
    try {
      const [mkRes, dosenRes, ruangRes, jadwalRes] = await Promise.all([
        api.get("/api/kurikulum/mata-kuliah"),
        api.get("/api/master-data/dosen"),
        api.get("/api/master-data/ruang"),
        api.get("/api/view-jadwal/all", {
          params: {
            periodeAkademikId: batch.periodeId, 
            statusBatch: "FINAL",
            page: 1,
            pageSize: 500,
          },
        }),
      ]);
  
      const jadwalData = jadwalRes.data?.data?.items || [];
  
      setJadwalList(jadwalData);
  
      setStats({
        totalMatakuliah: mkRes.data?.data?.total || 0,
        totalDosen: dosenRes.data?.data?.total || 0,
        totalRuangan: ruangRes.data?.data?.total || 0,
        totalJadwal: jadwalData.length || 0,
      });
  
    } catch (err) {
      console.error("Gagal fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchFinalBatch();
  }, []);
  
  useEffect(() => {
    if (batch) fetchDashboardData();
  }, [batch]);
  const fetchPengajuanPending = async () => {
    try {
      const res = await api.get("/api/pengajuan-perubahan-jadwal", {
        params: {
          status: "DIAJUKAN",
          page: 1,
          pageSize: 5,
        },
      });
  
      setPengajuanList(res.data?.data?.items || []);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchPengajuanPending();
  }, []);
  // Stat Card
  const StatCard = ({ title, value, icon: Icon, gradient, onClick }) => {
    return (
      <div
        onClick={onClick}
        className={`relative overflow-hidden rounded-2xl px-5 py-4 text-white shadow-md ${gradient}
        cursor-pointer hover:scale-[1.03] hover:shadow-lg transition`}
      >
        
        {/* Background Icon */}
        <div className="absolute right-3 bottom-0 opacity-20">
          <Icon className="w-16 h-16" />
        </div>
  
        {/* Content */}
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-wide opacity-80">
            {title}
          </p>
          <p className="text-2xl font-bold mt-1">
            {value}
          </p>
        </div>
      </div>
    );
  };
  const PengajuanPending = ({ data }) => {
    if (!data.length) {
      return (
        <p className="text-xs text-gray-400">
          Semua pengajuan sudah diproses
        </p>
      );
    }
  
    return (
      <div className="text-sm">
        {data.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-2 border-b last:border-none hover:bg-gray-50 px-2 rounded"
          >
            {/* KIRI */}
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-gray-800 truncate">
                {item.jadwalKuliah?.penugasanMengajar?.programMatkul?.mataKuliah?.nama}
              </span>
              <span className="text-xs text-gray-500">
                {item.jadwalKuliah?.penugasanMengajar?.dosen?.nama}
              </span>
            </div>
  
            {/* KANAN */}
            <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 whitespace-nowrap">
              Menunggu
            </span>
          </div>
        ))}
      </div>
    );
  };
 
  const JadwalHariIniMatrix = ({ jadwalList }) => {
    const sesiList = [
      "08.00-08.50","08.50-09.40","09.40-10.30","10.30-11.20",
      "13.00-13.50","13.50-14.40","14.40-15.30",
      "16.00-16.50","16.50-17.40",
      "18.30-19.20","19.20-20.10","20.10-21.00","21.00-21.50"
    ];

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
      if (!namaProdi) return "bg-gray-200";
      return warnaProdi[namaProdi.toLowerCase()] || "bg-gray-200";
    };

    const hitungRowSpan = (mulai, selesai) => {
      const start = sesiList.findIndex(s => s.startsWith(mulai));
      const end = sesiList.findIndex(s => s.endsWith(selesai));
      return end - start + 1;
    };
    const todayName = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
    });
    const todayFull = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const jadwalHari = jadwalList.filter(
      (j) => j.hari?.toLowerCase() === todayName.toLowerCase()
    );

    if (!jadwalHari.length) {
      return (
        <div className="bg-white rounded-xl p-6 mt-8 text-gray-400">
          Tidak ada jadwal hari ini
        </div>
      );
    }

    const ruangList = Array.from(new Set(jadwalHari.map(j => j.ruangan)));

    const matrix = {};
    const skipCell = {};

    jadwalHari.forEach(j => {
      const startIndex = sesiList.findIndex(s => s.startsWith(j.jamMulai));
      const slotKey = sesiList[startIndex];

      if (!matrix[slotKey]) matrix[slotKey] = {};

      matrix[slotKey][j.ruangan] = {
        matkul: j.mataKuliah,
        kelas: j.kelas,
        warna: getWarnaProdi(j.prodi),
        jamMulai: j.jamMulai,
        rowspan: hitungRowSpan(j.jamMulai, j.jamSelesai)
      };
    });

    return (
      <div className="bg-white rounded-2xl shadow-sm mt-2 border-gray-400  p-6">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Jadwal Aktif
              </p>

              {batch ? (
                <p className="text-sm font-semibold text-gray-800">
               Periode  {batch?.periode?.nama} | {batch?.fakultas?.nama}
                </p>
                
              ) : (
                <p className="text-sm text-gray-400">Memuat...</p>
              )}
            <h3 className="text-sm font-semibold text-gray-800 mb-4">
          Jadwal Hari Ini {todayName}, {todayFull}</h3>
            </div>
          </div>
      

        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border w-[120px]">Jam</th>
                {ruangList.map(r => (
                  <th key={r} className="p-2 border">{r}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sesiList.map(slot => (
                <tr key={slot}>
                  <td className="p-2 border font-medium">{slot}</td>

                  {ruangList.map(ruang => {
                    const key = `${slot}-${ruang}`;
                    if (skipCell[key]) return null;

                    const jadwal = matrix[slot]?.[ruang];

                    if (!jadwal) {
                      return <td key={ruang} className="border p-2"></td>;
                    }

                    const startIndex = sesiList.findIndex(s =>
                      s.startsWith(jadwal.jamMulai)
                    );

                    for (let i = 1; i < jadwal.rowspan; i++) {
                      const nextSlot = sesiList[startIndex + i];
                      skipCell[`${nextSlot}-${ruang}`] = true;
                    }

                    return (
                      <td
                        key={ruang}
                        rowSpan={jadwal.rowspan}
                        className={`border p-2 text-center align-top ${jadwal.warna}`}
                      >
                        <div className="font-medium">{jadwal.matkul}</div>
                        <div className="text-[10px]">{jadwal.kelas}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
        <button
            onClick={() => navigate("/jadwal-kuliah/jadwal-ruangan")}
            className="w-full text-center text-sm text-gray-600 hover:text-red-600 transition"
          >
            Lihat Selengkapnya 
          </button>
          </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 ">
        {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard
        </h1>
        <p className="text-gray-500 text-sm">
          Sistem Manajemen Jadwal Perkuliahan
        </p>
      </ div>


        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <StatCard 
            title="Mata Kuliah" 
            value={stats.totalMatakuliah} 
            icon={BookOpen} 
            gradient="bg-gradient-to-r from-blue-500 to-indigo-600"
            onClick={() => navigate("/kurikulum/mata-kuliah")}
          />

          <StatCard 
            title="Dosen" 
            value={stats.totalDosen} 
            icon={Users} 
            gradient="bg-gradient-to-r from-green-500 to-emerald-600"
            onClick={() => navigate("/master-data/dosen")}
          />

          <StatCard 
            title="Ruangan" 
            value={stats.totalRuangan} 
            icon={Building} 
            gradient="bg-gradient-to-r from-orange-500 to-amber-600"
            onClick={() => navigate("/master-data/ruang")}
          />

          <StatCard 
            title="Jadwal" 
            value={stats.totalJadwal} 
            icon={Calendar} 
            gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
            onClick={() => navigate("/kurikulum/program-matkul")}
          />

        </div>

        
        {/* LEFT - Jadwal */}
        <div className="lg:col-span-3">
          <JadwalHariIniMatrix jadwalList={jadwalList} compact />
        
        </div>
        </div>
    

        {/* Pengajuan */}
        <div className="bg-white rounded-2xl p-5 mt-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
          <span>Pengajuan Perubahan Jadwal</span>
          {pengajuanList.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full">
              {pengajuanList.length}
            </span>
          )}
        </h3>

          <PengajuanPending data={pengajuanList} />

          <div className="mt-3 pt-3 border-t  border-gray-200">
          <button
            onClick={() => navigate("/pengajuan-perubahan-jadwal")}
            className="w-full text-center text-sm text-gray-600 hover:text-red-600 transition"
          >
            Lihat Selengkapnya →
          </button>
        </div>
        </div>

    </MainLayout>
  );
};

export default DashboardSMJP;