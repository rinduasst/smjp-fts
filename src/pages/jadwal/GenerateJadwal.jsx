import React, { Fragment, useState, useEffect } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../api/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const GenerateJadwal = () => {
  const [fakultasId, setFakultasId] = useState("");
  const [periodeId, setPeriodeId] = useState("");

  const [loading, setLoading] = useState(false);
  const [penugasanList, setPenugasanList] = useState([]);
  const [fakultasList, setFakultasList] = useState([]);
  const [periodeList, setPeriodeList] = useState([]);
  const [preset, setPreset] = useState("CEPAT");
  const [jobId, setJobId] = useState(null);
  const [namaBatch, setNamaBatch] = useState("");

  useEffect(() => {
    fetchFakultas();
    fetchPeriode();
  }, []);
  const fetchFakultas = async () => {
    const res = await api.get("/api/master-data/fakultas");
    setFakultasList(res.data?.data || []);
  };
  
  const fetchPeriode = async () => {
    const res = await api.get("/api/master-data/periode-akademik");
    setPeriodeList(res.data?.data?.items || []);
  };

  const handleGenerate = async () => {
    if (!fakultasId || !periodeId) {
      toast.warning("Fakultas dan Periode wajib dipilih!");
      return;
    }
  
    try {
      setLoading(true);
  
      const payload = {
        fakultasId,
        periodeAkademikId: periodeId,
        dryRun: false,
        preset,
        namaBatch,
      };
      const res = await api.post("/api/scheduler/generate", payload);
      const data = res.data.data;
  
      // MODE ASYNC
      if (data.mode === "ASYNC") {
        toast.info("Sistem sedang menyusun jadwal...");
        const jid = data.jobId;
        const interval = setInterval(async () => {
          const jobRes = await api.get(`/api/scheduler/job/${jid}`);
          const jobData = jobRes.data.data;
          if (jobData.status === "DONE") {
            clearInterval(interval);
            const batchId = jobData.result?.batchId;
            toast.success(
              <div className="flex items-center gap-3">
                <span>Jadwal berhasil disusun!</span>
                <button
                  onClick={() => {
                    window.location.href = `/scheduler/batch/${batchId}`;
                  }}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                >
                  Lihat
                </button>
              </div>,
              {
                autoClose: false
              }
            );
          }
          if (jobData.status === "FAILED") {
            clearInterval(interval);
            toast.error("Generate jadwal gagal");
          }
        }, 5000);
      } else {
        // MODE SYNC
        toast.success("Jadwal berhasil disimpan!");
  
        setTimeout(() => {
          window.location.href = "/scheduler/batch";
        }, 1500);
      }
  
    } catch (err) {
      toast.error("Gagal generate jadwal");
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
          </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2.5 rounded-lg shadow-sm disabled:opacity-50"
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
        </div>

                <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
                  <b>Catatan:</b>
                  <p>
                  Proses generate dapat memakan waktu beberapa saat tergantung parameter yang digunakan.
                  </p></div>
              </div>

    </MainLayout>
  );
};

export default GenerateJadwal;
