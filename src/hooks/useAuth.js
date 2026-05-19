import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  let user = null;
  let peran = null;

  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));

      // cek expired
      const now = Math.floor(Date.now() / 1000);

      if (decoded.exp && decoded.exp < now) {
        localStorage.removeItem("token");
      } else {
        user = decoded;
        peran = decoded.peran;
      }
    } catch (error) {
      console.error("Token tidak valid");
      localStorage.removeItem("token");
    }
  }

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return { user, peran, logout };
};