import axios from "axios";


const api = axios.create({
  baseURL: "https://collective-bear-shn-3fbf09f0.koyeb.app"
 
});

// otomatis kirim token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
