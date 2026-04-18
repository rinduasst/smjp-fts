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
      const token = res.data?.data?.token;

      if (!token) {
        setError("Token tidak ditemukan.");
        return;
      }

      localStorage.setItem("token", token);
      navigate("/dashboard");
    } catch {
      setError("Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="relative min-h-screen flex items-center justify-center bg-gray-50">
  
        {/* Background Fullscreen */}
        <div
          className="absolute blur-xs inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/gedungfts.png')" }}
        />
        <div className="absolute inset-0 bg-green-900/30"></div>
  
        {/* Form Centered */}
        <div className="relative z-10 w-full max-w-md p-8 bg-white backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20">
  
    {/* Header */}
    <div className="text-center mb-6">
      <img src="/test.png" alt="Logo SMJP" className="w-800 mx-auto mb-3" />
   
    </div>

    {/* Error */}
    {error && (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-center text-red-600 text-sm">
        {error}
      </div>
    )}

    {/* Form */}
    <form onSubmit={handleLogin} className="space-y-5">

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 text-gray-600 w-5 h-5" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Masukkan email"
            className="w-full bg-white/10 border border-black/30 rounded-xl pl-12 pr-4 py-3 text-gray placeholder-black/70 focus:outline-none focus:bg-white/30 focus:border-green-400 focus:ring-1 focus:ring-green-400"
            required
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
        <div className="relative">
          <Lock className="absolute left-4 top-3.5 text-gray-600 w-5 h-5" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
            className="w-full bg-white/10 border border-black/30 rounded-xl pl-12 pr-4 py-3 text-gray placeholder-black/70 focus:outline-none focus:bg-white/30 focus:border-green-400 focus:ring-1 focus:ring-green-400"
            required
          />
        </div>
      </div>

      {/* Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 rounded-xl font-semibold text-white transition ${
          loading ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Masuk"}
      </button>

    </form>

    <p className="text-center text-sm text-gray-700 mt-6">
      Belum punya akun? <span className="text-green-700 font-medium">Hubungi Administrator</span>
    </p>
      </div>

    </div>
  );
}

export default Login;