import { useEffect, useState } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { Download, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  exportAllProdi,
 } from "../../utils/exportExcel/jadwal/exportAllProdi.js";

const JadwalProdi = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState(null);
 
  const [batchInfo, setBatchInfo] = useState(null);
  const { user, peran } = useAuth();

  const fetchFinalBatch = async () => {
    try {
      const res = await api.get("/api/scheduler/batch");
      const finalBatch = res.data?.data?.items.find((b) => b.status === "FINAL");
      if (finalBatch) {
        setActiveBatchId(finalBatch.id);
        setBatchInfo(finalBatch);
      }
    } catch (err) {
      console.error("Gagal mengambil batch", err);
    }
  };

  const fetchJadwal = async () => {
    if (!activeBatchId) return;
    setLoading(true);
    try {
      let allData = [];
      let currentPage = 1;
      let totalPages = 1;
      do {
        const res = await api.get("/api/scheduler/jadwal", {
          params: {
            batchId: activeBatchId,
            page: currentPage,
            pageSize: 200,
          },
        });
        const items = res.data?.data?.items || [];
        const total = res.data?.data?.total || 0;
        allData = [...allData, ...items];
        totalPages = Math.ceil(total / 200);
        currentPage++;
      } while (currentPage <= totalPages);
  
      setData(allData);
  
    } catch (err) {
      console.error("Gagal mengambil semua jadwal", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinalBatch();
  }, []);

  useEffect(() => {
    if (activeBatchId) fetchJadwal();
  }, [activeBatchId]);

  const fakultas = batchInfo?.fakultas?.nama || "";
  const periode = batchInfo?.periode?.nama || "";

  const isAdmin = peran === "ADMIN";
  const filteredData = isAdmin
    ? data
    : data.filter((item) => item.penugasanMengajar?.programMatkul?.prodi?.id === user?.prodiId);

  // Sorting & grouping global
  const sortedData = filteredData.sort((a, b) => {
    const hariOrder = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"];
    return hariOrder.indexOf(a.hari?.nama || "") - hariOrder.indexOf(b.hari?.nama || "");
  });

  const groupedHari = sortedData.reduce((acc, item) => {
    const hari = item.hari?.nama || "-";
    if (!acc[hari]) acc[hari] = [];
    acc[hari].push(item);
    return acc;
  }, {});

  const toRomawi = (num) => {
    const map = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
    return map[num] || num;
  };

  const hitungSemester = (angkatan, tahunMulai, paruh) => {
    if (!angkatan || !tahunMulai) return 0;
    return (tahunMulai - angkatan) * 2 + (paruh === "GENAP" ? 2 : 1);
  };
  // Group data per semester
const groupedBySemester = {};

filteredData.forEach((jadwal) => {
  if (!jadwal.penugasanMengajar?.kelasList) return;

  jadwal.penugasanMengajar.kelasList.forEach((k) => {
    const periode = jadwal.penugasanMengajar?.programMatkul?.periode;
    const angkatan = k.kelompokKelas?.angkatan;
    const tahunMulai = periode?.tahunMulai;
    const paruh = periode?.paruh;
    const semesterAngka = hitungSemester(angkatan, tahunMulai, paruh);
    const romawi = toRomawi(semesterAngka);

    if (!groupedBySemester[romawi]) groupedBySemester[romawi] = [];
    groupedBySemester[romawi].push({ ...jadwal, kelasKode: k.kelompokKelas?.kode, jenisKelas: k.kelompokKelas?.jenisKelas });
  });
});
// Ambil entries dan urutkan berdasarkan angka semester
const sortedSemesters = Object.entries(groupedBySemester)
  .sort(([a], [b]) => {
    // ubah romawi ke angka
    const romanToNumber = (roman) => {
      const map = { I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8, IX:9, X:10, XI:11, XII:12 };
      return map[roman] || 0;
    };
    return romanToNumber(a) - romanToNumber(b);
  });

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Jadwal Perkuliahan</h1>
          <p className="text-sm text-gray-600">Daftar jadwal perkuliahan yang telah disusun untuk periode aktif.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <button
            onClick={() => exportAllProdi(filteredData, batchInfo)}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
          >
            <Download size={18} />
            Export Excel
          </button>
        </div>

        {sortedSemesters.map(([semester, items]) => (
        <div
          key={semester}
          className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
         <h2 className="text-center font-bold mb-4 text-gray-700">
          SEMESTER {semester}
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border border-gray-300 bg-white">
      <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
        <tr>
          <th className="px-4 py-3 border">Hari</th>
          <th className="px-4 py-3 border">Jam</th>
          <th className="px-4 py-3 border">Mata Kuliah</th>
          <th className="px-4 py-3 border text-center">SKS</th>
          <th className="px-4 py-3 border">Dosen</th>
          <th className="px-4 py-3 border">Kelas</th>
          <th className="px-4 py-3 border">Ruangan</th>
        </tr>
      </thead>
      <tbody>
        
        {Object.entries(
          items.reduce((acc, jadwal) => {
            const hari = jadwal.hari?.nama || "-";
            if (!acc[hari]) acc[hari] = [];
            acc[hari].push(jadwal);
            return acc;
          }, {})
        ).map(([hari, hariItems]) =>
          hariItems.map((jadwal, idx) => (
            <tr key={`${jadwal.id}-${idx}`}>
              {idx === 0 && (
                <td rowSpan={hariItems.length} className="px-4 py-2 border align-top">
                  {hari}
                </td>
              )}
              <td className="border py-2 px-1">
                {jadwal.slotWaktu?.jamMulai} - {jadwal.slotWaktu?.jamSelesai}
              </td>
              <td className="border px-4 py-2">
                {jadwal.penugasanMengajar?.programMatkul?.mataKuliah?.nama}
              </td>
              <td className="border px-4 py-2 text-center">
                {jadwal.penugasanMengajar?.programMatkul?.mataKuliah?.sks}
              </td>
              <td className="border px-4 py-2">
                {jadwal.penugasanMengajar?.dosen?.nama}
              </td>
              <td className="border px-4 py-2">
                {jadwal.penugasanMengajar?.kelasList?.map((k) => {
                  const periode = jadwal.penugasanMengajar?.programMatkul?.periode;
                  const angkatan = k.kelompokKelas?.angkatan;
                  const tahunMulai = periode?.tahunMulai;
                  const paruh = periode?.paruh;
                  const semesterAngka = hitungSemester(angkatan, tahunMulai, paruh);
                  const romawi = toRomawi(semesterAngka);
                  const jenis = k.kelompokKelas?.jenisKelas === "REGULER" ? "REG" : "KAR";
                  return `${romawi}_${jenis}_${k.kelompokKelas?.kode}`;
                }).join(", ")}
              </td>
              <td className="border px-4 py-2">{jadwal.ruang?.nama}</td>
            </tr>
          ))
        )}
      </tbody>
      
    </table>
  </div>
  </div>
))}
</div>

    </MainLayout>
  );
};

export default JadwalProdi;