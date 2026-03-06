import React, { useEffect, useState } from "react";
import MainLayout from "../components/MainLayout";
import api from "../api/api";
import { Users, Calendar, Building, BookOpen, BarChart3, AlertCircle, Layers } from "lucide-react";

const DashboardSMJP = () => {
  const [stats, setStats] = useState({
    totalMatakuliah: 0,
    totalDosen: 0,
    totalRuangan: 0,
    activeBatch: 0,
    jadwalFilledPercent: 0,
    prodiTerpadat: "",
    slotTerbanyak: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [mkRes, dosenRes, ruangRes] = await Promise.all([
        api.get("/api/kurikulum/mata-kuliah"),
        api.get("/api/master-data/dosen"),
        api.get("/api/master-data/ruang"),
      ]);

      // Contoh data dummy tambahan untuk insight
      setStats({
        totalMatakuliah: mkRes.data?.data?.items?.length || 0,
        totalDosen: dosenRes.data?.data?.items?.length || 0,
        totalRuangan: ruangRes.data?.data?.items?.length || 0,
        activeBatch: 1,
        jadwalFilledPercent: 72,
        prodiTerpadat: "Teknik Sipil",
        slotTerbanyak: "08:00-10:00"
      });
    } catch (err) {
      console.error("Gagal fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? "..." : value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      {/* HEADER */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard SMJP</h1>
        <p className="text-gray-600 mt-1">Sistem Manajemen Jadwal Perkuliahan</p>
      </div>

      {/* MAIN CONTENT */}
      <div className="p-6 bg-gray-50 min-h-screen space-y-8">

        {/* 1️⃣ Ringkasan Data */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Mata Kuliah" value={stats.totalMatakuliah} icon={BookOpen} color="bg-green-500" />
            <StatCard title="Dosen" value={stats.totalDosen} icon={Users} color="bg-blue-500" />
            <StatCard title="Ruangan" value={stats.totalRuangan} icon={Building} color="bg-purple-500" />
            <StatCard title="Batch Aktif" value={stats.activeBatch} icon={Calendar} color="bg-orange-500" />
          </div>
        </div>

        {/* 2️⃣ Ringkasan Insight & Statistik */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Statistik Jadwal */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistik Jadwal & Insight</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Persentase Terisi</p>
                <p className="text-lg font-bold text-gray-800 mt-1">{stats.jadwalFilledPercent}%</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Prodi Terpadat</p>
                <p className="text-lg font-bold text-green-700 mt-1">{stats.prodiTerpadat}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Slot Terbanyak</p>
                <p className="text-sm font-semibold text-blue-700 mt-1">{stats.slotTerbanyak}</p>
              </div>
            </div>

            {/* Placeholder chart */}
            <div className="mt-6 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
              Bar/Pie Chart Placeholder
            </div>
          </div>

          {/* Quick Action */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-green-600 hover:bg-green-700 text-white transition">
                <Layers size={22} />
                <span className="text-sm font-medium">Generate Jadwal</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
                <Calendar size={22} />
                <span className="text-sm font-medium">Lihat Jadwal</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition">
                <BarChart3 size={22} />
                <span className="text-sm font-medium">Import Data</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition">
                <AlertCircle size={22} />
                <span className="text-sm font-medium">Validasi Jadwal</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3️⃣ Notifikasi */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Notifikasi / Alert</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li>Jadwal bentrok atau perlu validasi</li>
            <li>Periode akademik yang akan datang</li>
            <li>Praktikum / lab yang belum ditempatkan</li>
          </ul>
        </div>

      </div>
    </MainLayout>
  );
};

export default DashboardSMJP;