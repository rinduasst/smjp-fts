import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";



/* PAGES */
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

/* Master Data */
import Fakultas from "./pages/master-data/Fakultas";
import ProgramStudi from "./pages/master-data/ProgramStudi";
import PeriodeAkademik from "./pages/master-data/PeriodeAkademik";
import HariKuliah from "./pages/master-data/HariKuliah";
import RuangKuliah from "./pages/master-data/RuangKuliah";
import SesiWaktu from "./pages/master-data/SesiWaktu";
import Dosen from "./pages/master-data/Dosen";
import KelompokKelas from "./pages/master-data/KelompokKelas";

/* Kurikulum */
import MataKuliah from "./pages/kurikulum/MataKuliah";
import Kurikulum from "./pages/kurikulum/Kurikulum";
import DetailKurikulum from "./pages/kurikulum/DetailKurikulum";
import AssignMatkul from "./pages/kurikulum/AssignMatkul";
import ProgramMatkul from "./pages/kurikulum/ProgramMatkul";

/* Pengajaran */
import PenugasanMengajar from "./pages/pengajaran/PenugasanMengajar";
import PreferensiDosen from "./pages/pengajaran/PreferensiDosen";
import ConstraintDosen from "./pages/pengajaran/ConstraintDosen";

/* Penjadwalan */
import GenerateJadwal from "./pages/jadwal/GenerateJadwal";
import BatchJadwal from "./pages/jadwal/BatchJadwal";
import BatchJadwalDetail from "./pages/jadwal/BatchJadwalDetail";
import DetailKonflik from "./pages/jadwal/DetailKonflik";

/* Jadwal */
import Jadwal from "./pages/jadwal/Jadwal";
import JadwalProdi from "./pages/jadwal-kuliah/JadwalProdi";
import JadwalDosen from "./pages/jadwal-kuliah/JadwalDosen";
import JadwalRuangan from "./pages/jadwal-kuliah/JadwalRuangan";
import PerubahanJadwal from "./pages/jadwal/PerubahanJadwal";

/* Pengaturan */
import ManajemenPengguna from "./pages/ManajemenPengguna";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />

        {/* Master Data */}
        <Route path="/master-data/fakultas" element={<Fakultas />} />
        <Route path="/master-data/program-studi" element={<ProgramStudi />} />
        <Route path="/master-data/periode-akademik" element={<PeriodeAkademik />} />
        <Route path="/master-data/hari" element={<HariKuliah />} />
        <Route path="/master-data/slot-waktu" element={<SesiWaktu />} />
        <Route path="/master-data/ruang" element={<RuangKuliah />} />
        <Route path="/master-data/dosen" element={<Dosen />} />
        <Route path="/master-data/kelompok-kelas" element={<KelompokKelas />} />

        {/* Kurikulum */}
        <Route path="/kurikulum/mata-kuliah" element={<MataKuliah />} />
        <Route path="/kurikulum/kurikulum" element={<Kurikulum />} />
        <Route path="/kurikulum/program-matkul" element={<ProgramMatkul />} />
        <Route path="/kurikulum/:id" element={<DetailKurikulum />} />
        <Route path="/kurikulum/:id/assignMatkul" element={<AssignMatkul />} />

        {/* Pengajaran */}
        <Route path="/pengajaran/penugasan-mengajar" element={<PenugasanMengajar />} />
        <Route path="/pengajaran/preferensi-dosen" element={<PreferensiDosen />} />
        <Route path="/pengajaran/aturan-mengajar-dosen" element={<ConstraintDosen />} />

        {/* Scheduler */}
        <Route path="/scheduler/generate" element={<GenerateJadwal />} />
        <Route path="/scheduler/batch" element={<BatchJadwal />} />
        <Route path="/scheduler/batch/:id" element={<BatchJadwalDetail />} />
        <Route path="/scheduler/batch/:id/conflicts" element={<DetailKonflik />} />

        {/* Jadwal */}
        <Route path="/jadwal-kuliah/jadwal" element={<Jadwal />} />
        <Route path="/jadwal-kuliah/jadwal-prodi" element={<JadwalProdi />} />
        <Route path="/jadwal-kuliah/jadwal-dosen" element={<JadwalDosen />} />
        <Route path="/jadwal-kuliah/jadwal-ruangan" element={<JadwalRuangan />} />
        <Route path="/pengajuan-perubahan-jadwal" element={<PerubahanJadwal />} />

        {/* Pengaturan */}
        <Route
          path="/pengaturan/pengguna"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <ManajemenPengguna />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;