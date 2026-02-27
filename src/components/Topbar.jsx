import { Bell, LogOut, User } from "lucide-react";

function Topbar() {
  return (
    <div className="flex items-center justify-between bg-white px-6 py-3 shadow-sm border-b border-gray-200">
      {/* Kiri: Info admin */}
      <div>
        <h1 className="text-gray-800 font-semibold">Sistem Manajemen Jadwal Perkuliahan </h1>
        <p className="text-gray-500 text-sm">Selamat datang kembali!</p>
      </div>

      {/* Kanan: Profil & ikon */}
      <div className="flex items-center space-x-4">
        {/* Notifikasi */}
        <button className="text-gray-500 hover:text-gray-700">
          <Bell size={20} />
        </button>

        {/* Profil pengguna */}
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <p className="font-medium text-gray-800">Dekan</p>
            <p className="text-gray-500 text-sm">Admin Pusat</p>
          </div>

          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <User size={20} />
          </div>
        </div>

        {/* Logout */}
        <button className="text-gray-500 hover:text-gray-700">
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}

export default Topbar;
