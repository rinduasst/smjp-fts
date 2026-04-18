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
const getUserInfo = (user) => {
  if (!user) return "-";

  switch (user.peran) {
    case "TU_PRODI":
      return  " TU Program Studi";

    case "TU_FAKULTAS":
      return "TU Fakultas";

    case "ADMIN":
      return "Admin"; // 🔥 ini kunci

    default:
      return "-";
  }
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

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-semibold">
          {user?.nama?.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-800">
            {user?.nama || "User"}
          </p>

          <div className="flex items-center gap-2 mt-0.5">

            {/* Badge Role */}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
              {ROLE_LABEL[peran]?.title}
            </span>
            {/* <span className="text-xs text-gray-500">
              {getUserInfo(user)}
            </span> */}

          </div>
        </div>


        </div>
      </div>
    </header>
  );
}
