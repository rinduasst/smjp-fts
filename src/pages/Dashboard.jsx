import React, { useEffect, useState } from "react";
import MainLayout from "../components/MainLayout";
import api from "../api/api";
import {
  Users,
  Calendar,
  Building,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";

const DashboardSMJP = () => {
  const [stats, setStats] = useState({
    totalMatakuliah: 0,
    totalDosen: 0,
    totalRuangan: 0,
    totalJadwal: 0,
    activeBatch: 0
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
        api.get("/api/master-data/ruang")
      ]);

      setStats({
        totalMatakuliah: mkRes.data?.data?.total || 0,
        totalDosen: dosenRes.data?.data?.total || 0,
        totalRuangan: ruangRes.data?.data?.total || 0,
        totalJadwal: 245,
        activeBatch: 1
      });
    } catch (err) {
      console.error("Gagal fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = "emerald" }) => {
    const colors = {
      emerald: "from-emerald-500 to-emerald-600",
      blue: "from-blue-500 to-blue-600",
      purple: "from-purple-500 to-purple-600",
      indigo: "from-indigo-500 to-indigo-600"
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                value
              )}
            </p>
          </div>
          <div className={`p-3 bg-gradient-to-br ${colors[color]} rounded-xl shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Sistem Manajemen Jadwal Perkuliahan
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">
                {stats.activeBatch ? "Periode Aktif: Ganjil 2025/2026" : "Tidak Ada Periode Aktif"}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Mata Kuliah"
              value={stats.totalMatakuliah}
              icon={BookOpen}
              color="emerald"
            />
            <StatCard
              title="Dosen"
              value={stats.totalDosen}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Ruangan"
              value={stats.totalRuangan}
              icon={Building}
              color="purple"
            />
            <StatCard
              title="Jadwal"
              value={stats.totalJadwal}
              icon={Calendar}
              color="indigo"
            />
          </div>

          {/* Info Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Info Card 1 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-700" />
                </div>
                <h3 className="font-semibold text-gray-800">Ringkasan Akademik</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Pengguna</span>
                  <span className="font-semibold text-gray-800">156 Orang</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Rata-rata MK/Dosen</span>
                  <span className="font-semibold text-gray-800">
                    {stats.totalDosen ? Math.round(stats.totalMatakuliah / stats.totalDosen) : 0}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Utilisasi Ruangan</span>
                  <span className="font-semibold text-gray-800">
                    {stats.totalRuangan ? Math.round((stats.totalJadwal / (stats.totalRuangan * 10)) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Info Card 2 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-700" />
                </div>
                <h3 className="font-semibold text-gray-800">Informasi Sistem</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Versi Aplikasi</span>
                  <span className="font-semibold text-gray-800">v2.1.0</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Update Terakhir</span>
                  <span className="font-semibold text-gray-800">
                    {new Date().toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Status Server</span>
                  <span className="font-semibold text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© 2025 Sistem Manajemen Jadwal Perkuliahan • Fakultas Teknik dan Sains • UIKA Bogor</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardSMJP;