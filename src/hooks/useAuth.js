import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  let user = null;
  let peran = null;

  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      user = decoded;
      peran = decoded.peran;
    } catch (error) {
      console.error("Token tidak valid");
    }
  }

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return { user, peran, logout };
};
