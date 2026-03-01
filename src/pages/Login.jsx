import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2 } from "lucide-react";
import api from "../api/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", { email, password });

      const token =
        res.data?.data?.token

      if (!token) {
        setError("Token tidak ditemukan.");
        return;
      }

      localStorage.setItem("token", token);
      navigate("/dashboard");
    } catch (err) {
      setError("Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
   <div
  className="min-h-screen bg-contain bg-center bg-no-repeat relative flex items-center justify-end px-53"
  style={{ backgroundImage: "url('/logosmjp.png')" }}

    >
      {/* Overlay */}
      <div className="absolute inset-0"></div>

      {/* Card */}
        <div className="w-full max-w-md">
        <div className="bg-white/40 backdrop-blur-xl rounded-[30px] shadow-2xl p-10 border border-white/30">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-700 tracking-wide">
           LOGIN 
            </h1>
            <p className="text-gray-600 mt-2">
              Sistem Manajemen Jadwal Perkuliahan
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/60 backdrop-blur-md rounded-full px-6 py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  placeholder="Masukkan email Anda"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/60 backdrop-blur-md rounded-full px-6 py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  placeholder="Masukkan password Anda"
                  required
                />
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium text-white flex items-center justify-center transition ${
                loading
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Extra */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Belum memiliki akun?{" "}
              <span className="text-blue-600">
                Hubungi administrator
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;