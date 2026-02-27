import { useState, useEffect,useMemo } from "react";
import { ChevronRight, ArrowRight, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { MENU_CONFIG } from "../config/menuConfig";
import { useAuth } from "../hooks/useAuth";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { peran: role, logout } = useAuth() || {};
  const [openMenu, setOpenMenu] = useState(null);
  const [active, setActive] = useState(null);

  if (!role) return null;

  const menus = useMemo(() => {
    return MENU_CONFIG
      .filter((menu) => menu.roles.includes(role))
      .map((menu) => ({
        ...menu,
        children: menu.children
          ? menu.children.filter((c) => c.roles.includes(role))
          : undefined,
      }));
  }, [role]); // cuma rerun kalau role berubah

  useEffect(() => {
    const currentPath = location.pathname.replace(/\/$/, "");
    for (const menu of menus) {
      if (menu.children) {
        const found = menu.children.find(
          (child) => child.path.replace(/\/$/, "") === currentPath
        );
        if (found) {
          setOpenMenu(menu.name);
          setActive(found.name);
          break;
        }
      } else if (menu.path.replace(/\/$/, "") === currentPath) {
        setOpenMenu(null);
        setActive(menu.name);
        break;
      }
    }
  }, [location.pathname, menus]);

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Anda akan keluar dari sistem. Apakah Anda yakin ingin melanjutkan?"
    );
  
    if (confirmLogout) {
      logout();
    }
  };
  

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 fixed flex flex-col">
      
      {/* ===== LOGO ===== */}
      <div className="h-16 px-6 border-b border-gray-200 flex flex-col justify-center">
      <h1 className="text-2xl font-extrabold tracking-wide text-center text-green-600 leading-tight">
        SMJP
      </h1>
      <p className="text-xs text-gray-500 leading-tight">
        Sistem Manajemen Jadwal Perkuliahan
      </p>
    </div>


      {/* ===== MENU ===== */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menus.map((item) => {
          const isOpen = openMenu === item.name;
          const Icon = item.icon;

          return (
            <div key={item.name}>
              
              {/* MENU UTAMA */}
              <button
                onClick={() =>
                  item.children
                    ? setOpenMenu(isOpen ? null : item.name)
                    : navigate(item.path)
                }
                className={`
                  w-full flex items-center justify-between px-4 py-2.5 rounded-md text-sm
                  transition-all
                  ${
                    isOpen
                      ? "bg-green-50 text-green-600 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={
                      isOpen ? "text-green-600" : "text-gray-500"
                    }
                  />
                  <span>{item.name}</span>
                </div>

                {item.children && (
                  <ChevronRight
                    size={14}
                    className={`transition-transform ${
                      isOpen
                        ? "rotate-90 text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                )}
              </button>

              {/* SUBMENU */}
              {item.children && (
              <div
              className={`
                ml-8 mt-1 space-y-1 overflow-hidden
                transition-all duration-300
                ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}
              `}
            >
              {item.children.map((sub) => (
               <button
               key={sub.name}
              onClick={() => {
              navigate(sub.path);
              setActive(sub.name);    // bikin hijau langsung saat klik
              setOpenMenu(item.name); // pastikan menu utama tetap terbuka
            }}
               className={`
                 group w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm
                 transition-all duration-200 ease-in-out
                 transform
                 ${
                   active === sub.name
                     ? "bg-green-100 text-green-700 font-medium scale-[1.02]"
                     : "text-gray-500 hover:bg-gray-100 hover:translate-x-1"
                 }
               `}
             >
               <ArrowRight
                 size={14}
                 className={`
                   transition-transform duration-200
                   ${active === sub.name ? "text-green-600" : "text-green-500 group-hover:translate-x-1"}
                 `}
               />
             
               <span>{sub.name}</span>
             </button>
              ))}             
            </div>
            
              )}

            </div>
          );
        })}
      </nav>
      {/*buat icon logout*/}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 
                    text-sm rounded-md
                    text-gray-600 hover:text-red-600 
                    hover:bg-red-50
                    transition-all duration-200"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;
