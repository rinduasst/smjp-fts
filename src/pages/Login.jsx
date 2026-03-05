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
    <div className="relative min-h-screen flex items-center justify-center px-4">

    {/* Background Image */}
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: "url('/background.jpg')" }}
    ></div>
   <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/90 to-transparent"></div>
    {/* Overlay Hitam Transparan */}
    <div className="absolute inset-0 bg-black/60"></div>
    <div className="absolute top-6 left-8 z-20">

    </div>
    {/* Content */}
    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">

        {/* Header */}
        <div className="px-10 pt-10 pb-6 text-center">
          <img
            src="/test.png"
            alt="Logo SMJP"
            className="w-90 mx-auto mb-2"
          />
          <div className="border-t px-1 border-gray-200">
          </div>
        </div>
  
        <div className="px-8 pb-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}
  
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Email */}
           {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Email
            </label>

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-green-600 transition" />
              
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-700 focus:outline-none focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                placeholder="Masukkan email"
                required
              />
            </div>
          </div>

{/* Password */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <button
                type="button"
                className="text-sm text-green-600 hover:underline"
              >
                Lupa?
              </button>
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-green-600 transition" />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-700 focus:outline-none focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                placeholder="Masukkan password"
                required
              />
            </div>
          </div>
  
            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-full font-medium text-white flex items-center justify-center transition ${
                loading
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Sign in"
              )}
            </button>
          </form>
  
          <div className="text-center mt-6 text-sm text-gray-500">
            Belum punya akun?{" "}
            <span className="text-green-600 font-medium">
              Hubungi Administrator
            </span>
          </div>
        </div>
      </div>
    </div>
  )
              };
export default Login;
              