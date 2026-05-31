import { useEffect, useState } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { Loader2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
function AnalisisJadwal() {
  const [batch, setBatch] = useState(null);
  const [dataPelanggaran, setDataPelanggaran] = useState([]);
  const [totalPelanggaran, setTotalPelanggaran] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const fetchPelanggaran = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/scheduler/unmet-constraints", {
        params: {
          batchStatus: "FINAL",
        },
      });
      setDataPelanggaran(res.data.data.violations || []);
      setTotalPelanggaran(res.data.data.totalViolations || 0);
  
    } catch (error) {
      console.error("Gagal ambil pelanggaran:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPelanggaran();
  }, []);
  const hasilGrouping = Object.values(
    (dataPelanggaran || []).reduce((acc, item) => {
      if (!acc[item.jadwalId]) {
        acc[item.jadwalId] = {
          jadwalId: item.jadwalId,
          mataKuliah: item.mataKuliah,
          kelas: item.kelas,
          dosen: item.dosen,
          posisiAsal: item.posisiAsal,
          posisiSaatIni: item.posisiSaatIni,
          keterangan: item.keterangan,
          daftarConstraint: [],
        };
        
      }
  
      const constraint = {
        jenis: item.constraint?.jenis,
        nilai: item.constraint?.nilaiLabel,
      };
  
      // hindari duplikat
      const exists = acc[item.jadwalId].daftarConstraint.some(
        (c) => c.jenis === constraint.jenis && c.nilai === constraint.nilai
      );
  
      if (!exists) {
        acc[item.jadwalId].daftarConstraint.push(constraint);
      }
  
      return acc;
    }, {})
  );

// const toRomawi = (num) => {
//   const map = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
//   return map[num] || num;
// };


const formatKelas = (kelas) => {
  if (!kelas) return "-";

  return kelas;
};

return (
<MainLayout>
  <div className="bg-gray-50 min-h-screen p-2">

    {/* HEADER */}
    <div className="mb-4">
      <h1 className="text-2xl font-bold text-gray-900">Monitoring Pelanggaran Jadwal </h1>
      <p className="text-gray-600 mt-1">
        Monitoring pelanggaran constraint dosen
      </p>
    </div>

    {/* LOADING */}
    {loading && (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    )}

    {/* EMPTY */}
    {!loading && hasilGrouping.length === 0 && (
      <div className="bg-white rounded-xl p-6 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-2 text-gray-400" size={28} />
        <p className="text-sm text-gray-600">
          Tidak ada pelanggaran
        </p>
      </div>
    )}

    {/* TABLE */}
    {!loading && hasilGrouping.length > 0 && (

<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

{/* HEADER */}
<div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
  <h3 className="text-lg font-semibold">
    Daftar Pelanggaran Jadwal
  </h3>
</div>

<div className="overflow-x-auto">
  <table className="w-full">

    {/* THEAD */}
    <thead className="bg-gray-50">
     <tr>
  <th className="w-[180px] px-3 text-center text-xs font-semibold text-gray-500 uppercase">
    Dosen
  </th>

  <th className="w-[220px] px-3 text-center text-xs font-semibold text-gray-500 uppercase">
    Mata Kuliah
  </th>

  <th className="w-[170px] px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
    Sebelum
  </th>

  <th className="w-[170px] px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
    Sesudah
  </th>

  <th className="w-[170px] px-2 text-center text-xs font-semibold text-gray-500 uppercase">
    Pelanggaran
  </th>

  <th className="w-[120px] px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
    Aksi
  </th>
</tr>
    </thead>

    {/* TBODY */}
    <tbody className="divide-y divide-gray-200">

      {loading ? (
        <tr>
          <td colSpan="6" className="py-8 text-center">
            <Loader2 className="animate-spin mx-auto" />
          </td>
        </tr>
      ) : hasilGrouping.length ? (

        hasilGrouping.map((item, index) => (
          <tr key={index} className="hover:bg-gray-50">

            {/* DOSEN */}
            <td className="px-6 py-4 ">
              {item.dosen?.nama || "-"}
            </td>

            {/* MATKUL */}
            <td className="px-6 py-4">
              <p className="font-xs">
                {item.mataKuliah}
              </p>
              <p className="text-xs text-gray-500">
              {formatKelas(item.kelas)}
              </p>
            </td>

            {/* SEBELUM */}
            <td className="px-6 py-4 min-w-[170px] align-top">
              {item.posisiAsal ? (
                <div className="bg-gray-50 p-3 rounded-md text-xs text-gray-700">
                  <div className="flex flex-col gap-1">
                    <div>
                      <span className="text-gray-400">Hari:</span>{" "}
                      <span className="font-semibold">
                        {item.posisiAsal.hari}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Slot:</span>{" "}
                      <span>{item.posisiAsal.slot}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Ruang:</span>{" "}
                      <span className="text-blue-600 font-medium">
                        {item.posisiAsal.ruang}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic">
                  Tidak ada
                </span>
              )}
            </td>

            {/* SESUDAH */}
            <td className="px-6 py-4 min-w-[170px] align-top">
              {item.posisiSaatIni ? (
                <div className="bg-green-50 p-3 rounded-md text-xs">
                  <div className="flex flex-col gap-1">
                    <div>
                      <span className="text-gray-400">Hari:</span>{" "}
                      <span className="text-green-700 font-medium">
                        {item.posisiSaatIni.hari}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Slot:</span>{" "}
                      <span>{item.posisiSaatIni.slot}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Ruang:</span>{" "}
                      <span className="text-green-700 font-medium">
                        {item.posisiSaatIni.ruang}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic">
                  Tidak ada
                </span>
              )}
            </td>

            {/* PELANGGARAN */}
            <td className="px-6 py-4">
            <div className="flex flex-wrap gap-1">

              {item.daftarConstraint.map((c, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-1 bg-red-100 text-red-600 rounded"
                >
                  {c.jenis}
                  {c.nilai && (
                    <span className="ml-1 text-red-400">
                      : {c.nilai}
                    </span>
                  )}
                </span>
              ))}

            </div>
          </td>
      {/* AKSI */}
      <td className="px-3 py-2 text-center">
        <button
          onClick={() => {
            navigate("/perubahan-jadwal/ajukan", {
              state: {
                selectedFromViolation: {
                  jadwalId: item.jadwalId,
                  mode:"ubah",
                },
              
              },
            });
          }}
          className="px-3 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 transition"
        >
          Ubah jadwal
        </button>
        <button
          onClick={() => {
            navigate("/perubahan-jadwal/ajukan", {
              state: {
                selectedFromViolation: {
                  jadwalId: item.jadwalId,
                  mode:"swap",
                },
              
              },
            });
          }}
          className="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Tukar jadwal
        </button>
      </td>
           

          </tr>
        ))

      ) : (
        <tr>
          <td colSpan="6" className="py-8 text-center text-gray-500">
            Tidak ada pelanggaran
          </td>
        </tr>
      )}

    </tbody>
  </table>
</div>

{/* FOOTER */}
<div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
  <div className="text-sm text-gray-700">
    Menampilkan{" "}
    <span className="font-semibold">{hasilGrouping.length}</span> data pelanggaran
  </div>
</div>

</div>

    )}

  </div>
</MainLayout>
);
}

export default AnalisisJadwal;