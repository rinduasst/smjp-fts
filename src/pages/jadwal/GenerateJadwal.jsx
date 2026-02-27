import React, { Fragment, useState, useEffect } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";

const GenerateJadwal = () => {
  const [fakultasId, setFakultasId] = useState("");
  const [periodeId, setPeriodeId] = useState("");
  const [dryRun, setDryRun] = useState(true);

  const [showLoading, setShowLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dosenList, setDosenList] = useState([]);
  const [hariList, setHariList] = useState([]);
  const [slotList, setSlotList] = useState([]);
  const [ruangList, setRuangList] = useState([]);
  const [penugasanList, setPenugasanList] = useState([]);
  const [fakultasList, setFakultasList] = useState([]);
  const [periodeList, setPeriodeList] = useState([]);
  const [prodiFilter, setProdiFilter] = useState("");

  const [preset, setPreset] = useState("CEPAT");
  const [namaBatch, setNamaBatch] = useState("");

  useEffect(() => {
    fetchFakultas();
    fetchPeriode();
    fetchMasterData();
  }, []);
  const fetchFakultas = async () => {
    const res = await api.get("/api/master-data/fakultas");
    setFakultasList(res.data?.data || []);
  };
  
  const fetchPeriode = async () => {
    const res = await api.get("/api/master-data/periode-akademik");
    setPeriodeList(res.data?.data?.items || []);
  };
  const fetchMasterData = async () => {
    try {
      const [
        dRes,
        hRes,
        sRes,
        rRes,
        pmRes
      ] = await Promise.all([
        api.get("/api/master-data/dosen"),
        api.get("/api/master-data/hari"),
        api.get("/api/master-data/slot-waktu"),
        api.get("/api/master-data/ruang"),
        api.get("/api/pengajaran/penugasan-mengajar"),
      ]);
  
 
      setDosenList(dRes.data?.data?.items || []);
      setHariList(hRes.data?.data || []);
      setSlotList(sRes.data?.data?.items || []);
      setRuangList(rRes.data?.data?.items || []);
      setPenugasanList(pmRes.data?.data?.items || []);
  
    } catch (err) {
      console.error("Gagal load master data", err);
    }
  };
  const handleGenerate = async () => {
    if (!fakultasId || !periodeId) {
      alert("Fakultas dan periode wajib dipilih");
      return;
    }
  
    setShowLoading(true);
    setResult(null);
  
    try {
      const res = await api.post("/api/scheduler/generate", {
        fakultasId,
        periodeAkademikId: periodeId,
        dryRun,
        preset,
        namaBatch,
      });
  
      setResult(res.data.data);
    } catch (err) {
      alert("Gagal generate jadwal");
    } finally {
      setLoading(false);
      setShowLoading(false);
    }
  };
  //helper jam
    const formatJam = (time) => {
      if (!time) return "-";
      const date = new Date(time);
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }).replace(":", ".");
    };
    // Ambil jadwal valid dulu
    const jadwalValid = (result?.jadwalPreview || []).filter(j =>
      j.penugasanMengajarId &&
      j.hariId &&
      j.slotWaktuId &&
      j.ruangId &&
      j.dosenId
    );
    
    //  baru difilter berdasarkan prodi
    const jadwalFiltered = jadwalValid.filter(j => {
      if (!prodiFilter) return true;
    
      const penugasan = penugasanList.find(
        p => String(p.id) === String(j.penugasanMengajarId)
      );
    
      return String(penugasan?.programMatkul?.prodi?.id) === String(prodiFilter);
    });
    
    const handleSave = async () => {
      if (!window.confirm("Yakin ingin menyimpan jadwal ini?")) return;
    
      setLoading(true);
    
      try {
        await api.post("/api/scheduler/generate", {
          fakultasId,
          periodeAkademikId: periodeId,
          dryRun: false,
          preset,
          namaBatch,
        });
    
        alert("Jadwal berhasil disimpan ke batch!");
      } catch (err) {
        alert("Gagal menyimpan jadwal");
      } finally {
        setLoading(false);
      }
    };
    const prodiList = [
      ...new Map(
        penugasanList
          .filter(p => p.programMatkul?.prodi)
          .map(p => [
            p.programMatkul.prodi.id,
            p.programMatkul.prodi
          ])
      ).values()
    ];
 
    const hariUrut = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    // jadwal grup by hari
    // jadwal grup by hari dan urutkan per jam mulai
    const jadwalGroupedByHari = jadwalFiltered.reduce((acc, j) => {
      const hari = hariList.find(h => String(h.id) === String(j.hariId));
      if (!hari) return acc;
      if (!acc[hari.nama]) acc[hari.nama] = [];
      acc[hari.nama].push(j);
      return acc;
    }, {});

    // setelah grouping, urutkan setiap hari berdasarkan jamMulai
    Object.keys(jadwalGroupedByHari).forEach(hari => {
      jadwalGroupedByHari[hari].sort((a, b) => {
        const slotA = slotList.find(s => String(s.id) === String(a.slotWaktuId));
        const slotB = slotList.find(s => String(s.id) === String(b.slotWaktuId));
        return new Date(slotA.jamMulai) - new Date(slotB.jamMulai);
      });
    });


  return (
    <MainLayout>
      <div className=" bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold mb-2">Generate Jadwal Kuliah</h1>
        <p className="text-gray-600 mb-6">
          Sistem akan menghasilkan jadwal kuliah otomatis menggunakan algoritma genetika.
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-800">
              Parameter Penjadwalan
            </h3>
            <p className="text-sm text-gray-500">
            Sistem menggunakan beberapa preset optimasi untuk mengatur strategi pencarian solusi terbaik.
            Pengguna dapat memilih tingkat optimasi sesuai kebutuhan proses.
          </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Generate Jadwal"}
          </button>
        </div>

      
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">

        {/* Fakultas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fakultas
          </label>

          <select
            value={fakultasId}
            onChange={(e) => setFakultasId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Pilih Fakultas</option>
            {fakultasList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nama}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Periode Akademik
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Tentukan periode semester yang akan dibuatkan jadwal.
          </p>

          <select
            value={periodeId}
            onChange={(e) => setPeriodeId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Pilih Periode</option>
            {periodeList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
         {/* Preset */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mode Optimasi
            </label>

            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="CEPAT">Cepat (Proses cepat)</option>
              <option value="STANDAR">Standar (Seimbang)</option>
              <option value="OPTIMAL">Optimal (Memerlukan waktu lebih lama)</option>
            </select>

            <p className="text-xs text-gray-500 mt-1">
              Preset menentukan kualitas dan durasi proses generate jadwal.
            </p>
          </div>

          {/* Nama Batch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Batch Jadwal
            </label>

            <input
              type="text"
              value={namaBatch}
              onChange={(e) => setNamaBatch(e.target.value)}
              placeholder="Contoh: Jadwal Semester Ganjil 2025/2026"
              className="w-full px-3 py-2 bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <p className="text-xs text-gray-500 mt-1">
              Nama batch akan digunakan sebagai identitas jadwal yang disimpan.
            </p>
          </div>

        </div>

        {/* Dry Run */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="mt-1"
          />
          <div>
            <span className="text-sm text-gray-700 font-medium">
              Mode Preview
            </span>
            <p className="text-xs text-gray-500 ">
            Jika diaktifkan, sistem hanya mencoba membuat jadwal tanpa menyimpannya.
          </p>
          </div>
        </div>

        </div>

   
        {result && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              Hasil Proses Penyusunan Jadwal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">

              <div>
                <p className="font-semibold">Mode Proses</p>
                <p className="text-gray-600">
                  {result.mode === "DRY_RUN"
                    ? "Preview (jadwal belum disimpan ke sistem)"
                    : "Final (jadwal sudah disimpan ke sistem)"}
                </p>
              </div>

              <div>
              <p className="font-semibold">Penilaian Jadwal</p>
              <p className="text-gray-600">
                Tingkat kualitas jadwal: 
                <b> {(result.stats.fitnessTerbaik * 100).toFixed(1)}%</b>
              </p>
                {/* <p className="text-xs text-gray-400">
                  Semakin mendekati 100%, jadwal semakin optimal.
                </p> */}
            </div>
              <div>
                <p className="font-semibold">Jumlah Percobaan Sistem</p>
                <p className="text-gray-600">
                  Sistem mencoba menyusun jadwal sebanyak{" "}
                  <b>{result.stats.totalGenerasi}</b> kali
                </p>
              </div>

              <div>
                <p className="font-semibold">Jumlah Konflik Jadwal</p>
                <p className="text-gray-600">
                  Ditemukan <b>{result.stats.penaltyTerbaik}</b> konflik aturan
                </p>
                
              </div>
        {/* KESIMPULAN */}
        
              {result.stats.penaltyTerbaik === 0 ? (
               <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-500">
                  <p> Jadwal sudah baik dan tidak melanggar aturan. Aman untuk disimpan.
                </p>
                </div>
              ) : (
                <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-500">
                <p>
                  Jadwal masih memiliki pelanggaran aturan. Disarankan generate ulang
                  atau periksa aturan dosen & ruang.
                </p>
                </div>
              )}
            </div>
            </div>
     
        )}


        {/* ================= PREVIEW JADWAL ================= */}
        {result?.jadwalPreview?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              Preview Jadwal
            </h3>

            <div className="overflow-x-auto">
            <div className="mb-4 flex items-center gap-4">
            <div>
              <select
                value={prodiFilter}
                onChange={(e) => setProdiFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300
           rounded-lg bg-white text-gray-900 focus:outline-none
           focus:ring-2 focus:ring-green-500
           focus:border-green-500 transition"
        >
                <option value="">Semua Prodi</option>
                {prodiList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                <tr>
                  {/* <th className="p-2 border">Hari</th> */}
                  <th className="p-2 border">Pukul</th>
                  <th className="p-2 border">Kode MK</th>
                  <th className="p-2 border">Mata Kuliah</th>
                  <th className="p-2 border">SKS</th>
                  <th className="p-2 border">Kelas</th>
                  <th className="p-2 border">Dosen</th>
                  <th className="p-2 border">Ruangan</th>
                </tr>
              </thead>
        <tbody>
          {hariUrut.map((namaHari) => {
            const items = jadwalGroupedByHari[namaHari] || []; // jika kosong, tetap render header
            return (
              <React.Fragment key={namaHari}>
                {/* HEADER HARI */}
                <tr className="bg-gray-200">
                  <td colSpan={8} className="p-3 font-semibold text-gray-800 text-center">
                    {namaHari}
                  </td>
                </tr>

                {/* DATA PER HARI */}
                {items.length > 0 ? (
                  items.map((j, index) => {
                    const penugasan = penugasanList.find(p => String(p.id) === String(j.penugasanMengajarId));
                    const dosen = dosenList.find(d => String(d.id) === String(j.dosenId));
                    const ruang = ruangList.find(r => String(r.id) === String(j.ruangId));
                    const slot = slotList.find(s => String(s.id) === String(j.slotWaktuId));

                    if (!penugasan || !slot || !ruang || !dosen) return null;
                        // Ambil semua kode kelas dari penugasan
                     const kelasCodes = penugasan.kelasList?.map(k => k.kelompokKelas?.kode).join(", ") || "-";
                    return (
                      <tr key={`${j.penugasanMengajarId}-${index}`}>
                        {/* <td className="p-2 border"></td> */}
                        <td className="p-2 border">{formatJam(slot.jamMulai)} - {formatJam(slot.jamSelesai)}</td>
                        <td className="p-2 border">{penugasan.programMatkul?.mataKuliah?.kode}</td>
                        <td className="p-2 border">{penugasan.programMatkul?.mataKuliah?.nama}</td>
                        <td className="p-2 border text-center">{penugasan.programMatkul?.mataKuliah?.sks}</td>
                        <td className="p-2 border text-center">{kelasCodes}</td>
                        <td className="p-2 border">{dosen.nama}</td>
                        <td className="p-2 border">{ruang.nama}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-2 text-center text-gray-400 italic">Tidak ada jadwal</td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>



                      </table>
                    </div>
                        {/* Table Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                              Menampilkan{" "}
                              <span className="font-semibold">{jadwalFiltered.length}</span>{" "}
                              dari{" "}
                              <span className="font-semibold">
                                {result?.jadwalPreview?.length || 0}
                              </span>{" "}
                              total sesi
                            </div>
                          </div>
                        </div>
                        {result?.mode === "DRY_RUN" && (
                        <div className="px-6 py-4 flex justify-end">
                          <button
                            onClick={handleSave}
                            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm disabled:opacity-50"
                          >
                            Simpan Jadwal ke Batch
                          </button>
                        </div>
                      )}
                  </div>
                )}
                

                <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
                  <b>Catatan:</b>
                  <p>
                  Proses generate dapat memakan waktu beberapa saat tergantung parameter yang digunakan.
                  </p></div>
              </div>
              {showLoading && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 ">
                <div className="bg-white rounded-xl p-8 shadow-xl w-full max-w-md text-center animate-fade-in">
                  
                  <div className="flex justify-center mb-5">
                    <svg
                      className="animate-spin h-12 w-12 text-green-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Sistem sedang memproses jadwal
                  </h3>

                  <p className="text-sm text-gray-600 leading-relaxed">
                  Sistem sedang melakukan proses penjadwalan perkuliahan menggunakan
                    <span className="font-semibold text-green-600"> algoritma genetika. </span>
                    Mohon menunggu hingga seluruh tahapan selesai.

                  </p>
                </div>
              </div>
            )}

    </MainLayout>
  );
};

export default GenerateJadwal;
