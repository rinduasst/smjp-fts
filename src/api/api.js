import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
const actionLabel = (action) => {
  switch (action) {
    case "CREATE":
      return "Menambahkan";
    case "UPDATE":
      return "Mengubah";
    case "DELETE":
      return "Menghapus";
    default:
      return action;
  }
};
const moduleMap = {
  "fakultas": "Fakultas",
  "program-studi": "Program Studi",
  "periode-akademik": "Periode Akademik",
  "hari": "Hari Kuliah",
  "slot-waktu": "Sesi Waktu",
  "ruang": "Ruang Kuliah",
  "dosen": "Dosen",
  "kelompok-kelas": "Kelompok Kelas",

  // KURIKULUM
  "mata-kuliah": "Mata Kuliah",
  "kurikulum": "Kurikulum",
  "program-matkul": "Program Mata Kuliah",

  // PENGAJARAN
  "penugasan-mengajar": "Penugasan Mengajar",
  "preferensi-dosen": "Preferensi Dosen",
  "aturan-mengajar-dosen": "Aturan Mengajar Dosen",

  // JADWAL
  "generate": "Generate Jadwal",
  "batch": "Batch Jadwal",
  "jadwal": "Jadwal Kuliah",
  "jadwal-prodi": "Jadwal Prodi",
  "jadwal-dosen": "Jadwal Dosen",
  "jadwal-ruangan": "Jadwal Ruangan",
  "jadwal-kelas": "Jadwal Kelas",
  "perubahan-jadwal": "Perubahan Jadwal",
  "analisis-jadwal": "Analisis Jadwal",

  // PENGATURAN
  "pengguna": "Manajemen Pengguna",
  "log-aktivitas": "Log Aktivitas",
};

//  mapping module
const getModule = (url) => {
  for (const key in moduleMap) {
    if (url.includes(key)) {
      return moduleMap[key];
    }
  }

  return "Modul Tidak Diketahui";
};

// auto logging
api.interceptors.response.use(
  (response) => {
    try {
      const method = response.config.method?.toUpperCase();
      const url = response.config.url || "";
      if (!["POST", "PATCH", "DELETE"].includes(method)) {
        return response;
      }

      const user = JSON.parse(localStorage.getItem("user"));

      // mapping action
      let action = "";
      if (method === "POST") action = "CREATE";
      else if (method === "PATCH") action = "UPDATE";
      else if (method === "DELETE") action = "DELETE";

      const module = getModule(url);

      const logs = JSON.parse(localStorage.getItem("activity_logs")) || [];
      const lastLog = logs[0];
      const now = Date.now();

      if (
        lastLog &&
        lastLog.action === action &&
        lastLog.module === module &&
        now - new Date(lastLog.time).getTime() < 1000
      ) {
        return response;
      }

      logs.unshift({
        id: now,
        user: user?.nama || "Unknown",
        role: user?.peran || "User",
        action,
        module,
        description: `${actionLabel(action)} data ${module}`,
        time: new Date().toISOString(),
      });

      localStorage.setItem("activity_logs", JSON.stringify(logs));

    } catch (err) {
      console.log("Log error:", err);
      
    }

    return response;
  },
  (error) => Promise.reject(error)
);

export default api;