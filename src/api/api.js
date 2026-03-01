import axios from "axios";


const api = axios.create({
  baseURL: "http://43.129.55.147:3000"
 
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
