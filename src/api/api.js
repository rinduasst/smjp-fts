import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// 🔹 attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔹 helper translate action
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

// 🔹 helper mapping module
const getModule = (url) => {
  if (url.includes("jadwal")) return "Jadwal Kuliah";
  if (url.includes("pengajaran")) return "Pengajaran";
  if (url.includes("master-data")) return "Master Data";
  if (url.includes("kurikulum")) return "Kurikulum";
  return "Pengguna";
};

// 🔥 AUTO LOGGING
api.interceptors.response.use(
  (response) => {
    try {
      const method = response.config.method?.toUpperCase();
      const url = response.config.url || "";

      // ❗ hanya log perubahan data
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

      // 🔥 hindari duplicate log (kadang axios ke-trigger 2x)
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