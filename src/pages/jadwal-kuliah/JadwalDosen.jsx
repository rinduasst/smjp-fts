import React, { useState, useEffect } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { useAuth } from "../../hooks/useAuth";
import { Download, Search, Loader2 } from "lucide-react";

const JadwalDosen = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
      .map(k => k.toLowerCase() === "karyawan" ? `${romawi}_KARYAWAN` : `${romawi}_REG_${k}`)
      .join(", ");
  };

  const fetchFinalBatch = async () => {
    try {
      const res = await api.get("/api/scheduler/batch", { params: { status: "FINAL", page: 1, pageSize: 100 } });
      const finalBatch = res.data?.data?.items.find(b => b.status === "FINAL");
      return finalBatch?.periodeId || null;
    } catch (err) {
      console.error("Gagal mengambil batch", err);
      return null;
    }
  };

  const fetchJadwalDosen = async () => {
    if (!user?.prodiId) return;
    setLoading(true);
    try {
      const periodeId = await fetchFinalBatch();
      if (!periodeId) return;

      const res = await api.get("/api/view-jadwal/all", {
        params: {
          periodeAkademikId: periodeId,
          prodiId: user.prodiId,
          statusBatch: "FINAL",
          page: 1,
          pageSize: 200,
          sortBy: "hari",
          sortOrder: "asc",
        },
      });

      const items = res.data?.data?.items || [];
      const grouped = items.reduce((acc, item) => {
        if (!acc[item.dosen]) acc[item.dosen] = { nama: item.dosen, jadwal: [] };
        acc[item.dosen].jadwal.push(item);
        return acc;
      }, {});

      setData(Object.values(grouped));
    } catch (err) {
      console.error("Gagal ambil jadwal dosen", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJadwalDosen(); }, []);

  // Filter berdasarkan search
  const filteredData = data.map(dosen => ({
    ...dosen,
    jadwal: dosen.jadwal.filter(j => j.dosen.toLowerCase().includes(searchTerm.toLowerCase()))
  })).filter(dosen => dosen.jadwal.length > 0);

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen ">
        <h1 className="text-2xl font-bold mb-2">Jadwal Dosen</h1>
        <p className="text-sm text-gray-600 mb-4">
          Daftar jadwal perkuliahan dosen pada periode akademik saat ini.
        </p>

        {/* Kontrol Export + Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
         
          <button className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium">
            <Download size={18} /> Export Excel
          </button>
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input 
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-500 text-gray-900 focus:border-green-500 focus:outline-none transition"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Dosen..."
            />
          </div>
        </div>

        {/* Tabel */}
        {loading ? (
          <div className="flex items-center gap-2 text-gray-600"><Loader2 className="animate-spin" /> Loading...</div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-300">
              <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="border px-3 py-2">NO</th>
                  <th className="border px-3 py-2">Nama</th>
                  <th className="border px-3 py-2">Mata Kuliah</th>
                  <th className="border px-3 py-2">Kelas</th>
                  <th className="border px-3 py-2">SKS</th>
                  <th className="border px-3 py-2">Hari</th>
                  <th className="border px-3 py-2">Waktu</th>
                  <th className="border px-3 py-2">Ruang</th>
                  <th className="border px-3 py-2">Total SKS</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((dosen, idx) => {
                  const totalSKS = dosen.jadwal.reduce((acc, j) => acc + (j.sks || 0), 0);

                  return dosen.jadwal.map((j, i) => (
                    <tr key={`${dosen.nama}-${i}`}>
                      {i === 0 && (
                        <>
                          <td rowSpan={dosen.jadwal.length} className="border px-3 py-2 text-center">{idx + 1}</td>
                          <td rowSpan={dosen.jadwal.length} className="border px-3 py-2 font-medium">{dosen.nama}</td>
                        </>
                      )}
                      <td className="border px-3 py-2">{j.mataKuliah}</td>
                      <td className="border px-3 py-2">{formatKelas(j)}</td>
                      <td className="border px-3 py-2 text-center">{j.sks}</td>
                      <td className="border px-3 py-2">{j.hari}</td>
                      <td className="border px-3 py-2 whitespace-nowrap">{j.jamMulai} - {j.jamSelesai}</td>
                      <td className="border px-3 py-2">{j.ruangan}</td>
                      {i === 0 && (
                        <td rowSpan={dosen.jadwal.length} className="border px-3 py-2 text-center font-semibold">{totalSKS}</td>
                      )}
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default JadwalDosen;