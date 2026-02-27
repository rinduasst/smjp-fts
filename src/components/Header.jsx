import { Bell, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const ROLE_LABEL = {
  ADMIN: {
    title: "Administrator",
    level: "Admin",
  },
  TU_FAKULTAS: {
    title: "Tata Usaha Fakultas",
    level: "TU Fakultas",
  },
  TU_PRODI: {
    title: "Tata Usaha Program Studi",
    level: "TU Prodi",
  },
};

export default function Header({ toggleSidebar }) {
  const { user, peran, logout } = useAuth();

  
  return (
    <header className="h-16 bg-white flex items-center justify-between px-5">
      
      {/* KIRI */}
      <button
        onClick={toggleSidebar}
        className="text-gray-600 hover:text-black"
      >
        ☰
      </button>

      {/* KANAN */}
      <div className="flex items-center gap-4">

        {/* NOTIF */}
        <button className="p-2 rounded hover:bg-gray-100 relative">
          <Bell size={18} />
        </button>

        {/* USER INFO + LOGOUT */}
        <div className="flex items-center gap-3 border-l pl-4">
          
          <div className="text-sm leading-tight">
            <p className="font-semibold">
              Halo, {ROLE_LABEL[peran]?.title || "User"}
            </p>
            <p className="text-xs text-gray-500">
              Level User: {ROLE_LABEL[peran]?.level || "-"}
            </p>
          </div>


          {/* <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded" title="Logout"
          >
            <LogOut size={16} />
           
          </button> */}

        </div>
      </div>
    </header>
  );
}
